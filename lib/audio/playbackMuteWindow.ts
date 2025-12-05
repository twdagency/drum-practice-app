/**
 * Playback Mute Window
 * 
 * Tracks when playback sounds occur so the microphone practice can ignore
 * audio feedback from speakers. This prevents the metronome/click and drum
 * sounds from triggering false hits when picked up by the mic.
 */

// Track the last time a playback sound was triggered
let lastPlaybackSoundTime = 0;

// Duration of the mute window in milliseconds
// Hits detected within this window after a playback sound will be ignored
// Keep this short to avoid blocking legitimate hits at fast tempos (16th notes at 200 BPM = 75ms)
const MUTE_WINDOW_MS = 40; // 40ms - catches immediate speaker feedback without blocking real hits

/**
 * Call this when any playback sound (click, drum) is played
 */
export function notifyPlaybackSound(): void {
  lastPlaybackSoundTime = performance.now();
}

/**
 * Check if we're currently in the mute window (audio recently played)
 * @returns true if we should ignore microphone input
 */
export function isInMuteWindow(): boolean {
  const elapsed = performance.now() - lastPlaybackSoundTime;
  return elapsed < MUTE_WINDOW_MS;
}

/**
 * Get the time since the last playback sound
 * @returns milliseconds since last playback sound
 */
export function getTimeSinceLastPlayback(): number {
  return performance.now() - lastPlaybackSoundTime;
}

/**
 * Reset the mute window (e.g., when stopping playback)
 */
export function resetMuteWindow(): void {
  lastPlaybackSoundTime = 0;
}
