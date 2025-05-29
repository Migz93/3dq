const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');
const fs = require('fs');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 6123;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Define paths for Docker compatibility
const CONFIG_DIR = process.env.CONFIG_DIR || path.join(__dirname, 'config');
const QUOTES_DIR = path.join(CONFIG_DIR, 'quotes');
const dbPath = path.join(CONFIG_DIR, '3dq.sqlite');
const dbInitPath = path.join(__dirname, 'utils', 'init-db.js');

// Ensure config and quotes directories exist
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  console.log(`Created config directory: ${CONFIG_DIR}`);
}

if (!fs.existsSync(QUOTES_DIR)) {
  fs.mkdirSync(QUOTES_DIR, { recursive: true });
  console.log(`Created quotes directory: ${QUOTES_DIR}`);
}

// Check if database exists and has tables
let needsInit = false;
if (!fs.existsSync(dbPath)) {
  console.log('Database file not found, will initialize a new one');
  needsInit = true;
} else {
  // Check if tables exist
  try {
    const db = new Database(dbPath);
    // Try to query the settings table
    try {
      db.prepare('SELECT * FROM settings LIMIT 1').get();
      console.log('Database exists and has tables');
    } catch (error) {
      console.log('Database exists but tables are missing, will initialize');
      needsInit = true;
    }
    db.close();
  } catch (error) {
    console.error('Error checking database:', error);
    needsInit = true;
  }
}

// Initialize database if needed
if (needsInit) {
  console.log('Initializing database...');
  try {
    // Delete the database file if it exists but is corrupted
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    
    // Run the initialization script
    require('./utils/init-db');
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1); // Exit if database initialization fails
  }
}

// Open database connection
const db = new Database(dbPath);

// Import routes
const createFilamentRoutes = require('./routes/filaments');
const createPrinterRoutes = require('./routes/printers');
const createHardwareRoutes = require('./routes/hardware');
const createQuoteRoutes = require('./routes/quotes');
const createQuickQuoteRoutes = require('./routes/quick_quote');
const createSettingsRoutes = require('./routes/settings');
const createSpoolmanRoutes = require('./routes/spoolman');

// Initialize routes with the database instance
const filamentRoutes = createFilamentRoutes(db);
const printerRoutes = createPrinterRoutes(db);
const hardwareRoutes = createHardwareRoutes(db);
const quoteRoutes = createQuoteRoutes(db);
const quickQuoteRoutes = createQuickQuoteRoutes(db);
const settingsRoutes = createSettingsRoutes(db);
const spoolmanRoutes = createSpoolmanRoutes(db);

// Use routes
app.use('/api/filaments', filamentRoutes);
app.use('/api/printers', printerRoutes);
app.use('/api/hardware', hardwareRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/quick-quote', quickQuoteRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/spoolman', spoolmanRoutes);

// Serve static assets in production
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
