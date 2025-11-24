/**
 * Polyrhythm pattern management slice for Zustand store
 * Separate from regular patterns
 */

import { StateCreator } from 'zustand';
import { PolyrhythmPattern } from '@/types/polyrhythm';

export interface PolyrhythmPatternHistoryEntry {
  patterns: PolyrhythmPattern[];
  timestamp: number;
}

export interface PolyrhythmSlice {
  // State
  polyrhythmPatterns: PolyrhythmPattern[];
  draggedPolyrhythmId: number | null;
  polyrhythmHistory: PolyrhythmPatternHistoryEntry[];
  polyrhythmHistoryIndex: number;
  polyrhythmMaxHistorySize: number;

  // Actions
  addPolyrhythmPattern: (pattern: PolyrhythmPattern) => void;
  removePolyrhythmPattern: (id: number) => void;
  updatePolyrhythmPattern: (id: number, updates: Partial<PolyrhythmPattern>) => void;
  duplicatePolyrhythmPattern: (id: number) => void;
  clearPolyrhythmPatterns: () => void;
  setDraggedPolyrhythmId: (id: number | null) => void;
  reorderPolyrhythmPatterns: (fromIndex: number, toIndex: number) => void;
  savePolyrhythmToHistory: () => void;
  undoPolyrhythm: () => void;
  redoPolyrhythm: () => void;
}

export const createPolyrhythmSlice: StateCreator<PolyrhythmSlice> = (set, get) => ({
  // Initial state
  polyrhythmPatterns: [],
  draggedPolyrhythmId: null,
  polyrhythmHistory: [],
  polyrhythmHistoryIndex: -1,
  polyrhythmMaxHistorySize: 50,

  // Actions
  addPolyrhythmPattern: (pattern) => {
    const patternWithId = {
      ...pattern,
      id: pattern.id || Date.now() + Math.random(),
    };
    set((state) => ({
      polyrhythmPatterns: [...state.polyrhythmPatterns, patternWithId],
    }));
  },

  removePolyrhythmPattern: (id) =>
    set((state) => ({
      polyrhythmPatterns: state.polyrhythmPatterns.filter((p) => p.id !== id),
    })),

  updatePolyrhythmPattern: (id, updates) =>
    set((state) => ({
      polyrhythmPatterns: state.polyrhythmPatterns.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  duplicatePolyrhythmPattern: (id) => {
    const pattern = get().polyrhythmPatterns.find((p) => p.id === id);
    if (pattern) {
      const duplicated = {
        ...pattern,
        id: Date.now() + Math.random(),
        name: pattern.name ? `${pattern.name} (Copy)` : undefined,
      };
      get().addPolyrhythmPattern(duplicated);
    }
  },

  clearPolyrhythmPatterns: () =>
    set({
      polyrhythmPatterns: [],
    }),

  setDraggedPolyrhythmId: (id) =>
    set({
      draggedPolyrhythmId: id,
    }),

  reorderPolyrhythmPatterns: (fromIndex, toIndex) =>
    set((state) => {
      const newPatterns = [...state.polyrhythmPatterns];
      const [removed] = newPatterns.splice(fromIndex, 1);
      newPatterns.splice(toIndex, 0, removed);
      return { polyrhythmPatterns: newPatterns };
    }),

  savePolyrhythmToHistory: () => {
    const { polyrhythmPatterns, polyrhythmHistory, polyrhythmHistoryIndex, polyrhythmMaxHistorySize } = get();
    
    // Create a deep copy of current patterns for history
    const historyEntry: PolyrhythmPatternHistoryEntry = {
      patterns: JSON.parse(JSON.stringify(polyrhythmPatterns)),
      timestamp: Date.now(),
    };

    // Remove any history after current index (if we're not at the end)
    const newHistory = polyrhythmHistory.slice(0, polyrhythmHistoryIndex + 1);
    newHistory.push(historyEntry);

    // Limit history size
    if (newHistory.length > polyrhythmMaxHistorySize) {
      newHistory.shift();
    }

    set({
      polyrhythmHistory: newHistory,
      polyrhythmHistoryIndex: newHistory.length - 1,
    });
  },

  undoPolyrhythm: () => {
    const { polyrhythmHistory, polyrhythmHistoryIndex } = get();
    if (polyrhythmHistoryIndex > 0) {
      const previousEntry = polyrhythmHistory[polyrhythmHistoryIndex - 1];
      set({
        polyrhythmPatterns: JSON.parse(JSON.stringify(previousEntry.patterns)),
        polyrhythmHistoryIndex: polyrhythmHistoryIndex - 1,
      });
    }
  },

  redoPolyrhythm: () => {
    const { polyrhythmHistory, polyrhythmHistoryIndex } = get();
    if (polyrhythmHistoryIndex < polyrhythmHistory.length - 1) {
      const nextEntry = polyrhythmHistory[polyrhythmHistoryIndex + 1];
      set({
        polyrhythmPatterns: JSON.parse(JSON.stringify(nextEntry.patterns)),
        polyrhythmHistoryIndex: polyrhythmHistoryIndex + 1,
      });
    }
  },
});

