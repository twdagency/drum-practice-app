/**
 * Playback Progress Indicator
 * Shows current playback position and progress through patterns
 */

'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { getNotesPerBarForPattern } from '@/lib/utils/patternUtils';

export function PlaybackProgress() {
  const isPlaying = useStore((state) => state.isPlaying);
  const playbackPosition = useStore((state) => state.playbackPosition);
  const patterns = useStore((state) => state.patterns);
  const polyrhythmPatterns = useStore((state) => state.polyrhythmPatterns);

  if (!isPlaying || playbackPosition === null) {
    return null;
  }

  // Calculate total notes across all patterns
  let totalNotes = 0;
  patterns.forEach((pattern) => {
    const notesPerBar = getNotesPerBarForPattern(pattern);
    totalNotes += notesPerBar * (pattern.repeat || 1);
  });

  // Add polyrhythm notes
  polyrhythmPatterns.forEach((polyrhythmPattern) => {
    // Simplified calculation - in real implementation, would use polyrhythmToCombinedPattern
    const cycleLength = polyrhythmPattern.cycleLength || 12;
    totalNotes += cycleLength * (polyrhythmPattern.repeat || 1);
  });

  if (totalNotes === 0) {
    return null;
  }

  const progress = Math.min((playbackPosition + 1) / totalNotes, 1);
  const percentage = Math.round(progress * 100);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--dpgen-card)',
        padding: '0.75rem 1.5rem',
        borderRadius: 'var(--dpgen-radius)',
        boxShadow: 'var(--dpgen-shadow)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        minWidth: '300px',
        border: '1px solid var(--dpgen-border)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'var(--dpgen-bg)',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--dpgen-primary), var(--dpgen-accent))',
              borderRadius: '4px',
              transition: 'width 0.1s linear',
              boxShadow: '0 0 8px rgba(60, 109, 240, 0.5)',
            }}
          />
        </div>
      </div>
      <div
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--dpgen-text)',
          minWidth: '60px',
          textAlign: 'right',
        }}
      >
        {percentage}%
      </div>
    </div>
  );
}

