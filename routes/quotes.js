const express = require('express');
const router = express.Router();
const path = require('path');
const Database = require('better-sqlite3');
const pdf = require('html-pdf');
const fs = require('fs');

const db = new Database(path.join(__dirname, '../database/3dq.sqlite'));

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

// Generate PDF for a quote
router.get('/:id/pdf/:type', (req, res) => {
  try {
    const quoteId = req.params.id;
    const pdfType = req.params.type; // 'internal' or 'client'
    
    if (pdfType !== 'internal' && pdfType !== 'client') {
      return res.status(400).json({ error: 'Invalid PDF type. Must be "internal" or "client"' });
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
    
    // Get currency symbol from settings
    const currencySetting = db.prepare('SELECT value FROM settings WHERE key = "currency_symbol"').get();
    const currency = currencySetting ? currencySetting.value : '£';
    
    // Generate HTML for PDF
    let html = '';
    
    if (pdfType === 'internal') {
      // Internal invoice with detailed breakdown
      html = generateInternalInvoiceHtml(quote, filaments, hardware, printSetup, labour, currency);
    } else {
      // Client invoice with simplified view
      html = generateClientInvoiceHtml(quote, filaments, hardware, printSetup, labour, currency);
    }
    
    // Generate PDF
    const options = {
      format: 'A4',
      border: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    };
    
    // Create directory for PDFs if it doesn't exist
    const pdfDir = path.join(__dirname, '../pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    
    const pdfPath = path.join(pdfDir, `quote_${quoteId}_${pdfType}.pdf`);
    
    pdf.create(html, options).toFile(pdfPath, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error generating PDF' });
      }
      
      // Send PDF file
      res.sendFile(result.filename);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to generate internal invoice HTML
function generateInternalInvoiceHtml(quote, filaments, hardware, printSetup, labour, currency) {
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
        body { font-family: Arial, sans-serif; color: #333; }
        .invoice-header { text-align: center; margin-bottom: 30px; }
        .invoice-details { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; }
        .section-title { margin-top: 20px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <h1>3DQ - Internal Invoice</h1>
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
    </body>
    </html>
  `;
}

// Helper function to generate client invoice HTML
function generateClientInvoiceHtml(quote, filaments, hardware, printSetup, labour, currency) {
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
        body { font-family: Arial, sans-serif; color: #333; }
        .invoice-header { text-align: center; margin-bottom: 30px; }
        .invoice-details { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; }
        .section-title { margin-top: 20px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <h1>3DQ - Invoice</h1>
        <h2>${quote.title}</h2>
      </div>
      
      <div class="invoice-details">
        <p><strong>Invoice Number:</strong> ${quote.quote_number}</p>
        <p><strong>Customer:</strong> ${quote.customer_name}</p>
        <p><strong>Date:</strong> ${quote.date}</p>
        ${quote.notes ? `<p><strong>Notes:</strong> ${quote.notes}</p>` : ''}
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
      
      <div style="margin-top: 50px; text-align: center;">
        <p>Thank you for your business!</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
