const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Define paths for Docker compatibility
const CONFIG_DIR = process.env.CONFIG_DIR || path.join(__dirname, '..', 'config');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  console.log(`Created config directory: ${CONFIG_DIR}`);
}

const dbPath = path.join(CONFIG_DIR, '3dq.sqlite');
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

  // Initialize default settings
  const defaultSettings = [
    { key: 'electricity_cost_per_kwh', value: '0.2166' },
    { key: 'labour_rate_per_hour', value: '13.00' },
    { key: 'default_markup_percent', value: '50' },
    { key: 'currency_symbol', value: '£' },
    { key: 'quote_prefix', value: '3DQ' },
    { key: 'accent_color', value: '#3498db' },
    { key: 'company_name', value: 'Prints Inc' }
  ];

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  
  defaultSettings.forEach(setting => {
    insertSetting.run(setting.key, setting.value);
  });
  
  // Initialize default filament
  const defaultFilament = {
    name: 'Bambu Lab PLA Basic - Black',
    type: 'PLA',
    diameter: 1.75,
    spool_weight: 1000,
    spool_price: 17.49,
    density: 1.24,
    price_per_kg: 17.49,
    color: '#000000',
    link: 'https://www.additive-x.com/shop/bambu-lab-pla-basic-black-with-spool.html',
    status: 'Active'
  };
  
  // Check if filaments table is empty before inserting default
  const filamentCount = db.prepare('SELECT COUNT(*) as count FROM filaments').get();
  if (filamentCount.count === 0) {
    const insertFilament = db.prepare(
      'INSERT INTO filaments (name, type, diameter, spool_weight, spool_price, density, price_per_kg, color, link, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    insertFilament.run(
      defaultFilament.name,
      defaultFilament.type,
      defaultFilament.diameter,
      defaultFilament.spool_weight,
      defaultFilament.spool_price,
      defaultFilament.density,
      defaultFilament.price_per_kg,
      defaultFilament.color,
      defaultFilament.link,
      defaultFilament.status
    );
  }
  
  // Initialize default printer
  const defaultPrinter = {
    name: 'Bambu Lab X1 Carbon',
    material_diameter: 1.75,
    price: 1099,
    depreciation_time: 8736,
    service_cost: 109.9,
    power_usage: 0.1,
    depreciation_per_hour: 0.14,
    status: 'Active'
  };
  
  // Check if printers table is empty before inserting default
  const printerCount = db.prepare('SELECT COUNT(*) as count FROM printers').get();
  if (printerCount.count === 0) {
    const insertPrinter = db.prepare(
      'INSERT INTO printers (name, material_diameter, price, depreciation_time, service_cost, power_usage, depreciation_per_hour, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    insertPrinter.run(
      defaultPrinter.name,
      defaultPrinter.material_diameter,
      defaultPrinter.price,
      defaultPrinter.depreciation_time,
      defaultPrinter.service_cost,
      defaultPrinter.power_usage,
      defaultPrinter.depreciation_per_hour,
      defaultPrinter.status
    );
  }
  
  // Initialize default hardware items
  const defaultHardwareItems = [
    {
      name: '4x AA Battery Holder',
      unit_price: 1.46,
      link: 'https://www.aliexpress.com/item/1005005437669176.html',
      status: 'Active'
    },
    {
      name: 'USB C to A',
      unit_price: 1.25,
      link: 'https://www.aliexpress.com/item/1005003783290985.html',
      status: 'Active'
    },
    {
      name: 'LED 5V 1M',
      unit_price: 10.29,
      link: 'https://www.aliexpress.com/item/1005005616288899.html',
      status: 'Active'
    }
  ];
  
  // Check if hardware table is empty before inserting defaults
  const hardwareCount = db.prepare('SELECT COUNT(*) as count FROM hardware').get();
  if (hardwareCount.count === 0) {
    const insertHardware = db.prepare(
      'INSERT INTO hardware (name, unit_price, link, status) VALUES (?, ?, ?, ?)'
    );
    
    defaultHardwareItems.forEach(item => {
      insertHardware.run(
        item.name,
        item.unit_price,
        item.link,
        item.status
      );
    });
  }
  
  console.log('Database initialized successfully');
}

// Run initialization
initDb();

// Export the database instance and the initialization function
module.exports = {
  db,
  initDb
};
