/**
 * Test Database Fixtures
 * Provides sample data for testing
 */

import { Pattern } from '@/types/pattern';
import { testQuery } from './testDb';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

/**
 * Create a test user
 */
export async function createTestUser(overrides: {
  id?: string;
  email?: string;
  name?: string;
  password?: string;
  emailVerified?: Date;
} = {}): Promise<{
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  emailVerified: Date | null;
}> {
  const id = overrides.id || uuidv4();
  const email = overrides.email || `test-${Date.now()}@example.com`;
  const name = overrides.name || 'Test User';
  const password = overrides.password || 'testpassword123';
  const passwordHash = await bcrypt.hash(password, 10);
  const emailVerified = overrides.emailVerified || null;

  await testQuery(
    `INSERT INTO users (id, email, name, password_hash, "emailVerified", created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [id, email, name, passwordHash, emailVerified]
  );

  return {
    id,
    email,
    name,
    password_hash: passwordHash,
    emailVerified,
  };
}

/**
 * Create a test pattern
 */
export async function createTestPattern(overrides: {
  id?: number;
  userId?: string;
  timeSignature?: string;
  subdivision?: number;
  phrase?: string;
  drumPattern?: string;
  stickingPattern?: string;
} = {}): Promise<Pattern> {
  const userId = overrides.userId || uuidv4();
  const pattern: Pattern = {
    id: overrides.id || Math.floor(Math.random() * 1000000),
    timeSignature: overrides.timeSignature || '4/4',
    subdivision: overrides.subdivision || 16,
    phrase: overrides.phrase || '4 4 4 4',
    drumPattern: overrides.drumPattern || 'S K S K',
    stickingPattern: overrides.stickingPattern || 'R L R L',
    repeat: 1,
    leftFoot: false,
    rightFoot: false,
    accents: [],
    notes: ['S', 'K', 'S', 'K'],
  };

  await testQuery(
    `INSERT INTO patterns (
      id, user_id, time_signature, subdivision, phrase, drum_pattern, 
      sticking_pattern, left_foot, right_foot, repeat_count, pattern_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      pattern.id,
      userId,
      pattern.timeSignature,
      pattern.subdivision,
      pattern.phrase,
      pattern.drumPattern,
      pattern.stickingPattern,
      pattern.leftFoot,
      pattern.rightFoot,
      pattern.repeat,
      JSON.stringify(pattern),
    ]
  );

  return pattern;
}

/**
 * Create a test collection
 */
export async function createTestCollection(overrides: {
  id?: string;
  userId?: string;
  name?: string;
  description?: string;
  patternIds?: number[];
  tags?: string[];
} = {}): Promise<{
  id: string;
  userId: string;
  name: string;
  description: string | null;
  patternIds: number[];
  tags: string[];
}> {
  const id = overrides.id || `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const userId = overrides.userId || uuidv4();
  const name = overrides.name || 'Test Collection';
  const description = overrides.description || null;
  const patternIds = overrides.patternIds || [];
  const tags = overrides.tags || [];

  await testQuery(
    `INSERT INTO collections (id, user_id, name, description, pattern_ids, tags, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [id, userId, name, description, patternIds, tags]
  );

  return {
    id,
    userId,
    name,
    description,
    patternIds,
    tags,
  };
}

/**
 * Create test progress entry
 */
export async function createTestProgress(overrides: {
  userId?: string;
  patternId?: number;
  practiceType?: 'midi' | 'microphone' | 'recording';
  accuracy?: number;
  timing?: number;
  totalTime?: number;
} = {}): Promise<{
  id: number;
  userId: string;
  patternId: number;
  practiceType: string;
  accuracy: number;
  timing: number;
  totalTime: number;
}> {
  const userId = overrides.userId || uuidv4();
  const patternId = overrides.patternId || 1;
  const practiceType = overrides.practiceType || 'midi';
  const accuracy = overrides.accuracy || 85.5;
  const timing = overrides.timing || 90.0;
  const totalTime = overrides.totalTime || 300;

  const result = await testQuery(
    `INSERT INTO progress (
      user_id, pattern_id, practice_type, accuracy, timing, total_time, 
      attempts, best_accuracy, best_timing, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 1, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id`,
    [userId, patternId, practiceType, accuracy, timing, totalTime]
  );

  return {
    id: result.rows[0].id,
    userId,
    patternId,
    practiceType,
    accuracy,
    timing,
    totalTime,
  };
}

/**
 * Get a test user by email
 */
export async function getTestUserByEmail(email: string): Promise<{
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  emailVerified: Date | null;
} | null> {
  const result = await testQuery(
    'SELECT id, email, name, password_hash, "emailVerified" FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Get a test pattern by ID
 */
export async function getTestPatternById(id: number): Promise<Pattern | null> {
  const result = await testQuery(
    'SELECT pattern_data FROM patterns WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].pattern_data as Pattern;
}

/**
 * Create multiple test patterns
 */
export async function createTestPatterns(
  count: number,
  userId?: string
): Promise<Pattern[]> {
  const patterns: Pattern[] = [];
  
  for (let i = 0; i < count; i++) {
    const pattern = await createTestPattern({
      userId: userId || uuidv4(),
      timeSignature: '4/4',
      subdivision: 16,
      phrase: '4 4 4 4',
      drumPattern: `S K S K ${i}`,
    });
    patterns.push(pattern);
  }
  
  return patterns;
}

