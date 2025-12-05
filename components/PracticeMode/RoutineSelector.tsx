'use client';

import React, { useState, useMemo } from 'react';
import { PracticeRoutine, RoutineCategory, RoutineDifficulty } from '@/types/routine';
import { PRACTICE_ROUTINES } from '@/lib/data/routines';
import { useStore } from '@/store/useStore';
import { useLearningPaths } from '@/hooks/useLearningPaths';
import { LearningPath } from '@/types/learningPath';
import {
  X,
  Clock,
  Target,
  Zap,
  Music,
  BookOpen,
  Trophy,
  Flame,
  Play,
  ChevronRight,
  Filter,
  Star,
  Users,
  Dumbbell,
  Guitar,
  GraduationCap,
  Timer,
  CheckCircle2,
  Info,
  Rocket,
  LucideIcon,
  Route,
  TrendingUp,
} from 'lucide-react';

interface RoutineSelectorProps {
  onClose: () => void;
  onStartRoutine: (routine: PracticeRoutine) => void;
}

// Routine icon mapping - maps icon string names to lucide-react components
const ROUTINE_ICON_MAP: Record<string, LucideIcon> = {
  'zap': Zap,
  'target': Target,
  'dumbbell': Dumbbell,
  'rocket': Rocket,
  'guitar': Guitar,
  'book-open': BookOpen,
  'flame': Flame,
};

// Get icon component for a routine
const getRoutineIcon = (iconName: string, size: number = 24) => {
  const IconComponent = ROUTINE_ICON_MAP[iconName] || Zap;
  return <IconComponent size={size} />;
};

// Category icons and colors
const CATEGORY_CONFIG: Record<RoutineCategory, { icon: React.ReactNode; color: string; label: string }> = {
  warmup: { icon: <Flame size={16} />, color: '#f97316', label: 'Warmup' },
  technique: { icon: <Target size={16} />, color: '#3b82f6', label: 'Technique' },
  speed: { icon: <Zap size={16} />, color: '#eab308', label: 'Speed' },
  genre: { icon: <Guitar size={16} />, color: '#8b5cf6', label: 'Genre' },
  comprehensive: { icon: <BookOpen size={16} />, color: '#10b981', label: 'Comprehensive' },
  challenge: { icon: <Trophy size={16} />, color: '#ef4444', label: 'Challenge' },
};

// Difficulty config
const DIFFICULTY_CONFIG: Record<RoutineDifficulty, { color: string; bgColor: string; label: string }> = {
  beginner: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', label: 'Beginner' },
  intermediate: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', label: 'Intermediate' },
  advanced: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', label: 'Advanced' },
};

// Get related learning paths for a routine
const getRelatedLearningPaths = (routine: PracticeRoutine, paths: LearningPath[]): LearningPath[] => {
  const routineDifficulty = routine.difficulty === 'beginner' ? 3 : routine.difficulty === 'intermediate' ? 6 : 9;
  
  return paths
    .filter(path => {
      // Match difficulty level
      const difficultyMatch = Math.abs(path.difficulty - routineDifficulty) <= 3;
      
      // Match tags/category
      const tagMatch = routine.tags.some(tag => 
        path.category.toLowerCase().includes(tag) || 
        path.name.toLowerCase().includes(tag)
      );
      
      return difficultyMatch || tagMatch;
    })
    .slice(0, 2);
};

