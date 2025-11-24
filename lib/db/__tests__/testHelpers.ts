/**
 * Test Database Helpers
 * Utility functions for test database operations
 */

import { testQuery } from './testDb';
import { Pattern } from '@/types/pattern';

/**
 * Check if a table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await testQuery(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    );
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
}

/**
 * Get row count for a table
 */
export async function getRowCount(tableName: string): Promise<number> {
  try {
    const result = await testQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    return 0;
  }
}

/**
 * Get all patterns for a user
 */
export async function getUserPatterns(userId: string): Promise<Pattern[]> {
  const result = await testQuery(
    'SELECT pattern_data FROM patterns WHERE user_id = $1 ORDER BY id',
    [userId]
  );
  
  return result.rows.map(row => row.pattern_data as Pattern);
}

/**
 * Get all collections for a user
 */
export async function getUserCollections(userId: string): Promise<any[]> {
  const result = await testQuery(
    'SELECT * FROM collections WHERE user_id = $1 ORDER BY created_at',
    [userId]
  );
  
  return result.rows;
}

/**
 * Get all progress entries for a user
 */
export async function getUserProgress(userId: string): Promise<any[]> {
  const result = await testQuery(
    'SELECT * FROM progress WHERE user_id = $1 ORDER BY created_at',
    [userId]
  );
  
  return result.rows;
}

/**
 * Delete a user and all their data
 */
export async function deleteUser(userId: string): Promise<void> {
  // Delete in order of dependencies
  await testQuery('DELETE FROM progress WHERE user_id = $1', [userId]);
  await testQuery('DELETE FROM collections WHERE user_id = $1', [userId]);
  await testQuery('DELETE FROM patterns WHERE user_id = $1', [userId]);
  await testQuery('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
  await testQuery('DELETE FROM email_change_tokens WHERE user_id = $1', [userId]);
  await testQuery('DELETE FROM verification_tokens WHERE identifier IN (SELECT email FROM users WHERE id = $1)', [userId]);
  await testQuery('DELETE FROM accounts WHERE "userId" = $1', [userId]);
  await testQuery('DELETE FROM sessions WHERE "userId" = $1', [userId]);
  await testQuery('DELETE FROM users WHERE id = $1', [userId]);
}

/**
 * Verify database schema is set up correctly
 */
export async function verifySchema(): Promise<{
  valid: boolean;
  missingTables: string[];
}> {
  const requiredTables = [
    'users',
    'patterns',
    'collections',
    'progress',
    'accounts',
    'sessions',
    'verification_tokens',
  ];
  
  const missingTables: string[] = [];
  
  for (const table of requiredTables) {
    const exists = await tableExists(table);
    if (!exists) {
      missingTables.push(table);
    }
  }
  
  return {
    valid: missingTables.length === 0,
    missingTables,
  };
}

