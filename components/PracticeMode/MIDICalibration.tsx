/**
 * MIDI Latency Calibration Component
 * Helps users calibrate their MIDI device latency
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';

// Make sure useEffect is imported if not already
import { useStore } from '@/store/useStore';
import { useMIDIDevices } from '@/hooks/useMIDIDevices';
import { CONSTANTS } from '@/lib/utils/constants';

// MIDI Message Event type
interface MIDIMessageEvent extends Event {
  data: Uint8Array;
}

interface CalibrationHit {
  time: number; // Raw time from start
  adjustedTime: number; // Time with latency adjustment
  note: number;
  velocity: number;
  timingError: number;
  rawTime: number;
}

interface CalibrationState {
  active: boolean;
  startTime: number | null;
  currentBeat: number;
  expectedBeatTimes: number[];
  hitTimes: CalibrationHit[];
  hitCounts: { perfect: number; good: number; off: number };
  beatInterval: NodeJS.Timeout | null;
  midiHandler: ((event: Event) => void) | null;
  audioContext: AudioContext | null;
}

interface MIDICalibrationProps {
  onClose: () => void;
}

export function MIDICalibration({ onClose }: MIDICalibrationProps) {
  const bpm = useStore((state) => state.bpm);
  const midiPractice = useStore((state) => state.midiPractice);
  const setMIDILatencyAdjustment = useStore((state) => state.setMIDILatencyAdjustment);
  
  const { devices, access, refreshDevices } = useMIDIDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [latencyAdjustment, setLatencyAdjustment] = useState<number>(midiPractice.latencyAdjustment);
  
  const [calibration, setCalibration] = useState<CalibrationState>({
    active: false,
    startTime: null,
    currentBeat: 0,
    expectedBeatTimes: [],
    hitTimes: [],
    hitCounts: { perfect: 0, good: 0, off: 0 },
    beatInterval: null,
    midiHandler: null,
    audioContext: null,
  });

  const ringRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const beatNumberRef = useRef<HTMLDivElement>(null);
  const lastHitRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isActiveRef = useRef<boolean>(false);
  const beatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resetColorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latencyAdjustmentRef = useRef<number>(latencyAdjustment);
  
  // Update ref when latencyAdjustment changes
  useEffect(() => {
    latencyAdjustmentRef.current = latencyAdjustment;
  }, [latencyAdjustment]);

  // Initialize selected device
  useEffect(() => {
    if (midiPractice.input) {
      setSelectedDeviceId(midiPractice.input.id);
    } else if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [midiPractice.input, devices, selectedDeviceId]);

  // Stop calibration when modal closes or component unmounts
  useEffect(() => {
    return () => {
      // Cleanup on unmount - stop calibration if active
      if (isActiveRef.current || calibration.active) {
        isActiveRef.current = false;
        
        // Clear beat interval
        if (beatIntervalRef.current) {
          clearTimeout(beatIntervalRef.current);
          beatIntervalRef.current = null;
        }
        
        // Clear reset color timeout
        if (resetColorTimeoutRef.current) {
          clearTimeout(resetColorTimeoutRef.current);
          resetColorTimeoutRef.current = null;
        }
        
        // Stop audio context
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(console.error);
          audioContextRef.current = null;
        }
        
        // Remove MIDI handler
        if (access && selectedDeviceId) {
          const input = access.inputs.get(selectedDeviceId);
          if (input) {
            // Remove event listener
            if ((input as any).__midiHandler) {
              input.removeEventListener('midimessage', (input as any).__midiHandler);
              (input as any).__midiHandler = null;
            }
            // Clear onmidimessage
            input.onmidimessage = null;
          }
        }
        
        setCalibration(prev => ({
          ...prev,
          active: false,
          beatInterval: null,
          midiHandler: null,
        }));
      }
    };
  }, [access, selectedDeviceId]);

  // Play click sound
  const playClickSound = async (isAccent: boolean) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Resume audio context if suspended
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = isAccent ? 800 : 600;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.error('Error playing click sound:', error);
    }
  };

  // Start calibration
  const handleStart = async () => {
    if (calibration.active) {
      handleStop();
      return;
    }

    if (!selectedDeviceId) {
      alert('Please select a MIDI device first.');
      return;
    }

    if (!access) {
      await refreshDevices();
      return;
    }

    // Use the same input instance from practice mode if available, otherwise get from access
    // This ensures we're using the same MIDI input that might already be open
    let input: MIDIInput | null = null;
    
    if (midiPractice.input && midiPractice.input.id === selectedDeviceId) {
      // Use existing input from practice mode
      input = midiPractice.input;
      console.log('Using existing MIDI input from practice mode:', input.name, input.id);
    } else {
      // Get new input from access
      const newInput = access.inputs.get(selectedDeviceId);
      if (!newInput) {
        alert('MIDI device not found. Please refresh the device list.');
        return;
      }
      input = newInput;
    }
    
    // Log MIDI input state
    console.log('MIDI input state:', {
      connection: input.connection,
      state: input.state,
      id: input.id,
      name: input.name
    });
    
    // Note: In Web MIDI API, setting onmidimessage should automatically open the connection
    // The connection property may still show 'closed' until a message is actually received
    // We'll attach the handler below and it should start receiving messages

    // Initialize audio context
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    
    // Resume audio context if suspended
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const startTime = performance.now();
    const msPerBeat = 60000 / bpm;

    // Reset UI
    if (targetRef.current) {
      targetRef.current.style.background = 'var(--dpgen-primary)';
      targetRef.current.style.boxShadow = '0 0 20px rgba(60, 109, 240, 0.5)';
    }

    // MIDI handler - use closure variables for expected times
    // WordPress plugin receives message directly (not event), so handle both
    const handleMIDIMessage = (messageOrEvent: any) => {
      if (!isActiveRef.current) {
        return;
      }
      
      setCalibration(prev => {
        if (!prev.active || !prev.startTime) {
          return prev;
        }
        
        // WordPress plugin uses message.data directly - try both event and direct message
        let data: Uint8Array;
        
        // Check if it's a direct message object (WordPress plugin style)
        if (messageOrEvent?.data && messageOrEvent.data instanceof Uint8Array) {
          data = messageOrEvent.data;
        } else if (messageOrEvent?.target?.data) {
          data = messageOrEvent.target.data;
        } else if (messageOrEvent?.data) {
          data = messageOrEvent.data;
        } else {
          return prev;
        }
        
        if (!data || data.length < 3) {
          return prev;
        }
        
        const status = data[0];
        const note = data[1];
        const velocity = data[2];
        
        // Match WordPress plugin exactly: accept status 144-159 (note-on messages, all channels)
        if (status >= 144 && status <= 159 && velocity > 0) {
          const now = performance.now();
          // Calculate raw elapsed time from start
          const elapsed = now - prev.startTime;
          
          // Use ref to get current latency adjustment value (fresh on each hit)
          const currentLatency = latencyAdjustmentRef.current;
          // Adjust the elapsed time by subtracting latency (latency compensation)
          const adjustedTime = elapsed - currentLatency;
          
          // Find closest expected beat using RAW elapsed time (not adjusted)
          // This matches the WordPress plugin behavior
          let closestBeat: number | null = null;
          let minDiff = Infinity;
          expectedBeatTimesArray.forEach((expectedTime, index) => {
            // Use raw elapsed time to find the closest beat
            const diff = Math.abs(elapsed - expectedTime);
            if (diff < minDiff && diff < msPerBeat * 1.5) {
              minDiff = diff;
              closestBeat = index;
            }
          });
          
          // Calculate timing error using ADJUSTED time
          let timingError = msPerBeat;
          if (closestBeat !== null && expectedBeatTimesArray[closestBeat] !== undefined) {
            const expectedTime = expectedBeatTimesArray[closestBeat];
            // Timing error = adjusted hit time - expected beat time
            timingError = adjustedTime - expectedTime;
          }
          
          // Categorize hit
          const absError = Math.abs(timingError);
          const newCounts = { ...prev.hitCounts };
          
          if (absError <= 25) {
            newCounts.perfect++;
          } else if (absError <= 100) {
            newCounts.good++;
          } else {
            newCounts.off++;
          }
          
          // Store hit
          const newHit: CalibrationHit = {
            time: elapsed,
            adjustedTime,
            note,
            velocity,
            timingError,
            rawTime: elapsed,
          };
          
          // Clear any existing reset timeout
          if (resetColorTimeoutRef.current) {
            clearTimeout(resetColorTimeoutRef.current);
            resetColorTimeoutRef.current = null;
          }
          
          // Visual feedback
          if (targetRef.current) {
            let color = '';
            let shadow = '';
            
            if (absError <= 25) {
              color = '#10b981';
              shadow = '0 0 20px rgba(16, 185, 129, 0.5)';
            } else if (absError <= 100) {
              color = '#f59e0b';
              shadow = '0 0 20px rgba(245, 158, 11, 0.5)';
            } else {
              color = '#ef4444';
              shadow = '0 0 20px rgba(239, 68, 68, 0.5)';
            }
            
            targetRef.current.style.background = color;
            targetRef.current.style.boxShadow = shadow;
          }
          
          // Update last hit feedback
          if (lastHitRef.current) {
            const isEarly = timingError < 0;
            let feedbackText = '';
            
            if (absError <= 25) {
              feedbackText = `Perfect! (±${Math.round(absError)}ms)`;
            } else if (isEarly) {
              feedbackText = `Early by ${Math.round(absError)}ms (±${Math.round(absError)}ms)`;
            } else {
              feedbackText = `Late by ${Math.round(absError)}ms (±${Math.round(absError)}ms)`;
            }
            
            lastHitRef.current.textContent = feedbackText;
            lastHitRef.current.style.color = absError <= 25 ? '#10b981' : absError <= 100 ? '#f59e0b' : '#ef4444';
          }
          
          // Reset color and feedback after 1.5 beats if no new hit
          resetColorTimeoutRef.current = setTimeout(() => {
            if (targetRef.current) {
              targetRef.current.style.background = 'var(--dpgen-primary)';
              targetRef.current.style.boxShadow = '0 0 20px rgba(60, 109, 240, 0.5)';
            }
            if (lastHitRef.current) {
              lastHitRef.current.textContent = 'Ready...';
              lastHitRef.current.style.color = 'var(--dpgen-text)';
            }
            resetColorTimeoutRef.current = null;
          }, msPerBeat * 1.5);
          
          return {
            ...prev,
            hitTimes: [...prev.hitTimes, newHit],
            hitCounts: newCounts,
          };
        }
        
        return prev;
      });
    };

    // Attach MIDI handler - try both methods
    // First remove any existing handlers
    if (input.onmidimessage) {
      input.onmidimessage = null;
    }
    if ((input as any).__midiHandler) {
      input.removeEventListener('midimessage', (input as any).__midiHandler);
      (input as any).__midiHandler = null;
    }
    
    // Primary: Use onmidimessage (this matches useMIDIPractice and works reliably)
    // Setting onmidimessage automatically opens the connection in Web MIDI API
    input.onmidimessage = (e: any) => {
      // Call our main handler with the event
      handleMIDIMessage(e);
    };
    
    // Also attach via addEventListener as backup (matches WordPress plugin)
    if (input.addEventListener) {
      input.addEventListener('midimessage', handleMIDIMessage);
      (input as any).__midiHandler = handleMIDIMessage; // Store reference for cleanup
      console.log('MIDI handler also attached via addEventListener as backup');
    }

    // Update calibration state to active
    isActiveRef.current = true;
    let beatCount = 0;
    const expectedBeatTimesArray: number[] = [];
    
    setCalibration({
      active: true,
      startTime,
      currentBeat: 0,
      expectedBeatTimes: [],
      hitTimes: [],
      hitCounts: { perfect: 0, good: 0, off: 0 },
      beatInterval: null,
      midiHandler: handleMIDIMessage,
      audioContext: ctx,
    });

    // Play beat function - use ref to track interval and prevent duplicates
    const playBeat = () => {
      // Early exit check
      if (!isActiveRef.current) {
        if (beatIntervalRef.current) {
          clearTimeout(beatIntervalRef.current);
          beatIntervalRef.current = null;
        }
        return;
      }
      
      beatCount++;
      const isAccent = beatCount % 4 === 1;
      // Store the raw elapsed time from start (without latency adjustment)
      // This is what we compare against to find the closest beat
      const currentTime = performance.now();
      const expectedTime = currentTime - startTime;
      expectedBeatTimesArray.push(expectedTime);
      
      // Update beat number first
      if (beatNumberRef.current) {
        beatNumberRef.current.textContent = ((beatCount - 1) % 4) + 1 + '';
        beatNumberRef.current.style.transform = 'scale(1.2)';
        setTimeout(() => {
          if (beatNumberRef.current) {
            beatNumberRef.current.style.transform = 'scale(1)';
          }
        }, 100);
      }
      
      // Play click (async, don't await) - only one at a time
      playClickSound(isAccent).catch(err => console.error('Click sound error:', err));
      
      // Animate ring
      if (ringRef.current) {
        animateRing(msPerBeat);
      }
      
      // Update state
      setCalibration(prev => ({
        ...prev,
        currentBeat: beatCount,
        expectedBeatTimes: [...expectedBeatTimesArray],
      }));
      
      // Schedule next beat ONLY if still active
      if (isActiveRef.current) {
        // Clear any existing interval first to prevent duplicates
        if (beatIntervalRef.current !== null) {
          clearTimeout(beatIntervalRef.current);
          beatIntervalRef.current = null;
        }
        
        beatIntervalRef.current = setTimeout(() => {
          // Clear the ref before calling playBeat so it can schedule next
          beatIntervalRef.current = null;
          
          // Only continue if still active
          if (isActiveRef.current) {
            playBeat();
          }
        }, msPerBeat);
      }
    };
    
    // Animate ring
    const animateRing = (duration: number) => {
      if (!ringRef.current) return;
      
      const ring = ringRef.current;
      // Set initial size and position to match target circle (80px)
      ring.style.width = '80px';
      ring.style.height = '80px';
      ring.style.opacity = '1';
      
      const animStartTime = performance.now();
      const animate = () => {
        const ringElement = ringRef.current;
        if (!ringElement || !isActiveRef.current) {
          if (ringElement) {
            ringElement.style.width = '80px';
            ringElement.style.height = '80px';
            ringElement.style.opacity = '0';
          }
          return;
        }
        
        const elapsed = performance.now() - animStartTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
          const size = 80 + (240 * progress);
          const opacity = 1 - progress;
          ringElement.style.width = size + 'px';
          ringElement.style.height = size + 'px';
          ringElement.style.opacity = opacity + '';
          requestAnimationFrame(animate);
        } else {
          ringElement.style.width = '80px';
          ringElement.style.height = '80px';
          ringElement.style.opacity = '0';
        }
      };
      requestAnimationFrame(animate);
    };
    
    // Start first beat
    setTimeout(playBeat, 500);
  };

  // Stop calibration
  const handleStop = () => {
    // Set active ref to false immediately to stop all loops
    isActiveRef.current = false;
    
    // Clear beat interval from ref
    if (beatIntervalRef.current) {
      clearTimeout(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }
    
    // Clear reset color timeout
    if (resetColorTimeoutRef.current) {
      clearTimeout(resetColorTimeoutRef.current);
      resetColorTimeoutRef.current = null;
    }
    
    setCalibration(prev => {
      // Clear beat interval from state too
      if (prev.beatInterval) {
        clearTimeout(prev.beatInterval);
      }
      
      // Remove MIDI handler
      if (access && selectedDeviceId) {
        const input = access.inputs.get(selectedDeviceId);
        if (input) {
          if (input.onmidimessage) {
            input.onmidimessage = null;
          }
          if (input.removeEventListener && calibration.midiHandler) {
            input.removeEventListener('midimessage', calibration.midiHandler);
          }
        }
      }
      
      // Reset ring
      if (ringRef.current) {
        ringRef.current.style.width = '80px';
        ringRef.current.style.height = '80px';
        ringRef.current.style.opacity = '0';
      }
      
      // Reset color
      if (targetRef.current) {
        targetRef.current.style.background = 'var(--dpgen-primary)';
        targetRef.current.style.boxShadow = '0 0 20px rgba(60, 109, 240, 0.5)';
      }
      
      if (lastHitRef.current) {
        lastHitRef.current.textContent = 'Ready...';
        lastHitRef.current.style.color = 'var(--dpgen-text)';
      }
      
      return {
        ...prev,
        active: false,
        beatInterval: null,
        midiHandler: null,
      };
    });
  };

  // Reset calibration
  const handleReset = () => {
    // Stop first to clear intervals
    isActiveRef.current = false;
    
    // Clear beat interval from ref
    if (beatIntervalRef.current) {
      clearTimeout(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }
    
    // Clear reset color timeout
    if (resetColorTimeoutRef.current) {
      clearTimeout(resetColorTimeoutRef.current);
      resetColorTimeoutRef.current = null;
    }
    
    setCalibration(prev => {
      if (prev.beatInterval) {
        clearTimeout(prev.beatInterval);
      }
      
      // Remove MIDI handler
      if (access && selectedDeviceId) {
        const input = access.inputs.get(selectedDeviceId);
        if (input) {
          if (input.onmidimessage) {
            input.onmidimessage = null;
          }
          if (input.removeEventListener && calibration.midiHandler) {
            input.removeEventListener('midimessage', calibration.midiHandler);
          }
        }
      }
      
      return {
        active: false,
        startTime: null,
        currentBeat: 0,
        expectedBeatTimes: [],
        hitTimes: [],
        hitCounts: { perfect: 0, good: 0, off: 0 },
        beatInterval: null,
        midiHandler: null,
        audioContext: null,
      };
    });
    
    // Reset UI
    if (ringRef.current) {
      ringRef.current.style.width = '80px';
      ringRef.current.style.height = '80px';
      ringRef.current.style.opacity = '0';
    }
    
    if (targetRef.current) {
      targetRef.current.style.background = 'var(--dpgen-primary)';
      targetRef.current.style.boxShadow = '0 0 20px rgba(60, 109, 240, 0.5)';
    }
    
    if (lastHitRef.current) {
      lastHitRef.current.textContent = 'Ready...';
      lastHitRef.current.style.color = 'var(--dpgen-text)';
    }
  };

  // Apply calibration
  const handleApply = () => {
    if (calibration.hitTimes.length === 0) {
      alert('No hits detected. Please play along with the beats first.');
      return;
    }
    
    setMIDILatencyAdjustment(latencyAdjustment);
    
    // Save to localStorage
    try {
      localStorage.setItem('dpgen_midi_calibration', JSON.stringify({
        latencyAdjustment,
      }));
    } catch (e) {
      console.error('Failed to save calibration:', e);
    }
    
    alert('Calibration settings applied!');
    onClose();
  };

  return (
    <div
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
        zIndex: 1001,
      }}
      onClick={() => {
        // Stop calibration before closing
        if (calibration.active || isActiveRef.current) {
          handleStop();
        }
        onClose();
      }}
    >
      <div
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
            <i className="fas fa-sliders-h" style={{ marginRight: '0.5rem' }} />
            MIDI Latency Calibration
          </h2>
          <button
            onClick={() => {
        // Stop calibration before closing
        if (calibration.active || isActiveRef.current) {
          handleStop();
        }
        onClose();
      }}
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

        <p style={{ marginBottom: '1.5rem', color: 'var(--dpgen-muted)', fontSize: '0.875rem' }}>
          Play along with the metronome beats on your MIDI device. Adjust the latency slider until
          most hits show as "Perfect" or "Good". Then click Apply to save the calibration.
        </p>

        {/* Device Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            MIDI Device
          </label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={calibration.active}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--dpgen-border)',
              background: 'var(--dpgen-bg)',
              color: 'var(--dpgen-text)',
            }}
          >
            <option value="">Select a device...</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </select>
        </div>

        {/* Latency Adjustment */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Latency Adjustment: {latencyAdjustment}ms
          </label>
          <input
            type="range"
            min={CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MIN}
            max={CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MAX}
            value={latencyAdjustment}
            onChange={(e) => setLatencyAdjustment(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
            <span>{CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MIN}ms</span>
            <span>{CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MAX}ms</span>
          </div>
        </div>

        {/* Calibration Visual */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '2rem',
          minHeight: '300px',
          position: 'relative',
        }}>
          {/* Target Container - relative positioning for absolute children */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            {/* Ring - positioned absolutely to center */}
            <div
              ref={ringRef}
              style={{
                position: 'absolute',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '3px solid var(--dpgen-primary)',
                opacity: 0,
                pointerEvents: 'none',
                transition: 'opacity 0.2s ease',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                margin: 0,
              }}
            />
            
            {/* Target */}
            <div
              ref={targetRef}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--dpgen-primary)',
                boxShadow: '0 0 20px rgba(60, 109, 240, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 600,
                color: 'white',
                transition: 'all 0.3s ease',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div ref={beatNumberRef}>1</div>
            </div>
          </div>
          
          {/* Last Hit Feedback */}
          <div
            ref={lastHitRef}
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--dpgen-text)',
              marginBottom: '1rem',
              minHeight: '1.5rem',
              textAlign: 'center',
              transition: 'color 0.3s ease',
            }}
          >
            Ready...
          </div>
          
          {/* Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1rem',
            width: '100%',
            marginTop: '1rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Total</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{calibration.hitTimes.length}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Perfect</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#10b981' }}>{calibration.hitCounts.perfect}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Good</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f59e0b' }}>{calibration.hitCounts.good}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>Off</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ef4444' }}>{calibration.hitCounts.off}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={handleReset}
            disabled={calibration.active}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              border: '1px solid var(--dpgen-border)',
              background: 'var(--dpgen-bg)',
              color: 'var(--dpgen-text)',
              cursor: calibration.active ? 'not-allowed' : 'pointer',
              opacity: calibration.active ? 0.5 : 1,
            }}
          >
            Reset
          </button>
          {calibration.active ? (
            <button
              onClick={handleStop}
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
              Stop
            </button>
          ) : (
            <>
              <button
                onClick={handleStart}
                disabled={!selectedDeviceId}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: selectedDeviceId ? 'var(--dpgen-primary)' : '#ccc',
                  color: 'white',
                  cursor: selectedDeviceId ? 'pointer' : 'not-allowed',
                  fontWeight: 500,
                }}
              >
                Start
              </button>
              <button
                onClick={handleApply}
                disabled={calibration.hitTimes.length === 0}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: calibration.hitTimes.length > 0 ? '#10b981' : '#ccc',
                  color: 'white',
                  cursor: calibration.hitTimes.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 500,
                }}
              >
                Apply
              </button>
            </>
          )}
          <button
            onClick={() => {
              // Stop calibration before closing
              if (calibration.active || isActiveRef.current) {
                handleStop();
              }
              onClose();
            }}
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
      </div>
    </div>
  );
}

