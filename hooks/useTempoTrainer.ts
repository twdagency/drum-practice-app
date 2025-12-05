/**
 * Hook for Tempo Trainer mode - gradually increases tempo based on accuracy
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { PracticeStats } from '@/types/practice';

export interface TempoTrainerConfig {
  startBPM: number;
  targetBPM: number;
  incrementBPM: number;
  accuracyThreshold: number; // 0-100 percentage
  barsRequired: number; // Bars at each tempo before increasing
}

export interface TempoTrainerState {
  isActive: boolean;
  currentBPM: number;
  targetBPM: number;
  barsAtCurrentTempo: number;
  barsRequired: number;
  currentAccuracy: number;
  bestBPMReached: number;
  progress: number; // 0-100 percentage towards target
  status: 'waiting' | 'progressing' | 'complete' | 'failed';
}

const DEFAULT_CONFIG: TempoTrainerConfig = {
  startBPM: 60,
  targetBPM: 120,
  incrementBPM: 5,
  accuracyThreshold: 85,
  barsRequired: 4,
};

export function useTempoTrainer() {
  // Store state
  const isPlaying = useStore((state) => state.isPlaying);
  const bpm = useStore((state) => state.bpm);
  const setBPM = useStore((state) => state.setBPM);
  const currentLoop = useStore((state) => state.currentLoop);
  const setCurrentLoop = useStore((state) => state.setCurrentLoop);
  const setInfiniteLoop = useStore((state) => state.setInfiniteLoop);
  const midiPractice = useStore((state) => state.midiPractice);
  const microphonePractice = useStore((state) => state.microphonePractice);
  const patterns = useStore((state) => state.patterns);
  const updatePracticeStats = useStore((state) => state.updatePracticeStats);
  const practiceStats = useStore((state) => state.practiceStats);
  
  // Local state
  const [config, setConfig] = useState<TempoTrainerConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<TempoTrainerState>({
    isActive: false,
    currentBPM: DEFAULT_CONFIG.startBPM,
    targetBPM: DEFAULT_CONFIG.targetBPM,
    barsAtCurrentTempo: 0,
    barsRequired: DEFAULT_CONFIG.barsRequired,
    currentAccuracy: 0,
    bestBPMReached: DEFAULT_CONFIG.startBPM,
    progress: 0,
    status: 'waiting',
  });
  
  // Refs for tracking
  const lastLoopRef = useRef<number>(-1);
  const sessionStartRef = useRef<number | null>(null);
  
  // Calculate accuracy from MIDI or microphone practice
  const calculateAccuracy = useCallback((): number => {
    if (midiPractice.enabled && midiPractice.expectedNotes.length > 0) {
      const matched = midiPractice.expectedNotes.filter(n => n.matched).length;
      return (matched / midiPractice.expectedNotes.length) * 100;
    }
    
    if (microphonePractice.enabled && microphonePractice.expectedNotes.length > 0) {
      const matched = microphonePractice.expectedNotes.filter(n => n.matched).length;
      return (matched / microphonePractice.expectedNotes.length) * 100;
    }
    
    return 0;
  }, [midiPractice, microphonePractice]);
  
  // Start tempo trainer
  const start = useCallback((customConfig?: Partial<TempoTrainerConfig>) => {
    const newConfig = { ...config, ...customConfig };
    setConfig(newConfig);
    
    // Set starting BPM
    setBPM(newConfig.startBPM);
    
    // Enable infinite loop for continuous training
    setInfiniteLoop(true);
    
    // Reset loop counter
    setCurrentLoop(0);
    
    setState({
      isActive: true,
      currentBPM: newConfig.startBPM,
      targetBPM: newConfig.targetBPM,
      barsAtCurrentTempo: 0,
      barsRequired: newConfig.barsRequired,
      currentAccuracy: 0,
      bestBPMReached: newConfig.startBPM,
      progress: 0,
      status: 'progressing',
    });
    
    sessionStartRef.current = Date.now();
    lastLoopRef.current = -1;
    
    console.log('[Tempo Trainer] Started:', newConfig);
  }, [config, setBPM, setInfiniteLoop, setCurrentLoop]);
  
  // Save best tempo to practice stats
  const saveBestTempo = useCallback((bestBPM: number) => {
    if (patterns.length === 0) return;
    
    const patternId = patterns[0].id;
    const existingAchievements = practiceStats?.tempoAchievements || [];
    
    // Find existing achievement for this pattern
    const existingIndex = existingAchievements.findIndex(a => a.patternId === patternId);
    
    if (existingIndex >= 0) {
      // Update if new best is higher
      if (bestBPM > existingAchievements[existingIndex].maxBpm) {
        const updatedAchievements = [...existingAchievements];
        updatedAchievements[existingIndex] = { patternId, maxBpm: bestBPM };
        updatePracticeStats({ tempoAchievements: updatedAchievements });
        console.log('[Tempo Trainer] Updated best tempo:', { patternId, maxBpm: bestBPM });
      }
    } else {
      // Add new achievement
      updatePracticeStats({
        tempoAchievements: [...existingAchievements, { patternId, maxBpm: bestBPM }],
      });
      console.log('[Tempo Trainer] Saved new best tempo:', { patternId, maxBpm: bestBPM });
    }
  }, [patterns, practiceStats?.tempoAchievements, updatePracticeStats]);
  
  // Stop tempo trainer
  const stop = useCallback(() => {
    setState(prev => {
      // Save best tempo when stopping
      if (prev.bestBPMReached > config.startBPM) {
        saveBestTempo(prev.bestBPMReached);
      }
      
      return {
        ...prev,
        isActive: false,
        status: prev.currentBPM >= prev.targetBPM ? 'complete' : 'waiting',
      };
    });
    
    // Disable infinite loop when stopping
    setInfiniteLoop(false);
    
    sessionStartRef.current = null;
    
    console.log('[Tempo Trainer] Stopped');
  }, [config.startBPM, saveBestTempo, setInfiniteLoop]);
  
  // Reset tempo trainer
  const reset = useCallback(() => {
    setState({
      isActive: false,
      currentBPM: config.startBPM,
      targetBPM: config.targetBPM,
      barsAtCurrentTempo: 0,
      barsRequired: config.barsRequired,
      currentAccuracy: 0,
      bestBPMReached: config.startBPM,
      progress: 0,
      status: 'waiting',
    });
    
    setBPM(config.startBPM);
    setInfiniteLoop(false);
    setCurrentLoop(0);
    lastLoopRef.current = -1;
    
    console.log('[Tempo Trainer] Reset');
  }, [config, setBPM, setInfiniteLoop, setCurrentLoop]);
  
  // Update config
  const updateConfig = useCallback((updates: Partial<TempoTrainerConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Check progress after each bar/loop
  useEffect(() => {
    if (!state.isActive || !isPlaying) return;
    
    // Only process when loop changes
    if (currentLoop === lastLoopRef.current) return;
    lastLoopRef.current = currentLoop;
    
    // Calculate current accuracy (0 if no practice mode)
    const accuracy = calculateAccuracy();
    const hasPracticeMode = midiPractice.enabled || microphonePractice.enabled;
    
    setState(prev => {
      // If no practice mode, auto-progress after each bar
      // If practice mode, require accuracy threshold
      const shouldProgress = hasPracticeMode 
        ? accuracy >= config.accuracyThreshold 
        : true; // Always progress without practice mode
      
      if (shouldProgress) {
        const newBarsAtTempo = prev.barsAtCurrentTempo + 1;
        
        // Check if we've completed enough bars at this tempo
        if (newBarsAtTempo >= config.barsRequired) {
          // Increase tempo
          const newBPM = Math.min(prev.currentBPM + config.incrementBPM, config.targetBPM);
          
          // Calculate progress
          const totalBPMRange = config.targetBPM - config.startBPM;
          const currentProgress = totalBPMRange > 0 
            ? ((newBPM - config.startBPM) / totalBPMRange) * 100 
            : 100;
          
          // Update actual BPM
          setBPM(newBPM);
          
          const isComplete = newBPM >= config.targetBPM;
          
          console.log('[Tempo Trainer] Tempo increased:', {
            from: prev.currentBPM,
            to: newBPM,
            accuracy: hasPracticeMode ? accuracy.toFixed(1) : 'N/A (no practice mode)',
            progress: currentProgress.toFixed(1),
          });
          
          return {
            ...prev,
            currentBPM: newBPM,
            barsAtCurrentTempo: 0,
            currentAccuracy: accuracy,
            bestBPMReached: Math.max(prev.bestBPMReached, newBPM),
            progress: currentProgress,
            status: isComplete ? 'complete' : 'progressing',
          };
        } else {
          // Continue at current tempo
          console.log('[Tempo Trainer] Bar completed:', {
            barsAtTempo: newBarsAtTempo,
            required: config.barsRequired,
            accuracy: hasPracticeMode ? accuracy.toFixed(1) : 'N/A',
          });
          
          return {
            ...prev,
            barsAtCurrentTempo: newBarsAtTempo,
            currentAccuracy: accuracy,
          };
        }
      } else {
        // Accuracy not met - reset bar count at this tempo
        console.log('[Tempo Trainer] Accuracy not met:', {
          accuracy: accuracy.toFixed(1),
          threshold: config.accuracyThreshold,
          resettingBars: true,
        });
        
        return {
          ...prev,
          barsAtCurrentTempo: 0, // Reset progress at this tempo
          currentAccuracy: accuracy,
          status: 'progressing',
        };
      }
    });
  }, [state.isActive, isPlaying, currentLoop, calculateAccuracy, config, setBPM, midiPractice.enabled, microphonePractice.enabled]);
  
  // Stop when playback stops
  useEffect(() => {
    if (!isPlaying && state.isActive) {
      // Don't stop immediately - user might just be pausing
      // But update status
      setState(prev => ({
        ...prev,
        status: prev.currentBPM >= prev.targetBPM ? 'complete' : 'waiting',
      }));
    }
  }, [isPlaying, state.isActive]);
  
  return {
    config,
    state,
    start,
    stop,
    reset,
    updateConfig,
    isActive: state.isActive,
    isPracticeMode: midiPractice.enabled || microphonePractice.enabled,
  };
}

