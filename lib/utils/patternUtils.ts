/**
 * Pattern manipulation utilities
 */

import { Pattern } from '@/types';
import { randomSets } from './randomSets';

/**
 * Parse tokens from a string (handles space-separated and + notation)
 * Also handles ghost notes in parentheses notation (e.g., "(S)", "(K)")
 */
export function parseTokens(value: string | string[]): string[] {
  if (!value) return [];
  if (typeof value !== 'string') {
    if (Array.isArray(value)) return value;
    value = String(value);
  }
  // Support both space-separated and + notation (e.g., "S K" or "S+K")
  // Also preserve parentheses for ghost notes (e.g., "(S)", "(K)")
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
 * Uses the same difficulty rating system for consistency
 */
export function calculatePatternComplexity(pattern: Pattern): 'easy' | 'medium' | 'hard' {
  // Import the difficulty rating function to use the same calculation
  // We'll calculate a simplified version inline to avoid circular dependencies
  const notesPerBar = getNotesPerBarForPattern(pattern);
  const [numerator] = parseTimeSignature(pattern.timeSignature || '4/4');
  const drumPattern = parseTokens(pattern.drumPattern || '');
  const stickingPattern = parseTokens(pattern.stickingPattern || '');
  
  // Count accents
  const accentCount = (pattern._presetAccents || []).length;
  
  // Count rests
  const restCount = drumPattern.filter(token => 
    token.toUpperCase() === 'R' || token === '-'
  ).length;
  
  // Check for advanced mode (per-beat subdivisions)
  const hasAdvancedMode = pattern._advancedMode || false;
  const advancedModeComplexity = hasAdvancedMode 
    ? (pattern._perBeatSubdivisions?.length || 0) * 2 
    : 0;
  
  // Check for polyrhythm
  const hasPolyrhythm = !!(pattern._polyrhythmRightNotes || pattern._polyrhythmLeftNotes);
  const polyrhythmComplexity = hasPolyrhythm ? 15 : 0;
  
  // Count ghost notes (tokens in parentheses)
  const ghostNoteCount = drumPattern.filter(token => 
    token.startsWith('(') && token.endsWith(')')
  ).length;
  
  // Count ornaments (flams, drags, ruffs - lowercase letters before main note)
  const ornamentCount = stickingPattern.filter(token => 
    /^[a-z]+[A-Z]/.test(token)
  ).length;
  
  // Calculate factors (same as difficulty rating)
  const subdivisionFactor = Math.min(pattern.subdivision / 4, 8);
  const timeSignatureFactor = numerator === 4 ? 1 : (numerator > 4 ? 2 : 1.5);
  const notesPerBarFactor = Math.min(notesPerBar / 16, 4);
  
  // Use same calculation as difficulty rating (recalibrated)
  // Base difficulty from subdivision
  let baseDifficulty = 1;
  if (pattern.subdivision <= 4) {
    baseDifficulty = 1;
  } else if (pattern.subdivision <= 8) {
    baseDifficulty = 2;
  } else if (pattern.subdivision <= 16) {
    baseDifficulty = 3;
  } else if (pattern.subdivision <= 24) {
    baseDifficulty = 5;
  } else {
    baseDifficulty = 7;
  }
  
  // Adjust for time signature
  if (numerator !== 4) {
    baseDifficulty += numerator === 3 ? 0.5 : 1;
  }
  
  // Adjust for notes per bar
  if (notesPerBar > 32) {
    baseDifficulty += 1;
  } else if (notesPerBar > 16) {
    baseDifficulty += 0.5;
  }
  
  // Add complexity from other factors
  if (accentCount > 0) baseDifficulty += Math.min(accentCount * 0.3, 1.5);
  if (restCount > 0) baseDifficulty += Math.min(restCount * 0.1, 0.5);
  if (hasAdvancedMode) baseDifficulty += Math.min(advancedModeComplexity * 0.5, 2);
  if (hasPolyrhythm) baseDifficulty += 2;
  if (ghostNoteCount > 0) baseDifficulty += Math.min(ghostNoteCount * 0.4, 1.5);
  if (ornamentCount > 0) baseDifficulty += Math.min(ornamentCount * 0.8, 2.5);
  
  const difficultyScore = Math.max(1, Math.min(10, Math.round(baseDifficulty * 10) / 10));
  
  // Map to easy/medium/hard (matching 1-10 scale: 1-3=easy, 4-6=medium, 7-10=hard)
  if (difficultyScore <= 3) return 'easy';
  if (difficultyScore <= 6) return 'medium';
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
  
  // Calculate notes per beat (e.g., 16th notes in 4/4 = 4 notes per beat)
  const [numerator, denominator] = parseTimeSignature(timeSignature);
  const beatValue = denominator; // Typically 4 for quarter notes
  const notesPerBeat = subdivision / beatValue;
  
  // Generate voicing pattern for one beat (not full bar)
  const drumPatternTokens: string[] = [];
  for (let i = 0; i < notesPerBeat; i++) {
    drumPatternTokens.push('S'); // Simple pattern: all snare
  }
  const drumPattern = formatList(drumPatternTokens);
  
  // Generate sticking pattern (2-4 notes, matching voicing pattern)
  // Use generateStickingForDrumPattern to get a shorter pattern
  const stickingPattern = generateStickingForDrumPattern(drumPattern, notesPerBeat, false);
  
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
  let perBeatVoicing: string[] | undefined;
  let perBeatSticking: string[] | undefined;
  let stickingPattern: string;
  
  if (useAdvancedMode && perBeatSubdivisions) {
    // Generate per-beat voicing and sticking
    const [numerator] = parseTimeSignature(timeSignature);
    const { notesPerBeat } = calculateNotesPerBarFromPerBeatSubdivisions(timeSignature, perBeatSubdivisions);
    perBeatVoicing = [];
    perBeatSticking = [];
    
    for (let i = 0; i < numerator; i++) {
      const notesInBeat = notesPerBeat[i] || 1;
      let beatVoicing: string;
      
      if (practicePadMode) {
        beatVoicing = Array(notesInBeat).fill('S').join(' ');
      } else {
        const drumPatternArray = getRandomItem([...randomSets.drumPatterns]) as readonly string[];
        const beatTokens: string[] = [];
        for (let j = 0; j < notesInBeat; j++) {
          beatTokens.push(drumPatternArray[j % drumPatternArray.length]);
        }
        beatVoicing = formatList(beatTokens);
      }
      
      const beatSticking = generateStickingForDrumPattern(beatVoicing, notesInBeat, practicePadMode);
      perBeatVoicing.push(beatVoicing);
      perBeatSticking.push(beatSticking);
    }
    
    drumPattern = perBeatVoicing.join(' ');
    stickingPattern = perBeatSticking.join(' ');
  } else {
    // Standard mode
    // Calculate notes per beat (e.g., 16th notes in 4/4 = 4 notes per beat)
    const [numerator, denominator] = parseTimeSignature(timeSignature);
    const beatValue = denominator; // Typically 4 for quarter notes
    const notesPerBeat = subdivision / beatValue;
    
    if (practicePadMode) {
      // Generate pattern for one beat, will repeat automatically
      const beatTokens: string[] = [];
      for (let i = 0; i < notesPerBeat; i++) {
        // 80% chance of S, 20% chance of rest
        beatTokens.push(Math.random() < 0.8 ? 'S' : '-');
      }
      drumPattern = formatList(beatTokens);
    } else {
      // Generate voicing pattern for one beat (not full bar)
      const drumPatternArray = getRandomItem([...randomSets.drumPatterns]) as readonly string[];
      const beatTokens: string[] = [];
      for (let i = 0; i < notesPerBeat; i++) {
        beatTokens.push(drumPatternArray[i % drumPatternArray.length]);
      }
      drumPattern = formatList(beatTokens);
    }
    
    // Generate sticking pattern (2-4 notes, matching voicing pattern)
    stickingPattern = generateStickingForDrumPattern(drumPattern, notesPerBeat, practicePadMode);
  }
  
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
    _perBeatVoicing: perBeatVoicing,
    _perBeatSticking: perBeatSticking,
  };
}

