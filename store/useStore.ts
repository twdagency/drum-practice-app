/**
 * Main Zustand store combining all slices
 */

import { create } from 'zustand';
import { PatternSlice, createPatternSlice } from './slices/patternSlice';
import { PolyrhythmSlice, createPolyrhythmSlice } from './slices/polyrhythmSlice';
import { PlaybackSlice, createPlaybackSlice } from './slices/playbackSlice';
import { UISlice, createUISlice } from './slices/uiSlice';
import { PracticeSlice, createPracticeSlice } from './slices/practiceSlice';
import { AudioBuffers } from '@/types';

// Combine all slices
export type AppStore = PatternSlice & PolyrhythmSlice & PlaybackSlice & UISlice & PracticeSlice & {
  // Additional state not in slices
  audioBuffers: AudioBuffers;
  audioBuffersLoaded: boolean;
  setAudioBuffers: (buffers: Partial<AudioBuffers>) => void;
  setAudioBuffersLoaded: (loaded: boolean) => void;
};

// Create the store
export const useStore = create<AppStore>((set, get, api) => ({
  // Combine all slices
  ...createPatternSlice(set, get, api),
  ...createPolyrhythmSlice(set, get, api),
  ...createPlaybackSlice(set, get, api),
  ...createUISlice(set, get, api),
  ...createPracticeSlice(set, get, api),

  // Additional state
  audioBuffers: {
    snare: null,
    kick: null,
    tom: null, // Legacy support
    highTom: null,
    midTom: null,
    floor: null,
    hiHat: null,
  },
  audioBuffersLoaded: false,

  // Additional actions
  setAudioBuffers: (buffers) =>
    set((state) => ({
      audioBuffers: { ...state.audioBuffers, ...buffers },
    })),
  setAudioBuffersLoaded: (loaded) => set({ audioBuffersLoaded: loaded }),
}));

