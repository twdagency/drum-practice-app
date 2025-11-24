/**
 * Progress Tracking Hook
 * Automatically saves practice progress to API when practice sessions end
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { useProgressApi } from './useProgressApi';
import { isApiSyncEnabled } from '@/lib/utils/patternSync';
import { PracticeStats, PracticeSession } from '@/types/practice';
import { useSession } from 'next-auth/react';

interface UseProgressTrackingOptions {
  enabled?: boolean; // Override tracking (default: checks isApiSyncEnabled)
  silent?: boolean; // Don't show errors (default: false)
}

export function useProgressTracking(options: UseProgressTrackingOptions = {}) {
  const { enabled: overrideEnabled, silent = false } = options;
  const { data: session } = useSession();
  const practiceStats = useStore((state) => state.practiceStats);
  const practiceStartTime = useStore((state) => state.practiceStartTime);
  const patterns = useStore((state) => state.patterns);
  const lastSessionRef = useRef<PracticeSession | null>(null);

  // Get user ID from session
  const userId = session?.user?.id;
  
  const { saveProgress, loading, error } = useProgressApi({
    onError: silent ? undefined : (err) => {
      console.error('[Progress Tracking]', err);
    },
  });

  // Check if tracking is enabled
  const isEnabled = overrideEnabled !== undefined
    ? overrideEnabled
    : (typeof window !== 'undefined' && isApiSyncEnabled() && !!userId);

  // Track when practice sessions end
  useEffect(() => {
    if (!isEnabled || !userId) {
      return;
    }

    // Check if a session just ended
    const currentSession = practiceStats.sessions[practiceStats.sessions.length - 1];
    
    // If we have a new session that hasn't been saved yet
    if (currentSession && currentSession.id !== lastSessionRef.current?.id) {
      // Find the pattern ID for this session
      const patternId = currentSession.patternId || (patterns[0]?.id);
      
      if (patternId && currentSession.accuracy !== undefined) {
        // Determine practice type based on which practice mode was active
        // For now, default to 'midi' - this could be enhanced to track which mode was used
        const practiceType: 'midi' | 'microphone' | 'recording' = 'midi';
        
        // Save progress to API
        saveProgress({
          patternId: Number(patternId),
          practiceType,
          accuracy: currentSession.accuracy,
          timing: currentSession.timingAvg,
          totalTime: currentSession.duration,
          notes: currentSession.hits ? [{
            noteIndex: 0,
            accuracy: currentSession.accuracy || 0,
            timing: currentSession.timingAvg || 0,
            attempts: currentSession.hits,
          }] : undefined,
        }).catch((err) => {
          if (!silent) {
            console.error('Failed to save practice progress:', err);
          }
        });
        
        lastSessionRef.current = currentSession;
      }
    }
  }, [practiceStats.sessions, patterns, isEnabled, userId, saveProgress, silent]);

  return {
    loading,
    error,
    isEnabled,
  };
}

