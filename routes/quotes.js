const express = require('express');
const path = require('path');
const fs = require('fs');

// Export a function that accepts a database instance
module.exports = (db) => {
  const router = express.Router();

// Get all quotes
router.get('/', (req, res) => {
  try {
    const quotes = db.prepare('SELECT * FROM quotes ORDER BY created_at DESC').all();
    res.json(quotes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single quote with all related data
router.get('/:id', (req, res) => {
  try {
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    // Get filaments used in this quote
    const filaments = db.prepare('SELECT * FROM quote_filaments WHERE quote_id = ?').all(req.params.id);
    
    // Get hardware used in this quote
    const hardware = db.prepare('SELECT * FROM quote_hardware WHERE quote_id = ?').all(req.params.id);
    
    // Get print setup for this quote
    const printSetup = db.prepare('SELECT * FROM quote_print_setup WHERE quote_id = ?').get(req.params.id);
    
    // Get labour for this quote
    const labour = db.prepare('SELECT * FROM quote_labour WHERE quote_id = ?').get(req.params.id);
    
    // Combine all data
    const quoteData = {
      ...quote,
      filaments,
      hardware,
      print_setup: printSetup, // Use print_setup to match what the client expects
      labour
    };
    
    res.json(quoteData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new quote
router.post('/', (req, res) => {
  try {
    const {
      quote_number,
      title,
      customer_name,
      date,
      notes,
      markup_percent,
      discount_percent,
      total_cost,
      filaments,
      hardware,
      print_setup,
      labour
    } = req.body;
    
    // Validate required fields
    if (!quote_number || !customer_name) {
      return res.status(400).json({ error: 'Quote number and customer name are required' });
    }
    
    // Start a transaction
    db.transaction(() => {
      // Insert quote
      const quoteStmt = db.prepare(`
        INSERT INTO quotes (
          quote_number, title, customer_name, date, notes, 
          markup_percent, discount_percent, total_cost
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const quoteInfo = quoteStmt.run(
        quote_number,
        title || `${quote_number} - ${customer_name}`,
        customer_name,
        date,
        notes || null,
        markup_percent,
        discount_percent || 0,
        total_cost
      );
      
      const quoteId = quoteInfo.lastInsertRowid;
      
      // Insert filaments
      if (filaments && filaments.length > 0) {
        const filamentStmt = db.prepare(`
          INSERT INTO quote_filaments (
            quote_id, filament_id, filament_name, filament_price_per_gram,
            grams_used, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        filaments.forEach(filament => {
          filamentStmt.run(
            quoteId,
            filament.filament_id,
            filament.filament_name,
            filament.filament_price_per_gram,
            filament.grams_used,
            filament.total_cost
          );
        });
      }
      
      // Insert hardware
      if (hardware && hardware.length > 0) {
        const hardwareStmt = db.prepare(`
          INSERT INTO quote_hardware (
            quote_id, hardware_id, hardware_name, quantity,
            unit_price, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        hardware.forEach(item => {
          hardwareStmt.run(
            quoteId,
            item.hardware_id,
            item.hardware_name,
            item.quantity,
            item.unit_price,
            item.total_cost
          );
        });
      }
      
      // Insert print setup
      if (print_setup) {
        const printSetupStmt = db.prepare(`
          INSERT INTO quote_print_setup (
            quote_id, printer_id, printer_name, print_time,
            power_cost, depreciation_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        printSetupStmt.run(
          quoteId,
          print_setup.printer_id,
          print_setup.printer_name,
          print_setup.print_time,
          print_setup.power_cost,
          print_setup.depreciation_cost
        );
      }
      
      // Insert labour
      if (labour) {
        const labourStmt = db.prepare(`
          INSERT INTO quote_labour (
            quote_id, design_minutes, preparation_minutes,
            post_processing_minutes, other_minutes,
            labour_rate_per_hour, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        labourStmt.run(
          quoteId,
          labour.design_minutes,
          labour.preparation_minutes,
          labour.post_processing_minutes,
          labour.other_minutes,
          labour.labour_rate_per_hour,
          labour.total_cost
        );
      }
      
      // Return the new quote ID
      res.status(201).json({ id: quoteId });
    })();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update an existing quote
router.put('/:id', (req, res) => {
  try {
    const {
      title,
      customer_name,
      date,
      notes,
      markup_percent,
      discount_percent,
      total_cost,
      filaments,
      hardware,
      print_setup,
      labour
    } = req.body;
    
    // Validate required fields
    if (!customer_name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    
    // Check if quote exists
    const existingQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!existingQuote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    // Start a transaction
    db.transaction(() => {
      // Update quote
      const quoteStmt = db.prepare(`
        UPDATE quotes SET
          title = ?,
          customer_name = ?,
          date = ?,
          notes = ?,
          markup_percent = ?,
          discount_percent = ?,
          total_cost = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      quoteStmt.run(
        title || existingQuote.title,
        customer_name,
        date || existingQuote.date,
        notes,
        markup_percent,
        discount_percent || 0,
        total_cost,
        req.params.id
      );
      
      // Delete existing filaments
      db.prepare('DELETE FROM quote_filaments WHERE quote_id = ?').run(req.params.id);
      
      // Insert new filaments
      if (filaments && filaments.length > 0) {
        const filamentStmt = db.prepare(`
          INSERT INTO quote_filaments (
            quote_id, filament_id, filament_name, filament_price_per_gram,
            grams_used, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        filaments.forEach(filament => {
          filamentStmt.run(
            req.params.id,
            filament.filament_id,
            filament.filament_name,
            filament.filament_price_per_gram,
            filament.grams_used,
            filament.total_cost
          );
        });
      }
      
      // Delete existing hardware
      db.prepare('DELETE FROM quote_hardware WHERE quote_id = ?').run(req.params.id);
      
      // Insert new hardware
      if (hardware && hardware.length > 0) {
        const hardwareStmt = db.prepare(`
          INSERT INTO quote_hardware (
            quote_id, hardware_id, hardware_name, quantity,
            unit_price, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        hardware.forEach(item => {
          hardwareStmt.run(
            req.params.id,
            item.hardware_id,
            item.hardware_name,
            item.quantity,
            item.unit_price,
            item.total_cost
          );
        });
      }
      
      // Delete existing print setup
      db.prepare('DELETE FROM quote_print_setup WHERE quote_id = ?').run(req.params.id);
      
      // Insert new print setup
      if (print_setup) {
        const printSetupStmt = db.prepare(`
          INSERT INTO quote_print_setup (
            quote_id, printer_id, printer_name, print_time,
            power_cost, depreciation_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        printSetupStmt.run(
          req.params.id,
          print_setup.printer_id,
          print_setup.printer_name,
          print_setup.print_time,
          print_setup.power_cost,
          print_setup.depreciation_cost
        );
      }
      
      // Delete existing labour
      db.prepare('DELETE FROM quote_labour WHERE quote_id = ?').run(req.params.id);
      
      // Insert new labour
      if (labour) {
        const labourStmt = db.prepare(`
          INSERT INTO quote_labour (
            quote_id, design_minutes, preparation_minutes,
            post_processing_minutes, other_minutes,
            labour_rate_per_hour, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        labourStmt.run(
          req.params.id,
          labour.design_minutes,
          labour.preparation_minutes,
          labour.post_processing_minutes,
          labour.other_minutes,
          labour.labour_rate_per_hour,
          labour.total_cost
        );
      }
      
      res.json({ success: true });
    })();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a quote
router.delete('/:id', (req, res) => {
  try {
    // Check if quote exists
    const existingQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!existingQuote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    // Start a transaction
    db.transaction(() => {
      // Delete related data
      db.prepare('DELETE FROM quote_filaments WHERE quote_id = ?').run(req.params.id);
      db.prepare('DELETE FROM quote_hardware WHERE quote_id = ?').run(req.params.id);
      db.prepare('DELETE FROM quote_print_setup WHERE quote_id = ?').run(req.params.id);
      db.prepare('DELETE FROM quote_labour WHERE quote_id = ?').run(req.params.id);
      
      // Delete quote
      db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
      
      res.json({ success: true });
    })();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a quick quote
router.post('/quick', (req, res) => {
  try {
    const {
      quote_number,
      title,
      customer_name,
      date,
      notes,
      markup_percent,
      discount_percent,
      total_cost
    } = req.body;
    
    // Validate required fields
    if (!quote_number || !customer_name || !total_cost) {
      return res.status(400).json({ error: 'Quote number, customer name, and total cost are required' });
    }
    
    // Insert quote
    const quoteStmt = db.prepare(`
      INSERT INTO quotes (
        quote_number, title, customer_name, date, notes, 
        markup_percent, discount_percent, total_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const quoteInfo = quoteStmt.run(
      quote_number,
      title || `${quote_number} - ${customer_name}`,
      customer_name,
      date,
      notes || null,
      markup_percent || 0,
      discount_percent || 0,
      total_cost
    );
    
    const quoteId = quoteInfo.lastInsertRowid;
    
    // Return the new quote ID
    res.status(201).json({ id: quoteId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});




  // Generate an HTML invoice for a quote (internal or client)
  router.get('/:id/invoice/:type', (req, res) => {
    try {
      const { id, type } = req.params;

      if (type !== 'internal' && type !== 'client') {
        return res.status(400).json({ error: 'Invalid invoice type. Must be "internal" or "client"' });
      }

      // Fetch quote data
      const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id);
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Fetch related data
      const filaments = db.prepare('SELECT * FROM quote_filaments WHERE quote_id = ?').all(id);
      const hardware = db.prepare('SELECT * FROM quote_hardware WHERE quote_id = ?').all(id);
      const printSetup = db.prepare('SELECT * FROM quote_print_setup WHERE quote_id = ?').get(id);
      const labour = db.prepare('SELECT * FROM quote_labour WHERE quote_id = ?').get(id);

      // Get settings
      const currencySymbol = db.prepare('SELECT value FROM settings WHERE key = ?').get('currency_symbol')?.value || '£';
      const companyName = db.prepare('SELECT value FROM settings WHERE key = ?').get('company_name')?.value || 'Prints Inc';
      const taxRate = parseFloat(db.prepare('SELECT value FROM settings WHERE key = ?').get('tax_rate')?.value || '0');
      const labourRateSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('labour_rate_per_hour');
      const globalLabourRate = labourRateSetting ? parseFloat(labourRateSetting.value) : 0;
      const accentColorSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('accent_color');
      const accentColor = accentColorSetting ? accentColorSetting.value : '#E53935';

      // Helper function to format currency
      const formatCurrency = (value) => {
        return `${currencySymbol}${Number(value).toFixed(2)}`;
      };

      // Helper function to format time from minutes to Xh Ym string
      const formatTime = (minutes) => {
        if (minutes === null || minutes === undefined) return '0h 0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
      };

      let html = '';

      // --- HTML Generation Logic --- 
      if (type === 'client') {
        // Calculate totals for client invoice
        const filamentTotal = filaments.reduce((sum, item) => sum + item.total_cost, 0);
        const hardwareTotal = hardware.reduce((sum, item) => sum + item.total_cost, 0);
        const printSetupCosts = printSetup ? (printSetup.power_cost + printSetup.depreciation_cost) : 0;
        const labourTotalCost = labour ? labour.total_cost : 0;

        const subtotalPreMarkup = filamentTotal + hardwareTotal + printSetupCosts + labourTotalCost;
        const markupAmount = subtotalPreMarkup * (quote.markup_percent / 100);
        const subtotalPostMarkup = subtotalPreMarkup + markupAmount;
        const discountAmount = quote.discount_percent ? (subtotalPostMarkup * (quote.discount_percent / 100)) : 0;
        const afterDiscount = subtotalPostMarkup - discountAmount;
        const taxAmount = taxRate > 0 ? (afterDiscount * (taxRate / 100)) : 0;
        const finalTotal = afterDiscount + taxAmount;

        html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice - ${quote.quote_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; color: #333; }
              .invoice-container { max-width: 800px; margin: 20px auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
              .header { text-align: left; margin-bottom: 20px; }
              .header h1 { margin: 0; font-size: 2em; color: #333; }
              .header h2 { margin: 0; font-size: 1.2em; color: #555; }
              .blue-divider { height: 2px; background-color: ${accentColor}; margin: 20px 0; }
              .info-section table { width: 100%; border-collapse: collapse; }
              .info-section td { padding: 5px 0; font-size: 0.9em; }
              .description-section table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              .description-section th { background-color: ${accentColor}25; color: #333; font-size: 1.2em; padding: 10px; text-align: left; border: 1px solid ${accentColor}50; }
              .description-section td { padding: 8px 10px; border: 1px solid ${accentColor}50; font-size: 0.9em; }
              .pricing-section { text-align: right; margin-top: 20px; }
              .pricing-section p { margin: 5px 0; font-size: 1em; }
              .pricing-section .total { font-size: 1.2em; font-weight: bold; }
              .print-button { position: fixed; top: 20px; right: 20px; padding: 10px 15px; background-color: ${accentColor}; color: white; border: none; border-radius: 5px; cursor: pointer; z-index: 1000; font-family: Arial, sans-serif; font-size: 14px; display: block !important; }
              
              @page { margin: 1cm; } /* Removed size: auto */

              @media print {
                html, body { background-color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } /* Removed padding/margin 0 for body */
                .invoice-container { 
                  box-shadow: none !important; 
                  margin: 0 auto !important; 
                  padding: 0 !important;
                  border-radius: 0 !important;
                  border: none !important; 
                  width: 100% !important; 
                  max-width: 100% !important;
                }
                .print-button { display: none !important; }
                .blue-divider { background-color: ${accentColor} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                /* Table border fix for client invoice */
                .description-section table { border-collapse: separate !important; border-spacing: 0 !important; width: 100% !important; }
                .description-section th, .description-section td { border: 1px solid ${accentColor}50 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .description-section th { background-color: ${accentColor}25 !important; color: #333 !important; /* Ensure background prints */ }
              }
            </style>
          </head>
          <body>
            <button class="print-button" onclick="window.print()">Print/Save as PDF</button>
            <div class="invoice-container">
              <div class="header">
                <h1>${companyName} - Invoice</h1>
                <h2>Quote #: ${quote.quote_number}</h2>
              </div>
              <div class="blue-divider"></div>
              <div class="info-section">
                <table>
                  <tr>
                    <td><strong>Customer:</strong> ${quote.customer_name}</td>
                    <td style="text-align: right;"><strong>Date:</strong> ${new Date(quote.date).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Model:</strong> ${quote.title}</td>
                  </tr>
                </table>
              </div>
              <div class="blue-divider"></div>
              <div class="description-section">
                <table>
                  <thead>
                    <tr><th>Description</th></tr>
                  </thead>
                  <tbody>
                    ${printSetup ? `<tr><td>Print Duration - ${(printSetup.print_time / 60).toFixed(2)} hours</td></tr>` : ''}
                    ${filaments.map(f => `<tr><td>${f.filament_name} - ${f.grams_used.toFixed(2)}g</td></tr>`).join('')}
                    ${hardware.map(h => `<tr><td>${h.hardware_name}</td></tr>`).join('')}
                    ${(labour && (labour.design_minutes > 0 || labour.preparation_minutes > 0 || labour.post_processing_minutes > 0 || labour.other_minutes > 0)) ? '<tr><td>Labour</td></tr>' : ''}
                  </tbody>
                </table>
              </div>
              <div class="blue-divider"></div>
              <div class="pricing-section">
                ${quote.discount_percent && quote.discount_percent > 0 ? 
                  `<p>Subtotal: ${formatCurrency(subtotalPostMarkup)}</p>
                   <p>Discount (${quote.discount_percent}%): -${formatCurrency(discountAmount)}</p>` : ''}
                ${taxRate > 0 ? 
                  `<p>Tax (${taxRate}%): ${formatCurrency(taxAmount)}</p>` : ''}
                <p class="total">Total: ${formatCurrency(finalTotal)}</p>
              </div>
            </div>
          </body>
          </html>
        `;
      } else if (type === 'internal') {
        // --- Internal Invoice HTML Generation Logic ---
        const filamentTotal = filaments.reduce((sum, item) => sum + item.total_cost, 0);
        const hardwareTotal = hardware.reduce((sum, item) => sum + item.total_cost, 0);
        const printSetupCosts = printSetup ? (printSetup.power_cost + printSetup.depreciation_cost) : 0;
        const labourTotalCost = labour ? labour.total_cost : 0;

        const subtotalPreMarkup = filamentTotal + hardwareTotal + printSetupCosts + labourTotalCost;
        const markupAmount = subtotalPreMarkup * (quote.markup_percent / 100);
        const subtotalPostMarkup = subtotalPreMarkup + markupAmount;
        const discountAmount = quote.discount_percent ? (subtotalPostMarkup * (quote.discount_percent / 100)) : 0;
        const afterDiscount = subtotalPostMarkup - discountAmount;
        const taxAmount = taxRate > 0 ? (afterDiscount * (taxRate / 100)) : 0;
        const finalTotal = afterDiscount + taxAmount;

        html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Internal Invoice - ${quote.quote_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; color: #333; }
              .invoice-container { max-width: 800px; margin: 20px auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 5px; } 
              .header h1 { margin: 0; font-size: 1.8em; color: #333; } 
              .header h2 { margin: 0; font-size: 1.1em; color: #555; } 
              .blue-divider { height: 2px; background-color: ${accentColor}; margin: 5px 0; } 
              .info-section table, .costs-section table, .summary-section table { width: 100%; border-collapse: collapse; margin-bottom: 12px; } 
              .info-section td, .summary-section td { padding: 2px 0; font-size: 0.8em; } 
              .costs-section th { background-color: ${accentColor}25; color: #333; font-size: 1.0em; padding: 8px; text-align: left; border: 1px solid ${accentColor}50; }
              .costs-section td { padding: 6px 8px; font-size: 0.8em; border: 1px solid ${accentColor}50; } 
              .costs-section .sub-header td { background-color: ${accentColor}10; font-weight: bold; padding: 6px 8px; border: 1px solid ${accentColor}50; font-size: 0.9em; } 
              .summary-section { text-align: right; margin-top: 5px; } 
              .summary-section p { margin: 4px 0; font-size: 0.9em; } 
              .summary-section .total { font-size: 1.1em; font-weight: bold; } 
              .print-button { position: fixed; top: 20px; right: 20px; padding: 10px 15px; background-color: ${accentColor}; color: white; border: none; border-radius: 5px; cursor: pointer; z-index: 1000; font-family: Arial, sans-serif; font-size: 14px; display: block !important; }

              @page { margin: 1cm; } /* Removed size: auto */

              @media print {
                html, body { background-color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } /* Removed padding/margin 0 for body here, handled by invoice-container */
                .invoice-container { 
                  box-shadow: none !important; 
                  margin: 0 auto !important; /* Or margin: 0 !important; if full bleed is desired */
                  padding: 0 !important;
                  border-radius: 0 !important;
                  border: none !important; 
                  width: 100% !important; 
                  max-width: 100% !important;
                }
                .print-button { display: none !important; }
                .blue-divider { background-color: ${accentColor} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .costs-section table { border-collapse: separate !important; border-spacing: 0 !important; width: 100% !important; }
                .costs-section th, .costs-section td { border: 1px solid ${accentColor}50 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .costs-section th { background-color: ${accentColor}25 !important; color: #333 !important; /* Ensure background prints */ }
                .costs-section .sub-header td { border: 1px solid ${accentColor}50 !important; background-color: ${accentColor}10 !important; color: #333 !important; /* Ensure background prints */ }
              }
            </style>
          </head>
          <body>
            <button class="print-button" onclick="window.print()">Print/Save as PDF</button>
            <div class="invoice-container">
              <div class="header">
                <h1>${companyName} - Internal Invoice</h1>
                <h2>Quote #: ${quote.quote_number}</h2>
              </div>
              <div class="blue-divider"></div>
              <div class="info-section">
                <table>
                  <tr>
                    <td><strong>Customer:</strong> ${quote.customer_name}</td>
                    <td style="text-align: right;"><strong>Date:</strong> ${new Date(quote.date).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Model:</strong> ${quote.title}</td>
                  </tr>
                </table>
              </div>
              
              <div class="costs-section">
                <h3>Detailed Costs</h3>
                
                ${filaments.length > 0 ? `
                <table>
                  <tr class="sub-header"><td colspan="3">Filament Costs</td></tr>
                  <tr><th>Name</th><th>Grams</th><th>Total</th></tr>
                  ${filaments.map(f => `
                    <tr>
                      <td>${f.filament_name}</td>
                      <td>${f.grams_used.toFixed(2)}g</td>
                      <td>${formatCurrency(f.total_cost)}</td>
                    </tr>
                  `).join('')}
                  <tr><td colspan="2" style="text-align:right; font-weight:bold;">Filament Subtotal:</td><td>${formatCurrency(filamentTotal)}</td></tr>
                </table>` : ''}

                ${hardware.length > 0 ? `
                <table>
                  <tr class="sub-header"><td colspan="3">Hardware Costs</td></tr>
                  <tr><th>Name</th><th>Quantity</th><th>Total</th></tr>
                  ${hardware.map(h => `
                    <tr>
                      <td>${h.hardware_name}</td>
                      <td>${h.quantity}</td>
                      <td>${formatCurrency(h.total_cost)}</td>
                    </tr>
                  `).join('')}
                  <tr><td colspan="2" style="text-align:right; font-weight:bold;">Hardware Subtotal:</td><td>${formatCurrency(hardwareTotal)}</td></tr>
                </table>` : ''}

                ${printSetup ? `
                <table>
                  <tr class="sub-header"><td colspan="2">Print Setup Costs - Print Time ${formatTime(printSetup.print_time)}</td></tr>
                  <tr><th>Name</th><th>Total</th></tr>
                  <tr><td>Power Cost</td><td>${formatCurrency(printSetup.power_cost)}</td></tr>
                  <tr><td>Machine Depreciation</td><td>${formatCurrency(printSetup.depreciation_cost)}</td></tr>
                  <tr><td style="text-align:right; font-weight:bold;">Print Setup Subtotal:</td><td>${formatCurrency(printSetupCosts)}</td></tr>
                </table>` : ''}

                ${labour ? `
                <table>
                  <tr class="sub-header"><td colspan="3">Labour Costs</td></tr>
                  <tr><th>Activity</th><th>Time</th><th>Total</th></tr>
                  ${labour.design_minutes > 0 ? `<tr><td>Design</td><td>${formatTime(labour.design_minutes)}</td><td>${formatCurrency(((labour.design_minutes || 0) / 60) * globalLabourRate)}</td></tr>` : ''}
                  ${labour.preparation_minutes > 0 ? `<tr><td>Preparation</td><td>${formatTime(labour.preparation_minutes)}</td><td>${formatCurrency(((labour.preparation_minutes || 0) / 60) * globalLabourRate)}</td></tr>` : ''}
                  ${labour.post_processing_minutes > 0 ? `<tr><td>Post-Processing</td><td>${formatTime(labour.post_processing_minutes)}</td><td>${formatCurrency(((labour.post_processing_minutes || 0) / 60) * globalLabourRate)}</td></tr>` : ''}
                  ${labour.other_minutes > 0 ? `<tr><td>Other</td><td>${formatTime(labour.other_minutes)}</td><td>${formatCurrency(((labour.other_minutes || 0) / 60) * globalLabourRate)}</td></tr>` : ''}
                  <tr><td colspan="2" style="text-align:right; font-weight:bold;">Labour Subtotal:</td><td>${formatCurrency(labourTotalCost)}</td></tr>
                </table>` : ''}
              </div>

              <div class="blue-divider"></div>
              <div class="summary-section">
                <p>Subtotal (Before Markup): ${formatCurrency(subtotalPreMarkup)}</p>
                <p>Markup (${quote.markup_percent}%): +${formatCurrency(markupAmount)}</p>
                <p>Subtotal (After Markup): ${formatCurrency(subtotalPostMarkup)}</p>
                ${quote.discount_percent && quote.discount_percent > 0 ? 
                  `<p>Discount (${quote.discount_percent}%): -${formatCurrency(discountAmount)}</p>` : ''}
                ${quote.discount_percent && quote.discount_percent > 0 ? 
                  `<p>After Discount: ${formatCurrency(afterDiscount)}</p>` : ''}
                ${taxRate > 0 ? 
                  `<p>Tax (${taxRate}%): +${formatCurrency(taxAmount)}</p>` : ''}
                <p class="total">Final Total: ${formatCurrency(finalTotal)}</p>
              </div>

            </div>
          </body>
          </html>
        `;
      }

      
      res.send(html);

    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).json({ error: 'Server error while generating invoice' });
    }
  });

  return router;
};
