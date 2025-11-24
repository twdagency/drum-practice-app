/**
 * Shared storage for API routes
 * In production, this would be replaced with a database connection
 */

import { Pattern } from '@/types/pattern';

export interface StoredPattern extends Pattern {
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  patternIds: number[];
  userId?: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

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
  totalTime: number;
  notes?: Array<{
    noteIndex: number;
    accuracy: number;
    timing: number;
    attempts: number;
  }>;
}

export interface UserProgress {
  userId: string;
  progress: PracticeProgress[];
  createdAt: number;
  updatedAt: number;
}

// In-memory storage (replace with database in production)
export const patternsStore = new Map<string, StoredPattern>();
export const collectionsStore = new Map<string, Collection>();
export const progressStore = new Map<string, UserProgress>();

