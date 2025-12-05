/**
 * Audio loading utilities for drum sounds
 */

import { AudioBuffers, DrumKitId, getDrumKit, getSamplePath, DRUM_KITS } from '@/types';

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
 * Get legacy (flat) sample path
 */
function getLegacySamplePath(sample: string): string {
  const sampleMap: Record<string, string> = {
    'snare': 'snare.wav',
    'kick': 'kick.wav',
    'hiHat': 'hihat.wav',
    'highTom': 'high-tom.wav',
    'midTom': 'mid-tom.wav',
    'floor': 'floor.wav',
    'crash': 'crash.wav',
    'ride': 'ride.wav',
  };
  return `/sounds/${sampleMap[sample] || sample + '.wav'}`;
}

/**
 * Load audio buffer with fallback to default kit and legacy paths
 */
async function loadSampleWithFallback(
  audioContext: AudioContext,
  kitId: DrumKitId,
  sample: 'snare' | 'kick' | 'hiHat' | 'highTom' | 'midTom' | 'floor' | 'crash' | 'ride'
): Promise<AudioBuffer | null> {
  const kit = getDrumKit(kitId);
  const primaryPath = getSamplePath(kit, sample);
  const legacyPath = getLegacySamplePath(sample);
  
  // Try paths in order: kit folder → legacy flat folder
  const pathsToTry = [primaryPath];
  
  // If not acoustic kit, also try acoustic folder
  if (kitId !== 'acoustic') {
    const acousticKit = getDrumKit('acoustic');
    pathsToTry.push(getSamplePath(acousticKit, sample));
  }
  
  // Always add legacy path as final fallback
  pathsToTry.push(legacyPath);
  
  for (const path of pathsToTry) {
    try {
      return await loadAudioBuffer(audioContext, path);
    } catch {
      // Continue to next path
    }
  }
  
  console.warn(`[AudioLoader] Could not load ${sample} from any source`);
  return null;
}

/**
 * Load all drum sound audio buffers for a specific kit
 */
export async function loadAllAudioBuffers(
  audioContext: AudioContext,
  kitId: DrumKitId = 'acoustic'
): Promise<AudioBuffers> {
  console.log(`[AudioLoader] Loading drum kit: ${kitId}`);
  
  const kit = getDrumKit(kitId);
  
  // First try to load from the selected kit's folder
  // If files don't exist, fall back to default/legacy sounds
  const [snare, kick, highTom, midTom, floor, hiHat, crash, ride] = await Promise.all([
    loadSampleWithFallback(audioContext, kitId, 'snare'),
    loadSampleWithFallback(audioContext, kitId, 'kick'),
    loadSampleWithFallback(audioContext, kitId, 'highTom'),
    loadSampleWithFallback(audioContext, kitId, 'midTom'),
    loadSampleWithFallback(audioContext, kitId, 'floor'),
    loadSampleWithFallback(audioContext, kitId, 'hiHat'),
    loadSampleWithFallback(audioContext, kitId, 'crash'),
    loadSampleWithFallback(audioContext, kitId, 'ride'),
  ]);

  console.log(`[AudioLoader] Kit "${kit.name}" loaded:`, {
    snare: snare ? '✓' : '✗',
    kick: kick ? '✓' : '✗',
    highTom: highTom ? '✓' : '✗',
    midTom: midTom ? '✓' : '✗',
    floor: floor ? '✓' : '✗',
    hiHat: hiHat ? '✓' : '✗',
    crash: crash ? '✓' : '✗',
    ride: ride ? '✓' : '✗',
  });

  return {
    snare: snare!,
    kick: kick!,
    tom: highTom!, // Legacy tom uses highTom
    highTom: highTom!,
    midTom: midTom!,
    floor: floor!,
    hiHat: hiHat!,
    crash: crash || hiHat!, // Fallback to hiHat if crash doesn't exist
    ride: ride || hiHat!, // Fallback to hiHat if ride doesn't exist
  };
}

/**
 * Get available drum kits
 */
export function getAvailableKits() {
  return DRUM_KITS;
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


