/**
 * Pattern manipulation utilities
 */

import { Pattern } from '@/types';
import { randomSets } from './randomSets';

/**
 * Parse tokens from a string (handles space-separated and + notation)
 */
export function parseTokens(value: string | string[]): string[] {
  if (!value) return [];
  if (typeof value !== 'string') {
    if (Array.isArray(value)) return value;
    value = String(value);
  }
  // Support both space-separated and + notation (e.g., "S K" or "S+K")
  return value
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

/**
 * Parse a number list from a string
 */
export function parseNumberList(value: string): number[] {
  return parseTokens(value)
    .map((token) => Number(token))
    .filter((num) => Number.isFinite(num) && num > 0);
}

/**
 * Format a list as a space-separated string
 */
export function formatList(list: (string | number)[]): string {
  return list.join(' ');
}

/**
 * Parse time signature string (e.g., "4/4") into [numerator, denominator]
 */
export function parseTimeSignature(value: string): [number, number] {
  const match = (value || '').match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) {
    return [4, 4];
  }
  const [, beats, division] = match;
  const numerator = Math.max(1, parseInt(beats, 10));
  const denominator = Math.max(1, parseInt(division, 10));
  return [numerator, denominator];
}

/**
 * Calculate the number of notes per bar from time signature and subdivision
 * 
 * @param timeSignature Time signature string (e.g., "4/4", "3/4", "7/8")
 * @param subdivision Subdivision type (e.g., 16 for sixteenth notes, 8 for eighth notes)
 * @returns Total number of notes (subdivisions) per bar
 */
export function calculateNotesPerBar(timeSignature: string, subdivision: number): number {
  const [numerator, denominator] = parseTimeSignature(timeSignature);
  
  // Calculate the beat value (what note gets the beat)
  // denominator: 4 = quarter note, 8 = eighth note, 16 = sixteenth note
  const beatValue = denominator; // e.g., 4 means quarter note gets the beat
  
  // Calculate subdivisions per beat
  // subdivision: 16 = sixteenth notes, 8 = eighth notes, 4 = quarter notes
  // beatValue: 4 = quarter note beat, 8 = eighth note beat
  // subdivisionsPerBeat = subdivision / beatValue (e.g., 16/4 = 4 sixteenth notes per quarter beat)
  const subdivisionsPerBeat = subdivision / beatValue;
  
  // Total notes per bar = number of beats × subdivisions per beat
  const notesPerBar = numerator * subdivisionsPerBeat;
  
  return Math.round(notesPerBar);
}

/**
 * Calculate notes per bar for a pattern, handling both normal and advanced (per-beat) modes
 * 
 * @param pattern Pattern object
 * @returns Total number of notes per bar
 */
export function getNotesPerBarForPattern(pattern: Pattern): number {
  if (pattern._advancedMode && pattern._perBeatSubdivisions) {
    const result = calculateNotesPerBarFromPerBeatSubdivisions(
      pattern.timeSignature || '4/4',
      pattern._perBeatSubdivisions
    );
    return result.notesPerBar;
  } else {
    return calculateNotesPerBar(pattern.timeSignature || '4/4', pattern.subdivision);
  }
}

/**
 * Calculate the number of notes per bar from time signature and per-beat subdivisions
 * 
 * @param timeSignature Time signature string (e.g., "4/4", "3/4", "7/8")
 * @param perBeatSubdivisions Array of subdivisions for each beat (e.g., [16, 8, 4, 4])
 * @returns Total number of notes and notes per beat
 */
export function calculateNotesPerBarFromPerBeatSubdivisions(
  timeSignature: string, 
  perBeatSubdivisions: number[]
): { notesPerBar: number; notesPerBeat: number[] } {
  const [numerator, denominator] = parseTimeSignature(timeSignature);
  const beatValue = denominator;
  
  // Calculate notes per beat from each beat's subdivision
  const notesPerBeat = perBeatSubdivisions.map(subdivision => {
    // Notes per beat = subdivision / beatValue
    // e.g., 16th notes in 4/4: 16/4 = 4 notes per beat
    return subdivision / beatValue;
  });
  
  // Total notes per bar = sum of all notes per beat
  const notesPerBar = notesPerBeat.reduce((sum, notes) => sum + notes, 0);
  
  return {
    notesPerBar: Math.round(notesPerBar),
    notesPerBeat: notesPerBeat.map(n => Math.round(n))
  };
}

