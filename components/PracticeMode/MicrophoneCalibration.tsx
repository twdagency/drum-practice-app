/**
 * Microphone Latency Calibration Component
 * Compact design with auto-calibration feature
 * Uses React Portal to render above other modals
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/store/useStore';
import { useMicrophoneDevices } from '@/hooks/useMicrophoneDevices';
import { CONSTANTS } from '@/lib/utils/constants';
import { Mic, Zap, Target, Settings, X } from 'lucide-react';

interface CalibrationHit {
  time: number;
  level: number;
  timingError: number;
}

interface MicrophoneCalibrationProps {
  onClose: () => void;
  onApply?: (latency: number) => void;
}

type CalibrationMode = 'auto' | 'manual' | 'test';

export function MicrophoneCalibration({ onClose, onApply }: MicrophoneCalibrationProps) {
  const bpm = useStore((state) => state.bpm);
  const microphonePractice = useStore((state) => state.microphonePractice);
  const setMicrophoneLatencyAdjustment = useStore((state) => state.setMicrophoneLatencyAdjustment);
  const setMicrophoneSensitivity = useStore((state) => state.setMicrophoneSensitivity);
  const setMicrophoneThreshold = useStore((state) => state.setMicrophoneThreshold);
  
  const { devices } = useMicrophoneDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [latencyAdjustment, setLatencyAdjustment] = useState<number>(microphonePractice.latencyAdjustment);
  const [sensitivity, setSensitivity] = useState<number>(microphonePractice.sensitivity);
  const [threshold, setThreshold] = useState<number>(microphonePractice.threshold);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [mode, setMode] = useState<CalibrationMode>('auto');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Auto-calibration state
  const [autoCalActive, setAutoCalActive] = useState(false);
  const [autoCalHits, setAutoCalHits] = useState<number[]>([]);
  const [autoCalStatus, setAutoCalStatus] = useState<string>('');
  
  // Test mode state
  const [testActive, setTestActive] = useState(false);
  const [testHits, setTestHits] = useState<CalibrationHit[]>([]);
  const [testBeatIndex, setTestBeatIndex] = useState(0);
  
  // Manual mode state
  const [manualActive, setManualActive] = useState(false);
  const [manualHits, setManualHits] = useState<CalibrationHit[]>([]);
  const [manualBeatIndex, setManualBeatIndex] = useState(0);
  const manualIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const manualStartTimeRef = useRef<number>(0);
  const manualActiveRef = useRef<boolean>(false);
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const levelCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastHitTimeRef = useRef<number>(0);
  const testIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const testStartTimeRef = useRef<number>(0);
  
  // Refs to track active state (needed for interval callbacks to access current state)
  const autoCalActiveRef = useRef<boolean>(false);
  const testActiveRef = useRef<boolean>(false);
  const sensitivityRef = useRef<number>(sensitivity);
  const thresholdRef = useRef<number>(threshold);
  const latencyRef = useRef<number>(latencyAdjustment);
  const previousVolumeRef = useRef<number>(0);

  // Keep refs in sync with state (for interval callbacks)
  useEffect(() => {
    autoCalActiveRef.current = autoCalActive;
  }, [autoCalActive]);
  
  useEffect(() => {
    testActiveRef.current = testActive;
  }, [testActive]);
  
  useEffect(() => {
    manualActiveRef.current = manualActive;
  }, [manualActive]);
  
  useEffect(() => {
    sensitivityRef.current = sensitivity;
    thresholdRef.current = threshold;
    latencyRef.current = latencyAdjustment;
  }, [sensitivity, threshold, latencyAdjustment]);

  // Initialize device from localStorage (with fallback matching by label)
  useEffect(() => {
    if (devices.length === 0) return;
    
    // Already have a valid selection
    if (selectedDeviceId && devices.some(d => d.deviceId === selectedDeviceId)) {
      return;
    }
    
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dpgen_microphone_practice_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Try to match by device ID
          if (parsed.deviceId && devices.some(d => d.deviceId === parsed.deviceId)) {
            setSelectedDeviceId(parsed.deviceId);
            return;
          }
          // Fallback: try to match by label (device IDs can change between sessions)
          if (parsed.deviceLabel) {
            const matchByLabel = devices.find(d => d.label === parsed.deviceLabel);
            if (matchByLabel) {
              setSelectedDeviceId(matchByLabel.deviceId);
              // Update saved settings with new deviceId
              const settings = { ...parsed, deviceId: matchByLabel.deviceId };
              localStorage.setItem('dpgen_microphone_practice_settings', JSON.stringify(settings));
              return;
            }
          }
        }
      } catch (e) {}
    }
    // No valid saved device, select first one
    if (!selectedDeviceId && devices.length > 0) {
      setSelectedDeviceId(devices[0].deviceId);
    }
  }, [devices, selectedDeviceId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  const stopAll = () => {
    if (levelCheckIntervalRef.current) {
      clearInterval(levelCheckIntervalRef.current);
      levelCheckIntervalRef.current = null;
    }
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    if (manualIntervalRef.current) {
      clearInterval(manualIntervalRef.current);
      manualIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAutoCalActive(false);
    autoCalActiveRef.current = false;
    setTestActive(false);
    testActiveRef.current = false;
    setManualActive(false);
    manualActiveRef.current = false;
    setAudioLevel(0);
  };

  const setupMicrophone = async () => {
    if (!selectedDeviceId) return false;
    
    let newStream: MediaStream | null = null;
    
    // Try multiple approaches to get microphone access
    try {
      newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: selectedDeviceId } },
      });
    } catch (exactErr) {
      console.warn('[MIC Calibration] Exact deviceId failed, trying preferred:', exactErr);
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: selectedDeviceId },
        });
      } catch (preferredErr) {
        console.warn('[MIC Calibration] Preferred deviceId failed, trying any:', preferredErr);
        try {
          newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (anyErr) {
          console.error('[MIC Calibration] All attempts failed:', anyErr);
          return false;
        }
      }
    }
    
    if (!newStream) return false;
    
    try {
      streamRef.current = newStream;
      setStream(newStream);
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      await ctx.resume();
      audioContextRef.current = ctx;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;
      
      const source = ctx.createMediaStreamSource(newStream);
      source.connect(analyser);
      
      dataArrayRef.current = new Uint8Array(analyser.fftSize);
      
      // Start level monitoring
      levelCheckIntervalRef.current = setInterval(() => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
        
        let maxAmp = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const amp = Math.abs(dataArrayRef.current[i] - 128) / 128;
          if (amp > maxAmp) maxAmp = amp;
        }
        
        setAudioLevel(maxAmp * 100);
        
        // Calculate transient (volume increase) for better hit detection
        const volumeIncrease = maxAmp - previousVolumeRef.current;
        const volumeRatio = previousVolumeRef.current > 0.01 ? maxAmp / previousVolumeRef.current : (maxAmp > 0.05 ? 5 : 1);
        
        // Detect hits for auto-calibration - use strict transient detection
        if (autoCalActiveRef.current) {
          const now = performance.now();
          // For auto-cal, require a VERY sharp transient to avoid double-triggering on drum bounce
          const autoCalThreshold = 0.05;
          // Require significant increase AND high ratio (sharp attack)
          const hasStrongTransient = volumeIncrease > 0.08 && volumeRatio > 2.0;
          // Must have been quite quiet before (below 20% of threshold)
          const wasQuiet = previousVolumeRef.current < autoCalThreshold * 0.2;
          
          // Use longer cooldown (200ms) to prevent double-triggers from drum bounce/decay
          if (maxAmp > autoCalThreshold && (hasStrongTransient || wasQuiet) && now - lastHitTimeRef.current > 200) {
            lastHitTimeRef.current = now;
            previousVolumeRef.current = maxAmp;
            setAutoCalHits(prev => [...prev, maxAmp]);
            console.log(`[Calibration] Hit detected: level=${(maxAmp * 100).toFixed(1)}%`);
          }
        }
        
        // Detect hits for test mode - use transient detection
        if (testActiveRef.current) {
          const now = performance.now();
          const sensitivityMult = sensitivityRef.current / 100;
          const adjustedThreshold = thresholdRef.current / sensitivityMult;
          
          // Require transient (sharp attack) - prevents continuous noise from triggering
          const minIncrease = Math.max(adjustedThreshold * 0.15, previousVolumeRef.current * 0.5);
          const hasSharpTransient = volumeIncrease > minIncrease && volumeRatio > 1.5;
          const wasQuiet = previousVolumeRef.current < adjustedThreshold * 0.5;
          const crossedFromSilence = maxAmp > adjustedThreshold && previousVolumeRef.current < adjustedThreshold * 0.3;
          
          const shouldHit = maxAmp > adjustedThreshold && 
                           (hasSharpTransient || crossedFromSilence || (wasQuiet && volumeIncrease > adjustedThreshold * 0.2));
          
          if (shouldHit && now - lastHitTimeRef.current > 50) {
            lastHitTimeRef.current = now;
            previousVolumeRef.current = maxAmp;
            const elapsed = now - testStartTimeRef.current;
            const msPerBeat = 60000 / bpm;
            const closestBeat = Math.round(elapsed / msPerBeat);
            const expectedTime = closestBeat * msPerBeat;
            const timingError = elapsed - expectedTime - latencyRef.current;
            
            setTestHits(prev => [...prev, { time: elapsed, level: maxAmp, timingError }]);
          }
        }
        
        // Detect hits for manual mode - use transient detection
        if (manualActiveRef.current) {
          const now = performance.now();
          const sensitivityMult = sensitivityRef.current / 100;
          const adjustedThreshold = thresholdRef.current / sensitivityMult;
          
          // Require transient (sharp attack)
          const minIncrease = Math.max(adjustedThreshold * 0.15, previousVolumeRef.current * 0.5);
          const hasSharpTransient = volumeIncrease > minIncrease && volumeRatio > 1.5;
          const wasQuiet = previousVolumeRef.current < adjustedThreshold * 0.5;
          const crossedFromSilence = maxAmp > adjustedThreshold && previousVolumeRef.current < adjustedThreshold * 0.3;
          
          const shouldHit = maxAmp > adjustedThreshold && 
                           (hasSharpTransient || crossedFromSilence || (wasQuiet && volumeIncrease > adjustedThreshold * 0.2));
          
          if (shouldHit && now - lastHitTimeRef.current > 50) {
            lastHitTimeRef.current = now;
            previousVolumeRef.current = maxAmp;
            const elapsed = now - manualStartTimeRef.current;
            const msPerBeat = 60000 / bpm;
            const closestBeat = Math.round(elapsed / msPerBeat);
            const expectedTime = closestBeat * msPerBeat;
            const timingError = elapsed - expectedTime - latencyRef.current;
            
            setManualHits(prev => {
              const updated = [...prev, { time: elapsed, level: maxAmp, timingError }];
              // Keep only last 8 hits
              return updated.slice(-8);
            });
          }
        }
        
        // Update previous volume for transient detection
        // Track volume drops so we can detect the next rise
        if (maxAmp < previousVolumeRef.current) {
          previousVolumeRef.current = maxAmp * 0.9 + previousVolumeRef.current * 0.1;
        } else if (maxAmp < 0.03) {
          previousVolumeRef.current = maxAmp;
        } else if (!autoCalActiveRef.current && !testActiveRef.current && !manualActiveRef.current) {
          // When not actively detecting, let volume track naturally
          previousVolumeRef.current = maxAmp;
        }
      }, 20);
      
      return true;
    } catch (err) {
      console.error('Failed to setup microphone:', err);
      return false;
    }
  };

  // Auto-calibration
  const startAutoCalibration = async () => {
    const success = await setupMicrophone();
    if (!success) return;
    
    setAutoCalHits([]);
    setAutoCalActive(true);
    autoCalActiveRef.current = true; // Set ref immediately for interval callback
    setAutoCalStatus('Hit your drum/pad 5-10 times at normal volume...');
    console.log('[Calibration] Auto-calibration started');
  };

  const finishAutoCalibration = () => {
    setAutoCalActive(false);
    autoCalActiveRef.current = false;
    
    if (autoCalHits.length < 3) {
      setAutoCalStatus('Not enough hits detected. Try again.');
      return;
    }
    
    // Calculate optimal threshold from hits
    const avgLevel = autoCalHits.reduce((a, b) => a + b, 0) / autoCalHits.length;
    const minLevel = Math.min(...autoCalHits);
    
    // Set threshold to 60% of minimum hit level (to catch ghost notes)
    const optimalThreshold = Math.max(0.05, Math.min(0.5, minLevel * 0.6));
    
    // Set sensitivity based on average level
    // If hits are quiet, increase sensitivity; if loud, decrease
    const optimalSensitivity = Math.max(30, Math.min(100, Math.round(70 * (0.3 / avgLevel))));
    
    setThreshold(optimalThreshold);
    setSensitivity(optimalSensitivity);
    setAutoCalStatus(`✓ Calibrated! Threshold: ${optimalThreshold.toFixed(2)}, Sensitivity: ${optimalSensitivity}%`);
    
    stopAll();
  };

  // Test mode
  const startTest = async () => {
    const success = await setupMicrophone();
    if (!success) return;
    
    setTestHits([]);
    setTestBeatIndex(0);
    setTestActive(true);
    testActiveRef.current = true; // Set ref immediately for interval callback
    testStartTimeRef.current = performance.now();
    
    // Play click sounds
    const msPerBeat = 60000 / bpm;
    let beatCount = 0;
    
    const playClick = async () => {
      if (beatCount >= 8) {
        stopTest();
        return;
      }
      
      // Play click
      const ctx = audioContextRef.current;
      if (ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = beatCount % 4 === 0 ? 800 : 600;
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      }
      
      setTestBeatIndex(beatCount);
      beatCount++;
    };
    
    playClick();
    testIntervalRef.current = setInterval(playClick, msPerBeat);
  };

  const stopTest = () => {
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    setTestActive(false);
    testActiveRef.current = false;
    
    // Calculate average timing error and auto-suggest latency adjustment
    // The timing error formula is: elapsed - expectedTime - latencyAdjustment
    // If hits are early (negative error): latencyAdjustment is too high, need to reduce it
    // If hits are late (positive error): latencyAdjustment is too low, need to increase it
    // So: newLatency = currentLatency + avgError (add error to compensate)
    if (testHits.length > 0) {
      const avgError = testHits.reduce((sum, h) => sum + h.timingError, 0) / testHits.length;
      const suggestedLatency = Math.round(latencyAdjustment + avgError);
      setLatencyAdjustment(Math.max(-500, Math.min(500, suggestedLatency)));
    }
  };

  // Manual mode - play clicks and show timing
  const startManual = async () => {
    const success = await setupMicrophone();
    if (!success) return;
    
    setManualHits([]);
    setManualBeatIndex(0);
    setManualActive(true);
    manualActiveRef.current = true;
    manualStartTimeRef.current = performance.now();
    
    const msPerBeat = 60000 / bpm;
    let beatCount = 0;
    
    const playClick = async () => {
      const ctx = audioContextRef.current;
      if (ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = beatCount % 4 === 0 ? 800 : 600;
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      }
      
      setManualBeatIndex(beatCount % 4);
      beatCount++;
    };
    
    playClick();
    manualIntervalRef.current = setInterval(playClick, msPerBeat);
  };

  const stopManual = () => {
    if (manualIntervalRef.current) {
      clearInterval(manualIntervalRef.current);
      manualIntervalRef.current = null;
    }
    setManualActive(false);
    manualActiveRef.current = false;
  };

  const handleApply = () => {
    setMicrophoneLatencyAdjustment(latencyAdjustment);
    setMicrophoneSensitivity(sensitivity);
    setMicrophoneThreshold(threshold);
    
    if (typeof window !== 'undefined') {
      try {
        const existing = localStorage.getItem('dpgen_microphone_practice_settings');
        const settings = existing ? JSON.parse(existing) : {};
        settings.deviceId = selectedDeviceId;
        // Save device label for fallback matching (device IDs can change between sessions)
        const device = devices.find(d => d.deviceId === selectedDeviceId);
        if (device) {
          settings.deviceLabel = device.label;
        }
        settings.latencyAdjustment = latencyAdjustment;
        settings.sensitivity = sensitivity;
        settings.threshold = threshold;
        localStorage.setItem('dpgen_microphone_practice_settings', JSON.stringify(settings));
      } catch (e) {}
    }
    
    if (onApply) onApply(latencyAdjustment);
    stopAll();
    onClose();
  };

  const testStats = testHits.length > 0 ? {
    perfect: testHits.filter(h => Math.abs(h.timingError) <= 25).length,
    good: testHits.filter(h => Math.abs(h.timingError) > 25 && Math.abs(h.timingError) <= 50).length,
    off: testHits.filter(h => Math.abs(h.timingError) > 50).length,
    avgError: Math.round(testHits.reduce((sum, h) => sum + h.timingError, 0) / testHits.length),
  } : null;

  // Use portal to render at document body level, above other modals
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <div
      onClick={(e) => e.target === e.currentTarget && (stopAll(), onClose())}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--dpgen-card)',
          borderRadius: '12px',
          padding: '1.25rem',
          maxWidth: '420px',
          width: '100%',
          maxHeight: 'calc(100vh - 2rem)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mic size={20} strokeWidth={1.5} style={{ color: 'var(--dpgen-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Calibration</h2>
          </div>
          <button
            onClick={() => (stopAll(), onClose())}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dpgen-muted)', padding: '4px', display: 'flex' }}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Device Selection - Compact */}
        <select
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          disabled={autoCalActive || testActive}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid var(--dpgen-border)',
            background: 'var(--dpgen-bg)',
            color: 'var(--dpgen-text)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}
        >
          <option value="">Select microphone...</option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
          ))}
        </select>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {([
            { key: 'auto' as CalibrationMode, label: 'Auto', Icon: Zap },
            { key: 'test' as CalibrationMode, label: 'Test', Icon: Target },
            { key: 'manual' as CalibrationMode, label: 'Manual', Icon: Settings },
          ]).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => { stopAll(); setMode(key); }}
              disabled={autoCalActive || testActive}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                border: mode === key ? '2px solid var(--dpgen-primary)' : '1px solid var(--dpgen-border)',
                borderRadius: '6px',
                background: mode === key ? 'var(--dpgen-primary)' : 'var(--dpgen-bg)',
                color: mode === key ? 'white' : 'var(--dpgen-text)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
              }}
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        {/* Content Area - Scrollable if needed */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {/* Auto Calibration Mode */}
          {mode === 'auto' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', margin: '0 0 1rem' }}>
                Hit your drum/pad at normal volume. We'll detect the optimal settings automatically.
              </p>
              
              {/* Level Meter with threshold indicator */}
              <div style={{
                height: '24px',
                background: 'var(--dpgen-bg)',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '0.75rem',
                position: 'relative',
              }}>
                {/* Threshold line at 5% */}
                <div style={{
                  position: 'absolute',
                  left: '5%',
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  background: '#22c55e',
                  zIndex: 2,
                }} />
                {/* Level bar */}
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, audioLevel)}%`,
                  background: audioLevel > 40 ? '#ef4444' : audioLevel > 5 ? '#22c55e' : '#6b7280',
                  transition: 'width 0.05s',
                }} />
                {/* Level text */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: audioLevel > 30 ? 'white' : 'var(--dpgen-text)',
                  pointerEvents: 'none',
                }}>
                  {audioLevel.toFixed(0)}%
                </div>
              </div>
              
              {/* Hit Counter with animation */}
              {autoCalActive && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 700,
                    color: autoCalHits.length > 0 ? '#22c55e' : 'var(--dpgen-text)',
                    transition: 'transform 0.1s',
                    transform: autoCalHits.length > 0 ? 'scale(1)' : 'scale(0.9)',
                  }}>
                    {autoCalHits.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>
                    hits detected {autoCalHits.length > 0 && `(last: ${(autoCalHits[autoCalHits.length - 1] * 100).toFixed(0)}%)`}
                  </div>
                </div>
              )}
              
              {autoCalStatus && (
                <p style={{ fontSize: '0.8rem', color: autoCalStatus.startsWith('✓') ? '#22c55e' : 'var(--dpgen-muted)', marginBottom: '1rem' }}>
                  {autoCalStatus}
                </p>
              )}
              
              {!autoCalActive ? (
                <button
                  onClick={startAutoCalibration}
                  disabled={!selectedDeviceId}
                  style={{
                    padding: '0.75rem 2rem',
                    background: 'var(--dpgen-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Start Auto-Calibration
                </button>
              ) : (
                <button
                  onClick={finishAutoCalibration}
                  disabled={autoCalHits.length < 3}
                  style={{
                    padding: '0.75rem 2rem',
                    background: autoCalHits.length >= 3 ? '#22c55e' : '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: autoCalHits.length >= 3 ? 'pointer' : 'not-allowed',
                    fontWeight: 500,
                  }}
                >
                  {autoCalHits.length >= 3 ? 'Apply Settings' : `Need ${3 - autoCalHits.length} more hits`}
                </button>
              )}
            </div>
          )}

          {/* Test Mode */}
          {mode === 'test' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', margin: '0 0 1rem' }}>
                Play along with the clicks. We'll measure your timing and suggest latency adjustment.
              </p>
              
              {/* Latency Adjustment */}
              <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>Latency: {latencyAdjustment}ms</label>
                  <input
                    type="number"
                    min={-500}
                    max={500}
                    value={latencyAdjustment}
                    onChange={(e) => setLatencyAdjustment(Math.max(-500, Math.min(500, parseInt(e.target.value) || 0)))}
                    disabled={testActive}
                    style={{
                      width: '70px',
                      padding: '2px 6px',
                      fontSize: '0.75rem',
                      border: '1px solid var(--dpgen-border)',
                      borderRadius: '4px',
                      background: 'var(--dpgen-bg)',
                      color: 'var(--dpgen-text)',
                      textAlign: 'right',
                    }}
                  />
                </div>
                <input
                  type="range"
                  min={-500}
                  max={500}
                  value={latencyAdjustment}
                  onChange={(e) => setLatencyAdjustment(parseInt(e.target.value))}
                  disabled={testActive}
                  style={{ width: '100%' }}
                />
              </div>
              
              {/* Beat Indicator */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: testActive && testBeatIndex % 4 === i ? 'var(--dpgen-primary)' : 'var(--dpgen-bg)',
                    border: '2px solid var(--dpgen-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: testActive && testBeatIndex % 4 === i ? 'white' : 'var(--dpgen-text)',
                  }}>
                    {i + 1}
                  </div>
                ))}
              </div>
              
              {/* Test Results */}
              {testStats && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ color: '#22c55e' }}>✓ {testStats.perfect}</span>
                    <span style={{ color: '#f59e0b' }}>● {testStats.good}</span>
                    <span style={{ color: '#ef4444' }}>✗ {testStats.off}</span>
                    <span>Avg: {testStats.avgError > 0 ? '+' : ''}{testStats.avgError}ms</span>
                  </div>
                  
                  {/* Auto-adjust suggestion */}
                  {!testActive && Math.abs(testStats.avgError) > 10 && (
                    <div style={{
                      padding: '0.5rem',
                      background: 'var(--dpgen-bg)',
                      borderRadius: '6px',
                      marginBottom: '0.75rem',
                      fontSize: '0.8rem',
                    }}>
                      <span style={{ color: 'var(--dpgen-muted)' }}>
                        {testStats.avgError < 0 ? 'Hits are early' : 'Hits are late'} - 
                      </span>
                      <button
                        onClick={() => {
                          // Add error to compensate: if early (negative), reduce latency; if late (positive), increase
                          const suggested = Math.round(latencyAdjustment + testStats.avgError);
                          setLatencyAdjustment(Math.max(-500, Math.min(500, suggested)));
                        }}
                        style={{
                          marginLeft: '0.5rem',
                          padding: '2px 8px',
                          background: 'var(--dpgen-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        Set to {Math.round(latencyAdjustment + testStats.avgError)}ms
                      </button>
                    </div>
                  )}
                </>
              )}
              
              <button
                onClick={testActive ? stopTest : startTest}
                disabled={!selectedDeviceId}
                style={{
                  padding: '0.75rem 2rem',
                  background: testActive ? '#ef4444' : 'var(--dpgen-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {testActive ? 'Stop Test' : 'Start Test'}
              </button>
            </div>
          )}

          {/* Manual Mode */}
          {mode === 'manual' && (
            <div>
              {/* Compact Settings Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>Sensitivity: {sensitivity}%</label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={sensitivity}
                    onChange={(e) => setSensitivity(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>Threshold: {threshold.toFixed(2)}</label>
                  <input
                    type="range"
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>Latency: {latencyAdjustment}ms</label>
                  <input
                    type="number"
                    min={-500}
                    max={500}
                    value={latencyAdjustment}
                    onChange={(e) => setLatencyAdjustment(Math.max(-500, Math.min(500, parseInt(e.target.value) || 0)))}
                    style={{
                      width: '70px',
                      padding: '2px 6px',
                      fontSize: '0.75rem',
                      border: '1px solid var(--dpgen-border)',
                      borderRadius: '4px',
                      background: 'var(--dpgen-bg)',
                      color: 'var(--dpgen-text)',
                      textAlign: 'right',
                    }}
                  />
                </div>
                <input
                  type="range"
                  min={-500}
                  max={500}
                  value={latencyAdjustment}
                  onChange={(e) => setLatencyAdjustment(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              {/* Beat indicator for manual mode */}
              {manualActive && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: manualBeatIndex === i ? 'var(--dpgen-primary)' : 'var(--dpgen-bg)',
                      border: '2px solid var(--dpgen-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: manualBeatIndex === i ? 'white' : 'var(--dpgen-text)',
                      transition: 'all 0.1s',
                    }}>
                      {i + 1}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Timing hits display */}
              {manualHits.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.375rem', 
                  marginBottom: '0.75rem',
                  justifyContent: 'center',
                }}>
                  {manualHits.map((hit, idx) => {
                    const absError = Math.abs(hit.timingError);
                    const color = absError <= 25 ? '#22c55e' : absError <= 50 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={idx} style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: color + '20',
                        border: `1px solid ${color}`,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: color,
                      }}>
                        {hit.timingError >= 0 ? '+' : ''}{Math.round(hit.timingError)}ms
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Live Level with Zones */}
              <div style={{
                height: '32px',
                background: 'var(--dpgen-bg)',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '0.75rem',
              }}>
                {/* Zone markers */}
                <div style={{ position: 'absolute', left: `${threshold * 100}%`, top: 0, bottom: 0, width: '2px', background: '#22c55e', zIndex: 2 }} />
                <div style={{ position: 'absolute', left: '40%', top: 0, bottom: 0, width: '2px', background: '#ef4444', zIndex: 2 }} />
                
                {/* Level bar */}
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, audioLevel)}%`,
                  background: audioLevel >= 40 ? '#ef4444' : audioLevel >= threshold * 100 ? '#22c55e' : '#6b7280',
                  transition: 'width 0.03s',
                }} />
                
                {/* Labels */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', fontSize: '0.65rem', color: 'var(--dpgen-muted)', pointerEvents: 'none' }}>
                  <span>Ghost</span>
                  <span style={{ color: '#22c55e' }}>Normal</span>
                  <span style={{ color: '#ef4444' }}>Accent</span>
                </div>
              </div>
              
              {/* Play clicks button */}
              <button
                onClick={manualActive ? stopManual : startManual}
                disabled={!selectedDeviceId}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: manualActive ? '#ef4444' : 'var(--dpgen-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                }}
              >
                {manualActive ? 'Stop Clicks' : 'Play Clicks to Test'}
              </button>
              
              <p style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)', margin: 0, textAlign: 'center' }}>
                Play along with clicks. Adjust latency until timing shows close to 0ms.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--dpgen-border)' }}>
          <button
            onClick={() => (stopAll(), onClose())}
            style={{
              flex: 1,
              padding: '0.625rem',
              background: 'var(--dpgen-bg)',
              color: 'var(--dpgen-text)',
              border: '1px solid var(--dpgen-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={autoCalActive || testActive}
            style={{
              flex: 1,
              padding: '0.625rem',
              background: 'var(--dpgen-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
