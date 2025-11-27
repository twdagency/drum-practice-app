/**
 * Hook to track practice statistics when practice sessions start and end
 */

'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { PracticeSession } from '@/types/practice';

export function usePracticeStats() {
  const midiPractice = useStore((state) => state.midiPractice);
  const microphonePractice = useStore((state) => state.microphonePractice);
  const isPlaying = useStore((state) => state.isPlaying);
  const patterns = useStore((state) => state.patterns);
  const practiceStartTime = useStore((state) => state.practiceStartTime);
  const setPracticeStartTime = useStore((state) => state.setPracticeStartTime);
  const updatePracticeStats = useStore((state) => state.updatePracticeStats);
  const practiceStats = useStore((state) => state.practiceStats);
  
  const sessionStartTimeRef = useRef<number | null>(null);
  const lastSessionIdRef = useRef<string | null>(null);
  
  // Check if any practice mode is active
  const isPracticeActive = midiPractice.enabled || microphonePractice.enabled;
  const currentPracticeMode = midiPractice.enabled ? 'midi' : 'microphone';
  const currentPracticeState = midiPractice.enabled ? midiPractice : microphonePractice;
  
  // Start tracking when practice begins
  useEffect(() => {
    if (isPracticeActive && isPlaying && currentPracticeState.startTime && !sessionStartTimeRef.current) {
      // Practice just started - record session start time
      const startTime = Date.now();
      sessionStartTimeRef.current = startTime;
      setPracticeStartTime(startTime);
      console.log('[Practice Stats] Session started at', new Date(startTime).toISOString());
    }
  }, [isPracticeActive, isPlaying, currentPracticeState.startTime, setPracticeStartTime]);
  
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
          const matchedNotes = expectedNotes.filter(note => note.matched).length;
          const accuracy = expectedNotes.length > 0 
            ? (matchedNotes / expectedNotes.length) * 100 
            : undefined;
          
          // Calculate average timing error (from matched hits)
          const matchedHits = actualHits.filter(hit => hit.matched && hit.perfect !== undefined);
          const timingAvg = matchedHits.length > 0
            ? matchedHits.reduce((sum, hit) => sum + Math.abs(hit.timingError), 0) / matchedHits.length
            : undefined;
          
          // Get pattern ID (use first pattern if multiple)
          const patternId = patterns.length > 0 ? patterns[0].id : null;
          
          // Create session record
          const session: PracticeSession = {
            id: `session-${sessionStartTimeRef.current}-${endTime}`,
            patternId,
            startTime: sessionStartTimeRef.current,
            endTime,
            duration,
            accuracy,
            hits: actualHits.length,
            timingAvg,
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
          
          // Update streak (check if practice was today)
          const today = new Date().toISOString().split('T')[0];
          const lastPracticeDate = practiceStats.lastPracticeDate;
          let updatedStreak = practiceStats.currentStreak;
          
          if (lastPracticeDate !== today) {
            // Check if last practice was yesterday (to continue streak)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (lastPracticeDate === yesterdayStr) {
              // Continue streak
              updatedStreak = practiceStats.currentStreak + 1;
            } else if (lastPracticeDate === null || lastPracticeDate < yesterdayStr) {
              // Streak broken, start new streak
              updatedStreak = 1;
            }
            // If lastPracticeDate === today, keep current streak (already practiced today)
          }
          
          // Update stats
          updatePracticeStats({
            sessions: updatedSessions,
            totalPracticeTime: updatedTotalTime,
            patternsPracticed: updatedPatternsPracticed,
            currentStreak: updatedStreak,
            lastPracticeDate: today,
          });
          
          console.log('[Practice Stats] Session recorded:', {
            duration: `${duration}s`,
            accuracy: accuracy !== undefined ? `${accuracy.toFixed(1)}%` : 'N/A',
            hits: actualHits.length,
            timingAvg: timingAvg !== undefined ? `${timingAvg.toFixed(1)}ms` : 'N/A',
            streak: updatedStreak,
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
    practiceStats,
    updatePracticeStats,
    setPracticeStartTime,
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


