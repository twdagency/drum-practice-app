/**
 * Audio loading utilities for drum sounds
 */

import { AudioBuffers } from '@/types';

/**
 * Load an audio file and return as AudioBuffer
 */
export async function loadAudioBuffer(
  audioContext: AudioContext,
  url: string
): Promise<AudioBuffer> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load audio: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch (error) {
    console.error(`Error loading audio from ${url}:`, error);
    throw error;
  }
}

/**
 * Load all drum sound audio buffers
 */
export async function loadAllAudioBuffers(
  audioContext: AudioContext
): Promise<AudioBuffers> {
  const [snare, kick, tom, highTom, midTom, floor, hiHat, crash, ride] = await Promise.all([
    loadAudioBuffer(audioContext, '/sounds/snare.wav'),
    loadAudioBuffer(audioContext, '/sounds/kick.wav'),
    loadAudioBuffer(audioContext, '/sounds/tom.wav').catch(() => null), // Legacy - fallback if doesn't exist
    loadAudioBuffer(audioContext, '/sounds/high-tom.wav'),
    loadAudioBuffer(audioContext, '/sounds/mid-tom.wav'),
    loadAudioBuffer(audioContext, '/sounds/floor.wav'),
    loadAudioBuffer(audioContext, '/sounds/hihat.wav'),
    loadAudioBuffer(audioContext, '/sounds/crash.wav').catch(() => null), // Crash cymbal - fallback to null if doesn't exist
    loadAudioBuffer(audioContext, '/sounds/ride.wav').catch(() => null), // Ride cymbal - fallback to null if doesn't exist
  ]);

  return {
    snare,
    kick,
    tom: tom || highTom, // Use highTom as fallback for legacy tom
    highTom,
    midTom,
    floor,
    hiHat,
    crash: crash || hiHat, // Fallback to hiHat if crash doesn't exist
    ride: ride || hiHat, // Fallback to hiHat if ride doesn't exist
  };
}

/**
 * Create or get AudioContext (handles browser restrictions)
 */
export function getAudioContext(): AudioContext {
  // Use existing context if available
  if (typeof window !== 'undefined') {
    const existingContext = (window as any).__audioContext as AudioContext | undefined;
    if (existingContext && existingContext.state !== 'closed') {
      return existingContext;
    }

    // Create new context
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API not supported');
    }

    const context = new AudioContextClass();
    (window as any).__audioContext = context;
    return context;
  }

  throw new Error('AudioContext can only be created in browser');
}

/**
 * Resume AudioContext if suspended (required for user interaction)
 */
export async function resumeAudioContext(audioContext: AudioContext): Promise<void> {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
}

