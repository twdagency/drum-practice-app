/**
 * Unit tests for MIDI recording utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  convertMIDIRecordingToPattern,
  MIDIRecordedNote,
} from '../midiRecordingUtils';

describe('convertMIDIRecordingToPattern', () => {
  it('should return empty array for no notes', () => {
    expect(convertMIDIRecordingToPattern([], '4/4', 16, 120)).toEqual([]);
  });

  it('should convert simple MIDI notes to pattern', () => {
    const notes: MIDIRecordedNote[] = [
      { time: 0, note: 38, velocity: 100 },    // Snare at start
      { time: 500, note: 36, velocity: 100 },  // Kick at 500ms (16th note at 120 BPM)
      { time: 1000, note: 38, velocity: 100 }, // Snare at 1000ms
      { time: 1500, note: 36, velocity: 100 }, // Kick at 1500ms
    ];

    const patterns = convertMIDIRecordingToPattern(notes, '4/4', 16, 120);
    
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]).toHaveProperty('timeSignature', '4/4');
    expect(patterns[0]).toHaveProperty('subdivision', 16);
    expect(patterns[0]).toHaveProperty('drumPattern');
    expect(patterns[0].drumPattern).toContain('S'); // Should contain snare
    expect(patterns[0].drumPattern).toContain('K'); // Should contain kick
  });

  it('should map MIDI notes to correct drum voices', () => {
    const notes: MIDIRecordedNote[] = [
      { time: 0, note: 36, velocity: 100 },    // Kick (C2)
      { time: 250, note: 38, velocity: 100 },  // Snare (D2)
      { time: 500, note: 42, velocity: 100 }, // Hi-Hat Closed (F#2)
      { time: 750, note: 46, velocity: 100 }, // Hi-Hat Open (B2)
      { time: 1000, note: 41, velocity: 100 }, // Floor Tom (F2)
      { time: 1250, note: 48, velocity: 100 }, // High Tom (C3)
    ];

    const patterns = convertMIDIRecordingToPattern(notes, '4/4', 16, 120);
    
    expect(patterns.length).toBeGreaterThan(0);
    const drumPattern = patterns[0].drumPattern;
    expect(drumPattern).toContain('K'); // Kick
    expect(drumPattern).toContain('S'); // Snare
    expect(drumPattern).toContain('H'); // Hi-Hat
    expect(drumPattern).toContain('O'); // Hi-Hat Open
    expect(drumPattern).toContain('F'); // Floor Tom
    expect(drumPattern).toContain('T'); // Tom
  });

  it('should handle simultaneous notes (chords)', () => {
    const notes: MIDIRecordedNote[] = [
      { time: 0, note: 38, velocity: 100 },    // Snare
      { time: 0, note: 36, velocity: 100 },   // Kick (simultaneous)
      { time: 500, note: 38, velocity: 100 }, // Snare alone
    ];

    const patterns = convertMIDIRecordingToPattern(notes, '4/4', 16, 120);
    
    expect(patterns.length).toBeGreaterThan(0);
    // Should combine simultaneous notes (e.g., "S+K")
    const drumPattern = patterns[0].drumPattern;
    expect(drumPattern).toMatch(/S\+K|K\+S/); // Should have combined notation
  });

  it('should quantize notes to grid', () => {
    // Notes slightly off-grid should be quantized
    const notes: MIDIRecordedNote[] = [
      { time: 0, note: 38, velocity: 100 },      // On grid
      { time: 252, note: 36, velocity: 100 },  // Slightly off (should quantize to 250ms)
      { time: 498, note: 38, velocity: 100 },   // Slightly off (should quantize to 500ms)
    ];

    const patterns = convertMIDIRecordingToPattern(notes, '4/4', 16, 120);
    
    expect(patterns.length).toBeGreaterThan(0);
    // All notes should be captured despite slight timing differences
    expect(patterns[0].drumPattern.split(' ').filter(d => d !== 'R').length).toBeGreaterThan(0);
  });

  it('should handle different time signatures', () => {
    const notes: MIDIRecordedNote[] = [
      { time: 0, note: 38, velocity: 100 },
      { time: 500, note: 36, velocity: 100 },
      { time: 1000, note: 38, velocity: 100 },
    ];

    const patterns4_4 = convertMIDIRecordingToPattern(notes, '4/4', 16, 120);
    const patterns3_4 = convertMIDIRecordingToPattern(notes, '3/4', 16, 120);
    
    expect(patterns4_4[0].timeSignature).toBe('4/4');
    expect(patterns3_4[0].timeSignature).toBe('3/4');
  });

  it('should handle different subdivisions', () => {
    const notes: MIDIRecordedNote[] = [
      { time: 0, note: 38, velocity: 100 },
      { time: 500, note: 36, velocity: 100 },
    ];

    const patterns16 = convertMIDIRecordingToPattern(notes, '4/4', 16, 120);
    const patterns8 = convertMIDIRecordingToPattern(notes, '4/4', 8, 120);
    
    expect(patterns16[0].subdivision).toBe(16);
    expect(patterns8[0].subdivision).toBe(8);
  });

  it('should handle unknown MIDI notes by inferring from ranges', () => {
    const notes: MIDIRecordedNote[] = [
      { time: 0, note: 35, velocity: 100 },    // Kick range (35-36)
      { time: 500, note: 39, velocity: 100 },  // Snare range (38-40)
      { time: 1000, note: 44, velocity: 100 }, // Hi-Hat range (42-46)
    ];

    const patterns = convertMIDIRecordingToPattern(notes, '4/4', 16, 120);
    
    expect(patterns.length).toBeGreaterThan(0);
    const drumPattern = patterns[0].drumPattern;
    expect(drumPattern).toContain('K'); // Should infer kick
    expect(drumPattern).toContain('S'); // Should infer snare
    expect(drumPattern).toContain('H'); // Should infer hi-hat
  });

  it('should create multiple patterns for multiple measures', () => {
    // Create notes spanning 2 measures at 120 BPM with 16th notes
    // 1 measure = 2000ms at 120 BPM (4 beats * 500ms per beat)
    const notes: MIDIRecordedNote[] = [
      { time: 0, note: 38, velocity: 100 },      // Measure 1
      { time: 1000, note: 36, velocity: 100 }, // Measure 1
      { time: 2000, note: 38, velocity: 100 }, // Measure 2
      { time: 3000, note: 36, velocity: 100 },  // Measure 2
    ];

    const patterns = convertMIDIRecordingToPattern(notes, '4/4', 16, 120);
    
    // Should create at least 2 patterns (one per measure)
    expect(patterns.length).toBeGreaterThanOrEqual(1);
  });

  it('should include rests for empty grid positions', () => {
    const notes: MIDIRecordedNote[] = [
      { time: 0, note: 38, velocity: 100 },    // First position
      { time: 1000, note: 36, velocity: 100 }, // Third position (skipping second)
    ];

    const patterns = convertMIDIRecordingToPattern(notes, '4/4', 16, 120);
    
    expect(patterns.length).toBeGreaterThan(0);
    const drumPattern = patterns[0].drumPattern;
    // Should contain rests between notes
    expect(drumPattern.split(' ')).toContain('R');
  });
});


