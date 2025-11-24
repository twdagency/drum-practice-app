/**
 * Test Database Utilities
 * Provides utilities for setting up and tearing down test database
 */

import { Pool, QueryResult } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

let testPool: Pool | null = null;

/**
 * Get test database connection pool
 * Uses TEST_DATABASE_URL if set, otherwise uses DATABASE_URL with _test suffix
 */
export function getTestPool(): Pool {
  if (!testPool) {
    const connectionString = process.env.TEST_DATABASE_URL || 
      process.env.DATABASE_URL?.replace(/\/[^/]+$/, '/drum_practice_test');
    
    if (!connectionString) {
      throw new Error('TEST_DATABASE_URL or DATABASE_URL environment variable is not set');
    }

    testPool = new Pool({
      connectionString,
      max: 5, // Smaller pool for tests
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 2000,
    });

    testPool.on('error', (err) => {
      console.error('Unexpected error on test database client', err);
    });
  }

  return testPool;
}

/**
 * Execute a query on test database
 */
export async function testQuery<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const db = getTestPool();
  return db.query<T>(text, params);
}

/**
 * Setup test database schema
 */
export async function setupTestDatabase(): Promise<void> {
  const db = getTestPool();
  
  try {
    // Read schema file
    const schemaPath = join(process.cwd(), 'lib', 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute schema
    await db.query(schema);
    
    // Read auth schema if it exists
    try {
      const authSchemaPath = join(process.cwd(), 'lib', 'db', 'auth-schema.sql');
      const authSchema = readFileSync(authSchemaPath, 'utf-8');
      await db.query(authSchema);
    } catch (error) {
      // Auth schema might not exist, that's okay
      console.warn('Auth schema not found, skipping');
    }
    
    // Read auth migrations if they exist
    try {
      const authMigrationsPath = join(process.cwd(), 'lib', 'db', 'auth-migrations.sql');
      const authMigrations = readFileSync(authMigrationsPath, 'utf-8');
      await db.query(authMigrations);
    } catch (error) {
      // Auth migrations might not exist, that's okay
      console.warn('Auth migrations not found, skipping');
    }
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

/**
 * Clean test database (truncate all tables)
 */
export async function cleanTestDatabase(): Promise<void> {
  const db = getTestPool();
  
  try {
    // Truncate all tables in reverse order of dependencies
    await db.query('TRUNCATE TABLE progress CASCADE');
    await db.query('TRUNCATE TABLE collections CASCADE');
    await db.query('TRUNCATE TABLE patterns CASCADE');
    await db.query('TRUNCATE TABLE password_reset_tokens CASCADE');
    await db.query('TRUNCATE TABLE email_change_tokens CASCADE');
    await db.query('TRUNCATE TABLE verification_tokens CASCADE');
    await db.query('TRUNCATE TABLE accounts CASCADE');
    await db.query('TRUNCATE TABLE sessions CASCADE');
    await db.query('TRUNCATE TABLE users CASCADE');
  } catch (error) {
    // Some tables might not exist, that's okay
    console.warn('Error cleaning test database (some tables may not exist):', error);
  }
}

/**
 * Drop test database schema (for complete reset)
 */
export async function dropTestDatabase(): Promise<void> {
  const db = getTestPool();
  
  try {
    await db.query('DROP TABLE IF EXISTS progress CASCADE');
    await db.query('DROP TABLE IF EXISTS collections CASCADE');
    await db.query('DROP TABLE IF EXISTS patterns CASCADE');
    await db.query('DROP TABLE IF EXISTS password_reset_tokens CASCADE');
    await db.query('DROP TABLE IF EXISTS email_change_tokens CASCADE');
    await db.query('DROP TABLE IF EXISTS verification_tokens CASCADE');
    await db.query('DROP TABLE IF EXISTS accounts CASCADE');
    await db.query('DROP TABLE IF EXISTS sessions CASCADE');
    await db.query('DROP TABLE IF EXISTS users CASCADE');
  } catch (error) {
    console.error('Error dropping test database:', error);
    throw error;
  }
}

/**
 * Close test database connection pool
 */
export async function closeTestPool(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

/**
 * Reset test database (clean and setup)
 */
export async function resetTestDatabase(): Promise<void> {
  await cleanTestDatabase();
  // Schema should already be set up, but we can verify
}

