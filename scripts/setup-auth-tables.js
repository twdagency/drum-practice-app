/**
 * Setup Authentication Tables
 * Creates NextAuth.js tables in the database
 * 
 * Usage: node scripts/setup-auth-tables.js
 */

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load .env.local using dotenv
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

async function setupAuthTables() {
  let databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env.local');
    console.error('Please set DATABASE_URL in your .env.local file');
    console.error('');
    console.error('Debug: All env vars loaded:', Object.keys(process.env).filter(k => k.includes('DATABASE')).join(', '));
    process.exit(1);
  }
  
  // Clean up: remove any whitespace, newlines, carriage returns
  databaseUrl = databaseUrl.trim().replace(/\r\n/g, '').replace(/\n/g, '').replace(/\r/g, '');
  
  // Clean up if it includes "DATABASE_URL=" prefix (shouldn't happen with dotenv, but just in case)
  if (databaseUrl.startsWith('DATABASE_URL=')) {
    databaseUrl = databaseUrl.replace(/^DATABASE_URL=\s*/, '');
  }
  
  // Remove any quotes
  if ((databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) || 
      (databaseUrl.startsWith("'") && databaseUrl.endsWith("'"))) {
    databaseUrl = databaseUrl.slice(1, -1).trim();
  }
  
  // Validate URL format
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    console.error('❌ Invalid DATABASE_URL format');
    console.error('Current value (first 100 chars):', databaseUrl.substring(0, 100));
    console.error('Value length:', databaseUrl.length);
    console.error('Expected format: postgresql://user:password@host:port/database');
    console.error('');
    console.error('Debug info:');
    console.error('- Starts with postgresql://:', databaseUrl.startsWith('postgresql://'));
    console.error('- Starts with postgres://:', databaseUrl.startsWith('postgres://'));
    console.error('- First 20 chars:', JSON.stringify(databaseUrl.substring(0, 20)));
    console.error('');
    console.error('Make sure your .env.local has:');
    console.error('DATABASE_URL=postgresql://user:password@host:port/database');
    console.error('(No quotes, no DATABASE_URL= prefix in the value, on a single line)');
    process.exit(1);
  }
  
  console.log('Setting up authentication tables...');
  // Mask password in output
  const maskedUrl = databaseUrl.replace(/:\/\/[^:]+:[^@]+@/, '://****:****@');
  console.log('Connection:', maskedUrl);
  console.log('');
  
  const pool = new Pool({ 
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase') || databaseUrl.includes('pooler') ? { rejectUnauthorized: false } : false
  });
  
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

