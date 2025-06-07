/**
 * Migration: Add quantity to quotes
 * Version: 1
 * Created: 2025-06-07T15:30:00.000Z
 */

/**
 * Apply the migration
 * @param {Object} db - The better-sqlite3 database instance
 */
exports.up = function(db) {
  // Check if the column already exists
  const tableInfo = db.prepare("PRAGMA table_info(quotes)").all();
  const columnExists = tableInfo.some(column => column.name === 'quantity');
  
  if (!columnExists) {
    // Add quantity column with default value of 1
    db.exec(`
      ALTER TABLE quotes
      ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1
    `);
    console.log('Added quantity column to quotes table');
  } else {
    console.log('Quantity column already exists in quotes table');
  }
};

/**
 * Rollback the migration (optional)
 * @param {Object} db - The better-sqlite3 database instance
 */
exports.down = function(db) {
  // SQLite doesn't support dropping columns directly
  // This would require recreating the table without the column
  console.log('SQLite does not support dropping columns directly');
};
