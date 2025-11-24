/**
 * Hook for microphone practice mode - handles audio input and accuracy tracking
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { ExpectedNote, PracticeHit } from '@/types';
import { CONSTANTS } from '@/lib/utils/constants';
import { parseNumberList } from '@/lib/utils/patternUtils';

export function useMicrophonePractice() {
  const isPlaying = useStore((state) => state.isPlaying);
  const microphonePractice = useStore((state) => state.microphonePractice);
  const microphonePracticeEnabled = useStore((state) => state.microphonePractice.enabled);
  const patterns = useStore((state) => state.patterns);
  const bpm = useStore((state) => state.bpm);
  const playbackPosition = useStore((state) => state.playbackPosition);
  const countInActive = useStore((state) => state.microphonePractice.countInActive);
  
  const setMicrophonePracticeEnabled = useStore((state) => state.setMicrophonePracticeEnabled);
  const setMicrophoneExpectedNotes = useStore((state) => state.setMicrophoneExpectedNotes);
  const addMicrophoneHit = useStore((state) => state.addMicrophoneHit);
  const markMicrophoneNoteMatched = useStore((state) => state.markMicrophoneNoteMatched);
  const setMicrophoneStartTime = useStore((state) => state.setMicrophoneStartTime);
  const setMicrophoneCountInActive = useStore((state) => state.setMicrophoneCountInActive);
  const setMicrophoneStream = useStore((state) => state.setMicrophoneStream);
  const setMicrophoneAudioContext = useStore((state) => state.setMicrophoneAudioContext);
  const setMicrophoneAnalyser = useStore((state) => state.setMicrophoneAnalyser);
  const setMicrophoneSource = useStore((state) => state.setMicrophoneSource);
  const setMicrophoneLevelCheckInterval = useStore((state) => state.setMicrophoneLevelCheckInterval);
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastHitTimeRef = useRef<number>(0);
  const hasResetRef = useRef<boolean>(false);
  const levelCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousVolumeRef = useRef<number>(0); // Track previous volume for transient detection
  const peakVolumeAfterHitRef = useRef<number>(0); // Track peak volume after last hit to detect decay

  // Get current practice settings
  const expectedNotes = useStore((state) => state.microphonePractice.expectedNotes);
  const accuracyWindow = useStore((state) => state.microphonePractice.accuracyWindow);
  const latencyAdjustment = useStore((state) => state.microphonePractice.latencyAdjustment);
  const sensitivity = useStore((state) => state.microphonePractice.sensitivity);
  const threshold = useStore((state) => state.microphonePractice.threshold);
  const hitCooldown = useStore((state) => state.microphonePractice.hitCooldown);
  const startTime = useStore((state) => state.microphonePractice.startTime);

  // Build expected notes from patterns (same logic as MIDI practice)
  const buildExpectedNotes = useCallback((): ExpectedNote[] => {
    if (patterns.length === 0) return [];
    
    const expectedNotes: ExpectedNote[] = [];
    const bpmMs = 60000 / bpm;
    
    let globalIndex = 0;
    let globalTimeOffset = 0;
    
    patterns.forEach((pattern) => {
      const timeSig = pattern.timeSignature || '4/4';
      const [beatsPerBar, beatValue] = timeSig.split('/').map(Number);
      const subdivision = pattern.subdivision || 16;
      const phrase = pattern.phrase || '4 4 4 4';
      const drumPattern = pattern.drumPattern || 'S S K S';
      const repeat = pattern.repeat || 1;
      
      const notesPerBeat = subdivision / 4;
      const noteDuration = bpmMs / notesPerBeat;
      
      const phraseTokens = parseNumberList(phrase);
      const drumTokens = drumPattern.split(/\s+/);
      
      for (let r = 0; r < repeat; r++) {
        let noteIndexInPattern = 0;
        let patternTimeOffset = 0;
        
        phraseTokens.forEach((phraseVal) => {
          const notesInThisPhrase = phraseVal;
          
          for (let i = 0; i < notesInThisPhrase; i++) {
            const drumToken = drumTokens[noteIndexInPattern % drumTokens.length];
            
            // For microphone, we detect any hit (not specific to drum type)
            // But we still track which note was expected for accuracy
            if (drumToken !== 'R' && drumToken !== 'X') {
              expectedNotes.push({
                time: globalTimeOffset + patternTimeOffset,
                note: drumToken, // Use drum token (K, S, etc.) instead of MIDI note
                index: globalIndex,
                matched: false,
              });
            }
            
            patternTimeOffset += noteDuration;
            noteIndexInPattern++;
            globalIndex++;
          }
        });
      }
      
      const totalNotesInPattern = phraseTokens.reduce((sum, val) => sum + val, 0) * repeat;
      const patternDuration = totalNotesInPattern * noteDuration;
      globalTimeOffset += patternDuration;
    });
    
    return expectedNotes;
  }, [patterns, bpm]);

  // Find closest expected note for a microphone hit
  const findClosestExpectedNote = useCallback((
    elapsedTime: number
  ): { note: string | number; expectedTime: number; index: number } | null => {
    const searchWindow = accuracyWindow * 3;
    let closest: { note: string | number; expectedTime: number; index: number } | null = null;
    let minDistance = Infinity;

    expectedNotes.forEach((expected, index) => {
      // Skip already matched notes (only allow one match per note)
      if (expected.matched) {
        return;
      }
      
      const distance = Math.abs(expected.time - elapsedTime);
      
      // For microphone, we match any hit (don't check note type)
      if (distance < searchWindow && distance < minDistance) {
        minDistance = distance;
        closest = {
          note: expected.note,
          expectedTime: expected.time,
          index: index,
        };
      }
    });

    return closest;
  }, [expectedNotes, accuracyWindow]);

  // Handle microphone audio detection
  const checkAudioLevel = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) {
      // Silent return - analyser might not be set up yet
      return;
    }

    if (!microphonePracticeEnabled) {
      return;
    }

    // Don't process hits until playback has started (startTime is set) and count-in is complete
    if (!startTimeRef.current) {
      // Silent return - waiting for playback to start
      return;
    }

    if (countInActive) {
      // Silent return - waiting for count-in to complete
      return;
    }
    
    // Don't process hits if not playing (wait for playback to start)
    if (!isPlaying) {
      // Silent return - not playing yet
      return;
    }

    // Get audio data - use time domain data for amplitude detection (better for drum hits)
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    
    // Calculate RMS (Root Mean Square) volume for more accurate amplitude detection
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const normalized = (dataArrayRef.current[i] - 128) / 128; // Convert 0-255 to -1 to 1
      sum += normalized * normalized; // Square for RMS
    }
    const rms = Math.sqrt(sum / dataArrayRef.current.length);
    const normalizedVolume = Math.min(1, rms); // Clamp to 0-1
    
    // Calculate adjusted threshold (higher sensitivity = lower effective threshold, matching calibration)
    const sensitivityMultiplier = sensitivity / 100;
    const adjustedThreshold = threshold / sensitivityMultiplier;
    
    // Check cooldown (after calculating volume so we can update previousVolumeRef during cooldown)
    const now = performance.now();
    const timeSinceLastHit = now - lastHitTimeRef.current;
    
    // For very rapid hits (16th notes at 120 BPM = ~125ms apart), use a shorter cooldown
    // This allows detection of rapid consecutive notes
    const rapidHitCooldown = Math.min(hitCooldown, 80); // Minimum 80ms cooldown for rapid hits
    const effectiveCooldown = timeSinceLastHit < 200 ? rapidHitCooldown : hitCooldown; // Use shorter cooldown if recent hit
    
    if (timeSinceLastHit < effectiveCooldown) {
      // Still update previous volume during cooldown to track changes
      // For rapid hits, allow volume to reset faster so next hit can be detected
      if (normalizedVolume < adjustedThreshold * 0.6) {
        previousVolumeRef.current = Math.max(0, normalizedVolume);
      } else if (timeSinceLastHit > rapidHitCooldown) {
        // After rapid cooldown, start allowing volume to decay even if above threshold
        // This helps detect rapid consecutive hits
        previousVolumeRef.current = Math.max(previousVolumeRef.current * 0.9, normalizedVolume * 0.7);
      }
      return;
    }
    
    // Transient detection: focus on volume spikes/increases rather than absolute volume
    // This makes it more sensitive to drum hits even at lower volumes
    const volumeIncrease = normalizedVolume - previousVolumeRef.current;
    
    // Focus on detecting volume spikes/increases - this is the key to detecting drum hits
    // A spike is a sudden increase in volume, which distinguishes hits from continuous noise
    
    // Calculate transient threshold based on previous volume
    // Use a percentage increase from previous volume - make it very sensitive to spikes at lower volumes
    const relativeTransientThreshold = Math.max(
      adjustedThreshold * 0.02, // Minimum 2% of threshold (lowered from 3%)
      previousVolumeRef.current * 0.08 // 8% increase from previous volume (lowered from 12% for more sensitivity)
    );
    
    // Absolute minimum transient threshold for very quiet hits - make it very sensitive
    const absoluteTransientThreshold = adjustedThreshold * 0.01; // 1% of threshold as absolute minimum (lowered from 1.5%)
    
    // Detect if there's a clear volume spike/increase (transient)
    // This is the primary detection method - a spike indicates a hit, not continuous noise
    // Lower the volume requirement for spike detection to catch quieter hits
    const isTransient = volumeIncrease > relativeTransientThreshold || 
                       (volumeIncrease > absoluteTransientThreshold && normalizedVolume > adjustedThreshold * 0.25); // Lowered from 0.4 to 0.25
    
    // Also allow hits if volume crosses threshold from below (traditional threshold crossing)
    const crossedThreshold = normalizedVolume > adjustedThreshold && previousVolumeRef.current <= adjustedThreshold * 0.9;
    
    // Allow hits if volume was below threshold and now above (new attack after silence)
    const wasBelowThreshold = previousVolumeRef.current <= adjustedThreshold * 0.7 && normalizedVolume > adjustedThreshold;
    
    // Primary condition: volume spike (transient) - this works even at lower volumes
    // Lower the absolute volume requirement significantly when there's a clear spike
    const hasClearTransient = isTransient && volumeIncrease > absoluteTransientThreshold;
    const minVolumeForHit = hasClearTransient ? adjustedThreshold * 0.25 : adjustedThreshold; // Lowered from 0.4 to 0.25 for quieter hits
    
    // Allow hit if: (spike detected AND volume above minimum) OR crossing threshold OR was below and now above
    // The spike detection prevents continuous noise from registering as multiple hits
    const shouldRegisterHit = (normalizedVolume > minVolumeForHit && (isTransient || crossedThreshold || wasBelowThreshold));
    
    if (shouldRegisterHit) {
      lastHitTimeRef.current = now;
      
      if (!startTimeRef.current) {
        console.warn('[Microphone Practice] Hit detected but startTime not set!');
        return;
      }
      
      const elapsedTime = now - startTimeRef.current;
      const adjustedElapsedTime = elapsedTime - latencyAdjustment;

      // Update previous volume and peak volume after registering hit
      // Set previousVolumeRef to a lower value to allow next hit to show an increase
      // For rapid hits, set it even lower to allow very quick consecutive detection
      const isRapidHit = timeSinceLastHit < 200;
      if (isRapidHit) {
        // For rapid hits, set previous volume much lower to allow immediate next hit detection
        previousVolumeRef.current = Math.max(adjustedThreshold * 0.5, normalizedVolume * 0.6);
      } else {
        // For normal hits, use standard decay
        previousVolumeRef.current = Math.max(adjustedThreshold * 0.7, normalizedVolume * 0.8);
      }
      peakVolumeAfterHitRef.current = normalizedVolume; // Track peak volume for decay detection
      
      console.log('[Microphone Practice] Hit detected!', {
        normalizedVolume: normalizedVolume.toFixed(3),
        adjustedThreshold: adjustedThreshold.toFixed(3),
        volumeIncrease: volumeIncrease.toFixed(3),
        isTransient,
        crossedThreshold,
        elapsedTime: elapsedTime.toFixed(2),
        adjustedElapsedTime: adjustedElapsedTime.toFixed(2),
        expectedNotesCount: expectedNotes.length
      });

      // Find closest expected note
      const closestNote = findClosestExpectedNote(adjustedElapsedTime);

      if (closestNote) {
        const timingError = Math.abs(closestNote.expectedTime - adjustedElapsedTime);
        const rawTimingError = adjustedElapsedTime - closestNote.expectedTime;
        const isEarly = rawTimingError < 0;
        const perfectThreshold = Math.min(CONSTANTS.TIMING.PERFECT_HIT_THRESHOLD, accuracyWindow / 4);
        const isPerfect = timingError <= perfectThreshold;
        const isWithinWindow = timingError <= accuracyWindow;

        console.log('[Microphone Practice] Matched note!', {
          expectedTime: closestNote.expectedTime.toFixed(2),
          timingError: timingError.toFixed(2),
          isWithinWindow,
          index: closestNote.index
        });

        if (isWithinWindow) {
          markMicrophoneNoteMatched(closestNote.index);
        }

        const hit: PracticeHit = {
          time: adjustedElapsedTime,
          note: closestNote.note,
          expectedTime: closestNote.expectedTime,
          timingError: timingError,
          rawTimingError: rawTimingError,
          early: isEarly,
          perfect: isPerfect,
          matched: isWithinWindow,
        };

        addMicrophoneHit(hit);
      } else {
        console.log('[Microphone Practice] Hit detected but no matching note found', {
          adjustedElapsedTime: adjustedElapsedTime.toFixed(2),
          expectedNotesRange: expectedNotes.length > 0 
            ? `${expectedNotes[0].time.toFixed(2)} - ${expectedNotes[expectedNotes.length - 1].time.toFixed(2)}`
            : 'none',
          expectedNotes: expectedNotes.map(n => ({ time: n.time.toFixed(2), note: n.note, matched: n.matched })),
          searchWindow: (accuracyWindow * 3).toFixed(2),
          startTime: startTimeRef.current?.toFixed(2),
          now: now.toFixed(2),
          elapsedTime: elapsedTime.toFixed(2),
          latencyAdjustment
        });
        
        // Don't record unmatched hits - they cause issues with color display
        // Only record hits that actually match an expected note
      }
      
      // Update previous volume after processing (even if no hit registered)
      // This allows transient detection to work properly
      if (!shouldRegisterHit) {
        // Track peak volume after last hit for decay detection
        if (peakVolumeAfterHitRef.current > 0 && normalizedVolume > peakVolumeAfterHitRef.current) {
          peakVolumeAfterHitRef.current = normalizedVolume;
        }
        
        // If volume drops significantly below threshold, reset previous volume and peak
        // This allows new transients to be detected after silence
        if (normalizedVolume < adjustedThreshold * 0.6) {
          previousVolumeRef.current = Math.max(0, normalizedVolume);
          if (normalizedVolume < adjustedThreshold * 0.3) {
            peakVolumeAfterHitRef.current = 0; // Reset peak if volume drops very low
          }
        } else {
          // Gradually decay previous volume if above threshold but no hit registered
          // This prevents continuous noise from blocking future hits
          // Decay faster to allow next hit to be detected sooner
          previousVolumeRef.current = Math.max(previousVolumeRef.current * 0.95, normalizedVolume * 0.85);
          
          // Also decay peak volume to allow new hits after some time
          if (peakVolumeAfterHitRef.current > 0) {
            peakVolumeAfterHitRef.current = Math.max(peakVolumeAfterHitRef.current * 0.98, normalizedVolume);
          }
        }
      }
    }
  }, [microphonePracticeEnabled, isPlaying, countInActive, hitCooldown, threshold, sensitivity, latencyAdjustment, accuracyWindow, findClosestExpectedNote, markMicrophoneNoteMatched, addMicrophoneHit]);

  // Reset matched notes and clear hits when playback starts
  const clearMicrophoneHits = useStore((state) => state.clearMicrophoneHits);
  
  useEffect(() => {
    if (isPlaying && playbackPosition === null && !hasResetRef.current) {
      hasResetRef.current = true;
      
      // Clear all hits without resetting the entire practice state
      clearMicrophoneHits();
      
      // Reset start time ref so timing calculations start fresh
      startTimeRef.current = null;
      setMicrophoneStartTime(null);
      
      // Reset matched status on all expected notes
      if (expectedNotes.length > 0) {
        const resetNotes = expectedNotes.map(note => ({ ...note, matched: false }));
        setMicrophoneExpectedNotes(resetNotes);
      }
      
      lastHitTimeRef.current = 0; // Reset last hit time
      previousVolumeRef.current = 0; // Reset previous volume for transient detection
      peakVolumeAfterHitRef.current = 0; // Reset peak volume tracking
      console.log('[Microphone Practice] Reset matched notes, cleared hits, and reset start time - playback starting');
    } else if (!isPlaying) {
      hasResetRef.current = false;
    }
  }, [isPlaying, playbackPosition, expectedNotes, setMicrophoneExpectedNotes, clearMicrophoneHits, setMicrophoneStartTime]);
  
  // Set start time when count-in completes and first note is about to play (matching MIDI practice)
  useEffect(() => {
    // Reset hasResetRef when playback stops or position moves past first note
    if (!isPlaying || (playbackPosition !== null && playbackPosition >= 0 && !countInActive)) {
      hasResetRef.current = false;
    }
    
    // Set start time when first note is expected to play (like WordPress plugin)
    // This happens when count-in completes and playback actually starts
    if (expectedNotes.length > 0 && !startTimeRef.current && !countInActive && playbackPosition !== null && playbackPosition >= 0) {
      // Count-in just completed, first note is about to play
      const firstNoteTime = expectedNotes[0].time; // Usually 0
      
      // Set start time so that elapsedTime = 0 when first note plays
      // This means startTime should be performance.now() when first note actually plays
      const now = performance.now();
      const startTime = now - firstNoteTime; // Adjust for first note offset
      startTimeRef.current = startTime;
      setMicrophoneStartTime(startTime);
      console.log('[Microphone Practice] Start time set:', { 
        startTime: startTime.toFixed(2), 
        firstNoteTime: firstNoteTime.toFixed(2), 
        now: now.toFixed(2),
        playbackPosition,
        countInActive
      });
    }
  }, [expectedNotes, countInActive, playbackPosition, isPlaying, setMicrophoneStartTime]);
  

  // Build expected notes when practice is enabled and patterns change
  useEffect(() => {
    if (!microphonePracticeEnabled) {
      return;
    }

    if (patterns.length === 0) {
      setMicrophoneExpectedNotes([]);
      return;
    }

    const notes = buildExpectedNotes().map(note => ({
      ...note,
      matched: false // Reset matched status when rebuilding
    }));
    setMicrophoneExpectedNotes(notes);
    console.log('[Microphone Practice] Built expected notes:', notes.length);
  }, [microphonePracticeEnabled, patterns, bpm, buildExpectedNotes, setMicrophoneExpectedNotes]);

  // Setup audio analysis when practice is enabled
  useEffect(() => {
    if (!microphonePracticeEnabled) {
      // Clear interval if practice is disabled
      if (levelCheckIntervalRef.current) {
        clearInterval(levelCheckIntervalRef.current);
        levelCheckIntervalRef.current = null;
        setMicrophoneLevelCheckInterval(null);
      }
      analyserRef.current = null;
      dataArrayRef.current = null;
      return;
    }

    const analyser = microphonePractice.analyser;
    if (!analyser) {
      console.log('[Microphone Practice] No analyser available yet - waiting for device setup');
      return;
    }

    // Clear any existing interval
    if (levelCheckIntervalRef.current) {
      clearInterval(levelCheckIntervalRef.current);
      levelCheckIntervalRef.current = null;
    }

    // Initialize analyser refs
    analyserRef.current = analyser;
    // For time-domain data, use fftSize (not frequencyBinCount)
    const bufferLength = analyser.fftSize;
    dataArrayRef.current = new Uint8Array(new ArrayBuffer(bufferLength));

    console.log('[Microphone Practice] Setting up audio analysis', { 
      bufferLength, 
      isPlaying,
      microphonePracticeEnabled,
      hasAnalyser: !!analyser,
      hasDataArray: !!dataArrayRef.current
    });

    // Start checking audio levels (even when not playing, so we can detect hits when playback starts)
    const interval = setInterval(() => {
      checkAudioLevel();
    }, CONSTANTS.AUDIO.LEVEL_CHECK_INTERVAL);

    levelCheckIntervalRef.current = interval;
    setMicrophoneLevelCheckInterval(interval);

    console.log('[Microphone Practice] Audio analysis interval started');

    return () => {
      if (levelCheckIntervalRef.current) {
        clearInterval(levelCheckIntervalRef.current);
        levelCheckIntervalRef.current = null;
        setMicrophoneLevelCheckInterval(null);
        console.log('[Microphone Practice] Audio analysis interval stopped');
      }
    };
  }, [microphonePracticeEnabled, microphonePractice.analyser, checkAudioLevel, setMicrophoneLevelCheckInterval, isPlaying]);

  return {
    // Expose functions if needed
  };
}

