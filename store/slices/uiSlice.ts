/**
 * UI state slice for Zustand store
 */

import { StateCreator } from 'zustand';

// Load persisted UI settings from localStorage (client-side only)
const loadPersistedUISettings = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const settings = window.localStorage.getItem('dpgen_ui_settings');
    return settings ? JSON.parse(settings) : null;
  } catch (e) {
    console.error('Failed to load persisted UI settings:', e);
    return null;
  }
};

// Save UI settings to localStorage
const saveUISettings = (settings: Partial<UISlice>) => {
  if (typeof window === 'undefined') return;

  try {
    const existing = loadPersistedUISettings() || {};
    const updated = { ...existing, ...settings };
    window.localStorage.setItem('dpgen_ui_settings', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save UI settings:', e);
  }
};

export interface UISlice {
  // State
  isFullscreen: boolean;
  scrollAnimationEnabled: boolean;
  staveZoom: number;
  showGridLines: boolean;
  showMeasureNumbers: boolean;
  showVisualMetronome: boolean;
  showPolyrhythmShapes: boolean; // Show animated polyrhythm shapes visualization
  currentBeat: number; // Current beat (1-4) for visual metronome
  darkMode: boolean;
  polyrhythmDisplayMode: 'separate-positions' | 'stacked' | 'two-staves'; // How to display polyrhythms on stave
  practicePadMode: boolean; // When enabled, voicing pattern always displays as "S"

  // Actions
  setIsFullscreen: (isFullscreen: boolean) => void;
  setScrollAnimationEnabled: (enabled: boolean) => void;
  setStaveZoom: (zoom: number) => void;
  setShowGridLines: (show: boolean) => void;
  setShowMeasureNumbers: (show: boolean) => void;
  setShowVisualMetronome: (show: boolean) => void;
  setShowPolyrhythmShapes: (show: boolean) => void;
  setCurrentBeat: (beat: number) => void;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
  setPolyrhythmDisplayMode: (mode: 'separate-positions' | 'stacked' | 'two-staves') => void;
  setPracticePadMode: (enabled: boolean) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  // Initial state - use defaults (will be updated from localStorage on client)
  isFullscreen: false,
  scrollAnimationEnabled: false,
  staveZoom: 1.0,
  showGridLines: false,
  showMeasureNumbers: true,
  showVisualMetronome: true,
  showPolyrhythmShapes: false,
  currentBeat: 0,
  darkMode: false,
  polyrhythmDisplayMode: 'separate-positions',
  practicePadMode: false,

  // Actions - save to localStorage when settings change
  setIsFullscreen: (isFullscreen) => {
    set({ isFullscreen });
    saveUISettings({ isFullscreen });
  },
  setScrollAnimationEnabled: (enabled) => {
    set({ scrollAnimationEnabled: enabled });
    saveUISettings({ scrollAnimationEnabled: enabled });
  },
  setStaveZoom: (zoom) => {
    const clampedZoom = Math.max(0.5, Math.min(2.0, zoom));
    set({ staveZoom: clampedZoom });
    saveUISettings({ staveZoom: clampedZoom });
  },
  setShowGridLines: (show) => {
    set({ showGridLines: show });
    saveUISettings({ showGridLines: show });
  },
  setShowMeasureNumbers: (show) => {
    set({ showMeasureNumbers: show });
    saveUISettings({ showMeasureNumbers: show });
  },
  setShowVisualMetronome: (show) => {
    set({ showVisualMetronome: show });
    saveUISettings({ showVisualMetronome: show });
  },
  setShowPolyrhythmShapes: (show) => {
    set({ showPolyrhythmShapes: show });
    saveUISettings({ showPolyrhythmShapes: show });
  },
  setCurrentBeat: (beat) => set({ currentBeat: Math.max(0, Math.min(4, beat)) }),
  setDarkMode: (enabled) => {
    set({ darkMode: enabled });
    saveUISettings({ darkMode: enabled });
    if (typeof document !== 'undefined') {
      if (enabled) {
        document.documentElement.classList.add('dpgen-dark-mode');
      } else {
        document.documentElement.classList.remove('dpgen-dark-mode');
      }
    }
  },
  toggleDarkMode: () => {
    set((state) => {
      const newDarkMode = !state.darkMode;
      saveUISettings({ darkMode: newDarkMode });
      if (typeof document !== 'undefined') {
        if (newDarkMode) {
          document.documentElement.classList.add('dpgen-dark-mode');
        } else {
          document.documentElement.classList.remove('dpgen-dark-mode');
        }
      }
      return { darkMode: newDarkMode };
    });
  },
  setPolyrhythmDisplayMode: (mode) => {
    saveUISettings({ polyrhythmDisplayMode: mode });
    set({ polyrhythmDisplayMode: mode });
  },
  setPracticePadMode: (enabled) => {
    set({ practicePadMode: enabled });
    saveUISettings({ practicePadMode: enabled });
  },
});

