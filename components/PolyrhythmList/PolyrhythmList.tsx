/**
 * Polyrhythm Pattern List Component
 * Displays and manages polyrhythm patterns separately from regular patterns
 */

'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PolyrhythmPattern } from '@/types/polyrhythm';
import { PolyrhythmPatternItem } from './PolyrhythmPatternItem';

export function PolyrhythmList() {
  const polyrhythmPatterns = useStore((state) => state.polyrhythmPatterns);
  const clearPolyrhythmPatterns = useStore((state) => state.clearPolyrhythmPatterns);
  const savePolyrhythmToHistory = useStore((state) => state.savePolyrhythmToHistory);

  const handleClearAll = () => {
    if (polyrhythmPatterns.length === 0) return;
    if (confirm(`Are you sure you want to clear all ${polyrhythmPatterns.length} polyrhythm pattern(s)?`)) {
      clearPolyrhythmPatterns();
      savePolyrhythmToHistory();
    }
  };

  if (polyrhythmPatterns.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--dpgen-text-secondary)',
        fontSize: '0.875rem',
      }}>
        <i className="fas fa-layer-group" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
        <p>No polyrhythm patterns yet.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
          Click "Polyrhythm Builder" in the toolbar to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="dpgen-polyrhythm-list">
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--dpgen-border)',
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>
          Polyrhythm Patterns ({polyrhythmPatterns.length})
        </h3>
        {polyrhythmPatterns.length > 0 && (
          <button
            type="button"
            className="dpgen-button dpgen-button-secondary"
            onClick={handleClearAll}
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            <i className="fas fa-trash" style={{ marginRight: '0.25rem' }} />
            Clear All
          </button>
        )}
      </div>

      {/* Pattern Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {polyrhythmPatterns.map((pattern) => (
          <PolyrhythmPatternItem key={pattern.id} pattern={pattern} />
        ))}
      </div>
    </div>
  );
}

