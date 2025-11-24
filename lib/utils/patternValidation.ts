/**
 * Pattern Validation Utilities
 * Validates pattern data before sending to API
 */

import { Pattern } from '@/types/pattern';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a pattern
 */
export function validatePattern(pattern: Pattern): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!pattern.id || typeof pattern.id !== 'number') {
    errors.push('Pattern ID is required and must be a number');
  }
  
  if (!pattern.timeSignature || typeof pattern.timeSignature !== 'string') {
    errors.push('Time signature is required');
  } else {
    // Validate time signature format (e.g., "4/4", "3/4")
    const timeSigMatch = pattern.timeSignature.match(/^(\d+)\/(\d+)$/);
    if (!timeSigMatch) {
      errors.push('Time signature must be in format "X/Y" (e.g., "4/4")');
    } else {
      const numerator = parseInt(timeSigMatch[1], 10);
      const denominator = parseInt(timeSigMatch[2], 10);
      if (numerator < 1 || numerator > 32) {
        errors.push('Time signature numerator must be between 1 and 32');
      }
      if (denominator < 1 || denominator > 32 || !isPowerOfTwo(denominator)) {
        errors.push('Time signature denominator must be a power of 2 (1, 2, 4, 8, 16, 32)');
      }
    }
  }
  
  if (typeof pattern.subdivision !== 'number' || pattern.subdivision < 1) {
    errors.push('Subdivision must be a positive number');
  } else {
    // Common valid subdivisions
    const validSubdivisions = [4, 8, 12, 16, 24, 32];
    if (!validSubdivisions.includes(pattern.subdivision)) {
      errors.push(`Subdivision ${pattern.subdivision} is unusual (common values: 4, 8, 12, 16, 24, 32)`);
    }
  }
  
  if (!pattern.phrase || typeof pattern.phrase !== 'string') {
    errors.push('Phrase is required');
  } else {
    // Validate phrase format (space-separated numbers)
    const phraseMatch = pattern.phrase.match(/^\d+(\s+\d+)*$/);
    if (!phraseMatch) {
      errors.push('Phrase must be space-separated numbers (e.g., "4 4 4 4")');
    }
  }
  
  if (!pattern.drumPattern || typeof pattern.drumPattern !== 'string') {
    errors.push('Drum pattern is required');
  } else {
    // Validate drum pattern tokens
    const validTokens = ['K', 'S', 'H', 'T', 'F', 'R', 'L', '-', 'x'];
    const tokens = pattern.drumPattern.split(/\s+/);
    for (const token of tokens) {
      if (token && !validTokens.some(vt => token.includes(vt))) {
        errors.push(`Invalid drum pattern token: "${token}" (valid: ${validTokens.join(', ')})`);
        break; // Only report first invalid token
      }
    }
  }
  
  if (typeof pattern.stickingPattern !== 'string') {
    errors.push('Sticking pattern must be a string');
  } else if (pattern.stickingPattern) {
    // Validate sticking pattern (R, L, or space-separated)
    const validSticking = ['R', 'L', 'r', 'l', '-', ' '];
    const stickingChars = pattern.stickingPattern.split('');
    for (const char of stickingChars) {
      if (char && !validSticking.includes(char) && char !== ' ') {
        errors.push(`Invalid sticking pattern character: "${char}" (valid: R, L, -, space)`);
        break;
      }
    }
  }
  
  if (typeof pattern.repeat !== 'number' || pattern.repeat < 1) {
    errors.push('Repeat must be a positive number');
  }
  
  if (typeof pattern.leftFoot !== 'boolean') {
    errors.push('leftFoot must be a boolean');
  }
  
  if (typeof pattern.rightFoot !== 'boolean') {
    errors.push('rightFoot must be a boolean');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a number is a power of 2
 */
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Sanitize pattern data (remove UI-only fields)
 */
export function sanitizePattern(pattern: Pattern): Pattern {
  const sanitized = { ...pattern };
  
  // Remove UI-only fields
  delete (sanitized as any)._expanded;
  delete (sanitized as any)._presetName;
  delete (sanitized as any)._presetDescription;
  // Keep _presetAccents, _polyrhythmRightNotes, _polyrhythmLeftNotes as they're pattern data
  
  return sanitized;
}

/**
 * Validate and sanitize pattern before API call
 */
export function preparePatternForApi(pattern: Pattern): {
  pattern: Pattern;
  validation: ValidationResult;
} {
  const validation = validatePattern(pattern);
  const sanitized = sanitizePattern(pattern);
  
  return {
    pattern: sanitized,
    validation,
  };
}

