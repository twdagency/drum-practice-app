/**
 * Audio-related type definitions
 */

export interface AudioBuffers {
  snare: AudioBuffer | null;
  kick: AudioBuffer | null;
  tom: AudioBuffer | null; // Legacy support - maps to highTom
  highTom: AudioBuffer | null;
  midTom: AudioBuffer | null;
  floor: AudioBuffer | null;
  hiHat: AudioBuffer | null;
}

export interface Volumes {
  snare: number; // 0.0 - 1.0
  kick: number; // 0.0 - 1.0
  hiHat: number; // 0.0 - 1.0
  click: number; // 0.0 - 1.0
}

export type ClickSoundType = 'default' | 'woodblock' | 'beep' | 'tick' | 'metronome';

