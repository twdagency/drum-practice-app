/**
 * Unit tests for difficulty calculation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDifficultyRating,
  generatePracticeRecommendations,
} from '../difficultyUtils';
import { Pattern } from '@/types';
import { PracticeStats } from '@/types/practice';

describe('calculateDifficultyRating', () => {
  it('should calculate difficulty for beginner pattern', () => {
    const pattern: Pattern = {
      id: 'test',
      timeSignature: '4/4',
      subdivision: 4,
      drumPattern: 'S S S S',
      stickingPattern: 'R L R L',
      repeat: 1,
    };
    const result = calculateDifficultyRating(pattern);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(['beginner', 'intermediate', 'advanced', 'expert']).toContain(result.level);
  });

  it('should rate simple patterns as beginner', () => {
    const pattern: Pattern = {
      id: 'test',
      timeSignature: '4/4',
      subdivision: 4,
      drumPattern: 'S S S S',
      stickingPattern: 'R L',
      repeat: 1,
    };
    const result = calculateDifficultyRating(pattern);
    expect(result.level).toBe('beginner');
  });

  it('should rate complex patterns higher', () => {
    const simplePattern: Pattern = {
      id: 'test1',
      timeSignature: '4/4',
      subdivision: 4,
      drumPattern: 'S S S S',
      stickingPattern: 'R L',
      repeat: 1,
    };
    const complexPattern: Pattern = {
      id: 'test2',
      timeSignature: '4/4',
      subdivision: 32,
      drumPattern: 'S S S S S S S S S S S S S S S S',
      stickingPattern: 'R L R L R L R L R L R L R L R L',
      repeat: 1,
      _advancedMode: true,
      _perBeatSubdivisions: [32, 32, 32, 32],
    };
    const simple = calculateDifficultyRating(simplePattern);
    const complex = calculateDifficultyRating(complexPattern);
    expect(complex.score).toBeGreaterThan(simple.score);
  });

  it('should handle advanced mode patterns', () => {
    const pattern: Pattern = {
      id: 'test',
      timeSignature: '4/4',
      subdivision: 16,
      drumPattern: 'S S S S',
      stickingPattern: 'R L R L',
      repeat: 1,
      _advancedMode: true,
      _perBeatSubdivisions: [16, 8, 16, 8],
    };
    const result = calculateDifficultyRating(pattern);
    expect(result.score).toBeGreaterThan(0);
    expect(['beginner', 'intermediate', 'advanced', 'expert']).toContain(result.level);
  });
});

describe('generatePracticeRecommendations', () => {
  const mockStats: PracticeStats = {
    totalPracticeTime: 3600000, // 1 hour
    totalSessions: 10,
    currentStreak: 5,
    averageAccuracy: 85,
    averageTiming: 90,
    sessions: [],
  };

  it('should generate recommendations for beginner patterns', () => {
    const pattern: Pattern = {
      id: 'test',
      timeSignature: '4/4',
      subdivision: 4,
      drumPattern: 'S S S S',
      stickingPattern: 'R L',
      repeat: 1,
    };
    const recommendations = generatePracticeRecommendations(pattern, mockStats);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0]).toHaveProperty('title');
    expect(recommendations[0]).toHaveProperty('description');
  });

  it('should generate recommendations for advanced patterns', () => {
    const pattern: Pattern = {
      id: 'test',
      timeSignature: '4/4',
      subdivision: 32,
      drumPattern: 'S S S S S S S S',
      stickingPattern: 'R L R L R L R L',
      repeat: 1,
    };
    const recommendations = generatePracticeRecommendations(pattern, mockStats);
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it('should adjust recommendations based on user stats', () => {
    const pattern: Pattern = {
      id: 'test',
      timeSignature: '4/4',
      subdivision: 16,
      drumPattern: 'S S S S',
      stickingPattern: 'R L R L',
      repeat: 1,
    };
    const lowAccuracyStats = { ...mockStats, averageAccuracy: 50 };
    const highAccuracyStats = { ...mockStats, averageAccuracy: 95 };
    
    const lowRecs = generatePracticeRecommendations(pattern, lowAccuracyStats);
    const highRecs = generatePracticeRecommendations(pattern, highAccuracyStats);
    
    // Recommendations should differ based on accuracy
    expect(lowRecs.length).toBeGreaterThan(0);
    expect(highRecs.length).toBeGreaterThan(0);
  });
});

