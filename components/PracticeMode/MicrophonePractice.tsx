/**
 * Microphone Practice Mode Component
 * Modal for microphone practice mode with device selection and stats
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useMicrophoneDevices } from '@/hooks/useMicrophoneDevices';
import { CONSTANTS } from '@/lib/utils/constants';
import { MicrophoneCalibration } from './MicrophoneCalibration';
import { parseNumberList } from '@/lib/utils/patternUtils';
import { ExpectedNote } from '@/types';

interface MicrophonePracticeProps {
  onClose: () => void;
  isOpen?: boolean;
}

export function MicrophonePractice({ onClose, isOpen = true }: MicrophonePracticeProps) {
  const microphonePractice = useStore((state) => state.microphonePractice);
  const isPlaying = useStore((state) => state.isPlaying);
  const patterns = useStore((state) => state.patterns);
  const setMicrophonePracticeEnabled = useStore((state) => state.setMicrophonePracticeEnabled);
  const setMicrophoneStream = useStore((state) => state.setMicrophoneStream);
  const setMicrophoneAudioContext = useStore((state) => state.setMicrophoneAudioContext);
  const setMicrophoneAnalyser = useStore((state) => state.setMicrophoneAnalyser);
  const setMicrophoneSource = useStore((state) => state.setMicrophoneSource);
  const setMicrophonePracticeAccuracyWindow = useStore((state) => state.setMicrophonePracticeAccuracyWindow);
  const setMicrophoneLatencyAdjustment = useStore((state) => state.setMicrophoneLatencyAdjustment);
  const setMicrophoneExpectedNotes = useStore((state) => state.setMicrophoneExpectedNotes);
  const setMicrophoneSensitivity = useStore((state) => state.setMicrophoneSensitivity);
  const setMicrophoneThreshold = useStore((state) => state.setMicrophoneThreshold);
  const resetMicrophonePractice = useStore((state) => state.resetMicrophonePractice);
  const setMicrophoneVisualFeedback = useStore((state) => state.setMicrophoneVisualFeedback);
  const setMicrophoneShowTimingErrors = useStore((state) => state.setMicrophoneShowTimingErrors);
  const bpm = useStore((state) => state.bpm);

  const { devices, error, isSupported, requestAccess, refreshDevices } = useMicrophoneDevices();
  // NOTE: useMicrophonePractice() will be called in page.tsx so it stays mounted

  const [showCalibration, setShowCalibration] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    // Load persisted device selection from localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dpgen_microphone_practice_settings');
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
  const [sensitivity, setSensitivity] = useState<number>(70);
  const [threshold, setThreshold] = useState<number>(0.15);

  // Load settings from store (only watch specific properties to avoid resetting when visual feedback changes)
  useEffect(() => {
    setToleranceWindow(microphonePractice.accuracyWindow.toString());
    setLatencyAdjustment(microphonePractice.latencyAdjustment);
    setSensitivity(microphonePractice.sensitivity);
    setThreshold(microphonePractice.threshold);
  }, [microphonePractice.accuracyWindow, microphonePractice.latencyAdjustment, microphonePractice.sensitivity, microphonePractice.threshold]);

  // Reload selectedDeviceId from localStorage when component mounts or modal reopens
  // This ensures the dropdown shows the selected device even after closing/reopening the modal
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dpgen_microphone_practice_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.deviceId) {
            setSelectedDeviceId(parsed.deviceId);
            console.log('[Microphone Practice] Reloaded device from localStorage:', parsed.deviceId);
          }
        }
      } catch (e) {
        console.error('Failed to load device from localStorage:', e);
      }
    }
  }, [isOpen]); // Reload when modal opens

  // Request microphone access on mount
  useEffect(() => {
    if (isSupported && devices.length === 0) {
      requestAccess();
    }
  }, [isSupported, devices.length, requestAccess]);

  // Auto-select persisted device on mount or when devices load
  useEffect(() => {
    if (selectedDeviceId && devices.length > 0 && !microphonePractice.analyser) {
      const deviceExists = devices.some(d => d.deviceId === selectedDeviceId);
      if (deviceExists) {
        console.log('[Microphone Practice] Auto-selecting persisted device:', selectedDeviceId);
        handleDeviceSelect(selectedDeviceId).catch(err => {
          console.error('[Microphone Practice] Failed to auto-select device:', err);
        });
      } else {
        console.warn('[Microphone Practice] Persisted device not found in device list:', selectedDeviceId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId, devices.length, microphonePractice.analyser]);
  
  // Sync selectedDeviceId with localStorage whenever it changes
  useEffect(() => {
    if (selectedDeviceId && typeof window !== 'undefined') {
      try {
        const existing = localStorage.getItem('dpgen_microphone_practice_settings');
        const settings = existing ? JSON.parse(existing) : {};
        if (settings.deviceId !== selectedDeviceId) {
          settings.deviceId = selectedDeviceId;
          localStorage.setItem('dpgen_microphone_practice_settings', JSON.stringify(settings));
          console.log('[Microphone Practice] Synced device to localStorage:', selectedDeviceId);
        }
      } catch (e) {
        console.error('Failed to sync device to localStorage:', e);
      }
    }
  }, [selectedDeviceId]);

  // Select device
  const handleDeviceSelect = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    
    // Persist device selection to localStorage
    if (typeof window !== 'undefined') {
      try {
        const existing = localStorage.getItem('dpgen_microphone_practice_settings');
        const settings = existing ? JSON.parse(existing) : {};
        settings.deviceId = deviceId;
        localStorage.setItem('dpgen_microphone_practice_settings', JSON.stringify(settings));
      } catch (e) {
        console.error('Failed to save device selection:', e);
      }
    }
    
    try {
      // Request access with specific device
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
        },
      });

      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = CONSTANTS.AUDIO.FFT_SIZE;
      analyser.smoothingTimeConstant = CONSTANTS.AUDIO.SMOOTHING_TIME_CONSTANT;

      const source = audioContext.createMediaStreamSource(stream);

      // Connect source to analyser
      source.connect(analyser);

      // Store in Zustand
      setMicrophoneStream(stream);
      setMicrophoneAudioContext(audioContext);
      setMicrophoneAnalyser(analyser);
      setMicrophoneSource(source);
      
      console.log('[Microphone Practice] Device selected and set up:', {
        deviceId,
        hasStream: !!stream,
        hasAnalyser: !!analyser,
        hasSource: !!source,
        fftSize: analyser.fftSize
      });
    } catch (err) {
      console.error('[Microphone Practice] Failed to access microphone:', err);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  // Build expected notes from patterns
  const buildExpectedNotes = (): ExpectedNote[] => {
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
            
            // For microphone, detect any hit (not specific to drum type)
            if (drumToken !== 'R' && drumToken !== 'X') {
              expectedNotes.push({
                time: globalTimeOffset + patternTimeOffset,
                note: drumToken,
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
  };

  // Start practice
  const handleStartPractice = async () => {
    if (!selectedDeviceId) {
      alert('Please select a microphone device first.');
      return;
    }

    // Request microphone access if not already done
    if (!microphonePractice.stream || !microphonePractice.analyser) {
      console.log('[Microphone Practice] Setting up microphone...');
      await handleDeviceSelect(selectedDeviceId);
      // Wait a bit for the stream/analyser to be set
      await new Promise(resolve => setTimeout(resolve, 200));
      // Check again after attempting to set up
      if (!microphonePractice.stream || !microphonePractice.analyser) {
        console.error('[Microphone Practice] Failed to set up microphone:', {
          hasStream: !!microphonePractice.stream,
          hasAnalyser: !!microphonePractice.analyser
        });
        alert('Failed to access microphone. Please check permissions and try again.');
        return;
      }
      console.log('[Microphone Practice] Microphone set up successfully');
    } else {
      console.log('[Microphone Practice] Microphone already set up');
    }

    // Set tolerance window
    if (toleranceWindow === 'custom') {
      setMicrophonePracticeAccuracyWindow(customTolerance);
    } else {
      setMicrophonePracticeAccuracyWindow(parseInt(toleranceWindow, 10));
    }

    // Set latency adjustment
    setMicrophoneLatencyAdjustment(latencyAdjustment);

    // Set sensitivity and threshold
    setMicrophoneSensitivity(sensitivity);
    setMicrophoneThreshold(threshold);

    // Build expected notes
    const expectedNotes = buildExpectedNotes().map(note => ({
      ...note,
      matched: false
    }));
    setMicrophoneExpectedNotes(expectedNotes);

    // Note: Allow practice mode to start even with no patterns/notes
    // The practice mode will simply not have any expected notes to match against

    // Enable practice mode
    setMicrophonePracticeEnabled(true);
    
    // Close the modal
    onClose();
  };

  // Stop practice
  const handleStopPractice = () => {
    setMicrophonePracticeEnabled(false);
    
    // Stop audio stream
    if (microphonePractice.stream) {
      microphonePractice.stream.getTracks().forEach(track => track.stop());
      setMicrophoneStream(null);
    }
    
    // Close audio context
    if (microphonePractice.audioContext) {
      microphonePractice.audioContext.close();
      setMicrophoneAudioContext(null);
    }
    
    setMicrophoneAnalyser(null);
    setMicrophoneSource(null);
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    const hits = microphonePractice.actualHits;
    const expected = microphonePractice.expectedNotes.length;
    const matched = microphonePractice.expectedNotes.filter(n => n.matched).length;
    const accuracy = expected > 0 ? Math.round((matched / expected) * 100) : 0;
    
    const timingErrors = hits
      .filter(h => h.matched)
      .map(h => Math.abs(h.timingError));
    const avgTiming = timingErrors.length > 0
      ? Math.round(timingErrors.reduce((a, b) => a + b, 0) / timingErrors.length)
      : 0;

    return {
      accuracy,
      hits: matched,
      expected,
      avgTiming,
    };
  }, [microphonePractice.actualHits, microphonePractice.expectedNotes]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--dpgen-card)',
          borderRadius: 'var(--dpgen-radius)',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--dpgen-shadow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Microphone Practice Mode</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              color: 'var(--dpgen-text)',
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        {!isSupported && (
          <div style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#ef4444',
          }}>
            Microphone access is not supported in this browser.
          </div>
        )}

        {/* Device Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Microphone Device
          </label>
          <select
            value={selectedDeviceId}
            onChange={(e) => handleDeviceSelect(e.target.value)}
            disabled={isPlaying || microphonePractice.enabled}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--dpgen-border)',
              background: 'var(--dpgen-bg)',
              color: 'var(--dpgen-text)',
            }}
          >
            <option value="">Select microphone...</option>
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
          <button
            onClick={refreshDevices}
            disabled={isPlaying}
            style={{
              marginTop: '0.5rem',
              padding: '0.375rem 0.75rem',
              background: 'var(--dpgen-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Refresh Devices
          </button>
        </div>

        {/* Settings */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Settings</h3>
          
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
                  setMicrophonePracticeAccuracyWindow(parseInt(value, 10));
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
                  marginTop: '0.5rem',
                  width: '100%',
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Latency Adjustment: {latencyAdjustment}ms
            </label>
            <input
              type="range"
              min={CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MIN}
              max={CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MAX}
              value={latencyAdjustment}
              onChange={(e) => setLatencyAdjustment(parseInt(e.target.value, 10))}
              disabled={isPlaying}
              style={{ width: '100%' }}
            />
          </div>

          {/* Sensitivity */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Sensitivity: {sensitivity}%
            </label>
            <input
              type="range"
              min={CONSTANTS.AUDIO.SENSITIVITY_MIN}
              max={CONSTANTS.AUDIO.SENSITIVITY_MAX}
              value={sensitivity}
              onChange={(e) => setSensitivity(parseInt(e.target.value, 10))}
              disabled={isPlaying}
              style={{ width: '100%' }}
            />
          </div>

          {/* Threshold */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Threshold: {threshold.toFixed(2)}
            </label>
            <input
              type="range"
              min={CONSTANTS.AUDIO.THRESHOLD_MIN}
              max={CONSTANTS.AUDIO.THRESHOLD_MAX}
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              disabled={isPlaying}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Visual Feedback */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Visual Feedback</h3>
          
          {/* Accuracy Highlighting Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <label style={{ fontWeight: 500, cursor: 'pointer' }}>
              Show Accuracy Colors (Green/Yellow/Red)
            </label>
            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
              <input
                type="checkbox"
                checked={microphonePractice.visualFeedback}
                onChange={(e) => setMicrophoneVisualFeedback(e.target.checked)}
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
                backgroundColor: microphonePractice.visualFeedback ? 'var(--dpgen-primary)' : '#ccc',
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
                  transform: microphonePractice.visualFeedback ? 'translateX(26px)' : 'translateX(0)',
                }} />
              </span>
            </label>
          </div>

          {/* Timing Errors Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontWeight: 500, cursor: 'pointer' }}>
              Show Timing Measurements (+/-ms)
            </label>
            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
              <input
                type="checkbox"
                checked={microphonePractice.showTimingErrors}
                onChange={(e) => setMicrophoneShowTimingErrors(e.target.checked)}
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
                backgroundColor: microphonePractice.showTimingErrors ? 'var(--dpgen-primary)' : '#ccc',
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
                  transform: microphonePractice.showTimingErrors ? 'translateX(26px)' : 'translateX(0)',
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Stats */}
        {microphonePractice.enabled && (
          <div style={{
            padding: '1rem',
            background: 'var(--dpgen-bg)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>Practice Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)' }}>Accuracy</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.accuracy}%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)' }}>Hits</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.hits} / {stats.expected}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)' }}>Avg Timing</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.avgTiming}ms</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowCalibration(true)}
            disabled={false}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--dpgen-bg)',
              color: 'var(--dpgen-text)',
              border: '1px solid var(--dpgen-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Calibrate
          </button>

          {!microphonePractice.enabled ? (
            <button
              onClick={handleStartPractice}
              disabled={
                isPlaying ||
                !selectedDeviceId
              }
              style={{
                padding: '0.75rem 1.5rem',
                background: selectedDeviceId ? 'var(--dpgen-primary)' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: selectedDeviceId ? 'pointer' : 'not-allowed',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
              title={
                !selectedDeviceId
                  ? 'Please select a microphone device'
                  : ''
              }
            >
              Start Practice
            </button>
          ) : (
            <button
              onClick={handleStopPractice}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Stop Practice
            </button>
          )}
        </div>
      </div>

      {showCalibration && (
        <MicrophoneCalibration
          onClose={() => setShowCalibration(false)}
          onApply={(latency) => {
            setLatencyAdjustment(latency);
            setMicrophoneLatencyAdjustment(latency);
            setShowCalibration(false);
          }}
        />
      )}
    </div>
  );
}

