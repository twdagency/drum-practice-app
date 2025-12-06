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
      
      // Calculate duration of one pattern repeat (before the repeat loop)
      const notesPerRepeat = phraseTokens.reduce((sum, val) => sum + val, 0);
      const oneRepeatDuration = notesPerRepeat * noteDuration;
      
      // Build notes for each repeat
      for (let r = 0; r < repeat; r++) {
        let noteIndexInPattern = 0;
        // Start patternTimeOffset at the beginning of this repeat
        // Each repeat starts after the previous repeat
        const repeatTimeOffset = r * oneRepeatDuration;
        let patternTimeOffset = 0; // Time offset within this pattern repeat
        
        // Build notes from phrase
        phraseTokens.forEach((phraseVal) => {
          const notesInThisPhrase = phraseVal;
          
          for (let i = 0; i < notesInThisPhrase; i++) {
            const drumToken = drumTokens[noteIndexInPattern % drumTokens.length];
            const midiNote = noteMap[drumToken] || 0;
            
            if (midiNote > 0) {
              // Use globalTimeOffset + repeatTimeOffset + patternTimeOffset for absolute time
              expectedNotes.push({
                time: globalTimeOffset + repeatTimeOffset + patternTimeOffset,
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
  
  // Handle MIDI message
  const handleMIDIMessage = useCallback((event: MIDIMessageEvent) => {
    // Read current state directly to avoid stale closures
    const storeState = useStore.getState();
    const currentIsPlaying = storeState.isPlaying;
    const currentCountInActive = storeState.midiPractice.countInActive;
    const currentExpectedNotes = storeState.midiPractice.expectedNotes;
    const currentAccuracyWindow = storeState.midiPractice.accuracyWindow;
    const currentLatencyAdjustment = storeState.midiPractice.latencyAdjustment;
    
    if (!midiPracticeEnabled) {
      return;
    }
    
    const [status, note, velocity] = event.data;
    
    // Match WordPress plugin: accept note-on messages (status 144-159) on any channel
    if (status >= 144 && status <= 159 && velocity > 0) {
      console.log(`[MIDI Practice] Received note-on: note=${note}, velocity=${velocity}`);
      
      if (!startTimeRef.current) {
        console.log('[MIDI Practice] Start time not set yet - waiting for playback');
        return;
      }
      
      if (currentCountInActive) {
        console.log('[MIDI Practice] Count-in active, ignoring hit');
        return;
      }
      
      if (!currentIsPlaying) {
        console.log('[MIDI Practice] Not playing, ignoring hit');
        return;
      }

      const currentTime = performance.now();
      const elapsedTime = currentTime - startTimeRef.current;
      const adjustedElapsedTime = elapsedTime - currentLatencyAdjustment;

      // Find closest expected note
      const searchWindow = currentAccuracyWindow * 3;
      let closest: { note: number; expectedTime: number; index: number } | null = null;
      let minDistance = Infinity;

      currentExpectedNotes.forEach((expected, index) => {
        if (expected.matched) {
          const timeDiff = Math.abs(expected.time - adjustedElapsedTime);
          if (timeDiff > 50) return;
        }
        
        const distance = Math.abs(expected.time - adjustedElapsedTime);
        if (expected.note === note && distance < searchWindow && distance < minDistance) {
          minDistance = distance;
          closest = {
            note: expected.note,
            expectedTime: expected.time,
            index: index,
          };
        }
      });
      
      // Handle EXTRA HITS - hits that don't match any expected note
      if (!closest) {
        console.log(`[MIDI Practice] Extra hit: note=${note} at ${adjustedElapsedTime.toFixed(1)}ms (no match found)`);
        
        const extraHit: PracticeHit = {
          time: adjustedElapsedTime,
          note: note,
          expectedTime: -1,
          timingError: Infinity,
          rawTimingError: 0,
          early: false,
          perfect: false,
          matched: false,
          velocity: velocity,
          isExtraHit: true,
        };
        addMIDIHit(extraHit);
        return;
      }
      
      const closestNote = closest;
      const timingError = Math.abs(closestNote.expectedTime - adjustedElapsedTime);
      const rawTimingError = adjustedElapsedTime - closestNote.expectedTime;
      const isEarly = rawTimingError < 0;
      const perfectThreshold = Math.min(CONSTANTS.TIMING.PERFECT_HIT_THRESHOLD, currentAccuracyWindow / 4);
      const isPerfect = timingError <= perfectThreshold;
      const isWithinWindow = timingError <= currentAccuracyWindow;
      
      console.log(`[MIDI Practice] Hit: note=${note}, expected=${closestNote.expectedTime.toFixed(1)}ms, actual=${adjustedElapsedTime.toFixed(1)}ms, error=${rawTimingError.toFixed(1)}ms, matched=${isWithinWindow}`);
      
      if (isWithinWindow) {
        markMIDINoteMatched(closestNote.index);
      }
      
      const hit: PracticeHit = {
        time: adjustedElapsedTime,
        note: note,
        expectedTime: closestNote.expectedTime,
        timingError: timingError,
        rawTimingError: rawTimingError,
        early: isEarly,
        perfect: isPerfect,
        matched: isWithinWindow,
        velocity: velocity,
        isExtraHit: false,
      };
      
      addMIDIHit(hit);
    }
  }, [midiPracticeEnabled, markMIDINoteMatched, addMIDIHit]);

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

  // Setup MIDI handler when practice is enabled (attach immediately, like microphone)
  // The handler itself checks isPlaying before processing hits
  useEffect(() => {
    console.log('[MIDI Practice] Handler setup effect: enabled=', midiPracticeEnabled, 'input=', midiPractice.input ? midiPractice.input.name + ' (' + midiPractice.input.id + ')' : 'null');
    
    if (!midiPracticeEnabled) {
      console.log('[MIDI Practice] Handler not attached - practice not enabled');
      return;
    }
    
    if (!midiPractice.input) {
      console.log('[MIDI Practice] Handler not attached - no MIDI input device set in store');
      return;
    }
    
    console.log('[MIDI Practice] Attaching MIDI handler to:', midiPractice.input.name);

    // Register MIDI handler immediately (like microphone practice)
    // The handler checks isPlaying internally before processing hits
    const handler = (event: Event) => {
      const midiEvent = event as MIDIMessageEvent;
      handleMIDIMessage(midiEvent);
    };
    midiHandlerRef.current = handler;
    midiPractice.input.onmidimessage = handler;
    console.log('[MIDI Practice] MIDI handler attached successfully');

    return () => {
      if (midiPractice.input && midiHandlerRef.current) {
        console.log('[MIDI Practice] Detaching MIDI handler');
        midiPractice.input.onmidimessage = null;
        midiHandlerRef.current = null;
      }
    };
  }, [midiPracticeEnabled, midiPractice.input, handleMIDIMessage]);

  // Separate effect for managing start time and resets during playback
  useEffect(() => {
    if (!midiPracticeEnabled || !isPlaying) {
      return;
    }

    // Reset start time and matched notes when playback starts (new loop or restart)
    const shouldReset = (playbackPosition === null && !countInActive && !hasResetRef.current) || 
                        (currentLoop > 0 && !startTimeRef.current && !hasResetRef.current);
    
    if (shouldReset) {
      hasResetRef.current = true;
      startTimeRef.current = null;
      
      if (startTime !== null) {
        setMIDIStartTime(null);
      }
      
      if (expectedNotes.length > 0 && expectedNotes.some(note => note.matched)) {
        const resetNotes = expectedNotes.map(note => ({ ...note, matched: false }));
        setMIDIExpectedNotes(resetNotes);
        console.log('[MIDI Practice] Reset matched notes for new playback');
      }
    }
    
    // Reset hasResetRef when position moves
    if (playbackPosition !== null && playbackPosition >= 0 && !countInActive) {
      hasResetRef.current = false;
    }
    
    // Set start time when first note plays
    if (expectedNotes.length > 0 && !startTimeRef.current && !countInActive && playbackPosition !== null && playbackPosition >= 0) {
      const firstNoteTime = expectedNotes[0].time;
      const now = performance.now();
      const newStartTime = now - firstNoteTime;
      startTimeRef.current = newStartTime;
      setMIDIStartTime(newStartTime);
      console.log('[MIDI Practice] Start time set:', newStartTime.toFixed(1), 'ms');
    }
  }, [midiPracticeEnabled, isPlaying, playbackPosition, countInActive, expectedNotes, currentLoop, startTime, setMIDIStartTime, setMIDIExpectedNotes]);

  // Reset hasResetRef when playback stops
  useEffect(() => {
    if (!isPlaying) {
      hasResetRef.current = false;
    }
  }, [isPlaying]);

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

