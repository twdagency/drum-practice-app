/**
 * PostgreSQL Database Connection
 * Manages database connections and provides query utilities
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Database connection pool
let pool: Pool | null = null;

/**
 * Get or create database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    let connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Clean up connection string - remove any whitespace, newlines, etc.
    connectionString = connectionString.trim().replace(/\r\n/g, '').replace(/\n/g, '').replace(/\r/g, '');
    
    // Fix: If the value includes "DATABASE_URL=" prefix (parsing issue), remove it
    if (connectionString.startsWith('DATABASE_URL=')) {
      connectionString = connectionString.replace(/^DATABASE_URL=\s*/, '');
    }
    
    // Remove quotes if present
    if ((connectionString.startsWith('"') && connectionString.endsWith('"')) || 
        (connectionString.startsWith("'") && connectionString.endsWith("'"))) {
      connectionString = connectionString.slice(1, -1).trim();
    }
    
    // Debug: Log what we're getting (masked)
    if (process.env.NODE_ENV === 'development') {
      console.log('[DB Connection] DATABASE_URL length:', connectionString.length);
      console.log('[DB Connection] DATABASE_URL (first 100 chars):', JSON.stringify(connectionString.substring(0, 100)));
      console.log('[DB Connection] Starts with postgresql://:', connectionString.startsWith('postgresql://'));
      console.log('[DB Connection] Starts with postgres://:', connectionString.startsWith('postgres://'));
      console.log('[DB Connection] Contains @:', connectionString.includes('@'));
      console.log('[DB Connection] Contains supabase:', connectionString.includes('supabase'));
      console.log('[DB Connection] Contains pooler:', connectionString.includes('pooler'));
    }
    
    // Validate URL format
    if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
      console.error('[DB Connection] Invalid DATABASE_URL format');
      console.error('[DB Connection] Length:', connectionString.length);
      console.error('[DB Connection] Full value (JSON):', JSON.stringify(connectionString));
      console.error('[DB Connection] First 100 chars:', connectionString.substring(0, 100));
      if (connectionString.length > 100) {
        console.error('[DB Connection] Last 50 chars:', connectionString.substring(connectionString.length - 50));
      }
      throw new Error(`DATABASE_URL must start with postgresql:// or postgres://. Got: ${connectionString.substring(0, 50)}...`);
    }
    
    // Check if URL seems incomplete (missing @ or host)
    if (!connectionString.includes('@')) {
      console.error('[DB Connection] DATABASE_URL appears incomplete - missing @');
      console.error('[DB Connection] Full value (JSON):', JSON.stringify(connectionString));
      console.error('[DB Connection] This usually means the URL was truncated, possibly due to:');
      console.error('  1. Special characters in password that need URL encoding');
      console.error('  2. Line break in the middle of the URL in .env.local');
      console.error('  3. Next.js not loading the full value');
      throw new Error('DATABASE_URL appears to be incomplete or malformed - missing @ symbol');
    }
    
    // Check if this is a Supabase connection
    const isSupabase = connectionString.includes('supabase') || connectionString.includes('pooler');
    
    // Debug in development
    if (process.env.NODE_ENV === 'development') {
      const masked = connectionString.replace(/:\/\/[^:]+:[^@]+@/, '://****:****@');
      console.log('Creating database pool with connection:', masked);
    }
    
    pool = new Pool({
      connectionString,
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Increased to 10 seconds for Supabase
      // SSL configuration for Supabase
      ssl: isSupabase ? {
        rejectUnauthorized: false, // Supabase uses self-signed certificates
      } : false,
      // Additional settings for better reliability
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

/**
 * Execute a query
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const db = getPool();
  return db.query<T>(text, params);
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const db = getPool();
  return db.connect();
}

/**
 * Close the database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

