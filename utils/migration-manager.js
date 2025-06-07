const fs = require('fs');
const path = require('path');

/**
 * Database Migration Manager for 3DQ
 * 
 * This module handles database schema migrations between application versions.
 * It tracks the current schema version in a migrations table and applies
 * pending migrations in order.
 */
class MigrationManager {
  /**
   * Initialize the migration manager
   * @param {Object} db - The better-sqlite3 database instance
   */
  constructor(db) {
    this.db = db;
    this.migrationsDir = path.join(__dirname, 'migrations');
    
    // Ensure migrations directory exists
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }
  }

  /**
   * Initialize the migrations table if it doesn't exist
   */
  initMigrationsTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Get the current database schema version
   * @returns {number} The current schema version, or 0 if no migrations have been applied
   */
  getCurrentVersion() {
    try {
      const result = this.db.prepare('SELECT MAX(version) as version FROM schema_migrations').get();
      return result?.version || 0;
    } catch (error) {
      // If the table doesn't exist yet, return 0
      return 0;
    }
  }

  /**
   * Get all available migration files
   * @returns {Array} Array of migration objects sorted by version
   */
  getAvailableMigrations() {
    const migrationFiles = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const [version, ...nameParts] = path.basename(file, '.js').split('_');
        return {
          version: parseInt(version, 10),
          name: nameParts.join('_'),
          file
        };
      })
      .sort((a, b) => a.version - b.version);
    
    return migrationFiles;
  }

  /**
   * Get pending migrations that need to be applied
   * @returns {Array} Array of pending migration objects
   */
  getPendingMigrations() {
    const currentVersion = this.getCurrentVersion();
    const availableMigrations = this.getAvailableMigrations();
    
    return availableMigrations.filter(migration => migration.version > currentVersion);
  }

  /**
   * Apply a single migration
   * @param {Object} migration - The migration object to apply
   */
  applyMigration(migration) {
    console.log(`Applying migration ${migration.version}: ${migration.name}`);
    
    try {
      // Load the migration module
      const migrationModule = require(path.join(this.migrationsDir, migration.file));
      
      // Start a transaction
      this.db.transaction(() => {
        // Apply the migration
        migrationModule.up(this.db);
        
        // Record the migration in the schema_migrations table
        this.db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)')
          .run(migration.version, migration.name);
      })();
      
      console.log(`Migration ${migration.version} applied successfully`);
    } catch (error) {
      console.error(`Error applying migration ${migration.version}:`, error);
      throw error; // Re-throw to stop the migration process
    }
  }

  /**
   * Run all pending migrations
   * @returns {number} The number of migrations applied
   */
  async runMigrations() {
    // Initialize migrations table
    this.initMigrationsTable();
    
    // Get pending migrations
    const pendingMigrations = this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      console.log('Database schema is up to date');
      return 0;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    // Apply each migration in order
    for (const migration of pendingMigrations) {
      this.applyMigration(migration);
    }
    
    return pendingMigrations.length;
  }

  /**
   * Create a new migration file
   * @param {string} name - The name of the migration
   * @returns {string} The path to the created migration file
   */
  createMigration(name) {
    // Get the next version number
    const availableMigrations = this.getAvailableMigrations();
    const nextVersion = availableMigrations.length > 0 
      ? Math.max(...availableMigrations.map(m => m.version)) + 1 
      : 1;
    
    // Format the version number with leading zeros
    const versionStr = String(nextVersion).padStart(3, '0');
    
    // Create the migration filename
    const filename = `${versionStr}_${name.replace(/\s+/g, '_').toLowerCase()}.js`;
    const filePath = path.join(this.migrationsDir, filename);
    
    // Create the migration file with a template
    const template = `/**
 * Migration: ${name}
 * Version: ${nextVersion}
 * Created: ${new Date().toISOString()}
 */

/**
 * Apply the migration
 * @param {Object} db - The better-sqlite3 database instance
 */
exports.up = function(db) {
  // Write your migration code here
  // Example:
  // db.exec(\`
  //   ALTER TABLE table_name
  //   ADD COLUMN column_name TEXT DEFAULT 'default_value'
  // \`);
};

/**
 * Rollback the migration (optional)
 * @param {Object} db - The better-sqlite3 database instance
 */
exports.down = function(db) {
  // Write your rollback code here (if possible)
  // Example:
  // db.exec(\`
  //   ALTER TABLE table_name
  //   DROP COLUMN column_name
  // \`);
};
`;
    
    fs.writeFileSync(filePath, template);
    console.log(`Created migration file: ${filename}`);
    
    return filePath;
  }
}

module.exports = MigrationManager;
