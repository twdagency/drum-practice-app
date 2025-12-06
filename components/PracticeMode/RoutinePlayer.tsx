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
  const clearPatterns = useStore((state) => state.clearPatterns);
  const setBPM = useStore((state) => state.setBPM);
  const bpm = useStore((state) => state.bpm);
  const isPlaying = useStore((state) => state.isPlaying);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const setInfiniteLoop = useStore((state) => state.setInfiniteLoop);
  const currentLoop = useStore((state) => state.currentLoop);
  const setCurrentLoop = useStore((state) => state.setCurrentLoop);
  const clearMIDIHits = useStore((state) => state.clearMIDIHits);
  const clearMicrophoneHits = useStore((state) => state.clearMicrophoneHits);
  const setMIDIExpectedNotes = useStore((state) => state.setMIDIExpectedNotes);
  const setMicrophoneExpectedNotes = useStore((state) => state.setMicrophoneExpectedNotes);
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
  
  // BPM offset - allows users to adjust all BPMs up or down
  const [bpmOffset, setBpmOffset] = useState(0);
  
  // Helper to calculate adjusted BPM
  const getAdjustedBPM = (baseBPM: number) => Math.max(30, Math.min(300, baseBPM + bpmOffset));

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isExerciseActiveRef = useRef(false);
  const isRestingRef = useRef(false);
  const currentExercise = routine.exercises[currentExerciseIndex];

  // Cleanup: stop playback and reset settings when routine is closed
  useEffect(() => {
    return () => {
      setIsPlaying(false);
      setInfiniteLoop(false); // Reset infinite loop when routine ends
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [setIsPlaying, setInfiniteLoop]);

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
    // Type-safe access to accents property (may exist on some preset types)
    const presetAccents = (preset as { accents?: number[] }).accents;
    const accentIndices = presetAccents && Array.isArray(presetAccents)
      ? presetAccents
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

    clearPatterns();
    addPattern(pattern);
    // Apply BPM offset if set
    setBPM(getAdjustedBPM(exercise.startBPM));

    // Enable infinite loop so pattern repeats until exercise time is up
    setInfiniteLoop(true);
  }, [presets, clearPatterns, addPattern, setBPM, setInfiniteLoop, getAdjustedBPM]);

  // Start exercise - this kicks off the routine
  const startExercise = useCallback(() => {
    if (!currentExercise) return;
    
    console.log('[Routine] Starting exercise:', currentExercise.name);
    
    // Load the pattern first
    loadExercisePattern(currentExercise);
    
    // Clear any accumulated practice hits
    clearMIDIHits();
    clearMicrophoneHits();
    setMIDIExpectedNotes([]);
    setMicrophoneExpectedNotes([]);
    setCurrentLoop(0);
    
    // Set up timer
    setExerciseTimeRemaining(currentExercise.duration * 60);
    setTotalTimeElapsed(0);
    setIsExerciseActive(true);
    isExerciseActiveRef.current = true;
    setIsPaused(false);
    setIsResting(false);
    isRestingRef.current = false;

    // Start playback
    setIsPlaying(true);
  }, [currentExercise, loadExercisePattern, clearMIDIHits, clearMicrophoneHits, setMIDIExpectedNotes, setMicrophoneExpectedNotes, setCurrentLoop, setIsPlaying]);

  // Keep refs in sync with state
  useEffect(() => {
    isRestingRef.current = isResting;
  }, [isResting]);

  // Timer effect - uses refs to be stable and not restart on every state change
  useEffect(() => {
    // Only run the timer when exercise is active and not paused
    if (!isExerciseActive || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    console.log('[Routine] Starting timer interval');
    
    timerRef.current = setInterval(() => {
      // Use refs to get fresh values inside interval
      if (isRestingRef.current) {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsResting(false);
            isRestingRef.current = false;
            // Move to next exercise or complete
            setCurrentExerciseIndex(currentIdx => {
              if (currentIdx < routine.exercises.length - 1) {
                return currentIdx + 1;
              } else {
                // Routine complete
                setIsExerciseActive(false);
                isExerciseActiveRef.current = false;
                trackRoutineCompleted();
                setIsPlaying(false);
                onComplete();
                return currentIdx;
              }
            });
            return 0;
          }
          return prev - 1;
        });
      } else {
        setExerciseTimeRemaining(prev => {
          if (prev <= 1) {
            // Exercise complete - get current exercise index via closure workaround
            setCurrentExerciseIndex(currentIdx => {
              const exercise = routine.exercises[currentIdx];
              if (exercise) {
                setCompletedExercises(completed => [...completed, exercise.id]);
                trackExerciseCompleted();
                
                // Check for rest period
                if (exercise.restAfter && exercise.restAfter > 0) {
                  setIsResting(true);
                  isRestingRef.current = true;
                  setRestTimeRemaining(exercise.restAfter);
                  setIsPlaying(false); // Stop during rest
                } else {
                  // Move to next exercise or complete
                  if (currentIdx < routine.exercises.length - 1) {
                    return currentIdx + 1;
                  } else {
                    // Routine complete
                    setIsExerciseActive(false);
                    isExerciseActiveRef.current = false;
                    trackRoutineCompleted();
                    setIsPlaying(false);
                    onComplete();
                    return currentIdx;
                  }
                }
              }
              return currentIdx;
            });
            return 0;
          }
          return prev - 1;
        });
        setTotalTimeElapsed(prev => prev + 1);
      }
    }, 1000);

    return () => {
      console.log('[Routine] Clearing timer interval');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  // Minimal dependencies - only what controls timer on/off
  }, [isExerciseActive, isPaused]);

  // Load pattern when exercise INDEX changes (moving to next exercise)
  useEffect(() => {
    // Only run when we're actively doing the routine and exercise index changes
    // Skip on initial mount (isExerciseActiveRef will be false)
    if (!isExerciseActiveRef.current || isResting) return;
    
    console.log('[Routine] Exercise index changed to:', currentExerciseIndex, '- loading new pattern');
    
    // Stop current playback
    setIsPlaying(false);
    
    // Reset loop counter
    setCurrentLoop(0);
    
    // Clear practice hits
    clearMIDIHits();
    clearMicrophoneHits();
    setMIDIExpectedNotes([]);
    setMicrophoneExpectedNotes([]);
    
    // Load the new pattern
    const exercise = routine.exercises[currentExerciseIndex];
    if (exercise) {
      loadExercisePattern(exercise);
      setExerciseTimeRemaining(exercise.duration * 60);
      
      // Start playback after brief delay
      setTimeout(() => {
        if (isExerciseActiveRef.current) {
          setIsPlaying(true);
        }
      }, 150);
    }
  // Only trigger on exercise index change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExerciseIndex]);

  // Clear practice hits when loop restarts (loop > 0 means we've started a new iteration)
  useEffect(() => {
    if (currentLoop > 0 && isExerciseActiveRef.current) {
      console.log('[Routine] Loop', currentLoop, '- clearing hits for fresh start');
      // Clear actual hits (the colored timing indicators)
      clearMIDIHits();
      clearMicrophoneHits();
      // Clear expected notes so they get regenerated fresh
      setMIDIExpectedNotes([]);
      setMicrophoneExpectedNotes([]);
    }
  }, [currentLoop, clearMIDIHits, clearMicrophoneHits, setMIDIExpectedNotes, setMicrophoneExpectedNotes]);

  // Tempo progression during exercise - update BPM only at the start of each loop
  // This prevents the playback from restarting mid-pattern when BPM changes
  useEffect(() => {
    if (!isExerciseActiveRef.current || !currentExercise?.targetBPM) return;
    if (currentLoop === 0) return; // Don't update on first loop (startBPM is already set)
    
    // Calculate progress based on time elapsed
    const totalSeconds = currentExercise.duration * 60;
    const elapsed = totalSeconds - exerciseTimeRemaining;
    const progress = elapsed / totalSeconds;
    
    // Calculate target BPM for this point in the exercise (with offset applied)
    const adjustedStartBPM = getAdjustedBPM(currentExercise.startBPM);
    const adjustedTargetBPM = getAdjustedBPM(currentExercise.targetBPM);
    const targetBpm = Math.round(
      adjustedStartBPM + (adjustedTargetBPM - adjustedStartBPM) * progress
    );
    
    console.log(`[Routine] Loop ${currentLoop} - updating BPM to ${targetBpm} (progress: ${(progress * 100).toFixed(1)}%)`);
    setBPM(targetBpm);
  // Only trigger on loop change, not on every second
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLoop]);

  const handlePauseResume = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    // Toggle playback with pause state
    setIsPlaying(!newPaused);
  };

  const handleSkipExercise = () => {
    if (currentExerciseIndex < routine.exercises.length - 1) {
      setCompletedExercises(completed => [...completed, currentExercise.id]);
      trackExerciseCompleted();
      setCurrentExerciseIndex(prev => prev + 1);
      setIsResting(false);
      isRestingRef.current = false;
    } else {
      setIsExerciseActive(false);
      trackRoutineCompleted();
      trackPracticeTime(Math.floor(totalTimeElapsed / 60));
      handleComplete();
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setIsResting(false);
      isRestingRef.current = false;
    }
  };

  const handleRestartExercise = () => {
    if (currentExercise) {
      console.log('[Routine] Restarting exercise:', currentExercise.name);
      
      // Stop current playback
      setIsPlaying(false);
      
      // Reset loop counter
      setCurrentLoop(0);
      
      // Clear practice hits
      clearMIDIHits();
      clearMicrophoneHits();
      setMIDIExpectedNotes([]);
      setMicrophoneExpectedNotes([]);
      
      // Load pattern and reset timer
      loadExercisePattern(currentExercise);
      setExerciseTimeRemaining(currentExercise.duration * 60);
      setIsResting(false);
      isRestingRef.current = false;
      
      // Start playback after a brief delay
      setTimeout(() => {
        if (isExerciseActiveRef.current) {
          setIsPlaying(true);
        }
      }, 150);
    }
  };

  const progress = ((currentExerciseIndex + (1 - exerciseTimeRemaining / (currentExercise?.duration * 60 || 1))) / routine.exercises.length) * 100;

  // Handle close - stop playback, reset settings, and clear timer
  const handleClose = () => {
    console.log('[Routine] Closing routine');
    isExerciseActiveRef.current = false;
    setIsExerciseActive(false);
    setIsPlaying(false);
    setInfiniteLoop(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onClose();
  };

  // Handle complete - stop playback, reset settings, and notify
  const handleComplete = () => {
    console.log('[Routine] Routine complete');
    isExerciseActiveRef.current = false;
    setIsExerciseActive(false);
    setIsPlaying(false);
    setInfiniteLoop(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onComplete();
  };

  return (
    <>
    {/* Inline component that replaces the pattern list */}
    <div
      className="dpgen-card"
      style={{
        width: '100%',
        overflow: 'auto',
        borderRadius: 'var(--dpgen-radius, 14px)',
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
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--dpgen-muted)',
              padding: '0.5rem',
            }}
            title="End Routine"
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
              marginBottom: '1rem',
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

            {/* BPM Adjustment */}
            <div style={{
              background: 'var(--dpgen-card)',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Timer size={16} />
                Tempo Adjustment
              </h4>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--dpgen-muted)' }}>
                Adjust all tempos in this routine up or down
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <button
                  onClick={() => setBpmOffset(prev => Math.max(-50, prev - 10))}
                  disabled={bpmOffset <= -50}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid var(--dpgen-border)',
                    background: 'var(--dpgen-bg)',
                    cursor: bpmOffset <= -50 ? 'not-allowed' : 'pointer',
                    opacity: bpmOffset <= -50 ? 0.5 : 1,
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                  }}
                >
                  −
                </button>
                <div style={{ 
                  minWidth: '100px', 
                  textAlign: 'center',
                  padding: '0.5rem',
                  background: bpmOffset !== 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  borderRadius: '8px',
                }}>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 700,
                    color: bpmOffset > 0 ? '#10b981' : bpmOffset < 0 ? '#f59e0b' : 'var(--dpgen-text)',
                  }}>
                    {bpmOffset > 0 ? '+' : ''}{bpmOffset} BPM
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)' }}>
                    {bpmOffset === 0 ? 'Default' : bpmOffset > 0 ? 'Harder' : 'Easier'}
                  </div>
                </div>
                <button
                  onClick={() => setBpmOffset(prev => Math.min(50, prev + 10))}
                  disabled={bpmOffset >= 50}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid var(--dpgen-border)',
                    background: 'var(--dpgen-bg)',
                    cursor: bpmOffset >= 50 ? 'not-allowed' : 'pointer',
                    opacity: bpmOffset >= 50 ? 0.5 : 1,
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                  }}
                >
                  +
                </button>
              </div>
              {bpmOffset !== 0 && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--dpgen-muted)', textAlign: 'center' }}>
                  First exercise: {getAdjustedBPM(routine.exercises[0].startBPM)} BPM
                  {routine.exercises[0].targetBPM && ` → ${getAdjustedBPM(routine.exercises[0].targetBPM)} BPM`}
                </div>
              )}
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
    <BadgeNotification badge={newBadge} onClose={clearNewBadge} />
    </>
  );
};

