/**
 * Practice mode slice for Zustand store
 */

import { StateCreator } from 'zustand';
import {
  MIDIPracticeState,
  MicrophonePracticeState,
  MIDIRecordingState,
  PracticeStats,
  PracticeGoals,
  MIDINoteMap,
} from '@/types';
import { CONSTANTS } from '@/lib/utils/constants';

export interface PracticeSlice {
  // State
  midiPractice: MIDIPracticeState;
  microphonePractice: MicrophonePracticeState;
  midiRecording: MIDIRecordingState;
  practiceStats: PracticeStats;
  practiceGoals: PracticeGoals;
  practiceStartTime: number | null;

  // MIDI Practice Actions
  setMIDIPracticeEnabled: (enabled: boolean) => void;
  setMIDIInput: (input: MIDIInput | null) => void;
  setMIDIPracticeAccuracyWindow: (window: number) => void;
  setMIDILatencyAdjustment: (adjustment: number) => void;
  setMIDIExpectedNotes: (notes: ExpectedNote[]) => void;
  addMIDIHit: (hit: PracticeHit) => void;
  markMIDINoteMatched: (index: number) => void;
  setMIDIStartTime: (time: number | null) => void;
  setMIDICountInActive: (active: boolean) => void;
  setMIDIVisualFeedback: (enabled: boolean) => void;
  setMIDIShowTimingErrors: (enabled: boolean) => void;
  setMIDINoteMap: (noteMap: MIDINoteMap) => void;
  resetMIDINoteMap: () => void;
  resetMIDIPractice: () => void;

  // Microphone Practice Actions
  setMicrophonePracticeEnabled: (enabled: boolean) => void;
  setMicrophoneStream: (stream: MediaStream | null) => void;
  setMicrophoneAudioContext: (context: AudioContext | null) => void;
  setMicrophoneAnalyser: (analyser: AnalyserNode | null) => void;
  setMicrophoneSource: (source: MediaStreamAudioSourceNode | null) => void;
  setMicrophoneSensitivity: (sensitivity: number) => void;
  setMicrophoneThreshold: (threshold: number) => void;
  setMicrophoneLatencyAdjustment: (adjustment: number) => void;
  setMicrophonePracticeAccuracyWindow: (window: number) => void;
  setMicrophoneExpectedNotes: (notes: ExpectedNote[]) => void;
  addMicrophoneHit: (hit: PracticeHit) => void;
  clearMicrophoneHits: () => void;
  markMicrophoneNoteMatched: (index: number) => void;
  setMicrophoneStartTime: (time: number | null) => void;
  setMicrophoneCountInActive: (active: boolean) => void;
  setMicrophoneLevelCheckInterval: (interval: NodeJS.Timeout | null) => void;
  setMicrophoneVisualFeedback: (enabled: boolean) => void;
  setMicrophoneShowTimingErrors: (enabled: boolean) => void;
  resetMicrophonePractice: () => void;

  // MIDI Recording Actions
  setMIDIRecordingEnabled: (enabled: boolean) => void;
  setMIDIRecordingInput: (input: MIDIInput | null) => void;
  setMIDIRecordingLatencyAdjustment: (adjustment: number) => void;
  setMIDIRecordingStartTime: (time: number | null) => void;
  addMIDIRecordingNote: (note: { time: number; note: number; velocity: number }) => void;
  clearMIDIRecordingNotes: () => void;
  setMIDIRecordingTimeSignature: (timeSignature: string) => void;
  setMIDIRecordingSubdivision: (subdivision: number) => void;
  setMIDIRecordingCountInEnabled: (enabled: boolean) => void;
  setMIDIRecordingMetronomeEnabled: (enabled: boolean) => void;
  setMIDIRecordingCountInActive: (active: boolean) => void;
  setMIDIRecordingCountInBeats: (beats: number) => void;
  resetMIDIRecording: () => void;

  // Practice Stats Actions
  setPracticeStartTime: (time: number | null) => void;
  updatePracticeStats: (stats: Partial<PracticeStats>) => void;
  updatePracticeGoals: (goals: Partial<PracticeGoals>) => void;
}

// Load persisted settings from localStorage
const loadPersistedSettings = () => {
  if (typeof window === 'undefined') {
    return {
      midi: null,
      microphone: null,
    };
  }

  try {
    const midiSettings = window.localStorage.getItem('dpgen_midi_practice_settings');
    const microphoneSettings = window.localStorage.getItem('dpgen_microphone_practice_settings');
    
    return {
      midi: midiSettings ? JSON.parse(midiSettings) : null,
      microphone: microphoneSettings ? JSON.parse(microphoneSettings) : null,
    };
  } catch (e) {
    console.error('Failed to load persisted settings:', e);
    return {
      midi: null,
      microphone: null,
    };
  }
};

