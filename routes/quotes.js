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
      printSetup,
      labour
    };
    
    res.json(quoteData);
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
      total_cost,
      is_quick_quote,
      filaments,
      hardware,
      printSetup,
      labour
    } = req.body;
    
    // Validate required fields
    if (!customer_name || !date || markup_percent === undefined || total_cost === undefined) {
      return res.status(400).json({ error: 'Please provide all required fields' });
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
          total_cost = ?,
          is_quick_quote = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      quoteStmt.run(
        title || existingQuote.title,
        customer_name,
        date,
        notes || null,
        markup_percent,
        total_cost,
        is_quick_quote || 0,
        req.params.id
      );
      
      // Delete existing related data
      db.prepare('DELETE FROM quote_filaments WHERE quote_id = ?').run(req.params.id);
      db.prepare('DELETE FROM quote_hardware WHERE quote_id = ?').run(req.params.id);
      db.prepare('DELETE FROM quote_print_setup WHERE quote_id = ?').run(req.params.id);
      db.prepare('DELETE FROM quote_labour WHERE quote_id = ?').run(req.params.id);
      
      // Re-insert filaments
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
      
      // Re-insert hardware
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
      
      // Re-insert print setup
      if (printSetup) {
        const printSetupStmt = db.prepare(`
          INSERT INTO quote_print_setup (
            quote_id, printer_id, printer_name, print_time,
            power_cost, depreciation_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        printSetupStmt.run(
          req.params.id,
          printSetup.printer_id,
          printSetup.printer_name,
          printSetup.print_time,
          printSetup.power_cost,
          printSetup.depreciation_cost
        );
      }
      
      // Re-insert labour
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
    })();
    
    // Get updated quote with all related data
    const updatedQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    const updatedFilaments = db.prepare('SELECT * FROM quote_filaments WHERE quote_id = ?').all(req.params.id);
    const updatedHardware = db.prepare('SELECT * FROM quote_hardware WHERE quote_id = ?').all(req.params.id);
    const updatedPrintSetup = db.prepare('SELECT * FROM quote_print_setup WHERE quote_id = ?').get(req.params.id);
    const updatedLabour = db.prepare('SELECT * FROM quote_labour WHERE quote_id = ?').get(req.params.id);
    
    // Combine all data
    const quoteData = {
      ...updatedQuote,
      filaments: updatedFilaments,
      hardware: updatedHardware,
      printSetup: updatedPrintSetup,
      labour: updatedLabour
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
      total_cost,
      is_quick_quote,
      filaments,
      hardware,
      printSetup,
      labour
    } = req.body;
    
    // Validate required fields
    if (!quote_number || !customer_name || !date || markup_percent === undefined || total_cost === undefined) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }
    
    // Start a transaction
    db.transaction(() => {
      // Insert quote
      const quoteStmt = db.prepare(`
        INSERT INTO quotes (
          quote_number, title, customer_name, date, notes, 
          markup_percent, total_cost, is_quick_quote
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const quoteInfo = quoteStmt.run(
        quote_number,
        title || `${quote_number} - ${customer_name}`,
        customer_name,
        date,
        notes || null,
        markup_percent,
        total_cost,
        is_quick_quote || 0
      );
      
      const quoteId = quoteInfo.lastInsertRowid;
      
      // Insert filaments if provided
      if (filaments && filaments.length > 0) {
        const filamentStmt = db.prepare(`
          INSERT INTO quote_filaments (
            quote_id, filament_id, filament_name, 
            filament_price_per_gram, grams_used, total_cost
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
      
      // Insert hardware if provided
      if (hardware && hardware.length > 0) {
        const hardwareStmt = db.prepare(`
          INSERT INTO quote_hardware (
            quote_id, hardware_id, hardware_name, 
            quantity, unit_price, total_cost
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
      
      // Insert print setup if provided
      if (printSetup) {
        const printSetupStmt = db.prepare(`
          INSERT INTO quote_print_setup (
            quote_id, printer_id, printer_name, 
            print_time, power_cost, depreciation_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        printSetupStmt.run(
          quoteId,
          printSetup.printer_id,
          printSetup.printer_name,
          printSetup.print_time,
          printSetup.power_cost,
          printSetup.depreciation_cost
        );
      }
      
      // Insert labour if provided
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
          labour.design_minutes || 0,
          labour.preparation_minutes || 5,
          labour.post_processing_minutes || 5,
          labour.other_minutes || 0,
          labour.labour_rate_per_hour,
          labour.total_cost
        );
      }
      
      // Get the created quote with all related data
      const createdQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(quoteId);
      const createdFilaments = db.prepare('SELECT * FROM quote_filaments WHERE quote_id = ?').all(quoteId);
      const createdHardware = db.prepare('SELECT * FROM quote_hardware WHERE quote_id = ?').all(quoteId);
      const createdPrintSetup = db.prepare('SELECT * FROM quote_print_setup WHERE quote_id = ?').get(quoteId);
      const createdLabour = db.prepare('SELECT * FROM quote_labour WHERE quote_id = ?').get(quoteId);
      
      res.status(201).json({
        ...createdQuote,
        filaments: createdFilaments,
        hardware: createdHardware,
        printSetup: createdPrintSetup,
        labour: createdLabour
      });
    })();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Duplicate a quote
router.post('/:id/duplicate', (req, res) => {
  try {
    const quoteId = req.params.id;
    
    // Check if quote exists
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(quoteId);
    
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    // Get next quote number
    const nextNumberSetting = db.prepare('SELECT value FROM settings WHERE key = "next_quote_number"').get();
    const prefixSetting = db.prepare('SELECT value FROM settings WHERE key = "quote_prefix"').get();
    
    const nextNumber = parseInt(nextNumberSetting.value);
    const prefix = prefixSetting ? prefixSetting.value : '3DQ';
    
    // Format the quote number with leading zeros
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    const newQuoteNumber = `${prefix}${formattedNumber}`;
    
    // Increment the quote number
    db.prepare('UPDATE settings SET value = ? WHERE key = "next_quote_number"')
      .run((nextNumber + 1).toString());
    
    // Start a transaction
    db.transaction(() => {
      // Insert new quote
      const quoteStmt = db.prepare(`
        INSERT INTO quotes (
          quote_number, title, customer_name, date, notes, 
          markup_percent, total_cost, is_quick_quote
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const currentDate = new Date().toISOString().split('T')[0];
      
      const quoteInfo = quoteStmt.run(
        newQuoteNumber,
        `${newQuoteNumber} - ${quote.customer_name} (Copy)`,
        quote.customer_name,
        currentDate,
        quote.notes,
        quote.markup_percent,
        quote.total_cost,
        quote.is_quick_quote
      );
      
      const newQuoteId = quoteInfo.lastInsertRowid;
      
      // Copy filaments
      const filaments = db.prepare('SELECT * FROM quote_filaments WHERE quote_id = ?').all(quoteId);
      
      if (filaments.length > 0) {
        const filamentStmt = db.prepare(`
          INSERT INTO quote_filaments (
            quote_id, filament_id, filament_name, 
            filament_price_per_gram, grams_used, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        filaments.forEach(filament => {
          filamentStmt.run(
            newQuoteId,
            filament.filament_id,
            filament.filament_name,
            filament.filament_price_per_gram,
            filament.grams_used,
            filament.total_cost
          );
        });
      }
      
      // Copy hardware
      const hardware = db.prepare('SELECT * FROM quote_hardware WHERE quote_id = ?').all(quoteId);
      
      if (hardware.length > 0) {
        const hardwareStmt = db.prepare(`
          INSERT INTO quote_hardware (
            quote_id, hardware_id, hardware_name, 
            quantity, unit_price, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        hardware.forEach(item => {
          hardwareStmt.run(
            newQuoteId,
            item.hardware_id,
            item.hardware_name,
            item.quantity,
            item.unit_price,
            item.total_cost
          );
        });
      }
      
      // Copy print setup
      const printSetup = db.prepare('SELECT * FROM quote_print_setup WHERE quote_id = ?').get(quoteId);
      
      if (printSetup) {
        const printSetupStmt = db.prepare(`
          INSERT INTO quote_print_setup (
            quote_id, printer_id, printer_name, 
            print_time, power_cost, depreciation_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        printSetupStmt.run(
          newQuoteId,
          printSetup.printer_id,
          printSetup.printer_name,
          printSetup.print_time,
          printSetup.power_cost,
          printSetup.depreciation_cost
        );
      }
      
      // Copy labour
      const labour = db.prepare('SELECT * FROM quote_labour WHERE quote_id = ?').get(quoteId);
      
      if (labour) {
        const labourStmt = db.prepare(`
          INSERT INTO quote_labour (
            quote_id, design_minutes, preparation_minutes, 
            post_processing_minutes, other_minutes, 
            labour_rate_per_hour, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        labourStmt.run(
          newQuoteId,
          labour.design_minutes,
          labour.preparation_minutes,
          labour.post_processing_minutes,
          labour.other_minutes,
          labour.labour_rate_per_hour,
          labour.total_cost
        );
      }
      
      // Get the created quote with all related data
      const createdQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(newQuoteId);
      const createdFilaments = db.prepare('SELECT * FROM quote_filaments WHERE quote_id = ?').all(newQuoteId);
      const createdHardware = db.prepare('SELECT * FROM quote_hardware WHERE quote_id = ?').all(newQuoteId);
      const createdPrintSetup = db.prepare('SELECT * FROM quote_print_setup WHERE quote_id = ?').get(newQuoteId);
      const createdLabour = db.prepare('SELECT * FROM quote_labour WHERE quote_id = ?').get(newQuoteId);
      
      res.status(201).json({
        ...createdQuote,
        filaments: createdFilaments,
        hardware: createdHardware,
        printSetup: createdPrintSetup,
        labour: createdLabour
      });
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
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    // Start a transaction
    db.transaction(() => {
      // Delete related data first (foreign key constraints will handle this automatically)
      db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
    })();
    
    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate HTML invoice for a quote
router.get('/:id/invoice/:type', (req, res) => {
  try {
    const quoteId = req.params.id;
    const invoiceType = req.params.type; // 'internal' or 'client'
    
    if (invoiceType !== 'internal' && invoiceType !== 'client') {
      return res.status(400).json({ error: 'Invalid invoice type. Must be "internal" or "client"' });
    }
    
    // Get quote with all related data
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(quoteId);
    
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    const filaments = db.prepare('SELECT * FROM quote_filaments WHERE quote_id = ?').all(quoteId);
    const hardware = db.prepare('SELECT * FROM quote_hardware WHERE quote_id = ?').all(quoteId);
    const printSetup = db.prepare('SELECT * FROM quote_print_setup WHERE quote_id = ?').get(quoteId);
    const labour = db.prepare('SELECT * FROM quote_labour WHERE quote_id = ?').get(quoteId);
    
    // Get currency symbol and company name from settings
    let currency = '£'; // Default currency symbol (£)
    let companyName = 'Prints Inc'; // Default company name
    try {
      const currencySetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('currency_symbol');
      if (currencySetting && currencySetting.value) {
        currency = currencySetting.value;
      }
      
      const companyNameSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('company_name');
      if (companyNameSetting && companyNameSetting.value) {
        companyName = companyNameSetting.value;
      }
    } catch (error) {
      console.warn('Could not get settings, using defaults:', error);
    }
    
    // Generate HTML for invoice
    let html = '';
    
    if (invoiceType === 'internal') {
      // Internal invoice with detailed breakdown
      html = generateInternalInvoiceHtml(quote, filaments, hardware, printSetup, labour, currency, companyName);
    } else {
      // Client invoice with simplified view
      html = generateClientInvoiceHtml(quote, filaments, hardware, printSetup, labour, currency, companyName);
    }
    
    // Instead of generating a PDF, just return the HTML directly
    // This avoids the issues with the PDF generation library
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to generate internal invoice HTML
function generateInternalInvoiceHtml(quote, filaments, hardware, printSetup, labour, currency, companyName) {
  // Calculate totals
  const filamentTotal = filaments.reduce((sum, f) => sum + f.total_cost, 0);
  const hardwareTotal = hardware.reduce((sum, h) => sum + h.total_cost, 0);
  const powerCost = printSetup ? printSetup.power_cost : 0;
  const depreciationCost = printSetup ? printSetup.depreciation_cost : 0;
  const labourCost = labour ? labour.total_cost : 0;
  
  // Format for 2 decimal places
  const formatCost = (cost) => Number(cost).toFixed(2);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Internal Invoice - ${quote.title}</title>
      <style>
        @media print {
          .no-print { display: none !important; }
          @page { margin: 1.5cm; }
        }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          color: #333; 
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .container {
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .invoice-header { 
          text-align: center; 
          margin-bottom: 30px; 
          padding-bottom: 20px;
          border-bottom: 2px solid #3498db;
        }
        .invoice-header h1 {
          color: #3498db;
          margin-bottom: 5px;
        }
        .invoice-details { 
          margin-bottom: 30px; 
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 30px; 
          border-radius: 4px;
          overflow: hidden;
        }
        th, td { 
          padding: 12px 15px; 
          text-align: left; 
          border-bottom: 1px solid #eee; 
        }
        th { 
          background-color: #3498db; 
          color: white;
          font-weight: 500;
        }
        tr:nth-child(even) { background-color: #f8f8f8; }
        tr:hover { background-color: #f1f1f1; }
        .total-row { 
          font-weight: bold; 
          background-color: #f0f7ff !important;
        }
        .total-row td {
          border-top: 2px solid #3498db;
        }
        .section-title { 
          margin-top: 30px; 
          margin-bottom: 15px; 
          color: #3498db;
          border-left: 4px solid #3498db;
          padding-left: 10px;
        }
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #3498db;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }
        .print-button:hover {
          background-color: #2980b9;
        }
        .cost-summary {
          background-color: #f0f7ff;
          border-radius: 4px;
          padding: 20px;
          border-left: 4px solid #3498db;
        }
      </style>
    </head>
    <body>
      <button onclick="window.print()" class="print-button no-print">Print Invoice</button>
      <div class="container">
      <div class="invoice-header">
        <h1>${companyName} - Internal Invoice</h1>
        <h2>${quote.title}</h2>
      </div>
      
      <div class="invoice-details">
        <p><strong>Quote Number:</strong> ${quote.quote_number}</p>
        <p><strong>Customer:</strong> ${quote.customer_name}</p>
        <p><strong>Date:</strong> ${quote.date}</p>
        ${quote.notes ? `<p><strong>Notes:</strong> ${quote.notes}</p>` : ''}
      </div>
      
      <h3 class="section-title">Filament Usage</h3>
      <table>
        <thead>
          <tr>
            <th>Material</th>
            <th>Weight (g)</th>
            <th>Price per gram</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          ${filaments.map(f => `
            <tr>
              <td>${f.filament_name}</td>
              <td>${f.grams_used}</td>
              <td>${currency}${formatCost(f.filament_price_per_gram)}</td>
              <td>${currency}${formatCost(f.total_cost)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="3">Total Filament Cost</td>
            <td>${currency}${formatCost(filamentTotal)}</td>
          </tr>
        </tbody>
      </table>
      
      ${hardware.length > 0 ? `
        <h3 class="section-title">Hardware</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            ${hardware.map(h => `
              <tr>
                <td>${h.hardware_name}</td>
                <td>${h.quantity}</td>
                <td>${currency}${formatCost(h.unit_price)}</td>
                <td>${currency}${formatCost(h.total_cost)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3">Total Hardware Cost</td>
              <td>${currency}${formatCost(hardwareTotal)}</td>
            </tr>
          </tbody>
        </table>
      ` : ''}
      
      ${printSetup ? `
        <h3 class="section-title">Print Setup</h3>
        <table>
          <thead>
            <tr>
              <th>Printer</th>
              <th>Print Time (h)</th>
              <th>Power Cost</th>
              <th>Depreciation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${printSetup.printer_name}</td>
              <td>${printSetup.print_time}</td>
              <td>${currency}${formatCost(printSetup.power_cost)}</td>
              <td>${currency}${formatCost(printSetup.depreciation_cost)}</td>
            </tr>
          </tbody>
        </table>
      ` : ''}
      
      ${labour ? `
        <h3 class="section-title">Labour</h3>
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Time (min)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Design</td>
              <td>${labour.design_minutes}</td>
            </tr>
            <tr>
              <td>Preparation</td>
              <td>${labour.preparation_minutes}</td>
            </tr>
            <tr>
              <td>Post Processing</td>
              <td>${labour.post_processing_minutes}</td>
            </tr>
            <tr>
              <td>Other</td>
              <td>${labour.other_minutes}</td>
            </tr>
            <tr>
              <td>Labour Rate</td>
              <td>${currency}${formatCost(labour.labour_rate_per_hour)} per hour</td>
            </tr>
            <tr class="total-row">
              <td>Total Labour Cost</td>
              <td>${currency}${formatCost(labour.total_cost)}</td>
            </tr>
          </tbody>
        </table>
      ` : ''}
      
      <h3 class="section-title">Cost Summary</h3>
      <div class="cost-summary">
        <table>
          <tbody>
            <tr>
              <td>Filament Cost</td>
              <td>${currency}${formatCost(filamentTotal)}</td>
            </tr>
            <tr>
              <td>Hardware Cost</td>
              <td>${currency}${formatCost(hardwareTotal)}</td>
            </tr>
            <tr>
              <td>Power Cost</td>
              <td>${currency}${formatCost(powerCost)}</td>
            </tr>
            <tr>
              <td>Depreciation</td>
              <td>${currency}${formatCost(depreciationCost)}</td>
            </tr>
            <tr>
              <td>Labour Cost</td>
              <td>${currency}${formatCost(labourCost)}</td>
            </tr>
            <tr>
              <td>Subtotal</td>
              <td>${currency}${formatCost(filamentTotal + hardwareTotal + powerCost + depreciationCost + labourCost)}</td>
            </tr>
            <tr>
              <td>Markup (${quote.markup_percent}%)</td>
              <td>${currency}${formatCost((filamentTotal + hardwareTotal + powerCost + depreciationCost + labourCost) * (quote.markup_percent / 100))}</td>
            </tr>
            <tr class="total-row">
              <td>Total</td>
              <td>${currency}${formatCost(quote.total_cost)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 50px; text-align: center; color: #777; padding-top: 20px; border-top: 1px solid #eee;">
        <p>This is an internal invoice generated by ${companyName}</p>
      </div>
    </div> <!-- End of container -->
    </body>
    </html>
  `;
}

// Helper function to generate client invoice HTML
function generateClientInvoiceHtml(quote, filaments, hardware, printSetup, labour, currency, companyName) {
  // Calculate totals
  const filamentTotal = filaments.reduce((sum, f) => sum + f.total_cost, 0);
  const hardwareTotal = hardware.reduce((sum, h) => sum + h.total_cost, 0);
  const powerCost = printSetup ? printSetup.power_cost : 0;
  const depreciationCost = printSetup ? printSetup.depreciation_cost : 0;
  const labourCost = labour ? labour.total_cost : 0;
  
  // Combined costs for client view
  const printingCost = filamentTotal + powerCost + depreciationCost;
  const designHandlingCost = labourCost;
  
  // Format for 2 decimal places
  const formatCost = (cost) => Number(cost).toFixed(2);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${quote.title}</title>
      <style>
        @media print {
          .no-print { display: none !important; }
          @page { margin: 1.5cm; }
        }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          color: #333; 
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .container {
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .invoice-header { 
          text-align: center; 
          margin-bottom: 40px; 
          padding-bottom: 20px;
          border-bottom: 2px solid #3498db;
        }
        .invoice-header h1 {
          color: #3498db;
          margin-bottom: 5px;
          font-size: 32px;
        }
        .invoice-header h2 {
          font-size: 24px;
          color: #555;
          margin-top: 5px;
        }
        .invoice-details { 
          margin-bottom: 40px; 
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .invoice-details p {
          margin: 8px 0;
          font-size: 16px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 30px; 
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th, td { 
          padding: 15px 20px; 
          text-align: left; 
          border-bottom: 1px solid #eee; 
        }
        th { 
          background-color: #3498db; 
          color: white;
          font-weight: 500;
          font-size: 16px;
        }
        td {
          font-size: 16px;
        }
        tr:nth-child(even) { background-color: #f8f8f8; }
        tr:hover { background-color: #f1f1f1; }
        .total-row { 
          font-weight: bold; 
          background-color: #f0f7ff !important;
          font-size: 18px;
        }
        .total-row td {
          border-top: 2px solid #3498db;
          padding: 18px 20px;
        }
        .section-title { 
          margin-top: 30px; 
          margin-bottom: 20px; 
          color: #3498db;
          border-left: 4px solid #3498db;
          padding-left: 15px;
          font-size: 22px;
        }
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #3498db;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }
        .print-button:hover {
          background-color: #2980b9;
        }
        .thank-you {
          margin-top: 60px; 
          text-align: center;
          padding: 20px;
          background-color: #f0f7ff;
          border-radius: 8px;
          font-size: 18px;
          color: #3498db;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #777;
          font-size: 14px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <button onclick="window.print()" class="print-button no-print">Print Invoice</button>
      <div class="container">
        <div class="invoice-header">
          <h1>${companyName} - Invoice</h1>
          <h2>${quote.title}</h2>
        </div>
        
        <div class="invoice-details">
          <div>
            <p><strong>Invoice Number:</strong> ${quote.quote_number}</p>
            <p><strong>Date:</strong> ${quote.date}</p>
          </div>
          <div>
            <p><strong>Customer:</strong> ${quote.customer_name}</p>
            ${quote.notes ? `<p><strong>Notes:</strong> ${quote.notes}</p>` : ''}
          </div>
        </div>
        
        <h3 class="section-title">Invoice Summary</h3>
        <table>
          <tbody>
            <tr>
              <td>3D Printing</td>
              <td>${currency}${formatCost(printingCost)}</td>
            </tr>
            <tr>
              <td>Design & Handling</td>
              <td>${currency}${formatCost(designHandlingCost)}</td>
            </tr>
            ${hardwareTotal > 0 ? `
              <tr>
                <td>Hardware</td>
                <td>${currency}${formatCost(hardwareTotal)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td>Total</td>
              <td>${currency}${formatCost(quote.total_cost)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="thank-you">
          <p>Thank you for your business!</p>
        </div>
        
        <div class="footer">
          <p>This invoice was generated by ${companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

  return router;
};
