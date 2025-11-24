/**
 * Setup Authentication Tables
 * Creates NextAuth.js tables in the database
 * 
 * Usage: node scripts/setup-auth-tables.js
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
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^DATABASE_URL\s*=\s*(.+)$/);
      if (match) {
        let value = match[1].trim();
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
  // Ignore errors
}

async function setupAuthTables() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/drum_practice_app';
  
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set. Using default.');
  }
  
  console.log('Setting up authentication tables...');
  console.log('Connection:', databaseUrl.replace(/:[^:@]+@/, ':****@'));
  console.log('');
  
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    // Read auth schema file
    const schemaPath = path.join(__dirname, '../lib/db/auth-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Authentication tables created successfully!');
    console.log('\nTables created:');
    console.log('  - users');
    console.log('  - accounts');
    console.log('  - sessions');
    console.log('  - verification_tokens');
    console.log('\n✅ Setup complete!');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupAuthTables();

