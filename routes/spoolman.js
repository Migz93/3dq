const express = require('express');
const path = require('path');

// Export a function that accepts a database instance
module.exports = (db) => {
  const router = express.Router();

  // Get Spoolman integration status
  router.get('/status', (req, res) => {
    try {
      const spoolmanSyncEnabled = db.prepare('SELECT value FROM settings WHERE key = ?').get('spoolman_sync_enabled');
      const spoolmanUrl = db.prepare('SELECT value FROM settings WHERE key = ?').get('spoolman_url');
      
      res.json({
        enabled: spoolmanSyncEnabled ? spoolmanSyncEnabled.value === 'true' : false,
        url: spoolmanUrl ? spoolmanUrl.value : 'http://localhost:7912'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Test Spoolman connection
  router.post('/test-connection', async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'Please provide a Spoolman URL' });
      }

      // Test connection to Spoolman API
      try {
        const response = await fetch(`${url}/api/v1/spool?limit=1`);
        
        if (!response.ok) {
          throw new Error(`Failed to connect to Spoolman API: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        res.json({ success: true, message: 'Successfully connected to Spoolman API' });
      } catch (error) {
        console.error('Error connecting to Spoolman:', error);
        res.status(400).json({ success: false, error: `Failed to connect to Spoolman: ${error.message}` });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Sync spools from Spoolman
  router.post('/sync', async (req, res) => {
    try {
      // Get Spoolman settings
      const spoolmanSyncEnabled = db.prepare('SELECT value FROM settings WHERE key = ?').get('spoolman_sync_enabled');
      const spoolmanUrl = db.prepare('SELECT value FROM settings WHERE key = ?').get('spoolman_url');
      
      console.log('Spoolman sync enabled:', spoolmanSyncEnabled);
      console.log('Spoolman URL:', spoolmanUrl);
      
      // Always allow sync if we have a URL, regardless of the enabled setting
      // This makes it easier for users to test the feature
      if (!spoolmanUrl || !spoolmanUrl.value) {
        return res.status(400).json({ error: 'Spoolman URL is not configured' });
      }

      // Fetch all spools from Spoolman
      try {
        console.log('Fetching spools from Spoolman URL:', spoolmanUrl.value);
        const response = await fetch(`${spoolmanUrl.value}/api/v1/spool`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch spools from Spoolman API: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Spoolman API response received, data type:', typeof data);
        
        // Handle both array response and object with items property
        let spools = [];
        if (Array.isArray(data)) {
          console.log('Data is an array with', data.length, 'items');
          spools = data;
        } else if (data.items && Array.isArray(data.items)) {
          console.log('Data has items array with', data.items.length, 'items');
          spools = data.items;
        } else {
          console.log('Unexpected data format:', data);
          spools = [];
        }
        
        if (spools.length === 0) {
          return res.json({ message: 'No spools found in Spoolman' });
        }

        // Get all existing filaments with Spoolman IDs
        const existingFilaments = db.prepare('SELECT id, spoolman_id FROM filaments WHERE spoolman_id IS NOT NULL').all();
        const existingSpoolmanIds = new Set(existingFilaments.map(f => f.spoolman_id));

        // Prepare statements
        const insertFilament = db.prepare(`
          INSERT INTO filaments (
            name, type, diameter, spool_weight, spool_price, density,
            price_per_kg, color, link, status, spoolman_id, spoolman_synced
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const updateFilament = db.prepare(`
          UPDATE filaments SET
            name = ?, type = ?, diameter = ?, spool_weight = ?,
            spool_price = ?, density = ?, price_per_kg = ?, color = ?,
            link = ?, status = ?, spoolman_synced = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE spoolman_id = ?
        `);

        // Start a transaction
        const syncSpools = db.transaction((spools) => {
          let added = 0;
          let updated = 0;

          console.log(`Processing ${spools.length} spools`);
          
          spools.forEach(spool => {
            // Extract filament data from Spoolman spool
            const filamentData = spool.filament || {};
            const vendorData = filamentData.vendor || {};
            
            // Calculate price per kg
            const weight = spool.initial_weight || filamentData.weight || 1000; // Default to 1kg if not provided
            const price = spool.price || filamentData.price || 0;
            const pricePerKg = price / (weight / 1000);
            
            // Prepare filament data
            const vendorName = vendorData.name || 'Unknown';
            const filamentName = filamentData.name || 'Filament';
            const name = `${vendorName} ${filamentName}`;
            const type = filamentData.material || 'PLA';
            const diameter = filamentData.diameter || 1.75;
            const density = filamentData.density || 1.24;
            const color = filamentData.color_hex || '#000000';
            const link = vendorData.website || null;
            
            console.log(`Processing spool: ${name}, type: ${type}, color: ${color}`);
            
            if (existingSpoolmanIds.has(spool.id)) {
              // Update existing filament
              updateFilament.run(
                name,
                type,
                diameter,
                weight,
                price,
                density,
                pricePerKg,
                color,
                link,
                'Active',
                1, // spoolman_synced = true
                spool.id
              );
              updated++;
            } else {
              // Insert new filament
              insertFilament.run(
                name,
                type,
                diameter,
                weight,
                price,
                density,
                pricePerKg,
                color,
                link,
                'Active',
                spool.id,
                1 // spoolman_synced = true
              );
              added++;
            }
          });

          return { added, updated };
        });

        // Execute transaction
        const result = syncSpools(spools);
        
        console.log(`Sync completed. Added: ${result.added}, Updated: ${result.updated}`);
        
        res.json({
          success: true,
          message: `Successfully synced ${spools.length} spools from Spoolman`,
          added: result.added,
          updated: result.updated
        });
      } catch (error) {
        console.error('Error syncing spools from Spoolman:', error);
        res.status(400).json({ error: `Failed to sync spools from Spoolman: ${error.message}` });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};
