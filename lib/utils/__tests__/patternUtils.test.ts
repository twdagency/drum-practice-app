/**
 * Unit tests for pattern utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  parseTokens,
  parseNumberList,
  formatList,
  parseTimeSignature,
  calculateNotesPerBar,
  getNotesPerBarForPattern,
  calculateNotesPerBarFromPerBeatSubdivisions,
  calculateNotePositionsFromPerBeatSubdivisions,
  createDefaultPattern,
  calculatePatternComplexity,
  buildAccentIndices,
  buildPhraseFromAccents,
  randomizeAccents,
  generateStickingForDrumPattern,
} from '../patternUtils';
import { Pattern } from '@/types';

describe('parseTokens', () => {
  it('should parse space-separated tokens', () => {
    expect(parseTokens('S K S K')).toEqual(['S', 'K', 'S', 'K']);
  });

  it('should handle plus notation', () => {
    expect(parseTokens('S+K H S+K H')).toEqual(['S+K', 'H', 'S+K', 'H']);
  });

  it('should handle ghost notes in parentheses', () => {
    expect(parseTokens('S (S) S (S)')).toEqual(['S', '(S)', 'S', '(S)']);
  });

  it('should handle empty string', () => {
    expect(parseTokens('')).toEqual([]);
  });

  it('should handle array input', () => {
    expect(parseTokens(['S', 'K', 'S'])).toEqual(['S', 'K', 'S']);
  });

  it('should trim whitespace', () => {
    expect(parseTokens('  S  K  S  ')).toEqual(['S', 'K', 'S']);
  });
});

describe('parseNumberList', () => {
  it('should parse space-separated numbers', () => {
    expect(parseNumberList('1 2 3 4')).toEqual([1, 2, 3, 4]);
  });

  it('should filter out invalid numbers', () => {
    expect(parseNumberList('1 2 abc 3 4')).toEqual([1, 2, 3, 4]);
  });

  it('should filter out zero and negative numbers', () => {
    expect(parseNumberList('1 2 0 -1 3')).toEqual([1, 2, 3]);
  });

  it('should handle empty string', () => {
    expect(parseNumberList('')).toEqual([]);
  });
});

describe('formatList', () => {
  it('should format array as space-separated string', () => {
    expect(formatList(['S', 'K', 'S', 'K'])).toBe('S K S K');
  });

  it('should handle numbers', () => {
    expect(formatList([1, 2, 3, 4])).toBe('1 2 3 4');
  });

  it('should handle empty array', () => {
    expect(formatList([])).toBe('');
  });
});

describe('parseTimeSignature', () => {
  it('should parse valid time signature', () => {
    expect(parseTimeSignature('4/4')).toEqual([4, 4]);
    expect(parseTimeSignature('3/4')).toEqual([3, 4]);
    expect(parseTimeSignature('7/8')).toEqual([7, 8]);
  });

  it('should handle whitespace', () => {
    expect(parseTimeSignature(' 4 / 4 ')).toEqual([4, 4]);
  });

  it('should default to 4/4 for invalid input', () => {
    expect(parseTimeSignature('invalid')).toEqual([4, 4]);
    expect(parseTimeSignature('')).toEqual([4, 4]);
  });
});

describe('calculateNotesPerBar', () => {
  it('should calculate notes for 4/4 time with 16th notes', () => {
    expect(calculateNotesPerBar(4, 4, 16)).toBe(16);
  });

  it('should calculate notes for 4/4 time with 8th notes', () => {
    expect(calculateNotesPerBar(4, 4, 8)).toBe(8);
  });

  it('should calculate notes for 3/4 time with 8th notes', () => {
    expect(calculateNotesPerBar(3, 4, 8)).toBe(6);
  });

  it('should calculate notes for 7/8 time with 16th notes', () => {
    expect(calculateNotesPerBar(7, 8, 16)).toBe(14);
  });
});

describe('calculateNotesPerBarFromPerBeatSubdivisions', () => {
  it('should calculate total notes from per-beat subdivisions', () => {
    expect(calculateNotesPerBarFromPerBeatSubdivisions([16, 16, 16, 16])).toEqual({
      totalNotes: 16,
      notesPerBeat: [4, 4, 4, 4],
    });
  });

  it('should handle mixed subdivisions', () => {
    expect(calculateNotesPerBarFromPerBeatSubdivisions([16, 8, 16, 8])).toEqual({
      totalNotes: 12,
      notesPerBeat: [4, 2, 4, 2],
    });
  });

  it('should handle different time signatures', () => {
    expect(calculateNotesPerBarFromPerBeatSubdivisions([8, 8, 8])).toEqual({
      totalNotes: 6,
      notesPerBeat: [2, 2, 2],
    });
  });
});

describe('calculateNotePositionsFromPerBeatSubdivisions', () => {
  it('should calculate beat positions for uniform subdivisions', () => {
    const result = calculateNotePositionsFromPerBeatSubdivisions([16, 16, 16, 16]);
    expect(result.length).toBe(16);
    expect(result[0]).toBe(0); // First note of beat 1
    expect(result[4]).toBe(1); // First note of beat 2
    expect(result[8]).toBe(2); // First note of beat 3
    expect(result[12]).toBe(3); // First note of beat 4
  });

  it('should calculate beat positions for mixed subdivisions', () => {
    const result = calculateNotePositionsFromPerBeatSubdivisions([16, 8, 16, 8]);
    expect(result.length).toBe(12);
    expect(result[0]).toBe(0); // Beat 1, note 1
    expect(result[4]).toBe(1); // Beat 2, note 1
    expect(result[6]).toBe(2); // Beat 3, note 1
    expect(result[10]).toBe(3); // Beat 4, note 1
  });
});

describe('getNotesPerBarForPattern', () => {
  it('should return standard calculation for non-advanced patterns', () => {
    const pattern: Pattern = {
      id: 'test',
      timeSignature: '4/4',
      subdivision: 16,
      drumPattern: 'S S S S',
      stickingPattern: 'R L R L',
      repeat: 1,
    };
    expect(getNotesPerBarForPattern(pattern)).toBe(16);
  });

  it('should return per-beat calculation for advanced patterns', () => {
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
    expect(getNotesPerBarForPattern(pattern)).toBe(12);
  });
});

describe('createDefaultPattern', () => {
  it('should create a valid default pattern', () => {
    const pattern = createDefaultPattern();
    expect(pattern).toHaveProperty('id');
    expect(pattern).toHaveProperty('timeSignature', '4/4');
    expect(pattern).toHaveProperty('subdivision', 16);
    expect(pattern).toHaveProperty('drumPattern');
    expect(pattern).toHaveProperty('stickingPattern');
    expect(pattern.drumPattern.split(' ').length).toBeLessThanOrEqual(4); // One beat
    expect(pattern.stickingPattern.split(' ').length).toBeGreaterThanOrEqual(2);
    expect(pattern.stickingPattern.split(' ').length).toBeLessThanOrEqual(4);
  });
});

describe('calculatePatternComplexity', () => {
  it('should calculate complexity for simple pattern', () => {
    const pattern: Pattern = {
      id: 'test',
      timeSignature: '4/4',
      subdivision: 4,
      drumPattern: 'S S S S',
      stickingPattern: 'R L R L',
      repeat: 1,
    };
    const complexity = calculatePatternComplexity(pattern);
    expect(complexity).toBeGreaterThan(0);
    expect(complexity).toBeLessThanOrEqual(100);
  });

  it('should calculate higher complexity for advanced patterns', () => {
    const simplePattern: Pattern = {
      id: 'test1',
      timeSignature: '4/4',
      subdivision: 4,
      drumPattern: 'S S S S',
      stickingPattern: 'R L R L',
      repeat: 1,
    };
    const advancedPattern: Pattern = {
      id: 'test2',
      timeSignature: '4/4',
      subdivision: 16,
      drumPattern: 'S S S S S S S S',
      stickingPattern: 'R L R L R L R L',
      repeat: 1,
      _advancedMode: true,
      _perBeatSubdivisions: [16, 16, 16, 16],
    };
    const simpleComplexity = calculatePatternComplexity(simplePattern);
    const advancedComplexity = calculatePatternComplexity(advancedPattern);
    expect(advancedComplexity).toBeGreaterThan(simpleComplexity);
  });
});

describe('buildAccentIndices', () => {
  it('should build accent indices from phrase', () => {
    expect(buildAccentIndices([2, 2, 2, 2])).toEqual([0, 2, 4, 6]);
    expect(buildAccentIndices([3, 1, 4])).toEqual([0, 3, 4]);
    expect(buildAccentIndices([4, 4, 4, 4])).toEqual([0, 4, 8, 12]);
  });

  it('should handle single group', () => {
    expect(buildAccentIndices([8])).toEqual([0]);
    expect(buildAccentIndices([16])).toEqual([0]);
  });

  it('should handle empty phrase', () => {
    expect(buildAccentIndices([])).toEqual([]);
  });
});

describe('buildPhraseFromAccents', () => {
  it('should build phrase from accent indices', () => {
    expect(buildPhraseFromAccents([0, 2, 4, 6], 8)).toEqual([2, 2, 2, 2]);
    expect(buildPhraseFromAccents([0, 4], 8)).toEqual([4, 4]);
  });

  it('should handle accent not at start', () => {
    expect(buildPhraseFromAccents([4], 8)).toEqual([4, 4]);
    expect(buildPhraseFromAccents([2], 8)).toEqual([2, 6]);
  });

  it('should handle no accents', () => {
    expect(buildPhraseFromAccents([], 8)).toEqual([8]);
    expect(buildPhraseFromAccents([], 16)).toEqual([16]);
  });

  it('should filter invalid accent indices', () => {
    expect(buildPhraseFromAccents([-1, 0, 8, 20], 16)).toEqual([0, 16]);
    expect(buildPhraseFromAccents([100], 16)).toEqual([16]);
  });

  it('should handle multiple accents', () => {
    expect(buildPhraseFromAccents([0, 4, 8, 12], 16)).toEqual([4, 4, 4, 4]);
  });
});

describe('randomizeAccents', () => {
  it('should generate valid accent indices', () => {
    const accents = randomizeAccents(16);
    expect(accents.length).toBeGreaterThanOrEqual(0);
    expect(accents.length).toBeLessThanOrEqual(16);
    accents.forEach(accent => {
      expect(accent).toBeGreaterThanOrEqual(0);
      expect(accent).toBeLessThan(16);
    });
  });

  it('should return sorted indices', () => {
    const accents = randomizeAccents(16);
    for (let i = 1; i < accents.length; i++) {
      expect(accents[i]).toBeGreaterThan(accents[i - 1]);
    }
  });

  it('should handle zero notes', () => {
    expect(randomizeAccents(0)).toEqual([]);
  });

  it('should generate unique indices', () => {
    const accents = randomizeAccents(16);
    const unique = new Set(accents);
    expect(unique.size).toBe(accents.length);
  });
});

describe('generateStickingForDrumPattern', () => {
  it('should generate sticking for simple pattern', () => {
    const sticking = generateStickingForDrumPattern('S S S S', 4, false);
    expect(sticking.split(' ').length).toBeGreaterThanOrEqual(2);
    expect(sticking.split(' ').length).toBeLessThanOrEqual(4);
    expect(sticking).toMatch(/[RL]/);
  });

  it('should respect kick in voicing pattern', () => {
    const sticking = generateStickingForDrumPattern('K S K S', 4, false);
    const stickingTokens = sticking.split(' ');
    // Should include K for kick
    expect(sticking).toContain('K');
    // Length should be divisible by voicing length (4)
    expect(stickingTokens.length % 4).toBe(0);
  });

  it('should respect rests in voicing pattern', () => {
    const sticking = generateStickingForDrumPattern('S - S -', 4, false);
    const stickingTokens = sticking.split(' ');
    // Should include rests
    expect(sticking).toContain('-');
  });

  it('should cap length at 4 when no kick present', () => {
    const sticking = generateStickingForDrumPattern('S S S S S S S S', 8, false);
    const stickingTokens = sticking.split(' ');
    expect(stickingTokens.length).toBeLessThanOrEqual(4);
  });

  it('should handle practice pad mode', () => {
    const sticking = generateStickingForDrumPattern('S S S S', 4, true);
    expect(sticking).toMatch(/[RL]/);
  });

  it('should handle empty pattern', () => {
    const sticking = generateStickingForDrumPattern('', 4, false);
    expect(sticking.split(' ').length).toBeGreaterThanOrEqual(2);
  });
});

