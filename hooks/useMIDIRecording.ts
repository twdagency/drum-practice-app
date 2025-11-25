/**
 * Hook for MIDI recording - records MIDI input and converts to patterns
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';

export function useMIDIRecording() {
  const midiRecording = useStore((state) => state.midiRecording);
  const setMIDIRecordingEnabled = useStore((state) => state.setMIDIRecordingEnabled);
  const setMIDIRecordingInput = useStore((state) => state.setMIDIRecordingInput);
  const setMIDIRecordingStartTime = useStore((state) => state.setMIDIRecordingStartTime);
  const addMIDIRecordingNote = useStore((state) => state.addMIDIRecordingNote);
  const clearMIDIRecordingNotes = useStore((state) => state.clearMIDIRecordingNotes);
  
  const midiHandlerRef = useRef<((event: Event) => void) | null>(null);

  // Handle MIDI messages
  const handleMIDIMessage = useCallback((event: Event) => {
    console.log('[useMIDIRecording] handleMIDIMessage called with event:', event);
    
    // Get fresh state from store on each message
    const currentState = useStore.getState().midiRecording;
    
    console.log('[useMIDIRecording] Current state:', {
      enabled: currentState.enabled,
      startTime: currentState.startTime,
      hasInput: !!currentState.input
    });
    
    if (!currentState.enabled || !currentState.startTime) {
      console.log('[useMIDIRecording] Not recording, ignoring message');
      return; // Silently ignore if not recording
    }

    const messageEvent = event as MIDIMessageEvent;
    console.log('[useMIDIRecording] Message event:', {
      hasData: !!messageEvent.data,
      dataLength: messageEvent.data?.length,
      data: messageEvent.data
    });
    
    if (!messageEvent.data || messageEvent.data.length < 1) {
      console.log('[useMIDIRecording] No data in message, ignoring');
      return; // Silently ignore invalid messages
    }
    
    const status = messageEvent.data[0];
    console.log('[useMIDIRecording] Status byte:', status, `(0x${status.toString(16)})`);
    
    // Filter out MIDI system messages (0xF0-0xFF) - these are timing clocks, active sensing, etc.
    // We only care about note messages (0x80-0x9F)
    if (status >= 0xF0) {
      console.log('[useMIDIRecording] System message, ignoring');
      return; // Silently ignore system messages (timing clock, active sensing, etc.)
    }
    
    // Check if we have enough data for a note message
    if (messageEvent.data.length < 3) {
      console.log('[useMIDIRecording] Incomplete message, ignoring');
      return; // Silently ignore incomplete messages
    }
    
    const [statusByte, note, velocity] = messageEvent.data;
    const command = statusByte & 0xf0;
    
    console.log('[useMIDIRecording] Parsed message:', {
      statusByte,
      command: `0x${command.toString(16)}`,
      note,
      velocity
    });

    // Only process note-on (0x90) and note-off (0x80) messages
    if (command === 0x90 || command === 0x80) {
      // Accept any velocity > 0 (no threshold - even very light hits should register)
      // Note: Some MIDI devices send note-on with velocity 0 as note-off, so we check velocity > 0
      if (command === 0x90 && velocity > 0) {
        // Note on - apply latency adjustment
        const rawTime = performance.now() - currentState.startTime;
        const adjustedTime = rawTime - currentState.latencyAdjustment;
        
        // Filter out duplicate notes that are too close together (likely double-triggers)
        // Check if we already have a note with the same MIDI note number within a very short time window
        const duplicateWindow = 10; // 10ms window to filter double-triggers
        const existingNotes = currentState.notes;
        const isDuplicate = existingNotes.some(existingNote => 
          existingNote.note === note && 
          Math.abs(existingNote.time - adjustedTime) < duplicateWindow
        );
        
        if (isDuplicate) {
          console.log(`[useMIDIRecording] Filtered duplicate note ${note} at ${adjustedTime.toFixed(2)}ms (within ${duplicateWindow}ms of previous)`);
          return; // Skip duplicate note
        }
        
        // Log all notes for debugging (but reduce spam for fast notes)
        if (velocity < 10) {
          console.log(`[useMIDIRecording] Low velocity note ${note} received, velocity: ${velocity}, time: ${adjustedTime.toFixed(2)}ms`);
        }
        
        addMIDIRecordingNote({
          time: adjustedTime,
          note: note,
          velocity: velocity
        });
      } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
        // Note-off - we don't need to record these, just ignore
        // Some devices send note-on with velocity 0 as note-off
      }
    } else {
      console.log('[useMIDIRecording] Not a note message, ignoring');
    }
  }, [addMIDIRecordingNote]);

  // Start recording (called after count-in if enabled)
  const actuallyStartRecording = useCallback((input: MIDIInput) => {
    if (midiRecording.enabled) {
      console.warn('[useMIDIRecording] Already recording, skipping start');
      return;
    }

    // Reset state
    clearMIDIRecordingNotes();
    const startTime = performance.now();
    setMIDIRecordingStartTime(startTime);
    
    setMIDIRecordingInput(input);
    setMIDIRecordingEnabled(true);

    // Set up MIDI handler - use both methods for reliability
    midiHandlerRef.current = handleMIDIMessage;
    
    // Remove any existing handlers first - CRITICAL: only one handler can be active
    console.log('[useMIDIRecording] Clearing any existing handlers...');
    if (input.onmidimessage) {
      console.log('[useMIDIRecording] Removing existing onmidimessage handler');
      input.onmidimessage = null;
    }
    
    // Clear any event listeners from other components (calibration, etc.)
    if ((input as any).__midiHandler) {
      console.log('[useMIDIRecording] Removing existing event listener from other component');
      if (input.removeEventListener) {
        input.removeEventListener('midimessage', (input as any).__midiHandler);
      }
      (input as any).__midiHandler = null;
    }
    
    // Also try to remove our own previous handler if it exists
    if (input.removeEventListener && midiHandlerRef.current) {
      try {
        input.removeEventListener('midimessage', midiHandlerRef.current);
      } catch (e) {
        // Ignore if handler wasn't attached
      }
    }
    
    // Explicitly open the connection if it's disconnected
    if (input.state === 'disconnected') {
      console.log('[useMIDIRecording] Input is disconnected, attempting to open...');
      if (typeof (input as any).open === 'function') {
        (input as any).open().then(() => {
          console.log('[useMIDIRecording] Input opened successfully');
        }).catch((err: any) => {
          console.error('[useMIDIRecording] Failed to open input:', err);
        });
      }
    }
    
    // Primary: Use onmidimessage (this also opens the connection)
    // Set this first as it opens the connection
    const handler = (e: any) => {
      console.log('[useMIDIRecording] onmidimessage handler called with event:', e);
      handleMIDIMessage(e);
    };
    input.onmidimessage = handler;
    console.log('[useMIDIRecording] onmidimessage handler set, input state:', input.state);
    
    // Backup: Use addEventListener and store reference
    if (input.addEventListener) {
      input.addEventListener('midimessage', handleMIDIMessage);
      (input as any).__midiHandler = handleMIDIMessage; // Store for cleanup
      console.log('[useMIDIRecording] MIDI handler attached via addEventListener');
    }
    
    // Test if we can receive messages - log input properties
    console.log('[useMIDIRecording] Input details:', {
      name: input.name,
      manufacturer: (input as any).manufacturer,
      state: input.state,
      type: input.type,
      hasOnmidimessage: typeof input.onmidimessage === 'function',
      hasAddEventListener: typeof input.addEventListener === 'function'
    });
    
    // Verify connection is open
    if (input.state === 'disconnected') {
      console.warn('[useMIDIRecording] Input still disconnected after setting handler');
    }
    
    console.log('[useMIDIRecording] Recording started, input:', input.name, 'state:', input.state, 'enabled:', true);
  }, [midiRecording.enabled, handleMIDIMessage, setMIDIRecordingInput, setMIDIRecordingEnabled, setMIDIRecordingStartTime, clearMIDIRecordingNotes]);

  // Start recording (handles count-in if enabled)
  const startRecording = useCallback(async (input: MIDIInput, countInEnabled?: boolean, countInBeats?: number, metronomeCallback?: (isAccent: boolean) => void) => {
    if (midiRecording.enabled) return;

    setMIDIRecordingInput(input);

    // If count-in is enabled, wait for it before actually starting
    if (countInEnabled && countInBeats && countInBeats > 0) {
      // Count-in will be handled by the component
      // For now, just start recording immediately
      // The component will handle the count-in UI
      actuallyStartRecording(input);
    } else {
      actuallyStartRecording(input);
    }
  }, [midiRecording.enabled, actuallyStartRecording, setMIDIRecordingInput]);

  // Stop recording
  const stopRecording = useCallback(() => {
    // Get fresh state
    const currentState = useStore.getState().midiRecording;
    
    if (!currentState.enabled) {
      console.log('[useMIDIRecording] stopRecording called but not enabled');
      return [];
    }

    console.log('[useMIDIRecording] Stopping recording, notes count:', currentState.notes.length);

    // Get notes BEFORE clearing
    const notes = [...currentState.notes];
    
    setMIDIRecordingEnabled(false);
    setMIDIRecordingStartTime(null);

    // Remove MIDI handler
    if (currentState.input && midiHandlerRef.current) {
      currentState.input.removeEventListener('midimessage', midiHandlerRef.current);
      // Also clear onmidimessage
      if (currentState.input.onmidimessage) {
        currentState.input.onmidimessage = null;
      }
      midiHandlerRef.current = null;
    }

    // Clear notes AFTER getting them
    clearMIDIRecordingNotes();

    console.log('[useMIDIRecording] Returning notes:', notes.length);
    return notes;
  }, [setMIDIRecordingEnabled, setMIDIRecordingStartTime, clearMIDIRecordingNotes]);

  // Clear recording
  const clearRecording = useCallback(() => {
    clearMIDIRecordingNotes();
    setMIDIRecordingStartTime(null);
  }, [clearMIDIRecordingNotes, setMIDIRecordingStartTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (midiRecording.input && midiHandlerRef.current) {
        midiRecording.input.removeEventListener('midimessage', midiHandlerRef.current);
      }
    };
  }, [midiRecording.input]);

  return {
    startRecording,
    actuallyStartRecording,
    stopRecording,
    clearRecording,
    notes: midiRecording.notes,
    isRecording: midiRecording.enabled,
  };
}

// Type definition for MIDI message event
interface MIDIMessageEvent extends Event {
  data: Uint8Array;
}

