/**
 * Learning Path Modal - View and navigate through learning paths
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLearningPaths } from '@/hooks/useLearningPaths';
import { usePresets } from '@/hooks/usePresets';
import { useStore } from '@/store/useStore';
import { LearningPath, LearningPathProgress } from '@/types/learningPath';
import { Preset } from '@/types/preset';
import { parseTimeSignature, buildAccentIndices, parseNumberList, parseTokens, formatList, calculateNotesPerBar } from '@/lib/utils/patternUtils';
import { createDefaultLearningPaths } from '@/lib/utils/createDefaultLearningPaths';
import { saveLearningPath } from '@/lib/utils/learningPathStorage';

interface LearningPathModalProps {
  onClose: () => void;
}

export const LearningPathModal: React.FC<LearningPathModalProps> = ({ onClose }) => {
  const { paths, progress, loading, categories, refreshPaths, completeStep, resetProgress } = useLearningPaths();
  const { presets } = usePresets();
  const addPattern = useStore((state) => state.addPattern);
  const practicePadMode = useStore((state) => state.practicePadMode);
  
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize default paths on first load if none exist
  useEffect(() => {
    if (!loading && paths.length === 0 && presets.length > 0) {
      const defaultPaths = createDefaultLearningPaths(presets);
      defaultPaths.forEach(path => {
        try {
          saveLearningPath(path);
        } catch (e) {
          console.error('Error saving default paths:', e);
        }
      });
      refreshPaths();
    }
  }, [loading, paths.length, presets.length, refreshPaths]);

  // Filter paths
  const filteredPaths = useMemo(() => {
    let filtered = paths;

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    // Sort by difficulty, then by name
    return filtered.sort((a, b) => {
      if (a.difficulty !== b.difficulty) {
        return a.difficulty - b.difficulty;
      }
      return a.name.localeCompare(b.name);
    });
  }, [paths, selectedCategory, searchQuery]);

  // Get progress for a path
  const getPathProgress = (pathId: string): LearningPathProgress | null => {
    return progress[pathId] || null;
  };

  // Load a preset as a pattern
  const handleLoadPreset = (preset: Preset) => {
    const [beats, beatType] = parseTimeSignature(preset.timeSignature);
    
    // Check if this is a combined preset that should be split into individual patterns
    const isCombinedPreset = preset.id === '16th-note-grid-all-combinations-combined' || 
                             (preset.tags && preset.tags.includes('combined'));
    
    if (isCombinedPreset && preset.id === '16th-note-grid-all-combinations-combined') {
      // Split the combined preset into 14 individual patterns
      // Each pattern is 16 positions (4 bars × 4 beats)
      const drumTokens = parseTokens(preset.drumPattern);
      const stickingTokens = parseTokens(preset.stickingPattern);
      const phraseValues = parseNumberList(preset.phrase);
      
      // The combined pattern has 14 individual patterns, each stored as 64 positions (4 bars × 4 beats × 4 positions per beat)
      // But we only need the base 4-position pattern - the system will repeat it based on repeat: 4
      const patternsPerCombination = 14;
      const positionsPerPatternInCombined = 64; // How it's stored in the combined preset
      const basePatternLength = 4; // The actual pattern length we want (one beat)
      
      const individualPatternNames = [
        'S S S S', '- S S S', 'S - S S', 'S S - S', 'S S S -',
        'S S - -', 'S - S -', 'S - - S', '- S - S', '- - S S',
        'S - - -', '- S - -', '- - S -', '- - - S'
      ];
      
      for (let i = 0; i < patternsPerCombination; i++) {
        const startPos = i * positionsPerPatternInCombined;
        // Extract only the first 4 positions (the base pattern) - it repeats 16 times in the combined preset
        const patternDrumTokens = drumTokens.slice(startPos, startPos + basePatternLength);
        const patternStickingTokens = stickingTokens.slice(startPos, startPos + basePatternLength);
        
        // Phrase is always "4 4 4 4" (4 beats, 4 notes per beat)
        const patternPhraseValues = [4, 4, 4, 4];
        
        let patternDrumPattern = formatList(patternDrumTokens);
        let patternStickingPattern = formatList(patternStickingTokens);
        
        // Apply practice pad mode conversion if needed
        if (practicePadMode) {
          const convertedDrumPattern = patternDrumTokens.map(token => {
            if (token === '-' || token === 'R') {
              return token;
            }
            return 'S';
          });
          patternDrumPattern = formatList(convertedDrumPattern);
          
          const filteredSticking = patternStickingTokens.map(token => {
            const upperToken = token.toUpperCase();
            if (upperToken === 'K') {
              return Math.random() > 0.5 ? 'R' : 'L';
            }
            return token;
          });
          patternStickingPattern = formatList(filteredSticking);
        }
        
        const patternPhrase = formatList(patternPhraseValues);
        const patternAccentIndices = buildAccentIndices(patternPhraseValues);
        
        const pattern = {
          id: 0, // Will be replaced by addPattern
          timeSignature: preset.timeSignature,
          beats,
          beatType,
          subdivision: preset.subdivision,
          phrase: patternPhrase,
          drumPattern: patternDrumPattern,
          stickingPattern: patternStickingPattern,
          repeat: 4, // Each individual pattern repeats 4 times (4 bars)
          accentIndices: patternAccentIndices,
          leftFoot: false,
          rightFoot: false,
          _presetName: `16th Note Grid: ${individualPatternNames[i]}`,
          _presetDescription: `From combined preset: ${individualPatternNames[i]}`,
          _presetAccents: patternAccentIndices,
        };
        
        addPattern(pattern);
      }
      
      return;
    }
    
    // Regular preset loading (non-combined)
    const phraseValues = parseNumberList(preset.phrase);
    const accentIndices = buildAccentIndices(phraseValues);

    // In Practice Pad mode, convert drum hits to "S" but preserve rest notes
    let drumPattern = preset.drumPattern;
    let stickingPattern = preset.stickingPattern;
    
    if (practicePadMode) {
      // Parse the original pattern and convert drum hits to "S", but keep rest notes as "-"
      const drumTokens = parseTokens(preset.drumPattern);
      const convertedDrumPattern = drumTokens.map(token => {
        // Keep rest notes as-is
        if (token === '-' || token === 'R') {
          return token;
        }
        // Convert any drum hit (S, K, H, T, F, etc.) to "S"
        return 'S';
      });
      drumPattern = formatList(convertedDrumPattern);
      
      // Remove all "K" from sticking pattern
      const stickingTokens = parseTokens(stickingPattern);
      const filteredSticking = stickingTokens.map(token => {
        const upperToken = token.toUpperCase();
        if (upperToken === 'K') {
          return Math.random() > 0.5 ? 'R' : 'L';
        }
        return token;
      });
      stickingPattern = formatList(filteredSticking);
    }

    const pattern = {
      id: 0, // Will be replaced by addPattern
      timeSignature: preset.timeSignature,
      beats,
      beatType,
      subdivision: preset.subdivision,
      phrase: preset.phrase,
      drumPattern, // Use converted drumPattern (all "S" if practice pad mode)
      stickingPattern, // Use converted stickingPattern (no "K" if practice pad mode)
      repeat: preset.repeat,
      accentIndices,
      leftFoot: false,
      rightFoot: false,
      _presetName: preset.name,
      _presetDescription: preset.description,
      _presetAccents: accentIndices,
    };

    addPattern(pattern);
  };

  // Load a step from the learning path
  const handleLoadStep = (path: LearningPath, stepIndex: number) => {
    const step = path.steps[stepIndex];
    const preset = presets.find(p => p.id === step.presetId);
    
    if (preset) {
      handleLoadPreset(preset);
      // Mark step as completed (optional - could be manual)
      // completeStep(path.id, stepIndex);
    }
  };

  // Get preset for a step
  const getStepPreset = (presetId: string): Preset | undefined => {
    return presets.find(p => p.id === presetId);
  };

  if (loading) {
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
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
            <p>Loading learning paths...</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedPath) {
    // Show path details and steps
    const pathProgress = getPathProgress(selectedPath.id);
    const currentStepIndex = pathProgress?.currentStepIndex || 0;
    const stepsCompleted = pathProgress?.stepsCompleted || 0;
    const isCompleted = pathProgress?.completed || false;
    const progressPercent = selectedPath.steps.length > 0
      ? (stepsCompleted / selectedPath.steps.length) * 100
      : 0;

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
            maxWidth: '900px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <button
                type="button"
                onClick={() => setSelectedPath(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--dpgen-text)',
                  cursor: 'pointer',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <i className="fas fa-arrow-left" /> Back to paths
              </button>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedPath.name}</h2>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--dpgen-text-secondary)' }}>
                {selectedPath.description}
              </p>
            </div>
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

          {/* Progress Bar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span>Progress: {stepsCompleted} / {selectedPath.steps.length} steps</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '24px',
                background: 'var(--dpgen-border)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: isCompleted
                    ? 'var(--dpgen-success, #4caf50)'
                    : 'var(--dpgen-primary, #007bff)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Path Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--dpgen-card-bg, rgba(0,0,0,0.05))',
            borderRadius: '8px',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-text-secondary)', marginBottom: '0.25rem' }}>
                Difficulty
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                {selectedPath.difficulty}/10
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-text-secondary)', marginBottom: '0.25rem' }}>
                Steps
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                {selectedPath.steps.length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-text-secondary)', marginBottom: '0.25rem' }}>
                Estimated Time
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                {selectedPath.estimatedDuration || 'N/A'} min
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-text-secondary)', marginBottom: '0.25rem' }}>
                Category
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                {selectedPath.category}
              </div>
            </div>
          </div>

          {/* Steps List */}
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Steps</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedPath.steps.map((step, index) => {
                const preset = getStepPreset(step.presetId);
                const isCurrentStep = index === currentStepIndex;
                const isPastStep = index < currentStepIndex;
                const isCompletedStep = isPastStep || (pathProgress?.completed && index < pathProgress.stepsCompleted);

                if (!preset) return null;

                return (
                  <div
                    key={step.presetId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      background: isCurrentStep
                        ? 'var(--dpgen-primary-bg, rgba(0, 123, 255, 0.1))'
                        : isCompletedStep
                        ? 'var(--dpgen-success-bg, rgba(76, 175, 80, 0.1))'
                        : 'var(--dpgen-card-bg, rgba(0,0,0,0.05))',
                      border: isCurrentStep ? '2px solid var(--dpgen-primary, #007bff)' : '1px solid var(--dpgen-border)',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isCompletedStep
                        ? 'var(--dpgen-success, #4caf50)'
                        : isCurrentStep
                        ? 'var(--dpgen-primary, #007bff)'
                        : 'var(--dpgen-border)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}>
                      {isCompletedStep ? (
                        <i className="fas fa-check" style={{ fontSize: '0.875rem' }} />
                      ) : (
                        index + 1
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {preset.name || step.presetName || `Step ${index + 1}`}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-text-secondary)' }}>
                        {preset.description || `${preset.timeSignature} • ${preset.subdivision} notes • Difficulty: ${preset.difficulty}/10`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      {isCurrentStep && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: 'var(--dpgen-primary, #007bff)',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                        }}>
                          Current
                        </span>
                      )}
                      <button
                        type="button"
                        className="dpgen-button dpgen-button-primary"
                        onClick={() => handleLoadStep(selectedPath, index)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        <i className="fas fa-play" style={{ marginRight: '0.5rem' }} />
                        Load
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="button"
              className="dpgen-button dpgen-button-secondary"
              onClick={() => {
                if (confirm('Are you sure you want to reset your progress on this learning path?')) {
                  resetProgress(selectedPath.id);
                  refreshPaths();
                }
              }}
            >
              Reset Progress
            </button>
            <button
              type="button"
              className="dpgen-button dpgen-button-primary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show paths list
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
          maxWidth: '900px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Learning Paths</h2>
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

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              className="dpgen-input"
              placeholder="Search paths..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <select
            className="dpgen-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Paths List */}
        {filteredPaths.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dpgen-text-secondary)' }}>
            <i className="fas fa-route" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
            <p>No learning paths found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredPaths.map((path) => {
              const pathProgress = getPathProgress(path.id);
              const progressPercent = path.steps.length > 0
                ? ((pathProgress?.stepsCompleted || 0) / path.steps.length) * 100
                : 0;
              const isCompleted = pathProgress?.completed || false;

              return (
                <div
                  key={path.id}
                  onClick={() => setSelectedPath(path)}
                  style={{
                    padding: '1.5rem',
                    background: 'var(--dpgen-card-bg, rgba(0,0,0,0.05))',
                    border: '1px solid var(--dpgen-border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--dpgen-primary, #007bff)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--dpgen-border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {path.name}
                        {isCompleted && (
                          <i className="fas fa-check-circle" style={{ marginLeft: '0.5rem', color: 'var(--dpgen-success, #4caf50)' }} />
                        )}
                      </h3>
                      <p style={{ margin: 0, color: 'var(--dpgen-text-secondary)', fontSize: '0.875rem' }}>
                        {path.description}
                      </p>
                    </div>
                    <div style={{
                      padding: '0.5rem 1rem',
                      background: isCompleted
                        ? 'var(--dpgen-success-bg, rgba(76, 175, 80, 0.1))'
                        : 'var(--dpgen-primary-bg, rgba(0, 123, 255, 0.1))',
                      color: isCompleted
                        ? 'var(--dpgen-success, #4caf50)'
                        : 'var(--dpgen-primary, #007bff)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                    }}>
                      {path.category}
                    </div>
                  </div>

                  {/* Progress */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span>{pathProgress?.stepsCompleted || 0} / {path.steps.length} steps</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        background: 'var(--dpgen-border)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPercent}%`,
                          height: '100%',
                          background: isCompleted
                            ? 'var(--dpgen-success, #4caf50)'
                            : 'var(--dpgen-primary, #007bff)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--dpgen-text-secondary)' }}>
                    <span>
                      <i className="fas fa-chart-line" style={{ marginRight: '0.25rem' }} />
                      Difficulty: {path.difficulty}/10
                    </span>
                    <span>
                      <i className="fas fa-list-ol" style={{ marginRight: '0.25rem' }} />
                      {path.steps.length} steps
                    </span>
                    {path.estimatedDuration && (
                      <span>
                        <i className="fas fa-clock" style={{ marginRight: '0.25rem' }} />
                        {path.estimatedDuration} min
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

