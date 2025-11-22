/**
 * Polyrhythm calculation and generation utilities
 */

import { PolyrhythmPattern } from '@/types/polyrhythm';

/**
 * Calculate the least common multiple (LCM) of two numbers
 */
function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * Calculate the greatest common divisor (GCD) of two numbers
 */
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Calculate note positions for a polyrhythm within a measure
 * Notes are evenly spaced across the measure length
 * 
 * @param numNotes Number of notes in this rhythm (e.g., 3 for "3 against 2")
 * @param measureLength Total subdivisions in one measure (e.g., 16 for 16th notes in 4/4)
 * @returns Array of indices where notes occur (0-based, within the measure)
 */
export function calculatePolyrhythmNotes(
  numNotes: number,
  measureLength: number
): number[] {
  if (numNotes === 0) return [];
  
  const notes: number[] = [];
  
  // Evenly space notes across the measure
  // For numNotes = 4 and measureLength = 16:
  // spacing = 16 / 4 = 4, so positions at 0, 4, 8, 12
  // To center notes better, we can use: position = (i + 0.5) * spacing - spacing/2
  // But simpler: position = i * measureLength / numNotes
  
  for (let i = 0; i < numNotes; i++) {
    // Calculate position as a fraction, then convert to subdivision index
    // For even spacing: first note at position 0, last note just before measureLength
    const position = (i / numNotes) * measureLength;
    // Round to nearest integer subdivision index
    const index = Math.round(position);
    // Clamp to measure bounds
    const clampedIndex = Math.max(0, Math.min(measureLength - 1, index));
    notes.push(clampedIndex);
  }
  
  // Remove duplicates and sort
  return [...new Set(notes)].sort((a, b) => a - b);
}

/**
 * Calculate measure length from time signature
 * For polyrhythms, both rhythms fit within one measure
 * The ratio defines the subdivision - we just need to fit the notes evenly across the bar
 * 
 * @param timeSignature Time signature string (e.g., "4/4", "3/4", "7/8")
 * @returns Total subdivisions in one measure (calculated from time signature only)
 * 
 * For polyrhythms, we use a base subdivision based on the time signature:
 * - 4/4, 3/4, 2/4: use 16th notes (4 subdivisions per beat)
 * - 6/8, 9/8, 12/8: use 16th notes (2 subdivisions per eighth note beat)
 * - 7/8, 5/8: use 16th notes (2 subdivisions per eighth note beat)
 * We always use a fine enough subdivision to fit any ratio evenly
 */
export function calculateMeasureLength(timeSignature: string): number {
  // Parse time signature (e.g., "4/4" -> [4, 4])
  const parts = timeSignature.split('/').map(p => parseInt(p.trim(), 10));
  if (parts.length !== 2 || parts.some(isNaN)) {
    // Default to 4/4 if invalid
    return 16; // 4 beats × 4 sixteenth notes per beat = 16
  }
  
  const [numerator, denominator] = parts;
  
  // For polyrhythms, we always use a fine subdivision (16th notes) to fit any ratio
  // This ensures we can evenly space any number of notes within the bar
  const baseSubdivision = 16; // Always use 16th notes for polyrhythms
  
  // Calculate subdivisions per beat
  // denominator: 4 = quarter note beat, 8 = eighth note beat
  // subdivisionsPerBeat = baseSubdivision / denominator (e.g., 16/4 = 4, 16/8 = 2)
  const subdivisionsPerBeat = baseSubdivision / denominator;
  
  // Total subdivisions = number of beats × subdivisions per beat
  const measureLength = numerator * subdivisionsPerBeat;
  
  return Math.round(measureLength);
}

/**
 * Generate a polyrhythm pattern from a ratio
 */
export function generatePolyrhythmPattern(
  numerator: number,
  denominator: number,
  options: {
    rightLimb?: 'right-hand' | 'left-hand' | 'right-foot' | 'left-foot';
    leftLimb?: 'right-hand' | 'left-hand' | 'right-foot' | 'left-foot';
    rightVoice?: 'snare' | 'kick' | 'hi-hat' | 'tom' | 'floor';
    leftVoice?: 'snare' | 'kick' | 'hi-hat' | 'tom' | 'floor';
    timeSignature?: string;
    name?: string;
    description?: string;
  } = {}
): PolyrhythmPattern {
  const {
    rightLimb = 'right-hand',
    leftLimb = 'left-hand',
    rightVoice = 'snare',
    leftVoice = 'kick',
    timeSignature = '4/4',
    name,
    description,
  } = options;

  // Calculate measure length from time signature only
  // The ratio defines the subdivision - we don't need to specify it
  const measureLength = calculateMeasureLength(timeSignature);
  
  // Calculate note positions within the measure
  // Each rhythm is evenly spaced across the same measure
  const rightNotes = calculatePolyrhythmNotes(numerator, measureLength);
  const leftNotes = calculatePolyrhythmNotes(denominator, measureLength);
  
  // For polyrhythm purposes, the "cycle length" is the measure length
  // Both rhythms fit within one measure and repeat every measure
  const cycleLength = measureLength;
  
  // For display purposes, we still need a subdivision value
  // We always use 16th notes for polyrhythms (fine enough to fit any ratio)
  const subdivision = 16;

  const patternName = name || `${numerator}:${denominator} Polyrhythm`;
  const patternDescription = description || 
    `${numerator} notes in ${rightLimb.replace('-', ' ')} against ${denominator} notes in ${leftLimb.replace('-', ' ')}`;

  return {
    id: Date.now() + Math.random(),
    ratio: { numerator, denominator },
    name: patternName,
    description: patternDescription,
    rightRhythm: {
      notes: rightNotes,
      limb: rightLimb,
      voice: rightVoice,
      accents: [],
    },
    leftRhythm: {
      notes: leftNotes,
      limb: leftLimb,
      voice: leftVoice,
      accents: [],
    },
    cycleLength,
    timeSignature,
    subdivision,
    learningMode: {
      enabled: false,
      rightHandLoops: 4,
      leftHandLoops: 4,
      togetherLoops: 4,
    },
    repeat: 1,
    _expanded: true,
  };
}

