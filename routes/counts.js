const express = require('express');

// Export a function that accepts a database instance
module.exports = (db) => {
  const router = express.Router();

  // Get count of quotes
  router.get('/quotes', (req, res) => {
    try {
      const count = db.prepare('SELECT COUNT(*) as count FROM quotes').get();
      res.json({ count: count.count });
    } catch (error) {
      console.error('Error getting quotes count:', error);
      res.status(500).json({ error: 'Failed to get quotes count' });
    }
  });

  // Get count of active filaments
  router.get('/filaments', (req, res) => {
    try {
      const count = db.prepare("SELECT COUNT(*) as count FROM filaments WHERE status = 'Active'").get();
      res.json({ count: count.count });
    } catch (error) {
      console.error('Error getting filaments count:', error);
      res.status(500).json({ error: 'Failed to get filaments count' });
    }
  });

  // Get count of active printers
  router.get('/printers', (req, res) => {
    try {
      const count = db.prepare("SELECT COUNT(*) as count FROM printers WHERE status = 'Active'").get();
      res.json({ count: count.count });
    } catch (error) {
      console.error('Error getting printers count:', error);
      res.status(500).json({ error: 'Failed to get printers count' });
    }
  });

  // Get count of active hardware
  router.get('/hardware', (req, res) => {
    try {
      const count = db.prepare("SELECT COUNT(*) as count FROM hardware WHERE status = 'Active'").get();
      res.json({ count: count.count });
    } catch (error) {
      console.error('Error getting hardware count:', error);
      res.status(500).json({ error: 'Failed to get hardware count' });
    }
  });

  return router;
};
