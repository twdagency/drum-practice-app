/**
 * Database operations for progress
 */

import { query } from './connection';
import { PracticeProgress } from '@/types/database';

/**
 * Convert database row to PracticeProgress
 */
function rowToProgress(row: any): PracticeProgress {
  return {
    userId: row.user_id,
    patternId: Number(row.pattern_id),
    practiceType: row.practice_type,
    accuracy: Number(row.accuracy),
    timing: Number(row.timing),
    attempts: row.attempts,
    bestAccuracy: Number(row.best_accuracy),
    bestTiming: Number(row.best_timing),
    lastPracticed: new Date(row.last_practiced).getTime(),
    totalTime: row.total_time,
    notes: row.notes ? JSON.parse(JSON.stringify(row.notes)) : undefined,
  };
}

/**
 * Get user progress
 */
export async function getUserProgress(
  userId: string,
  options?: {
    patternId?: number;
    practiceType?: 'midi' | 'microphone' | 'recording';
  }
): Promise<PracticeProgress[]> {
  let queryText = 'SELECT * FROM progress WHERE user_id = $1';
  const params: any[] = [userId];
  let paramIndex = 2;
  
  if (options?.patternId) {
    queryText += ` AND pattern_id = $${paramIndex}`;
    params.push(options.patternId);
    paramIndex++;
  }
  
  if (options?.practiceType) {
    queryText += ` AND practice_type = $${paramIndex}`;
    params.push(options.practiceType);
  }
  
  queryText += ' ORDER BY last_practiced DESC';
  
  const result = await query(queryText, params);
  return result.rows.map(rowToProgress);
}

/**
 * Save or update progress
 */
export async function saveProgress(data: {
  userId: string;
  patternId: number;
  practiceType: 'midi' | 'microphone' | 'recording';
  accuracy?: number;
  timing?: number;
  notes?: Array<{
    noteIndex: number;
    accuracy: number;
    timing: number;
    attempts: number;
  }>;
  totalTime?: number;
}): Promise<PracticeProgress> {
  // Check if progress exists
  const existing = await query(
    'SELECT * FROM progress WHERE user_id = $1 AND pattern_id = $2 AND practice_type = $3',
    [data.userId, data.patternId, data.practiceType]
  );
  
  if (existing.rows.length > 0) {
    // Update existing
    const current = existing.rows[0];
    const newAttempts = current.attempts + 1;
    const newAccuracy = data.accuracy !== undefined ? data.accuracy : current.accuracy;
    const newTiming = data.timing !== undefined ? data.timing : current.timing;
    const newBestAccuracy = Math.max(Number(current.best_accuracy), newAccuracy);
    const newBestTiming = Math.max(Number(current.best_timing), newTiming);
    const newTotalTime = (current.total_time || 0) + (data.totalTime || 0);
    
    const result = await query(`
      UPDATE progress SET
        accuracy = $4,
        timing = $5,
        attempts = $6,
        best_accuracy = $7,
        best_timing = $8,
        last_practiced = CURRENT_TIMESTAMP,
        total_time = $9,
        notes = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND pattern_id = $2 AND practice_type = $3
      RETURNING *
    `, [
      data.userId,
      data.patternId,
      data.practiceType,
      newAccuracy,
      newTiming,
      newAttempts,
      newBestAccuracy,
      newBestTiming,
      newTotalTime,
      data.notes ? JSON.stringify(data.notes) : null,
    ]);
    
    return rowToProgress(result.rows[0]);
  } else {
    // Create new
    const result = await query(`
      INSERT INTO progress (
        user_id, pattern_id, practice_type, accuracy, timing, attempts,
        best_accuracy, best_timing, total_time, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      data.userId,
      data.patternId,
      data.practiceType,
      data.accuracy || 0,
      data.timing || 0,
      1,
      data.accuracy || 0,
      data.timing || 0,
      data.totalTime || 0,
      data.notes ? JSON.stringify(data.notes) : null,
    ]);
    
    return rowToProgress(result.rows[0]);
  }
}

