/**
 * Playback hook for metronome and drum sound playback
 */

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Pattern } from '@/types';
import { PolyrhythmPattern } from '@/types/polyrhythm';
import { getAudioContext, resumeAudioContext } from '@/lib/audio/audioLoader';
import { parseTokens, parseNumberList, parseTimeSignature, calculateNotesPerBar, buildAccentIndices } from '@/lib/utils/patternUtils';
import { polyrhythmToCombinedPattern } from '@/lib/utils/polyrhythmUtils';

interface ScheduledNote {
  time: number;
  sounds: string[]; // e.g., ['S', 'K'] or ['click']
  isBeat: boolean;
  noteIndex: number;
  patternIndex: number;
  hasAccent?: boolean; // Whether this note has an accent
}

/**
 * Main playback hook
 */
export function usePlayback() {
  // Playback state
  const isPlaying = useStore((state) => state.isPlaying);
  const bpm = useStore((state) => state.bpm);
  const loopCount = useStore((state) => state.loopCount);
  const currentLoop = useStore((state) => state.currentLoop);
  const countInEnabled = useStore((state) => state.countInEnabled);
  const playDrumSounds = useStore((state) => state.playDrumSounds);
  const metronomeOnlyMode = useStore((state) => state.metronomeOnlyMode);
  const silentPracticeMode = useStore((state) => state.silentPracticeMode);
  const slowMotionEnabled = useStore((state) => state.slowMotionEnabled);
  const slowMotionSpeed = useStore((state) => state.slowMotionSpeed);
  const playBackwards = useStore((state) => state.playBackwards);
  const loopMeasures = useStore((state) => state.loopMeasures);
  const clickSoundType = useStore((state) => state.clickSoundType);
  const clickMode = useStore((state) => state.clickMode); // 'beats', 'subdivision', 'accents', or 'none'
  const tempoRamping = useStore((state) => state.tempoRamping);
  const tempoRampStart = useStore((state) => state.tempoRampStart);
  const tempoRampEnd = useStore((state) => state.tempoRampEnd);
  const tempoRampSteps = useStore((state) => state.tempoRampSteps);
  const progressiveMode = useStore((state) => state.progressiveMode);
  
  // Audio
  const audioBuffers = useStore((state) => state.audioBuffers);
  const audioBuffersLoaded = useStore((state) => state.audioBuffersLoaded);
  const volumes = useStore((state) => state.volumes);
  
  // Patterns
  const patterns = useStore((state) => state.patterns);
  const polyrhythmPatterns = useStore((state) => state.polyrhythmPatterns);
  
  // Actions
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const setCurrentLoop = useStore((state) => state.setCurrentLoop);
  const setPlaybackPosition = useStore((state) => state.setPlaybackPosition);
  const setBPM = useStore((state) => state.setBPM);
  const setMIDICountInActive = useStore((state) => state.setMIDICountInActive);
  const setMicrophoneCountInActive = useStore((state) => state.setMicrophoneCountInActive);

  const audioContextRef = useRef<AudioContext | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const noteIndexRef = useRef<number>(0);
  const isCountInRef = useRef<boolean>(false);
  const countInBeatRef = useRef<number>(0);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  /**
   * Initialize audio context
   */
  useEffect(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = getAudioContext();
      } catch (error) {
        console.error('Failed to create AudioContext:', error);
      }
    }
  }, []);

  /**
   * Play a drum sound
   */
  const playDrumSound = useCallback((sound: string, volume: number = 1.0) => {
    if (!audioContextRef.current || !playDrumSounds) {
      return;
    }
    
    if (!audioBuffersLoaded) {
      console.warn('Audio buffers not loaded yet, cannot play drum sound:', sound);
      return;
    }

    const bufferMap: Record<string, keyof typeof audioBuffers> = {
      S: 'snare',
      K: 'kick',
      I: 'highTom', // High Tom (internal code - normalized from Ht)
      M: 'midTom', // Mid Tom (internal code - normalized from Mt)
      T: 'highTom', // Legacy support - T maps to highTom
      F: 'floor',
      H: 'hiHat',
    };

    // Normalize: convert two-letter codes (Ht, Mt) to single letters (I, M) like in Stave.tsx
    let normalizedSound = sound;
    const upperSound = sound.toUpperCase();
    if (upperSound === 'HT') normalizedSound = 'I'; // High Tom -> I
    else if (upperSound === 'MT') normalizedSound = 'M'; // Mid Tom -> M
    else normalizedSound = upperSound; // Single letters (S, K, T, F, H) to uppercase
    
    const bufferKey = bufferMap[normalizedSound];
    if (!bufferKey) {
      console.warn(`No buffer found for sound: "${sound}" (normalized: "${normalizedSound}")`);
      console.warn(`Available bufferMap keys:`, Object.keys(bufferMap));
      return;
    }

    const buffer = audioBuffers[bufferKey];
    if (!buffer) return;

    try {
      const source = audioContextRef.current.createBufferSource();
      const gainNode = audioContextRef.current.createGain();
      
      source.buffer = buffer;
      // Map buffer keys to volume keys
      // Note: highTom, midTom, and floor use snare volume for now
      // (could be extended to have separate volume controls in the future)
      const volumeKey: keyof typeof volumes = 
        bufferKey === 'snare' ? 'snare' : 
        bufferKey === 'kick' ? 'kick' : 
        bufferKey === 'hiHat' ? 'hiHat' :
        bufferKey === 'highTom' ? 'snare' : // Use snare volume for highTom
        bufferKey === 'midTom' ? 'snare' : // Use snare volume for midTom
        bufferKey === 'floor' ? 'snare' : // Use snare volume for floor
        'snare'; // Default to snare volume
      const volumeValue = volumes[volumeKey] || 1.0;
      gainNode.gain.value = volume * volumeValue;
      
      // Debug logging
        // console.log(`Playing drum sound: ${sound} (${bufferKey}), volume: ${(volume * volumeValue * 100).toFixed(0)}%`);
      if (volumeValue === 0) {
        console.warn(`Volume for ${volumeKey} is 0 - sound won't be audible`);
      }
      
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      source.start(0);
    } catch (error) {
      console.error(`Error playing drum sound ${sound}:`, error);
    }
  }, [audioBuffers, audioBuffersLoaded, volumes]);

  /**
   * Play a metronome click with different sound types
   */
  const playClick = useCallback((isAccent: boolean = false) => {
    // Don't play clicks if clickMode is 'none' or silent practice mode
    if (!audioContextRef.current || clickMode === 'none' || silentPracticeMode) {
      return;
    }

    try {
      const osc = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      const now = audioContextRef.current.currentTime;
      
      // Configure oscillator based on click sound type
      switch (clickSoundType) {
        case 'woodblock':
          osc.type = 'sine';
          osc.frequency.value = isAccent ? 800 : 600;
          break;
        case 'beep':
          osc.type = 'square';
          osc.frequency.value = isAccent ? 1000 : 800;
          break;
        case 'tick':
          osc.type = 'sine';
          osc.frequency.value = isAccent ? 400 : 300;
          break;
        case 'metronome':
          osc.type = 'sine';
          osc.frequency.value = isAccent ? 1200 : 1000;
          break;
        default: // 'default'
          osc.type = 'sine';
          osc.frequency.value = isAccent ? 800 : 600;
          break;
      }
      
      // Quick attack and decay for click sound
      const volume = volumes.click || 0.8;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(isAccent ? 0.3 * volume : 0.2 * volume, now + 0.001);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      
      osc.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (error) {
      console.error('Error playing click:', error);
    }
  }, [clickMode, silentPracticeMode, clickSoundType, volumes.click]);

  /**
   * Calculate scheduled notes for a polyrhythm pattern
   * Handles learning mode (right only → left only → together)
   */
  const calculatePolyrhythmScheduledNotes = useCallback((
    polyrhythmPattern: PolyrhythmPattern,
    patternIndex: number,
    globalNoteIndexStart: number,
    cumulativeTimeStart: number,
    speed: number
  ): { notes: ScheduledNote[]; nextGlobalNoteIndex: number; nextCumulativeTime: number } => {
    const scheduledNotes: ScheduledNote[] = [];
    let currentGlobalNoteIndex = globalNoteIndexStart;
    let currentCumulativeTime = cumulativeTimeStart;

    const timeSignature = parseTimeSignature(polyrhythmPattern.timeSignature);
    const notesPerBeat = Math.max(1, polyrhythmPattern.subdivision / 4);
    const beatsPerMinute = bpm;
    const secondsPerBeat = 60.0 / beatsPerMinute;
    const noteDuration = secondsPerBeat / notesPerBeat;
    const cycleLength = polyrhythmPattern.cycleLength;

    // Voice to sound mapping
    const voiceToSound: Record<string, string> = {
      snare: 'S',
      kick: 'K',
      'hi-hat': 'H', // Hi-hat
      'hihat': 'H', // Alternative spelling
      'high-tom': 'Ht',
      'hightom': 'Ht',
      'mid-tom': 'Mt',
      'midtom': 'Mt',
      tom: 'Ht', // Legacy support - tom maps to highTom
      floor: 'F',
    };

    const rightSound = voiceToSound[polyrhythmPattern.rightRhythm.voice] || 'S';
    const leftSound = voiceToSound[polyrhythmPattern.leftRhythm.voice] || 'K';

    // Learning mode handling
    if (polyrhythmPattern.learningMode.enabled) {
      const { rightHandLoops, leftHandLoops, togetherLoops } = polyrhythmPattern.learningMode;

      // Phase 1: Right hand only
      for (let loop = 0; loop < rightHandLoops; loop++) {
        const loopStartTime = currentCumulativeTime;
        for (let cycle = 0; cycle < polyrhythmPattern.repeat; cycle++) {
          for (let i = 0; i < cycleLength; i++) {
            const hasRight = polyrhythmPattern.rightRhythm.notes.includes(i);
            const globalIndex = cycle * cycleLength + i;
            const timeInLoop = loopStartTime + (cycle * cycleLength * noteDuration) + (i * noteDuration);
            const time = timeInLoop / speed;

            const noteInBeat = globalIndex % notesPerBeat;
            const isBeat = noteInBeat === 0;

            const sounds: string[] = [];
            // Note: Click logic is handled in the regular pattern section, not here for polyrhythms
            // This section just handles drum sounds for polyrhythms

            if (hasRight && (playDrumSounds || metronomeOnlyMode === false)) {
              sounds.push(rightSound);
            }

            scheduledNotes.push({
              time,
              sounds,
              isBeat,
              noteIndex: currentGlobalNoteIndex++,
              patternIndex,
            });
          }
        }
        currentCumulativeTime += polyrhythmPattern.repeat * cycleLength * noteDuration;
      }

      // Phase 2: Left hand only
      for (let loop = 0; loop < leftHandLoops; loop++) {
        const loopStartTime = currentCumulativeTime;
        for (let cycle = 0; cycle < polyrhythmPattern.repeat; cycle++) {
          for (let i = 0; i < cycleLength; i++) {
            const hasLeft = polyrhythmPattern.leftRhythm.notes.includes(i);
            const globalIndex = cycle * cycleLength + i;
            const timeInLoop = loopStartTime + (cycle * cycleLength * noteDuration) + (i * noteDuration);
            const time = timeInLoop / speed;

            const noteInBeat = globalIndex % notesPerBeat;
            const isBeat = noteInBeat === 0;

            const sounds: string[] = [];
            // Note: Click logic is handled in the regular pattern section, not here for polyrhythms
            // This section just handles drum sounds for polyrhythms

            if (hasLeft && (playDrumSounds || metronomeOnlyMode === false)) {
              sounds.push(leftSound);
            }

            scheduledNotes.push({
              time,
              sounds,
              isBeat,
              noteIndex: currentGlobalNoteIndex++,
              patternIndex,
            });
          }
        }
        currentCumulativeTime += polyrhythmPattern.repeat * cycleLength * noteDuration;
      }

      // Phase 3: Together
      for (let loop = 0; loop < togetherLoops; loop++) {
        const loopStartTime = currentCumulativeTime;
        for (let cycle = 0; cycle < polyrhythmPattern.repeat; cycle++) {
          for (let i = 0; i < cycleLength; i++) {
            const hasRight = polyrhythmPattern.rightRhythm.notes.includes(i);
            const hasLeft = polyrhythmPattern.leftRhythm.notes.includes(i);
            const globalIndex = cycle * cycleLength + i;
            const timeInLoop = loopStartTime + (cycle * cycleLength * noteDuration) + (i * noteDuration);
            const time = timeInLoop / speed;

            const noteInBeat = globalIndex % notesPerBeat;
            const isBeat = noteInBeat === 0;

            const sounds: string[] = [];
            // Note: Click logic is handled in the regular pattern section, not here for polyrhythms
            // This section just handles drum sounds for polyrhythms

            if (playDrumSounds || metronomeOnlyMode === false) {
              if (hasRight) {
                sounds.push(rightSound);
              }
              if (hasLeft) {
                sounds.push(leftSound);
              }
            }

            scheduledNotes.push({
              time,
              sounds,
              isBeat,
              noteIndex: currentGlobalNoteIndex++,
              patternIndex,
            });
          }
        }
        currentCumulativeTime += polyrhythmPattern.repeat * cycleLength * noteDuration;
      }
    } else {
      // Normal playback: both rhythms together
      for (let repeat = 0; repeat < polyrhythmPattern.repeat; repeat++) {
        const repeatStartTime = currentCumulativeTime;
        for (let i = 0; i < cycleLength; i++) {
          const hasRight = polyrhythmPattern.rightRhythm.notes.includes(i);
          const hasLeft = polyrhythmPattern.leftRhythm.notes.includes(i);
          const timeInRepeat = repeatStartTime + (i * noteDuration);
          const time = timeInRepeat / speed;

          const noteInBeat = i % notesPerBeat;
          const isBeat = noteInBeat === 0;

          const sounds: string[] = [];
          // Note: Click logic for polyrhythms in normal mode would need to be implemented here
          // For now, clicks are only handled in the regular pattern section

          if (playDrumSounds || metronomeOnlyMode === false) {
            if (hasRight) {
              sounds.push(rightSound);
            }
            if (hasLeft) {
              sounds.push(leftSound);
            }
          }

          scheduledNotes.push({
            time,
            sounds,
            isBeat,
            noteIndex: currentGlobalNoteIndex++,
            patternIndex,
          });
        }
        currentCumulativeTime += cycleLength * noteDuration;
      }
    }

    return {
      notes: scheduledNotes,
      nextGlobalNoteIndex: currentGlobalNoteIndex,
      nextCumulativeTime: currentCumulativeTime,
    };
  }, [bpm, slowMotionEnabled, slowMotionSpeed, clickMode, metronomeOnlyMode, playDrumSounds, silentPracticeMode]);

  /**
   * Calculate BPM for a given loop number (for tempo ramping)
   * Always reads fresh values from store to avoid stale closure issues
   */
  const getCurrentBPM = useCallback((loopNumber: number): number => {
    // Always read fresh values from store to avoid stale closure issues
    const store = useStore.getState();
    const isRamping = store.tempoRamping;
    
    if (!isRamping) {
      return store.bpm;
    }
    
    // Calculate ramp progress (0 to 1)
    const loopsCompleted = loopNumber; // Loop 0 is the first loop
    if (loopsCompleted >= store.tempoRampSteps) {
      // Ramp complete, use end BPM
      return store.tempoRampEnd;
    }
    
    // Linear interpolation between start and end BPM
    const progress = loopsCompleted / store.tempoRampSteps;
    const currentBPM = store.tempoRampStart + (store.tempoRampEnd - store.tempoRampStart) * progress;
    
    return Math.max(40, Math.min(260, currentBPM)); // Clamp between 40-260
  }, []);

  /**
   * Calculate all scheduled notes from patterns
   */
  const calculateScheduledNotes = useCallback((): ScheduledNote[] => {
    // Combine regular patterns and polyrhythm patterns
    const hasPatterns = patterns.length > 0 || polyrhythmPatterns.length > 0;
    if (!hasPatterns) {
      return [];
    }

    const scheduledNotes: ScheduledNote[] = [];
    let globalNoteIndex = 0;
    const speed = slowMotionEnabled ? slowMotionSpeed : 1.0;

    // Determine which patterns/bars to play
    let patternsToPlay = patterns;
    let startNoteIndex = 0;
    let endNoteIndex = Infinity;

    if (loopMeasures) {
      // Calculate note indices for measure range
      let currentNote = 0;
      patternsToPlay = [];
      
      for (const pattern of patterns) {
        // Calculate actual notes per bar from time signature and subdivision
        const notesPerBar = calculateNotesPerBar(pattern.timeSignature || '4/4', pattern.subdivision);
        const totalNotes = notesPerBar * pattern.repeat;
        const measureNumber = Math.floor(currentNote / notesPerBar);
        
        if (measureNumber >= loopMeasures.start - 1 && measureNumber < loopMeasures.end) {
          patternsToPlay.push(pattern);
          if (measureNumber === loopMeasures.start - 1) {
            startNoteIndex = currentNote;
          }
          if (measureNumber === loopMeasures.end - 1) {
            endNoteIndex = currentNote + totalNotes;
          }
        }
        
        currentNote += totalNotes;
      }
    }

    // Calculate notes for ONLY the current loop (not all loops)
    // This allows proper looping behavior with tempo ramping
    // Get fresh current loop value from store (may have been updated)
    const currentLoopValue = useStore.getState().currentLoop;
    
    // Calculate BPM for the current loop
    const loopBPM = getCurrentBPM(currentLoopValue);
    
    // Debug logging for tempo ramping
    const store = useStore.getState();
    if (store.tempoRamping && currentLoopValue < 4) {
      console.log(`[Tempo Ramp] Calculating notes for loop ${currentLoopValue}, BPM: ${loopBPM}, Store BPM: ${store.bpm}`);
    }
    
    // Calculate notes for this single loop iteration
    let cumulativeTime = 0;
      
    // Process each pattern
    // Track cumulative time across patterns (not just note index)
    // This ensures smooth transitions between patterns with different subdivisions
    
    for (let patternIndex = 0; patternIndex < patternsToPlay.length; patternIndex++) {
        const pattern = patternsToPlay[patternIndex];
        const phrase = parseNumberList(pattern.phrase);
        const drumPatternTokens = parseTokens(pattern.drumPattern).map(t => t.toUpperCase());
        const timeSignature = parseTimeSignature(pattern.timeSignature);
        const [numerator, denominator] = timeSignature;
        
        // Calculate actual notes per bar from time signature and subdivision
        const notesPerBar = calculateNotesPerBar(pattern.timeSignature || '4/4', pattern.subdivision);
        
        // Calculate notes per beat for timing (based on denominator from time signature)
        // For 4/4, denominator=4 means quarter note gets the beat
        // For 7/8, denominator=8 means eighth note gets the beat
        const notesPerBeat = Math.max(1, pattern.subdivision / denominator);
        
        // Calculate note duration for THIS pattern using current loop BPM
        const beatsPerMinute = loopBPM;
        const secondsPerBeat = 60.0 / beatsPerMinute;
        const noteDuration = secondsPerBeat / notesPerBeat;
      
        // Calculate pattern start time (before processing repeats)
        // This will be used to track time within each repeat
        const patternStartTime = cumulativeTime;
        const totalNotesPerRepeat = notesPerBar; // Use calculated notesPerBar instead of phrase sum

        // Repeat pattern based on repeat value
        for (let repeat = 0; repeat < pattern.repeat; repeat++) {
          const repeatStartTime = patternStartTime + (repeat * totalNotesPerRepeat * noteDuration);
          
          for (let noteInPhrase = 0; noteInPhrase < totalNotesPerRepeat; noteInPhrase++) {
            // Skip if outside loop range
            if (globalNoteIndex < startNoteIndex || globalNoteIndex >= endNoteIndex) {
              globalNoteIndex++;
              continue;
            }

            const drumTokenIndex = noteInPhrase % drumPatternTokens.length;
            const drumToken = drumPatternTokens[drumTokenIndex];
            const normalizedToken = drumToken.replace(/\+/g, ' ');
            const voicingTokens = normalizedToken.split(/\s+/).filter(Boolean);
            // Rest is now "-" to match sticking pattern code (legacy "R" still supported)
            const isRest = voicingTokens.length === 0 || voicingTokens.every((token) => token === '-' || token === 'R');

            // Calculate time for this note using repeat start time + offset within repeat
            const timeInRepeat = repeatStartTime + (noteInPhrase * noteDuration);
            
            // Calculate absolute time in seconds from start
            const time = timeInRepeat / speed;
            
            // Calculate beat position for metronome clicks
            // Note: noteInPhrase is relative to this repeat, but for beat detection we need note position within the beat
            const noteInBeat = noteInPhrase % notesPerBeat;
            const isBeat = noteInBeat === 0;
            
            // Determine if this note has an accent
            // Use _presetAccents if available, otherwise derive from phrase
            const localNoteIndex = noteInPhrase % notesPerBar;
            const accentIndices = pattern._presetAccents !== undefined && pattern._presetAccents.length >= 0
              ? pattern._presetAccents
              : buildAccentIndices(phrase); // Fallback to phrase-based accents
            const hasAccent = accentIndices.includes(localNoteIndex);
            
            const sounds: string[] = [];

            // Determine if click should play based on clickMode
            let shouldPlayClick = false;
            let isAccentClick = false;
            
            if (clickMode !== 'none' && !silentPracticeMode) {
              switch (clickMode) {
                case 'beats':
                  // Click on beats 1, 2, 3, 4 (first note of each beat)
                  if (isBeat) {
                    shouldPlayClick = true;
                    // Beat 1 is accent
                    const beatNumber = Math.floor(localNoteIndex / notesPerBeat) + 1;
                    isAccentClick = beatNumber === 1;
                  }
                  break;
                case 'subdivision':
                  // Click on every note except rests
                  if (!isRest) {
                    shouldPlayClick = true;
                    isAccentClick = isBeat; // Accent on beats
                  }
                  break;
                case 'accents':
                  // Click ONLY on accents
                  if (hasAccent) {
                    shouldPlayClick = true;
                    isAccentClick = true;
                  }
                  break;
              }
            }
            
            if (shouldPlayClick) {
              // IMPORTANT: Flams count as ONE note position, so only add one click
              // Don't add duplicate clicks even if there are multiple stave note elements
              if (!sounds.includes('click')) {
                sounds.push('click');
                // Store accent info in note for later use
                if (isAccentClick) {
                  (sounds as any).__isAccent = true;
                }
              }
            }

            // Add drum sounds (unless in metronome-only mode or silent mode)
            if (!isRest && playDrumSounds && !metronomeOnlyMode && !silentPracticeMode) {
              for (const token of voicingTokens) {
                // Normalize token: convert Ht/Mt to I/M (internal codes) like in Stave.tsx
                if (token !== '-' && token !== 'R') {
                  const upperToken = token.toUpperCase();
                  let normalizedToken = token;
                  
                  // Normalize two-letter codes to single letters (same as Stave.tsx)
                  if (upperToken === 'HT') normalizedToken = 'I'; // High Tom -> I
                  else if (upperToken === 'MT') normalizedToken = 'M'; // Mid Tom -> M
                  else normalizedToken = upperToken; // Single letters (S, K, T, F, H) to uppercase
                  
                  // Allow all valid drum tokens (using normalized internal codes I, M)
                  const allowedTokens = ['S', 'K', 'T', 'F', 'H', 'I', 'M'];
                  if (allowedTokens.includes(normalizedToken)) {
                    // Use normalized token (I, M) instead of original (Ht, Mt)
                    sounds.push(normalizedToken);
                  }
                }
              }
            }

            // Schedule ALL notes (even if no sounds) so we can update playback position for visual feedback
            scheduledNotes.push({
              time,
              sounds,
              isBeat,
              noteIndex: globalNoteIndex,
              patternIndex,
              hasAccent, // Store accent info for playback
            });

            globalNoteIndex++;
          }
        }
      
        // After completing all repeats of this pattern, update cumulative time for next pattern
        const patternTotalNotes = notesPerBar * pattern.repeat;
        cumulativeTime += patternTotalNotes * noteDuration;
      }

      // Process polyrhythm patterns
      // Start pattern index after regular patterns
      let polyrhythmPatternIndex = patternsToPlay.length;
      
      for (const polyrhythmPattern of polyrhythmPatterns) {
        const { notes, nextGlobalNoteIndex, nextCumulativeTime } = calculatePolyrhythmScheduledNotes(
          polyrhythmPattern,
          polyrhythmPatternIndex++,
          globalNoteIndex,
          cumulativeTime,
          speed
        );
        
        scheduledNotes.push(...notes);
        globalNoteIndex = nextGlobalNoteIndex;
        cumulativeTime = nextCumulativeTime;
      }
      
    // No need to update total cumulative time since we're only calculating one loop

    // Reverse if playing backwards
    if (playBackwards) {
      scheduledNotes.reverse();
      scheduledNotes.forEach((note, idx) => {
        note.time = scheduledNotes[scheduledNotes.length - 1].time - note.time;
      });
    }

    return scheduledNotes;
  }, [patterns, polyrhythmPatterns, bpm, slowMotionEnabled, slowMotionSpeed, playBackwards, loopMeasures, metronomeOnlyMode, playDrumSounds, silentPracticeMode, clickMode, getCurrentBPM, calculatePolyrhythmScheduledNotes, tempoRamping]);

  /**
   * Evaluate performance for progressive mode and adjust difficulty
   */
  const evaluateProgressiveMode = useCallback(() => {
    if (!progressiveMode) return;
    
    // Get practice state to evaluate performance
    const store = useStore.getState();
    const midiPractice = store.midiPractice;
    const microphonePractice = store.microphonePractice;
    
    // Check if practice mode is active
    const isPracticeModeActive = midiPractice.enabled || microphonePractice.enabled;
    
    if (!isPracticeModeActive) {
      // No practice mode active - progressive mode requires practice tracking
      // For now, just log that progressive mode is active
      console.log('[Progressive Mode] Active but no practice mode enabled. Enable MIDI or Microphone practice to track performance.');
      return;
    }
    
    // Calculate performance metrics
    let accuracy = 0;
    let totalNotes = 0;
    let matchedNotes = 0;
    
    if (midiPractice.enabled) {
      totalNotes = midiPractice.expectedNotes.length;
      matchedNotes = midiPractice.expectedNotes.filter(n => n.matched).length;
      accuracy = totalNotes > 0 ? matchedNotes / totalNotes : 0;
    } else if (microphonePractice.enabled) {
      totalNotes = microphonePractice.expectedNotes.length;
      matchedNotes = microphonePractice.expectedNotes.filter(n => n.matched).length;
      accuracy = totalNotes > 0 ? matchedNotes / totalNotes : 0;
    }
    
    // Progressive mode logic: Adjust difficulty based on performance
    // For now, this is a foundation that can be enhanced with actual difficulty adjustments
    console.log(`[Progressive Mode] Performance: ${(accuracy * 100).toFixed(1)}% accuracy (${matchedNotes}/${totalNotes} notes matched)`);
    
    // TODO: Implement difficulty adjustment logic:
    // - If accuracy is high (>90%), suggest increasing subdivision or tempo
    // - If accuracy is low (<70%), suggest decreasing difficulty
    // - Gradually increase complexity over successful loops
    // - Track difficulty level and adjust patterns dynamically
    
    if (accuracy >= 0.9 && totalNotes > 0) {
      console.log('[Progressive Mode] High accuracy detected. Consider increasing difficulty in future loops.');
      // Future: Automatically increase subdivision, tempo, or complexity
    } else if (accuracy < 0.7 && totalNotes > 0) {
      console.log('[Progressive Mode] Lower accuracy detected. Consider maintaining current difficulty or decreasing.');
      // Future: Automatically decrease difficulty or maintain current level
    }
  }, [progressiveMode]);

  /**
   * Schedule playback
   */
  const schedulePlayback = useCallback(async () => {
    // console.log('schedulePlayback called');
    
    if (!audioContextRef.current) {
      console.warn('AudioContext not available');
      return;
    }

    if (!audioBuffersLoaded && playDrumSounds) {
      console.warn('Audio buffers not loaded yet');
      return;
    }

    // Resume audio context if suspended
    try {
      await resumeAudioContext(audioContextRef.current);
      // console.log('AudioContext resumed, state:', audioContextRef.current.state);
    } catch (error) {
      console.error('Failed to resume AudioContext:', error);
      return;
    }

    const scheduledNotes = calculateScheduledNotes();
    // console.log('Scheduled notes:', scheduledNotes.length);
    
    if (scheduledNotes.length === 0) {
      console.warn('No notes to play - check if patterns exist and have valid notes');
      setIsPlaying(false);
      return;
    }

    const currentTime = audioContextRef.current.currentTime;
    let startOffset = 0.1; // Small delay for scheduling
    
    // Get current loop value from store to ensure it's accurate (may have been updated)
    const currentLoopValue = useStore.getState().currentLoop;
    
    // Count-in only on first loop (loop 0) or if explicitly enabled for all loops
    // For subsequent loops, skip count-in to enable seamless looping
    const shouldDoCountIn = countInEnabled && !isCountInRef.current && currentLoopValue === 0;
    
    if (tempoRamping && currentLoopValue === 0 && countInEnabled) {
      console.log(`[Tempo Ramp] Count-in check - countInEnabled: ${countInEnabled}, isCountInRef: ${isCountInRef.current}, currentLoop: ${currentLoopValue}, shouldDoCountIn: ${shouldDoCountIn}`);
    }
    
    // Use correct BPM for count-in: use loop BPM (for tempo ramping) instead of current bpm
    // Use currentLoopValue (from store) instead of currentLoop (from closure) to get fresh value
    const countInBPM = tempoRamping ? getCurrentBPM(currentLoopValue) : bpm;
    
    // Count-in if enabled and on first loop
    if (shouldDoCountIn) {
      // console.log('Scheduling count-in');
      isCountInRef.current = true;
      countInBeatRef.current = 0;
      
      // Set count-in active for MIDI practice
      setMIDICountInActive(true);
      setMicrophoneCountInActive(true);
      
      // Play 4 clicks before starting at the same BPM as the current loop
      // Count-in uses beat timing (one click per beat), not note timing
      // Use loop BPM for count-in to match the loop's tempo
      const countInBeatDuration = 60000 / countInBPM; // milliseconds per beat
      const countInSecondsPerBeat = 60.0 / countInBPM;
      
      for (let i = 0; i < 4; i++) {
        const clickTime = currentTime + 0.1 + (i * countInSecondsPerBeat);
        const timeoutMs = (clickTime - currentTime) * 1000;
        
        // console.log(`Count-in click ${i + 1} scheduled for ${timeoutMs.toFixed(1)}ms (beat duration: ${countInBeatDuration.toFixed(1)}ms)`);
        
        const timeoutId = setTimeout(() => {
          if (audioContextRef.current && isPlayingRef.current) {
            const isAccent = i === 0 && clickMode === 'beats';
            // console.log(`Playing count-in click ${i + 1}`);
            playClick(isAccent);
            
            // After the last click, deactivate count-in (slight delay to ensure it happens after)
            if (i === 3) {
              setTimeout(() => {
                setMIDICountInActive(false);
                setMicrophoneCountInActive(false);
              }, 50);
            }
          } else {
            // console.log('Count-in click skipped - not playing or no audio context');
          }
        }, Math.max(0, timeoutMs));
        timeoutsRef.current.push(timeoutId);
      }
      
      startOffset += 4 * countInSecondsPerBeat;
      
      // Add a small gap after count-in to prevent double click with first pattern note
      // This ensures count-in's last click doesn't overlap with the pattern's first click
      startOffset += 0.05; // 50ms gap after count-in
    } else {
      // console.log('Count-in disabled or already played');
      // Ensure count-in is inactive if not using count-in
      setMIDICountInActive(false);
      setMicrophoneCountInActive(false);
    }

    startTimeRef.current = currentTime + startOffset;
    // console.log('Playback start time set:', startTimeRef.current.toFixed(3), 'Current time:', currentTime.toFixed(3), 'Offset:', startOffset.toFixed(3));
    noteIndexRef.current = 0;
    
    // console.log('Scheduling notes. Start time:', startTimeRef.current, 'Current time:', currentTime, 'Offset:', startOffset);
    // console.log('First note time:', scheduledNotes[0]?.time, 'Last note time:', scheduledNotes[scheduledNotes.length - 1]?.time);

    // Schedule all notes using setTimeout
    // Calculate all timeouts relative to the initial currentTime for consistency
    scheduledNotes.forEach((note, idx) => {
      const noteAbsoluteTime = startTimeRef.current! + note.time;
      const timeoutMs = (noteAbsoluteTime - currentTime) * 1000;
      
      if (idx < 4) {
        // console.log(`Scheduling note ${idx} (globalNoteIndex=${note.noteIndex}): noteTime=${note.time.toFixed(3)}s, absoluteTime=${noteAbsoluteTime.toFixed(3)}s, timeoutMs=${timeoutMs.toFixed(1)}ms`);
      }
      
      if (timeoutMs >= 0 && timeoutMs < 60000) { // Cap at 60 seconds to avoid issues
        const timeoutId = setTimeout(() => {
          if (!isPlayingRef.current || !audioContextRef.current) {
            // console.log('Playback stopped or AudioContext not available');
            return;
          }

          // Verify timing accuracy
          const actualTime = audioContextRef.current.currentTime;
          const expectedTime = noteAbsoluteTime;
          const timingError = Math.abs((actualTime - expectedTime) * 1000);
          if (idx < 4) {
            // console.log(`Note ${idx} fired: expected=${expectedTime.toFixed(3)}s, actual=${actualTime.toFixed(3)}s, error=${timingError.toFixed(1)}ms`);
          }

          // Update playback position for visual feedback (always, even if no sounds)
          setPlaybackPosition(note.noteIndex);
          
          // Update current beat for visual metronome (only on beat notes)
          if (note.isBeat) {
            const setCurrentBeat = useStore.getState().setCurrentBeat;
            // Calculate which beat we're on (1-4) based on note index
            // Find which pattern this note belongs to
            let noteIndexInPattern = note.noteIndex;
            let notesPerBeat = 4; // default fallback
            
            for (const pattern of patterns) {
              // Calculate actual notes per bar from time signature and subdivision
              const notesPerBar = calculateNotesPerBar(pattern.timeSignature || '4/4', pattern.subdivision);
              const [numerator, denominator] = parseTimeSignature(pattern.timeSignature || '4/4');
              const totalNotes = notesPerBar * (pattern.repeat || 1);
              
              if (noteIndexInPattern < totalNotes) {
                // This note belongs to this pattern
                // Calculate notes per beat based on time signature denominator
                notesPerBeat = Math.max(1, pattern.subdivision / denominator);
                const localNoteIndex = noteIndexInPattern % notesPerBar;
                const beatIndex = Math.floor(localNoteIndex / notesPerBeat);
                const currentBeat = (beatIndex % numerator) + 1;
                setCurrentBeat(currentBeat);
                break;
              }
              
              noteIndexInPattern -= totalNotes;
            }
          }

          // Play all sounds for this note
          // IMPORTANT: Flams count as ONE note position, so only play one click per scheduled note
          if (note.sounds.length > 0) {
            let clickPlayed = false; // Track if click has been played for this note
            for (const sound of note.sounds) {
              if (sound === 'click') {
                // Only play click once per scheduled note (flams count as one note)
                if (!clickPlayed) {
                  // Use the accent info stored in the note
                  const isAccent = (sound as any).__isAccent || note.hasAccent || false;
                  playClick(isAccent);
                  clickPlayed = true; // Mark click as played
                }
              } else {
                playDrumSound(sound);
              }
            }
          }

          noteIndexRef.current = note.noteIndex;

          // Check if this is the last note
          if (idx === scheduledNotes.length - 1) {
            // Finished this loop - check if we need to loop again
            const store = useStore.getState();
            if (store.tempoRamping) {
              console.log(`[Tempo Ramp] Last note fired (idx=${idx}, total=${scheduledNotes.length}). Will check for loop restart in 50ms.`);
            }
            
            const checkLoopTimeoutId = setTimeout(() => {
              if (!isPlayingRef.current || !audioContextRef.current) {
                const store = useStore.getState();
                if (store.tempoRamping) {
                  console.log(`[Tempo Ramp] Loop restart check skipped - isPlaying: ${isPlayingRef.current}, audioContext: ${!!audioContextRef.current}`);
                }
                return;
              }
              
              // Get fresh state from store to check current loop
              const storeForLoop = useStore.getState();
              const currentLoopValue = storeForLoop.currentLoop;
              const loopCountValue = storeForLoop.loopCount;
              
              if (storeForLoop.tempoRamping) {
                console.log(`[Tempo Ramp] Loop restart check - currentLoop: ${currentLoopValue}, loopCount: ${loopCountValue}, should loop: ${currentLoopValue + 1 < loopCountValue}`);
              }
              
              if (currentLoopValue + 1 < loopCountValue) {
                const nextLoop = currentLoopValue + 1;
                
                // Clear highlighting before starting next loop
                setPlaybackPosition(null);
                noteIndexRef.current = 0;
                
                // Update BPM for tempo ramping (if enabled) BEFORE updating loop
                // This ensures BPM is correct when useEffect might run
                const storeForBPM = useStore.getState();
                if (storeForBPM.tempoRamping) {
                  const loopBPM = getCurrentBPM(nextLoop);
                  setBPM(loopBPM);
                }
                
                // Update loop AFTER BPM to avoid useEffect interference
                // Set current loop so calculateScheduledNotes can read the correct value
                setCurrentLoop(nextLoop);
                
                // Reset count-in flag so count-in only happens on first loop
                isCountInRef.current = false;
                
                // Calculate gap between loops: wait one full beat duration for clean transition
                // This prevents the "1and2and3and41" effect where loops merge together
                // Use the NEXT loop's BPM for the gap calculation (since we're transitioning to it)
                // Read fresh values from store to avoid stale closure issues
                const storeForGap = useStore.getState();
                const nextLoopBPM = storeForGap.tempoRamping ? getCurrentBPM(nextLoop) : storeForGap.bpm;
                const beatDurationMs = 60000 / nextLoopBPM; // One beat in milliseconds
                
                // Store timeout ID in a ref to prevent it from being cleared
                // This ensures the timeout fires even if useEffect runs
                const restartTimeoutId = setTimeout(() => {
                  const storeAtRestart = useStore.getState();
                  console.log(`[Tempo Ramp] Restart timeout fired - isPlaying: ${isPlayingRef.current}, audioContext: ${!!audioContextRef.current}, currentLoop: ${storeAtRestart.currentLoop}`);
                  
                  // Double-check we still have the timeout in our array
                  if (!timeoutsRef.current.includes(restartTimeoutId)) {
                    console.warn(`[Tempo Ramp] Timeout ${restartTimeoutId} was removed from timeouts array!`);
                  }
                  
                  if (isPlayingRef.current && audioContextRef.current) {
                    // Verify we have the updated loop value before scheduling
                    console.log(`[Tempo Ramp] Restarting loop ${storeAtRestart.currentLoop}, BPM: ${storeAtRestart.bpm}, Loop BPM: ${getCurrentBPM(storeAtRestart.currentLoop)}`);
                    schedulePlayback();
                  } else {
                    console.log(`[Tempo Ramp] Restart cancelled - isPlaying: ${isPlayingRef.current}, audioContext: ${!!audioContextRef.current}`);
                  }
                }, beatDurationMs);
                console.log(`[Tempo Ramp] Scheduled restart timeout ${restartTimeoutId} for ${beatDurationMs}ms (next loop: ${nextLoop}), total timeouts: ${timeoutsRef.current.length}`);
                timeoutsRef.current.push(restartTimeoutId);
                console.log(`[Tempo Ramp] Added timeout to array, total timeouts now: ${timeoutsRef.current.length}`);
              } else {
                // All loops complete
                
                // Progressive mode: Evaluate performance and adjust difficulty if enabled
                if (progressiveMode) {
                  evaluateProgressiveMode();
                }
                
                // Keep last note highlighted briefly before clearing
                setTimeout(() => {
                  setIsPlaying(false);
                  setCurrentLoop(0);
                setPlaybackPosition(null);
                const setCurrentBeat = useStore.getState().setCurrentBeat;
                setCurrentBeat(0); // Reset beat when stopped
                isCountInRef.current = false;
                noteIndexRef.current = 0;
                }, 200); // Keep last note highlighted for 200ms before clearing
              }
            }, 50); // Small delay to ensure state is settled
            timeoutsRef.current.push(checkLoopTimeoutId);
          }
        }, Math.max(0, timeoutMs));
        timeoutsRef.current.push(timeoutId);
      } else if (timeoutMs < 0) {
        console.warn(`Note ${idx} is in the past (timeoutMs=${timeoutMs.toFixed(1)}ms), skipping`);
      }
    });
  }, [isPlaying, audioBuffersLoaded, calculateScheduledNotes, playDrumSound, playClick, countInEnabled, setIsPlaying, setCurrentLoop, setPlaybackPosition, clickMode, patterns, polyrhythmPatterns, bpm, playDrumSounds, tempoRamping, getCurrentBPM, setBPM, progressiveMode, evaluateProgressiveMode]);

  /**
   * Update isPlayingRef when isPlaying changes
   */
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  /**
   * Start playback
   */
  useEffect(() => {
    // console.log('Playback effect:', { isPlaying, audioBuffersLoaded, playDrumSounds, clickMode, patternsCount: patterns.length });
    
    // Allow playback even if audio buffers aren't loaded (for metronome clicks)
    if (isPlaying) {
      // Only require audio buffers if we're playing drum sounds
      // Check both regular patterns and polyrhythm patterns
      const hasPatterns = patterns.length > 0 || polyrhythmPatterns.length > 0;
      if (!hasPatterns) {
        console.warn('No patterns to play');
        setIsPlaying(false);
        return;
      }
      
      if (playDrumSounds && !audioBuffersLoaded) {
        console.warn('Cannot play drum sounds: audio buffers not loaded');
        setIsPlaying(false);
        return;
      }
      
      // Only reset loop tracking if starting a new playback session (loop is 0)
      // If loop > 0, we're continuing an existing loop, so don't reset or restart
      const store = useStore.getState();
      const currentLoopInStore = store.currentLoop;
      
      // Check if this is a fresh start (loop 0) or a loop restart (loop > 0)
      // For loop restarts, the timeout callback will call schedulePlayback directly
      // For fresh starts, we need to initialize everything here
      if (currentLoopInStore === 0 || (currentLoopInStore > 0 && startTimeRef.current === null)) {
        // Starting fresh OR loop restart where audio context wasn't set up
        // Clear timeouts only if starting fresh (loop 0)
        if (currentLoopInStore === 0) {
          timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
          timeoutsRef.current = [];
          
          setCurrentLoop(0);
          noteIndexRef.current = 0;
          // Don't reset isCountInRef here - let schedulePlayback check if count-in should happen
          // Reset it after count-in if it runs, or before first note if it doesn't
          
          // Update BPM for tempo ramping (if enabled)
          if (tempoRamping) {
            const loopBPM = getCurrentBPM(0); // Start with loop 0
            setBPM(loopBPM);
          }
        }
        
        // Don't set playback position yet - wait until after count-in (if enabled)
        // This prevents highlighting during count-in
        if (!countInEnabled) {
          setPlaybackPosition(0); // Start at first note if no count-in
        } else {
          setPlaybackPosition(null); // Clear position during count-in
        }
        
        // console.log('Starting playback...');
        schedulePlayback();
      }
      // If currentLoopInStore > 0 and audio context is already set up,
      // we're in the middle of a loop restart - don't do anything,
      // let the scheduled restart handle it
    } else {
      // Stop playback
      if (schedulerRef.current !== null) {
        cancelAnimationFrame(schedulerRef.current);
        schedulerRef.current = null;
      }
      
      // Clear all scheduled timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
      
      startTimeRef.current = null;
      isCountInRef.current = false;
      countInBeatRef.current = 0;
      setMIDICountInActive(false);
      
      if (!isPlaying) {
        setCurrentLoop(0);
        setPlaybackPosition(null); // Clear position when stopped
        noteIndexRef.current = 0;
      }
    }

    return () => {
      if (schedulerRef.current !== null) {
        cancelAnimationFrame(schedulerRef.current);
        schedulerRef.current = null;
      }
      // Clear timeouts on unmount
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
    };
  }, [isPlaying, audioBuffersLoaded, schedulePlayback, setCurrentLoop, setPlaybackPosition, patterns, polyrhythmPatterns]);
}

