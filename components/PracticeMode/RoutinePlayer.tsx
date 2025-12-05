'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PracticeRoutine, RoutineExercise, RoutineProgress } from '@/types/routine';
import { useStore } from '@/store/useStore';
import { usePresets } from '@/hooks/usePresets';
import { useAchievements } from '@/hooks/useAchievements';
import { BadgeNotification } from '@/components/shared/BadgeNotification';
import { parseTimeSignature, buildAccentIndices, parseNumberList, parseTokens, formatList } from '@/lib/utils/patternUtils';
import {
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Lightbulb,
  Timer,
  Music,
  Volume2,
  Zap,
  Dumbbell,
  Rocket,
  Guitar,
  BookOpen,
  Flame,
  LucideIcon,
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

const getRoutineIcon = (iconName: string, size: number = 24) => {
  const IconComponent = ROUTINE_ICON_MAP[iconName] || Zap;
  return <IconComponent size={size} />;
};

interface RoutinePlayerProps {
  routine: PracticeRoutine;
  onClose: () => void;
  onComplete: () => void;
}

export const RoutinePlayer: React.FC<RoutinePlayerProps> = ({ routine, onClose, onComplete }) => {
  const { presets } = usePresets();
  const addPattern = useStore((state) => state.addPattern);
  const clearAllPatterns = useStore((state) => state.clearAllPatterns);
  const setBPM = useStore((state) => state.setBPM);
  const bpm = useStore((state) => state.bpm);
  const isPlaying = useStore((state) => state.isPlaying);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const { 
    state: achievementState,
    newBadge, 
    clearNewBadge,
    trackExerciseCompleted, 
    trackRoutineCompleted,
    trackPracticeTime,
    trackFirstAction,
  } = useAchievements();

  // State
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseTimeRemaining, setExerciseTimeRemaining] = useState(0);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentExercise = routine.exercises[currentExerciseIndex];

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load pattern for exercise
  const loadExercisePattern = useCallback((exercise: RoutineExercise) => {
    const preset = presets.find(p => p.id === exercise.presetId);
    if (!preset) {
      console.warn(`Preset not found: ${exercise.presetId}`);
      return;
    }

    const [beats, beatType] = parseTimeSignature(preset.timeSignature);
    const accentIndices = preset.accents && Array.isArray(preset.accents)
      ? preset.accents
      : buildAccentIndices(parseNumberList(preset.phrase));

    const pattern = {
      id: 0,
      timeSignature: preset.timeSignature,
      beats,
      beatType,
      subdivision: preset.subdivision,
      phrase: preset.phrase,
      drumPattern: preset.drumPattern,
      stickingPattern: preset.stickingPattern,
      repeat: preset.repeat || 1,
      accentIndices,
      leftFoot: false,
      rightFoot: false,
      _presetName: preset.name,
      _presetDescription: preset.description,
      _presetAccents: accentIndices,
      _presetId: preset.id,
    };

    clearAllPatterns();
    addPattern(pattern);
    setBPM(exercise.startBPM);
  }, [presets, clearAllPatterns, addPattern, setBPM]);

  // Start exercise
  const startExercise = useCallback(() => {
    if (!currentExercise) return;
    
    loadExercisePattern(currentExercise);
    setExerciseTimeRemaining(currentExercise.duration * 60);
    setIsExerciseActive(true);
    setIsPaused(false);
    setIsResting(false);
  }, [currentExercise, loadExercisePattern]);

  // Timer effect
  useEffect(() => {
    if (isExerciseActive && !isPaused) {
      timerRef.current = setInterval(() => {
        if (isResting) {
          setRestTimeRemaining(prev => {
            if (prev <= 1) {
              setIsResting(false);
              // Move to next exercise
              if (currentExerciseIndex < routine.exercises.length - 1) {
                setCurrentExerciseIndex(prev => prev + 1);
              } else {
                // Routine complete
                setIsExerciseActive(false);
                trackRoutineCompleted();
                trackPracticeTime(Math.floor(totalTimeElapsed / 60));
                onComplete();
              }
              return 0;
            }
            return prev - 1;
          });
        } else {
          setExerciseTimeRemaining(prev => {
            if (prev <= 1) {
              // Exercise complete
              setCompletedExercises(completed => [...completed, currentExercise.id]);
              
              // Track achievement
              trackExerciseCompleted();
              if (achievementState.exercisesCompleted === 0) {
                trackFirstAction('complete_exercise');
              }
              
              // Check for rest period
              if (currentExercise.restAfter && currentExercise.restAfter > 0) {
                setIsResting(true);
                setRestTimeRemaining(currentExercise.restAfter);
              } else if (currentExerciseIndex < routine.exercises.length - 1) {
                // Move to next exercise
                setCurrentExerciseIndex(prev => prev + 1);
              } else {
                // Routine complete
                setIsExerciseActive(false);
                trackRoutineCompleted();
                trackPracticeTime(Math.floor(totalTimeElapsed / 60));
                onComplete();
              }
              return 0;
            }
            return prev - 1;
          });
          setTotalTimeElapsed(prev => prev + 1);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isExerciseActive, isPaused, isResting, currentExercise, currentExerciseIndex, routine.exercises.length, onComplete]);

  // Load pattern when exercise changes
  useEffect(() => {
    if (isExerciseActive && !isResting && currentExercise) {
      loadExercisePattern(currentExercise);
      setExerciseTimeRemaining(currentExercise.duration * 60);
    }
  }, [currentExerciseIndex, isExerciseActive, isResting, currentExercise, loadExercisePattern]);

  // Tempo progression during exercise
  useEffect(() => {
    if (!isExerciseActive || isPaused || isResting || !currentExercise.targetBPM) return;

    const totalSeconds = currentExercise.duration * 60;
    const progress = 1 - (exerciseTimeRemaining / totalSeconds);
    const targetBpm = currentExercise.startBPM + 
      (currentExercise.targetBPM - currentExercise.startBPM) * progress;
    
    // Update BPM every 10 seconds
    if (exerciseTimeRemaining % 10 === 0) {
      setBPM(Math.round(targetBpm));
    }
  }, [exerciseTimeRemaining, isExerciseActive, isPaused, isResting, currentExercise, setBPM]);

  const handlePauseResume = () => {
    setIsPaused(prev => !prev);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const handleSkipExercise = () => {
    if (currentExerciseIndex < routine.exercises.length - 1) {
      setCompletedExercises(completed => [...completed, currentExercise.id]);
      trackExerciseCompleted();
      setCurrentExerciseIndex(prev => prev + 1);
      setIsResting(false);
    } else {
      setIsExerciseActive(false);
      trackRoutineCompleted();
      trackPracticeTime(Math.floor(totalTimeElapsed / 60));
      onComplete();
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setIsResting(false);
    }
  };

  const handleRestartExercise = () => {
    if (currentExercise) {
      loadExercisePattern(currentExercise);
      setExerciseTimeRemaining(currentExercise.duration * 60);
      setIsResting(false);
    }
  };

  const progress = ((currentExerciseIndex + (1 - exerciseTimeRemaining / (currentExercise?.duration * 60 || 1))) / routine.exercises.length) * 100;

  return (
    <>
    <div
      className="dpgen-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'var(--dpgen-bg)',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--dpgen-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--dpgen-accent)'
              }}>
                {getRoutineIcon(routine.icon, 20)}
              </span>
              {routine.name}
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>
              {routine.exercises.length} exercises • {routine.totalDuration} min
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--dpgen-muted)',
              padding: '0.5rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
          <div style={{
            height: '6px',
            background: 'var(--dpgen-border)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--dpgen-muted)',
          }}>
            <span>Exercise {currentExerciseIndex + 1} of {routine.exercises.length}</span>
            <span>{formatTime(totalTimeElapsed)} elapsed</span>
          </div>
        </div>

        {/* Main Content */}
        {!isExerciseActive ? (
          /* Start Screen */
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              color: 'white',
            }}>
              {getRoutineIcon(routine.icon, 40)}
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Ready to Start?</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--dpgen-muted)', fontSize: '0.9rem' }}>
              {routine.description}
            </p>
            
            <div style={{
              background: 'var(--dpgen-card)',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={16} />
                Today's Goals
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--dpgen-muted)' }}>
                {routine.goals.map((goal, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{goal}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={startExercise}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Play size={24} />
              Begin Routine
            </button>
          </div>
        ) : isResting ? (
          /* Rest Screen */
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'var(--dpgen-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              border: '4px solid #10b981',
            }}>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>{restTimeRemaining}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>seconds</div>
              </div>
            </div>
            
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#10b981' }}>
              Rest Break
            </h3>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--dpgen-muted)', fontSize: '0.9rem' }}>
              Shake out your hands. Breathe. Prepare for the next exercise.
            </p>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--dpgen-muted)' }}>
              Next: <strong>{routine.exercises[currentExerciseIndex + 1]?.name || 'Complete!'}</strong>
            </p>

            <button
              onClick={handleSkipExercise}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid var(--dpgen-border)',
                borderRadius: '6px',
                color: 'var(--dpgen-text)',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Skip Rest
            </button>
          </div>
        ) : (
          /* Exercise Active Screen */
          <div style={{ padding: '1.5rem' }}>
            {/* Current Exercise */}
            <div style={{
              background: 'var(--dpgen-card)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-accent)', fontWeight: 500, marginBottom: '0.25rem' }}>
                    {currentExercise.focusArea}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                    {currentExercise.name}
                  </h3>
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: exerciseTimeRemaining < 30 ? '#ef4444' : 'var(--dpgen-text)',
                }}>
                  {formatTime(exerciseTimeRemaining)}
                </div>
              </div>

              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--dpgen-muted)', lineHeight: 1.5 }}>
                {currentExercise.instructions}
              </p>

              {/* BPM Display */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.75rem',
                background: 'var(--dpgen-bg)',
                borderRadius: '8px',
                marginBottom: '0.75rem',
              }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Current BPM</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dpgen-accent)' }}>{bpm}</div>
                </div>
                {currentExercise.targetBPM && (
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Target BPM</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{currentExercise.targetBPM}</div>
                  </div>
                )}
              </div>

              {/* Tips */}
              {currentExercise.tips && currentExercise.tips.length > 0 && (
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Lightbulb size={14} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b' }}>Tips</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--dpgen-muted)' }}>
                    {currentExercise.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <button
                onClick={handlePreviousExercise}
                disabled={currentExerciseIndex === 0}
                style={{
                  padding: '0.75rem',
                  background: 'var(--dpgen-card)',
                  border: '1px solid var(--dpgen-border)',
                  borderRadius: '10px',
                  cursor: currentExerciseIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentExerciseIndex === 0 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SkipBack size={20} />
              </button>
              
              <button
                onClick={handlePauseResume}
                style={{
                  padding: '0.75rem 2rem',
                  background: isPaused ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'var(--dpgen-card)',
                  color: isPaused ? 'white' : 'var(--dpgen-text)',
                  border: isPaused ? 'none' : '1px solid var(--dpgen-border)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>

              <button
                onClick={handleRestartExercise}
                style={{
                  padding: '0.75rem',
                  background: 'var(--dpgen-card)',
                  border: '1px solid var(--dpgen-border)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RotateCcw size={20} />
              </button>

              <button
                onClick={handleSkipExercise}
                style={{
                  padding: '0.75rem',
                  background: 'var(--dpgen-card)',
                  border: '1px solid var(--dpgen-border)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SkipForward size={20} />
              </button>
            </div>

            {/* Exercise List */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--dpgen-muted)' }}>
                Coming Up
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {routine.exercises.slice(currentExerciseIndex, currentExerciseIndex + 4).map((exercise, idx) => {
                  const actualIdx = currentExerciseIndex + idx;
                  const isComplete = completedExercises.includes(exercise.id);
                  const isCurrent = actualIdx === currentExerciseIndex;
                  
                  return (
                    <div
                      key={exercise.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        background: isCurrent ? 'var(--dpgen-accent-light)' : 'transparent',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                      }}
                    >
                      {isComplete ? (
                        <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      ) : isCurrent ? (
                        <Play size={16} style={{ color: 'var(--dpgen-accent)' }} />
                      ) : (
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: '1.5px solid var(--dpgen-border)',
                        }} />
                      )}
                      <span style={{ 
                        flex: 1, 
                        fontWeight: isCurrent ? 600 : 400,
                        color: isComplete ? 'var(--dpgen-muted)' : 'var(--dpgen-text)',
                      }}>
                        {exercise.name}
                      </span>
                      <span style={{ color: 'var(--dpgen-muted)', fontSize: '0.7rem' }}>
                        {exercise.duration} min
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    <BadgeNotification badge={newBadge} onClose={clearNewBadge} />
    </>
  );
};

