/**
 * Hook for MIDI practice mode - handles MIDI input and accuracy tracking
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { ExpectedNote, PracticeHit, MIDINoteMap } from '@/types';
import { CONSTANTS } from '@/lib/utils/constants';
import { parseNumberList } from '@/lib/utils/patternUtils';

export function useMIDIPractice() {
  const isPlaying = useStore((state) => state.isPlaying);
  const midiPractice = useStore((state) => state.midiPractice);
  const midiPracticeEnabled = useStore((state) => state.midiPractice.enabled); // Subscribe to enabled separately
  const patterns = useStore((state) => state.patterns);
  const bpm = useStore((state) => state.bpm);
  const noteMap = useStore((state) => state.midiPractice.noteMap); // Get custom note map from store
  const setMIDIPracticeEnabled = useStore((state) => state.setMIDIPracticeEnabled);
  const setMIDIInput = useStore((state) => state.setMIDIInput);
  const setMIDIExpectedNotes = useStore((state) => state.setMIDIExpectedNotes);
  const addMIDIHit = useStore((state) => state.addMIDIHit);
  const markMIDINoteMatched = useStore((state) => state.markMIDINoteMatched);
  const setMIDIStartTime = useStore((state) => state.setMIDIStartTime);
  const playbackPosition = useStore((state) => state.playbackPosition);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const countInEnabled = useStore((state) => state.countInEnabled);
  const currentLoop = useStore((state) => state.currentLoop);
  
  // Type definition for MIDI message event
  interface MIDIMessageEvent extends Event {
    data: Uint8Array;
  }
  
  const midiHandlerRef = useRef<((event: Event) => void) | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasResetRef = useRef<boolean>(false);

  // Build expected notes from patterns
  const buildExpectedNotes = useCallback((): ExpectedNote[] => {
    if (patterns.length === 0) return [];
    
    const expectedNotes: ExpectedNote[] = [];
    const bpmMs = 60000 / bpm;
    
    let globalIndex = 0;
    let globalTimeOffset = 0; // Accumulate time across all patterns
    
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
      
      // Build notes for each repeat
      for (let r = 0; r < repeat; r++) {
        let noteIndexInPattern = 0;
        let patternTimeOffset = 0; // Time offset within this pattern repeat
        
        // Build notes from phrase
        phraseTokens.forEach((phraseVal) => {
          const notesInThisPhrase = phraseVal;
          
          for (let i = 0; i < notesInThisPhrase; i++) {
            const drumToken = drumTokens[noteIndexInPattern % drumTokens.length];
            const midiNote = noteMap[drumToken] || 0;
            
            if (midiNote > 0) {
              // Use globalTimeOffset + patternTimeOffset for absolute time
              expectedNotes.push({
                time: globalTimeOffset + patternTimeOffset,
                note: midiNote,
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
      
      // After processing this pattern, update globalTimeOffset for the next pattern
      // Calculate total duration of this pattern (all repeats)
      // Reuse phraseTokens from above (already parsed)
      const totalNotesInPattern = phraseTokens.reduce((sum, val) => sum + val, 0) * repeat;
      const patternDuration = totalNotesInPattern * noteDuration;
      globalTimeOffset += patternDuration;
    });
    
    return expectedNotes;
  }, [patterns, bpm]);

    // Get expected notes from store directly (not from closure)
  const expectedNotes = useStore((state) => state.midiPractice.expectedNotes);
  const accuracyWindow = useStore((state) => state.midiPractice.accuracyWindow);
  const latencyAdjustment = useStore((state) => state.midiPractice.latencyAdjustment);
  const countInActive = useStore((state) => state.midiPractice.countInActive);
  const startTime = useStore((state) => state.midiPractice.startTime);
  
  // Find closest expected note for a MIDI hit
  const findClosestExpectedNote = useCallback((
    midiNote: number,
    elapsedTime: number
  ): { note: number; expectedTime: number; index: number } | null => {
    // Use a wider search window (3x accuracy window) to find potential matches
    // This prevents missing notes that are slightly outside the window
    const searchWindow = accuracyWindow * 3;
    let closest: { note: number; expectedTime: number; index: number } | null = null;
    let minDistance = Infinity;

    expectedNotes.forEach((expected, index) => {
      // Skip already matched notes (but allow if within a small time of the note for double-hit detection)
      if (expected.matched) {
        // Still consider if it's very close (within 50ms) - might be a double-hit
        const timeDiff = Math.abs(expected.time - elapsedTime);
        if (timeDiff > 50) return;
      }
      
      const distance = Math.abs(expected.time - elapsedTime);
      
      // Check if note matches and is within search window
      // Also allow matching if the note is close even if already matched (for double-hits)
      if (expected.note === midiNote && distance < searchWindow && distance < minDistance) {
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

  // Handle MIDI message
  const handleMIDIMessage = useCallback((event: MIDIMessageEvent) => {
    if (!midiPracticeEnabled) {
      console.log('MIDI Practice: Practice not enabled');
      return;
    }
    
    if (!startTimeRef.current) {
      console.log('MIDI Practice: Start time not set yet');
      return;
    }
    
    if (countInActive) {
      console.log('MIDI Practice: Count-in still active, ignoring hits');
      return;
    }

    const [status, note, velocity] = event.data;
    
    // Match WordPress plugin: accept note-on messages (status 144-159) on any channel
    // This matches the calibration tool behavior
    if (status >= 144 && status <= 159 && velocity > 0) {
      console.log(`MIDI Practice: Received note-on, note=${note}, velocity=${velocity}, status=${status}`);
      const currentTime = performance.now();
      const elapsedTime = currentTime - startTimeRef.current;
      
      // Apply latency adjustment
      const adjustedElapsedTime = elapsedTime - latencyAdjustment;

      // Find closest expected note
      console.log(`MIDI Practice: Looking for note ${note} at time ${adjustedElapsedTime.toFixed(1)}ms`);
      console.log(`MIDI Practice: Start time: ${startTimeRef.current?.toFixed(1)}, current time: ${currentTime.toFixed(1)}, elapsed: ${elapsedTime.toFixed(1)}ms, adjusted: ${adjustedElapsedTime.toFixed(1)}ms`);
      console.log(`MIDI Practice: Expected notes (${expectedNotes.length}):`, expectedNotes.map(n => ({ note: n.note, time: typeof n.time === 'number' ? n.time : parseFloat(n.time as any), matched: n.matched })));
      const closestNote = findClosestExpectedNote(note, adjustedElapsedTime);
      console.log('MIDI Practice: Closest note found:', closestNote);
      if (closestNote) {
        console.log(`MIDI Practice: Match - note ${closestNote.note}, expected time ${closestNote.expectedTime}, actual time ${adjustedElapsedTime.toFixed(1)}ms`);
      } else {
        console.log(`MIDI Practice: No match found. Checking all notes...`);
        expectedNotes.forEach((expected, idx) => {
          const distance = Math.abs(expected.time - adjustedElapsedTime);
          const noteMatch = expected.note === note;
          console.log(`  Note ${idx}: note=${expected.note} (match=${noteMatch}), time=${expected.time}, distance=${distance.toFixed(1)}ms, matched=${expected.matched}`);
        });
      }
      if (closestNote) {
        const timingError = Math.abs(closestNote.expectedTime - adjustedElapsedTime);
        const rawTimingError = adjustedElapsedTime - closestNote.expectedTime;
        const isEarly = rawTimingError < 0;
        // Use accuracy window for perfect detection (more lenient than just PERFECT_HIT_THRESHOLD)
        const perfectThreshold = Math.min(CONSTANTS.TIMING.PERFECT_HIT_THRESHOLD, accuracyWindow / 4);
        const isPerfect = timingError <= perfectThreshold;
        
        // Check if within accuracy window for matching
        const isWithinWindow = timingError <= accuracyWindow;
        
        // Mark as matched only if within accuracy window
        if (isWithinWindow) {
          markMIDINoteMatched(closestNote.index);
        }
        
        // Always record the hit (even if outside window) so we can show yellow/red colors
        const hit: PracticeHit = {
          time: adjustedElapsedTime,
          note: note,
          expectedTime: closestNote.expectedTime,
          timingError: timingError,
          rawTimingError: rawTimingError,
          early: isEarly,
          perfect: isPerfect,
          matched: isWithinWindow,
        };
        
        // Add hit to actual hits (regardless of whether it's within window)
        addMIDIHit(hit);
        
      } else {
        // No matching note found
        
        // Still record the hit even if no match (for debugging)
        const hit: PracticeHit = {
          time: adjustedElapsedTime,
          note: note,
          expectedTime: 0,
          timingError: 999,
          rawTimingError: 0,
          early: false,
          perfect: false,
          matched: false,
        };
        addMIDIHit(hit);
      }
    }
  }, [midiPracticeEnabled, expectedNotes, accuracyWindow, latencyAdjustment, countInActive, findClosestExpectedNote, markMIDINoteMatched, addMIDIHit]);

  // Build expected notes when practice is enabled and patterns change
  // This rebuilds expected notes whenever patterns are added, removed, or updated
  // Also handles when practice mode is enabled externally
  useEffect(() => {
    console.log('[MIDI Practice] Build effect triggered: enabled=', midiPracticeEnabled, 'patterns=', patterns.length, 'expectedNotes=', expectedNotes.length, 'bpm=', bpm);
    
    if (!midiPracticeEnabled) {
      console.log('[MIDI Practice] Build effect: Practice not enabled, skipping');
      return;
    }

    if (patterns.length === 0) {
      console.log('[MIDI Practice] Build effect: No patterns, clearing expected notes');
      setMIDIExpectedNotes([]);
      return;
    }

    // Rebuild expected notes whenever patterns change (add/remove/update) or BPM changes
    // Create a hash of patterns to detect changes (simple approach: JSON stringify)
    // Note: This will rebuild even if patterns haven't changed, but it's safe and ensures accuracy
    console.log('[MIDI Practice] Building expected notes from', patterns.length, 'patterns');
    const notes = buildExpectedNotes();
    console.log('[MIDI Practice] Built expected notes:', notes.length, 'notes:', notes.map(n => ({ note: n.note, time: n.time.toFixed(1) })));
    setMIDIExpectedNotes(notes);
  }, [midiPracticeEnabled, patterns, bpm, buildExpectedNotes, setMIDIExpectedNotes]);

  // Setup MIDI handler when practice is enabled and playing
  useEffect(() => {
    console.log('[MIDI Practice] Handler setup effect: enabled=', midiPracticeEnabled, 'isPlaying=', isPlaying, 'input=', midiPractice.input ? midiPractice.input.name + ' (' + midiPractice.input.id + ')' : 'null');
    
    if (!midiPracticeEnabled) {
      console.log('[MIDI Practice] Handler not attached - practice not enabled');
      return;
    }
    
    if (!isPlaying) {
      console.log('[MIDI Practice] Handler not attached - not playing yet (will attach when playback starts)');
      return;
    }
    
    if (!midiPractice.input) {
      console.log('[MIDI Practice] Handler not attached - no MIDI input device set in store');
      return;
    }
    
    console.log('[MIDI Practice] All conditions met, attaching MIDI handler...');
    console.log('[MIDI Practice] Handler details:', {
      inputName: midiPractice.input?.name,
      inputId: midiPractice.input?.id,
      expectedNotes: expectedNotes.length,
      countInActive: countInActive,
      playbackPosition
    });

    // Register MIDI handler immediately (will be attached even during count-in)
    const handler = (event: Event) => {
      const midiEvent = event as MIDIMessageEvent;
      handleMIDIMessage(midiEvent);
    };
    midiHandlerRef.current = handler;
    midiPractice.input.onmidimessage = handler;
    console.log('[MIDI Practice] MIDI handler attached to:', midiPractice.input.name);

    // Reset start time and matched notes when playback starts (new loop or restart)
    // Reset when: playback starts (playbackPosition === null) OR loop changes (new loop)
    const shouldReset = (isPlaying && playbackPosition === null && !countInActive && !hasResetRef.current) || 
                        (isPlaying && currentLoop > 0 && !startTimeRef.current && !hasResetRef.current);
    
    if (shouldReset) {
      // Playback just started or new loop - reset timing for fresh practice session
      hasResetRef.current = true; // Mark as reset to prevent re-triggering
      startTimeRef.current = null;
      
      // Only reset store state if it's different to prevent infinite loops
      if (startTime !== null) {
        setMIDIStartTime(null);
      }
      
      // Reset matched notes for a fresh practice session (allow re-matching)
      // Only reset if some notes are matched (prevents unnecessary updates)
      if (expectedNotes.length > 0 && expectedNotes.some(note => note.matched)) {
        const resetNotes = expectedNotes.map(note => ({ ...note, matched: false }));
        setMIDIExpectedNotes(resetNotes);
        console.log('[MIDI Practice] Reset start time and matched notes - playback starting/looping');
      } else {
        console.log('[MIDI Practice] Reset start time - playback starting/looping');
      }
    }
    
    // Reset the hasResetRef when playback stops or position moves past first note
    if (!isPlaying || (playbackPosition !== null && playbackPosition >= 0 && !countInActive)) {
      hasResetRef.current = false;
    }
    
    // Set start time when first note is expected to play (like WordPress plugin)
    // WordPress plugin sets it when count-in completes: performance.now() - firstNoteTime
    // But also uses setTimeout with firstNoteTime when playback starts
    // We'll set it when count-in completes and first note is about to play
    if (expectedNotes.length > 0 && !startTimeRef.current && !countInActive && playbackPosition !== null && playbackPosition >= 0) {
      // Count-in just completed, first note is about to play
      const firstNoteTime = expectedNotes[0].time; // Usually 0
      
      // Set start time so that elapsedTime = 0 when first note plays
      // This means startTime should be performance.now() when first note actually plays
      // WordPress plugin uses setTimeout, but we can set it now and adjust for firstNoteTime
      const now = performance.now();
      const startTime = now - firstNoteTime; // Adjust for first note offset
      startTimeRef.current = startTime;
      setMIDIStartTime(startTime);
      console.log('MIDI Practice start time set:', startTime, 'first note time:', firstNoteTime, 'now:', now);
    }

    return () => {
      if (midiPractice.input && midiHandlerRef.current) {
        midiPractice.input.onmidimessage = null;
        midiHandlerRef.current = null;
      }
    };
  }, [midiPracticeEnabled, isPlaying, midiPractice.input, expectedNotes.length, countInActive, playbackPosition, countInEnabled, bpm, handleMIDIMessage, buildExpectedNotes, setMIDIExpectedNotes, setMIDIStartTime, expectedNotes, currentLoop]);

  // Reset when practice is disabled
  useEffect(() => {
    if (!midiPracticeEnabled) {
      startTimeRef.current = null;
      setMIDIStartTime(null);
      if (midiPractice.input && midiHandlerRef.current) {
        midiPractice.input.onmidimessage = null;
        midiHandlerRef.current = null;
      }
    }
  }, [midiPracticeEnabled, midiPractice.input, setMIDIStartTime]);

  return {
    // Handlers will be added as we build the component
  };
}

