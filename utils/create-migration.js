#!/usr/bin/env node

const path = require('path');
const Database = require('better-sqlite3');
const MigrationManager = require('./migration-manager');

// Get migration name from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Error: Migration name is required');
  console.log('Usage: node create-migration.js "Add column to table"');
  process.exit(1);
}

const migrationName = args[0];

// Define paths for Docker compatibility
const CONFIG_DIR = process.env.CONFIG_DIR || path.join(__dirname, '..', 'config');
const dbPath = path.join(CONFIG_DIR, '3dq.sqlite');

// Open database connection
let db;
try {
  db = new Database(dbPath);
} catch (error) {
  console.error('Error opening database:', error);
  process.exit(1);
}

// Create migration manager
const migrationManager = new MigrationManager(db);

// Create migration file
try {
  const filePath = migrationManager.createMigration(migrationName);
  console.log(`Migration file created: ${filePath}`);
  console.log('Edit this file to define your database changes');
} catch (error) {
  console.error('Error creating migration:', error);
  process.exit(1);
} finally {
  // Close database connection
  if (db) {
    db.close();
  }
}
