/**
 * Learning Path Modal - View and navigate through learning paths
 * Updated with lucide-react icons and new Modal system
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLearningPaths } from '@/hooks/useLearningPaths';
import { usePresets } from '@/hooks/usePresets';
import { useStore } from '@/store/useStore';
import { useAchievements } from '@/hooks/useAchievements';
import { LearningPath, LearningPathProgress } from '@/types/learningPath';
import { Preset } from '@/types/preset';
import { parseTimeSignature, buildAccentIndices, parseNumberList, parseTokens, formatList } from '@/lib/utils/patternUtils';
import { createDefaultLearningPaths } from '@/lib/utils/createDefaultLearningPaths';
import { saveLearningPath } from '@/lib/utils/learningPathStorage';
import { Modal, ModalSection } from '@/components/shared/Modal';
import { BadgeNotification } from '@/components/shared/BadgeNotification';
import { PRACTICE_ROUTINES } from '@/lib/data/routines';
import { PracticeRoutine } from '@/types/routine';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Play,
  Route,
  TrendingUp,
  ListOrdered,
  Clock,
  Loader2,
  Search,
  Filter,
  Target,
  Award,
  RotateCcw,
  ChevronRight,
  BookOpen,
  Zap,
  Star,
  Dumbbell,
  Rocket,
  Guitar,
  Flame,
  LucideIcon,
  ClipboardList,
} from 'lucide-react';

// Routine icon mapping
const ROUTINE_ICON_MAP: Record<string, LucideIcon> = {
  'zap': Zap,
  'target': Target,
  'dumbbell': Dumbbell,
  'rocket': Rocket,
  'guitar': Guitar,
  'book-open': BookOpen,
  'flame': Flame,
};

const getRoutineIcon = (iconName: string, size: number = 16) => {
  const IconComponent = ROUTINE_ICON_MAP[iconName] || Zap;
  return <IconComponent size={size} />;
};

// Get recommended routines based on learning path
const getRecommendedRoutines = (path: LearningPath): PracticeRoutine[] => {
  const pathDifficulty = path.difficulty;
  const pathCategory = path.category.toLowerCase();
  
  return PRACTICE_ROUTINES
    .filter(routine => {
      // Match difficulty level (within 2 levels)
      const difficultyMatch = routine.difficulty === 'beginner' && pathDifficulty <= 4 ||
                             routine.difficulty === 'intermediate' && pathDifficulty >= 3 && pathDifficulty <= 7 ||
                             routine.difficulty === 'advanced' && pathDifficulty >= 6;
      
      // Match category if possible
      const categoryMatch = routine.tags.some(tag => 
        pathCategory.includes(tag) || tag.includes(pathCategory)
      ) || routine.category === 'comprehensive';
      
      return difficultyMatch || categoryMatch;
    })
    .slice(0, 3);
};

interface LearningPathModalProps {
  onClose: () => void;
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'beginner': <BookOpen size={16} />,
  'rudiments': <Target size={16} />,
  'technique': <Zap size={16} />,
  'beats': <Star size={16} />,
  'fills': <TrendingUp size={16} />,
  'default': <Route size={16} />,
};

const getCategoryIcon = (category: string) => {
  return CATEGORY_ICONS[category.toLowerCase()] || CATEGORY_ICONS['default'];
};

export const LearningPathModal: React.FC<LearningPathModalProps> = ({ onClose }) => {
  const { paths, progress, loading, categories, refreshPaths, completeStep, resetProgress } = useLearningPaths();
  const { presets } = usePresets();
  const addPattern = useStore((state) => state.addPattern);
  const practicePadMode = useStore((state) => state.practicePadMode);
  const { 
    state: achievementState, 
    newBadge, 
    clearNewBadge,
    trackStepCompleted, 
    trackLearningPathCompleted,
    trackFirstAction,
  } = useAchievements();
  
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

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    return filtered.sort((a, b) => {
      if (a.difficulty !== b.difficulty) {
        return a.difficulty - b.difficulty;
      }
      return a.name.localeCompare(b.name);
    });
  }, [paths, selectedCategory, searchQuery]);

  const getPathProgress = (pathId: string): LearningPathProgress | null => {
    return progress[pathId] || null;
  };

  // Load a preset as a pattern
  const handleLoadPreset = (preset: Preset) => {
    const [beats, beatType] = parseTimeSignature(preset.timeSignature);
    
    const isCombinedPreset = preset.id === '16th-note-grid-all-combinations-combined' || 
                             (preset.tags && preset.tags.includes('combined'));
    
    if (isCombinedPreset && preset.id === '16th-note-grid-all-combinations-combined') {
      const drumTokens = parseTokens(preset.drumPattern);
      const stickingTokens = parseTokens(preset.stickingPattern);
      
      const patternsPerCombination = 14;
      const positionsPerPatternInCombined = 64;
      const basePatternLength = 4;
      
      const individualPatternNames = [
        'S S S S', '- S S S', 'S - S S', 'S S - S', 'S S S -',
        'S S - -', 'S - S -', 'S - - S', '- S - S', '- - S S',
        'S - - -', '- S - -', '- - S -', '- - - S'
      ];
      
      for (let i = 0; i < patternsPerCombination; i++) {
        const startPos = i * positionsPerPatternInCombined;
        const patternDrumTokens = drumTokens.slice(startPos, startPos + basePatternLength);
        const patternStickingTokens = stickingTokens.slice(startPos, startPos + basePatternLength);
        const patternPhraseValues = [4, 4, 4, 4];
        
        let patternDrumPattern = formatList(patternDrumTokens);
        let patternStickingPattern = formatList(patternStickingTokens);
        
        if (practicePadMode) {
          const convertedDrumPattern = patternDrumTokens.map(token => {
            if (token === '-' || token === 'R') return token;
            return 'S';
          });
          patternDrumPattern = formatList(convertedDrumPattern);
          
          const filteredSticking = patternStickingTokens.map(token => {
            const upperToken = token.toUpperCase();
            if (upperToken === 'K') return Math.random() > 0.5 ? 'R' : 'L';
            return token;
          });
          patternStickingPattern = formatList(filteredSticking);
        }
        
        const patternPhrase = formatList(patternPhraseValues);
        const patternAccentIndices = buildAccentIndices(patternPhraseValues);
        
        addPattern({
          id: 0,
          timeSignature: preset.timeSignature,
          beats,
          beatType,
          subdivision: preset.subdivision,
          phrase: patternPhrase,
          drumPattern: patternDrumPattern,
          stickingPattern: patternStickingPattern,
          repeat: 4,
          accentIndices: patternAccentIndices,
          leftFoot: false,
          rightFoot: false,
          _presetName: `16th Note Grid: ${individualPatternNames[i]}`,
          _presetDescription: `From combined preset: ${individualPatternNames[i]}`,
          _presetAccents: patternAccentIndices,
        });
      }
      return;
    }
    
    const phraseValues = parseNumberList(preset.phrase);
    const accentIndices = buildAccentIndices(phraseValues);

    let drumPattern = preset.drumPattern;
    let stickingPattern = preset.stickingPattern;
    
    if (practicePadMode) {
      const drumTokens = parseTokens(preset.drumPattern);
      const convertedDrumPattern = drumTokens.map(token => {
        if (token === '-' || token === 'R') return token;
        return 'S';
      });
      drumPattern = formatList(convertedDrumPattern);
      
      const stickingTokens = parseTokens(stickingPattern);
      const filteredSticking = stickingTokens.map(token => {
        const upperToken = token.toUpperCase();
        if (upperToken === 'K') return Math.random() > 0.5 ? 'R' : 'L';
        return token;
      });
      stickingPattern = formatList(filteredSticking);
    }

    addPattern({
      id: 0,
      timeSignature: preset.timeSignature,
      beats,
      beatType,
      subdivision: preset.subdivision,
      phrase: preset.phrase,
      drumPattern,
      stickingPattern,
      repeat: preset.repeat,
      accentIndices,
      leftFoot: false,
      rightFoot: false,
      _presetName: preset.name,
      _presetDescription: preset.description,
      _presetAccents: accentIndices,
    });
  };

  const handleLoadStep = (path: LearningPath, stepIndex: number) => {
    const step = path.steps[stepIndex];
    const preset = presets.find(p => p.id === step.presetId);
    if (preset) {
      handleLoadPreset(preset);
      
      // Mark step as completed and track achievements
      completeStep(path.id, stepIndex);
      trackStepCompleted();
      
      // Track first step if this is the first ever
      if (achievementState.stepsCompleted === 0) {
        trackFirstAction('complete_step');
      }
      
      // Check if path is now complete
      const pathProgress = getPathProgress(path.id);
      const newStepsCompleted = (pathProgress?.stepsCompleted || 0) + 1;
      if (newStepsCompleted >= path.steps.length) {
        trackLearningPathCompleted();
      }
      
      refreshPaths();
    }
  };

  const getStepPreset = (presetId: string): Preset | undefined => {
    return presets.find(p => p.id === presetId);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Modal
          isOpen={true}
          onClose={onClose}
          title="Learning Paths"
          icon={<Route size={20} />}
          size="lg"
        >
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem', color: 'var(--dpgen-accent)' }} />
            <p style={{ color: 'var(--dpgen-muted)' }}>Loading learning paths...</p>
          </div>
        </Modal>
        <BadgeNotification badge={newBadge} onClose={clearNewBadge} />
      </>
    );
  }

  // Path detail view
  if (selectedPath) {
    const pathProgress = getPathProgress(selectedPath.id);
    const currentStepIndex = pathProgress?.currentStepIndex || 0;
    const stepsCompleted = pathProgress?.stepsCompleted || 0;
    const isCompleted = pathProgress?.completed || false;
    const progressPercent = selectedPath.steps.length > 0
      ? (stepsCompleted / selectedPath.steps.length) * 100
      : 0;

    return (
      <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={selectedPath.name}
        icon={getCategoryIcon(selectedPath.category)}
        size="xl"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset your progress on this learning path?')) {
                  resetProgress(selectedPath.id);
                  refreshPaths();
                }
              }}
              style={{
                padding: '0.6rem 1rem',
                background: 'transparent',
                border: '1px solid var(--dpgen-border)',
                borderRadius: '8px',
                color: 'var(--dpgen-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              <RotateCcw size={16} />
              Reset Progress
            </button>
          </div>
        }
      >
        {/* Back button */}
        <button
          onClick={() => setSelectedPath(null)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--dpgen-accent)',
            cursor: 'pointer',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> Back to paths
        </button>

        {/* Description */}
        <p style={{ margin: '0 0 1.25rem 0', color: 'var(--dpgen-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {selectedPath.description}
        </p>

        {/* Progress Bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isCompleted && <Award size={16} style={{ color: '#10b981' }} />}
              Progress: {stepsCompleted} / {selectedPath.steps.length} steps
            </span>
            <span style={{ fontWeight: 600, color: isCompleted ? '#10b981' : 'var(--dpgen-accent)' }}>
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '10px',
            background: 'var(--dpgen-border)',
            borderRadius: '5px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: isCompleted
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          {[
            { label: 'Difficulty', value: `${selectedPath.difficulty}/10`, icon: <TrendingUp size={16} /> },
            { label: 'Steps', value: selectedPath.steps.length, icon: <ListOrdered size={16} /> },
            { label: 'Est. Time', value: `${selectedPath.estimatedDuration || 'N/A'} min`, icon: <Clock size={16} /> },
            { label: 'Category', value: selectedPath.category, icon: getCategoryIcon(selectedPath.category) },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '0.75rem',
              background: 'var(--dpgen-bg)',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <div style={{ color: 'var(--dpgen-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                {stat.icon}
                <span style={{ fontSize: '0.7rem' }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'capitalize' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Steps */}
        <ModalSection title="Steps" icon={<ListOrdered size={16} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {selectedPath.steps.map((step, index) => {
              const preset = getStepPreset(step.presetId);
              const isCurrentStep = index === currentStepIndex;
              const isPastStep = index < currentStepIndex;
              const isCompletedStep = isPastStep || (pathProgress?.completed && index < (pathProgress.stepsCompleted || 0));

              if (!preset) return null;

              return (
                <div
                  key={step.presetId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: isCurrentStep
                      ? 'rgba(59, 130, 246, 0.1)'
                      : isCompletedStep
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'var(--dpgen-bg)',
                    border: isCurrentStep ? '2px solid var(--dpgen-accent)' : '1px solid var(--dpgen-border)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isCompletedStep
                      ? '#10b981'
                      : isCurrentStep
                      ? 'var(--dpgen-accent)'
                      : 'var(--dpgen-border)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    flexShrink: 0,
                  }}>
                    {isCompletedStep ? <Check size={14} /> : index + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.125rem' }}>
                      {preset.name || step.presetName || `Step ${index + 1}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>
                      {preset.timeSignature} • {preset.subdivision} notes • Difficulty: {preset.difficulty}/10
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {isCurrentStep && (
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        background: 'var(--dpgen-accent)',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                      }}>
                        Current
                      </span>
                    )}
                    <button
                      onClick={() => handleLoadStep(selectedPath, index)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: 'var(--dpgen-accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Play size={12} />
                      Load
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </ModalSection>

        {/* Recommended Routines */}
        {getRecommendedRoutines(selectedPath).length > 0 && (
          <ModalSection title="Recommended Routines" icon={<ClipboardList size={16} />}>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--dpgen-muted)' }}>
              Practice these routines to complement your learning path:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {getRecommendedRoutines(selectedPath).map(routine => (
                <div
                  key={routine.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: 'var(--dpgen-bg)',
                    border: '1px solid var(--dpgen-border)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--dpgen-accent-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--dpgen-accent)',
                    flexShrink: 0,
                  }}>
                    {getRoutineIcon(routine.icon)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{routine.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{routine.totalDuration} min</span>
                      <span>•</span>
                      <span style={{ textTransform: 'capitalize' }}>{routine.difficulty}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ModalSection>
        )}
      </Modal>
      <BadgeNotification badge={newBadge} onClose={clearNewBadge} />
    </>
    );
  }

  // Paths list view
  return (
    <>
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Learning Paths"
      icon={<Route size={20} />}
      size="xl"
    >
      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--dpgen-muted)' }} />
          <input
            type="text"
            placeholder="Search paths..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2.25rem',
              border: '1px solid var(--dpgen-border)',
              borderRadius: '8px',
              background: 'var(--dpgen-bg)',
              color: 'var(--dpgen-text)',
              fontSize: '0.875rem',
            }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--dpgen-muted)' }} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.6rem 2rem 0.6rem 2.25rem',
              border: '1px solid var(--dpgen-border)',
              borderRadius: '8px',
              background: 'var(--dpgen-bg)',
              color: 'var(--dpgen-text)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Paths List */}
      {filteredPaths.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dpgen-muted)' }}>
          <Route size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>No learning paths found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                  padding: '1rem',
                  background: 'var(--dpgen-bg)',
                  border: '1px solid var(--dpgen-border)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--dpgen-accent)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--dpgen-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', flex: 1 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'var(--dpgen-accent-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCompleted ? '#10b981' : 'var(--dpgen-accent)',
                      flexShrink: 0,
                    }}>
                      {getCategoryIcon(path.category)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {path.name}
                        {isCompleted && <CheckCircle2 size={16} style={{ color: '#10b981' }} />}
                      </h3>
                      <p style={{ margin: '0.25rem 0 0 0', color: 'var(--dpgen-muted)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        {path.description.length > 100 ? path.description.slice(0, 100) + '...' : path.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} style={{ color: 'var(--dpgen-muted)', flexShrink: 0 }} />
                </div>

                {/* Progress */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem', color: 'var(--dpgen-muted)' }}>
                    <span>{pathProgress?.stepsCompleted || 0} / {path.steps.length} steps</span>
                    <span style={{ fontWeight: 500 }}>{Math.round(progressPercent)}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'var(--dpgen-border)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${progressPercent}%`,
                      height: '100%',
                      background: isCompleted
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>

                {/* Meta Info */}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--dpgen-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <TrendingUp size={12} />
                    Difficulty: {path.difficulty}/10
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ListOrdered size={12} />
                    {path.steps.length} steps
                  </span>
                  {path.estimatedDuration && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {path.estimatedDuration} min
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
    <BadgeNotification badge={newBadge} onClose={clearNewBadge} />
    </>
  );
};
