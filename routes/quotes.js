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
      is_quick_quote,
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
          markup_percent, discount_percent, total_cost, is_quick_quote
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const quoteInfo = quoteStmt.run(
        quote_number,
        title || `${quote_number} - ${customer_name}`,
        customer_name,
        date,
        notes || null,
        markup_percent,
        discount_percent || 0,
        total_cost,
        is_quick_quote || 0
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
      is_quick_quote,
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
          is_quick_quote = ?,
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
        is_quick_quote || 0,
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
        markup_percent, discount_percent, total_cost, is_quick_quote
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    
    const quoteInfo = quoteStmt.run(
      quote_number,
      title || `${quote_number} - ${customer_name}`,
      customer_name,
      date,
      notes || null,
      markup_percent || 0,
      discount_percent || 0,
      total_cost,
      1 // is_quick_quote parameter
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
    
    // Get quote data
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id);
    
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    // Get filaments used in this quote
    const filaments = db.prepare('SELECT * FROM quote_filaments WHERE quote_id = ?').all(id);
    
    // Get hardware used in this quote
    const hardware = db.prepare('SELECT * FROM quote_hardware WHERE quote_id = ?').all(id);
    
    // Get print setup for this quote
    const printSetup = db.prepare('SELECT * FROM quote_print_setup WHERE quote_id = ?').get(id);
    
    // Get labour for this quote
    const labour = db.prepare('SELECT * FROM quote_labour WHERE quote_id = ?').get(id);
    
    // Get settings
    const currencySetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('currency_symbol');
    const companyNameSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('company_name');
    
    const currencySymbol = currencySetting ? currencySetting.value : '$';
    const companyName = companyNameSetting ? companyNameSetting.value : 'Prints Inc';
    
    // Calculate totals
    const filamentTotal = filaments.reduce((sum, item) => sum + item.total_cost, 0);
    const hardwareTotal = hardware.reduce((sum, item) => sum + item.total_cost, 0);
    const printingTotal = printSetup ? (printSetup.power_cost + printSetup.depreciation_cost) : 0;
    const labourTotal = labour ? labour.total_cost : 0;
    
    const subtotal = filamentTotal + hardwareTotal + printingTotal + labourTotal;
    const discountAmount = quote.discount_percent ? (subtotal * (quote.discount_percent / 100)) : 0;
    const markupAmount = (subtotal - discountAmount) * (quote.markup_percent / 100);
    const total = subtotal - discountAmount + markupAmount;
    
    // Format currency
    const formatCurrency = (value) => {
      return `${currencySymbol}${value.toFixed(2)}`;
    };
    
    // Format time
    const formatTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    };
    
    // Generate HTML based on invoice type
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${type === 'internal' ? 'Internal' : 'Client'} Invoice - ${quote.quote_number}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #fff;
            color: #333;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
          }
          
          .invoice-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #3498db;
          }
          
          .blue-divider {
            border-bottom: 2px solid #3498db;
            margin: 20px 0;
          }
          
          .description-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .description-table th {
            background-color: #e6f2ff;
            color: #333;
            font-size: 1.2em;
            padding: 12px 15px;
            text-align: left;
            border: 1px solid #b3d9ff;
          }
          
          .description-table td {
            padding: 10px 15px;
            text-align: left;
            border: 1px solid #b3d9ff;
          }
          
          .small-blue-divider {
            border-bottom: 1px solid #3498db;
            margin: 15px 0;
          }
          
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .info-table td {
            padding: 8px;
            border: none;
          }
          
          .invoice-header h1 {
            color: #3498db;
            margin-bottom: 5px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
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
          
          .total-row {
            font-weight: bold;
            background-color: #f0f7ff;
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="invoice-header">
            <h1>${companyName} - Invoice</h1>
          </div>
          
          <div class="blue-divider"></div>
          
          <table class="info-table">
            <tr>
              <td><strong>Quote #:</strong> ${quote.quote_number}</td>
              <td style="text-align: right;"><strong>Date:</strong> ${quote.date}</td>
            </tr>
            <tr>
              <td><strong>Model:</strong> ${quote.title}</td>
              <td style="text-align: right;"><strong>Customer:</strong> ${quote.customer_name}</td>
            </tr>
          </table>
          
          <div class="blue-divider"></div>
    `;
    
    // Add description table
    html += `
          <table class="description-table">
            <thead>
              <tr>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    // Print Duration
    if (printSetup) {
      html += `
              <tr>
                <td>Print Duration - ${(printSetup.print_time / 60).toFixed(2)} hours</td>
              </tr>
      `;
    }
    
    // Filaments
    filaments.forEach(filament => {
      html += `
              <tr>
                <td>${filament.filament_name} - ${filament.grams_used.toFixed(2)}g</td>
              </tr>
      `;
    });
    
    // Hardware
    hardware.forEach(item => {
      html += `
              <tr>
                <td>${item.hardware_name}</td>
              </tr>
      `;
    });
    
    // Labour (just the word if any labour was recorded)
    if (labour && (labour.design_minutes > 0 || labour.preparation_minutes > 0 || 
                   labour.post_processing_minutes > 0 || labour.other_minutes > 0)) {
      html += `
              <tr>
                <td>Labour</td>
              </tr>
      `;
    }
    
    html += `
            </tbody>
          </table>
    `;
    
    // Add blue divider
    html += `
          <div class="blue-divider"></div>
    `;
    
    // Add pricing section (right-aligned)
    html += `
          <div style="text-align: right;">
    `;
    
    if (quote.discount_percent && quote.discount_percent > 0) {
      html += `
            <p><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</p>
            <p><strong>Discount (${quote.discount_percent}%):</strong> -${formatCurrency(discountAmount)}</p>
      `;
    }
    
    // Only show markup in internal invoice
    if (type === 'internal') {
      html += `
            <p><strong>Markup (${quote.markup_percent}%):</strong> ${formatCurrency(markupAmount)}</p>
      `;
    }
    
    html += `
            <p style="font-size: 1.2em;"><strong>Total: ${formatCurrency(total)}</strong></p>
          </div>
    `;
    
    // Add notes if available for client invoice
    if (type === 'client' && quote.notes) {
      html += `
        <h2 class="section-title">Notes</h2>
        <p>${quote.notes}</p>
      `;
    }
    
    // Add detailed sections for internal invoice
    if (type === 'internal') {
      // Add detailed sections for internal invoice
      // Materials section
      if (filaments.length > 0) {
        html += `
          <h2 class="section-title">Materials</h2>
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Amount (g)</th>
                <th>Price/g</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        filaments.forEach(filament => {
          html += `
              <tr>
                <td>${filament.filament_name}</td>
                <td>${filament.grams_used.toFixed(2)}</td>
                <td>${formatCurrency(filament.filament_price_per_gram)}</td>
                <td>${formatCurrency(filament.total_cost)}</td>
              </tr>
          `;
        });
        
        html += `
            </tbody>
          </table>
        `;
      }
      
      // Hardware section
      if (hardware.length > 0) {
        html += `
          <h2 class="section-title">Hardware</h2>
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
        `;
        
        hardware.forEach(item => {
          html += `
              <tr>
                <td>${item.hardware_name}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unit_price)}</td>
                <td>${formatCurrency(item.total_cost)}</td>
              </tr>
          `;
        });
        
        html += `
            </tbody>
          </table>
        `;
      }
      
      // Print setup section
      if (printSetup) {
        html += `
          <h2 class="section-title">Printing</h2>
          <table>
            <thead>
              <tr>
                <th>Printer</th>
                <th>Print Time</th>
                <th>Power Cost</th>
                <th>Depreciation</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${printSetup.printer_name}</td>
                <td>${(printSetup.print_time / 60).toFixed(2)} hours</td>
                <td>${formatCurrency(printSetup.power_cost)}</td>
                <td>${formatCurrency(printSetup.depreciation_cost)}</td>
                <td>${formatCurrency(printSetup.power_cost + printSetup.depreciation_cost)}</td>
              </tr>
            </tbody>
          </table>
        `;
      }
      
      // Labour section
      if (labour) {
        html += `
          <h2 class="section-title">Labour</h2>
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Time</th>
                <th>Rate</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        if (labour.design_minutes > 0) {
          html += `
              <tr>
                <td>Design</td>
                <td>${formatTime(labour.design_minutes)}</td>
                <td>${formatCurrency(labour.labour_rate_per_hour)} / hour</td>
                <td>${formatCurrency((labour.design_minutes / 60) * labour.labour_rate_per_hour)}</td>
              </tr>
          `;
        }
        
        if (labour.preparation_minutes > 0) {
          html += `
              <tr>
                <td>Preparation</td>
                <td>${formatTime(labour.preparation_minutes)}</td>
                <td>${formatCurrency(labour.labour_rate_per_hour)} / hour</td>
                <td>${formatCurrency((labour.preparation_minutes / 60) * labour.labour_rate_per_hour)}</td>
              </tr>
          `;
        }
        
        if (labour.post_processing_minutes > 0) {
          html += `
              <tr>
                <td>Post-Processing</td>
                <td>${formatTime(labour.post_processing_minutes)}</td>
                <td>${formatCurrency(labour.labour_rate_per_hour)} / hour</td>
                <td>${formatCurrency((labour.post_processing_minutes / 60) * labour.labour_rate_per_hour)}</td>
              </tr>
          `;
        }
        
        if (labour.other_minutes > 0) {
          html += `
              <tr>
                <td>Other</td>
                <td>${formatTime(labour.other_minutes)}</td>
                <td>${formatCurrency(labour.labour_rate_per_hour)} / hour</td>
                <td>${formatCurrency((labour.other_minutes / 60) * labour.labour_rate_per_hour)}</td>
              </tr>
          `;
        }
        
        html += `
              <tr class="total-row">
                <td colspan="3">Total Labour</td>
                <td>${formatCurrency(labour.total_cost)}</td>
              </tr>
            </tbody>
          </table>
        `;
      }
    }
    
    // Close HTML
    html += `
        </div>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

  return router;
};