const persisted = loadPersistedSettings();

// Default General MIDI drum map (channel 10, note numbers)
const DEFAULT_MIDI_NOTE_MAP: MIDINoteMap = {
  K: 36,  // Kick (C1)
  S: 38,  // Snare (D1)
  H: 42,  // Hi-hat closed (F#1)
  'H+': 46, // Hi-hat open (A#1)
  T: 47,  // Low-Mid Tom (B1)
  F: 41,  // Low Tom (F1)
  R: 0,   // Rest (no note)
};

const initialMIDIPractice: MIDIPracticeState = {
  enabled: false,
  input: null,
  startTime: null,
  expectedNotes: [],
  actualHits: [],
  currentPatternIndex: 0,
  accuracyWindow: persisted.midi?.accuracyWindow ?? CONSTANTS.TIMING.DEFAULT_TOLERANCE,
  latencyAdjustment: persisted.midi?.latencyAdjustment ?? 0,
  countInActive: false,
  countInBeats: 4,
  warmUpMode: false,
  visualFeedback: persisted.midi?.visualFeedback ?? true,
  showTimingErrors: persisted.midi?.showTimingErrors ?? true,
  showHitTimeline: false,
  showAccuracyHeatmap: false,
  showMissedNotes: true,
  latencyTestActive: false,
  latencyTestTimes: [],
  noteMap: persisted.midi?.noteMap ?? { ...DEFAULT_MIDI_NOTE_MAP },
};

const initialMicrophonePractice: MicrophonePracticeState = {
  enabled: false,
  stream: null,
  audioContext: null,
  analyser: null,
  microphone: null,
  startTime: null,
  expectedNotes: [],
  actualHits: [],
  currentPatternIndex: 0,
  accuracyWindow: persisted.microphone?.accuracyWindow ?? CONSTANTS.TIMING.DEFAULT_TOLERANCE,
  latencyAdjustment: persisted.microphone?.latencyAdjustment ?? 0,
  countInActive: false,
  countInBeats: 4,
  warmUpMode: false,
  visualFeedback: persisted.microphone?.visualFeedback ?? true,
  showTimingErrors: persisted.microphone?.showTimingErrors ?? true,
  showHitTimeline: false,
  showAccuracyHeatmap: false,
  showMissedNotes: true,
  sensitivity: persisted.microphone?.sensitivity ?? 70,
  threshold: persisted.microphone?.threshold ?? 0.15,
  lastHitTime: 0,
  hitCooldown: CONSTANTS.TIMING.HIT_COOLDOWN,
  levelCheckInterval: null,
};

const initialMIDIRecording: MIDIRecordingState = {
  enabled: false,
  input: null,
  startTime: null,
  notes: [],
  timer: null,
  timeSignature: '4/4',
  subdivision: 16,
  latencyAdjustment: 0,
  countInEnabled: true,
  metronomeEnabled: true,
  countInActive: false,
  countInBeats: 4,
};

const initialPracticeStats: PracticeStats = {
  totalPracticeTime: 0,
  sessions: [],
  patternsPracticed: {},
  tempoAchievements: [],
  currentStreak: 0,
  lastPracticeDate: null,
};

const initialPracticeGoals: PracticeGoals = {
  streakGoal: null,
  bpmGoal: null,
  accuracyGoal: null,
  practiceTimeGoal: null,
};

