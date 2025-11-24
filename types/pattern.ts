/**
 * Pattern type definitions
 */

export interface Pattern {
  id: number;
  timeSignature: string; // e.g., "4/4", "3/4"
  subdivision: number; // 4, 8, 12, 16, 24, 32 (default subdivision, used when advancedMode is false)
  phrase: string; // e.g., "4 4 4 4"
  drumPattern: string; // e.g., "S S K S"
  stickingPattern: string; // e.g., "R L R L"
  leftFoot: boolean;
  rightFoot: boolean;
  repeat: number; // Number of bars to repeat
  _expanded?: boolean; // UI state - whether pattern is expanded
  _presetName?: string; // Name if loaded from preset
  _presetDescription?: string; // Description if loaded from preset
  _presetAccents?: number[]; // Accent indices if from preset
  _polyrhythmRightNotes?: number[]; // For polyrhythm patterns
  _polyrhythmLeftNotes?: number[]; // For polyrhythm patterns
  _advancedMode?: boolean; // If true, use per-beat subdivisions instead of single subdivision
  _perBeatSubdivisions?: number[]; // Array of subdivisions for each beat in the bar (e.g., [16, 8, 4, 4] means beat 1 has 16th notes, beat 2 has 8th notes, beats 3-4 have quarter notes)
  _perBeatVoicing?: string[]; // Array of voicing patterns, one per beat (only used when _advancedMode is true)
  _perBeatSticking?: string[]; // Array of sticking patterns, one per beat (only used when _advancedMode is true)
}

export interface PatternHistoryEntry {
  patterns: Pattern[];
  timestamp: number;
}

