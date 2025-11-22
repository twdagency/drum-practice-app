/**
 * Application constants extracted from WordPress plugin
 */

export const CONSTANTS = {
  TIMING: {
    PERFECT_HIT_THRESHOLD: 5, // ms - perfect hit window
    DEFAULT_TOLERANCE: 50, // ms - default accuracy window
    HIT_COOLDOWN: 50, // ms - minimum time between hits
    CACHE_TTL: 100, // ms - note refs cache TTL
    LATENCY_TEST_SAMPLES: 5, // number of hits for latency test
    LATENCY_ADJUSTMENT_MIN: -300, // ms
    LATENCY_ADJUSTMENT_MAX: 300, // ms
  },
  AUDIO: {
    FFT_SIZE: 2048, // AnalyserNode FFT size
    SMOOTHING_TIME_CONSTANT: 0.3, // AnalyserNode smoothing
    DEFAULT_SENSITIVITY: 50, // Microphone sensitivity (10-100)
    SENSITIVITY_MIN: 10,
    SENSITIVITY_MAX: 100,
    THRESHOLD_MIN: 0.1,
    THRESHOLD_MAX: 0.9,
    LEVEL_CHECK_INTERVAL: 50, // ms - microphone level update interval
    CALIBRATION_SAMPLES: 100, // number of samples for calibration
  },
  PATTERN: {
    BPM_MIN: 40,
    BPM_MAX: 260,
    SUBDIVISION_MIN: 4,
    SUBDIVISION_MAX: 32,
    REPEAT_MIN: 1,
    REPEAT_MAX: 20,
    LONG_PATTERN_THRESHOLD: 100, // notes - threshold for batching
    MAX_STAVE_WIDTH: 4000, // px - maximum stave width
  },
  UI: {
    TOAST_DURATION: 3000, // ms - default toast duration
    HIGHLIGHT_FADE_DURATION: 300, // ms - note highlight fade
    DEBOUNCE_DELAY: 16, // ms - pattern generation debounce
    MODAL_ANIMATION_DURATION: 200, // ms - modal open/close animation
  },
  STORAGE: {
    MAX_SESSIONS: 200, // maximum practice sessions to store
    MAX_ACCURACY_HISTORY: 50, // maximum accuracy history entries per pattern
    MAX_PATTERN_HISTORY: 50, // maximum pattern history entries
  },
} as const;

export const DEFAULTS = {
  timeSignature: '4/4',
  subdivision: 16,
  phrase: '4 4 4 4',
  drumPattern: 'S S K S',
  stickingPattern: 'R L K R',
  bpm: 120,
  highlightMode: 'accent',
  leftFoot: false,
  rightFoot: false,
} as const;

