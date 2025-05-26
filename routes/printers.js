const express = require('express');
const path = require('path');

// Export a function that accepts a database instance
module.exports = (db) => {
  const router = express.Router();

// Get all printers
router.get('/', (req, res) => {
  try {
    const printers = db.prepare('SELECT * FROM printers ORDER BY name').all();
    res.json(printers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get active printers only
router.get('/active', (req, res) => {
  try {
    const printers = db.prepare("SELECT * FROM printers WHERE status = 'Active' ORDER BY name").all();
    res.json(printers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single printer
router.get('/:id', (req, res) => {
  try {
    const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    
    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }
    
    res.json(printer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a printer
router.post('/', (req, res) => {
  try {
    const {
      name,
      material_diameter,
      price,
      depreciation_time,
      service_cost,
      power_usage,
      depreciation_per_hour,
      status
    } = req.body;

    // Validate required fields
    if (!name || !material_diameter || !price || !depreciation_time || 
        !service_cost || !power_usage || !depreciation_per_hour) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const stmt = db.prepare(`
      INSERT INTO printers (
        name, material_diameter, price, depreciation_time, 
        service_cost, power_usage, depreciation_per_hour, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      name,
      material_diameter,
      price,
      depreciation_time,
      service_cost,
      power_usage,
      depreciation_per_hour,
      status || 'Active'
    );

    const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(info.lastInsertRowid);
    
    res.status(201).json(printer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a printer
router.put('/:id', (req, res) => {
  try {
    const {
      name,
      material_diameter,
      price,
      depreciation_time,
      service_cost,
      power_usage,
      depreciation_per_hour,
      status
    } = req.body;

    // Validate required fields
    if (!name || !material_diameter || !price || !depreciation_time || 
        !service_cost || !power_usage || !depreciation_per_hour) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check if printer exists
    const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    
    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    const stmt = db.prepare(`
      UPDATE printers SET
        name = ?,
        material_diameter = ?,
        price = ?,
        depreciation_time = ?,
        service_cost = ?,
        power_usage = ?,
        depreciation_per_hour = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      name,
      material_diameter,
      price,
      depreciation_time,
      service_cost,
      power_usage,
      depreciation_per_hour,
      status || 'Active',
      req.params.id
    );

    const updatedPrinter = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    
    res.json(updatedPrinter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a printer
router.delete('/:id', (req, res) => {
  try {
    // Check if printer exists
    const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    
    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    // Check if printer is used in any quotes
    const usedInQuotes = db.prepare('SELECT COUNT(*) as count FROM quote_print_setup WHERE printer_id = ?').get(req.params.id);
    
    if (usedInQuotes.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete printer as it is used in quotes. Consider archiving it instead.' 
      });
    }

    db.prepare('DELETE FROM printers WHERE id = ?').run(req.params.id);
    
    res.json({ message: 'Printer deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Archive/unarchive a printer
router.patch('/:id/toggle-status', (req, res) => {
  try {
    // Check if printer exists
    const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    
    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    const newStatus = printer.status === 'Active' ? 'Archived' : 'Active';
    
    db.prepare('UPDATE printers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStatus, req.params.id);
    
    const updatedPrinter = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    
    res.json(updatedPrinter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

  return router;
};
