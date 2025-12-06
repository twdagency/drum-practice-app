/**
 * Hook to track practice statistics when practice sessions start and end
 * Enhanced to track preset patterns, BPM achievements, and detailed accuracy
 */

'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { PracticeSession, PresetBestScore } from '@/types/practice';

// Calculate mastery level based on accuracy and attempts
function calculateMastery(accuracy: number, attempts: number): PresetBestScore['mastery'] {
  if (accuracy >= 95 && attempts >= 10) return 'master';
  if (accuracy >= 85 && attempts >= 5) return 'proficient';
  if (accuracy >= 70 && attempts >= 3) return 'intermediate';
  if (accuracy >= 50 && attempts >= 2) return 'learning';
  return 'beginner';
}

export function usePracticeStats() {
  const midiPractice = useStore((state) => state.midiPractice);
  const microphonePractice = useStore((state) => state.microphonePractice);
  const isPlaying = useStore((state) => state.isPlaying);
  const patterns = useStore((state) => state.patterns);
  const bpm = useStore((state) => state.bpm);
  const practiceStartTime = useStore((state) => state.practiceStartTime);
  const setPracticeStartTime = useStore((state) => state.setPracticeStartTime);
  const updatePracticeStats = useStore((state) => state.updatePracticeStats);
  const practiceStats = useStore((state) => state.practiceStats);
  
  const sessionStartTimeRef = useRef<number | null>(null);
  const lastSessionIdRef = useRef<string | null>(null);
  const sessionBpmRef = useRef<number>(120);
  
  // Check if any practice mode is active
  const isPracticeActive = midiPractice.enabled || microphonePractice.enabled;
  const currentPracticeMode = midiPractice.enabled ? 'midi' : 'microphone';
  const currentPracticeState = midiPractice.enabled ? midiPractice : microphonePractice;
  
  // Capture BPM when session starts
  useEffect(() => {
    if (isPracticeActive && isPlaying && !sessionStartTimeRef.current) {
      sessionBpmRef.current = bpm;
    }
  }, [isPracticeActive, isPlaying, bpm]);
  
  // Start tracking when practice begins
  useEffect(() => {
    if (isPracticeActive && isPlaying && currentPracticeState.startTime && !sessionStartTimeRef.current) {
      // Practice just started - record session start time
      const startTime = Date.now();
      sessionStartTimeRef.current = startTime;
      sessionBpmRef.current = bpm;
      setPracticeStartTime(startTime);
      console.log('[Practice Stats] Session started at', new Date(startTime).toISOString(), 'BPM:', bpm);
    }
  }, [isPracticeActive, isPlaying, currentPracticeState.startTime, setPracticeStartTime, bpm]);
  
  // End tracking and record session when practice stops
  useEffect(() => {
    if (!isPracticeActive || !isPlaying) {
      // Practice stopped - record the session if we have a start time
      if (sessionStartTimeRef.current) {
        const endTime = Date.now();
        const duration = Math.floor((endTime - sessionStartTimeRef.current) / 1000); // seconds
        
        // Only record if session was at least 1 second
        if (duration >= 1) {
          // Calculate statistics from practice hits
          const expectedNotes = currentPracticeState.expectedNotes || [];
          const actualHits = currentPracticeState.actualHits || [];
          
          // Calculate accuracy (percentage of expected notes that were matched)
          // Penalize extra hits to prevent "spam to win" strategy
          const matchedNotes = expectedNotes.filter(note => note.matched).length;
          const extraHits = actualHits.filter(hit => hit.isExtraHit).length;
          const denominator = expectedNotes.length + extraHits;
          const accuracy = denominator > 0 
            ? (matchedNotes / denominator) * 100 
            : undefined;
          
          // Calculate timing breakdown
          const matchedHits = actualHits.filter(hit => hit.matched);
          const perfectHits = matchedHits.filter(hit => hit.perfect).length;
          const earlyHits = matchedHits.filter(hit => hit.early && !hit.perfect).length;
          const lateHits = matchedHits.filter(hit => !hit.early && !hit.perfect).length;
          
          const timingAvg = matchedHits.length > 0
            ? matchedHits.reduce((sum, hit) => sum + Math.abs(hit.timingError), 0) / matchedHits.length
            : undefined;
          
          // Calculate dynamic (ghost/accent) accuracy
          const hitsWithDynamic = actualHits.filter(h => h.dynamicMatch !== undefined);
          const dynamicMatches = hitsWithDynamic.filter(h => h.dynamicMatch).length;
          const dynamicAccuracy = hitsWithDynamic.length > 0
            ? (dynamicMatches / hitsWithDynamic.length) * 100
            : undefined;
          
          // Get pattern info
          const patternId = patterns.length > 0 ? patterns[0].id : null;
          const presetId = patterns.length > 0 ? (patterns[0] as any).presetId : undefined;
          const presetName = patterns.length > 0 ? (patterns[0] as any).name : undefined;
          
          // Create session record with enhanced data
          const session: PracticeSession = {
            id: `session-${sessionStartTimeRef.current}-${endTime}`,
            patternId,
            presetId,
            presetName,
            startTime: sessionStartTimeRef.current,
            endTime,
            duration,
            accuracy,
            hits: actualHits.length,
            timingAvg,
            bpm: sessionBpmRef.current,
            practiceMode: currentPracticeMode,
            dynamicAccuracy,
            earlyHits,
            lateHits,
            perfectHits,
          };
          
          // Update practice stats
          const updatedSessions = [...practiceStats.sessions, session];
          const updatedTotalTime = practiceStats.totalPracticeTime + duration;
          
          // Update patterns practiced
          const updatedPatternsPracticed = { ...practiceStats.patternsPracticed };
          if (patternId !== null) {
            const patternKey = String(patternId);
            updatedPatternsPracticed[patternKey] = (updatedPatternsPracticed[patternKey] || 0) + duration;
          }
          
          // Update preset best scores
          const updatedPresetBestScores = { ...practiceStats.presetBestScores };
          if (presetId && accuracy !== undefined) {
            const existing = updatedPresetBestScores[presetId];
            const isNewBest = !existing || accuracy > existing.bestAccuracy;
            const isNewBpmBest = accuracy >= 80 && (!existing || sessionBpmRef.current > (existing.bestBpm || 0));
            
            updatedPresetBestScores[presetId] = {
              presetId,
              presetName: presetName || presetId,
              bestAccuracy: Math.max(accuracy, existing?.bestAccuracy || 0),
              bestTiming: timingAvg !== undefined 
                ? Math.min(timingAvg, existing?.bestTiming || Infinity)
                : existing?.bestTiming || 0,
              bestBpm: isNewBpmBest ? sessionBpmRef.current : (existing?.bestBpm || 0),
              attempts: (existing?.attempts || 0) + 1,
              totalTime: (existing?.totalTime || 0) + duration,
              lastPracticed: endTime,
              accuracyHistory: [
                ...(existing?.accuracyHistory || []).slice(-19), // Keep last 20
                { timestamp: endTime, accuracy, bpm: sessionBpmRef.current },
              ],
              mastery: calculateMastery(
                Math.max(accuracy, existing?.bestAccuracy || 0),
                (existing?.attempts || 0) + 1
              ),
            };
          }
          
          // Update tempo achievements
          let updatedTempoAchievements = [...practiceStats.tempoAchievements];
          if (patternId !== null && accuracy !== undefined && accuracy >= 80) {
            const existingAchievement = updatedTempoAchievements.find(a => a.patternId === patternId);
            if (existingAchievement) {
              if (sessionBpmRef.current > existingAchievement.maxBpm) {
                existingAchievement.maxBpm = sessionBpmRef.current;
              }
            } else {
              updatedTempoAchievements.push({ patternId, maxBpm: sessionBpmRef.current });
            }
          }
          
          // Update streak (check if practice was today)
          const today = new Date().toISOString().split('T')[0];
          const lastPracticeDate = practiceStats.lastPracticeDate;
          let updatedStreak = practiceStats.currentStreak;
          
          if (lastPracticeDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (lastPracticeDate === yesterdayStr) {
              updatedStreak = practiceStats.currentStreak + 1;
            } else if (lastPracticeDate === null || lastPracticeDate < yesterdayStr) {
              updatedStreak = 1;
            }
          }
          
          // Update weekly aggregates
          const weeklyAccuracy = updateWeeklyArray(
            practiceStats.weeklyAccuracy,
            accuracy || 0
          );
          const weeklyPracticeTime = updateWeeklyArray(
            practiceStats.weeklyPracticeTime,
            duration
          );
          
          // Update stats
          updatePracticeStats({
            sessions: updatedSessions,
            totalPracticeTime: updatedTotalTime,
            patternsPracticed: updatedPatternsPracticed,
            presetBestScores: updatedPresetBestScores,
            tempoAchievements: updatedTempoAchievements,
            currentStreak: updatedStreak,
            lastPracticeDate: today,
            weeklyAccuracy,
            weeklyPracticeTime,
          });
          
          console.log('[Practice Stats] Session recorded:', {
            duration: `${duration}s`,
            accuracy: accuracy !== undefined ? `${accuracy.toFixed(1)}%` : 'N/A',
            bpm: sessionBpmRef.current,
            hits: actualHits.length,
            perfectHits,
            earlyHits,
            lateHits,
            dynamicAccuracy: dynamicAccuracy !== undefined ? `${dynamicAccuracy.toFixed(1)}%` : 'N/A',
            timingAvg: timingAvg !== undefined ? `${timingAvg.toFixed(1)}ms` : 'N/A',
            streak: updatedStreak,
            presetId,
            presetName,
          });
          
          lastSessionIdRef.current = session.id;
        }
        
        // Reset session tracking
        sessionStartTimeRef.current = null;
        setPracticeStartTime(null);
      }
    }
  }, [
    isPracticeActive,
    isPlaying,
    currentPracticeState.expectedNotes,
    currentPracticeState.actualHits,
    patterns,
    bpm,
    practiceStats,
    updatePracticeStats,
    setPracticeStartTime,
    currentPracticeMode,
  ]);
  
  // Reset session tracking if practice is disabled
  useEffect(() => {
    if (!isPracticeActive) {
      sessionStartTimeRef.current = null;
      if (practiceStartTime) {
        setPracticeStartTime(null);
      }
    }
  }, [isPracticeActive, practiceStartTime, setPracticeStartTime]);
}

// Helper to update weekly arrays (keeps last 7 entries, adds new value)
function updateWeeklyArray(arr: number[], newValue: number): number[] {
  const updated = [...arr, newValue];
  return updated.slice(-7);
}
