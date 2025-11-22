/**
 * Individual Polyrhythm Pattern Item component
 * Handles polyrhythm pattern display, editing, and actions
 */

'use client';

import React, { useState } from 'react';
import { PolyrhythmPattern } from '@/types/polyrhythm';
import { useStore } from '@/store/useStore';

interface PolyrhythmPatternItemProps {
  pattern: PolyrhythmPattern;
}

export function PolyrhythmPatternItem({ pattern }: PolyrhythmPatternItemProps) {
  const [isExpanded, setIsExpanded] = useState(pattern._expanded ?? false);

  const removePolyrhythmPattern = useStore((state) => state.removePolyrhythmPattern);
  const duplicatePolyrhythmPattern = useStore((state) => state.duplicatePolyrhythmPattern);
  const updatePolyrhythmPattern = useStore((state) => state.updatePolyrhythmPattern);
  const savePolyrhythmToHistory = useStore((state) => state.savePolyrhythmToHistory);

  const patternLabel = pattern.name || `${pattern.ratio.numerator}:${pattern.ratio.denominator} Polyrhythm`;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    updatePolyrhythmPattern(pattern.id, { _expanded: !isExpanded });
    savePolyrhythmToHistory();
  };

  const handleRemove = () => {
    if (confirm(`Are you sure you want to remove "${patternLabel}"?`)) {
      removePolyrhythmPattern(pattern.id);
      savePolyrhythmToHistory();
    }
  };

  const handleDuplicate = () => {
    duplicatePolyrhythmPattern(pattern.id);
    savePolyrhythmToHistory();
  };

  return (
    <div
      className="dpgen-pattern-item"
      style={{
        border: '1px solid var(--dpgen-border)',
        borderRadius: '8px',
        padding: '1rem',
        background: 'var(--dpgen-card-bg, rgba(0,0,0,0.02))',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={handleToggle}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <strong style={{ fontSize: '1rem' }}>{patternLabel}</strong>
            {pattern.learningMode.enabled && (
              <span style={{
                padding: '0.125rem 0.5rem',
                background: 'var(--dpgen-primary-bg, rgba(0, 123, 255, 0.1))',
                color: 'var(--dpgen-primary, #007bff)',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}>
                Learning Mode
              </span>
            )}
          </div>
          {pattern.description && (
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--dpgen-text-secondary)' }}>
              {pattern.description}
            </p>
          )}
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--dpgen-text-secondary)' }}>
            <span>{pattern.ratio.numerator}:{pattern.ratio.denominator}</span>
            <span style={{ margin: '0 0.5rem' }}>•</span>
            <span>{pattern.timeSignature}</span>
            <span style={{ margin: '0 0.5rem' }}>•</span>
            <span>Measure: {pattern.cycleLength} subdivisions</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            className="dpgen-icon-button"
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate();
            }}
            title="Duplicate pattern"
            style={{ padding: '0.5rem' }}
          >
            <i className="fas fa-copy" />
          </button>
          <button
            type="button"
            className="dpgen-icon-button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            title="Remove pattern"
            style={{ padding: '0.5rem', color: 'var(--dpgen-error, #ef4444)' }}
          >
            <i className="fas fa-trash" />
          </button>
          <button
            type="button"
            className="dpgen-icon-button"
            onClick={handleToggle}
            title={isExpanded ? 'Collapse' : 'Expand'}
            style={{ padding: '0.5rem' }}
          >
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--dpgen-border)' }}>
          {/* Editable Fields */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {/* Time Signature */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  Time Signature
                </label>
                <input
                  type="text"
                  value={pattern.timeSignature}
                  onChange={(e) => {
                    const value = e.target.value;
                    const isValid = /^\d+\s*\/\s*\d+$/.test(value);
                    if (isValid || value.trim() === '') {
                      updatePolyrhythmPattern(pattern.id, { timeSignature: value || '4/4' });
                      savePolyrhythmToHistory();
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    border: '1px solid var(--dpgen-border)',
                    borderRadius: '4px',
                    background: 'var(--dpgen-bg)',
                    color: 'var(--dpgen-text)',
                  }}
                  placeholder="4/4"
                />
              </div>

              {/* Repeat Count */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  Repeat (cycles per bar)
                </label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={pattern.repeat}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value >= 1 && value <= 16) {
                      updatePolyrhythmPattern(pattern.id, { repeat: value });
                      savePolyrhythmToHistory();
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    border: '1px solid var(--dpgen-border)',
                    borderRadius: '4px',
                    background: 'var(--dpgen-bg)',
                    color: 'var(--dpgen-text)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Rhythm Details */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 'bold' }}>
              Rhythm Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {pattern.ratio.numerator} Notes ({pattern.rightRhythm.limb.replace('-', ' ')})
                </div>
                <div style={{ color: 'var(--dpgen-text-secondary)' }}>
                  Voice: {pattern.rightRhythm.voice}
                </div>
                <div style={{ color: 'var(--dpgen-text-secondary)', marginTop: '0.25rem' }}>
                  Indices: {pattern.rightRhythm.notes.join(', ')}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {pattern.ratio.denominator} Notes ({pattern.leftRhythm.limb.replace('-', ' ')})
                </div>
                <div style={{ color: 'var(--dpgen-text-secondary)' }}>
                  Voice: {pattern.leftRhythm.voice}
                </div>
                <div style={{ color: 'var(--dpgen-text-secondary)', marginTop: '0.25rem' }}>
                  Indices: {pattern.leftRhythm.notes.join(', ')}
                </div>
              </div>
            </div>
          </div>

          {/* Learning Mode Info */}
          {pattern.learningMode.enabled && (
            <div style={{
              padding: '0.75rem',
              background: 'var(--dpgen-card-bg, rgba(0,0,0,0.05))',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Learning Exercise Mode
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <div>
                  <span style={{ color: 'var(--dpgen-text-secondary)' }}>Right Hand:</span> {pattern.learningMode.rightHandLoops} loops
                </div>
                <div>
                  <span style={{ color: 'var(--dpgen-text-secondary)' }}>Left Hand:</span> {pattern.learningMode.leftHandLoops} loops
                </div>
                <div>
                  <span style={{ color: 'var(--dpgen-text-secondary)' }}>Together:</span> {pattern.learningMode.togetherLoops} loops
                </div>
              </div>
            </div>
          )}

          {/* Pattern Info */}
          <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-text-secondary)' }}>
            <div>Measure Length: {pattern.cycleLength} subdivisions ({pattern.timeSignature})</div>
            <div>Right Hand: {pattern.rightRhythm.notes.length} notes | Left Hand: {pattern.leftRhythm.notes.length} notes</div>
            {pattern.repeat > 1 && (
              <div>Repeats: {pattern.repeat} {pattern.repeat === 1 ? 'measure' : 'measures'}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

