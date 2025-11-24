/**
 * Create Database Script
 * Creates the database if it doesn't exist
 * 
 * Usage: node scripts/create-database.js
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
  console.error('Warning: Could not load .env.local:', error.message);
}

async function createDatabase() {
  const dbName = process.env.DATABASE_NAME || 'drum_practice_app';
  
  // Get database URL from environment
  let databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found!');
    console.error('');
    console.error('Please create a .env.local file with:');
    console.error('DATABASE_URL=postgresql://postgres:your_password@localhost:5432/drum_practice_app');
    console.error('');
    console.error('Replace "your_password" with your actual PostgreSQL password.');
    process.exit(1);
  }
  
  // Extract connection info and connect to 'postgres' database to create our database
  const urlParts = databaseUrl.match(/^(postgresql:\/\/[^\/]+)\/(.+)$/);
  if (!urlParts) {
    console.error('❌ Invalid DATABASE_URL format');
    console.error('Expected format: postgresql://username:password@host:port/database_name');
    process.exit(1);
  }
  
  const baseUrl = urlParts[1];
  const targetDbName = urlParts[2];
  
  // Connect to 'postgres' database (default PostgreSQL database)
  const adminUrl = `${baseUrl}/postgres`;
  
  console.log('Connecting to PostgreSQL...');
  console.log('Connection:', adminUrl.replace(/:[^:@]+@/, ':****@'));
  console.log(`Creating database: ${targetDbName}`);
  console.log('');
  
  const pool = new Pool({ connectionString: adminUrl });
  
  try {
    // Check if database exists
    const checkResult = await pool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDbName]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`✅ Database "${targetDbName}" already exists!`);
      console.log('You can proceed to run: npm run db:setup');
      return;
    }
    
    // Create database (note: cannot use parameterized query for database name)
    // Escape database name to prevent SQL injection
    const escapedDbName = targetDbName.replace(/"/g, '""');
    await pool.query(`CREATE DATABASE "${escapedDbName}"`);
    
    console.log(`✅ Database "${targetDbName}" created successfully!`);
    console.log('\nNext step:');
    console.log('Run: npm run db:setup');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`✅ Database "${targetDbName}" already exists!`);
      console.log('You can proceed to run: npm run db:setup');
    } else {
      console.error('❌ Error creating database:', error.message);
      console.error('\nTroubleshooting:');
      console.error('1. Make sure PostgreSQL is running');
      console.error('2. Check your DATABASE_URL in .env.local');
      console.error('3. Verify your PostgreSQL username and password');
      console.error('4. Make sure the user has permission to create databases');
      console.error('\nExample .env.local:');
      console.error('DATABASE_URL=postgresql://postgres:your_password@localhost:5432/drum_practice_app');
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

createDatabase();

