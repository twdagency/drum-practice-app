/**
 * Unit tests for subdivision utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  getSubdivisionText,
  getSubdivisionTextWithSuffix,
} from '../subdivisionUtils';

describe('getSubdivisionText', () => {
  it('should return correct text for standard subdivisions', () => {
    expect(getSubdivisionText(4)).toBe('4th');
    expect(getSubdivisionText(8)).toBe('8th');
    expect(getSubdivisionText(16)).toBe('16th');
    expect(getSubdivisionText(32)).toBe('32nd');
  });

  it('should handle triplet subdivisions', () => {
    expect(getSubdivisionText(12)).toBe('8th (triplets)');
    expect(getSubdivisionText(24)).toBe('16th (sextuplets)');
  });

  it('should handle unknown subdivisions', () => {
    expect(getSubdivisionText(6)).toBe('6th');
    expect(getSubdivisionText(64)).toBe('64th');
  });
});

describe('getSubdivisionTextWithSuffix', () => {
  it('should return correct text with suffix for standard subdivisions', () => {
    expect(getSubdivisionTextWithSuffix(4)).toBe('Quarter notes');
    expect(getSubdivisionTextWithSuffix(8)).toBe('Eighth notes');
    expect(getSubdivisionTextWithSuffix(16)).toBe('Sixteenth notes');
    expect(getSubdivisionTextWithSuffix(32)).toBe('Thirty-second notes');
  });

  it('should handle triplet subdivisions with suffix', () => {
    expect(getSubdivisionTextWithSuffix(12)).toBe('Eighth note triplets');
    expect(getSubdivisionTextWithSuffix(24)).toBe('Sixteenth note sextuplets');
  });

  it('should handle unknown subdivisions with suffix', () => {
    expect(getSubdivisionTextWithSuffix(6)).toBe('6th notes');
    expect(getSubdivisionTextWithSuffix(64)).toBe('64th notes');
  });
});


