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
    if (!midiRecording.enabled || !midiRecording.startTime) return;

    const messageEvent = event as MIDIMessageEvent;
    const [status, note, velocity] = messageEvent.data;
    const command = status & 0xf0;

    // Note on (velocity > 0) or Note off (velocity = 0)
    if (command === 0x90 || command === 0x80) {
      if (command === 0x90 && velocity > 0) {
        // Note on - apply latency adjustment
        const rawTime = performance.now() - midiRecording.startTime;
        const adjustedTime = rawTime - midiRecording.latencyAdjustment;
        
        addMIDIRecordingNote({
          time: adjustedTime,
          note: note,
          velocity: velocity
        });
      }
    }
  }, [midiRecording.enabled, midiRecording.startTime, midiRecording.latencyAdjustment, addMIDIRecordingNote]);

  // Start recording (called after count-in if enabled)
  const actuallyStartRecording = useCallback((input: MIDIInput) => {
    if (midiRecording.enabled) return;

    // Reset state
    clearMIDIRecordingNotes();
    const startTime = performance.now();
    setMIDIRecordingStartTime(startTime);
    
    setMIDIRecordingInput(input);
    setMIDIRecordingEnabled(true);

    // Set up MIDI handler
    midiHandlerRef.current = handleMIDIMessage;
    input.addEventListener('midimessage', handleMIDIMessage);
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
    if (!midiRecording.enabled) return;

    setMIDIRecordingEnabled(false);
    setMIDIRecordingStartTime(null);

    // Remove MIDI handler
    if (midiRecording.input && midiHandlerRef.current) {
      midiRecording.input.removeEventListener('midimessage', midiHandlerRef.current);
      midiHandlerRef.current = null;
    }

    // Return recorded notes
    const notes = [...midiRecording.notes];
    clearMIDIRecordingNotes();

    return notes;
  }, [midiRecording.enabled, midiRecording.input, midiRecording.notes, setMIDIRecordingEnabled, setMIDIRecordingStartTime, clearMIDIRecordingNotes]);

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

