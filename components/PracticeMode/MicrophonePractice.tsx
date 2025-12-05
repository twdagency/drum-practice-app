/**
 * Microphone Practice Mode Component
 * Compact modal for microphone practice mode with device selection and stats
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useMicrophoneDevices } from '@/hooks/useMicrophoneDevices';
import { CONSTANTS } from '@/lib/utils/constants';
import { MicrophoneCalibration } from './MicrophoneCalibration';
import { parseNumberList } from '@/lib/utils/patternUtils';
import { ExpectedNote } from '@/types';
import { getAudioWorkletSupportInfo } from '@/lib/utils/audioWorkletSupport';
import { 
  Modal, 
  ModalSection, 
  ModalRow, 
  ModalToggle, 
  ModalButton, 
  ModalAlert,
  ModalSelect,
  ModalSlider,
  ModalGrid,
  ModalStat,
} from '../shared/Modal';
import { Mic, RefreshCw, Settings, Zap, BarChart3 } from 'lucide-react';

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
  const setMicrophoneVisualFeedback = useStore((state) => state.setMicrophoneVisualFeedback);
  const setMicrophoneShowTimingErrors = useStore((state) => state.setMicrophoneShowTimingErrors);
  const bpm = useStore((state) => state.bpm);

  const { devices, error, isSupported, requestAccess, refreshDevices } = useMicrophoneDevices();

  const [showCalibration, setShowCalibration] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dpgen_microphone_practice_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.deviceId || '';
        }
      } catch (e) {}
    }
    return '';
  });
  const [toleranceWindow, setToleranceWindow] = useState<string>('50');
  const [customTolerance, setCustomTolerance] = useState<number>(50);
  const [latencyAdjustment, setLatencyAdjustment] = useState<number>(0);
  const [sensitivity, setSensitivity] = useState<number>(70);
  const [threshold, setThreshold] = useState<number>(0.15);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load settings from store
  useEffect(() => {
    setToleranceWindow(microphonePractice.accuracyWindow.toString());
    setLatencyAdjustment(microphonePractice.latencyAdjustment);
    setSensitivity(microphonePractice.sensitivity);
    setThreshold(microphonePractice.threshold);
  }, [microphonePractice.accuracyWindow, microphonePractice.latencyAdjustment, microphonePractice.sensitivity, microphonePractice.threshold]);

  // Reload device from localStorage when modal opens
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dpgen_microphone_practice_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.deviceId) setSelectedDeviceId(parsed.deviceId);
        }
      } catch (e) {}
    }
  }, [isOpen]);

  // Request mic access on mount
  useEffect(() => {
    if (isSupported && devices.length === 0) {
      requestAccess();
    }
  }, [isSupported, devices.length, requestAccess]);

  // Auto-select persisted device
  useEffect(() => {
    if (selectedDeviceId && devices.length > 0 && !microphonePractice.analyser) {
      const deviceExists = devices.some(d => d.deviceId === selectedDeviceId);
      if (deviceExists) {
        handleDeviceSelect(selectedDeviceId).catch(() => {});
      }
    }
  }, [selectedDeviceId, devices.length, microphonePractice.analyser]);

  // Sync device to localStorage
  useEffect(() => {
    if (selectedDeviceId && typeof window !== 'undefined') {
      try {
        const existing = localStorage.getItem('dpgen_microphone_practice_settings');
        const settings = existing ? JSON.parse(existing) : {};
        if (settings.deviceId !== selectedDeviceId) {
          settings.deviceId = selectedDeviceId;
          localStorage.setItem('dpgen_microphone_practice_settings', JSON.stringify(settings));
        }
      } catch (e) {}
    }
  }, [selectedDeviceId]);

  const handleDeviceSelect = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    
    if (typeof window !== 'undefined') {
      try {
        const existing = localStorage.getItem('dpgen_microphone_practice_settings');
        const settings = existing ? JSON.parse(existing) : {};
        settings.deviceId = deviceId;
        localStorage.setItem('dpgen_microphone_practice_settings', JSON.stringify(settings));
      } catch (e) {}
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = CONSTANTS.AUDIO.FFT_SIZE;
      analyser.smoothingTimeConstant = CONSTANTS.AUDIO.SMOOTHING_TIME_CONSTANT;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setMicrophoneStream(stream);
      setMicrophoneAudioContext(audioContext);
      setMicrophoneAnalyser(analyser);
      setMicrophoneSource(source);
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const buildExpectedNotes = (): ExpectedNote[] => {
    if (patterns.length === 0) return [];
    
    const expectedNotes: ExpectedNote[] = [];
    const bpmMs = 60000 / bpm;
    
    let globalIndex = 0;
    let globalTimeOffset = 0;
    
    patterns.forEach((pattern) => {
      const timeSig = pattern.timeSignature || '4/4';
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
          for (let i = 0; i < phraseVal; i++) {
            const drumToken = drumTokens[noteIndexInPattern % drumTokens.length];
            
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
      globalTimeOffset += totalNotesInPattern * noteDuration;
    });
    
    return expectedNotes;
  };

  const handleStartPractice = async () => {
    if (!selectedDeviceId) {
      alert('Please select a microphone device first.');
      return;
    }

    if (!microphonePractice.stream || !microphonePractice.analyser) {
      await handleDeviceSelect(selectedDeviceId);
      await new Promise(resolve => setTimeout(resolve, 200));
      if (!microphonePractice.stream || !microphonePractice.analyser) {
        alert('Failed to access microphone. Please check permissions.');
        return;
      }
    }

    if (toleranceWindow === 'custom') {
      setMicrophonePracticeAccuracyWindow(customTolerance);
    } else {
      setMicrophonePracticeAccuracyWindow(parseInt(toleranceWindow, 10));
    }

    setMicrophoneLatencyAdjustment(latencyAdjustment);
    setMicrophoneSensitivity(sensitivity);
    setMicrophoneThreshold(threshold);

    const expectedNotes = buildExpectedNotes().map(note => ({ ...note, matched: false }));
    setMicrophoneExpectedNotes(expectedNotes);
    setMicrophonePracticeEnabled(true);
    onClose();
  };

  const handleStopPractice = () => {
    setMicrophonePracticeEnabled(false);
    
    if (microphonePractice.stream) {
      microphonePractice.stream.getTracks().forEach(track => track.stop());
      setMicrophoneStream(null);
    }
    
    if (microphonePractice.audioContext) {
      microphonePractice.audioContext.close();
      setMicrophoneAudioContext(null);
    }
    
    setMicrophoneAnalyser(null);
    setMicrophoneSource(null);
  };

  const stats = React.useMemo(() => {
    const hits = microphonePractice.actualHits;
    const expected = microphonePractice.expectedNotes.length;
    const matched = microphonePractice.expectedNotes.filter(n => n.matched).length;
    const accuracy = expected > 0 ? Math.round((matched / expected) * 100) : 0;
    
    const timingErrors = hits.filter(h => h.matched).map(h => Math.abs(h.timingError));
    const avgTiming = timingErrors.length > 0
      ? Math.round(timingErrors.reduce((a, b) => a + b, 0) / timingErrors.length)
      : 0;
    
    const hitsWithDynamic = hits.filter(h => h.dynamicMatch !== undefined);
    const dynamicMatches = hitsWithDynamic.filter(h => h.dynamicMatch).length;
    const dynamicAccuracy = hitsWithDynamic.length > 0 
      ? Math.round((dynamicMatches / hitsWithDynamic.length) * 100) 
      : null;
    
    const ghostHits = hits.filter(h => h.dynamic === 'ghost').length;
    const accentHits = hits.filter(h => h.dynamic === 'accent').length;
    const normalHits = hits.filter(h => h.dynamic === 'normal').length;

    return { accuracy, hits: matched, expected, avgTiming, dynamicAccuracy, ghostHits, accentHits, normalHits };
  }, [microphonePractice.actualHits, microphonePractice.expectedNotes]);

  const toleranceOptions = [
    { value: '25', label: '25ms (Strict)' },
    { value: '50', label: '50ms (Default)' },
    { value: '100', label: '100ms (Relaxed)' },
    { value: '200', label: '200ms (Very Relaxed)' },
  ];

  const deviceOptions = [
    { value: '', label: 'Select microphone...' },
    ...devices.map(d => ({ value: d.deviceId, label: d.label })),
  ];

  const workletInfo = getAudioWorkletSupportInfo();

  const footer = (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
      <ModalButton onClick={() => setShowCalibration(true)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Settings size={14} />
          Calibrate
        </span>
      </ModalButton>
      {!microphonePractice.enabled ? (
        <ModalButton 
          variant="primary" 
          onClick={handleStartPractice}
          disabled={isPlaying || !selectedDeviceId}
        >
          Start Practice
        </ModalButton>
      ) : (
        <ModalButton variant="danger" onClick={handleStopPractice}>
          Stop Practice
        </ModalButton>
      )}
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Microphone Practice"
        icon={<Mic size={20} strokeWidth={1.5} />}
        size="md"
        footer={footer}
      >
        {error && <ModalAlert type="error">{error}</ModalAlert>}
        {!isSupported && <ModalAlert type="error">Microphone not supported in this browser.</ModalAlert>}

        {/* Device Selection */}
        <ModalSection>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: 0 }}>
            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceSelect(e.target.value)}
              disabled={isPlaying || microphonePractice.enabled}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--dpgen-border)',
                background: 'var(--dpgen-bg)',
                color: 'var(--dpgen-text)',
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {deviceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={refreshDevices}
              disabled={isPlaying}
              style={{
                padding: '0.5rem',
                background: 'var(--dpgen-bg)',
                border: '1px solid var(--dpgen-border)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                color: 'var(--dpgen-text)',
                flexShrink: 0,
              }}
              title="Refresh devices"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </ModalSection>

        {/* Settings - Compact */}
        <ModalSection title="Settings">
          <ModalRow label="Tolerance">
            <ModalSelect
              value={toleranceWindow}
              onChange={(v) => {
                setToleranceWindow(v);
                if (v !== 'custom') setMicrophonePracticeAccuracyWindow(parseInt(v, 10));
              }}
              options={toleranceOptions}
              disabled={isPlaying}
            />
          </ModalRow>

          <ModalRow label={`Sensitivity: ${sensitivity}%`}>
            <ModalSlider
              value={sensitivity}
              onChange={setSensitivity}
              min={CONSTANTS.AUDIO.SENSITIVITY_MIN}
              max={CONSTANTS.AUDIO.SENSITIVITY_MAX}
              disabled={isPlaying}
              showValue={false}
            />
          </ModalRow>

          <ModalRow label={`Threshold: ${threshold.toFixed(2)}`}>
            <ModalSlider
              value={threshold}
              onChange={setThreshold}
              min={CONSTANTS.AUDIO.THRESHOLD_MIN}
              max={CONSTANTS.AUDIO.THRESHOLD_MAX}
              step={0.01}
              disabled={isPlaying}
              showValue={false}
            />
          </ModalRow>
        </ModalSection>

        {/* Visual Feedback - Compact */}
        <ModalSection title="Feedback">
          <ModalRow label="Accuracy Colors">
            <ModalToggle
              checked={microphonePractice.visualFeedback}
              onChange={(v) => setMicrophoneVisualFeedback(v)}
              disabled={isPlaying}
            />
          </ModalRow>
          <ModalRow label="Timing (±ms)">
            <ModalToggle
              checked={microphonePractice.showTimingErrors}
              onChange={(v) => setMicrophoneShowTimingErrors(v)}
              disabled={isPlaying}
            />
          </ModalRow>
        </ModalSection>

        {/* Practice Stats */}
        {microphonePractice.enabled && (
          <ModalSection title="Stats">
            <div style={{ 
              fontSize: '0.7rem', 
              color: 'var(--dpgen-muted)', 
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {workletInfo.supported && !workletInfo.needsFallback ? (
                <><Zap size={12} /> AudioWorklet (~5ms accuracy)</>
              ) : (
                <><BarChart3 size={12} /> AnalyserNode (~25ms accuracy)</>
              )}
            </div>
            
            <ModalGrid cols={2}>
              <ModalStat label="Accuracy" value={`${stats.accuracy}%`} />
              <ModalStat label="Hits" value={`${stats.hits}/${stats.expected}`} />
              <ModalStat label="Avg Timing" value={`${stats.avgTiming}ms`} />
              {stats.dynamicAccuracy !== null && (
                <ModalStat 
                  label="Dynamic" 
                  value={`${stats.dynamicAccuracy}%`}
                  color={stats.dynamicAccuracy >= 80 ? '#22c55e' : stats.dynamicAccuracy >= 60 ? '#f59e0b' : '#ef4444'}
                />
              )}
            </ModalGrid>
            
            {(stats.ghostHits > 0 || stats.accentHits > 0) && (
              <div style={{ 
                marginTop: '0.5rem', 
                display: 'flex',
                gap: '1rem',
                fontSize: '0.75rem',
                color: 'var(--dpgen-muted)',
              }}>
                <span><span style={{ color: '#6b7280' }}>●</span> Ghost: {stats.ghostHits}</span>
                <span><span style={{ color: '#22c55e' }}>●</span> Normal: {stats.normalHits}</span>
                <span><span style={{ color: '#ef4444' }}>●</span> Accent: {stats.accentHits}</span>
              </div>
            )}
          </ModalSection>
        )}

        {/* Audio Ducking Notice - Collapsible */}
        <details style={{ marginTop: '0.5rem' }}>
          <summary style={{ 
            fontSize: '0.75rem', 
            color: '#f59e0b', 
            cursor: 'pointer',
            fontWeight: 500,
          }}>
            ⚠️ Audio quiet when mic active?
          </summary>
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--dpgen-muted)', 
            marginTop: '0.5rem',
            padding: '0.75rem',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '6px',
            lineHeight: 1.5,
          }}>
            <strong>Windows:</strong> Sound Settings → Communications → "Do nothing"<br/>
            <strong>Realtek:</strong> Disable "Echo cancellation" / "Audio ducking"<br/>
            <strong>Alternative:</strong> Use headphones
          </div>
        </details>
      </Modal>

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
    </>
  );
}
