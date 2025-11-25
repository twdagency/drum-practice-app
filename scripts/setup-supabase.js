/**
 * Supabase Database Setup Script
 * Sets up all database tables on a Supabase PostgreSQL database
 * 
 * This script will:
 * 1. Create main schema (patterns, collections, progress)
 * 2. Create auth schema (users, accounts, sessions, verification_tokens)
 * 3. Create auth migrations (password_reset_tokens, email_change_tokens)
 * 
 * Usage: node scripts/setup-supabase.js
 * 
 * Make sure DATABASE_URL is set in .env.local
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
        // Remove any trailing comments
        value = value.split('#')[0].trim();
        // Ensure we don't have "DATABASE_URL=" in the value itself
        if (value.startsWith('DATABASE_URL=')) {
          value = value.replace(/^DATABASE_URL=\s*/, '');
        }
        if (value) {
          process.env.DATABASE_URL = value;
          break;
        }
      }
    }
  }
} catch (error) {
  // Ignore errors loading .env.local
}

async function setupSupabase() {
  let databaseUrl = process.env.DATABASE_URL;
  
  // Clean up the connection string if it includes "DATABASE_URL=" prefix
  if (databaseUrl && databaseUrl.startsWith('DATABASE_URL=')) {
    databaseUrl = databaseUrl.replace(/^DATABASE_URL=\s*/, '');
  }
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found!');
    console.error('');
    console.error('Please set DATABASE_URL in .env.local');
    console.error('');
    console.error('To get your Supabase connection string:');
    console.error('1. Go to Supabase Dashboard → Your Project');
    console.error('2. Navigate to Settings → Database');
    console.error('3. Copy the "Connection pooling" string (for serverless/Vercel)');
    console.error('   or "Direct connection" string (for traditional servers)');
    console.error('');
    console.error('Format: postgresql://postgres.[ref]:[password]@[host]:[port]/postgres');
    process.exit(1);
  }
  
  // Hide password in logs
  const safeUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log('🚀 Setting up Supabase database...');
  console.log('📍 Connection:', safeUrl);
  console.log('');
  
  const pool = new Pool({ 
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.com') ? { rejectUnauthorized: false } : false
  });
  
  // Helper function to execute SQL
  async function executeSQL(sql, description) {
    try {
      await pool.query(sql);
      return { success: true };
    } catch (error) {
      // Re-throw the error - let the caller handle it
      throw error;
    }
  }

  try {
    // Test connection
    console.log('🔌 Testing connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully!');
    console.log('');
    
    // 1. Main schema (patterns, collections, progress)
    console.log('📋 Creating main schema (patterns, collections, progress)...');
    const schemaPath = path.join(__dirname, '../lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await executeSQL(schema, 'main schema');
    console.log('✅ Main schema created!');
    console.log('');
    
    // 2. Auth schema (NextAuth.js tables)
    console.log('🔐 Creating auth schema (users, accounts, sessions)...');
    const authSchemaPath = path.join(__dirname, '../lib/db/auth-schema.sql');
    const authSchema = fs.readFileSync(authSchemaPath, 'utf-8');
    await executeSQL(authSchema, 'auth schema');
    console.log('✅ Auth schema created!');
    console.log('');
    
    // 3. Auth migrations (password reset, email change)
    console.log('📧 Creating auth migrations (password reset, email change)...');
    const authMigrationsPath = path.join(__dirname, '../lib/db/auth-migrations.sql');
    const authMigrations = fs.readFileSync(authMigrationsPath, 'utf-8');
    await executeSQL(authMigrations, 'auth migrations');
    console.log('✅ Auth migrations created!');
    console.log('');
    
    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${table}`);
    });
    console.log('');
    
    console.log('🎉 Supabase database setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Deploy your application to Vercel (or another hosting service)');
    console.log('2. Add DATABASE_URL and other environment variables to your hosting platform');
    console.log('3. Your app is ready to use!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('💡 Tip: Make sure your Supabase database is accessible.');
      console.error('   Check your connection string and network settings.');
    } else if (error.code === '28P01') {
      console.error('');
      console.error('💡 Tip: Authentication failed. Check your database password.');
    } else if (error.message.includes('already exists')) {
      console.error('');
      console.error('💡 Tip: Some tables may already exist. This is okay if you\'re re-running setup.');
      console.error('   The script will continue, but you may see errors for existing tables.');
    }
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupSupabase();

