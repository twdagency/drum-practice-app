/**
 * Individual Pattern Item component
 * Handles pattern display, editing, and actions
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Pattern } from '@/types';
import { useStore } from '@/store/useStore';
import { calculatePatternComplexity, parseTokens, formatList, getNotesPerBarForPattern } from '@/lib/utils/patternUtils';
import { PatternFields } from './PatternFields';
import { getSubdivisionText } from '@/lib/utils/subdivisionUtils';
import { useToast } from '@/components/shared/Toast';
import { calculateDifficultyRating } from '@/lib/utils/difficultyUtils';

interface PatternItemProps {
  pattern: Pattern;
  index: number;
}

function PatternItemComponent({ pattern, index }: PatternItemProps) {
  const { showToast } = useToast();
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

  // Memoize expensive calculations
  const { notesPerBar, patternNotes, patternRests, patternAccents, complexity, subdivisionText, patternSummary, patternLabel } = useMemo(() => {
    const notesPerBar = getNotesPerBarForPattern(pattern);
    const drumPattern = parseTokens(pattern.drumPattern || '');
    let patternNotes = 0;
    let patternRests = 0;
    let patternAccents = 0;

    // Count notes and rests based on actual notes per bar
    for (let i = 0; i < notesPerBar; i++) {
      const token = drumPattern[i % drumPattern.length];
      if (token && token.toUpperCase() === 'R') {
        patternRests++;
      } else {
        patternNotes++;
      }
    }

    // Count accents from _presetAccents
    patternAccents = (pattern._presetAccents && pattern._presetAccents.length > 0) ? pattern._presetAccents.length : 0;

    const complexity = calculatePatternComplexity(pattern);
    const subdivisionText = getSubdivisionText(pattern.subdivision);
    const voicingShort = pattern.drumPattern.replace(/\s+/g, '').toUpperCase();
    const accentsText = patternAccents > 0 ? `${patternAccents}ac` : '';
    const patternSummary = pattern._presetName || `${pattern.timeSignature} ${subdivisionText} ${voicingShort}${accentsText ? ' ' + accentsText : ''}`;
    const patternLabel = pattern._presetName ? pattern._presetName : `Pattern ${index + 1}`;

    return { notesPerBar, patternNotes, patternRests, patternAccents, complexity, subdivisionText, patternSummary, patternLabel };
  }, [pattern, index]);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleRemove = useCallback(() => {
    if (confirm(`Are you sure you want to remove ${patternLabel}?`)) {
      removePattern(pattern.id);
      saveToHistory();
    }
  }, [patternLabel, pattern.id, removePattern, saveToHistory]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Enter or Space: Toggle expand/collapse
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
    // Delete: Remove pattern (when focused on header)
    else if (e.key === 'Delete' || (e.key === 'Backspace' && !e.shiftKey)) {
      const target = e.target as HTMLElement;
      if (target.closest('.dpgen-pattern-header')) {
        e.preventDefault();
        handleRemove();
      }
    }
    // Escape: Collapse if expanded
    else if (e.key === 'Escape' && isExpanded) {
      e.preventDefault();
      setIsExpanded(false);
    }
  }, [handleToggle, handleRemove, isExpanded]);

  const handleDuplicate = useCallback(() => {
    duplicatePattern(pattern.id);
    saveToHistory();
  }, [pattern.id, duplicatePattern, saveToHistory]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    setDraggedPatternId(pattern.id);
    e.dataTransfer.setData('text/plain', pattern.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  }, [pattern.id, setDraggedPatternId]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragOver(false);
    setDraggedPatternId(null);
  }, [setDraggedPatternId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedPatternId && draggedPatternId !== pattern.id) {
      setDragOver(true);
    }
  }, [draggedPatternId, pattern.id]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
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
  }, [draggedPatternId, pattern.id, patterns, reorderPatterns, saveToHistory]);

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
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`${patternLabel}, ${isExpanded ? 'expanded' : 'collapsed'}. Press Enter to ${isExpanded ? 'collapse' : 'expand'}, Delete to remove.`}
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
          className="dpgen-pattern-action"
          onClick={() => {
            const name = prompt('Enter a name for this template:');
            if (!name) return;
            
            const description = prompt('Enter a description (optional):') || undefined;
            const category = prompt('Enter a category (e.g., "Groove", "Fill", "Rudiment") (optional):') || undefined;
            
            // Save to library as template
            if (typeof window !== 'undefined') {
              try {
                const saved = localStorage.getItem('dpgen_pattern_library');
                const library = saved ? JSON.parse(saved) : [];
                const difficulty = calculateDifficultyRating(pattern);
                
                const libraryItem = {
                  id: `lib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  name,
                  description,
                  pattern: {
                    ...pattern,
                    _expanded: false,
                  },
                  difficulty: difficulty.score,
                  level: difficulty.level,
                  createdAt: Date.now(),
                  tags: [],
                  isTemplate: true,
                  category: category,
                };
                
                library.push(libraryItem);
                localStorage.setItem('dpgen_pattern_library', JSON.stringify(library));
                showToast(`Template "${name}" saved to library`, 'success');
              } catch (e) {
                console.error('Failed to save template:', e);
                showToast('Failed to save template', 'error');
              }
            }
          }}
          aria-label="Save as template"
          title="Save as template to library"
          style={{ flexShrink: 0 }}
        >
          <i className="fas fa-bookmark" />
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

// Memoize component to prevent unnecessary re-renders
export const PatternItem = React.memo(PatternItemComponent, (prevProps, nextProps) => {
  // Only re-render if pattern data actually changed
  return (
    prevProps.pattern.id === nextProps.pattern.id &&
    prevProps.pattern.timeSignature === nextProps.pattern.timeSignature &&
    prevProps.pattern.subdivision === nextProps.pattern.subdivision &&
    prevProps.pattern.drumPattern === nextProps.pattern.drumPattern &&
    prevProps.pattern.stickingPattern === nextProps.pattern.stickingPattern &&
    prevProps.pattern.repeat === nextProps.pattern.repeat &&
    prevProps.pattern._presetAccents === nextProps.pattern._presetAccents &&
    prevProps.pattern._advancedMode === nextProps.pattern._advancedMode &&
    prevProps.pattern._perBeatSubdivisions === nextProps.pattern._perBeatSubdivisions &&
    prevProps.pattern._perBeatVoicing === nextProps.pattern._perBeatVoicing &&
    prevProps.pattern._perBeatSticking === nextProps.pattern._perBeatSticking &&
    prevProps.index === nextProps.index
  );
});

