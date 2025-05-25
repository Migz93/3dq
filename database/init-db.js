const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, '3dq.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
function initDb() {
  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Initialize default settings
  const defaultSettings = [
    { key: 'electricity_cost_per_kwh', value: '0.2166' },
    { key: 'labour_rate_per_hour', value: '13.00' },
    { key: 'default_markup_percent', value: '50' },
    { key: 'currency_symbol', value: '£' },
    { key: 'quote_prefix', value: '3DQ' },
    { key: 'accent_color', value: '#3498db' },
    { key: 'next_quote_number', value: '1' }
  ];

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  
  defaultSettings.forEach(setting => {
    insertSetting.run(setting.key, setting.value);
  });

  // Filaments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS filaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      diameter REAL NOT NULL,
      spool_weight REAL NOT NULL,
      spool_price REAL NOT NULL,
      density REAL,
      price_per_kg REAL NOT NULL,
      color TEXT NOT NULL,
      link TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Printers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS printers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      material_diameter REAL NOT NULL,
      price REAL NOT NULL,
      depreciation_time REAL NOT NULL,
      service_cost REAL NOT NULL,
      power_usage REAL NOT NULL,
      depreciation_per_hour REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Hardware table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hardware (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      link TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Quotes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_number TEXT NOT NULL,
      title TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      markup_percent REAL NOT NULL,
      total_cost REAL NOT NULL,
      is_quick_quote BOOLEAN NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Quote Filaments table (for multi-material quotes)
  db.exec(`
    CREATE TABLE IF NOT EXISTS quote_filaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      filament_id INTEGER NOT NULL,
      filament_name TEXT NOT NULL,
      filament_price_per_gram REAL NOT NULL,
      grams_used REAL NOT NULL,
      total_cost REAL NOT NULL,
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
      FOREIGN KEY (filament_id) REFERENCES filaments(id) ON DELETE RESTRICT
    )
  `);

  // Quote Hardware table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quote_hardware (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      hardware_id INTEGER NOT NULL,
      hardware_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_cost REAL NOT NULL,
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
      FOREIGN KEY (hardware_id) REFERENCES hardware(id) ON DELETE RESTRICT
    )
  `);

  // Quote Print Setup table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quote_print_setup (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      printer_id INTEGER NOT NULL,
      printer_name TEXT NOT NULL,
      print_time REAL NOT NULL,
      power_cost REAL NOT NULL,
      depreciation_cost REAL NOT NULL,
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
      FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE RESTRICT
    )
  `);

  // Quote Labour table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quote_labour (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      design_minutes INTEGER NOT NULL DEFAULT 0,
      preparation_minutes INTEGER NOT NULL DEFAULT 5,
      post_processing_minutes INTEGER NOT NULL DEFAULT 5,
      other_minutes INTEGER NOT NULL DEFAULT 0,
      labour_rate_per_hour REAL NOT NULL,
      total_cost REAL NOT NULL,
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized successfully');
}

// Run initialization
initDb();

module.exports = db;
