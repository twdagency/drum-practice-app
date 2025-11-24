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
  const [subdivision, setSubdivision] = useState<number>(16);
  const [countInEnabled, setCountInEnabled] = useState<boolean>(true);
  const [countInBeats, setCountInBeats] = useState<number>(4);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(true);
  const [latencyAdjustment, setLatencyAdjustment] = useState<number>(0);
  const [recordingTime, setRecordingTime] = useState<string>('00:00');
  const [countInActive, setCountInActive] = useState<boolean>(false);
  const [currentCountInBeat, setCurrentCountInBeat] = useState<number>(4);
  const [showCalibration, setShowCalibration] = useState<boolean>(false);

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
          setSubdivision(parsed.subdivision || 16);
          setCountInEnabled(parsed.countInEnabled !== false);
          setCountInBeats(parsed.countInBeats || 4);
          setMetronomeEnabled(parsed.metronomeEnabled !== false);
          setLatencyAdjustment(parsed.latencyAdjustment || 0);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Update latency adjustment in store
  useEffect(() => {
    setMIDIRecordingLatencyAdjustment(latencyAdjustment);
  }, [latencyAdjustment, setMIDIRecordingLatencyAdjustment]);

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
          subdivision,
          countInEnabled,
          countInBeats,
          metronomeEnabled,
          latencyAdjustment,
        };
        window.localStorage.setItem('dpgen_midi_recording_settings', JSON.stringify(settings));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    }

    // Handle count-in if enabled
    if (countInEnabled) {
      setCountInActive(true);
      setCurrentCountInBeat(countInBeats);
      
      startCountIn(
        bpm,
        countInBeats,
        () => {
          // Count-in complete, start actual recording
          setCountInActive(false);
          if (metronomeEnabled) {
            startMetronome(bpm);
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
        startMetronome(bpm);
      }
      // Start recording immediately
      actuallyStartRecording();
    }
  };

  // Actually start recording (after count-in)
  const actuallyStartRecording = () => {
    if (!midiRecording.input) return;
    
    // Start recording using the hook
    actuallyStartRecordingHook(midiRecording.input);
    
    startTimeRef.current = performance.now();
    
    // Start timer
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((performance.now() - startTimeRef.current) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setRecordingTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    }, 100);
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

    // Get recorded notes
    const recordedNotes = stopRecording();

    // Convert to patterns
    if (recordedNotes && recordedNotes.length > 0) {
      const patterns = convertMIDIRecordingToPattern(recordedNotes, timeSignature, subdivision, bpm);
      
      if (patterns.length > 0) {
        // Replace all patterns with new ones
        clearPatterns();
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
    clearRecording();
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
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 'var(--dpgen-shadow)',
          border: '1px solid var(--dpgen-border)',
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
        
        <div className="dpgen-modal__body" style={{ padding: '1.5rem' }}>
          {!isSupported && (
            <div className="dpgen-alert dpgen-alert--error">
              MIDI is not supported in this browser.
            </div>
          )}

          {error && (
            <div className="dpgen-alert dpgen-alert--error">
              {error}
            </div>
          )}

          {/* Device Selection */}
          <div className="dpgen-form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>MIDI Input Device</label>
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
              >
                <i className="fas fa-sync-alt" />
              </button>
            </div>
          </div>

          {/* Recording Options */}
          <div className="dpgen-form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>Time Signature</label>
            <input
              type="text"
              className="dpgen-input"
              value={timeSignature}
              onChange={(e) => setTimeSignature(e.target.value)}
              disabled={isRecording}
              placeholder="4/4"
            />
          </div>

          <div className="dpgen-form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>Subdivision</label>
            <select
              className="dpgen-select"
              value={subdivision}
              onChange={(e) => setSubdivision(parseInt(e.target.value, 10))}
              disabled={isRecording}
            >
              <option value="4">Quarter notes (4)</option>
              <option value="8">Eighth notes (8)</option>
              <option value="12">Eighth note triplets (12)</option>
              <option value="16">Sixteenth notes (16)</option>
              <option value="24">Sixteenth note triplets (24)</option>
              <option value="32">Thirty-second notes (32)</option>
            </select>
          </div>

          <div className="dpgen-form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: countInEnabled ? '0.5rem' : '0' }}>
              <input
                type="checkbox"
                checked={countInEnabled}
                onChange={(e) => setCountInEnabled(e.target.checked)}
                disabled={isRecording}
              />
              <span className="dpgen-toggle-slider" />
              <span style={{ fontSize: '0.875rem' }}>Count-in</span>
            </label>
            {countInEnabled && (
              <div style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                  Count-in Length: {countInBeats} beat{countInBeats !== 1 ? 's' : ''}
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

          <div className="dpgen-form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={metronomeEnabled}
                onChange={(e) => setMetronomeEnabled(e.target.checked)}
                disabled={isRecording}
              />
              <span className="dpgen-toggle-slider" />
              <span style={{ fontSize: '0.875rem' }}>Metronome during recording</span>
            </label>
          </div>

          <div className="dpgen-form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="dpgen-label" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Latency Adjustment: {latencyAdjustment}ms
              </label>
              <button
                onClick={() => setShowCalibration(true)}
                disabled={isRecording}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--dpgen-border)',
                  background: 'var(--dpgen-bg)',
                  color: 'var(--dpgen-text)',
                  cursor: isRecording ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  opacity: isRecording ? 0.5 : 1,
                }}
                title="Open calibration tool"
              >
                <i className="fas fa-sliders-h" style={{ marginRight: '0.5rem' }} />
                Calibrate
              </button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
              <span>{CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MIN}ms</span>
              <span>{CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MAX}ms</span>
            </div>
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="dpgen-alert dpgen-alert--info" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Recording...</strong>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    Time: {recordingTime} | Notes: {midiRecording.notes.length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {countInActive && (
            <div className="dpgen-alert dpgen-alert--info" style={{ marginTop: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {currentCountInBeat}
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
            gap: '0.5rem',
            justifyContent: 'flex-end'
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
              // Reload latency adjustment from store after calibration
              setLatencyAdjustment(midiRecording.latencyAdjustment);
            }}
          />
        )}
      </div>
  );
}

