/**
 * Microphone Latency Calibration Component
 * Helps users calibrate their microphone latency using audio analysis
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useMicrophoneDevices } from '@/hooks/useMicrophoneDevices';
import { CONSTANTS } from '@/lib/utils/constants';

interface CalibrationHit {
  time: number; // Raw time from start
  adjustedTime: number; // Time with latency adjustment
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
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  dataArray: Uint8Array | null;
}

interface MicrophoneCalibrationProps {
  onClose: () => void;
  onApply?: (latency: number) => void;
}

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
  const [audioLevel, setAudioLevel] = useState<number>(0); // 0-100 for display
  
  const [calibration, setCalibration] = useState<CalibrationState>({
    active: false,
    startTime: null,
    currentBeat: 0,
    expectedBeatTimes: [],
    hitTimes: [],
    hitCounts: { perfect: 0, good: 0, off: 0 },
    beatInterval: null,
    audioContext: null,
    analyser: null,
    dataArray: null,
  });

  const ringRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const beatNumberRef = useRef<HTMLDivElement>(null);
  const lastHitRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const isActiveRef = useRef<boolean>(false);
  const beatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resetColorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const levelCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // Store stream in ref for access in checkAudioLevel
  const latencyAdjustmentRef = useRef<number>(latencyAdjustment);
  const lastHitTimeRef = useRef<number>(0);
  const sensitivityRef = useRef<number>(sensitivity);
  const thresholdRef = useRef<number>(threshold);
  const calibrationRef = useRef(calibration);
  
  // Update refs when values change
  useEffect(() => {
    latencyAdjustmentRef.current = latencyAdjustment;
    sensitivityRef.current = sensitivity;
    thresholdRef.current = threshold;
    calibrationRef.current = calibration;
  }, [latencyAdjustment, sensitivity, threshold, calibration]);

  // Initialize selected device from localStorage or first available
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      // Try to load from localStorage first
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('dpgen_microphone_practice_settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.deviceId) {
              const deviceExists = devices.some(d => d.deviceId === parsed.deviceId);
              if (deviceExists) {
                setSelectedDeviceId(parsed.deviceId);
                return;
              }
            }
          }
        } catch (e) {
          console.error('Failed to load device from localStorage:', e);
        }
      }
      // Fallback to first device
      setSelectedDeviceId(devices[0].deviceId);
    }
  }, [devices, selectedDeviceId]);

  // Stop calibration when modal closes or component unmounts
  useEffect(() => {
    return () => {
      handleStop();
    };
  }, []);

  // Request microphone access
  const requestMicrophone = async (deviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      return newStream;
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('Failed to access microphone. Please check permissions.');
      return null;
    }
  };

  // Play click sound - use shared AudioContext to avoid conflicts
  const playClickSound = async (isAccent: boolean) => {
    try {
      // Use shared AudioContext from audioLoader (same as playback)
      const { getAudioContext } = await import('@/lib/audio/audioLoader');
      const ctx = getAudioContext();
      
      // Resume audio context if suspended (required for user interaction)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      // Ensure context is running
      if (ctx.state !== 'running') {
        console.warn('[Calibration] Audio context not running, state:', ctx.state);
        // Try one more time to resume
        try {
          await ctx.resume();
        } catch (e) {
          console.error('[Calibration] Failed to resume AudioContext:', e);
          return;
        }
        if (ctx.state !== 'running') {
          return;
        }
      }
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = isAccent ? 800 : 600;
      oscillator.type = 'sine';
      
      // Increase volume significantly - browser may duck audio when mic is active
      const startGain = isAccent ? 0.9 : 0.8; // Much louder (was 0.5/0.4)
      gainNode.gain.setValueAtTime(startGain, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
      
      console.log('[Calibration] Click sound played', { isAccent, state: ctx.state, currentTime: ctx.currentTime });
    } catch (error) {
      console.error('[Calibration] Error playing click sound:', error);
    }
  };

  // Check audio level for hits
  const checkAudioLevel = () => {
    if (!analyserRef.current || !dataArrayRef.current || !isActiveRef.current) {
      if (!analyserRef.current) console.warn('[Calibration] No analyser ref');
      if (!dataArrayRef.current) console.warn('[Calibration] No dataArray ref');
      if (!isActiveRef.current) console.warn('[Calibration] Not active');
      setAudioLevel(0);
      return;
    }

    // Use ref to get latest startTime (avoid stale closure)
    const currentCalibration = calibrationRef.current;
    if (!currentCalibration.startTime) {
      setAudioLevel(0);
      return;
    }
    
    // Verify stream is still active (use ref to avoid closure issues)
    const currentStream = streamRef.current;
    if (currentStream) {
      const tracks = currentStream.getAudioTracks();
      const activeTracks = tracks.filter(t => t.readyState === 'live' && t.enabled);
      if (activeTracks.length === 0) {
        console.warn('[Calibration] No active audio tracks in stream');
        setAudioLevel(0);
        return;
      }
    } else {
      console.warn('[Calibration] No stream ref available');
    }

    // Get audio data - use time domain data for amplitude detection (better for drum hits)
    try {
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    } catch (error) {
      console.error('[Calibration] Error getting audio data:', error);
      setAudioLevel(0);
      return;
    }
    
    // Calculate RMS (Root Mean Square) volume for more accurate amplitude detection
    let sum = 0;
    let maxAmplitude = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const sample = dataArrayRef.current[i];
      const normalized = (sample - 128) / 128; // Convert 0-255 to -1 to 1
      const absNormalized = Math.abs(normalized);
      sum += normalized * normalized; // Square for RMS
      if (absNormalized > maxAmplitude) {
        maxAmplitude = absNormalized;
      }
    }
    const rms = Math.sqrt(sum / dataArrayRef.current.length);
    
    // Debug: Log audio levels occasionally (every 50 checks = ~2.5 seconds)
    if (!(window as any).__calDebugCount) {
      (window as any).__calDebugCount = 0;
    }
    (window as any).__calDebugCount++;
    if ((window as any).__calDebugCount % 50 === 0) {
      const normalizedVolume = Math.min(1, maxAmplitude);
      const displayLevel = Math.min(100, normalizedVolume * 100);
      const currentStream = streamRef.current;
      console.log(`[Calibration] Audio levels - RMS: ${rms.toFixed(4)}, Max: ${maxAmplitude.toFixed(4)}, Display: ${displayLevel.toFixed(1)}%`);
      console.log(`[Calibration] Stream status - Active: ${currentStream?.active}, Tracks: ${currentStream?.getAudioTracks().length}, Enabled: ${currentStream?.getAudioTracks().filter(t => t.readyState === 'live' && t.enabled).length}`);
      
      // If audio levels are very low, warn
      if (rms < 0.001 && maxAmplitude < 0.01) {
        console.warn('[Calibration] WARNING: Very low audio levels detected! Check microphone connection and permissions.');
      }
    }
    
    // Use peak amplitude directly for better transient detection (drum hits)
    // RMS is smoother but peak amplitude responds better to sudden transients
    const normalizedVolume = Math.min(1, maxAmplitude); // Peak amplitude, clamped to 0-1
    
    // Sensitivity: Higher sensitivity = Lower effective threshold
    // At 100% sensitivity, threshold is divided by 1 (most sensitive)
    // At 50% sensitivity, threshold is divided by 0.5 = doubled (less sensitive)
    // At 10% sensitivity, threshold is divided by 0.1 = 10x (least sensitive)
    const sensitivityMultiplier = sensitivityRef.current / 100;
    const adjustedThreshold = thresholdRef.current / sensitivityMultiplier;
    
    // Update audio level for display (0-100)
    // Show raw level (not relative to threshold) so user can see actual volume
    const displayLevel = Math.min(100, normalizedVolume * 100);
    setAudioLevel(displayLevel);
    
    // Debug: Log if we're getting any audio at all (every 100 checks = ~5 seconds)
    if (!(window as any).__calLevelDebugCount) {
      (window as any).__calLevelDebugCount = 0;
    }
    (window as any).__calLevelDebugCount++;
    if ((window as any).__calLevelDebugCount % 100 === 0) {
      console.log(`[Calibration] Current audio level: ${displayLevel.toFixed(1)}% (RMS: ${rms.toFixed(4)}, Max: ${maxAmplitude.toFixed(4)})`);
    }
    
    // Debug logging (throttled to every 50 checks = ~2.5 seconds)
    if (!(window as any).__micCalDebugCount) {
      (window as any).__micCalDebugCount = 0;
    }
    (window as any).__micCalDebugCount++;
    if ((window as any).__micCalDebugCount % 50 === 0) {
      console.log('[Microphone Calibration] Audio levels:', {
        volume: normalizedVolume.toFixed(3),
        threshold: adjustedThreshold.toFixed(3),
        rawThreshold: thresholdRef.current.toFixed(3),
        sensitivity: sensitivityRef.current,
        willTrigger: normalizedVolume > adjustedThreshold,
        maxAmplitude: maxAmplitude.toFixed(3),
        rms: rms.toFixed(3),
      });
    }
    
    // Check cooldown (50ms minimum between hits)
    const now = performance.now();
    const timeSinceLastHit = now - lastHitTimeRef.current;
    if (timeSinceLastHit < CONSTANTS.TIMING.HIT_COOLDOWN) {
      return;
    }
    
    // Detect hit if volume exceeds threshold
    if (normalizedVolume > adjustedThreshold) {
      console.log('[Microphone Calibration] Hit detected!', {
        normalizedVolume: normalizedVolume.toFixed(3),
        adjustedThreshold: adjustedThreshold.toFixed(3),
        rawThreshold: thresholdRef.current.toFixed(3),
        sensitivity: sensitivityRef.current,
        maxAmplitude: maxAmplitude.toFixed(3),
        rms: rms.toFixed(3),
        startTime: currentCalibration.startTime,
        now,
      });
      lastHitTimeRef.current = now;
      const elapsed = now - currentCalibration.startTime!;
      const adjustedTime = elapsed - latencyAdjustmentRef.current;

      console.log('[Microphone Calibration] Hit timing:', {
        elapsed: elapsed.toFixed(1),
        adjustedTime: adjustedTime.toFixed(1),
        latencyAdjustment: latencyAdjustmentRef.current,
        expectedBeatTimes: currentCalibration.expectedBeatTimes.length,
      });

      // Find closest expected beat using RAW elapsed time (not adjusted)
      // Only consider beats within 1.5x the beat duration (similar to MIDI calibration)
      const msPerBeat = 60000 / bpm;
      let closestBeatIndex: number | null = null;
      let minDistance = Infinity;
      
      currentCalibration.expectedBeatTimes.forEach((expectedTime, index) => {
        const distance = Math.abs(expectedTime - elapsed);
        // Only consider beats within 1.5 beats (prevent huge errors)
        if (distance < minDistance && distance < msPerBeat * 1.5) {
          minDistance = distance;
          closestBeatIndex = index;
        }
      });

      // If no beat found within window, skip this hit (but log it)
      if (closestBeatIndex === null) {
        console.log('[Microphone Calibration] Hit outside beat window, skipping:', {
          elapsed: elapsed.toFixed(1),
          msPerBeat: msPerBeat.toFixed(1),
          window: (msPerBeat * 1.5).toFixed(1),
          expectedBeats: currentCalibration.expectedBeatTimes.map(t => t.toFixed(1)),
        });
        return;
      }

      const closestBeatTime = currentCalibration.expectedBeatTimes[closestBeatIndex];
      
      console.log('[Microphone Calibration] Beat matched:', {
        closestBeatIndex,
        closestBeatTime: closestBeatTime.toFixed(1),
        elapsed: elapsed.toFixed(1),
        distance: Math.abs(closestBeatTime - elapsed).toFixed(1),
      });
      // Calculate timing error using ADJUSTED time (elapsed - latency)
      const timingError = adjustedTime - closestBeatTime;
      const absTimingError = Math.abs(timingError);

      // Determine hit quality
      const PERFECT_THRESHOLD = 25;
      const GOOD_THRESHOLD = 50;

      let hitQuality: 'perfect' | 'good' | 'off' = 'off';
      if (absTimingError <= PERFECT_THRESHOLD) {
        hitQuality = 'perfect';
      } else if (absTimingError <= GOOD_THRESHOLD) {
        hitQuality = 'good';
      }

      // Update hit counts
      console.log('[Microphone Calibration] Recording hit:', {
        timingError: timingError.toFixed(1),
        absTimingError: absTimingError.toFixed(1),
        hitQuality,
      });
      
      setCalibration(prev => ({
        ...prev,
        hitTimes: [
          ...prev.hitTimes,
          {
            time: elapsed,
            adjustedTime,
            timingError,
            rawTime: elapsed,
          },
        ],
        hitCounts: {
          ...prev.hitCounts,
          [hitQuality]: prev.hitCounts[hitQuality] + 1,
        },
      }));

      // Update UI
      if (targetRef.current) {
        if (hitQuality === 'perfect') {
          targetRef.current.style.background = '#10b981';
          targetRef.current.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.5)';
        } else if (hitQuality === 'good') {
          targetRef.current.style.background = '#f59e0b';
          targetRef.current.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.5)';
        } else {
          targetRef.current.style.background = '#ef4444';
          targetRef.current.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.5)';
        }
      }

      // Update last hit text
      if (lastHitRef.current) {
        const sign = timingError >= 0 ? '+' : '';
        let text = '';
        if (hitQuality === 'perfect') {
          text = `Perfect! (±${Math.round(absTimingError)}ms)`;
          lastHitRef.current.style.color = '#10b981';
        } else if (hitQuality === 'good') {
          text = `${timingError >= 0 ? 'Late' : 'Early'} by ${Math.round(absTimingError)}ms (±${Math.round(absTimingError)}ms)`;
          lastHitRef.current.style.color = '#f59e0b';
        } else {
          text = `${timingError >= 0 ? 'Late' : 'Early'} by ${Math.round(absTimingError)}ms (±${Math.round(absTimingError)}ms)`;
          lastHitRef.current.style.color = '#ef4444';
        }
        lastHitRef.current.textContent = text;
      }

      // Clear reset timeout and set new one
      if (resetColorTimeoutRef.current) {
        clearTimeout(resetColorTimeoutRef.current);
      }
      
      resetColorTimeoutRef.current = setTimeout(() => {
        if (targetRef.current) {
          targetRef.current.style.background = 'var(--dpgen-primary)';
          targetRef.current.style.boxShadow = '0 0 20px rgba(60, 109, 240, 0.5)';
        }
        if (lastHitRef.current) {
          lastHitRef.current.textContent = 'Ready...';
          lastHitRef.current.style.color = 'var(--dpgen-text)';
        }
      }, 1500); // 1.5 beats
    }
  };

  // Start calibration
  const handleStart = async () => {
    if (calibration.active) {
      handleStop();
      return;
    }

    if (!selectedDeviceId) {
      alert('Please select a microphone device first.');
      return;
    }

    // Request microphone access
    const newStream = await requestMicrophone(selectedDeviceId);
    if (!newStream) {
      return;
    }
    
    // Store stream in ref for access in checkAudioLevel
    streamRef.current = newStream;

    // Create audio context and analyser
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const analyser = ctx.createAnalyser();
    analyser.fftSize = CONSTANTS.AUDIO.FFT_SIZE;
    analyser.smoothingTimeConstant = CONSTANTS.AUDIO.SMOOTHING_TIME_CONSTANT;
    
    const source = ctx.createMediaStreamSource(newStream);
    source.connect(analyser);
    
    analyserRef.current = analyser;
    // For time domain data, we need fftSize (not frequencyBinCount which is half)
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(new ArrayBuffer(bufferLength));
    dataArrayRef.current = dataArray;
    
    console.log('[Microphone Calibration] Initialized analyser:', {
      fftSize: analyser.fftSize,
      frequencyBinCount: analyser.frequencyBinCount,
      bufferLength,
      stream: newStream.active,
      trackCount: newStream.getTracks().length,
    });

    const startTime = performance.now();
    const msPerBeat = 60000 / bpm;

    // Generate expected beat times (16 beats)
    const expectedBeatTimes: number[] = [];
    for (let i = 0; i < 16; i++) {
      expectedBeatTimes.push(i * msPerBeat);
    }

    // Reset UI
    if (targetRef.current) {
      targetRef.current.style.background = 'var(--dpgen-primary)';
      targetRef.current.style.boxShadow = '0 0 20px rgba(60, 109, 240, 0.5)';
    }
    if (lastHitRef.current) {
      lastHitRef.current.textContent = 'Ready...';
      lastHitRef.current.style.color = 'var(--dpgen-text)';
    }

    const newCalibration = {
      active: true,
      startTime,
      currentBeat: 0,
      expectedBeatTimes,
      hitTimes: [],
      hitCounts: { perfect: 0, good: 0, off: 0 },
      beatInterval: null,
      audioContext: ctx,
      analyser,
      dataArray,
    };
    
    setCalibration(newCalibration);
    
    // Update ref immediately (don't wait for useEffect)
    calibrationRef.current = newCalibration;

    isActiveRef.current = true;
    
    console.log('[Microphone Calibration] Calibration started:', {
      startTime,
      expectedBeatTimes: expectedBeatTimes.length,
      msPerBeat,
      firstBeatTime: expectedBeatTimes[0],
      secondBeatTime: expectedBeatTimes[1],
    });

    // Schedule beats
    const scheduleBeats = () => {
      let beatIndex = 0;
      
      const playNextBeat = () => {
        if (!isActiveRef.current || beatIndex >= 16) {
          handleStop();
          return;
        }

        const beatTime = startTime + (beatIndex * msPerBeat);
        const now = performance.now();
        const delay = Math.max(0, beatTime - now);

        beatIntervalRef.current = setTimeout(() => {
          if (!isActiveRef.current) return;

          playClickSound(beatIndex === 0);
          
          // Update beat number
          if (beatNumberRef.current) {
            beatNumberRef.current.textContent = ((beatIndex % 4) + 1).toString();
          }

          // Animate ring
          if (ringRef.current) {
            ringRef.current.style.opacity = '1';
            ringRef.current.style.width = '80px';
            ringRef.current.style.height = '80px';
            ringRef.current.style.transition = 'all 0s';

            setTimeout(() => {
              if (ringRef.current) {
                ringRef.current.style.transition = `width ${msPerBeat}ms linear, height ${msPerBeat}ms linear`;
                ringRef.current.style.width = '200px';
                ringRef.current.style.height = '200px';
              }
            }, 10);

            setTimeout(() => {
              if (ringRef.current) {
                ringRef.current.style.opacity = '0';
              }
            }, msPerBeat);
          }

          beatIndex++;
          playNextBeat();
        }, delay);
      };

      playNextBeat();
    };

    // Start level checking - use time domain data for hit detection
    // Make sure we have the right buffer size for time domain data (need fftSize, not frequencyBinCount)
    if (!dataArrayRef.current || dataArrayRef.current.length !== analyser.fftSize) {
      dataArrayRef.current = new Uint8Array(new ArrayBuffer(analyser.fftSize));
      console.log('[Microphone Calibration] Recreated dataArray with fftSize:', analyser.fftSize);
    }
    
    const levelCheckInterval = setInterval(() => {
      checkAudioLevel();
    }, CONSTANTS.AUDIO.LEVEL_CHECK_INTERVAL);

    levelCheckIntervalRef.current = levelCheckInterval;
    
    console.log('[Microphone Calibration] Started level checking with analyser:', {
      fftSize: analyser.fftSize,
      frequencyBinCount: analyser.frequencyBinCount,
      dataArrayLength: dataArrayRef.current.length,
      bufferLength,
    });

    scheduleBeats();
  };

    // Stop calibration
    const handleStop = () => {
      isActiveRef.current = false;

      // Clear intervals
      if (beatIntervalRef.current) {
        clearTimeout(beatIntervalRef.current);
        beatIntervalRef.current = null;
      }

      if (levelCheckIntervalRef.current) {
        clearInterval(levelCheckIntervalRef.current);
        levelCheckIntervalRef.current = null;
      }
      
      // Clear stream ref
      streamRef.current = null;

      if (resetColorTimeoutRef.current) {
        clearTimeout(resetColorTimeoutRef.current);
        resetColorTimeoutRef.current = null;
      }

      // Stop audio stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }

      analyserRef.current = null;
      dataArrayRef.current = null;

      // Reset audio level
      setAudioLevel(0);

      setCalibration(prev => ({
        ...prev,
        active: false,
        beatInterval: null,
        audioContext: null,
        analyser: null,
        dataArray: null,
      }));
    };

  // Reset stats
  const handleReset = () => {
    setCalibration(prev => ({
      ...prev,
      hitTimes: [],
      hitCounts: { perfect: 0, good: 0, off: 0 },
    }));

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
    // Save all calibration settings
    setMicrophoneLatencyAdjustment(latencyAdjustment);
    setMicrophoneSensitivity(sensitivity);
    setMicrophoneThreshold(threshold);
    if (onApply) {
      onApply(latencyAdjustment);
    }
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleStop();
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
        zIndex: 3000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--dpgen-card)',
          borderRadius: 'var(--dpgen-radius)',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--dpgen-shadow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Microphone Calibration</h2>
          <button
            onClick={() => {
              handleStop();
              onClose();
            }}
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

        {/* Device Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Microphone Device
          </label>
          <select
            value={selectedDeviceId}
            onChange={(e) => {
              const deviceId = e.target.value;
              setSelectedDeviceId(deviceId);
              // Save device selection to localStorage
              if (typeof window !== 'undefined' && deviceId) {
                try {
                  const existing = localStorage.getItem('dpgen_microphone_practice_settings');
                  const settings = existing ? JSON.parse(existing) : {};
                  settings.deviceId = deviceId;
                  localStorage.setItem('dpgen_microphone_practice_settings', JSON.stringify(settings));
                } catch (e) {
                  console.error('Failed to save device selection:', e);
                }
              }
            }}
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
            <option value="">Select microphone...</option>
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sensitivity and Threshold */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Sensitivity: {sensitivity}%
          </label>
          <input
            type="range"
            min={CONSTANTS.AUDIO.SENSITIVITY_MIN}
            max={CONSTANTS.AUDIO.SENSITIVITY_MAX}
            value={sensitivity}
            onChange={(e) => setSensitivity(parseInt(e.target.value, 10))}
            disabled={calibration.active}
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem', marginBottom: '0' }}>
            Higher sensitivity makes the microphone more responsive to quieter sounds. Lower sensitivity requires louder hits to trigger.
          </p>

          <label style={{ display: 'block', marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 500 }}>
            Threshold: {threshold.toFixed(2)}
          </label>
          <input
            type="range"
            min={CONSTANTS.AUDIO.THRESHOLD_MIN}
            max={CONSTANTS.AUDIO.THRESHOLD_MAX}
            step="0.01"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            disabled={calibration.active}
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem', marginBottom: '0' }}>
            The minimum audio level required to register a hit. Lower values trigger on quieter sounds, higher values require louder hits. Works together with sensitivity.
          </p>
        </div>

        {/* Latency Adjustment */}
        <div style={{ marginBottom: '1.5rem' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
            <span>{CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MIN}ms</span>
            <span>{CONSTANTS.TIMING.LATENCY_ADJUSTMENT_MAX}ms</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem', marginBottom: '0' }}>
            Compensates for audio processing delay. If hits appear consistently early, increase this value. If consistently late, decrease it. Adjust during calibration to get "Perfect" hits.
          </p>
        </div>

        {/* Live Audio Level Feedback */}
        {calibration.active && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Audio Level
            </label>
            <div style={{
              width: '100%',
              height: '24px',
              background: 'var(--dpgen-bg)',
              border: '1px solid var(--dpgen-border)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div
                style={{
                  width: `${Math.min(100, audioLevel)}%`,
                  height: '100%',
                  background: audioLevel >= 100 
                    ? 'linear-gradient(to right, #10b981, #f59e0b, #ef4444)' 
                    : audioLevel >= 75
                    ? 'linear-gradient(to right, #10b981, #f59e0b)'
                    : '#10b981',
                  transition: 'width 0.05s ease-out, background 0.2s ease',
                  borderRadius: '4px',
                }}
              />
              {/* Threshold indicator line */}
              <div
                style={{
                  position: 'absolute',
                  left: `${Math.min(100, (threshold * (sensitivity / 100)) * 100)}%`,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  background: '#ef4444',
                  opacity: 0.7,
                  pointerEvents: 'none',
                }}
              />
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '0.75rem', 
              color: 'var(--dpgen-muted)', 
              marginTop: '0.25rem' 
            }}>
              <span>0%</span>
              <span style={{ fontWeight: 600 }}>{Math.round(audioLevel)}%</span>
              <span>100%</span>
            </div>
          </div>
        )}

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
          {/* Target Container */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            {/* Ring */}
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
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={handleReset}
            disabled={calibration.active}
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
            Reset
          </button>
          <button
            onClick={calibration.active ? handleStop : handleStart}
            disabled={!selectedDeviceId}
            style={{
              padding: '0.75rem 1.5rem',
              background: calibration.active ? '#ef4444' : 'var(--dpgen-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {calibration.active ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={handleApply}
            disabled={calibration.active}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--dpgen-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
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
}

