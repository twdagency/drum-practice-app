/**
 * MIDI Practice Mode Component
 * Modal for MIDI practice mode with device selection and stats
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useMIDIDevices } from '@/hooks/useMIDIDevices';
import { CONSTANTS } from '@/lib/utils/constants';
import { MIDICalibration } from './MIDICalibration';
import { parseNumberList } from '@/lib/utils/patternUtils';
import { ExpectedNote } from '@/types';
import { useToast } from '@/components/shared/Toast';

interface MIDIPracticeProps {
  onClose: () => void;
}

export function MIDIPractice({ onClose }: MIDIPracticeProps) {
  const { showToast } = useToast();
  const midiPractice = useStore((state) => state.midiPractice);
  const isPlaying = useStore((state) => state.isPlaying);
  const patterns = useStore((state) => state.patterns);
  const setMIDIPracticeEnabled = useStore((state) => state.setMIDIPracticeEnabled);
  const setMIDIInput = useStore((state) => state.setMIDIInput);
  const setMIDIPracticeAccuracyWindow = useStore((state) => state.setMIDIPracticeAccuracyWindow);
  const setMIDILatencyAdjustment = useStore((state) => state.setMIDILatencyAdjustment);
  const setMIDIExpectedNotes = useStore((state) => state.setMIDIExpectedNotes);
  const resetMIDIPractice = useStore((state) => state.resetMIDIPractice);
  const setMIDIVisualFeedback = useStore((state) => state.setMIDIVisualFeedback);
  const setMIDIShowTimingErrors = useStore((state) => state.setMIDIShowTimingErrors);
  const bpm = useStore((state) => state.bpm);

  const { devices, access, error, isSupported, refreshDevices } = useMIDIDevices();
  // NOTE: useMIDIPractice() is called in page.tsx so it stays mounted

  const [showCalibration, setShowCalibration] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    // Load persisted device selection from localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('dpgen_midi_practice_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.deviceId || '';
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    return '';
  });
  const [toleranceWindow, setToleranceWindow] = useState<string>('50');
  const [customTolerance, setCustomTolerance] = useState<number>(50);
  const [latencyAdjustment, setLatencyAdjustment] = useState<number>(0);


  // Load settings from store (only watch specific properties to avoid resetting when visual feedback changes)
  useEffect(() => {
    setToleranceWindow(midiPractice.accuracyWindow.toString());
    setLatencyAdjustment(midiPractice.latencyAdjustment);
    if (midiPractice.input) {
      setSelectedDeviceId(midiPractice.input.id);
    }
  }, [midiPractice.accuracyWindow, midiPractice.latencyAdjustment, midiPractice.input]);

  // Auto-select persisted device on mount
  useEffect(() => {
    if (selectedDeviceId && devices.length > 0 && !midiPractice.input && access) {
      const deviceExists = devices.some(d => d.id === selectedDeviceId);
      if (deviceExists) {
        handleDeviceSelect(selectedDeviceId);
      }
    }
  }, [selectedDeviceId, devices.length, access]);

  // Select device
  const handleDeviceSelect = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    
    // Persist device selection to localStorage
    if (typeof window !== 'undefined') {
      try {
        const existing = window.localStorage.getItem('dpgen_midi_practice_settings');
        const settings = existing ? JSON.parse(existing) : {};
        settings.deviceId = deviceId;
        window.localStorage.setItem('dpgen_midi_practice_settings', JSON.stringify(settings));
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
          setMIDIInput(input);
        }
      }
    } else {
      const input = access.inputs.get(deviceId);
      if (input) {
        setMIDIInput(input);
      }
    }
  };

  // Build expected notes from patterns (same logic as WordPress plugin)
  const buildExpectedNotes = (): ExpectedNote[] => {
    if (patterns.length === 0) return [];
    
    const DRUM_MIDI_MAP: { [key: string]: number } = {
      K: 36,  // Kick (C1)
      S: 38,  // Snare (D1)
      H: 42,  // Hi-hat closed (F#1)
      'H+': 46, // Hi-hat open (A#1)
      T: 47,  // Low-Mid Tom (B1)
      F: 41,  // Low Tom (F1)
      R: 0,   // Rest (no note)
    };
    
    const expectedNotes: ExpectedNote[] = [];
    const bpmMs = 60000 / bpm;
    
    let globalIndex = 0;
    
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
        let timeOffset = 0;
        
        // Build notes from phrase
        phraseTokens.forEach((phraseVal) => {
          const notesInThisPhrase = phraseVal;
          
          for (let i = 0; i < notesInThisPhrase; i++) {
            const drumToken = drumTokens[noteIndexInPattern % drumTokens.length];
            const midiNote = DRUM_MIDI_MAP[drumToken] || 0;
            
            if (midiNote > 0) {
              expectedNotes.push({
                time: timeOffset,
                note: midiNote,
                index: globalIndex,
                matched: false,
              });
            }
            
            timeOffset += noteDuration;
            noteIndexInPattern++;
            globalIndex++;
          }
        });
      }
    });
    
    return expectedNotes;
  };

  // Connect/Activate MIDI - allows connection even without patterns
  const handleConnect = () => {
    if (!selectedDeviceId) {
      showToast('Please select a MIDI device first.', 'error');
      return;
    }

    // Make sure device is selected and input is set
    if (!access) {
      console.error('[MIDI Practice] No MIDI access available');
      showToast('MIDI access not available. Please refresh and try again.', 'error');
      return;
    }
    
    const input = access.inputs.get(selectedDeviceId);
    if (!input) {
      console.error('[MIDI Practice] Device not found:', selectedDeviceId);
      showToast('MIDI device not found. Please refresh the device list.', 'error');
      return;
    }
    
    setMIDIInput(input);

    // Set tolerance window
    if (toleranceWindow === 'custom') {
      setMIDIPracticeAccuracyWindow(customTolerance);
    } else {
      setMIDIPracticeAccuracyWindow(parseInt(toleranceWindow, 10));
    }

    // Set latency adjustment
    setMIDILatencyAdjustment(latencyAdjustment);

    // Build expected notes if patterns exist (don't require patterns to connect)
    const expectedNotes = buildExpectedNotes().map(note => ({
      ...note,
      matched: false
    }));
    setMIDIExpectedNotes(expectedNotes);

    // Enable practice mode (this activates the MIDI handler)
    setMIDIPracticeEnabled(true);
    
    // Show confirmation
    showToast(`MIDI connected: ${input.name}`, 'success');
    
    // Close modal
    onClose();
  };

  // Stop practice
  const handleStopPractice = () => {
    setMIDIPracticeEnabled(false);
    if (midiPractice.input) {
      setMIDIInput(null);
    }
    resetMIDIPractice();
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    const hits = midiPractice.actualHits;
    const expected = midiPractice.expectedNotes;
    
    if (expected.length === 0) {
      return {
        accuracy: 0,
        hits: 0,
        missed: 0,
        perfect: 0,
        early: 0,
        late: 0,
        timingAvg: 0,
        extraHits: 0,
      };
    }

    // Calculate stats
    const matched = expected.filter((n) => n.matched).length;
    const missed = expected.length - matched;
    const extraHits = hits.filter((h) => h.isExtraHit).length;
    
    // Penalize extra hits: accuracy = matched / (expected + extraHits)
    // This prevents "spam to win" strategy
    const denominator = expected.length + extraHits;
    const accuracy = denominator > 0 ? Math.round((matched / denominator) * 100) : 0;
    
    // Perfect, early, late counts (only for matched hits, not extra hits)
    const matchedHits = hits.filter((h) => h.matched);
    const perfect = matchedHits.filter((h) => h.perfect).length;
    const early = matchedHits.filter((h) => h.early && !h.perfect).length;
    const late = matchedHits.filter((h) => !h.early && !h.perfect).length;
    
    // Average timing error (only for matched hits)
    const timingErrors = matchedHits.length > 0
      ? matchedHits.map((h) => Math.abs(h.timingError))
      : [];
    const timingAvg = timingErrors.length > 0
      ? timingErrors.reduce((sum, err) => sum + err, 0) / timingErrors.length
      : 0;

    return {
      accuracy,
      hits: matched,
      missed,
      perfect,
      early,
      late,
      timingAvg: Math.round(timingAvg),
      extraHits,
    };
  }, [midiPractice.actualHits, midiPractice.expectedNotes]);

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
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="dpgen-modal-content"
        style={{
          background: 'var(--dpgen-bg)',
          borderRadius: '10px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            <i className="fas fa-drum" style={{ marginRight: '0.5rem' }} />
            MIDI Practice Mode
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--dpgen-muted)',
              padding: '0.25rem 0.5rem',
            }}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {!isSupported && (
          <div style={{ padding: '1rem', background: '#fee', borderRadius: '6px', marginBottom: '1rem', color: '#c33' }}>
            MIDI is not supported in this browser. Please use Chrome, Edge, or Opera.
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', background: '#fee', borderRadius: '6px', marginBottom: '1rem', color: '#c33' }}>
            {error}
          </div>
        )}

        {/* Device Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            MIDI Device
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceSelect(e.target.value)}
              disabled={!isSupported || isPlaying}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--dpgen-border)',
                background: 'var(--dpgen-bg)',
                color: 'var(--dpgen-text)',
              }}
            >
              <option value="">Select a MIDI device...</option>
              {devices.length === 0 ? (
                <option value="" disabled>
                  {isSupported ? 'No MIDI devices found. Click refresh to scan.' : 'MIDI not supported'}
                </option>
              ) : (
                devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} {device.manufacturer ? `(${device.manufacturer})` : ''}
                  </option>
                ))
              )}
            </select>
            <button
              onClick={refreshDevices}
              disabled={!isSupported || isPlaying}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--dpgen-border)',
                background: 'var(--dpgen-bg)',
                color: 'var(--dpgen-text)',
                cursor: 'pointer',
              }}
              title="Refresh device list"
            >
              <i className="fas fa-sync-alt" />
            </button>
          </div>
        </div>

        {/* Settings */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Settings</h3>
          
          {/* Tolerance Window */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Tolerance Window (ms)
            </label>
            <select
              value={toleranceWindow}
              onChange={(e) => {
                const value = e.target.value;
                setToleranceWindow(value);
                if (value !== 'custom') {
                  setMIDIPracticeAccuracyWindow(parseInt(value, 10));
                }
              }}
              disabled={isPlaying}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--dpgen-border)',
                background: 'var(--dpgen-bg)',
                color: 'var(--dpgen-text)',
              }}
            >
              <option value="0">0ms (Perfect Only)</option>
              <option value="5">5ms (Very Strict)</option>
              <option value="25">25ms (Strict)</option>
              <option value="50">50ms (Default)</option>
              <option value="100">100ms (Relaxed)</option>
              <option value="200">200ms (Very Relaxed)</option>
              <option value="custom">Custom</option>
            </select>
            {toleranceWindow === 'custom' && (
              <input
                type="number"
                value={customTolerance}
                onChange={(e) => setCustomTolerance(parseInt(e.target.value, 10) || 50)}
                min="1"
                max="500"
                disabled={isPlaying}
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--dpgen-border)',
                  background: 'var(--dpgen-bg)',
                  color: 'var(--dpgen-text)',
                }}
              />
            )}
          </div>

          {/* Latency Adjustment */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 500 }}>
                Latency Adjustment (ms): {latencyAdjustment}
              </label>
              <button
                onClick={() => setShowCalibration(true)}
                disabled={isPlaying}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--dpgen-border)',
                  background: 'var(--dpgen-bg)',
                  color: 'var(--dpgen-text)',
                  cursor: isPlaying ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  opacity: isPlaying ? 0.5 : 1,
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
              disabled={isPlaying}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
              <span>{CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MIN}ms</span>
              <span>{CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MAX}ms</span>
            </div>
          </div>

          {/* Visual Feedback Toggles */}
          <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--dpgen-surface)', borderRadius: '6px' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Visual Feedback</h3>
            
            {/* Accuracy Highlighting Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ fontWeight: 500, cursor: 'pointer' }}>
                Show Accuracy Colors (Green/Yellow/Red)
              </label>
              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                <input
                  type="checkbox"
                  checked={midiPractice.visualFeedback}
                  onChange={(e) => setMIDIVisualFeedback(e.target.checked)}
                  disabled={isPlaying}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: isPlaying ? 'not-allowed' : 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: midiPractice.visualFeedback ? 'var(--dpgen-primary)' : '#ccc',
                  transition: '0.3s',
                  borderRadius: '24px',
                  opacity: isPlaying ? 0.5 : 1,
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '0.3s',
                    borderRadius: '50%',
                    transform: midiPractice.visualFeedback ? 'translateX(26px)' : 'translateX(0)',
                  }} />
                </span>
              </label>
            </div>

            {/* Timing Errors Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: 500, cursor: 'pointer' }}>
                Show Timing Measurements Under Notes
              </label>
              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                <input
                  type="checkbox"
                  checked={midiPractice.showTimingErrors}
                  onChange={(e) => setMIDIShowTimingErrors(e.target.checked)}
                  disabled={isPlaying}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: isPlaying ? 'not-allowed' : 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: midiPractice.showTimingErrors ? 'var(--dpgen-primary)' : '#ccc',
                  transition: '0.3s',
                  borderRadius: '24px',
                  opacity: isPlaying ? 0.5 : 1,
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '0.3s',
                    borderRadius: '50%',
                    transform: midiPractice.showTimingErrors ? 'translateX(26px)' : 'translateX(0)',
                  }} />
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Stats Display */}
        {midiPractice.enabled && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--dpgen-surface)', borderRadius: '6px' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Practice Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Accuracy</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.accuracy}%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Hits</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.hits}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Missed</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.missed}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Perfect</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#10b981' }}>{stats.perfect}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Early</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f59e0b' }}>{stats.early}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Late</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ef4444' }}>{stats.late}</div>
              </div>
              {stats.extraHits > 0 && (
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Extra Hits</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ef4444' }}>{stats.extraHits}</div>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Avg Timing Error</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.timingAvg}ms</div>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        {!selectedDeviceId && !midiPractice.enabled && (
          <div style={{ 
            padding: '1rem', 
            background: '#fef3c7', 
            borderRadius: '6px', 
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: '#92400e'
          }}>
            <strong>To start practice:</strong>
            <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
              {!selectedDeviceId && <li>Select a MIDI device from the dropdown above</li>}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          {midiPractice.enabled ? (
            <button
              onClick={handleStopPractice}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                border: 'none',
                background: '#ef4444',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Stop Practice
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleConnect();
              }}
              disabled={!selectedDeviceId}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                border: 'none',
                background: selectedDeviceId ? 'var(--dpgen-primary)' : '#ccc',
                color: 'white',
                cursor: selectedDeviceId ? 'pointer' : 'not-allowed',
                fontWeight: 500,
                opacity: !selectedDeviceId ? 0.6 : 1,
              }}
              title={
                !selectedDeviceId 
                  ? 'Please select a MIDI device first' 
                  : 'Connect MIDI device for practice'
              }
            >
              Connect
            </button>
          )}
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                border: '1px solid var(--dpgen-border)',
                background: 'var(--dpgen-bg)',
                color: 'var(--dpgen-text)',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
        </div>
        
        {/* Calibration Modal */}
        {showCalibration && (
          <MIDICalibration 
            onClose={() => {
              setShowCalibration(false);
              // Reload latency adjustment from store after calibration
              setLatencyAdjustment(midiPractice.latencyAdjustment);
            }}
          />
        )}
      </div>
    </div>
  );
}

