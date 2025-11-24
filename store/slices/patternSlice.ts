/**
 * Pattern management slice for Zustand store
 */

import { StateCreator } from 'zustand';
import { Pattern, PatternHistoryEntry } from '@/types';

export interface PatternSlice {
  // State
  patterns: Pattern[];
  draggedPatternId: number | null;
  history: PatternHistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;

  // Actions
  addPattern: (pattern: Pattern) => void;
  removePattern: (id: number) => void;
  updatePattern: (id: number, updates: Partial<Pattern>) => void;
  duplicatePattern: (id: number) => void;
  clearPatterns: () => void;
  setPatterns: (patterns: Pattern[]) => void;
  setDraggedPatternId: (id: number | null) => void;
  reorderPatterns: (fromIndex: number, toIndex: number) => void;
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const createPatternSlice: StateCreator<PatternSlice> = (set, get) => ({
  // Initial state
  patterns: [],
  draggedPatternId: null,
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,

  // Actions
  addPattern: (pattern) => {
    // Ensure pattern has a unique ID
    const patternWithId = {
      ...pattern,
      id: pattern.id || Date.now() + Math.random(), // Use timestamp + random for uniqueness
    };
    set((state) => ({
      patterns: [...state.patterns, patternWithId],
    }));
  },

  removePattern: (id) =>
    set((state) => ({
      patterns: state.patterns.filter((p) => p.id !== id),
    })),

  updatePattern: (id, updates) =>
    set((state) => ({
      patterns: state.patterns.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  duplicatePattern: (id) => {
    const pattern = get().patterns.find((p) => p.id === id);
    if (!pattern) return;

    const duplicated: Pattern = {
      ...pattern,
      id: Date.now(),
      _expanded: true,
      _presetAccents: pattern._presetAccents ? [...pattern._presetAccents] : undefined,
    };

    const index = get().patterns.findIndex((p) => p.id === id);
    const newPatterns = [...get().patterns];
    newPatterns.splice(index + 1, 0, duplicated);

    set({ patterns: newPatterns });
  },

  clearPatterns: () => set({ patterns: [] }),

  setPatterns: (patterns) => set({ patterns }),

  setDraggedPatternId: (id) => set({ draggedPatternId: id }),

  reorderPatterns: (fromIndex, toIndex) => {
    const patterns = [...get().patterns];
    const [moved] = patterns.splice(fromIndex, 1);
    patterns.splice(toIndex, 0, moved);
    set({ patterns });
  },

  saveToHistory: () => {
    const state = get();
    const newEntry: PatternHistoryEntry = {
      patterns: JSON.parse(JSON.stringify(state.patterns)), // Deep clone
      timestamp: Date.now(),
    };

    const history = state.history.slice(0, state.historyIndex + 1);
    history.push(newEntry);

    // Limit history size
    if (history.length > state.maxHistorySize) {
      history.shift();
    }

    set({
      history,
      historyIndex: history.length - 1,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const previousEntry = state.history[state.historyIndex - 1];
      set({
        patterns: JSON.parse(JSON.stringify(previousEntry.patterns)),
        historyIndex: state.historyIndex - 1,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const nextEntry = state.history[state.historyIndex + 1];
      set({
        patterns: JSON.parse(JSON.stringify(nextEntry.patterns)),
        historyIndex: state.historyIndex + 1,
      });
    }
  },
});

