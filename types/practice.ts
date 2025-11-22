/**
 * Practice mode type definitions
 */

export interface ExpectedNote {
  time: number; // ms
  note: number | string; // MIDI note number or drum token (K, S, H, etc.)
  index: number; // Pattern index
  matched: boolean;
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
  threshold: number; // Volume threshold
  lastHitTime: number;
  hitCooldown: number; // ms
  levelCheckInterval: NodeJS.Timeout | null;
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
}

export interface PracticeSession {
  id: string;
  patternId: number | null;
  startTime: number;
  endTime: number;
  duration: number; // seconds
  accuracy?: number; // percentage
  hits?: number;
  timingAvg?: number; // ms
}

export interface PracticeGoals {
  streakGoal: number | null; // Days
  bpmGoal: number | null; // Target BPM
  accuracyGoal: number | null; // Target accuracy percentage
  practiceTimeGoal: number | null; // Target minutes per day
}

