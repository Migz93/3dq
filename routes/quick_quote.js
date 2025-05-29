const express = require('express');

// Export a function that accepts a database instance
module.exports = (db) => {
  const router = express.Router();

  // Create a quick quote
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      
      // Insert filament if provided
      if (req.body.filament) {
        const filamentStmt = db.prepare(`
          INSERT INTO quote_filaments (
            quote_id, filament_id, filament_name, filament_price_per_gram,
            grams_used, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        filamentStmt.run(
          quoteId,
          req.body.filament.filament_id,
          req.body.filament.filament_name,
          req.body.filament.filament_price_per_gram,
          req.body.filament.grams_used,
          req.body.filament.total_cost
        );
      }
      
      // Insert print setup if provided
      if (req.body.print_setup) {
        const printSetupStmt = db.prepare(`
          INSERT INTO quote_print_setup (
            quote_id, printer_id, printer_name, print_time,
            power_cost, depreciation_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        printSetupStmt.run(
          quoteId,
          req.body.print_setup.printer_id,
          req.body.print_setup.printer_name,
          req.body.print_setup.print_time,
          req.body.print_setup.power_cost,
          req.body.print_setup.depreciation_cost
        );
      }
      
      // Return the new quote ID
      res.status(201).json({ id: quoteId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};
