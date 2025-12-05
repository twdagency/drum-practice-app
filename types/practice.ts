/**
 * Practice mode type definitions
 */

export type NoteDynamic = 'ghost' | 'normal' | 'accent';

export interface ExpectedNote {
  time: number; // ms
  note: number | string; // MIDI note number or drum token (K, S, H, etc.)
  index: number; // Pattern index
  matched: boolean;
  dynamic?: NoteDynamic; // Expected volume level (ghost = soft, accent = loud)
  isGhost?: boolean; // Legacy: true if ghost note
  isAccent?: boolean; // Legacy: true if accented
}

export interface PracticeHit {
  time: number; // ms - actual hit time
  note: number | string; // MIDI note or drum token
  expectedTime: number; // ms - expected hit time
  timingError: number; // ms - absolute timing error
  rawTimingError: number; // ms - signed timing error (negative = early, positive = late)
  early: boolean;
  perfect: boolean;
  matched: boolean;
  velocity?: number; // 0-127 for MIDI, 0-100 for microphone (volume of hit)
  dynamic?: NoteDynamic; // Detected volume level
  dynamicMatch?: boolean; // Whether hit dynamic matched expected dynamic
}

export interface MIDINoteMap {
  [drumToken: string]: number; // Drum token (K, S, H, etc.) -> MIDI note number
}

export interface MIDIPracticeState {
  enabled: boolean;
  input: MIDIInput | null;
  startTime: number | null;
  expectedNotes: ExpectedNote[];
  actualHits: PracticeHit[];
  currentPatternIndex: number;
  accuracyWindow: number; // ms
  latencyAdjustment: number; // ms
  countInActive: boolean;
  countInBeats: number;
  warmUpMode: boolean;
  visualFeedback: boolean;
  showTimingErrors: boolean;
  showHitTimeline: boolean;
  showAccuracyHeatmap: boolean;
  showMissedNotes: boolean;
  latencyTestActive: boolean;
  latencyTestTimes: number[];
  noteMap: MIDINoteMap; // Custom MIDI note mapping
}

export interface MicrophonePracticeState {
  enabled: boolean;
  stream: MediaStream | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  microphone: MediaStreamAudioSourceNode | null;
  startTime: number | null;
  expectedNotes: ExpectedNote[];
  actualHits: PracticeHit[];
  currentPatternIndex: number;
  accuracyWindow: number; // ms
  latencyAdjustment: number; // ms
  countInActive: boolean;
  countInBeats: number;
  warmUpMode: boolean;
  visualFeedback: boolean;
  showTimingErrors: boolean;
  showHitTimeline: boolean;
  showAccuracyHeatmap: boolean;
  showMissedNotes: boolean;
  sensitivity: number; // 10-100
  threshold: number; // Volume threshold for normal hits
  ghostThreshold: number; // Volume threshold for ghost notes (lower)
  accentThreshold: number; // Volume threshold for accents (higher)
  lastHitTime: number;
  hitCooldown: number; // ms
  levelCheckInterval: NodeJS.Timeout | null;
  dynamicDetection: boolean; // Whether to detect ghost/accent dynamics
}

export interface MIDIRecordingState {
  enabled: boolean;
  input: MIDIInput | null;
  startTime: number | null;
  notes: Array<{
    time: number; // ms
    note: number; // MIDI note number
    velocity: number; // 0-127
  }>;
  timer: NodeJS.Timeout | null;
  timeSignature: string;
  subdivision: number;
  latencyAdjustment: number; // ms
  countInEnabled: boolean;
  metronomeEnabled: boolean;
  countInActive: boolean;
  countInBeats: number;
}

export interface PracticeStats {
  totalPracticeTime: number; // seconds
  sessions: PracticeSession[];
  patternsPracticed: Record<string, number>; // Pattern ID -> practice time in seconds
  tempoAchievements: Array<{
    patternId: number;
    maxBpm: number;
  }>;
  currentStreak: number; // Days in a row
  lastPracticeDate: string | null; // ISO date string
  
  // NEW: Best results per preset pattern
  presetBestScores: Record<string, PresetBestScore>; // Preset ID -> best scores
  
  // NEW: Weekly/monthly aggregates for trends
  weeklyAccuracy: number[]; // Last 7 days average accuracy
  weeklyPracticeTime: number[]; // Last 7 days practice time (seconds)
}

export interface PresetBestScore {
  presetId: string;
  presetName: string;
  bestAccuracy: number; // 0-100
  bestTiming: number; // ms (lower is better)
  bestBpm: number; // Highest BPM achieved with >80% accuracy
  attempts: number;
  totalTime: number; // seconds
  lastPracticed: number; // timestamp
  accuracyHistory: Array<{ timestamp: number; accuracy: number; bpm: number }>;
  mastery: 'beginner' | 'learning' | 'intermediate' | 'proficient' | 'master';
}

export interface PracticeSession {
  id: string;
  patternId: number | null;
  presetId?: string; // NEW: Link to preset if applicable
  presetName?: string; // NEW: Human-readable preset name
  startTime: number;
  endTime: number;
  duration: number; // seconds
  accuracy?: number; // percentage
  hits?: number;
  timingAvg?: number; // ms
  bpm?: number; // NEW: BPM during practice
  practiceMode?: 'midi' | 'microphone'; // NEW: Which mode was used
  dynamicAccuracy?: number; // NEW: Ghost/accent accuracy
  earlyHits?: number; // NEW: How many hits were early
  lateHits?: number; // NEW: How many hits were late
  perfectHits?: number; // NEW: How many hits were perfect
}

export interface PracticeGoals {
  streakGoal: number | null; // Days
  bpmGoal: number | null; // Target BPM
  accuracyGoal: number | null; // Target accuracy percentage
  practiceTimeGoal: number | null; // Target minutes per day
}

