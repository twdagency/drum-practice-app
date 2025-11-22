/**
 * Polyrhythm Builder Modal - Create and configure polyrhythm patterns
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { PolyrhythmPattern } from '@/types/polyrhythm';
import { generatePolyrhythmPattern, COMMON_POLYRHYTHMS } from '@/lib/utils/polyrhythmUtils';

interface PolyrhythmBuilderProps {
  onClose: () => void;
}

export const PolyrhythmBuilder: React.FC<PolyrhythmBuilderProps> = ({ onClose }) => {
  const addPolyrhythmPattern = useStore((state) => state.addPolyrhythmPattern);
  const savePolyrhythmToHistory = useStore((state) => state.savePolyrhythmToHistory);

  const [selectedRatio, setSelectedRatio] = useState<string>('custom');
  const [customNumerator, setCustomNumerator] = useState(3);
  const [customDenominator, setCustomDenominator] = useState(2);
  const [rightLimb, setRightLimb] = useState<'right-hand' | 'left-hand' | 'right-foot' | 'left-foot'>('right-hand');
  const [leftLimb, setLeftLimb] = useState<'right-hand' | 'left-hand' | 'right-foot' | 'left-foot'>('left-hand');
  const [rightVoice, setRightVoice] = useState<'snare' | 'kick' | 'hi-hat' | 'tom' | 'floor'>('snare');
  const [leftVoice, setLeftVoice] = useState<'snare' | 'kick' | 'hi-hat' | 'tom' | 'floor'>('kick');
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Learning mode settings
  const [learningModeEnabled, setLearningModeEnabled] = useState(false);
  const [rightHandLoops, setRightHandLoops] = useState(4);
  const [leftHandLoops, setLeftHandLoops] = useState(4);
  const [togetherLoops, setTogetherLoops] = useState(4);

  // Get current ratio values
  const { numerator, denominator } = useMemo(() => {
    if (selectedRatio === 'custom') {
      return { numerator: customNumerator, denominator: customDenominator };
    }
    const ratio = COMMON_POLYRHYTHMS.find(r => `${r.numerator}:${r.denominator}` === selectedRatio);
    if (ratio) {
      return { numerator: ratio.numerator, denominator: ratio.denominator };
    }
    return { numerator: 3, denominator: 2 };
  }, [selectedRatio, customNumerator, customDenominator]);

  // Preview pattern calculation
  const previewPattern = useMemo(() => {
    try {
      return generatePolyrhythmPattern(numerator, denominator, {
        rightLimb,
        leftLimb,
        rightVoice,
        leftVoice,
        timeSignature,
        name: name || undefined,
        description: description || undefined,
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      return null;
    }
  }, [numerator, denominator, rightLimb, leftLimb, rightVoice, leftVoice, timeSignature, name, description]);

  const handleGenerate = () => {
    if (!previewPattern) return;

    const pattern: PolyrhythmPattern = {
      ...previewPattern,
      learningMode: {
        enabled: learningModeEnabled,
        rightHandLoops,
        leftHandLoops,
        togetherLoops,
      },
      repeat: 1,
    };

    addPolyrhythmPattern(pattern);
    savePolyrhythmToHistory();
    onClose();
  };

  return (
    <div
      className="dpgen-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="dpgen-modal-content"
        style={{
          background: 'var(--dpgen-bg)',
          borderRadius: '10px',
          padding: '2rem',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Polyrhythm Builder</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--dpgen-text)',
              padding: '0.25rem 0.5rem',
            }}
          >
            ×
          </button>
        </div>

        {/* Ratio Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Polyrhythm Ratio <span style={{ color: 'var(--dpgen-error-text, #c00)' }}>*</span>
          </label>
          <select
            className="dpgen-select"
            value={selectedRatio}
            onChange={(e) => setSelectedRatio(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            <option value="custom">Custom</option>
            {COMMON_POLYRHYTHMS.map(ratio => (
              <option key={`${ratio.numerator}:${ratio.denominator}`} value={`${ratio.numerator}:${ratio.denominator}`}>
                {ratio.name} ({ratio.description})
              </option>
            ))}
          </select>

          {selectedRatio === 'custom' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
              <div>
                <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                  Numerator (e.g., 3)
                </label>
                <input
                  type="number"
                  className="dpgen-input"
                  value={customNumerator}
                  onChange={(e) => setCustomNumerator(Math.max(2, parseInt(e.target.value, 10) || 3))}
                  min={2}
                  max={20}
                  style={{ width: '100%' }}
                />
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', paddingTop: '1.5rem' }}>:</span>
              <div>
                <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                  Denominator (e.g., 2)
                </label>
                <input
                  type="number"
                  className="dpgen-input"
                  value={customDenominator}
                  onChange={(e) => setCustomDenominator(Math.max(2, parseInt(e.target.value, 10) || 2))}
                  min={2}
                  max={20}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {selectedRatio !== 'custom' && (
            <div style={{
              padding: '0.75rem',
              background: 'var(--dpgen-card-bg, rgba(0,0,0,0.05))',
              borderRadius: '5px',
              fontSize: '0.875rem',
              color: 'var(--dpgen-text-secondary)',
            }}>
              Selected: <strong>{numerator}:{denominator}</strong> - {COMMON_POLYRHYTHMS.find(r => `${r.numerator}:${r.denominator}` === selectedRatio)?.description}
            </div>
          )}
        </div>

        {/* Limb Assignment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
              {numerator} Notes (Right Rhythm)
            </label>
            <select
              className="dpgen-select"
              value={rightLimb}
              onChange={(e) => setRightLimb(e.target.value as typeof rightLimb)}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            >
              <option value="right-hand">Right Hand</option>
              <option value="left-hand">Left Hand</option>
              <option value="right-foot">Right Foot</option>
              <option value="left-foot">Left Foot</option>
            </select>
            <select
              className="dpgen-select"
              value={rightVoice}
              onChange={(e) => setRightVoice(e.target.value as typeof rightVoice)}
              style={{ width: '100%' }}
            >
              <option value="snare">Snare</option>
              <option value="kick">Kick</option>
              <option value="hi-hat">Hi-hat</option>
              <option value="tom">Tom</option>
              <option value="floor">Floor Tom</option>
            </select>
          </div>

          <div>
            <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
              {denominator} Notes (Left Rhythm)
            </label>
            <select
              className="dpgen-select"
              value={leftLimb}
              onChange={(e) => setLeftLimb(e.target.value as typeof leftLimb)}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            >
              <option value="right-hand">Right Hand</option>
              <option value="left-hand">Left Hand</option>
              <option value="right-foot">Right Foot</option>
              <option value="left-foot">Left Foot</option>
            </select>
            <select
              className="dpgen-select"
              value={leftVoice}
              onChange={(e) => setLeftVoice(e.target.value as typeof leftVoice)}
              style={{ width: '100%' }}
            >
              <option value="snare">Snare</option>
              <option value="kick">Kick</option>
              <option value="hi-hat">Hi-hat</option>
              <option value="tom">Tom</option>
              <option value="floor">Floor Tom</option>
            </select>
          </div>
        </div>

        {/* Time Signature */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Time Signature
          </label>
          <input
            type="text"
            className="dpgen-input"
            value={timeSignature}
            onChange={(e) => setTimeSignature(e.target.value)}
            placeholder="4/4"
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-text-secondary)', marginTop: '0.25rem' }}>
            The ratio defines the subdivision - no need to specify note values separately
          </div>
        </div>

        {/* Pattern Name and Description */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Pattern Name (optional)
          </label>
          <input
            type="text"
            className="dpgen-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`${numerator}:${denominator} Polyrhythm`}
            style={{ width: '100%', marginBottom: '0.75rem' }}
          />
          <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Description (optional)
          </label>
          <textarea
            className="dpgen-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            style={{ width: '100%', minHeight: '60px', resize: 'vertical' }}
          />
        </div>

        {/* Learning Mode */}
        <div style={{
          padding: '1rem',
          background: 'var(--dpgen-card-bg, rgba(0,0,0,0.05))',
          borderRadius: '8px',
          marginBottom: '1.5rem',
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={learningModeEnabled}
              onChange={(e) => setLearningModeEnabled(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 'bold' }}>Enable Learning Exercise Mode</span>
          </label>
          <p style={{ fontSize: '0.875rem', color: 'var(--dpgen-text-secondary)', marginBottom: '1rem' }}>
            Show right hand only, then left hand only, then both together for practice
          </p>
          
          {learningModeEnabled && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                  Right Hand Loops
                </label>
                <input
                  type="number"
                  className="dpgen-input"
                  value={rightHandLoops}
                  onChange={(e) => setRightHandLoops(Math.max(1, parseInt(e.target.value, 10) || 4))}
                  min={1}
                  max={16}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                  Left Hand Loops
                </label>
                <input
                  type="number"
                  className="dpgen-input"
                  value={leftHandLoops}
                  onChange={(e) => setLeftHandLoops(Math.max(1, parseInt(e.target.value, 10) || 4))}
                  min={1}
                  max={16}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                  Together Loops
                </label>
                <input
                  type="number"
                  className="dpgen-input"
                  value={togetherLoops}
                  onChange={(e) => setTogetherLoops(Math.max(1, parseInt(e.target.value, 10) || 4))}
                  min={1}
                  max={16}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        {previewPattern && (
          <div style={{
            padding: '1rem',
            background: 'var(--dpgen-card-bg, rgba(0,0,0,0.05))',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}>
            <strong>Preview:</strong>
            <div style={{ marginTop: '0.5rem' }}>
              <div><strong>{numerator}</strong> notes at indices: {previewPattern.rightRhythm.notes.join(', ')}</div>
              <div><strong>{denominator}</strong> notes at indices: {previewPattern.leftRhythm.notes.join(', ')}</div>
              <div style={{ marginTop: '0.5rem', color: 'var(--dpgen-text-secondary)' }}>
                Measure length: {previewPattern.cycleLength} subdivisions ({previewPattern.timeSignature})
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            className="dpgen-button dpgen-button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="dpgen-button dpgen-button-primary"
            onClick={handleGenerate}
            disabled={!previewPattern}
          >
            <i className="fas fa-plus" style={{ marginRight: '0.5rem' }} />
            Create Polyrhythm
          </button>
        </div>
      </div>
    </div>
  );
};

