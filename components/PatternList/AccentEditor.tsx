/**
 * Accent Editor component
 * Allows users to toggle accents on individual notes
 */

'use client';

import React, { useEffect } from 'react';
import { Pattern } from '@/types';
import { useStore } from '@/store/useStore';
import { buildAccentIndices, buildPhraseFromAccents, randomizeAccents, formatList, getNotesPerBarForPattern } from '@/lib/utils/patternUtils';

interface AccentEditorProps {
  pattern: Pattern;
}

export function AccentEditor({ pattern }: AccentEditorProps) {
  const updatePattern = useStore((state) => state.updatePattern);
  const saveToHistory = useStore((state) => state.saveToHistory);

  // Calculate actual notes per bar (handles both normal and advanced modes)
  const notesPerBar = getNotesPerBarForPattern(pattern);

  // Get accent indices: use _presetAccents if set, allow empty array for no accents
  let accentIndices: number[] = [];
  if (pattern._presetAccents !== undefined) {
    // Use the accents array (could be empty for no accents)
    accentIndices = pattern._presetAccents.filter((idx) => idx >= 0 && idx < notesPerBar);
  }
  // If undefined, keep empty array - no accents by default

  // When accents change, derive phrase from accents
  useEffect(() => {
    if (pattern._presetAccents !== undefined) {
      const currentAccents = pattern._presetAccents.filter((idx) => idx >= 0 && idx < notesPerBar);
      const derivedPhrase = buildPhraseFromAccents(currentAccents, notesPerBar);
      const phraseString = formatList(derivedPhrase);
      
      // Only update if phrase has changed to avoid infinite loops
      if (pattern.phrase !== phraseString) {
        updatePattern(pattern.id, { phrase: phraseString });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern._presetAccents, notesPerBar, pattern.id]);

  // Initialize accents on first load (empty array = no accents)
  useEffect(() => {
    if (pattern._presetAccents === undefined) {
      updatePattern(pattern.id, { _presetAccents: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern.id]);

  const handleToggleAccent = (noteIndex: number) => {
    const currentAccents = pattern._presetAccents || [];
    const index = currentAccents.indexOf(noteIndex);
    
    let newAccents: number[];
    if (index > -1) {
      newAccents = currentAccents.filter((i) => i !== noteIndex);
    } else {
      newAccents = [...currentAccents, noteIndex].sort((a, b) => a - b);
    }

    updatePattern(pattern.id, { _presetAccents: newAccents });
    saveToHistory();
  };

  const handleRandomizeAccents = () => {
    const newAccents = randomizeAccents(notesPerBar);
    updatePattern(pattern.id, { _presetAccents: newAccents });
    saveToHistory();
  };

  return (
    <div className="dpgen-accent-editor">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div className="dpgen-accent-editor-notes" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', flex: 1 }}>
          {Array.from({ length: notesPerBar }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`dpgen-accent-note ${accentIndices.includes(i) ? 'dpgen-accent-note--accented' : ''}`}
              onClick={() => handleToggleAccent(i)}
              title={accentIndices.includes(i) ? `Note ${i + 1} (accented)` : `Note ${i + 1} (click to accent)`}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                border: accentIndices.includes(i) ? '2px solid var(--dpgen-accent)' : '1px solid var(--dpgen-border)',
                background: accentIndices.includes(i) ? 'var(--dpgen-accent)' : 'transparent',
                color: accentIndices.includes(i) ? 'white' : 'var(--dpgen-text)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: accentIndices.includes(i) ? 600 : 400,
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="dpgen-icon-button"
          onClick={handleRandomizeAccents}
          aria-label="Randomise accents"
          style={{
            padding: '0.5rem',
            background: 'transparent',
            border: '1px solid var(--dpgen-border)',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'var(--dpgen-text)',
          }}
        >
          <i className="fas fa-dice" />
        </button>
      </div>
    </div>
  );
}

