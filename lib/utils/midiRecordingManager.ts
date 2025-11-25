/**
 * Shared MIDI Recording Manager
 * Handles count-in and metronome for MIDI recording from anywhere
 */

let countInInterval: NodeJS.Timeout | null = null;
let metronomeInterval: NodeJS.Timeout | null = null;
let audioContext: AudioContext | null = null;
let countInCallback: (() => void) | null = null;
let metronomeCallback: ((isAccent: boolean) => void) | null = null;

/**
 * Play click sound
 */
async function playClickSound(isAccent: boolean) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContext;
    
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
}

/**
 * Start count-in
 */
export function startCountIn(
  bpm: number,
  beats: number,
  onComplete: () => void,
  onBeatChange?: (beat: number) => void
) {
  if (countInInterval) {
    clearInterval(countInInterval);
  }
  
  const msPerBeat = 60000 / bpm;
  let beatCount = 0; // Track which beat we're on (1, 2, 3, 4...)
  
  countInCallback = onComplete;
  
  // Play first beat immediately (beat 1)
  beatCount = 1;
  playClickSound(true); // Accent on beat 1
  if (onBeatChange) onBeatChange(beatCount);
  
  countInInterval = setInterval(() => {
    beatCount++;
    if (beatCount <= beats) {
      // Play click for beats 2, 3, 4... (no accent except beat 1)
      playClickSound(false);
      if (onBeatChange) onBeatChange(beatCount);
    } else {
      // Count-in complete (we've played all beats)
      if (countInInterval) {
        clearInterval(countInInterval);
        countInInterval = null;
      }
      if (countInCallback) {
        countInCallback();
        countInCallback = null;
      }
    }
  }, msPerBeat);
}

/**
 * Stop count-in
 */
export function stopCountIn() {
  if (countInInterval) {
    clearInterval(countInInterval);
    countInInterval = null;
  }
  countInCallback = null;
}

/**
 * Start metronome
 * @param bpm - Beats per minute
 * @param onBeat - Optional callback when a beat is played
 * @param totalBeats - Optional total number of beats to play (stops after this many beats)
 */
export function startMetronome(bpm: number, onBeat?: (beat: number) => void, totalBeats?: number) {
  if (metronomeInterval) {
    clearInterval(metronomeInterval);
  }
  
  const msPerBeat = 60000 / bpm;
  let beatCount = 0;
  
  // Play first beat immediately
  playClickSound(true);
  beatCount++;
  if (onBeat) onBeat(beatCount);
  
  // If totalBeats is set and we've already played all beats, stop
  if (totalBeats && beatCount >= totalBeats) {
    stopMetronome();
    return;
  }
  
  metronomeInterval = setInterval(() => {
    const isAccent = beatCount % 4 === 0; // Accent on beat 1 (every 4 beats)
    playClickSound(isAccent);
    beatCount++;
    if (onBeat) onBeat(beatCount);
    
    // Stop if we've reached the total number of beats
    if (totalBeats && beatCount >= totalBeats) {
      stopMetronome();
    }
  }, msPerBeat);
  
  metronomeCallback = (isAccent: boolean) => playClickSound(isAccent);
}

/**
 * Stop metronome
 */
export function stopMetronome() {
  if (metronomeInterval) {
    clearInterval(metronomeInterval);
    metronomeInterval = null;
  }
  metronomeCallback = null;
}


