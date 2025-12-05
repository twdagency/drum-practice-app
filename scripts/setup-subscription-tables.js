/**
 * Setup subscription tables
 * Run with: node scripts/setup-subscription-tables.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupSubscriptionTables() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('Make sure you have a .env.local file with DATABASE_URL set');
    process.exit(1);
  }

  console.log('🔄 Connecting to database...');
  
  const pool = new Pool({ connectionString });

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'lib', 'db', 'subscription-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Running subscription schema migration...');
    
    await pool.query(sql);
    
    console.log('✅ Subscription tables created successfully!');
    console.log('');
    console.log('Tables created/updated:');
    console.log('  - subscriptions (new)');
    console.log('  - users.stripe_customer_id column (added if not exists)');
    
  } catch (error) {
    console.error('❌ Error setting up subscription tables:', error.message);
    
    if (error.message.includes('relation "users" does not exist')) {
      console.log('');
      console.log('💡 You need to run the auth tables setup first:');
      console.log('   npm run db:auth');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupSubscriptionTables();

