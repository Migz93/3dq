const express = require('express');
const router = express.Router();
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '../database/3dq.sqlite'));

// Get all hardware items
router.get('/', (req, res) => {
  try {
    const hardware = db.prepare('SELECT * FROM hardware ORDER BY name').all();
    res.json(hardware);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get active hardware items only
router.get('/active', (req, res) => {
  try {
    const hardware = db.prepare("SELECT * FROM hardware WHERE status = 'Active' ORDER BY name").all();
    res.json(hardware);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single hardware item
router.get('/:id', (req, res) => {
  try {
    const hardware = db.prepare('SELECT * FROM hardware WHERE id = ?').get(req.params.id);
    
    if (!hardware) {
      return res.status(404).json({ error: 'Hardware item not found' });
    }
    
    res.json(hardware);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a hardware item
router.post('/', (req, res) => {
  try {
    const { name, unit_price, link, status } = req.body;

    // Validate required fields
    if (!name || unit_price === undefined) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const stmt = db.prepare(`
      INSERT INTO hardware (name, unit_price, link, status)
      VALUES (?, ?, ?, ?)
    `);

    const info = stmt.run(
      name,
      unit_price,
      link || null,
      status || 'Active'
    );

    const hardware = db.prepare('SELECT * FROM hardware WHERE id = ?').get(info.lastInsertRowid);
    
    res.status(201).json(hardware);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a hardware item
router.put('/:id', (req, res) => {
  try {
    const { name, unit_price, link, status } = req.body;

    // Validate required fields
    if (!name || unit_price === undefined) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check if hardware exists
    const hardware = db.prepare('SELECT * FROM hardware WHERE id = ?').get(req.params.id);
    
    if (!hardware) {
      return res.status(404).json({ error: 'Hardware item not found' });
    }

    const stmt = db.prepare(`
      UPDATE hardware SET
        name = ?,
        unit_price = ?,
        link = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      name,
      unit_price,
      link || null,
      status || 'Active',
      req.params.id
    );

    const updatedHardware = db.prepare('SELECT * FROM hardware WHERE id = ?').get(req.params.id);
    
    res.json(updatedHardware);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a hardware item
router.delete('/:id', (req, res) => {
  try {
    // Check if hardware exists
    const hardware = db.prepare('SELECT * FROM hardware WHERE id = ?').get(req.params.id);
    
    if (!hardware) {
      return res.status(404).json({ error: 'Hardware item not found' });
    }

    // Check if hardware is used in any quotes
    const usedInQuotes = db.prepare('SELECT COUNT(*) as count FROM quote_hardware WHERE hardware_id = ?').get(req.params.id);
    
    if (usedInQuotes.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete hardware item as it is used in quotes. Consider archiving it instead.' 
      });
    }

    db.prepare('DELETE FROM hardware WHERE id = ?').run(req.params.id);
    
    res.json({ message: 'Hardware item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Archive/unarchive a hardware item
router.patch('/:id/toggle-status', (req, res) => {
  try {
    // Check if hardware exists
    const hardware = db.prepare('SELECT * FROM hardware WHERE id = ?').get(req.params.id);
    
    if (!hardware) {
      return res.status(404).json({ error: 'Hardware item not found' });
    }

    const newStatus = hardware.status === 'Active' ? 'Archived' : 'Active';
    
    db.prepare('UPDATE hardware SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStatus, req.params.id);
    
    const updatedHardware = db.prepare('SELECT * FROM hardware WHERE id = ?').get(req.params.id);
    
    res.json(updatedHardware);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
