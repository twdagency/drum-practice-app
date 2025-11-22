/**
 * Pattern type definitions
 */

export interface Pattern {
  id: number;
  timeSignature: string; // e.g., "4/4", "3/4"
  subdivision: number; // 4, 8, 12, 16, 24, 32
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
}

export interface PatternHistoryEntry {
  patterns: Pattern[];
  timestamp: number;
}

