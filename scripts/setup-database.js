/**
 * Database Setup Script
 * Creates database and runs migrations
 * 
 * Usage: node scripts/setup-database.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Try to load .env.local
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envLines = envContent.split('\n');
    for (const line of envLines) {
      // Skip comments and empty lines
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Match DATABASE_URL=value (with or without quotes)
      const match = trimmed.match(/^DATABASE_URL\s*=\s*(.+)$/);
      if (match) {
        let value = match[1].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env.DATABASE_URL = value;
        break;
      }
    }
  }
} catch (error) {
  // Ignore errors loading .env.local
}

async function setupDatabase() {
  // Get database URL from environment or use default
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/drum_practice_app';
  
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set in environment variables.');
    console.warn('Using default connection string. Make sure to set DATABASE_URL in .env.local');
    console.warn('');
  }
  
  console.log('Setting up database...');
  console.log('Connection:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
  console.log('');
  
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '../lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Database schema created successfully!');
    console.log('\nTables created:');
    console.log('  - patterns');
    console.log('  - collections');
    console.log('  - progress');
    console.log('\n✅ Setup complete!');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();

