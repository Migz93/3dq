const express = require('express');
const router = express.Router();
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '../database/3dq.sqlite'));

// Get all settings
router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();
    
    // Convert to object format
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    res.json(settingsObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single setting
router.get('/:key', (req, res) => {
  try {
    const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(req.params.key);
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a setting
router.put('/:key', (req, res) => {
  try {
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Please provide a value' });
    }

    // Check if setting exists
    const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(req.params.key);
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(value.toString(), req.params.key);
    
    const updatedSetting = db.prepare('SELECT * FROM settings WHERE key = ?').get(req.params.key);
    
    res.json({ key: updatedSetting.key, value: updatedSetting.value });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update multiple settings at once
router.put('/', (req, res) => {
  try {
    const settings = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Please provide settings object' });
    }

    const updateStmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
    
    // Start a transaction
    const updateSettings = db.transaction((settingsObj) => {
      for (const [key, value] of Object.entries(settingsObj)) {
        updateStmt.run(value.toString(), key);
      }
    });
    
    updateSettings(settings);
    
    // Get all updated settings
    const updatedSettings = db.prepare('SELECT * FROM settings').all();
    
    // Convert to object format
    const settingsObj = updatedSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    res.json(settingsObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get next quote number and increment it
router.get('/quote/next-number', (req, res) => {
  try {
    // Start a transaction
    db.transaction(() => {
      // Get current quote number
      const setting = db.prepare('SELECT value FROM settings WHERE key = "next_quote_number"').get();
      
      if (!setting) {
        throw new Error('next_quote_number setting not found');
      }
      
      const currentNumber = parseInt(setting.value);
      
      // Increment the quote number
      db.prepare('UPDATE settings SET value = ? WHERE key = "next_quote_number"')
        .run((currentNumber + 1).toString());
      
      // Get quote prefix
      const prefixSetting = db.prepare('SELECT value FROM settings WHERE key = "quote_prefix"').get();
      const prefix = prefixSetting ? prefixSetting.value : '3DQ';
      
      // Format the quote number with leading zeros
      const formattedNumber = currentNumber.toString().padStart(4, '0');
      
      res.json({ 
        quote_number: `${prefix}${formattedNumber}`,
        raw_number: currentNumber
      });
    })();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
