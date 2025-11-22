/**
 * Main type exports
 */

export * from './pattern';
export * from './practice';
export * from './audio';

/**
 * Main application state type
 */
export interface AppState {
  // Pattern management
  patterns: import('./pattern').Pattern[];
  draggedPatternId: number | null;
  
  // Playback
  bpm: number;
  isPlaying: boolean;
  loopCount: number;
  currentLoop: number;
  countInEnabled: boolean;
  playDrumSounds: boolean;
  muteClickTrack: boolean;
  metronomeOnlyMode: boolean;
  silentPracticeMode: boolean;
  slowMotionEnabled: boolean;
  slowMotionSpeed: number;
  playBackwards: boolean;
  loopMeasures: { start: number; end: number } | null;
  clickSoundType: import('./audio').ClickSoundType;
  accentBeatOne: boolean;
  subdivisionClicks: boolean;
  
  // UI
  isFullscreen: boolean;
  scrollAnimationEnabled: boolean;
  staveZoom: number;
  showGridLines: boolean;
  showMeasureNumbers: boolean;
  showVisualMetronome: boolean;
  darkMode: boolean;
  
  // Audio
  volumes: import('./audio').Volumes;
  audioBuffers: import('./audio').AudioBuffers;
  audioBuffersLoaded: boolean;
  
  // Practice modes
  midiPractice: import('./practice').MIDIPracticeState;
  microphonePractice: import('./practice').MicrophonePracticeState;
  midiRecording: import('./practice').MIDIRecordingState;
  
  // Practice tracking
  practiceStats: import('./practice').PracticeStats;
  practiceGoals: import('./practice').PracticeGoals;
  practiceStartTime: number | null;
  
  // History
  history: import('./pattern').PatternHistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Internal state (not in store, managed by hooks)
  renderer: any; // VexFlow renderer
  accentIndices: number[];
  restIndices: number[];
  noteRefs: any[];
  totalNotes: number;
  subdivision: number;
  notesPerBeat: number;
  highlightIndex: number | null;
  audioContext: AudioContext | null;
  metronomeTimer: NodeJS.Timeout | null;
  scrollAnimationTimer: NodeJS.Timeout | null;
  tapTimes: number[];
  metronomeBeat: number;
  metronomeAnimationId: number | null;
  practiceTimerInterval: NodeJS.Timeout | null;
}

