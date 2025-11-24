/**
 * Test PostgreSQL Connection
 * Tests if we can connect to PostgreSQL with the credentials in .env.local
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env.local
let databaseUrl = '';
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^DATABASE_URL\s*=\s*(.+)$/);
      if (match) {
        databaseUrl = match[1].trim();
        // Remove quotes
        if ((databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) || 
            (databaseUrl.startsWith("'") && databaseUrl.endsWith("'"))) {
          databaseUrl = databaseUrl.slice(1, -1);
        }
        break;
      }
    }
  }
} catch (error) {
  console.error('Error reading .env.local:', error.message);
  process.exit(1);
}

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

if (databaseUrl.includes('your_password')) {
  console.error('❌ Please update .env.local with your actual PostgreSQL password');
  console.error('   Replace "your_password" with your real password');
  process.exit(1);
}

// Connect to 'postgres' database to test
const testUrl = databaseUrl.replace(/\/[^\/]+$/, '/postgres');
const pool = new Pool({ connectionString: testUrl });

console.log('Testing PostgreSQL connection...');
console.log('Connection:', testUrl.replace(/:[^:@]+@/, ':****@'));
console.log('');

pool.query('SELECT version()')
  .then(result => {
    const version = result.rows[0].version;
    console.log('✅ Connection successful!');
    console.log('PostgreSQL version:', version);
    console.log('');
    console.log('You can now run: npm run db:create');
    pool.end();
  })
  .catch(error => {
    console.error('❌ Connection failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check that PostgreSQL 18 is running');
    console.error('2. Verify your password in .env.local is correct');
    console.error('3. Check that the username is correct (default: postgres)');
    console.error('4. Verify PostgreSQL is listening on localhost:5432');
    pool.end();
    process.exit(1);
  });