/**
 * Convert polyrhythm notes to drum pattern string
 * For display/playback compatibility with regular patterns
 */
export function polyrhythmNotesToDrumPattern(
  notes: number[],
  cycleLength: number,
  voice: 'snare' | 'kick' | 'hi-hat' | 'tom' | 'floor'
): string {
  const voiceMap: Record<string, string> = {
    snare: 'S',
    kick: 'K',
    'hi-hat': 'H',
    tom: 'T',
    floor: 'F',
  };
  
  const voiceToken = voiceMap[voice] || 'S';
  const pattern: string[] = [];
  
  for (let i = 0; i < cycleLength; i++) {
    if (notes.includes(i)) {
      pattern.push(voiceToken);
    } else {
      pattern.push('R'); // Rest
    }
  }
  
  return pattern.join(' ');
}

/**
 * Convert polyrhythm to regular pattern format (for compatibility)
 * This creates a combined pattern showing both rhythms
 */
export function polyrhythmToCombinedPattern(
  polyrhythm: PolyrhythmPattern
): {
  drumPattern: string;
  stickingPattern: string;
  phrase: string;
  subdivision: number;
} {
  const cycleLength = polyrhythm.cycleLength;
  const drumPattern: string[] = [];
  const stickingPattern: string[] = [];
  
  // Map limbs to sticking
  const limbToSticking: Record<string, string> = {
    'right-hand': 'R',
    'left-hand': 'L',
    'right-foot': 'RF',
    'left-foot': 'LF',
  };
  
  const rightSticking = limbToSticking[polyrhythm.rightRhythm.limb] || 'R';
  const leftSticking = limbToSticking[polyrhythm.leftRhythm.limb] || 'L';
  
  // Map voices to drum pattern tokens
  const voiceMap: Record<string, string> = {
    snare: 'S',
    kick: 'K',
    'hi-hat': 'H',
    tom: 'T',
    floor: 'F',
  };
  
  const rightVoice = voiceMap[polyrhythm.rightRhythm.voice] || 'S';
  const leftVoice = voiceMap[polyrhythm.leftRhythm.voice] || 'K';
  
  for (let i = 0; i < cycleLength; i++) {
    const hasRight = polyrhythm.rightRhythm.notes.includes(i);
    const hasLeft = polyrhythm.leftRhythm.notes.includes(i);
    
    if (hasRight && hasLeft) {
      // Both rhythms hit together
      drumPattern.push(`${rightVoice}+${leftVoice}`);
      stickingPattern.push(`${rightSticking}+${leftSticking}`);
    } else if (hasRight) {
      drumPattern.push(rightVoice);
      stickingPattern.push(rightSticking);
    } else if (hasLeft) {
      drumPattern.push(leftVoice);
      stickingPattern.push(leftSticking);
    } else {
      drumPattern.push('R');
      stickingPattern.push('-');
    }
  }
  
  // Generate phrase (all 1s for now, or could be based on accents)
  // Multiply by repeat count to get full pattern length
  const totalLength = cycleLength * polyrhythm.repeat;
  const phrase = Array(totalLength).fill(1);
  
  // Repeat the drum and sticking patterns for each repeat
  const fullDrumPattern: string[] = [];
  const fullStickingPattern: string[] = [];
  
  for (let r = 0; r < polyrhythm.repeat; r++) {
    fullDrumPattern.push(...drumPattern);
    fullStickingPattern.push(...stickingPattern);
  }
  
  return {
    drumPattern: fullDrumPattern.join(' '),
    stickingPattern: fullStickingPattern.join(' '),
    phrase: phrase.join(' '),
    subdivision: polyrhythm.subdivision,
  };
}

/**
 * Get common polyrhythm ratios
 */
export const COMMON_POLYRHYTHMS = [
  { numerator: 3, denominator: 2, name: '3 against 2', description: 'Triplets against eighth notes' },
  { numerator: 4, denominator: 3, name: '4 against 3', description: 'Four notes against three' },
  { numerator: 5, denominator: 4, name: '5 against 4', description: 'Five notes against four' },
  { numerator: 5, denominator: 3, name: '5 against 3', description: 'Five notes against three' },
  { numerator: 7, denominator: 4, name: '7 against 4', description: 'Seven notes against four' },
  { numerator: 3, denominator: 4, name: '3 against 4', description: 'Three notes against four' },
];