export const createPracticeSlice: StateCreator<PracticeSlice> = (set) => ({
  // Initial state
  midiPractice: { ...initialMIDIPractice },
  microphonePractice: { ...initialMicrophonePractice },
  midiRecording: { ...initialMIDIRecording },
  practiceStats: { ...initialPracticeStats },
  practiceGoals: { ...initialPracticeGoals },
  practiceStartTime: null,

  // MIDI Practice Actions
  setMIDIPracticeEnabled: (enabled) =>
    set((state) => ({
      midiPractice: {
        ...state.midiPractice,
        enabled,
        ...(enabled ? {} : { startTime: null, expectedNotes: [], actualHits: [] }),
      },
    })),

  setMIDIInput: (input) =>
    set((state) => {
      const updated = { ...state.midiPractice, input };
      // Persist device ID to localStorage
      if (typeof window !== 'undefined') {
        try {
          const existing = window.localStorage.getItem('dpgen_midi_practice_settings');
          const settings = existing ? JSON.parse(existing) : {};
          settings.deviceId = input?.id ?? null;
          window.localStorage.setItem('dpgen_midi_practice_settings', JSON.stringify(settings));
        } catch (e) {
          console.error('Failed to save MIDI device:', e);
        }
      }
      return { midiPractice: updated };
    }),

  setMIDIPracticeAccuracyWindow: (accuracyWindow) =>
    set((state) => {
      const updated = { ...state.midiPractice, accuracyWindow };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('dpgen_midi_practice_settings', JSON.stringify({
            accuracyWindow: updated.accuracyWindow,
            latencyAdjustment: updated.latencyAdjustment,
            visualFeedback: updated.visualFeedback,
            showTimingErrors: updated.showTimingErrors,
          }));
        } catch (e) {
          console.error('Failed to save MIDI settings:', e);
        }
      }
      return { midiPractice: updated };
    }),

  setMIDILatencyAdjustment: (adjustment) =>
    set((state) => {
      const updated = {
        ...state.midiPractice,
        latencyAdjustment: Math.max(
          CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MIN,
          Math.min(CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MAX, adjustment)
        ),
      };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('dpgen_midi_practice_settings', JSON.stringify({
            accuracyWindow: updated.accuracyWindow,
            latencyAdjustment: updated.latencyAdjustment,
            visualFeedback: updated.visualFeedback,
            showTimingErrors: updated.showTimingErrors,
          }));
        } catch (e) {
          console.error('Failed to save MIDI settings:', e);
        }
      }
      return { midiPractice: updated };
    }),

  setMIDIExpectedNotes: (notes) =>
    set((state) => ({
      midiPractice: {
        ...state.midiPractice,
        expectedNotes: notes,
      },
    })),

  addMIDIHit: (hit) =>
    set((state) => ({
      midiPractice: {
        ...state.midiPractice,
        actualHits: [...state.midiPractice.actualHits, hit],
      },
    })),

  markMIDINoteMatched: (index) =>
    set((state) => ({
      midiPractice: {
        ...state.midiPractice,
        expectedNotes: state.midiPractice.expectedNotes.map((note, i) =>
          i === index ? { ...note, matched: true } : note
        ),
      },
    })),

  setMIDIStartTime: (time) =>
    set((state) => ({
      midiPractice: {
        ...state.midiPractice,
        startTime: time,
      },
    })),

  setMIDICountInActive: (active) =>
    set((state) => ({
      midiPractice: {
        ...state.midiPractice,
        countInActive: active,
      },
    })),

  setMIDIVisualFeedback: (enabled) =>
    set((state) => {
      const updated = {
        ...state.midiPractice,
        visualFeedback: enabled,
      };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('dpgen_midi_practice_settings', JSON.stringify({
            accuracyWindow: updated.accuracyWindow,
            latencyAdjustment: updated.latencyAdjustment,
            visualFeedback: updated.visualFeedback,
            showTimingErrors: updated.showTimingErrors,
          }));
        } catch (e) {
          console.error('Failed to save MIDI settings:', e);
        }
      }
      return { midiPractice: updated };
    }),

  setMIDIShowTimingErrors: (enabled) =>
    set((state) => {
      const updated = {
        ...state.midiPractice,
        showTimingErrors: enabled,
      };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('dpgen_midi_practice_settings', JSON.stringify({
            accuracyWindow: updated.accuracyWindow,
            latencyAdjustment: updated.latencyAdjustment,
            visualFeedback: updated.visualFeedback,
            showTimingErrors: updated.showTimingErrors,
          }));
        } catch (e) {
          console.error('Failed to save MIDI settings:', e);
        }
      }
      return { midiPractice: updated };
    }),

  resetMIDIPractice: () =>
    set({
      midiPractice: { ...initialMIDIPractice },
    }),

  // Microphone Practice Actions
  setMicrophonePracticeEnabled: (enabled) =>
    set((state) => ({
      microphonePractice: {
        ...state.microphonePractice,
        enabled,
        ...(enabled ? {} : { startTime: null, expectedNotes: [], actualHits: [] }),
      },
    })),

  setMicrophoneStream: (stream) =>
    set((state) => ({
      microphonePractice: { ...state.microphonePractice, stream },
    })),

  setMicrophoneAudioContext: (context) =>
    set((state) => ({
      microphonePractice: { ...state.microphonePractice, audioContext: context },
    })),

  setMicrophoneAnalyser: (analyser) =>
    set((state) => ({
      microphonePractice: { ...state.microphonePractice, analyser },
    })),

  setMicrophoneSource: (source) =>
    set((state) => ({
      microphonePractice: { ...state.microphonePractice, microphone: source },
    })),

  setMicrophoneSensitivity: (sensitivity) =>
    set((state) => {
      const updated = {
        ...state.microphonePractice,
        sensitivity: Math.max(
          CONSTANTS.AUDIO.SENSITIVITY_MIN,
          Math.min(CONSTANTS.AUDIO.SENSITIVITY_MAX, sensitivity)
        ),
      };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('dpgen_microphone_practice_settings', JSON.stringify({
            accuracyWindow: updated.accuracyWindow,
            latencyAdjustment: updated.latencyAdjustment,
            sensitivity: updated.sensitivity,
            threshold: updated.threshold,
            visualFeedback: updated.visualFeedback,
            showTimingErrors: updated.showTimingErrors,
          }));
        } catch (e) {
          console.error('Failed to save microphone settings:', e);
        }
      }
      return { microphonePractice: updated };
    }),

  setMicrophoneThreshold: (threshold) =>
    set((state) => {
      const updated = {
        ...state.microphonePractice,
        threshold: Math.max(
          CONSTANTS.AUDIO.THRESHOLD_MIN,
          Math.min(CONSTANTS.AUDIO.THRESHOLD_MAX, threshold)
        ),
      };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('dpgen_microphone_practice_settings', JSON.stringify({
            accuracyWindow: updated.accuracyWindow,
            latencyAdjustment: updated.latencyAdjustment,
            sensitivity: updated.sensitivity,
            threshold: updated.threshold,
            visualFeedback: updated.visualFeedback,
            showTimingErrors: updated.showTimingErrors,
          }));
        } catch (e) {
          console.error('Failed to save microphone settings:', e);
        }
      }
      return { microphonePractice: updated };
    }),

  setMicrophoneLatencyAdjustment: (adjustment) =>
    set((state) => {
      const updated = {
        ...state.microphonePractice,
        latencyAdjustment: Math.max(
          CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MIN,
          Math.min(CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MAX, adjustment)
        ),
      };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('dpgen_microphone_practice_settings', JSON.stringify({
            accuracyWindow: updated.accuracyWindow,
            latencyAdjustment: updated.latencyAdjustment,
            sensitivity: updated.sensitivity,
            threshold: updated.threshold,
            visualFeedback: updated.visualFeedback,
            showTimingErrors: updated.showTimingErrors,
          }));
        } catch (e) {
          console.error('Failed to save microphone settings:', e);
        }
      }
      return { microphonePractice: updated };
    }),

  setMicrophonePracticeAccuracyWindow: (accuracyWindow) =>
    set((state) => {
      const updated = {
        ...state.microphonePractice,
        accuracyWindow: Math.max(1, Math.min(500, accuracyWindow)),
      };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('dpgen_microphone_practice_settings', JSON.stringify({
            accuracyWindow: updated.accuracyWindow,
            latencyAdjustment: updated.latencyAdjustment,
            sensitivity: updated.sensitivity,
            threshold: updated.threshold,
            visualFeedback: updated.visualFeedback,
            showTimingErrors: updated.showTimingErrors,
          }));
        } catch (e) {
          console.error('Failed to save microphone settings:', e);
        }
      }
      return { microphonePractice: updated };
    }),

  setMicrophoneExpectedNotes: (notes) =>
    set((state) => ({
      microphonePractice: { ...state.microphonePractice, expectedNotes: notes },
    })),

  addMicrophoneHit: (hit) =>
    set((state) => ({
      microphonePractice: {
        ...state.microphonePractice,
        actualHits: [...state.microphonePractice.actualHits, hit],
      },
    })),

  clearMicrophoneHits: () =>
    set((state) => ({
      microphonePractice: {
        ...state.microphonePractice,
        actualHits: [],
      },
    })),

  markMicrophoneNoteMatched: (index) =>
    set((state) => {
      const expectedNotes = [...state.microphonePractice.expectedNotes];
      if (expectedNotes[index]) {
        expectedNotes[index] = { ...expectedNotes[index], matched: true };
      }
      return {
        microphonePractice: { ...state.microphonePractice, expectedNotes },
      };
    }),

  setMicrophoneStartTime: (time) =>
    set((state) => ({
      microphonePractice: { ...state.microphonePractice, startTime: time },
    })),

  setMicrophoneCountInActive: (active) =>
    set((state) => ({
      microphonePractice: { ...state.microphonePractice, countInActive: active },
    })),

  setMicrophoneLevelCheckInterval: (interval) =>
    set((state) => ({
      microphonePractice: { ...state.microphonePractice, levelCheckInterval: interval },
    })),

  setMicrophoneVisualFeedback: (enabled) =>
    set((state) => {
      const updated = { ...state.microphonePractice, visualFeedback: enabled };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('dpgen_microphone_practice_settings', JSON.stringify({
            accuracyWindow: updated.accuracyWindow,
            latencyAdjustment: updated.latencyAdjustment,
            sensitivity: updated.sensitivity,
            threshold: updated.threshold,
            visualFeedback: updated.visualFeedback,
            showTimingErrors: updated.showTimingErrors,
          }));
        } catch (e) {
          console.error('Failed to save microphone settings:', e);
        }
      }
      return { microphonePractice: updated };
    }),

  setMicrophoneShowTimingErrors: (enabled) =>
    set((state) => {
      const updated = { ...state.microphonePractice, showTimingErrors: enabled };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('dpgen_microphone_practice_settings', JSON.stringify({
            accuracyWindow: updated.accuracyWindow,
            latencyAdjustment: updated.latencyAdjustment,
            sensitivity: updated.sensitivity,
            threshold: updated.threshold,
            visualFeedback: updated.visualFeedback,
            showTimingErrors: updated.showTimingErrors,
          }));
        } catch (e) {
          console.error('Failed to save microphone settings:', e);
        }
      }
      return { microphonePractice: updated };
    }),

  resetMicrophonePractice: () =>
    set({
      microphonePractice: { ...initialMicrophonePractice },
    }),

  // MIDI Recording Actions
  setMIDIRecordingEnabled: (enabled) =>
    set((state) => ({
      midiRecording: {
        ...state.midiRecording,
        enabled,
        ...(enabled ? {} : { startTime: null, notes: [] }),
      },
    })),

  setMIDIRecordingInput: (input) =>
    set((state) => ({
      midiRecording: { ...state.midiRecording, input },
    })),

  setMIDIRecordingLatencyAdjustment: (adjustment) =>
    set((state) => ({
      midiRecording: {
        ...state.midiRecording,
        latencyAdjustment: Math.max(
          CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MIN,
          Math.min(CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MAX, adjustment)
        ),
      },
    })),

  setMIDIRecordingStartTime: (time) =>
    set((state) => ({
      midiRecording: { ...state.midiRecording, startTime: time },
    })),

  addMIDIRecordingNote: (note) =>
    set((state) => ({
      midiRecording: {
        ...state.midiRecording,
        notes: [...state.midiRecording.notes, note],
      },
    })),

  clearMIDIRecordingNotes: () =>
    set((state) => ({
      midiRecording: { ...state.midiRecording, notes: [] },
    })),

  setMIDIRecordingTimeSignature: (timeSignature) =>
    set((state) => ({
      midiRecording: { ...state.midiRecording, timeSignature },
    })),

  setMIDIRecordingSubdivision: (subdivision) =>
    set((state) => ({
      midiRecording: { ...state.midiRecording, subdivision },
    })),

  setMIDIRecordingCountInEnabled: (enabled) =>
    set((state) => ({
      midiRecording: { ...state.midiRecording, countInEnabled: enabled },
    })),

  setMIDIRecordingMetronomeEnabled: (enabled) =>
    set((state) => ({
      midiRecording: { ...state.midiRecording, metronomeEnabled: enabled },
    })),

  setMIDIRecordingCountInActive: (active) =>
    set((state) => ({
      midiRecording: { ...state.midiRecording, countInActive: active },
    })),

  setMIDIRecordingCountInBeats: (beats) =>
    set((state) => ({
      midiRecording: { ...state.midiRecording, countInBeats: beats },
    })),

  resetMIDIRecording: () =>
    set({
      midiRecording: { ...initialMIDIRecording },
    }),

  // Practice Stats Actions
  setPracticeStartTime: (time) => set({ practiceStartTime: time }),
  updatePracticeStats: (stats) =>
    set((state) => ({
      practiceStats: { ...state.practiceStats, ...stats },
    })),
  updatePracticeGoals: (goals) =>
    set((state) => ({
      practiceGoals: { ...state.practiceGoals, ...goals },
    })),
});

