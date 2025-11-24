/**
 * Database Migrations
 * Run database schema migrations
 */

import { query } from './connection';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    console.log('Running database migrations...');
    
    // Read schema file
    const schemaPath = join(process.cwd(), 'lib/db/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute schema (PostgreSQL supports multiple statements)
    await query(schema);
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Check if tables exist
 */
export async function tablesExist(): Promise<boolean> {
  try {
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('patterns', 'collections', 'progress')
      );
    `);
    return result.rows[0]?.exists || false;
  } catch {
    return false;
  }
}

