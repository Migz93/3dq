const express = require('express');
const path = require('path');

// Export a function that accepts a database instance
module.exports = (db) => {
  const router = express.Router();

// Get all filaments
router.get('/', (req, res) => {
  try {
    const filaments = db.prepare('SELECT * FROM filaments ORDER BY name').all();
    res.json(filaments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get active filaments only
router.get('/active', (req, res) => {
  try {
    const filaments = db.prepare("SELECT * FROM filaments WHERE status = 'Active' ORDER BY name").all();
    res.json(filaments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single filament
router.get('/:id', (req, res) => {
  try {
    const filament = db.prepare('SELECT * FROM filaments WHERE id = ?').get(req.params.id);
    
    if (!filament) {
      return res.status(404).json({ error: 'Filament not found' });
    }
    
    res.json(filament);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a filament
router.post('/', (req, res) => {
  try {
    const {
      name,
      type,
      diameter,
      spool_weight,
      spool_price,
      density,
      price_per_kg,
      color,
      link,
      status,
      spoolman_id,
      spoolman_synced
    } = req.body;

    // Validate required fields
    if (!name || !type || !diameter || !spool_weight || !spool_price || !price_per_kg || !color) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const stmt = db.prepare(`
      INSERT INTO filaments (
        name, type, diameter, spool_weight, spool_price, 
        density, price_per_kg, color, link, status,
        spoolman_id, spoolman_synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      name,
      type,
      diameter,
      spool_weight,
      spool_price,
      density || null,
      price_per_kg,
      color,
      link || null,
      status || 'Active',
      spoolman_id || null,
      spoolman_synced || 0
    );

    const filament = db.prepare('SELECT * FROM filaments WHERE id = ?').get(info.lastInsertRowid);
    
    res.status(201).json(filament);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a filament
router.put('/:id', (req, res) => {
  try {
    const {
      name,
      type,
      diameter,
      spool_weight,
      spool_price,
      density,
      price_per_kg,
      color,
      link,
      status,
      spoolman_id,
      spoolman_synced
    } = req.body;

    // Validate required fields
    if (!name || !type || !diameter || !spool_weight || !spool_price || !price_per_kg || !color) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check if filament exists
    const filament = db.prepare('SELECT * FROM filaments WHERE id = ?').get(req.params.id);
    
    if (!filament) {
      return res.status(404).json({ error: 'Filament not found' });
    }
    
    // If this is a Spoolman-synced filament being edited, unlink it from Spoolman
    let updatedSpoolmanSynced = spoolman_synced;
    let updatedSpoolmanId = spoolman_id;
    
    if (filament.spoolman_synced) {
      console.log(`Unlinking filament ${filament.id} from Spoolman`);
      updatedSpoolmanSynced = 0;
      updatedSpoolmanId = null;
    }

    const stmt = db.prepare(`
      UPDATE filaments SET
        name = ?,
        type = ?,
        diameter = ?,
        spool_weight = ?,
        spool_price = ?,
        density = ?,
        price_per_kg = ?,
        color = ?,
        link = ?,
        status = ?,
        spoolman_id = ?,
        spoolman_synced = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    // If this is a Spoolman-synced filament being edited, unlink it from Spoolman
    let finalSpoolmanId = spoolman_id;
    let finalSpoolmanSynced = spoolman_synced;
    
    if (filament.spoolman_synced) {
      console.log(`Unlinking filament ${filament.id} from Spoolman`);
      finalSpoolmanId = null;
      finalSpoolmanSynced = 0;
    }
    
    stmt.run(
      name,
      type,
      diameter,
      spool_weight,
      spool_price,
      density || null,
      price_per_kg,
      color,
      link || null,
      status || 'Active',
      finalSpoolmanId,
      finalSpoolmanSynced,
      req.params.id
    );

    const updatedFilament = db.prepare('SELECT * FROM filaments WHERE id = ?').get(req.params.id);
    
    res.json(updatedFilament);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a filament
router.delete('/:id', (req, res) => {
  try {
    // Check if filament exists
    const filament = db.prepare('SELECT * FROM filaments WHERE id = ?').get(req.params.id);
    
    if (!filament) {
      return res.status(404).json({ error: 'Filament not found' });
    }

    // Check if filament is used in any quotes
    const usedInQuotes = db.prepare('SELECT COUNT(*) as count FROM quote_filaments WHERE filament_id = ?').get(req.params.id);
    
    if (usedInQuotes.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete filament as it is used in quotes. Consider archiving it instead.' 
      });
    }

    db.prepare('DELETE FROM filaments WHERE id = ?').run(req.params.id);
    
    res.json({ message: 'Filament deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Archive/unarchive a filament
router.patch('/:id/toggle-status', (req, res) => {
  try {
    // Check if filament exists
    const filament = db.prepare('SELECT * FROM filaments WHERE id = ?').get(req.params.id);
    
    if (!filament) {
      return res.status(404).json({ error: 'Filament not found' });
    }

    const newStatus = filament.status === 'Active' ? 'Archived' : 'Active';
    
    db.prepare('UPDATE filaments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStatus, req.params.id);
    
    const updatedFilament = db.prepare('SELECT * FROM filaments WHERE id = ?').get(req.params.id);
    
    res.json(updatedFilament);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

  return router;
};
