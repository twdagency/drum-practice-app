/**
 * Polyrhythm pattern type definitions
 * Separate from regular patterns to handle polyrhythmic structures
 */

export interface PolyrhythmPattern {
  id: number;
  ratio: {
    numerator: number; // e.g., 3 for "3 against 2"
    denominator: number; // e.g., 2 for "3 against 2"
  };
  name?: string; // Optional name for the pattern
  description?: string; // Optional description
  
  // Right hand/limb rhythm
  rightRhythm: {
    notes: number[]; // Subdivision indices where notes occur (0-based)
    limb: 'right-hand' | 'left-hand' | 'right-foot' | 'left-foot';
    voice: 'snare' | 'kick' | 'hi-hat' | 'tom' | 'floor';
    accents?: number[]; // Accent indices within the rhythm
  };
  
  // Left hand/limb rhythm
  leftRhythm: {
    notes: number[]; // Subdivision indices where notes occur (0-based)
    limb: 'right-hand' | 'left-hand' | 'right-foot' | 'left-foot';
    voice: 'snare' | 'kick' | 'hi-hat' | 'tom' | 'floor';
    accents?: number[]; // Accent indices within the rhythm
  };
  
  // Cycle and timing
  cycleLength: number; // Total subdivisions in one measure (measure length)
  timeSignature: string; // e.g., "4/4"
  subdivision: number; // Base subdivision (e.g., 16 for sixteenth notes) - used for display/measure calculation
  
  // Learning exercise settings
  learningMode: {
    enabled: boolean;
    rightHandLoops: number; // How many times to loop right hand before moving to left
    leftHandLoops: number; // How many times to loop left hand before moving to together
    togetherLoops: number; // How many times to loop both together before repeating
  };
  
  repeat: number; // Number of cycles to repeat in normal playback
  
  // Display preferences (can be overridden by global settings)
  displayMode?: 'separate-positions' | 'stacked' | 'two-staves';
  
  _expanded?: boolean; // UI state - whether pattern is expanded
}

