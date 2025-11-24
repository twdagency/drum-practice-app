/**
 * Setup Authentication Migrations
 * Adds password reset and email change token tables
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupAuthMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'lib', 'db', 'auth-migrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await client.query(migrationSQL);
    console.log('✅ Authentication migrations applied successfully');

    console.log('\n📋 Summary:');
    console.log('  - password_reset_tokens table created');
    console.log('  - email_change_tokens table created');
    console.log('  - Indexes created');
  } catch (error) {
    console.error('❌ Error setting up auth migrations:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupAuthMigrations();

