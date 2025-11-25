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
import { ContextMenu } from '@/components/shared/ContextMenu';

interface PatternItemProps {
  pattern: Pattern;
  index: number;
  viewMode?: 'list' | 'grid' | 'compact';
}

function PatternItemComponent({ pattern, index, viewMode = 'list' }: PatternItemProps) {
  const { showToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(pattern._expanded ?? false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const removePattern = useStore((state) => state.removePattern);
  const duplicatePattern = useStore((state) => state.duplicatePattern);
  const setDraggedPatternId = useStore((state) => state.setDraggedPatternId);
  const draggedPatternId = useStore((state) => state.draggedPatternId);
  const reorderPatterns = useStore((state) => state.reorderPatterns);
  const saveToHistory = useStore((state) => state.saveToHistory);
  const patterns = useStore((state) => state.patterns);
  const isPlaying = useStore((state) => state.isPlaying);
  const playbackPosition = useStore((state) => state.playbackPosition);

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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const contextMenuItems = [
    {
      label: 'Edit',
      icon: 'fas fa-edit',
      action: () => {
        if (!isExpanded) {
          setIsExpanded(true);
        }
      },
    },
    {
      label: 'Duplicate',
      icon: 'fas fa-copy',
      action: handleDuplicate,
    },
    {
      label: 'Delete',
      icon: 'fas fa-trash-alt',
      action: handleRemove,
      divider: true,
    },
    {
      label: 'Export as MIDI',
      icon: 'fas fa-download',
      action: () => {
        // This would need to be implemented
        showToast('MIDI export coming soon', 'info');
      },
    },
  ];

  // Calculate which pattern is currently playing based on playbackPosition
  const currentPatternIndex = useMemo(() => {
    if (!isPlaying || playbackPosition === null || playbackPosition < 0) {
      return -1;
    }
    
    let cumulativeNotes = 0;
    for (let i = 0; i < patterns.length; i++) {
      const p = patterns[i];
      const notesPerBar = getNotesPerBarForPattern(p);
      const totalNotes = notesPerBar * (p.repeat || 1);
      
      if (playbackPosition >= cumulativeNotes && playbackPosition < cumulativeNotes + totalNotes) {
        return i;
      }
      cumulativeNotes += totalNotes;
    }
    return -1;
  }, [isPlaying, playbackPosition, patterns]);

  // Check if this pattern is currently playing
  const isCurrentlyPlaying = isPlaying && currentPatternIndex >= 0 && patterns[currentPatternIndex]?.id === pattern.id;

  // Color code by time signature
  const getTimeSignatureColor = (timeSig: string) => {
    const sig = timeSig.split('/')[0];
    const colors: Record<string, string> = {
      '2': 'rgba(59, 130, 246, 0.1)', // Blue for 2/4
      '3': 'rgba(139, 92, 246, 0.1)', // Purple for 3/4
      '4': 'rgba(34, 197, 94, 0.1)', // Green for 4/4
      '5': 'rgba(236, 72, 153, 0.1)', // Pink for 5/4
      '6': 'rgba(251, 146, 60, 0.1)', // Orange for 6/8
      '7': 'rgba(168, 85, 247, 0.1)', // Purple for 7/8
      '9': 'rgba(14, 165, 233, 0.1)', // Cyan for 9/8
    };
    return colors[sig] || 'rgba(148, 163, 184, 0.1)';
  };

  const timeSignatureColor = getTimeSignatureColor(pattern.timeSignature);

  // Adapt layout for different view modes
  const isCompact = viewMode === 'compact';
  const isGrid = viewMode === 'grid';
  const isList = viewMode === 'list';

  return (
    <div
      className={`dpgen-pattern-item ${isDragging ? 'dpgen-pattern-dragging' : ''} ${dragOver ? 'dpgen-pattern-drag-over' : ''} ${isCurrentlyPlaying ? 'dpgen-pattern-playing' : ''} dpgen-pattern-${viewMode}`}
      draggable={isList}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
      data-pattern-id={pattern.id}
      style={{
        background: timeSignatureColor,
        borderLeft: isList ? `4px solid ${timeSignatureColor.replace('0.1', '0.6')}` : 'none',
        border: isGrid || isCompact ? `1px solid ${timeSignatureColor.replace('0.1', '0.3')}` : 'none',
        borderRadius: 'var(--dpgen-radius)',
        marginBottom: isList ? '0.75rem' : '0',
        transition: 'all 0.2s ease',
        boxShadow: isCurrentlyPlaying ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
        transform: isCurrentlyPlaying ? 'scale(1.01)' : 'scale(1)',
        ...(isGrid || isCompact ? {
          padding: isCompact ? '0.75rem' : '1rem',
          display: 'flex',
          flexDirection: 'column',
        } : {}),
      }}
      onMouseEnter={(e) => {
        if (!isDragging && !isCurrentlyPlaying) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.transform = isList ? 'translateY(-2px)' : 'scale(1.02)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isCurrentlyPlaying) {
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      {/* Pattern Header */}
      <div
        className="dpgen-pattern-header"
        data-pattern-id={pattern.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: isList ? 'wrap' : 'nowrap',
          gap: isCompact ? '0.5rem' : '0.75rem',
          padding: isCompact ? '0.5rem' : isGrid ? '0.75rem' : '1rem 1.25rem',
          ...(isGrid || isCompact ? {
            background: 'transparent',
            borderBottom: 'none',
            cursor: 'pointer',
          } : {}),
        }}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`${patternLabel}, ${isExpanded ? 'expanded' : 'collapsed'}. Press Enter to ${isExpanded ? 'collapse' : 'expand'}, Delete to remove.`}
      >
        {isList && (
          <i
            className="fas fa-grip-vertical dpgen-pattern-drag-handle"
            aria-label="Drag to reorder"
            style={{ flexShrink: 0 }}
          />
        )}
        {isCurrentlyPlaying && (
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#3b82f6',
              animation: 'pulse 1s infinite',
              flexShrink: 0,
            }}
            aria-label="Currently playing"
            title="Currently playing"
          />
        )}
        <span className="dpgen-pattern-number" style={{ 
          flexShrink: 0, 
          minWidth: 0, 
          wordBreak: 'break-word', 
          fontWeight: isCurrentlyPlaying ? 600 : 400,
          fontSize: isCompact ? '0.75rem' : isGrid ? '0.875rem' : '1rem',
        }}>
          {patternLabel}
        </span>
        {!isCompact && (
          <>
            <span className="dpgen-pattern-repeat-badge" style={{ flexShrink: 0, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
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
            {isList && (
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
            )}
          </>
        )}
        {(isGrid || isCompact) && (
          <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
            {pattern.timeSignature} • {subdivisionText}
          </div>
        )}
        <div className="dpgen-pattern-header-spacer" style={{ flex: '1 1 auto' }} />
        {(isList || isGrid) && (
          <>
            <button
              type="button"
              className="dpgen-pattern-action dpgen-pattern-duplicate"
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicate();
              }}
              aria-label="Duplicate pattern"
              style={{ flexShrink: 0 }}
            >
              <i className="fas fa-copy" />
            </button>
            <button
              type="button"
              className="dpgen-pattern-action"
              onClick={(e) => {
                e.stopPropagation();
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
          </>
        )}
        {(isList || isGrid) && (
          <button
            type="button"
            className="dpgen-pattern-action dpgen-pattern-remove"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            aria-label="Remove pattern"
            style={{ flexShrink: 0 }}
          >
            <i className="fas fa-trash-alt" />
          </button>
        )}
        <button
          type="button"
          className="dpgen-pattern-action dpgen-pattern-toggle"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          aria-label="Toggle pattern"
          style={{ 
            flexShrink: 0,
            marginLeft: 'auto', // Always push to the right
          }}
        >
          <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`} />
        </button>
      </div>
      {/* Pattern Summary - moved below header (only in list view) */}
      {patternSummary && isList && (
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

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          items={contextMenuItems}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
        />
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
    prevProps.pattern.leftFoot === nextProps.pattern.leftFoot &&
    prevProps.pattern.rightFoot === nextProps.pattern.rightFoot &&
    prevProps.pattern._presetAccents === nextProps.pattern._presetAccents &&
    prevProps.pattern._advancedMode === nextProps.pattern._advancedMode &&
    prevProps.pattern._perBeatSubdivisions === nextProps.pattern._perBeatSubdivisions &&
    prevProps.pattern._perBeatVoicing === nextProps.pattern._perBeatVoicing &&
    prevProps.pattern._perBeatSticking === nextProps.pattern._perBeatSticking &&
    prevProps.index === nextProps.index
  );
});

