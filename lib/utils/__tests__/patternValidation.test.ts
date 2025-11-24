/**
 * Unit tests for pattern validation utilities
 */

import { describe, it, expect } from 'vitest';
import { validatePattern, sanitizePattern, preparePatternForApi } from '../patternValidation';
import { Pattern } from '@/types/pattern';

const createValidPattern = (): Pattern => ({
  id: 1,
  timeSignature: '4/4',
  subdivision: 16,
  phrase: '4 4 4 4',
  drumPattern: 'S K S K',
  stickingPattern: 'R L R L',
  repeat: 1,
  leftFoot: false,
  rightFoot: false,
  accents: [],
  notes: ['S', 'K', 'S', 'K'],
});

describe('validatePattern', () => {
  it('should validate a correct pattern', () => {
    const pattern = createValidPattern();
    const result = validatePattern(pattern);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject pattern with missing ID', () => {
    const pattern = createValidPattern();
    delete (pattern as any).id;
    const result = validatePattern(pattern);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Pattern ID is required and must be a number');
  });

  it('should reject pattern with invalid time signature format', () => {
    const pattern = createValidPattern();
    pattern.timeSignature = 'invalid';
    const result = validatePattern(pattern);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Time signature must be in format "X/Y"');
  });

  it('should reject pattern with invalid time signature numerator', () => {
    const pattern = createValidPattern();
    pattern.timeSignature = '0/4';
    const result = validatePattern(pattern);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('numerator'))).toBe(true);
  });

  it('should reject pattern with invalid time signature denominator', () => {
    const pattern = createValidPattern();
    pattern.timeSignature = '4/3'; // Not a power of 2
    const result = validatePattern(pattern);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('denominator'))).toBe(true);
  });

  it('should accept valid time signatures', () => {
    const validTimeSigs = ['4/4', '3/4', '7/8', '5/4', '2/2'];
    for (const timeSig of validTimeSigs) {
      const pattern = createValidPattern();
      pattern.timeSignature = timeSig;
      const result = validatePattern(pattern);
      expect(result.valid).toBe(true);
    }
  });

  it('should reject pattern with invalid subdivision', () => {
    const pattern = createValidPattern();
    pattern.subdivision = 0;
    const result = validatePattern(pattern);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Subdivision'))).toBe(true);
  });

  it('should warn about unusual subdivisions', () => {
    const pattern = createValidPattern();
    pattern.subdivision = 7; // Unusual value
    const result = validatePattern(pattern);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('unusual'))).toBe(true);
  });

  it('should accept common subdivisions', () => {
    const commonSubdivisions = [4, 8, 12, 16, 24, 32];
    for (const sub of commonSubdivisions) {
      const pattern = createValidPattern();
      pattern.subdivision = sub;
      const result = validatePattern(pattern);
      expect(result.valid).toBe(true);
    }
  });

  it('should reject pattern with invalid phrase format', () => {
    const pattern = createValidPattern();
    pattern.phrase = 'invalid phrase';
    const result = validatePattern(pattern);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Phrase'))).toBe(true);
  });

  it('should accept valid phrases', () => {
    const validPhrases = ['4 4 4 4', '3 3 2', '8', '2 2 2 2 2'];
    for (const phrase of validPhrases) {
      const pattern = createValidPattern();
      pattern.phrase = phrase;
      const result = validatePattern(pattern);
      expect(result.valid).toBe(true);
    }
  });

  it('should reject pattern with invalid drum pattern tokens', () => {
    const pattern = createValidPattern();
    pattern.drumPattern = 'X Y Z'; // Invalid tokens
    const result = validatePattern(pattern);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid drum pattern token'))).toBe(true);
  });

  it('should accept valid drum pattern tokens', () => {
    const validPatterns = ['S K S K', 'H H S K', 'T F S K', 'R L R L'];
    for (const drumPattern of validPatterns) {
      const pattern = createValidPattern();
      pattern.drumPattern = drumPattern;
      const result = validatePattern(pattern);
      expect(result.valid).toBe(true);
    }
  });

  it('should reject pattern with invalid sticking pattern', () => {
    const pattern = createValidPattern();
    pattern.stickingPattern = 'X Y Z'; // Invalid characters
    const result = validatePattern(pattern);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid sticking pattern'))).toBe(true);
  });

  it('should accept valid sticking patterns', () => {
    const validSticking = ['R L R L', 'r l r l', 'R-L-R-L', 'R L'];
    for (const sticking of validSticking) {
      const pattern = createValidPattern();
      pattern.stickingPattern = sticking;
      const result = validatePattern(pattern);
      expect(result.valid).toBe(true);
    }
  });

  it('should reject pattern with invalid repeat', () => {
    const pattern = createValidPattern();
    pattern.repeat = 0;
    const result = validatePattern(pattern);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Repeat'))).toBe(true);
  });

  it('should reject pattern with invalid boolean fields', () => {
    const pattern = createValidPattern();
    (pattern as any).leftFoot = 'not a boolean';
    const result = validatePattern(pattern);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('leftFoot'))).toBe(true);
  });
});

describe('sanitizePattern', () => {
  it('should remove UI-only fields', () => {
    const pattern = createValidPattern();
    (pattern as any)._expanded = true;
    (pattern as any)._presetName = 'Test Preset';
    (pattern as any)._presetDescription = 'Test Description';
    
    const sanitized = sanitizePattern(pattern);
    
    expect(sanitized).not.toHaveProperty('_expanded');
    expect(sanitized).not.toHaveProperty('_presetName');
    expect(sanitized).not.toHaveProperty('_presetDescription');
  });

  it('should keep pattern data fields', () => {
    const pattern = createValidPattern();
    const sanitized = sanitizePattern(pattern);
    
    expect(sanitized).toHaveProperty('id');
    expect(sanitized).toHaveProperty('timeSignature');
    expect(sanitized).toHaveProperty('drumPattern');
  });

  it('should keep polyrhythm fields', () => {
    const pattern = createValidPattern();
    (pattern as any)._presetAccents = [0, 4];
    (pattern as any)._polyrhythmRightNotes = [0, 2];
    (pattern as any)._polyrhythmLeftNotes = [1, 3];
    
    const sanitized = sanitizePattern(pattern);
    
    expect(sanitized).toHaveProperty('_presetAccents');
    expect(sanitized).toHaveProperty('_polyrhythmRightNotes');
    expect(sanitized).toHaveProperty('_polyrhythmLeftNotes');
  });
});

describe('preparePatternForApi', () => {
  it('should validate and sanitize pattern', () => {
    const pattern = createValidPattern();
    (pattern as any)._expanded = true;
    
    const result = preparePatternForApi(pattern);
    
    expect(result.validation.valid).toBe(true);
    expect(result.pattern).not.toHaveProperty('_expanded');
  });

  it('should return validation errors for invalid pattern', () => {
    const pattern = createValidPattern();
    pattern.timeSignature = 'invalid';
    
    const result = preparePatternForApi(pattern);
    
    expect(result.validation.valid).toBe(false);
    expect(result.validation.errors.length).toBeGreaterThan(0);
  });
});

