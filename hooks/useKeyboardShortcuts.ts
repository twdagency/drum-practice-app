/**
 * Keyboard Shortcuts Hook
 * Provides keyboard shortcuts for common actions
 */

'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { createDefaultPattern, generateRandomPattern, randomizePattern } from '@/lib/utils/patternUtils';

export function useKeyboardShortcuts() {
  const patterns = useStore((state) => state.patterns);
  const addPattern = useStore((state) => state.addPattern);
  const isPlaying = useStore((state) => state.isPlaying);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const saveToHistory = useStore((state) => state.saveToHistory);
  const practicePadMode = useStore((state) => state.practicePadMode);
  const updatePattern = useStore((state) => state.updatePattern);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        (target.closest('input') || target.closest('textarea'))
      ) {
        return;
      }

      // Spacebar: Play/Pause
      if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }

      // Ctrl/Cmd + N: New Pattern
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        const newPattern = createDefaultPattern();
        addPattern(newPattern);
        saveToHistory();
      }

      // Ctrl/Cmd + Shift + N: Generate Random Pattern
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        const useAdvancedMode = Math.random() < 0.1;
        const newPattern = generateRandomPattern(practicePadMode, useAdvancedMode);
        addPattern(newPattern);
        saveToHistory();
      }

      // Ctrl/Cmd + R: Randomize All Patterns
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !e.shiftKey) {
        e.preventDefault();
        if (patterns.length > 0 && confirm('This will randomize all patterns. Continue?')) {
          patterns.forEach((pattern) => {
            const randomized = randomizePattern(pattern, practicePadMode);
            updatePattern(pattern.id, {
              timeSignature: randomized.timeSignature,
              subdivision: randomized.subdivision,
              phrase: randomized.phrase,
              drumPattern: randomized.drumPattern,
              stickingPattern: randomized.stickingPattern,
              repeat: randomized.repeat,
              _presetAccents: randomized._presetAccents,
              _advancedMode: randomized._advancedMode,
              _perBeatSubdivisions: randomized._perBeatSubdivisions,
              _perBeatVoicing: randomized._perBeatVoicing,
              _perBeatSticking: randomized._perBeatSticking,
            });
          });
          saveToHistory();
        }
      }

      // Escape: Stop Playback
      if (e.key === 'Escape' && isPlaying) {
        e.preventDefault();
        setIsPlaying(false);
      }

      // Arrow Up/Down: Navigate patterns (when not in input)
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.ctrlKey && !e.metaKey) {
        const patternItems = document.querySelectorAll('.dpgen-pattern-item');
        const currentFocused = document.activeElement;
        const currentIndex = Array.from(patternItems).findIndex(item => 
          item.contains(currentFocused) || item === currentFocused
        );
        
        if (currentIndex >= 0) {
          e.preventDefault();
          const nextIndex = e.key === 'ArrowDown' 
            ? Math.min(currentIndex + 1, patternItems.length - 1)
            : Math.max(currentIndex - 1, 0);
          
          const nextItem = patternItems[nextIndex] as HTMLElement;
          const header = nextItem?.querySelector('.dpgen-pattern-header') as HTMLElement;
          if (header) {
            header.focus();
            header.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }

      // Number keys 1-9: Quick actions (if we want to add pattern selection)
      // This could be extended later
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [patterns, isPlaying, practicePadMode, setIsPlaying, addPattern, updatePattern, saveToHistory]);
}

