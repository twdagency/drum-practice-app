/**
 * Pattern List component
 * Displays all patterns with drag-and-drop support
 */

'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { PatternItem } from './PatternItem';

export function PatternList() {
  const patterns = useStore((state) => state.patterns);

  if (patterns.length === 0) {
    return (
      <div className="dpgen-patterns-list">
        <div className="dpgen-empty-state" style={{ padding: '2rem', textAlign: 'center', color: 'var(--dpgen-muted)' }}>
          <p>No patterns yet. Click "Add Pattern" to create one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dpgen-patterns-list">
      {patterns.map((pattern, index) => (
        <PatternItem key={pattern.id} pattern={pattern} index={index} />
      ))}
    </div>
  );
}