/**
 * Calculate note positions (in beats) from per-beat subdivisions
 * 
 * @param timeSignature Time signature string (e.g., "4/4", "3/4", "7/8")
 * @param perBeatSubdivisions Array of subdivisions for each beat
 * @returns Array of beat positions for each note (e.g., [0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3])
 */
export function calculateNotePositionsFromPerBeatSubdivisions(
  timeSignature: string,
  perBeatSubdivisions: number[]
): number[] {
  const [, denominator] = parseTimeSignature(timeSignature);
  const beatValue = denominator;
  
  const positions: number[] = [];
  let currentBeat = 0;
  
  for (const subdivision of perBeatSubdivisions) {
    const notesPerBeat = subdivision / beatValue;
    const noteDuration = 1 / notesPerBeat; // Duration of each note in beats
    
    // Add positions for all notes in this beat
    for (let i = 0; i < notesPerBeat; i++) {
      positions.push(currentBeat + (i * noteDuration));
    }
    
    currentBeat += 1; // Move to next beat
  }
  
  return positions;
}

/**
 * Get a random item from an array
 */
export function getRandomItem<T>(list: readonly T[] | T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Calculate pattern complexity
 */
export function calculatePatternComplexity(pattern: Pattern): 'easy' | 'medium' | 'hard' {
  const phrase = parseNumberList(pattern.phrase);
  const totalNotes = phrase.reduce((sum, val) => sum + val, 0);
  const [numerator] = parseTimeSignature(pattern.timeSignature);
  const subdivision = pattern.subdivision;

  // Simple complexity calculation
  let complexity = 0;
  
  // More notes = more complex
  complexity += totalNotes * 0.5;
  
  // Higher subdivision = more complex
  complexity += subdivision * 0.3;
  
  // More phrase groups = more complex
  complexity += phrase.length * 2;
  
  // Non-standard time signatures = more complex
  if (numerator !== 4) complexity += 5;

  if (complexity < 20) return 'easy';
  if (complexity < 40) return 'medium';
  return 'hard';
}

/**
 * Build accent indices from phrase (first note of each group)
 * The phrase represents note groupings, and accents are placed on the first note of each group
 * 
 * @example
 * buildAccentIndices([2, 2, 2, 2]) // Returns [0, 2, 4, 6]
 * buildAccentIndices([3, 1, 4]) // Returns [0, 3, 4]
 */
export function buildAccentIndices(phrase: number[]): number[] {
  const accents: number[] = [];
  let currentIndex = 0;
  
  phrase.forEach((groupLength) => {
    accents.push(currentIndex);
    currentIndex += groupLength;
  });
  
  return accents;
}

/**
 * Build phrase from accent indices and subdivision
 * Accents define where accents go, phrase is derived from the gaps between accents
 * 
 * @example
 * buildPhraseFromAccents([0, 2, 4, 6], 8) // Returns [2, 2, 2, 2]
 * buildPhraseFromAccents([0], 4) // Returns [4]
 * buildPhraseFromAccents([4], 8) // Returns [4, 4] (accent at position 4)
 * buildPhraseFromAccents([], 4) // Returns [4] (no accents = one big group)
 */
export function buildPhraseFromAccents(accentIndices: number[], notesPerBar: number): number[] {
  if (accentIndices.length === 0) {
    // No accents = one big group covering all notes
    return [notesPerBar];
  }

  // Sort accents to ensure correct order
  const sortedAccents = [...accentIndices].sort((a, b) => a - b);
  
  // Ensure accents are within valid range
  const validAccents = sortedAccents.filter(acc => acc >= 0 && acc < notesPerBar);
  
  if (validAccents.length === 0) {
    return [notesPerBar];
  }

  const phrase: number[] = [];
  
  // If first accent is not at 0, include the gap from 0 to first accent
  if (validAccents[0] > 0) {
    phrase.push(validAccents[0]);
  }
  
  // Calculate gaps between accents
  for (let i = 0; i < validAccents.length; i++) {
    const currentAccent = validAccents[i];
    const nextAccent = i < validAccents.length - 1 ? validAccents[i + 1] : notesPerBar;
    const gap = nextAccent - currentAccent;
    phrase.push(gap);
  }
  
  return phrase;
}

/**
 * Generate random accent indices for a given number of notes per bar
 * Can generate any number of accents (0 to notesPerBar)
 * 
 * @param notesPerBar Total number of notes in the bar (not subdivision!)
 * @example
 * randomizeAccents(16) // Returns something like [0, 3, 5, 12] or [] or [0, 2, 4, 6] etc.
 */
export function randomizeAccents(notesPerBar: number): number[] {
  // Random number of accents: 0 to notesPerBar
  const numAccents = Math.floor(Math.random() * (notesPerBar + 1));
  
  if (numAccents === 0) {
    return [];
  }
  
  // Generate random unique accent positions
  const availableIndices = Array.from({ length: notesPerBar }, (_, i) => i);
  const accents: number[] = [];
  
  for (let i = 0; i < numAccents; i++) {
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    accents.push(availableIndices.splice(randomIndex, 1)[0]);
  }
  
  return accents.sort((a, b) => a - b);
}

/**
 * Create a default pattern
 */
export function createDefaultPattern(): Pattern {
  const timeSignature = '4/4';
  const subdivision = 16;
  const notesPerBar = calculateNotesPerBar(timeSignature, subdivision);
  
  // Default: no accents (empty array)
  const accents: number[] = [];
  const phraseArray = buildPhraseFromAccents(accents, notesPerBar);
  const phrase = formatList(phraseArray);
  
  // Generate drum and sticking patterns to match notesPerBar
  const drumPatternTokens: string[] = [];
  for (let i = 0; i < notesPerBar; i++) {
    drumPatternTokens.push(i % 4 === 0 ? 'S' : 'S'); // Simple pattern
  }
  const drumPattern = formatList(drumPatternTokens);
  
  const stickingTokens: string[] = [];
  for (let i = 0; i < notesPerBar; i++) {
    stickingTokens.push(i % 2 === 0 ? 'R' : 'L');
  }
  const stickingPattern = formatList(stickingTokens);
  
  return {
    id: Date.now(),
    timeSignature,
    subdivision,
    phrase, // Derived from accents (empty accents = [16])
    drumPattern,
    stickingPattern,
    leftFoot: false,
    rightFoot: false,
    repeat: 1,
    _expanded: true,
    _presetAccents: accents, // Explicitly set to empty array
  };
}

/**
 * Randomize per-beat subdivisions
 * 
 * @param timeSignature Time signature string
 * @returns Array of subdivisions, one per beat
 */
export function randomizePerBeatSubdivisions(timeSignature: string): number[] {
  const [numerator] = parseTimeSignature(timeSignature);
  const perBeatSubdivisions: number[] = [];
  
  for (let i = 0; i < numerator; i++) {
    // Random subdivision for this beat
    perBeatSubdivisions.push(getRandomItem(randomSets.subdivisions));
  }
  
  return perBeatSubdivisions;
}

/**
 * Generate a completely random pattern
 */
export function generateRandomPattern(practicePadMode: boolean = false, useAdvancedMode: boolean = false): Pattern {
  // Random time signature
  const timeSignature = getRandomItem(randomSets.timeSignatures);
  
  // Random subdivision (default, used if not advanced mode)
  const subdivision = getRandomItem(randomSets.subdivisions);
  
  let notesPerBar: number;
  let perBeatSubdivisions: number[] | undefined;
  
  if (useAdvancedMode) {
    // Generate per-beat subdivisions
    perBeatSubdivisions = randomizePerBeatSubdivisions(timeSignature);
    const result = calculateNotesPerBarFromPerBeatSubdivisions(timeSignature, perBeatSubdivisions);
    notesPerBar = result.notesPerBar;
  } else {
    // Calculate actual notes per bar based on time signature and subdivision
    notesPerBar = calculateNotesPerBar(timeSignature, subdivision);
  }
  
  // Random accents (based on actual notes per bar)
  const accents = randomizeAccents(notesPerBar);
  
  // Derive phrase from accents
  const phraseArray = buildPhraseFromAccents(accents, notesPerBar);
  const phrase = formatList(phraseArray);
  
  // Generate drum pattern that matches notes per bar
  // In Practice Pad mode, always use "S" for voicing
  let drumPattern: string;
  if (practicePadMode) {
    drumPattern = Array(notesPerBar).fill('S').join(' ');
  } else {
    const drumPatternArray = getRandomItem([...randomSets.drumPatterns]) as readonly string[];
    // Repeat pattern to match notes per bar
    const drumPatternTokens: string[] = [];
    for (let i = 0; i < notesPerBar; i++) {
      drumPatternTokens.push(drumPatternArray[i % drumPatternArray.length]);
    }
    drumPattern = formatList(drumPatternTokens);
  }
  
  // Generate sticking pattern that matches drum pattern and notes per bar
  const stickingPattern = generateStickingForDrumPattern(drumPattern, notesPerBar, practicePadMode);
  
  // Random repeat (1-4 bars)
  const repeat = Math.floor(Math.random() * 4) + 1;
  
  return {
    id: Date.now() + Math.random(),
    timeSignature,
    subdivision,
    phrase, // Derived from accents - kept for backward compatibility
    drumPattern,
    stickingPattern,
    leftFoot: false,
    rightFoot: false,
    repeat,
    _expanded: true,
    _presetAccents: accents,
    _advancedMode: useAdvancedMode,
    _perBeatSubdivisions: perBeatSubdivisions,
  };
}

/**
 * Generate a sticking pattern that matches a drum pattern
 * Handles K (kick) notes and generates alternating R/L for others
 * 
 * @param drumPattern The drum pattern string
 * @param notesPerBar Total number of notes per bar (from time signature + subdivision)
 * @param practicePadMode If true, never add K to sticking pattern
 */
function generateStickingForDrumPattern(drumPattern: string, notesPerBar: number, practicePadMode: boolean = false): string {
  const drumTokens = parseTokens(drumPattern);
  const sticking: string[] = [];
  let currentHand = Math.random() > 0.5 ? 'R' : 'L';
  
  for (let i = 0; i < notesPerBar; i++) {
    const drumToken = drumTokens[i % drumTokens.length];
    const normalizedToken = drumToken.replace(/\+/g, ' ').toUpperCase();
    
    if (normalizedToken.includes('K') && !practicePadMode) {
      // Kick drum = K in sticking (only if not in practice pad mode)
      sticking.push('K');
    } else if (normalizedToken === '' || normalizedToken === '-') {
      // Rest = use R or L randomly
      sticking.push(Math.random() > 0.5 ? 'R' : 'L');
    } else {
      // Regular note = alternate hands
      sticking.push(currentHand);
      currentHand = currentHand === 'R' ? 'L' : 'R';
    }
  }
  
  return formatList(sticking);
}

/**
 * Randomize all fields of an existing pattern
 */
export function randomizePattern(pattern: Pattern, practicePadMode: boolean = false): Pattern {
  // Preserve advanced mode setting, or randomly enable it (10% chance)
  const useAdvancedMode = pattern._advancedMode || Math.random() < 0.1;
  
  // Random time signature
  const timeSignature = getRandomItem(randomSets.timeSignatures);
  
  // Random subdivision (default, used if not advanced mode)
  const subdivision = getRandomItem(randomSets.subdivisions);
  
  let notesPerBar: number;
  let perBeatSubdivisions: number[] | undefined;
  
  if (useAdvancedMode) {
    // Generate per-beat subdivisions
    perBeatSubdivisions = randomizePerBeatSubdivisions(timeSignature);
    const result = calculateNotesPerBarFromPerBeatSubdivisions(timeSignature, perBeatSubdivisions);
    notesPerBar = result.notesPerBar;
  } else {
    // Calculate actual notes per bar based on time signature and subdivision
    notesPerBar = calculateNotesPerBar(timeSignature, subdivision);
  }
  
  // Random accents (based on actual notes per bar)
  const accents = randomizeAccents(notesPerBar);
  
  // Derive phrase from accents
  const phraseArray = buildPhraseFromAccents(accents, notesPerBar);
  const phrase = formatList(phraseArray);
  
  // Generate drum pattern that matches notes per bar
  // In Practice Pad mode, always use "S" for voicing
  let drumPattern: string;
  if (practicePadMode) {
    drumPattern = Array(notesPerBar).fill('S').join(' ');
  } else {
    const drumPatternArray = getRandomItem([...randomSets.drumPatterns]) as readonly string[];
    // Repeat pattern to match notes per bar
    const drumPatternTokens: string[] = [];
    for (let i = 0; i < notesPerBar; i++) {
      drumPatternTokens.push(drumPatternArray[i % drumPatternArray.length]);
    }
    drumPattern = formatList(drumPatternTokens);
  }
  
  // Generate sticking pattern that matches drum pattern and notes per bar
  const stickingPattern = generateStickingForDrumPattern(drumPattern, notesPerBar, practicePadMode);
  
  // Random repeat (1-4 bars)
  const repeat = Math.floor(Math.random() * 4) + 1;
  
  return {
    ...pattern,
    timeSignature,
    subdivision,
    phrase, // Derived from accents - kept for backward compatibility
    drumPattern,
    stickingPattern,
    repeat,
    _presetAccents: accents,
    _advancedMode: useAdvancedMode,
    _perBeatSubdivisions: perBeatSubdivisions,
  };
}