export const RoutineSelector: React.FC<RoutineSelectorProps> = ({ onClose, onStartRoutine }) => {
  const practiceStats = useStore((state) => state.practiceStats);
  const { paths } = useLearningPaths();
  
  const [selectedCategory, setSelectedCategory] = useState<RoutineCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<RoutineDifficulty | 'all'>('all');
  const [selectedRoutine, setSelectedRoutine] = useState<PracticeRoutine | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Calculate user level from practice stats
  const userLevel = useMemo(() => {
    const scores = Object.values(practiceStats.presetBestScores);
    if (scores.length === 0) return 3;
    const avgMastery = scores.reduce((sum, s) => {
      const masteryScore = { 'master': 5, 'proficient': 4, 'intermediate': 3, 'learning': 2, 'beginner': 1 }[s.mastery] || 1;
      return sum + masteryScore;
    }, 0) / scores.length;
    return Math.round(avgMastery * 2);
  }, [practiceStats.presetBestScores]);

  // Filter routines
  const filteredRoutines = useMemo(() => {
    return PRACTICE_ROUTINES.filter(routine => {
      if (selectedCategory !== 'all' && routine.category !== selectedCategory) return false;
      if (selectedDifficulty !== 'all' && routine.difficulty !== selectedDifficulty) return false;
      return true;
    });
  }, [selectedCategory, selectedDifficulty]);

  // Get recommended routine
  const recommendedRoutine = useMemo(() => {
    if (userLevel <= 3) {
      return PRACTICE_ROUTINES.find(r => r.id === 'beginner-fundamentals-30');
    } else if (userLevel <= 6) {
      return PRACTICE_ROUTINES.find(r => r.id === 'intermediate-technique-45');
    }
    return PRACTICE_ROUTINES.find(r => r.id === 'rudiment-mastery-40');
  }, [userLevel]);

  const handleStartRoutine = (routine: PracticeRoutine) => {
    onStartRoutine(routine);
  };

  const renderRoutineCard = (routine: PracticeRoutine, isRecommended: boolean = false) => {
    const categoryConfig = CATEGORY_CONFIG[routine.category];
    const difficultyConfig = DIFFICULTY_CONFIG[routine.difficulty];
    const isSelected = selectedRoutine?.id === routine.id;

    return (
      <div
        key={routine.id}
        onClick={() => setSelectedRoutine(routine)}
        style={{
          border: isSelected ? '2px solid var(--dpgen-accent)' : '1px solid var(--dpgen-border)',
          borderRadius: '12px',
          padding: '1rem',
          background: isSelected ? 'var(--dpgen-accent-light)' : 'var(--dpgen-card)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
        }}
      >
        {/* Recommended badge */}
        {isRecommended && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '12px',
            background: 'var(--dpgen-accent)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '0.65rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <Star size={10} />
            Recommended
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: `${categoryConfig.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: categoryConfig.color,
            flexShrink: 0,
          }}>
            {getRoutineIcon(routine.icon, 22)}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{routine.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: categoryConfig.color,
              }}>
                {categoryConfig.icon}
                {categoryConfig.label}
              </span>
              <span style={{ color: 'var(--dpgen-muted)', fontSize: '0.75rem' }}>•</span>
              <span style={{
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: difficultyConfig.bgColor,
                color: difficultyConfig.color,
                fontWeight: 500,
              }}>
                {difficultyConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p style={{
          margin: '0 0 0.75rem 0',
          fontSize: '0.8rem',
          color: 'var(--dpgen-muted)',
          lineHeight: 1.4,
        }}>
          {routine.description.length > 100 ? routine.description.slice(0, 100) + '...' : routine.description}
        </p>

        {/* Stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.75rem',
          color: 'var(--dpgen-muted)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} />
            {routine.totalDuration} min
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Dumbbell size={14} />
            {routine.exercises.length} exercises
          </span>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.5rem' }}>
          {routine.tags.slice(0, 4).map(tag => (
            <span key={tag} style={{
              fontSize: '0.65rem',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--dpgen-bg)',
              color: 'var(--dpgen-muted)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
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
          borderRadius: '12px',
          maxWidth: '1000px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--dpgen-border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                padding: '0.5rem',
                borderRadius: '10px',
                display: 'flex',
              }}>
                <GraduationCap size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                  Practice Routines
                </h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--dpgen-muted)' }}>
                  Guided sessions to answer "What should I practice today?"
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--dpgen-muted)',
                padding: '0.5rem',
                borderRadius: '6px',
                display: 'flex',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Main Panel - Routine List */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '1.5rem',
            borderRight: selectedRoutine ? '1px solid var(--dpgen-border)' : 'none',
          }}>
            {/* Filters */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Filter size={16} style={{ color: 'var(--dpgen-muted)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Filter by:</span>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {/* Category filters */}
                <button
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: selectedCategory === 'all' ? 'var(--dpgen-accent)' : 'var(--dpgen-border)',
                    background: selectedCategory === 'all' ? 'var(--dpgen-accent)' : 'var(--dpgen-card)',
                    color: selectedCategory === 'all' ? 'white' : 'var(--dpgen-text)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  All
                </button>
                {(Object.entries(CATEGORY_CONFIG) as [RoutineCategory, typeof CATEGORY_CONFIG[RoutineCategory]][]).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '20px',
                      border: '1px solid',
                      borderColor: selectedCategory === key ? config.color : 'var(--dpgen-border)',
                      background: selectedCategory === key ? `${config.color}15` : 'var(--dpgen-card)',
                      color: selectedCategory === key ? config.color : 'var(--dpgen-text)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {config.icon}
                    {config.label}
                  </button>
                ))}
              </div>

              {/* Difficulty filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setSelectedDifficulty('all')}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: selectedDifficulty === 'all' ? 'var(--dpgen-accent)' : 'var(--dpgen-border)',
                    background: selectedDifficulty === 'all' ? 'var(--dpgen-accent-light)' : 'transparent',
                    color: 'var(--dpgen-text)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Any Level
                </button>
                {(Object.entries(DIFFICULTY_CONFIG) as [RoutineDifficulty, typeof DIFFICULTY_CONFIG[RoutineDifficulty]][]).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDifficulty(key)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      border: '1px solid',
                      borderColor: selectedDifficulty === key ? config.color : 'var(--dpgen-border)',
                      background: selectedDifficulty === key ? config.bgColor : 'transparent',
                      color: selectedDifficulty === key ? config.color : 'var(--dpgen-text)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommended Section */}
            {recommendedRoutine && selectedCategory === 'all' && selectedDifficulty === 'all' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  margin: '0 0 0.75rem 0',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <Star size={16} style={{ color: '#f59e0b' }} />
                  Recommended for You
                </h3>
                {renderRoutineCard(recommendedRoutine, true)}
              </div>
            )}

            {/* All Routines */}
            <h3 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <BookOpen size={16} />
              {selectedCategory === 'all' && selectedDifficulty === 'all' ? 'All Routines' : 'Filtered Routines'}
              <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', fontWeight: 400 }}>
                ({filteredRoutines.length})
              </span>
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
            }}>
              {filteredRoutines.map(routine => renderRoutineCard(routine, routine.id === recommendedRoutine?.id))}
            </div>

            {filteredRoutines.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dpgen-muted)' }}>
                <Filter size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No routines match your filters.</p>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedRoutine && (
            <div style={{
              width: '350px',
              flexShrink: 0,
              overflow: 'auto',
              padding: '1.5rem',
              background: 'var(--dpgen-card)',
            }}>
              {/* Routine Header */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: `${CATEGORY_CONFIG[selectedRoutine.category].color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: CATEGORY_CONFIG[selectedRoutine.category].color,
                  marginBottom: '0.75rem',
                }}>
                  {getRoutineIcon(selectedRoutine.icon, 28)}
                </div>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
                  {selectedRoutine.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: DIFFICULTY_CONFIG[selectedRoutine.difficulty].bgColor,
                    color: DIFFICULTY_CONFIG[selectedRoutine.difficulty].color,
                    fontWeight: 500,
                  }}>
                    {DIFFICULTY_CONFIG[selectedRoutine.difficulty].label}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--dpgen-muted)',
                  }}>
                    <Clock size={14} />
                    {selectedRoutine.totalDuration} minutes
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--dpgen-muted)', lineHeight: 1.5 }}>
                  {selectedRoutine.description}
                </p>
              </div>

              {/* Goals */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target size={14} />
                  What You'll Achieve
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--dpgen-muted)' }}>
                  {selectedRoutine.goals.map((goal, i) => (
                    <li key={i} style={{ marginBottom: '0.25rem' }}>{goal}</li>
                  ))}
                </ul>
              </div>

              {/* Prerequisites */}
              {selectedRoutine.prerequisites && selectedRoutine.prerequisites.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={14} />
                    Prerequisites
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--dpgen-muted)' }}>
                    {selectedRoutine.prerequisites.map((prereq, i) => (
                      <li key={i} style={{ marginBottom: '0.25rem' }}>{prereq}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Exercises Preview */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Dumbbell size={14} />
                  Exercises ({selectedRoutine.exercises.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedRoutine.exercises.map((exercise, index) => (
                    <div
                      key={exercise.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        background: 'var(--dpgen-bg)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'var(--dpgen-accent-light)',
                        color: 'var(--dpgen-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}>
                        {index + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exercise.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)' }}>
                          {exercise.duration} min • {exercise.startBPM}
                          {exercise.targetBPM ? `-${exercise.targetBPM}` : ''} BPM
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Learning Paths */}
              {getRelatedLearningPaths(selectedRoutine, paths).length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Route size={14} />
                    Related Learning Paths
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {getRelatedLearningPaths(selectedRoutine, paths).map(path => (
                      <div
                        key={path.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          background: 'var(--dpgen-bg)',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <Route size={14} style={{ color: 'var(--dpgen-accent)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {path.name}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--dpgen-muted)' }}>
                            {path.steps.length} steps • Difficulty {path.difficulty}/10
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={() => handleStartRoutine(selectedRoutine)}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Play size={20} />
                Start Routine
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

