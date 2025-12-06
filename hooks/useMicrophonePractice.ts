/**
 * Hook for microphone practice mode - handles audio input and accuracy tracking
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { ExpectedNote, PracticeHit } from '@/types';
import { CONSTANTS } from '@/lib/utils/constants';
import { parseNumberList, getNotesPerBarForPattern, parseTokens } from '@/lib/utils/patternUtils';
import { getAudioWorkletSupportInfo } from '@/lib/utils/audioWorkletSupport';
// Note: Mute window removed - users should use headphones or turn off click if experiencing false hits

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
  const previousVolumeRef = useRef<number>(0); // Track previous volume for threshold crossing detection
  const quietFrameCountRef = useRef<number>(0); // Track frames of quiet signal for hit detection
  const peakVolumeAfterHitRef = useRef<number>(0); // Track peak volume after last hit
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const useAudioWorkletRef = useRef<boolean>(false);
  const audioContextStartTimeRef = useRef<number | null>(null); // Track AudioContext start time for timing sync

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
      const subdivision = pattern.subdivision || 16;
      const drumPattern = pattern.drumPattern || 'S S K S';
      const repeat = pattern.repeat || 1;
      
      // Get accent indices for this pattern
      const accentIndices = pattern._presetAccents || [];
      
      // Get actual notes per bar (handles both standard and advanced per-beat subdivisions)
      const notesPerBar = getNotesPerBarForPattern(pattern);
      
      // Parse drum pattern tokens
      const drumTokens = parseTokens(drumPattern);
      
      // Calculate note durations - handle per-beat subdivisions if in advanced mode
      let noteDurations: number[] = [];
      if (pattern._advancedMode && pattern._perBeatSubdivisions) {
        const [numerator] = timeSig.split('/').map(Number);
        const beatValue = parseInt(timeSig.split('/')[1] || '4', 10);
        const notesPerBeat = pattern._perBeatSubdivisions.map(sub => sub / beatValue);
        
        // Calculate duration for each note based on its beat's subdivision
        let noteIndex = 0;
        for (let beatIndex = 0; beatIndex < numerator; beatIndex++) {
          const beatSubdivision = pattern._perBeatSubdivisions[beatIndex] || subdivision;
          const notesInThisBeat = Math.round(notesPerBeat[beatIndex] || (subdivision / beatValue));
          const beatDuration = bpmMs * (beatValue / 4); // Duration of one beat in ms
          const noteDurationInBeat = beatDuration / notesInThisBeat;
          
          for (let i = 0; i < notesInThisBeat; i++) {
            noteDurations.push(noteDurationInBeat);
          }
        }
      } else {
        // Standard mode: all notes have the same duration
        const notesPerBeat = subdivision / 4;
        const noteDuration = bpmMs / notesPerBeat;
        noteDurations = Array(notesPerBar).fill(noteDuration);
      }
      
      // Calculate duration of one bar (one repeat)
      const barDuration = noteDurations.reduce((sum, dur) => sum + dur, 0);
      
      // Build notes for each repeat of the pattern
      for (let r = 0; r < repeat; r++) {
        // Time offset for this repeat (accumulates across repeats)
        const repeatTimeOffset = r * barDuration;
        let noteTimeOffset = 0;
        
        // Process all notes in the bar
        for (let i = 0; i < notesPerBar; i++) {
          const drumToken = drumTokens[i % drumTokens.length];
          const noteDuration = noteDurations[i % noteDurations.length];
          
          // Skip rests
          if (drumToken === 'R' || drumToken === 'X' || drumToken === '-') {
            noteTimeOffset += noteDuration;
            globalIndex++;
            continue;
          }
          
          // Detect ghost notes (wrapped in parentheses)
          const isGhost = drumToken.startsWith('(') && drumToken.endsWith(')');
          const cleanToken = isGhost ? drumToken.slice(1, -1) : drumToken;
          
          // Detect accents from _presetAccents array
          const localNoteIndex = i % notesPerBar;
          const isAccent = accentIndices.includes(localNoteIndex);
          
          // Determine dynamic level
          let dynamic: 'ghost' | 'normal' | 'accent' = 'normal';
          if (isGhost) {
            dynamic = 'ghost';
          } else if (isAccent) {
            dynamic = 'accent';
          }
          
          expectedNotes.push({
            time: globalTimeOffset + repeatTimeOffset + noteTimeOffset,
            note: cleanToken.toUpperCase(), // Use clean token without parentheses
            index: globalIndex,
            matched: false,
            dynamic, // Expected dynamic level
            isGhost,
            isAccent,
          });
          
          // Accumulate time offset for next note
          noteTimeOffset += noteDuration;
          globalIndex++;
        }
      }
      
      // Calculate total duration of this pattern (all repeats)
      const totalPatternDuration = barDuration * repeat;
      globalTimeOffset += totalPatternDuration;
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

  // Handle hit from AudioWorklet or AnalyserNode
  // hitVolume is 0-1 representing the volume of the detected hit
  const handleDetectedHit = useCallback((hitTime: number, hitVolume?: number) => {
    // Note: We removed the mute window check here. If users experience the click
    // triggering false hits, they should use headphones or turn off the click sound.

    // Read all values from store directly to avoid stale closures
    const storeState = useStore.getState();
    const currentIsPlaying = storeState.isPlaying;
    const currentCountInActive = storeState.microphonePractice.countInActive;
    const currentExpectedNotes = storeState.microphonePractice.expectedNotes;
    const currentAccuracyWindow = storeState.microphonePractice.accuracyWindow;
    const currentLatencyAdjustment = storeState.microphonePractice.latencyAdjustment;
    
    // console.log('[Microphone Practice] handleDetectedHit called:', {
    //   hitTime: hitTime.toFixed(2),
    //   hasStartTime: !!startTimeRef.current,
    //   isPlaying: currentIsPlaying,
    //   countInActive: currentCountInActive,
    //   expectedNotesCount: currentExpectedNotes.length,
    // });
    
    if (!startTimeRef.current) {
      // console.log('[Microphone Practice] Early return: no startTime');
      return; // Waiting for playback to start
    }

    if (currentCountInActive) {
      // console.log('[Microphone Practice] Early return: count-in still active');
      return; // Waiting for count-in to complete
    }

    if (!currentIsPlaying) {
      // console.log('[Microphone Practice] Early return: not playing');
      return; // Not playing
    }

    const elapsedTime = hitTime - startTimeRef.current;
    const adjustedElapsedTime = elapsedTime - currentLatencyAdjustment;
    
    // console.log('[Microphone Practice] Processing hit:', {
    //   hitTime: hitTime.toFixed(2),
    //   startTime: startTimeRef.current.toFixed(2),
    //   elapsedTime: elapsedTime.toFixed(2),
    //   adjustedElapsedTime: adjustedElapsedTime.toFixed(2),
    //   latencyAdjustment: currentLatencyAdjustment,
    //   expectedNotesCount: currentExpectedNotes.length,
    //   accuracyWindow: currentAccuracyWindow,
    //   searchWindow: currentAccuracyWindow * 3,
    //   expectedNoteTimes: currentExpectedNotes.length > 0 
    //     ? currentExpectedNotes.slice(0, 8).map(n => n.time.toFixed(2)).join(', ')
    //     : 'NO NOTES',
    // });

    // Find closest expected note using current notes from store
    const searchWindow = currentAccuracyWindow * 3;
    let closest: { note: string | number; expectedTime: number; index: number } | null = null;
    let minDistance = Infinity;

    currentExpectedNotes.forEach((expected, index) => {
      // Skip already matched notes (only allow one match per note)
      if (expected.matched) {
        return;
      }
      
      const distance = Math.abs(expected.time - adjustedElapsedTime);
      
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
    
    // Classify hit dynamic based on volume
    const ghostThreshold = storeState.microphonePractice.ghostThreshold || 0.05;
    const normalThreshold = storeState.microphonePractice.threshold || 0.15;
    const accentThreshold = storeState.microphonePractice.accentThreshold || 0.4;
    const dynamicDetection = storeState.microphonePractice.dynamicDetection ?? true;
    
    let detectedDynamic: 'ghost' | 'normal' | 'accent' = 'normal';
    if (dynamicDetection && hitVolume !== undefined) {
      if (hitVolume >= accentThreshold) {
        detectedDynamic = 'accent';
      } else if (hitVolume <= ghostThreshold * 2) {
        // Ghost notes are quiet - use ghostThreshold * 2 as the upper bound
        detectedDynamic = 'ghost';
      }
    }
    
    // Handle EXTRA HITS - hits that don't match any expected note
    // These should be recorded and shown as errors to prevent "spam to win"
    if (!closest) {
      // console.log('[Microphone Practice] Extra hit detected (no matching note) at:', adjustedElapsedTime.toFixed(2));
      
      const extraHit: PracticeHit = {
        time: adjustedElapsedTime,
        note: 'EXTRA', // Mark as extra hit
        expectedTime: -1, // No expected time
        timingError: Infinity, // Maximum error
        rawTimingError: 0,
        early: false,
        perfect: false,
        matched: false,
        velocity: hitVolume !== undefined ? Math.round(hitVolume * 100) : undefined,
        dynamic: detectedDynamic,
        isExtraHit: true, // Flag this as an extra hit
      };
      
      addMicrophoneHit(extraHit);
      return;
    }
    
    // console.log('[Microphone Practice] Found closest note:', {
    //   note: closest.note,
    //   expectedTime: closest.expectedTime.toFixed(2),
    //   index: closest.index,
    //   elapsedTime: adjustedElapsedTime.toFixed(2),
    //   distance: minDistance.toFixed(2),
    // });

    // TypeScript guard: closest is guaranteed to be non-null here after the early return above
    const closestNote: { note: string | number; expectedTime: number; index: number } = closest;
    const timingError = Math.abs(closestNote.expectedTime - adjustedElapsedTime);
    const rawTimingError = adjustedElapsedTime - closestNote.expectedTime;
    const isEarly = rawTimingError < 0;
    const perfectThreshold = Math.min(CONSTANTS.TIMING.PERFECT_HIT_THRESHOLD, currentAccuracyWindow / 4);
    const isPerfect = timingError <= perfectThreshold;
    const isWithinWindow = timingError <= currentAccuracyWindow;

    if (isWithinWindow) {
      markMicrophoneNoteMatched(closestNote.index);
    }
    
    // Check if detected dynamic matches expected dynamic
    const expectedNote = currentExpectedNotes[closestNote.index];
    const expectedDynamic = expectedNote?.dynamic || 'normal';
    const dynamicMatch = detectedDynamic === expectedDynamic;

    const hit: PracticeHit = {
      time: adjustedElapsedTime,
      note: closestNote.note,
      expectedTime: closestNote.expectedTime,
      timingError: timingError,
      rawTimingError: rawTimingError,
      early: isEarly,
      perfect: isPerfect,
      matched: isWithinWindow,
      velocity: hitVolume !== undefined ? Math.round(hitVolume * 100) : undefined, // 0-100
      dynamic: detectedDynamic,
      dynamicMatch: dynamicDetection ? dynamicMatch : undefined,
      isExtraHit: false, // Not an extra hit
    };

    addMicrophoneHit(hit);
  }, [markMicrophoneNoteMatched, addMicrophoneHit]);

  // Setup AudioWorklet for low-latency hit detection
  // useAdvanced: true uses spectral flux + HFC for better accuracy
  const setupAudioWorklet = useCallback(async (
    audioContext: AudioContext,
    source: MediaStreamAudioSourceNode,
    useAdvanced: boolean = true
  ): Promise<AudioWorkletNode | null> => {
    // Check if AudioWorklet is supported
    if (!audioContext.audioWorklet) {
      console.log('[Microphone Practice] AudioWorklet not supported, using AnalyserNode fallback');
      return null;
    }

    try {
      // Load the worklet module - use v2 (spectral flux) for better accuracy
      const workletPath = useAdvanced 
        ? '/worklets/drum-onset-processor-v2.js'
        : '/worklets/drum-onset-processor.js';
      const processorName = useAdvanced ? 'drum-onset-processor-v2' : 'drum-onset-processor';
      
      await audioContext.audioWorklet.addModule(workletPath);
      
      // Track AudioContext start time for timing synchronization
      audioContextStartTimeRef.current = performance.now() - (audioContext.currentTime * 1000);
      
      // Create worklet node with initial parameters
      // Convert sensitivity (0-100) to worklet range (0-2)
      const workletSensitivity = (sensitivity / 50) || 1.5;
      const workletNode = new AudioWorkletNode(audioContext, processorName, {
        processorOptions: {
          sensitivity: workletSensitivity,
          minIntervalMs: hitCooldown,
        },
      });

      // Handle hit messages from worklet
      workletNode.port.onmessage = (event) => {
        // Handle debug messages
        if (event.data.type === 'debug') {
          console.log('[WORKLET DEBUG]', event.data.message);
          return;
        }
        
        // Handle error messages - worklet had an exception but recovered
        if (event.data.type === 'error') {
          console.error('[WORKLET ERROR]', event.data.message);
          return;
        }
        
        if (event.data.type === 'hit') {
          const hitData = event.data;
          
          console.log('[Microphone Practice] AudioWorklet detected hit:', {
            time: hitData.time,
            level: hitData.level?.toFixed(4),
            flux: hitData.flux?.toFixed(4),
            threshold: hitData.fluxThreshold?.toFixed(4),
          });
          
          // Convert worklet time (ms) to performance.now() equivalent
          // Worklet time is relative to AudioContext creation, we need to sync it
          if (!audioContextStartTimeRef.current) {
            // console.log('[Microphone Practice] Waiting for audioContextStartTime');
            return; // Wait for audioContext timing to be set up
          }

          // Convert AudioContext time to performance.now() time
          // hitData.time is in ms from AudioContext start
          const audioContextTimeMs = hitData.time;
          const performanceTime = audioContextStartTimeRef.current + audioContextTimeMs;
          
          // console.log('[Microphone Practice] Converting worklet time to performance time:', {
          //   audioContextTimeMs: audioContextTimeMs.toFixed(2),
          //   audioContextStartTime: audioContextStartTimeRef.current.toFixed(2),
          //   performanceTime: performanceTime.toFixed(2),
          //   hasStartTime: !!startTimeRef.current,
          //   isPlaying: useStore.getState().isPlaying,
          // });
          
          // Use the performance time for hit detection
          // Note: handleDetectedHit will check if startTime is set and if playing
          // We can call it even if startTime isn't set yet - it will handle the check
          // Pass the hit level for dynamic detection
          const hitLevel = hitData.level || 0;
          handleDetectedHit(performanceTime, hitLevel);
        }
      };

      // Connect source to worklet
      source.connect(workletNode);
      
      console.log('[Microphone Practice] AudioWorklet initialized successfully', {
        processor: processorName,
        advanced: useAdvanced,
        sensitivity: workletSensitivity,
        minIntervalMs: hitCooldown,
      });
      
      return workletNode;
    } catch (error) {
      console.error('[Microphone Practice] Failed to initialize AudioWorklet:', error);
      return null;
    }
  }, [sensitivity, hitCooldown, handleDetectedHit]);

  // Update AudioWorklet parameters when they change
  useEffect(() => {
    if (workletNodeRef.current && useAudioWorkletRef.current) {
      const workletSensitivity = (sensitivity / 50) || 1.5;
      workletNodeRef.current.port.postMessage({
        type: 'update-parameters',
        sensitivity: workletSensitivity,
        minIntervalMs: hitCooldown,
      });
    }
  }, [sensitivity, hitCooldown]);

  // Handle microphone audio detection (AnalyserNode fallback)
  const checkAudioLevel = useCallback(() => {
    // Skip if using AudioWorklet (it handles detection separately)
    if (useAudioWorkletRef.current) {
      return;
    }

    if (!analyserRef.current || !dataArrayRef.current) {
      // Silent return - analyser might not be set up yet
      return;
    }

    if (!microphonePracticeEnabled) {
      return;
    }

    // Note: Mute window removed - users should use headphones or turn off click if experiencing false hits

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
    
    // SPIKE DETECTION with QUIET STATE REQUIREMENT
    // Real drum hits come from SILENCE - signal must be quiet for multiple frames
    
    // Minimum volume to consider (noise floor) - raised to filter ambient noise
    const MIN_VOLUME = 0.015;
    const QUIET_THRESHOLD = 0.05; // Signal must be below this to count as "quiet" (raised for noisy mics/environments)
    const QUIET_FRAMES_REQUIRED = 2; // Must be quiet for 2 frames before new hit
    
    // MASK TIME: 100ms allows 16th notes at 120+ BPM while filtering resonance
    const maskTime = 100;
    
    // Track quiet state - cap to prevent overflow
    if (normalizedVolume < QUIET_THRESHOLD) {
      quietFrameCountRef.current = Math.min(quietFrameCountRef.current + 1, 1000);
    } else {
      quietFrameCountRef.current = 0;
    }
    
    const isQuietState = quietFrameCountRef.current >= QUIET_FRAMES_REQUIRED;
    
    // Calculate spike ratio
    const prevVolume = previousVolumeRef.current;
    const spikeRatio = prevVolume > 0.001 ? normalizedVolume / prevVolume : (normalizedVolume > MIN_VOLUME ? 100 : 0);
    
    // Update previous volume
    previousVolumeRef.current = normalizedVolume;

    // Check cooldown (mask time)
    if (timeSinceLastHit < maskTime) {
      return;
    }
    
    // A REAL drum hit detection:
    // - STRONG hits (volume > threshold * 0.7) bypass quiet requirement - below calibrated
    //   (Real drum hits are significantly louder than resonance)
    // - Medium hits require quiet state to filter resonance
    const isVeryStrongHit = normalizedVolume > adjustedThreshold * 0.7 && spikeRatio >= 2.5; // Below calibrated level
    const isStrongHit = normalizedVolume > adjustedThreshold * 0.35 && spikeRatio >= 3.0 && isQuietState;
    const isModerateSpike = normalizedVolume > MIN_VOLUME && spikeRatio >= 4.0 && isQuietState;
    let shouldRegisterHit = isVeryStrongHit || isStrongHit || isModerateSpike;

    // RESONANCE WINDOW FILTERING:
    // After a hit, within 250ms, require new hits to have significant volume
    // relative to the previous hit AND a high spike ratio. This prevents resonance/decay 
    // from triggering false hits. Resonance can oscillate with high volume and 
    // spike ratios of 2-3x, so we require 4x+ to confirm it's a new hit.
    const RESONANCE_WINDOW_MS = 250;
    const RESONANCE_VOLUME_RATIO = 0.35; // New hit must be at least 35% of last hit's volume
    const RESONANCE_SPIKE_RATIO_REQUIRED = 4.0; // Require higher spike ratio in resonance window
    const inResonanceWindow = timeSinceLastHit < RESONANCE_WINDOW_MS && timeSinceLastHit >= maskTime;
    const minVolumeForResonanceWindow = peakVolumeAfterHitRef.current * RESONANCE_VOLUME_RATIO;

    if (inResonanceWindow && shouldRegisterHit) {
      // In resonance window: hits must meet BOTH criteria:
      // 1. Volume >= 35% of last hit's volume (proportional threshold)
      // 2. Spike ratio >= 4.0x (confirms sharp transient, not oscillation)
      if (normalizedVolume < minVolumeForResonanceWindow || spikeRatio < RESONANCE_SPIKE_RATIO_REQUIRED) {
        shouldRegisterHit = false; // Block this hit - likely resonance
      }
    }

    if (shouldRegisterHit) {
      lastHitTimeRef.current = now;
      quietFrameCountRef.current = 0; // Reset quiet counter after hit
      
      if (!startTimeRef.current) {
        console.warn('[Microphone Practice] Hit detected but startTime not set!');
        return;
      }
      
      peakVolumeAfterHitRef.current = normalizedVolume;

      // Use shared hit handler with volume for dynamic detection
      handleDetectedHit(now, normalizedVolume);
    }
  }, [microphonePracticeEnabled, isPlaying, countInActive, hitCooldown, threshold, sensitivity, latencyAdjustment, accuracyWindow, handleDetectedHit, expectedNotes]);

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
      previousVolumeRef.current = 0; // Reset previous volume
      quietFrameCountRef.current = 0; // Reset quiet frame counter
      peakVolumeAfterHitRef.current = 0; // Reset peak volume tracking
      
      // Reset AudioWorklet state if using it
      if (workletNodeRef.current && useAudioWorkletRef.current) {
        workletNodeRef.current.port.postMessage({ type: 'reset' });
      }
      // console.log('[Microphone Practice] Reset matched notes, cleared hits, and reset start time - playback starting');
    } else if (!isPlaying) {
      hasResetRef.current = false;
      
      // Also reset worklet when playback stops to ensure clean state
      if (workletNodeRef.current && useAudioWorkletRef.current) {
        workletNodeRef.current.port.postMessage({ type: 'reset' });
      }
    }
  }, [isPlaying, playbackPosition, expectedNotes, setMicrophoneExpectedNotes, clearMicrophoneHits, setMicrophoneStartTime]);
  
  // Set start time when the first note actually plays (when playbackPosition becomes 0)
  useEffect(() => {
    // Reset hasResetRef when playback stops or position moves past first note
    if (!isPlaying || (playbackPosition !== null && playbackPosition >= 0 && !countInActive)) {
      hasResetRef.current = false;
    }
    
    // Set start time when the first note actually plays (playbackPosition becomes 0)
    // This ensures we sync with when the audio actually starts, not when isPlaying becomes true
    if (expectedNotes.length > 0 && !startTimeRef.current && !countInActive && isPlaying && playbackPosition === 0) {
      // First note is actually playing now
      const firstNoteTime = expectedNotes[0].time; // Usually 0
      
      // Set start time so that elapsedTime = 0 when first note plays
      // Since playbackPosition is 0, the first note is playing RIGHT NOW
      const now = performance.now();
      const startTime = now - firstNoteTime; // Adjust for first note offset
      startTimeRef.current = startTime;
      setMicrophoneStartTime(startTime);
      // console.log('[Microphone Practice] Start time set (first note playing):', { 
      //   startTime: startTime.toFixed(2), 
      //   firstNoteTime: firstNoteTime.toFixed(2), 
      //   now: now.toFixed(2),
      //   playbackPosition,
      //   countInActive
      // });
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
    console.log('[Microphone Practice] Built expected notes:', notes.length, 'notes across', patterns.length, 'patterns');
    if (notes.length > 0) {
      console.log('[Microphone Practice] Time range:', notes[0].time.toFixed(2), 'ms to', notes[notes.length - 1].time.toFixed(2), 'ms');
      // Log notes from each pattern to verify they're all included
      patterns.forEach((pattern, idx) => {
        const patternNotes = notes.filter((n, i) => {
          // Estimate which notes belong to this pattern based on time ranges
          // This is approximate but helps with debugging
          const patternStart = idx === 0 ? 0 : notes.findIndex(n => n.time > (idx * 1000));
          const patternEnd = idx === patterns.length - 1 ? notes.length : notes.findIndex(n => n.time > ((idx + 1) * 1000));
          return i >= (patternStart === -1 ? 0 : patternStart) && i < (patternEnd === -1 ? notes.length : patternEnd);
        });
        console.log(`[Microphone Practice] Pattern ${idx + 1} (${pattern.repeat || 1} bars): ~${patternNotes.length} expected notes`);
      });
    }
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
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
        workletNodeRef.current = null;
      }
      useAudioWorkletRef.current = false;
      audioContextStartTimeRef.current = null;
      return;
    }

    const analyser = microphonePractice.analyser;
    const source = microphonePractice.microphone;
    const audioContext = microphonePractice.audioContext;
    
    if (!analyser || !source || !audioContext) {
      console.log('[Microphone Practice] No analyser/source/audioContext available yet - waiting for device setup');
      return;
    }

    // Don't re-initialize if AudioWorklet is already set up and working
    if (workletNodeRef.current && useAudioWorkletRef.current) {
      console.log('[Microphone Practice] AudioWorklet already initialized, skipping re-initialization');
      return;
    }

    // Check AudioWorklet support and try to use it
    const supportInfo = getAudioWorkletSupportInfo();
    const shouldUseAudioWorklet = supportInfo.supported && !supportInfo.needsFallback;

    if (shouldUseAudioWorklet && !workletNodeRef.current) {
      // Try to set up AudioWorklet
      setupAudioWorklet(audioContext, source).then((workletNode) => {
        if (workletNode) {
          workletNodeRef.current = workletNode;
          useAudioWorkletRef.current = true;
          console.log('[Microphone Practice] Using AudioWorklet for hit detection (low latency)');
          
          // Clear any existing interval (we don't need polling with AudioWorklet)
          if (levelCheckIntervalRef.current) {
            clearInterval(levelCheckIntervalRef.current);
            levelCheckIntervalRef.current = null;
            setMicrophoneLevelCheckInterval(null);
          }
        } else {
          // Fallback to AnalyserNode
          useAudioWorkletRef.current = false;
          setupAnalyserNodeFallback(analyser);
        }
      }).catch((error) => {
        console.error('[Microphone Practice] AudioWorklet setup failed, using fallback:', error);
        useAudioWorkletRef.current = false;
        setupAnalyserNodeFallback(analyser);
      });
    } else if (!useAudioWorkletRef.current) {
      // Use AnalyserNode fallback (only if not already using AudioWorklet)
      setupAnalyserNodeFallback(analyser);
    }

    function setupAnalyserNodeFallback(analyser: AnalyserNode) {
      // Don't re-setup if already running
      if (levelCheckIntervalRef.current) {
        console.log('[Microphone Practice] AnalyserNode fallback already running, skipping re-setup');
        return;
      }

      // Initialize analyser refs
      analyserRef.current = analyser;
      const bufferLength = analyser.fftSize;
      dataArrayRef.current = new Uint8Array(new ArrayBuffer(bufferLength));

      const supportInfo = getAudioWorkletSupportInfo();
      console.log('[Microphone Practice] Using AnalyserNode fallback for hit detection', { 
        bufferLength, 
        isPlaying,
        microphonePracticeEnabled,
        hasAnalyser: !!analyser,
        hasDataArray: !!dataArrayRef.current,
        reason: supportInfo.reason
      });

      // Start checking audio levels (polling approach)
      const interval = setInterval(() => {
        checkAudioLevel();
      }, CONSTANTS.AUDIO.LEVEL_CHECK_INTERVAL);

      levelCheckIntervalRef.current = interval;
      setMicrophoneLevelCheckInterval(interval);

      console.log('[Microphone Practice] Audio analysis interval started (fallback mode)');
    }

    return () => {
      // Only cleanup if practice is actually being disabled
      // Don't cleanup on every dependency change
      if (!microphonePracticeEnabled) {
        if (levelCheckIntervalRef.current) {
          clearInterval(levelCheckIntervalRef.current);
          levelCheckIntervalRef.current = null;
          setMicrophoneLevelCheckInterval(null);
          console.log('[Microphone Practice] Audio analysis interval stopped');
        }
        if (workletNodeRef.current) {
          workletNodeRef.current.disconnect();
          workletNodeRef.current = null;
          useAudioWorkletRef.current = false;
          audioContextStartTimeRef.current = null;
          console.log('[Microphone Practice] AudioWorklet disconnected');
        }
      }
    };
  }, [microphonePracticeEnabled, microphonePractice.analyser, microphonePractice.microphone, microphonePractice.audioContext]);

  return {
    // Expose functions if needed
  };
}

