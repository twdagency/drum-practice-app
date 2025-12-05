/**
 * Polyrhythm calculation and generation utilities
 */

import { PolyrhythmPattern } from '@/types/polyrhythm';
import { calculatePolyrhythmPositions } from './polyrhythmPositionCalculator';
import { parseTimeSignature } from './patternUtils';

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
 * 
 * @deprecated This function uses subdivision indices which is incorrect.
 * Use calculatePolyrhythmPositions from polyrhythmPositionCalculator.ts instead,
 * which calculates positions in beats for accuracy.
 * 
 * This function is kept for backward compatibility but should not be used for new code.
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
 * @param baseSubdivision The base subdivision to use (4=quarter, 8=eighth, 16=sixteenth, 32=32nd)
 * @returns Total subdivisions in one measure (calculated from time signature)
 */
export function calculateMeasureLength(timeSignature: string, baseSubdivision: number = 16): number {
  // Parse time signature (e.g., "4/4" -> [4, 4])
  const parts = timeSignature.split('/').map(p => parseInt(p.trim(), 10));
  if (parts.length !== 2 || parts.some(isNaN)) {
    // Default to 4/4 if invalid
    const defaultSubdivisionsPerBeat = baseSubdivision / 4;
    return 4 * defaultSubdivisionsPerBeat; // 4 beats × subdivisions per beat
  }
  
  const [numerator, denominator] = parts;
  
  // Calculate subdivisions per beat based on the provided base subdivision
  // denominator: 4 = quarter note beat, 8 = eighth note beat
  // For baseSubdivision = 16 (sixteenth notes) and denominator = 4:
  //   subdivisionsPerBeat = 16/4 = 4 subdivisions per quarter note beat
  // For baseSubdivision = 8 (eighth notes) and denominator = 4:
  //   subdivisionsPerBeat = 8/4 = 2 subdivisions per quarter note beat
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
    subdivision?: number;
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
    subdivision: customSubdivision = 16,
    name,
    description,
  } = options;

  // Calculate measure length using the provided subdivision
  // This affects how note positions are mapped to subdivision indices
  const measureLength = calculateMeasureLength(timeSignature, customSubdivision);
  
  // Calculate note positions using the new beat-based calculator
  const [beatsPerBar] = parseTimeSignature(timeSignature);
  const positions = calculatePolyrhythmPositions(numerator, denominator, beatsPerBar);
  
  // Convert beat positions to subdivision indices for storage
  // This maintains backward compatibility with the existing data structure
  // The rendering code will recalculate using beat positions for accuracy
  const rightNotes = positions.rightPositions.map(pos => {
    // Convert beat position to subdivision index
    // For 4/4 with 16th notes: beat 1 = index 4, beat 2 = index 8, etc.
    const subdivisionsPerBeat = measureLength / beatsPerBar;
    return Math.round(pos * subdivisionsPerBeat);
  });
  
  const leftNotes = positions.leftPositions.map(pos => {
    const subdivisionsPerBeat = measureLength / beatsPerBar;
    return Math.round(pos * subdivisionsPerBeat);
  });
  
  // For polyrhythm purposes, the "cycle length" is the measure length
  // Both rhythms fit within one measure and repeat every measure
  const cycleLength = measureLength;
  
  // Store the subdivision value used for this pattern
  const subdivision = customSubdivision;

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
  subdivision: number;
  notesPerBar: number;
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
  
  // Calculate notes per bar from cycle length
  // NOTE: Don't multiply by repeat here - the Stave component handles repeats
  // by expanding the polyrhythm patterns into separate bars via processedPolyrhythmPatterns
  const notesPerBar = cycleLength;
  
  return {
    drumPattern: drumPattern.join(' '),
    stickingPattern: stickingPattern.join(' '),
    subdivision: polyrhythm.subdivision,
    notesPerBar,
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

