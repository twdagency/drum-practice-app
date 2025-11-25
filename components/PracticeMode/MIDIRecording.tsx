/**
 * MIDI Recording Component
 * Modal for recording MIDI input and converting to patterns
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { useMIDIDevices } from '@/hooks/useMIDIDevices';
import { useMIDIRecording } from '@/hooks/useMIDIRecording';
import { convertMIDIRecordingToPattern } from '@/lib/utils/midiRecordingUtils';
import { startCountIn, stopCountIn, startMetronome, stopMetronome } from '@/lib/utils/midiRecordingManager';
import { MIDICalibration } from './MIDICalibration';
import { CONSTANTS } from '@/lib/utils/constants';
import { useToast } from '@/components/shared/Toast';

interface MIDIRecordingProps {
  onClose: () => void;
}

export function MIDIRecording({ onClose }: MIDIRecordingProps) {
  const { showToast } = useToast();
  const midiRecording = useStore((state) => state.midiRecording);
  const bpm = useStore((state) => state.bpm);
  const addPattern = useStore((state) => state.addPattern);
  const clearPatterns = useStore((state) => state.clearPatterns);
  const setMIDIRecordingLatencyAdjustment = useStore((state) => state.setMIDIRecordingLatencyAdjustment);
  const setMIDIRecordingInput = useStore((state) => state.setMIDIRecordingInput);
  const resetMIDIRecording = useStore((state) => state.resetMIDIRecording);
  const saveToHistory = useStore((state) => state.saveToHistory);

  const { devices, access, error, isSupported, refreshDevices } = useMIDIDevices();
  const { actuallyStartRecording: actuallyStartRecordingHook, stopRecording, clearRecording, isRecording } = useMIDIRecording();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [timeSignature, setTimeSignature] = useState<string>('4/4');
  const [countInEnabled, setCountInEnabled] = useState<boolean>(true);
  const [countInBeats, setCountInBeats] = useState<number>(4);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(true);
  const [latencyAdjustment, setLatencyAdjustment] = useState<number>(0);
  const [recordingTime, setRecordingTime] = useState<string>('00:00');
  const [countInActive, setCountInActive] = useState<boolean>(false);
  const [currentCountInBeat, setCurrentCountInBeat] = useState<number>(1);
  const [showCalibration, setShowCalibration] = useState<boolean>(false);
  const [barsToRecord, setBarsToRecord] = useState<number | null>(null); // null = record until stopped

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Load persisted settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('dpgen_midi_recording_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSelectedDeviceId(parsed.deviceId || '');
          setTimeSignature(parsed.timeSignature || '4/4');
          setCountInEnabled(parsed.countInEnabled !== false);
          setCountInBeats(parsed.countInBeats || 4);
          setMetronomeEnabled(parsed.metronomeEnabled !== false);
          setLatencyAdjustment(parsed.latencyAdjustment || 0);
          setBarsToRecord(parsed.barsToRecord !== undefined ? parsed.barsToRecord : null);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Track if we're updating from store to prevent loops
  const updatingFromStoreRef = useRef(false);
  
  // Update latency adjustment in store when local state changes (but only if different and not from store update)
  useEffect(() => {
    if (updatingFromStoreRef.current) {
      updatingFromStoreRef.current = false;
      return; // Skip if this update came from store
    }
    
    if (midiRecording.latencyAdjustment !== latencyAdjustment) {
      setMIDIRecordingLatencyAdjustment(latencyAdjustment);
    }
  }, [latencyAdjustment, setMIDIRecordingLatencyAdjustment]);

  // Sync local state with store when store changes (e.g., from calibration)
  // Only update if different to prevent loops
  useEffect(() => {
    if (midiRecording.latencyAdjustment !== latencyAdjustment) {
      updatingFromStoreRef.current = true;
      setLatencyAdjustment(midiRecording.latencyAdjustment);
    }
  }, [midiRecording.latencyAdjustment]); // Only depend on store value, not local state

  // Auto-select device if available
  useEffect(() => {
    if (selectedDeviceId && devices.length > 0 && access) {
      const deviceExists = devices.some(d => d.id === selectedDeviceId);
      if (deviceExists) {
        const input = access.inputs.get(selectedDeviceId);
        if (input) {
          setMIDIRecordingInput(input);
        }
      }
    }
  }, [selectedDeviceId, devices, access, setMIDIRecordingInput]);

  // Handle device selection
  const handleDeviceSelect = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    
    // Persist device selection
    if (typeof window !== 'undefined') {
      try {
        const existing = window.localStorage.getItem('dpgen_midi_recording_settings');
        const settings = existing ? JSON.parse(existing) : {};
        settings.deviceId = deviceId;
        window.localStorage.setItem('dpgen_midi_recording_settings', JSON.stringify(settings));
      } catch (e) {
        console.error('Failed to save device selection:', e);
      }
    }
    
    if (!access) {
      await refreshDevices();
      // After refresh, access should be available via the hook
      // Try to get the device from the updated access
      const updatedAccess = await navigator.requestMIDIAccess?.({ sysex: false }).catch(() => null);
      if (updatedAccess) {
        const input = updatedAccess.inputs.get(deviceId);
        if (input) {
          setMIDIRecordingInput(input);
        }
      }
    } else {
      const input = access.inputs.get(deviceId);
      if (input) {
        setMIDIRecordingInput(input);
      }
    }
  };

  // Start recording
  const handleStartRecording = async () => {
    if (!selectedDeviceId) {
      showToast('Please select a MIDI device first.', 'error');
      return;
    }

    if (!access) {
      await refreshDevices();
      // After refresh, access should be available via the hook
      // Try to get the device from the updated access
      const updatedAccess = await navigator.requestMIDIAccess?.({ sysex: false }).catch(() => null);
      if (!updatedAccess) {
        showToast('Failed to access MIDI devices.', 'error');
        return;
      }
      const input = updatedAccess.inputs.get(selectedDeviceId);
      if (!input) {
        showToast('MIDI device not found. Please refresh the device list.', 'error');
        return;
      }
      // Don't start yet - we'll handle count-in first
      setMIDIRecordingInput(input);
    } else {
      const input = access.inputs.get(selectedDeviceId);
      if (!input) {
        showToast('MIDI device not found. Please refresh the device list.', 'error');
        return;
      }
      // Don't start yet - we'll handle count-in first
      setMIDIRecordingInput(input);
    }

    // Save settings
    if (typeof window !== 'undefined') {
      try {
        const settings = {
          deviceId: selectedDeviceId,
          timeSignature,
          countInEnabled,
          countInBeats,
          metronomeEnabled,
          latencyAdjustment,
          barsToRecord,
        };
        window.localStorage.setItem('dpgen_midi_recording_settings', JSON.stringify(settings));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    }

    // Handle count-in if enabled
    if (countInEnabled) {
      setCountInActive(true);
      setCurrentCountInBeat(1); // Start at beat 1
      
      startCountIn(
        bpm,
        countInBeats,
        () => {
          // Count-in complete, start actual recording
          setCountInActive(false);
          if (metronomeEnabled) {
            // Calculate total beats for metronome based on bars to record
            const [numerator] = timeSignature.split('/').map(Number);
            const beatsPerBar = numerator;
            const totalBeats = barsToRecord !== null ? barsToRecord * beatsPerBar : undefined;
            startMetronome(bpm, undefined, totalBeats);
          }
          // Now actually start recording
          actuallyStartRecording();
        },
        (beat) => {
          setCurrentCountInBeat(beat);
        }
      );
    } else {
      if (metronomeEnabled) {
        // Calculate total beats for metronome based on bars to record
        const [numerator] = timeSignature.split('/').map(Number);
        const beatsPerBar = numerator;
        const totalBeats = barsToRecord !== null ? barsToRecord * beatsPerBar : undefined;
        startMetronome(bpm, undefined, totalBeats);
      }
      // Start recording immediately
      actuallyStartRecording();
    }
  };

  // Actually start recording (after count-in)
  const actuallyStartRecording = () => {
    if (!midiRecording.input) {
      console.error('[MIDI Recording] No input device available');
      return;
    }
    
    // Clear any existing handlers from calibration or other sources
    // This is critical - only one handler can be active at a time
    if (midiRecording.input.onmidimessage) {
      console.log('[MIDI Recording] Clearing existing onmidimessage handler');
      midiRecording.input.onmidimessage = null;
    }
    
    // Also clear any event listeners
    if ((midiRecording.input as any).__midiHandler) {
      console.log('[MIDI Recording] Removing existing event listener');
      midiRecording.input.removeEventListener('midimessage', (midiRecording.input as any).__midiHandler);
      (midiRecording.input as any).__midiHandler = null;
    }
    
    // Ensure input is open/connected - the hook will set the handler which opens it
    if (midiRecording.input.state === 'disconnected') {
      console.warn('[MIDI Recording] Input is disconnected, hook will attempt to open it');
    }
    
    // Start recording using the hook - this will set up the handler
    actuallyStartRecordingHook(midiRecording.input);
    
    console.log('[MIDI Recording] Started recording, input:', midiRecording.input.name, 'state:', midiRecording.input.state);
    
    startTimeRef.current = performance.now();
    
    // Start timer
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((performance.now() - startTimeRef.current) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setRecordingTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        
        // Auto-stop if barsToRecord is set - get fresh state from store
        const currentState = useStore.getState().midiRecording;
        if (barsToRecord !== null && currentState.enabled) {
          const [numerator, denominator] = timeSignature.split('/').map(Number);
          const beatsPerBar = numerator;
          const msPerBeat = 60000 / bpm;
          const msPerBar = msPerBeat * beatsPerBar;
          const totalMs = barsToRecord * msPerBar;
          const elapsedMs = performance.now() - startTimeRef.current;
          
          // Only log every 500ms to avoid spam
          if (Math.floor(elapsedMs / 500) !== Math.floor((elapsedMs - 50) / 500)) {
            console.log(`[MIDI Recording] Auto-stop check: elapsed=${elapsedMs.toFixed(0)}ms, target=${totalMs.toFixed(0)}ms, bars=${barsToRecord}, enabled=${currentState.enabled}`);
          }
          
          if (elapsedMs >= totalMs) {
            console.log(`[MIDI Recording] Auto-stopping after ${barsToRecord} bars (${totalMs.toFixed(0)}ms elapsed)`);
            // Clear interval first to prevent multiple calls
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            handleStopRecording();
            return; // Exit early after stopping
          }
        }
      }
    }, 50); // Check more frequently (every 50ms instead of 100ms) for more accurate auto-stop
  };

  // Stop recording
  const handleStopRecording = () => {
    // Stop count-in if active
    stopCountIn();
    setCountInActive(false);

    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop metronome
    stopMetronome();

    // Get recorded notes BEFORE clearing - the hook returns notes then clears
    // But let's also get them directly from store to be safe
    const recordedNotesFromHook = stopRecording();
    const recordedNotesFromStore = [...midiRecording.notes];
    
    // Use whichever has notes (hook should have them, but store is backup)
    const recordedNotes = recordedNotesFromHook && recordedNotesFromHook.length > 0 
      ? recordedNotesFromHook 
      : recordedNotesFromStore;
    
    console.log('[MIDI Recording] Stopped recording:', {
      notesFromHook: recordedNotesFromHook?.length || 0,
      notesFromStore: recordedNotesFromStore.length,
      finalNotes: recordedNotes.length
    });

    // Convert to patterns (subdivision will be auto-detected)
    // Get custom MIDI note map from store
    const midiNoteMap = useStore.getState().midiPractice.noteMap;
    
    if (recordedNotes && recordedNotes.length > 0) {
      // If barsToRecord is set, limit the pattern to exactly that many bars
      const maxBars = barsToRecord !== null ? barsToRecord : undefined;
      const patterns = convertMIDIRecordingToPattern(recordedNotes, timeSignature, undefined, bpm, midiNoteMap, maxBars);
      
      if (patterns.length > 0) {
        // Add new patterns to existing ones (don't replace)
        patterns.forEach(pattern => {
          addPattern(pattern);
        });
        saveToHistory();
        
        showToast(`${patterns.length} pattern${patterns.length > 1 ? 's' : ''} created from ${recordedNotes.length} MIDI notes!`, 'success');
      } else {
        showToast('No patterns could be created from the recording.', 'error');
      }
    } else {
      showToast('No notes recorded.', 'error');
    }

    // Reset UI
    setRecordingTime('00:00');
    // Don't call clearRecording() here - stopRecording() already cleared them
  };

  // Clear recording
  const handleClearRecording = () => {
    clearRecording();
    setRecordingTime('00:00');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      stopCountIn();
      stopMetronome();
    };
  }, []);

  return (
    <div
      className="dpgen-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        className="dpgen-modal"
        style={{
          background: 'var(--dpgen-card)',
          borderRadius: 'var(--dpgen-radius)',
          padding: '0',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 'var(--dpgen-shadow)',
          border: '1px solid var(--dpgen-border)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="dpgen-modal__header" 
          style={{ 
            padding: '1.5rem', 
            borderBottom: '1px solid var(--dpgen-border)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}
        >
          <h2 className="dpgen-modal__title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            <i className="fas fa-microphone" style={{ marginRight: '0.5rem' }} /> Create Pattern from MIDI
          </h2>
          <button
            type="button"
            className="dpgen-modal__close"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--dpgen-text)' }}
          >
            <i className="fas fa-times" />
          </button>
        </div>
        
        <div className="dpgen-modal__body" style={{ padding: '1.5rem', flex: 1, overflow: 'auto' }}>
          {!isSupported && (
            <div className="dpgen-alert dpgen-alert--error" style={{ marginBottom: '1rem' }}>
              MIDI is not supported in this browser.
            </div>
          )}

          {error && (
            <div className="dpgen-alert dpgen-alert--error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* Main Settings Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            {/* Device Selection */}
            <div className="dpgen-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>
                MIDI Input Device
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="dpgen-select"
                  value={selectedDeviceId}
                  onChange={(e) => handleDeviceSelect(e.target.value)}
                  disabled={isRecording}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Select a device --</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="dpgen-button dpgen-button--subtle"
                  onClick={refreshDevices}
                  disabled={isRecording}
                  title="Refresh device list"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  <i className="fas fa-sync-alt" />
                </button>
              </div>
            </div>

            {/* Time Signature */}
            <div className="dpgen-form-group">
              <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>
                Time Signature
              </label>
              <input
                type="text"
                className="dpgen-input"
                value={timeSignature}
                onChange={(e) => setTimeSignature(e.target.value)}
                disabled={isRecording}
                placeholder="4/4"
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
                Subdivision will be auto-detected from your playing
              </div>
            </div>

            {/* Latency Adjustment */}
            <div className="dpgen-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="dpgen-label" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  Latency Adjustment
                </label>
                <button
                  onClick={() => setShowCalibration(true)}
                  disabled={isRecording}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--dpgen-border)',
                    background: 'var(--dpgen-bg)',
                    color: 'var(--dpgen-text)',
                    cursor: isRecording ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    opacity: isRecording ? 0.5 : 1,
                  }}
                  title="Open calibration tool"
                >
                  <i className="fas fa-sliders-h" style={{ marginRight: '0.25rem' }} />
                  Calibrate
                </button>
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--dpgen-text)' }}>
                {latencyAdjustment}ms
              </div>
              <input
                type="range"
                min={CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MIN}
                max={CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MAX}
                value={latencyAdjustment}
                onChange={(e) => setLatencyAdjustment(parseInt(e.target.value, 10))}
                disabled={isRecording}
                className="dpgen-slider"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
                <span>{CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MIN}ms</span>
                <span>{CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MAX}ms</span>
              </div>
            </div>
          </div>

          {/* Bars to Record - Separate section for visibility */}
          <div className="dpgen-form-group" style={{ 
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--dpgen-bg)',
            borderRadius: 'var(--dpgen-radius)',
            border: '1px solid var(--dpgen-border)'
          }}>
            <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.75rem', display: 'block', fontWeight: 600 }}>
              Bars to Record
            </label>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isRecording ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="radio"
                  name="barsToRecord"
                  checked={barsToRecord === null}
                  onChange={() => setBarsToRecord(null)}
                  disabled={isRecording}
                />
                <span>Until stopped</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isRecording ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="radio"
                  name="barsToRecord"
                  checked={barsToRecord !== null}
                  onChange={() => setBarsToRecord(4)}
                  disabled={isRecording}
                />
                <span>Specific:</span>
                {barsToRecord !== null && (
                  <input
                    type="number"
                    min="1"
                    max="32"
                    value={barsToRecord}
                    onChange={(e) => setBarsToRecord(parseInt(e.target.value, 10) || 1)}
                    disabled={isRecording}
                    style={{
                      width: '60px',
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid var(--dpgen-border)',
                      background: 'var(--dpgen-bg)',
                      color: 'var(--dpgen-text)',
                      fontSize: '0.875rem',
                    }}
                  />
                )}
              </label>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.5rem' }}>
              {barsToRecord === null 
                ? 'Recording will continue until you click Stop'
                : `Recording will automatically stop after ${barsToRecord} bar${barsToRecord !== 1 ? 's' : ''}`
              }
            </div>
          </div>

          {/* Recording Options */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--dpgen-bg)',
            borderRadius: 'var(--dpgen-radius)',
            border: '1px solid var(--dpgen-border)'
          }}>
            <div className="dpgen-form-group">
              <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={countInEnabled}
                  onChange={(e) => setCountInEnabled(e.target.checked)}
                  disabled={isRecording}
                />
                <span className="dpgen-toggle-slider" />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Count-in</span>
              </label>
              {countInEnabled && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label className="dpgen-label" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block', color: 'var(--dpgen-muted)' }}>
                    Length: {countInBeats} beat{countInBeats !== 1 ? 's' : ''}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={countInBeats}
                    onChange={(e) => setCountInBeats(parseInt(e.target.value, 10))}
                    disabled={isRecording}
                    className="dpgen-slider"
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>

            <div className="dpgen-form-group">
              <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={metronomeEnabled}
                  onChange={(e) => setMetronomeEnabled(e.target.checked)}
                  disabled={isRecording}
                />
                <span className="dpgen-toggle-slider" />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Metronome</span>
              </label>
            </div>
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="dpgen-alert dpgen-alert--info" style={{ 
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem'
            }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: '#ef4444',
                animation: 'pulse 1s infinite'
              }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Recording...</strong>
                <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)' }}>
                  Time: {recordingTime} • Notes: {midiRecording.notes.length}
                </div>
              </div>
            </div>
          )}

          {countInActive && (
            <div className="dpgen-alert dpgen-alert--info" style={{ 
              marginTop: '1rem', 
              textAlign: 'center',
              padding: '2rem',
              background: 'var(--dpgen-bg)',
              borderRadius: 'var(--dpgen-radius)'
            }}>
              <div style={{ fontSize: '4rem', fontWeight: 'bold', lineHeight: 1 }}>
                {currentCountInBeat}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginTop: '0.5rem' }}>
                Get ready...
              </div>
            </div>
          )}

        </div>

        {/* Controls */}
        <div 
          className="dpgen-modal__footer" 
          style={{ 
            padding: '1.5rem', 
            borderTop: '1px solid var(--dpgen-border)', 
            display: 'flex', 
            gap: '0.75rem',
            justifyContent: 'flex-end',
            flexShrink: 0
          }}
        >
            {!isRecording ? (
              <button
                type="button"
                className="dpgen-button dpgen-button--primary"
                onClick={handleStartRecording}
                disabled={!selectedDeviceId}
              >
                <i className="fas fa-circle" /> Start Recording
              </button>
            ) : (
              <button
                type="button"
                className="dpgen-button dpgen-button--danger"
                onClick={handleStopRecording}
              >
                <i className="fas fa-stop" /> Stop Recording
              </button>
            )}
            <button
              type="button"
              className="dpgen-button dpgen-button--subtle"
              onClick={handleClearRecording}
              disabled={isRecording || midiRecording.notes.length === 0}
            >
              <i className="fas fa-trash" /> Clear
            </button>
            <button
              type="button"
              className="dpgen-button dpgen-button--subtle"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Calibration Modal */}
        {showCalibration && (
          <MIDICalibration 
            mode="recording"
            onClose={() => {
              setShowCalibration(false);
              // Reload latency adjustment from both store and localStorage
              // Store update should be immediate, but also check localStorage as backup
              setLatencyAdjustment(midiRecording.latencyAdjustment);
              
              // Also reload from localStorage in case store hasn't updated yet
              if (typeof window !== 'undefined') {
                try {
                  const saved = window.localStorage.getItem('dpgen_midi_recording_settings');
                  if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.latencyAdjustment !== undefined) {
                      setLatencyAdjustment(parsed.latencyAdjustment);
                    }
                  }
                } catch (e) {
                  console.error('Failed to reload latency from localStorage:', e);
                }
              }
            }}
          />
        )}
      </div>
  );
}

