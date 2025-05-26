const express = require('express');
const path = require('path');

// Export a function that accepts a database instance
module.exports = (db) => {
  const router = express.Router();

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

// Get next quote number based on existing quotes
router.get('/quote/next-number', (req, res) => {
  try {
    // Get quote prefix from settings
    let prefix = '3DQ'; // Default prefix
    try {
      const prefixSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('quote_prefix');
      if (prefixSetting && prefixSetting.value) {
        prefix = prefixSetting.value;
      }
    } catch (settingError) {
      console.warn('Could not get quote_prefix setting, using default:', settingError);
    }
    
    // Get all quotes
    let quotes = [];
    try {
      quotes = db.prepare('SELECT quote_number FROM quotes').all() || [];
    } catch (quotesError) {
      console.warn('Could not get quotes, assuming none exist:', quotesError);
      // If the quotes table doesn't exist yet, we'll just use the default number 1
    }
    
    let nextNumber = 1; // Default to 1 if no quotes exist
    
    if (quotes.length > 0) {
      // Extract numbers from quote numbers and find the highest
      const quoteNumbers = [];
      
      quotes.forEach(q => {
        if (q.quote_number && q.quote_number.startsWith(prefix)) {
          // Extract the number part (e.g., "3DQ0001" -> "0001" -> 1)
          const numericPart = q.quote_number.substring(prefix.length);
          if (/^\d+$/.test(numericPart)) {
            quoteNumbers.push(parseInt(numericPart, 10));
          }
        }
      });
      
      if (quoteNumbers.length > 0) {
        nextNumber = Math.max(...quoteNumbers) + 1;
      }
    }
    
    // Format the quote number with leading zeros
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    
    res.json({ 
      quote_number: `${prefix}${formattedNumber}`,
      raw_number: nextNumber
    });
  } catch (error) {
    console.error('Error generating quote number:', error);
    res.status(500).json({ error: 'Failed to generate quote number' });
  }
});

  return router;
};