/**
 * Generate a sticking pattern that matches a drum pattern
 * Handles K (kick) notes and generates alternating R/L for others
 * The sticking pattern can be shorter than notesPerBar (minimum 2)
 * If voicing has K, sticking must be divisible by voicing length
 * 
 * @param drumPattern The drum pattern string
 * @param notesPerBar Total number of notes per bar (from time signature + subdivision)
 * @param practicePadMode If true, never add K to sticking pattern
 */
export function generateStickingForDrumPattern(drumPattern: string, notesPerBar: number, practicePadMode: boolean = false): string {
  const drumTokens = parseTokens(drumPattern);
  
  // Find the base pattern length by detecting repetition
  // If the pattern repeats, use the shortest repeating unit
  let baseVoicingLength = drumTokens.length;
  for (let len = 1; len <= drumTokens.length / 2; len++) {
    if (drumTokens.length % len === 0) {
      const isRepeating = true;
      for (let i = 0; i < drumTokens.length; i++) {
        if (drumTokens[i] !== drumTokens[i % len]) {
          // Not a perfect repeat at this length
          break;
        }
        if (i === drumTokens.length - 1) {
          // Found a repeating pattern
          baseVoicingLength = len;
          len = drumTokens.length; // Exit outer loop
          break;
        }
      }
    }
  }
  
  // Use just the base pattern tokens
  const baseVoicingTokens = drumTokens.slice(0, baseVoicingLength);
  
  // Check if voicing has K
  const hasKick = baseVoicingTokens.some(token => {
    const normalized = token.replace(/\+/g, ' ').toUpperCase();
    return normalized.includes('K');
  });
  
  // Determine sticking pattern length
  let stickingLength: number;
  
  if (hasKick && !practicePadMode) {
    // If voicing has K, sticking must be at least as long as voicing and divisible by it
    // Minimum is voicing length, but can be multiples of it
    const minLength = baseVoicingLength;
    const maxLength = Math.min(baseVoicingLength * 4, 8); // Up to 4x voicing length, max 8
    const validLengths: number[] = [];
    
    for (let len = minLength; len <= maxLength; len++) {
      if (len % baseVoicingLength === 0 && len >= 2) {
        validLengths.push(len);
      }
    }
    
    stickingLength = validLengths.length > 0
      ? validLengths[Math.floor(Math.random() * validLengths.length)]
      : baseVoicingLength;
  } else {
    // No K in voicing - can be as short as 2, up to base voicing length or 4 (max)
    const minLength = 2;
    const maxLength = Math.min(baseVoicingLength, 4);
    stickingLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  }
  
  // Generate base sticking pattern - match the voicing pattern length, not the full bar
  // The pattern will be repeated automatically when needed
  const baseSticking: string[] = [];
  let currentHand = Math.random() > 0.5 ? 'R' : 'L';
  
  // Generate sticking pattern based on base voicing pattern
  for (let i = 0; i < stickingLength; i++) {
    const drumToken = baseVoicingTokens[i % baseVoicingLength];
    const normalizedToken = drumToken.replace(/\+/g, ' ').toUpperCase();
    
    if (normalizedToken.includes('K') && !practicePadMode) {
      // Kick drum = K in sticking (only if not in practice pad mode)
      baseSticking.push('K');
    } else if (normalizedToken === '' || normalizedToken === '-') {
      // Rest = keep rest in sticking pattern
      baseSticking.push('-');
    } else {
      // Regular note = alternate hands
      baseSticking.push(currentHand);
      currentHand = currentHand === 'R' ? 'L' : 'R';
    }
  }
  
  // Return just the base pattern - it will be repeated automatically when rendering/playing
  return formatList(baseSticking);
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
  let perBeatVoicing: string[] | undefined;
  let perBeatSticking: string[] | undefined;
  let stickingPattern: string;
  
  if (useAdvancedMode && perBeatSubdivisions) {
    // Generate per-beat voicing and sticking
    const [numerator] = parseTimeSignature(timeSignature);
    const { notesPerBeat } = calculateNotesPerBarFromPerBeatSubdivisions(timeSignature, perBeatSubdivisions);
    perBeatVoicing = [];
    perBeatSticking = [];
    
    for (let i = 0; i < numerator; i++) {
      const notesInBeat = notesPerBeat[i] || 1;
      let beatVoicing: string;
      
      if (practicePadMode) {
        beatVoicing = Array(notesInBeat).fill('S').join(' ');
      } else {
        const drumPatternArray = getRandomItem([...randomSets.drumPatterns]) as readonly string[];
        const beatTokens: string[] = [];
        for (let j = 0; j < notesInBeat; j++) {
          beatTokens.push(drumPatternArray[j % drumPatternArray.length]);
        }
        beatVoicing = formatList(beatTokens);
      }
      
      const beatSticking = generateStickingForDrumPattern(beatVoicing, notesInBeat, practicePadMode);
      perBeatVoicing.push(beatVoicing);
      perBeatSticking.push(beatSticking);
    }
    
    drumPattern = perBeatVoicing.join(' ');
    stickingPattern = perBeatSticking.join(' ');
  } else {
    // Standard mode
    // Calculate notes per beat (e.g., 16th notes in 4/4 = 4 notes per beat)
    const [numerator, denominator] = parseTimeSignature(timeSignature);
    const beatValue = denominator; // Typically 4 for quarter notes
    const notesPerBeat = subdivision / beatValue;
    
    if (practicePadMode) {
      // Generate pattern for one beat, will repeat automatically
      const beatTokens: string[] = [];
      for (let i = 0; i < notesPerBeat; i++) {
        // 80% chance of S, 20% chance of rest
        beatTokens.push(Math.random() < 0.8 ? 'S' : '-');
      }
      drumPattern = formatList(beatTokens);
    } else {
      // Generate voicing pattern for one beat (not full bar)
      const drumPatternArray = getRandomItem([...randomSets.drumPatterns]) as readonly string[];
      const beatTokens: string[] = [];
      for (let i = 0; i < notesPerBeat; i++) {
        beatTokens.push(drumPatternArray[i % drumPatternArray.length]);
      }
      drumPattern = formatList(beatTokens);
    }
    
    // Generate sticking pattern (2-4 notes, matching voicing pattern)
    stickingPattern = generateStickingForDrumPattern(drumPattern, notesPerBeat, practicePadMode);
  }
  
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
    _perBeatVoicing: perBeatVoicing,
    _perBeatSticking: perBeatSticking,
  };
}

