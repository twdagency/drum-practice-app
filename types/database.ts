/**
 * Database entity types
 * These types represent the data structure returned from the database
 */

import { Pattern } from './pattern';

/**
 * Stored pattern with database metadata
 */
export interface StoredPattern extends Pattern {
  userId?: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Collection of patterns
 */
export interface Collection {
  id: string;
  name: string;
  description?: string;
  patternIds: number[];
  tags?: string[];
  userId?: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Practice progress tracking
 */
export interface PracticeProgress {
  userId: string;
  patternId: number;
  practiceType: 'midi' | 'microphone' | 'recording';
  accuracy: number;
  timing: number;
  attempts: number;
  bestAccuracy: number;
  bestTiming: number;
  lastPracticed: number;
  totalTime?: number;
  notes?: any; // JSONB field - can be any structure
}

