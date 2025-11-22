/**
 * Individual Pattern Item component
 * Handles pattern display, editing, and actions
 */

'use client';

import React, { useState } from 'react';
import { Pattern } from '@/types';
import { useStore } from '@/store/useStore';
import { calculatePatternComplexity, parseNumberList, parseTokens, formatList } from '@/lib/utils/patternUtils';
import { PatternFields } from './PatternFields';
import { getSubdivisionText } from '@/lib/utils/subdivisionUtils';

interface PatternItemProps {
  pattern: Pattern;
  index: number;
}

export function PatternItem({ pattern, index }: PatternItemProps) {
  const [isExpanded, setIsExpanded] = useState(pattern._expanded ?? false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const removePattern = useStore((state) => state.removePattern);
  const duplicatePattern = useStore((state) => state.duplicatePattern);
  const setDraggedPatternId = useStore((state) => state.setDraggedPatternId);
  const draggedPatternId = useStore((state) => state.draggedPatternId);
  const reorderPatterns = useStore((state) => state.reorderPatterns);
  const saveToHistory = useStore((state) => state.saveToHistory);
  const patterns = useStore((state) => state.patterns);

  // Calculate pattern stats
  const phrase = parseNumberList(pattern.phrase || '');
  const drumPattern = parseTokens(pattern.drumPattern || '');
  let patternNotes = 0;
  let patternRests = 0;
  let patternAccents = 0;

  phrase.forEach((groupLength) => {
    for (let i = 0; i < groupLength; i++) {
      const token = drumPattern[i % drumPattern.length];
      if (token && token.toUpperCase() === 'R') {
        patternRests++;
      } else {
        patternNotes++;
      }
    }
  });

  // Count accents
  if (pattern._presetAccents && pattern._presetAccents.length > 0) {
    patternAccents = pattern._presetAccents.length;
  } else {
    patternAccents = phrase.length;
  }

  const complexity = calculatePatternComplexity(pattern);
  const subdivisionText = getSubdivisionText(pattern.subdivision);
  const phraseShort = pattern.phrase.replace(/\s+/g, '');
  const voicingShort = pattern.drumPattern.replace(/\s+/g, '').toUpperCase();
  const patternSummary = pattern._presetName || `${pattern.timeSignature} ${subdivisionText} ${phraseShort} ${voicingShort}`;
  const patternLabel = pattern._presetName ? pattern._presetName : `Pattern ${index + 1}`;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleRemove = () => {
    if (confirm(`Are you sure you want to remove ${patternLabel}?`)) {
      removePattern(pattern.id);
      saveToHistory();
    }
  };

  const handleDuplicate = () => {
    duplicatePattern(pattern.id);
    saveToHistory();
  };

  const handleDragStart = (e: React.DragEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    setDraggedPatternId(pattern.id);
    e.dataTransfer.setData('text/plain', pattern.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOver(false);
    setDraggedPatternId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedPatternId && draggedPatternId !== pattern.id) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (!draggedPatternId || draggedPatternId === pattern.id) {
      return;
    }

    const draggedIndex = patterns.findIndex((p) => p.id === draggedPatternId);
    const targetIndex = patterns.findIndex((p) => p.id === pattern.id);

    if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
      reorderPatterns(draggedIndex, targetIndex);
      saveToHistory();
    }
  };

  return (
    <div
      className={`dpgen-pattern-item ${isDragging ? 'dpgen-pattern-dragging' : ''} ${dragOver ? 'dpgen-pattern-drag-over' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-pattern-id={pattern.id}
    >
      {/* Pattern Header */}
      <div
        className="dpgen-pattern-header"
        data-pattern-id={pattern.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
        }}
      >
        <i
          className="fas fa-grip-vertical dpgen-pattern-drag-handle"
          aria-label="Drag to reorder"
          style={{ flexShrink: 0 }}
        />
        <span className="dpgen-pattern-number" style={{ flexShrink: 0, minWidth: 0, wordBreak: 'break-word' }}>
          {patternLabel}
        </span>
        <span className="dpgen-pattern-repeat-badge" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          ×{pattern.repeat || 1}
        </span>
        <span
          className={`dpgen-pattern-complexity dpgen-complexity-${complexity}`}
          style={{
            flexShrink: 0,
            whiteSpace: 'nowrap',
            padding: '0.25rem 0.6rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {complexity.charAt(0).toUpperCase() + complexity.slice(1)}
        </span>
        <span
          className="dpgen-pattern-stats"
          style={{
            display: 'flex',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--dpgen-muted)',
            flexShrink: 0,
          }}
        >
          <span title="Notes">
            <i className="fas fa-music" style={{ marginRight: '0.25rem' }} />
            {patternNotes}
          </span>
          {patternAccents > 0 && (
            <span title="Accents">
              <i className="fas fa-star" style={{ marginRight: '0.25rem' }} />
              {patternAccents}
            </span>
          )}
          {patternRests > 0 && (
            <span title="Rests">
              <i className="fas fa-pause" style={{ marginRight: '0.25rem' }} />
              {patternRests}
            </span>
          )}
        </span>
        <div className="dpgen-pattern-header-spacer" style={{ flex: '1 1 auto' }} />
        <button
          type="button"
          className="dpgen-pattern-action dpgen-pattern-duplicate"
          onClick={handleDuplicate}
          aria-label="Duplicate pattern"
          style={{ flexShrink: 0 }}
        >
          <i className="fas fa-copy" />
        </button>
        <button
          type="button"
          className="dpgen-pattern-action dpgen-pattern-remove"
          onClick={handleRemove}
          aria-label="Remove pattern"
          style={{ flexShrink: 0 }}
        >
          <i className="fas fa-trash-alt" />
        </button>
        <button
          type="button"
          className="dpgen-pattern-action dpgen-pattern-toggle"
          onClick={handleToggle}
          aria-label="Toggle pattern"
          style={{ flexShrink: 0 }}
        >
          <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`} />
        </button>
      </div>
      {/* Pattern Summary - moved below header */}
      {patternSummary && (
        <div className="dpgen-pattern-summary-row" style={{ 
          padding: '0.5rem 1.25rem 0.75rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '0.875rem',
          color: 'var(--dpgen-muted)',
          whiteSpace: 'nowrap',
        }}>
          {patternSummary}
        </div>
      )}

      {/* Pattern Content */}
      {isExpanded && (
        <div className="dpgen-pattern-content" style={{ display: 'block' }}>
          {pattern._presetDescription && (
            <p
              style={{
                margin: '0 0 1rem 0',
                padding: '0.75rem',
                background: '#f8fafc',
                borderRadius: '8px',
                color: '#64748b',
                fontSize: '0.875rem',
                lineHeight: 1.5,
              }}
            >
              {pattern._presetDescription}
            </p>
          )}
          <PatternFields pattern={pattern} />
        </div>
      )}
    </div>
  );
}

