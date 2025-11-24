/**
 * Database operations for patterns
 */

import { query } from './connection';
import { Pattern } from '@/types/pattern';
import { StoredPattern } from '../api/storage';

/**
 * Convert database row to Pattern
 */
function rowToPattern(row: any): StoredPattern {
  return {
    id: Number(row.id),
    timeSignature: row.time_signature,
    subdivision: row.subdivision,
    phrase: row.phrase,
    drumPattern: row.drum_pattern,
    stickingPattern: row.sticking_pattern || '',
    leftFoot: row.left_foot || false,
    rightFoot: row.right_foot || false,
    repeat: row.repeat_count || 1,
    _advancedMode: row.advanced_mode || false,
    _perBeatSubdivisions: row.per_beat_subdivisions,
    _perBeatVoicing: row.per_beat_voicing,
    _perBeatSticking: row.per_beat_sticking,
    _polyrhythmRightNotes: row.polyrhythm_right_notes,
    _polyrhythmLeftNotes: row.polyrhythm_left_notes,
    _presetAccents: row.preset_accents,
    userId: row.user_id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

/**
 * Convert Pattern to database row
 */
function patternToRow(pattern: Pattern, userId?: string): any {
  return {
    id: pattern.id,
    user_id: userId || null,
    time_signature: pattern.timeSignature,
    subdivision: pattern.subdivision,
    phrase: pattern.phrase,
    drum_pattern: pattern.drumPattern,
    sticking_pattern: pattern.stickingPattern || '',
    left_foot: pattern.leftFoot || false,
    right_foot: pattern.rightFoot || false,
    repeat_count: pattern.repeat || 1,
    advanced_mode: pattern._advancedMode || false,
    per_beat_subdivisions: pattern._perBeatSubdivisions || null,
    per_beat_voicing: pattern._perBeatVoicing || null,
    per_beat_sticking: pattern._perBeatSticking || null,
    polyrhythm_right_notes: pattern._polyrhythmRightNotes || null,
    polyrhythm_left_notes: pattern._polyrhythmLeftNotes || null,
    preset_accents: pattern._presetAccents || null,
    pattern_data: JSON.stringify(pattern), // Store full object as backup
  };
}

/**
 * Get all patterns
 */
export async function getAllPatterns(userId?: string): Promise<StoredPattern[]> {
  let result;
  if (userId) {
    result = await query(
      'SELECT * FROM patterns WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
  } else {
    result = await query('SELECT * FROM patterns ORDER BY created_at DESC');
  }
  
  return result.rows.map(rowToPattern);
}

/**
 * Get pattern by ID
 */
export async function getPatternById(id: number | string): Promise<StoredPattern | null> {
  const result = await query('SELECT * FROM patterns WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return rowToPattern(result.rows[0]);
}

/**
 * Create pattern
 */
export async function createPattern(pattern: Pattern, userId?: string): Promise<StoredPattern> {
  // If pattern has an ID, use it; otherwise let database generate one
  const useId = pattern.id ? Number(pattern.id) : null;
  
  const row = patternToRow(pattern, userId);
  
  if (useId) {
    // Insert with specific ID
    const result = await query(`
      INSERT INTO patterns (
        id, user_id, time_signature, subdivision, phrase, drum_pattern,
        sticking_pattern, left_foot, right_foot, repeat_count,
        advanced_mode, per_beat_subdivisions, per_beat_voicing, per_beat_sticking,
        polyrhythm_right_notes, polyrhythm_left_notes, preset_accents, pattern_data
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *
    `, [
      useId,
      row.user_id,
      row.time_signature,
      row.subdivision,
      row.phrase,
      row.drum_pattern,
      row.sticking_pattern,
      row.left_foot,
      row.right_foot,
      row.repeat_count,
      row.advanced_mode,
      row.per_beat_subdivisions,
      row.per_beat_voicing,
      row.per_beat_sticking,
      row.polyrhythm_right_notes,
      row.polyrhythm_left_notes,
      row.preset_accents,
      row.pattern_data,
    ]);
    
    return rowToPattern(result.rows[0]);
  } else {
    // Let database generate ID
    const result = await query(`
      INSERT INTO patterns (
        user_id, time_signature, subdivision, phrase, drum_pattern,
        sticking_pattern, left_foot, right_foot, repeat_count,
        advanced_mode, per_beat_subdivisions, per_beat_voicing, per_beat_sticking,
        polyrhythm_right_notes, polyrhythm_left_notes, preset_accents, pattern_data
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *
    `, [
      row.user_id,
      row.time_signature,
      row.subdivision,
      row.phrase,
      row.drum_pattern,
      row.sticking_pattern,
      row.left_foot,
      row.right_foot,
      row.repeat_count,
      row.advanced_mode,
      row.per_beat_subdivisions,
      row.per_beat_voicing,
      row.per_beat_sticking,
      row.polyrhythm_right_notes,
      row.polyrhythm_left_notes,
      row.preset_accents,
      row.pattern_data,
    ]);
    
    return rowToPattern(result.rows[0]);
  }
}

/**
 * Update pattern
 */
export async function updatePattern(
  id: number | string,
  updates: Partial<Pattern>,
  userId?: string
): Promise<StoredPattern> {
  // Get existing pattern
  const existing = await getPatternById(id);
  if (!existing) {
    throw new Error('Pattern not found');
  }
  
  // Merge updates
  const updated = { ...existing, ...updates };
  const row = patternToRow(updated, userId || existing.userId);
  
  const result = await query(`
    UPDATE patterns SET
      time_signature = $2,
      subdivision = $3,
      phrase = $4,
      drum_pattern = $5,
      sticking_pattern = $6,
      left_foot = $7,
      right_foot = $8,
      repeat_count = $9,
      advanced_mode = $10,
      per_beat_subdivisions = $11,
      per_beat_voicing = $12,
      per_beat_sticking = $13,
      polyrhythm_right_notes = $14,
      polyrhythm_left_notes = $15,
      preset_accents = $16,
      pattern_data = $17,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `, [
    id,
    row.time_signature,
    row.subdivision,
    row.phrase,
    row.drum_pattern,
    row.sticking_pattern,
    row.left_foot,
    row.right_foot,
    row.repeat_count,
    row.advanced_mode,
    row.per_beat_subdivisions,
    row.per_beat_voicing,
    row.per_beat_sticking,
    row.polyrhythm_right_notes,
    row.polyrhythm_left_notes,
    row.preset_accents,
    row.pattern_data,
  ]);
  
  return rowToPattern(result.rows[0]);
}

/**
 * Delete pattern
 */
export async function deletePattern(id: number | string, userId?: string): Promise<void> {
  if (userId) {
    const result = await query(
      'DELETE FROM patterns WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rowCount === 0) {
      throw new Error('Pattern not found or unauthorized');
    }
  } else {
    const result = await query('DELETE FROM patterns WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new Error('Pattern not found');
    }
  }
}

