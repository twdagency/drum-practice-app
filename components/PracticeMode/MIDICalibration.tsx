/**
 * MIDI Latency Calibration Component
 * Compact design with auto-calibration feature
 * Uses React Portal to render above other modals
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/store/useStore';
import { useMIDIDevices } from '@/hooks/useMIDIDevices';
import { CONSTANTS } from '@/lib/utils/constants';
import { Music, Zap, Target, Settings, X } from 'lucide-react';

interface CalibrationHit {
  time: number;
  note: number;
  velocity: number;
  timingError: number;
}

interface MIDICalibrationProps {
  onClose: () => void;
  mode?: 'practice' | 'recording';
  onApply?: (latency: number) => void;
}

type CalibrationMode = 'auto' | 'test' | 'manual';

export function MIDICalibration({ onClose, mode: practiceMode = 'practice', onApply }: MIDICalibrationProps) {
  const bpm = useStore((state) => state.bpm);
  const midiPractice = useStore((state) => state.midiPractice);
  const midiRecording = useStore((state) => state.midiRecording);
  const setMIDILatencyAdjustment = useStore((state) => state.setMIDILatencyAdjustment);
  const setMIDIRecordingLatencyAdjustment = useStore((state) => state.setMIDIRecordingLatencyAdjustment);
  
  const { devices, access, refreshDevices } = useMIDIDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  // Use the appropriate latency adjustment based on mode
  const currentLatencyAdjustment = practiceMode === 'recording' 
    ? midiRecording.latencyAdjustment 
    : midiPractice.latencyAdjustment;
  const [latencyAdjustment, setLatencyAdjustment] = useState<number>(currentLatencyAdjustment);
  
  // Get the appropriate input based on mode
  const currentInput = practiceMode === 'recording' ? midiRecording.input : midiPractice.input;
  
  const [calMode, setCalMode] = useState<CalibrationMode>('auto');
  
  // Auto-calibration state
  const [autoCalActive, setAutoCalActive] = useState(false);
  const [autoCalHits, setAutoCalHits] = useState<CalibrationHit[]>([]);
  const [autoCalStatus, setAutoCalStatus] = useState<string>('');
  
  // Test mode state
  const [testActive, setTestActive] = useState(false);
  const [testHits, setTestHits] = useState<CalibrationHit[]>([]);
  const [testBeatIndex, setTestBeatIndex] = useState(0);
  
  // Manual mode state
  const [manualActive, setManualActive] = useState(false);
  const [manualHits, setManualHits] = useState<CalibrationHit[]>([]);
  const [manualBeatIndex, setManualBeatIndex] = useState(0);
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const midiInputRef = useRef<MIDIInput | null>(null);
  const midiHandlerRef = useRef<((event: Event) => void) | null>(null);
  const testIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const manualIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const autoCalActiveRef = useRef<boolean>(false);
  const testActiveRef = useRef<boolean>(false);
  const manualActiveRef = useRef<boolean>(false);
  const latencyRef = useRef<number>(latencyAdjustment);
  const lastHitTimeRef = useRef<number>(0);

  // Keep refs in sync
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
    latencyRef.current = latencyAdjustment;
  }, [latencyAdjustment]);

  // Initialize selected device
  useEffect(() => {
    if (currentInput) {
      setSelectedDeviceId(currentInput.id);
    } else if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [currentInput, devices, selectedDeviceId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);
  
  const stopAll = () => {
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    if (manualIntervalRef.current) {
      clearInterval(manualIntervalRef.current);
      manualIntervalRef.current = null;
    }
    // Remove event listener properly
    if (midiInputRef.current && midiHandlerRef.current) {
      console.log('[MIDI Calibration] Removing MIDI event listener');
      midiInputRef.current.removeEventListener('midimessage', midiHandlerRef.current);
      midiHandlerRef.current = null;
      midiInputRef.current = null;
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
  };

  const setupMIDI = async (): Promise<MIDIInput | null> => {
    console.log('[MIDI Calibration] setupMIDI called, selectedDeviceId:', selectedDeviceId);
    
    if (!selectedDeviceId) {
      console.log('[MIDI Calibration] No device selected');
      return null;
    }
    
    // Get MIDI access - either from hook or request fresh
    let midiAccess: MIDIAccess | null = access;
    
    if (!midiAccess) {
      console.log('[MIDI Calibration] No access from hook, requesting directly...');
      try {
        midiAccess = await navigator.requestMIDIAccess({ sysex: false });
        console.log('[MIDI Calibration] Got fresh MIDI access');
      } catch (err) {
        console.error('[MIDI Calibration] Failed to get MIDI access:', err);
        return null;
      }
    }
    
    if (!midiAccess) {
      console.log('[MIDI Calibration] Still no MIDI access');
      return null;
    }
    
    // Log available inputs
    console.log('[MIDI Calibration] Available inputs:');
    midiAccess.inputs.forEach((input, id) => {
      console.log(`  - ${input.name} (${id}) state=${input.state}`);
    });
    
    // Get the input from access
    const input = midiAccess.inputs.get(selectedDeviceId);
    console.log('[MIDI Calibration] Looking for deviceId:', selectedDeviceId);
    console.log('[MIDI Calibration] Got input:', input ? `${input.name} (${input.id})` : 'null');
    
    if (!input) {
      console.log('[MIDI Calibration] Input not found for deviceId:', selectedDeviceId);
      return null;
    }
    
    // Create audio context for click sounds
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      await audioContextRef.current.resume();
    }
    
    midiInputRef.current = input;
    console.log('[MIDI Calibration] MIDI input ready:', input.name);
    return input;
  };

  const handleMIDIMessage = (event: Event) => {
    console.log('[MIDI Calibration] handleMIDIMessage called, event type:', event.type);
    
    // Type assertion - Web MIDI API uses MIDIMessageEvent
    const midiEvent = event as any;
    const data = midiEvent.data;
    
    if (!data || data.length < 3) {
      console.log('[MIDI Calibration] Invalid MIDI message, data:', data);
      return;
    }
    
    const [status, note, velocity] = data;
    
    // Accept note-on messages (status 144-159) on any channel
    if (status >= 144 && status <= 159 && velocity > 0) {
      console.log(`[MIDI Calibration] Note-on: note=${note}, velocity=${velocity}, auto=${autoCalActiveRef.current}, test=${testActiveRef.current}, manual=${manualActiveRef.current}`);
      
      // Check if any mode is active
      if (!autoCalActiveRef.current && !testActiveRef.current && !manualActiveRef.current) {
        console.log('[MIDI Calibration] No calibration mode active, ignoring hit');
        return;
      }
      
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      
      // Prevent double-triggers (100ms cooldown)
      if (now - lastHitTimeRef.current < 100) {
        console.log('[MIDI Calibration] Blocked by cooldown');
        return;
      }
      lastHitTimeRef.current = now;
      
      const msPerBeat = 60000 / bpm;
      const closestBeat = Math.round(elapsed / msPerBeat);
      const expectedTime = closestBeat * msPerBeat;
      const timingError = elapsed - expectedTime - latencyRef.current;
      
      const hit: CalibrationHit = { time: elapsed, note, velocity, timingError };
      
      if (autoCalActiveRef.current) {
        setAutoCalHits(prev => [...prev, hit]);
        console.log(`[MIDI Calibration] Auto-cal hit: note=${note}, timing=${timingError.toFixed(1)}ms`);
      }
      
      if (testActiveRef.current) {
        setTestHits(prev => [...prev, hit]);
      }
      
      if (manualActiveRef.current) {
        setManualHits(prev => {
          const updated = [...prev, hit];
          return updated.slice(-8); // Keep last 8
        });
      }
    }
  };

  const playClick = async (isAccent: boolean) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    if (ctx.state === 'suspended') await ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = isAccent ? 800 : 600;
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  };

  // Auto-calibration
  const startAutoCalibration = async () => {
    const input = await setupMIDI();
    if (!input) {
      console.log('[MIDI Calibration] Auto-cal failed: no input');
      return;
    }
    
    // Set state BEFORE attaching handler to ensure refs are ready
    setAutoCalHits([]);
    setAutoCalActive(true);
    autoCalActiveRef.current = true;  // Set ref immediately (state update is async)
    startTimeRef.current = performance.now();
    setAutoCalStatus('Play your MIDI drum/pad with the clicks...');
    
    // Now attach the handler using addEventListener (allows coexistence with practice mode)
    // Remove any existing handler first
    if (midiHandlerRef.current) {
      input.removeEventListener('midimessage', midiHandlerRef.current);
    }
    midiHandlerRef.current = handleMIDIMessage;
    input.addEventListener('midimessage', handleMIDIMessage);
    console.log('[MIDI Calibration] Handler attached via addEventListener to:', input.name);
    
    // Play clicks for 8 beats
    const msPerBeat = 60000 / bpm;
    let beatCount = 0;
    
    const click = () => {
      if (beatCount >= 8 || !autoCalActiveRef.current) {
        if (testIntervalRef.current) {
          clearInterval(testIntervalRef.current);
          testIntervalRef.current = null;
        }
        return;
      }
      playClick(beatCount % 4 === 0);
      beatCount++;
    };
    
    click();
    testIntervalRef.current = setInterval(click, msPerBeat);
  };

  const finishAutoCalibration = () => {
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    setAutoCalActive(false);
    autoCalActiveRef.current = false;
    
    if (autoCalHits.length < 3) {
      setAutoCalStatus('Not enough hits detected. Try again.');
      return;
    }
    
    // Calculate average timing error and suggest latency adjustment
    const avgError = autoCalHits.reduce((sum, h) => sum + h.timingError, 0) / autoCalHits.length;
    const suggestedLatency = Math.round(latencyAdjustment + avgError);
    const clampedLatency = Math.max(-500, Math.min(500, suggestedLatency));
    
    setLatencyAdjustment(clampedLatency);
    setAutoCalStatus(`✓ Calibrated! Latency set to ${clampedLatency}ms (avg error was ${avgError > 0 ? '+' : ''}${avgError.toFixed(0)}ms)`);
    
    // Remove event listener
    if (midiInputRef.current && midiHandlerRef.current) {
      midiInputRef.current.removeEventListener('midimessage', midiHandlerRef.current);
      midiHandlerRef.current = null;
    }
  };

  // Test mode
  const startTest = async () => {
    const input = await setupMIDI();
    if (!input) {
      console.log('[MIDI Calibration] Test failed: no input');
      return;
    }
    
    // Set state BEFORE attaching handler to ensure refs are ready
    setTestHits([]);
    setTestBeatIndex(0);
    setTestActive(true);
    testActiveRef.current = true;  // Set ref immediately
    startTimeRef.current = performance.now();
    
    // Now attach the handler using addEventListener
    if (midiHandlerRef.current) {
      input.removeEventListener('midimessage', midiHandlerRef.current);
    }
    midiHandlerRef.current = handleMIDIMessage;
    input.addEventListener('midimessage', handleMIDIMessage);
    console.log('[MIDI Calibration] Handler attached via addEventListener to:', input.name);
    
    const msPerBeat = 60000 / bpm;
    let beatCount = 0;
    
    const click = () => {
      if (beatCount >= 8) {
        stopTest();
        return;
      }
      
      playClick(beatCount % 4 === 0);
      setTestBeatIndex(beatCount);
      beatCount++;
    };
    
    click();
    testIntervalRef.current = setInterval(click, msPerBeat);
  };

  const stopTest = () => {
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    setTestActive(false);
    testActiveRef.current = false;
    
    // Auto-suggest latency from test hits
    if (testHits.length > 0) {
      const avgError = testHits.reduce((sum, h) => sum + h.timingError, 0) / testHits.length;
      const suggestedLatency = Math.round(latencyAdjustment + avgError);
      setLatencyAdjustment(Math.max(-500, Math.min(500, suggestedLatency)));
    }
    
    // Remove event listener
    if (midiInputRef.current && midiHandlerRef.current) {
      midiInputRef.current.removeEventListener('midimessage', midiHandlerRef.current);
      midiHandlerRef.current = null;
    }
  };

  // Manual mode
  const startManual = async () => {
    const input = await setupMIDI();
    if (!input) {
      console.log('[MIDI Calibration] Manual failed: no input');
      return;
    }
    
    // Set state BEFORE attaching handler to ensure refs are ready
    setManualHits([]);
    setManualBeatIndex(0);
    setManualActive(true);
    manualActiveRef.current = true;  // Set ref immediately
    startTimeRef.current = performance.now();
    
    // Now attach the handler using addEventListener
    if (midiHandlerRef.current) {
      input.removeEventListener('midimessage', midiHandlerRef.current);
    }
    midiHandlerRef.current = handleMIDIMessage;
    input.addEventListener('midimessage', handleMIDIMessage);
    console.log('[MIDI Calibration] Handler attached via addEventListener to:', input.name);
    
    const msPerBeat = 60000 / bpm;
    let beatCount = 0;
    
    const click = () => {
      playClick(beatCount % 4 === 0);
      setManualBeatIndex(beatCount % 4);
      beatCount++;
    };
    
    click();
    manualIntervalRef.current = setInterval(click, msPerBeat);
  };

  const stopManual = () => {
    if (manualIntervalRef.current) {
      clearInterval(manualIntervalRef.current);
      manualIntervalRef.current = null;
    }
    setManualActive(false);
    manualActiveRef.current = false;
    
    // Remove event listener
    if (midiInputRef.current && midiHandlerRef.current) {
      midiInputRef.current.removeEventListener('midimessage', midiHandlerRef.current);
      midiHandlerRef.current = null;
    }
  };

  const handleApply = () => {
    if (practiceMode === 'recording') {
      setMIDIRecordingLatencyAdjustment(latencyAdjustment);
      try {
        const existing = localStorage.getItem('dpgen_midi_recording_settings');
        const settings = existing ? JSON.parse(existing) : {};
        settings.latencyAdjustment = latencyAdjustment;
        localStorage.setItem('dpgen_midi_recording_settings', JSON.stringify(settings));
      } catch (e) {}
    } else {
      setMIDILatencyAdjustment(latencyAdjustment);
      try {
        const existing = localStorage.getItem('dpgen_midi_practice_settings');
        const settings = existing ? JSON.parse(existing) : {};
        settings.latencyAdjustment = latencyAdjustment;
        localStorage.setItem('dpgen_midi_practice_settings', JSON.stringify(settings));
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

  // Portal mounting
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
            <Music size={20} strokeWidth={1.5} style={{ color: 'var(--dpgen-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>MIDI Calibration</h2>
          </div>
          <button
            onClick={() => (stopAll(), onClose())}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dpgen-muted)', padding: '4px', display: 'flex' }}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Device Selection */}
        <select
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          disabled={autoCalActive || testActive || manualActive}
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
          <option value="">Select MIDI device...</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
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
              onClick={() => { stopAll(); setCalMode(key); }}
              disabled={autoCalActive || testActive || manualActive}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                border: calMode === key ? '2px solid var(--dpgen-primary)' : '1px solid var(--dpgen-border)',
                borderRadius: '6px',
                background: calMode === key ? 'var(--dpgen-primary)' : 'var(--dpgen-bg)',
                color: calMode === key ? 'white' : 'var(--dpgen-text)',
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

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {/* Auto Calibration Mode */}
          {calMode === 'auto' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', margin: '0 0 1rem' }}>
                Play along with the clicks. We'll automatically calculate the optimal latency setting.
              </p>
              
              {/* Hit Counter */}
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
                    hits detected {autoCalHits.length > 0 && `(last: ${autoCalHits[autoCalHits.length - 1].timingError > 0 ? '+' : ''}${autoCalHits[autoCalHits.length - 1].timingError.toFixed(0)}ms)`}
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
                    background: selectedDeviceId ? 'var(--dpgen-primary)' : '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: selectedDeviceId ? 'pointer' : 'not-allowed',
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
          {calMode === 'test' && (
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
                  background: testActive ? '#ef4444' : selectedDeviceId ? 'var(--dpgen-primary)' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: selectedDeviceId ? 'pointer' : 'not-allowed',
                  fontWeight: 500,
                }}
              >
                {testActive ? 'Stop Test' : 'Start Test'}
              </button>
            </div>
          )}

          {/* Manual Mode */}
          {calMode === 'manual' && (
            <div>
              {/* Latency slider */}
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
              
              {/* Beat indicator */}
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
              
              {/* Play clicks button */}
              <button
                onClick={manualActive ? stopManual : startManual}
                disabled={!selectedDeviceId}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: manualActive ? '#ef4444' : selectedDeviceId ? 'var(--dpgen-primary)' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedDeviceId ? 'pointer' : 'not-allowed',
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
            disabled={autoCalActive || testActive || manualActive}
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
