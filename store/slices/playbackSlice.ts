/**
 * Playback control slice for Zustand store
 */

import { StateCreator } from 'zustand';
import { ClickSoundType, Volumes } from '@/types';

// Load persisted audio/playback settings from localStorage (client-side only)
const loadPersistedPlaybackSettings = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const settings = window.localStorage.getItem('dpgen_playback_settings');
    return settings ? JSON.parse(settings) : null;
  } catch (e) {
    console.error('Failed to load persisted playback settings:', e);
    return null;
  }
};

// Save audio/playback settings to localStorage
const savePlaybackSettings = (settings: Partial<PlaybackSlice>) => {
  if (typeof window === 'undefined') return;

  try {
    const existing = loadPersistedPlaybackSettings() || {};
    const updated = { ...existing, ...settings };
    window.localStorage.setItem('dpgen_playback_settings', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save playback settings:', e);
  }
};

export interface PlaybackSlice {
  // State
  bpm: number;
  isPlaying: boolean;
  loopCount: number;
  currentLoop: number;
  playbackPosition: number | null; // Current note index being played
  countInEnabled: boolean;
  playDrumSounds: boolean;
  muteClickTrack: boolean;
  metronomeOnlyMode: boolean;
  silentPracticeMode: boolean;
  slowMotionEnabled: boolean;
  slowMotionSpeed: number;
  playBackwards: boolean;
  loopMeasures: { start: number; end: number } | null;
  clickSoundType: ClickSoundType;
  accentBeatOne: boolean;
  subdivisionClicks: boolean;
  clickMode: 'beats' | 'subdivision' | 'accents' | 'none'; // Mutually exclusive click modes
  volumes: Volumes;
  tempoRamping: boolean;
  tempoRampStart: number;
  tempoRampEnd: number;
  tempoRampSteps: number;
  progressiveMode: boolean;

  // Actions
  setBPM: (bpm: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setLoopCount: (count: number) => void;
  setCurrentLoop: (loop: number) => void;
  setPlaybackPosition: (position: number | null) => void;
  setCountInEnabled: (enabled: boolean) => void;
  setPlayDrumSounds: (enabled: boolean) => void;
  setMuteClickTrack: (muted: boolean) => void;
  setMetronomeOnlyMode: (enabled: boolean) => void;
  setSilentPracticeMode: (enabled: boolean) => void;
  setSlowMotionEnabled: (enabled: boolean) => void;
  setSlowMotionSpeed: (speed: number) => void;
  setPlayBackwards: (enabled: boolean) => void;
  setLoopMeasures: (measures: { start: number; end: number } | null) => void;
  setClickSoundType: (type: ClickSoundType) => void;
  setAccentBeatOne: (enabled: boolean) => void;
  setSubdivisionClicks: (enabled: boolean) => void;
  setClickMode: (mode: 'beats' | 'subdivision' | 'accents' | 'none') => void;
  setVolume: (key: keyof Volumes, value: number) => void;
  setVolumes: (volumes: Partial<Volumes>) => void;
  setTempoRamping: (enabled: boolean) => void;
  setTempoRampStart: (bpm: number) => void;
  setTempoRampEnd: (bpm: number) => void;
  setTempoRampSteps: (steps: number) => void;
  setProgressiveMode: (enabled: boolean) => void;
}

export const createPlaybackSlice: StateCreator<PlaybackSlice> = (set) => ({
  // Initial state
  bpm: 120,
  isPlaying: false,
  loopCount: 1,
  currentLoop: 0,
  playbackPosition: null,
  countInEnabled: true,
  playDrumSounds: false, // Disable drum sounds by default
  muteClickTrack: false,
  metronomeOnlyMode: false,
  silentPracticeMode: false,
  slowMotionEnabled: false,
  slowMotionSpeed: 0.75,
  playBackwards: false,
  loopMeasures: null,
  clickSoundType: 'default',
  accentBeatOne: false,
  subdivisionClicks: false,
  clickMode: 'beats', // Default: click on beats 1,2,3,4
  volumes: {
    snare: 1.0,
    kick: 1.0,
    hiHat: 1.0,
    click: 0.8,
  },
  tempoRamping: false,
  tempoRampStart: 60,
  tempoRampEnd: 120,
  tempoRampSteps: 4,
  progressiveMode: false,

  // Actions
  setBPM: (bpm) => {
    const clampedBpm = Math.max(40, Math.min(260, bpm));
    set({ bpm: clampedBpm });
    savePlaybackSettings({ bpm: clampedBpm });
  },
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setLoopCount: (count) => {
    const clampedCount = Math.max(1, count);
    set({ loopCount: clampedCount });
    savePlaybackSettings({ loopCount: clampedCount });
  },
  setCurrentLoop: (loop) => set({ currentLoop: loop }),
  setPlaybackPosition: (position) => set({ playbackPosition: position }),
  setCountInEnabled: (enabled) => {
    set({ countInEnabled: enabled });
    savePlaybackSettings({ countInEnabled: enabled });
  },
  setPlayDrumSounds: (enabled) => {
    set({ playDrumSounds: enabled });
    savePlaybackSettings({ playDrumSounds: enabled });
  },
  setMuteClickTrack: (muted) => {
    set({ muteClickTrack: muted });
    // Note: muteClickTrack is deprecated in favor of clickMode='none'
    savePlaybackSettings({ muteClickTrack: muted });
  },
  setMetronomeOnlyMode: (enabled) => {
    set({ metronomeOnlyMode: enabled });
    savePlaybackSettings({ metronomeOnlyMode: enabled });
  },
  setSilentPracticeMode: (enabled) => {
    set({ silentPracticeMode: enabled });
    savePlaybackSettings({ silentPracticeMode: enabled });
  },
  setSlowMotionEnabled: (enabled) => {
    set({ slowMotionEnabled: enabled });
    savePlaybackSettings({ slowMotionEnabled: enabled });
  },
  setSlowMotionSpeed: (speed) => {
    const clampedSpeed = Math.max(0.1, Math.min(1.0, speed));
    set({ slowMotionSpeed: clampedSpeed });
    savePlaybackSettings({ slowMotionSpeed: clampedSpeed });
  },
  setPlayBackwards: (enabled) => {
    set({ playBackwards: enabled });
    savePlaybackSettings({ playBackwards: enabled });
  },
  setLoopMeasures: (measures) => {
    set({ loopMeasures: measures });
    savePlaybackSettings({ loopMeasures: measures });
  },
  setClickSoundType: (type) => {
    set({ clickSoundType: type });
    savePlaybackSettings({ clickSoundType: type });
  },
  setAccentBeatOne: (enabled) => {
    // Deprecated - use clickMode instead, but keep for backward compatibility
    set({ accentBeatOne: enabled });
    if (enabled) {
      set({ clickMode: 'accents' });
    }
  },
  setSubdivisionClicks: (enabled) => {
    // Deprecated - use clickMode instead, but keep for backward compatibility
    set({ subdivisionClicks: enabled });
    if (enabled) {
      set({ clickMode: 'subdivision' });
    }
  },
  setClickMode: (mode) => {
    set({ clickMode: mode });
    savePlaybackSettings({ clickMode: mode });
  },
  setVolume: (key, value) => {
    const clampedValue = Math.max(0, Math.min(1, value));
    set((state) => {
      const updatedVolumes = {
        ...state.volumes,
        [key]: clampedValue,
      };
      savePlaybackSettings({ volumes: updatedVolumes });
      return {
        volumes: updatedVolumes,
      };
    });
  },
  setVolumes: (volumes) => {
    set((state) => {
      const updatedVolumes = { ...state.volumes, ...volumes };
      // Clamp values
      Object.keys(updatedVolumes).forEach((key) => {
        updatedVolumes[key as keyof Volumes] = Math.max(0, Math.min(1, updatedVolumes[key as keyof Volumes]));
      });
      savePlaybackSettings({ volumes: updatedVolumes });
      return { volumes: updatedVolumes };
    });
  },
  setTempoRamping: (enabled) => {
    set({ tempoRamping: enabled });
    savePlaybackSettings({ tempoRamping: enabled });
  },
  setTempoRampStart: (bpm) => {
    const clampedBpm = Math.max(40, Math.min(260, bpm));
    set({ tempoRampStart: clampedBpm });
    savePlaybackSettings({ tempoRampStart: clampedBpm });
  },
  setTempoRampEnd: (bpm) => {
    const clampedBpm = Math.max(40, Math.min(260, bpm));
    set({ tempoRampEnd: clampedBpm });
    savePlaybackSettings({ tempoRampEnd: clampedBpm });
  },
  setTempoRampSteps: (steps) => {
    const clampedSteps = Math.max(2, Math.min(20, steps));
    set({ tempoRampSteps: clampedSteps });
    savePlaybackSettings({ tempoRampSteps: clampedSteps });
  },
  setProgressiveMode: (enabled) => {
    set({ progressiveMode: enabled });
    savePlaybackSettings({ progressiveMode: enabled });
  },
});

