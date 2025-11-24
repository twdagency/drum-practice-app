/**
 * Database operations for collections
 */

import { query } from './connection';
import { Collection } from '../api/storage';

/**
 * Convert database row to Collection
 */
function rowToCollection(row: any): Collection {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    patternIds: row.pattern_ids || [],
    tags: row.tags || [],
    userId: row.user_id || undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

/**
 * Get all collections
 */
export async function getAllCollections(userId?: string): Promise<Collection[]> {
  let result;
  if (userId) {
    result = await query(
      'SELECT * FROM collections WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
  } else {
    result = await query('SELECT * FROM collections ORDER BY created_at DESC');
  }
  
  return result.rows.map(rowToCollection);
}

/**
 * Get collection by ID
 */
export async function getCollectionById(id: string): Promise<Collection | null> {
  const result = await query('SELECT * FROM collections WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return rowToCollection(result.rows[0]);
}

/**
 * Create collection
 */
export async function createCollection(data: {
  id: string;
  name: string;
  description?: string;
  patternIds: number[];
  tags?: string[];
  userId?: string;
}): Promise<Collection> {
  const result = await query(`
    INSERT INTO collections (id, user_id, name, description, pattern_ids, tags)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    data.id,
    data.userId || null,
    data.name,
    data.description || null,
    data.patternIds,
    data.tags || [],
  ]);
  
  return rowToCollection(result.rows[0]);
}

/**
 * Update collection
 */
export async function updateCollection(
  id: string,
  updates: {
    name?: string;
    description?: string;
    patternIds?: number[];
    tags?: string[];
    userId?: string;
  }
): Promise<Collection> {
  const existing = await getCollectionById(id);
  if (!existing) {
    throw new Error('Collection not found');
  }
  
  const result = await query(`
    UPDATE collections SET
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      pattern_ids = COALESCE($4, pattern_ids),
      tags = COALESCE($5, tags),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `, [
    id,
    updates.name,
    updates.description,
    updates.patternIds,
    updates.tags,
  ]);
  
  return rowToCollection(result.rows[0]);
}

/**
 * Delete collection
 */
export async function deleteCollection(id: string, userId?: string): Promise<void> {
  if (userId) {
    const result = await query(
      'DELETE FROM collections WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rowCount === 0) {
      throw new Error('Collection not found or unauthorized');
    }
  } else {
    const result = await query('DELETE FROM collections WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new Error('Collection not found');
    }
  }
}

