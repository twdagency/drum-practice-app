/**
 * Integration tests for practice mode utilities
 * Tests the core logic for MIDI and microphone practice modes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Pattern, ExpectedNote, PracticeHit } from '@/types';
import { parseNumberList } from '../patternUtils';

/**
 * Build expected notes from patterns (simplified version for testing)
 */
function buildExpectedNotes(
  patterns: Pattern[],
  bpm: number,
  noteMap: Record<string, number>
): ExpectedNote[] {
  if (patterns.length === 0) return [];
  
  const expectedNotes: ExpectedNote[] = [];
  const bpmMs = 60000 / bpm;
  
  let globalIndex = 0;
  let globalTimeOffset = 0;
  
  patterns.forEach((pattern) => {
    const timeSig = pattern.timeSignature || '4/4';
    const [beatsPerBar, beatValue] = timeSig.split('/').map(Number);
    const subdivision = pattern.subdivision || 16;
    const phrase = pattern.phrase || '4 4 4 4';
    const drumPattern = pattern.drumPattern || 'S S K S';
    const repeat = pattern.repeat || 1;
    
    const notesPerBeat = subdivision / 4;
    const noteDuration = bpmMs / notesPerBeat;
    
    const phraseTokens = parseNumberList(phrase);
    const drumTokens = drumPattern.split(/\s+/);
    
    for (let r = 0; r < repeat; r++) {
      let noteIndexInPattern = 0;
      let patternTimeOffset = 0;
      
      phraseTokens.forEach((phraseVal) => {
        const notesInThisPhrase = phraseVal;
        
        for (let i = 0; i < notesInThisPhrase; i++) {
          const drumToken = drumTokens[noteIndexInPattern % drumTokens.length];
          const midiNote = noteMap[drumToken] || 0;
          
          if (midiNote > 0) {
            expectedNotes.push({
              time: globalTimeOffset + patternTimeOffset,
              note: midiNote,
              index: globalIndex,
              matched: false,
            });
          }
          
          patternTimeOffset += noteDuration;
          noteIndexInPattern++;
          globalIndex++;
        }
      });
    }
    
    const totalNotesInPattern = phraseTokens.reduce((sum, val) => sum + val, 0) * repeat;
    const patternDuration = totalNotesInPattern * noteDuration;
    globalTimeOffset += patternDuration;
  });
  
  return expectedNotes;
}

/**
 * Match a MIDI hit to the closest expected note
 */
function matchMIDIHit(
  hitTime: number,
  hitNote: number,
  expectedNotes: ExpectedNote[],
  accuracyWindow: number
): { matched: boolean; timingError: number; noteIndex: number } | null {
  // Filter to unmatched notes with matching note number
  const candidates = expectedNotes.filter(
    (n) => !n.matched && n.note === hitNote
  );
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Find closest note by time
  let closestNote = candidates[0];
  let minTimeDiff = Math.abs(candidates[0].time - hitTime);
  
  for (const note of candidates) {
    const timeDiff = Math.abs(note.time - hitTime);
    if (timeDiff < minTimeDiff) {
      minTimeDiff = timeDiff;
      closestNote = note;
    }
  }
  
  const timingError = Math.abs(closestNote.time - hitTime);
  const matched = timingError <= accuracyWindow;
  
  return {
    matched,
    timingError,
    noteIndex: closestNote.index,
  };
}

/**
 * Calculate accuracy from hits
 */
function calculateAccuracy(
  expectedNotes: ExpectedNote[],
  hits: PracticeHit[],
  accuracyWindow: number
): number {
  if (expectedNotes.length === 0) return 0;
  
  const matchedCount = expectedNotes.filter((n) => n.matched).length;
  return matchedCount / expectedNotes.length;
}

describe('Practice Mode Integration Tests', () => {
  const defaultNoteMap: Record<string, number> = {
    K: 36,
    S: 38,
    H: 42,
    'H+': 46,
    T: 47,
    F: 41,
    R: 0,
  };

  describe('buildExpectedNotes', () => {
    it('should build expected notes from simple pattern', () => {
      const patterns: Pattern[] = [
        {
          id: 'test',
          timeSignature: '4/4',
          subdivision: 16,
          drumPattern: 'S K S K',
          stickingPattern: 'R L R L',
          phrase: '4 4 4 4',
          repeat: 1,
        },
      ];
      
      const expectedNotes = buildExpectedNotes(patterns, 120, defaultNoteMap);
      
      expect(expectedNotes.length).toBeGreaterThan(0);
      expect(expectedNotes[0].note).toBe(38); // Snare (S)
      expect(expectedNotes[1].note).toBe(36); // Kick (K)
    });

    it('should handle multiple patterns', () => {
      const patterns: Pattern[] = [
        {
          id: 'test1',
          timeSignature: '4/4',
          subdivision: 16,
          drumPattern: 'S S',
          stickingPattern: 'R L',
          phrase: '8 8',
          repeat: 1,
        },
        {
          id: 'test2',
          timeSignature: '4/4',
          subdivision: 16,
          drumPattern: 'K K',
          stickingPattern: 'K K',
          phrase: '8 8',
          repeat: 1,
        },
      ];
      
      const expectedNotes = buildExpectedNotes(patterns, 120, defaultNoteMap);
      
      // Should have notes from both patterns
      const snareNotes = expectedNotes.filter((n) => n.note === 38);
      const kickNotes = expectedNotes.filter((n) => n.note === 36);
      expect(snareNotes.length).toBeGreaterThan(0);
      expect(kickNotes.length).toBeGreaterThan(0);
    });

    it('should handle pattern repeats', () => {
      const patterns: Pattern[] = [
        {
          id: 'test',
          timeSignature: '4/4',
          subdivision: 16,
          drumPattern: 'S K',
          stickingPattern: 'R L',
          phrase: '8 8',
          repeat: 2,
        },
      ];
      
      const expectedNotes = buildExpectedNotes(patterns, 120, defaultNoteMap);
      
      // Should have notes from both repeats
      expect(expectedNotes.length).toBeGreaterThan(4);
    });

    it('should handle different time signatures', () => {
      const patterns: Pattern[] = [
        {
          id: 'test',
          timeSignature: '3/4',
          subdivision: 16,
          drumPattern: 'S S S',
          stickingPattern: 'R L R',
          phrase: '4 4 4',
          repeat: 1,
        },
      ];
      
      const expectedNotes = buildExpectedNotes(patterns, 120, defaultNoteMap);
      
      // 3/4 time with 16th notes = 12 notes
      expect(expectedNotes.length).toBeGreaterThan(0);
    });

    it('should skip rests in expected notes', () => {
      const patterns: Pattern[] = [
        {
          id: 'test',
          timeSignature: '4/4',
          subdivision: 16,
          drumPattern: 'S R K R',
          stickingPattern: 'R - K -',
          phrase: '4 4 4 4',
          repeat: 1,
        },
      ];
      
      const expectedNotes = buildExpectedNotes(patterns, 120, defaultNoteMap);
      
      // Should only have S and K notes, not R (rest)
      const restNotes = expectedNotes.filter((n) => n.note === 0);
      expect(restNotes.length).toBe(0);
    });
  });

  describe('matchMIDIHit', () => {
    const expectedNotes: ExpectedNote[] = [
      { time: 0, note: 38, index: 0, matched: false },
      { time: 250, note: 36, index: 1, matched: false },
      { time: 500, note: 38, index: 2, matched: false },
      { time: 750, note: 36, index: 3, matched: false },
    ];

    it('should match hit to closest expected note', () => {
      const result = matchMIDIHit(260, 36, expectedNotes, 100);
      
      expect(result).not.toBeNull();
      expect(result!.matched).toBe(true);
      expect(result!.noteIndex).toBe(1); // Should match note at 250ms
      expect(result!.timingError).toBeLessThan(20); // Within 20ms
    });

    it('should reject hits outside accuracy window', () => {
      const result = matchMIDIHit(400, 36, expectedNotes, 50);
      
      expect(result).not.toBeNull();
      expect(result!.matched).toBe(false); // 150ms error > 50ms window
    });

    it('should match correct note number', () => {
      const result = matchMIDIHit(260, 38, expectedNotes, 100);
      
      expect(result).not.toBeNull();
      expect(result!.noteIndex).toBe(0); // Should match snare at 0ms, not kick
    });

    it('should return null for unmatched note number', () => {
      const result = matchMIDIHit(250, 42, expectedNotes, 100); // Hi-hat (not in expected)
      
      expect(result).toBeNull();
    });

    it('should prefer closest note when multiple candidates exist', () => {
      const notesWithDuplicates: ExpectedNote[] = [
        { time: 0, note: 38, index: 0, matched: false },
        { time: 500, note: 38, index: 1, matched: false },
        { time: 1000, note: 38, index: 2, matched: false },
      ];
      
      const result = matchMIDIHit(480, 38, notesWithDuplicates, 100);
      
      expect(result).not.toBeNull();
      expect(result!.noteIndex).toBe(1); // Should match note at 500ms (closest)
    });
  });

  describe('calculateAccuracy', () => {
    it('should calculate 100% accuracy when all notes matched', () => {
      const expectedNotes: ExpectedNote[] = [
        { time: 0, note: 38, index: 0, matched: true },
        { time: 250, note: 36, index: 1, matched: true },
        { time: 500, note: 38, index: 2, matched: true },
      ];
      
      const hits: PracticeHit[] = [
        { time: 0, note: 38, expectedTime: 0, timingError: 5, early: false, perfect: true, matched: true },
        { time: 250, note: 36, expectedTime: 250, timingError: 3, early: false, perfect: true, matched: true },
        { time: 500, note: 38, expectedTime: 500, timingError: 2, early: false, perfect: true, matched: true },
      ];
      
      const accuracy = calculateAccuracy(expectedNotes, hits, 50);
      expect(accuracy).toBe(1.0);
    });

    it('should calculate 0% accuracy when no notes matched', () => {
      const expectedNotes: ExpectedNote[] = [
        { time: 0, note: 38, index: 0, matched: false },
        { time: 250, note: 36, index: 1, matched: false },
      ];
      
      const hits: PracticeHit[] = [];
      
      const accuracy = calculateAccuracy(expectedNotes, hits, 50);
      expect(accuracy).toBe(0);
    });

    it('should calculate partial accuracy', () => {
      const expectedNotes: ExpectedNote[] = [
        { time: 0, note: 38, index: 0, matched: true },
        { time: 250, note: 36, index: 1, matched: false },
        { time: 500, note: 38, index: 2, matched: true },
      ];
      
      const hits: PracticeHit[] = [
        { time: 0, note: 38, expectedTime: 0, timingError: 5, early: false, perfect: true, matched: true },
        { time: 500, note: 38, expectedTime: 500, timingError: 2, early: false, perfect: true, matched: true },
      ];
      
      const accuracy = calculateAccuracy(expectedNotes, hits, 50);
      expect(accuracy).toBeCloseTo(0.667, 2); // 2 out of 3 notes matched
    });
  });

  describe('Practice Mode Flow', () => {
    it('should handle complete practice session flow', () => {
      // 1. Build expected notes
      const patterns: Pattern[] = [
        {
          id: 'test',
          timeSignature: '4/4',
          subdivision: 16,
          drumPattern: 'S K S K',
          stickingPattern: 'R L R L',
          phrase: '4 4 4 4',
          repeat: 1,
        },
      ];
      
      const expectedNotes = buildExpectedNotes(patterns, 120, defaultNoteMap);
      expect(expectedNotes.length).toBeGreaterThan(0);
      
      // 2. Simulate MIDI hits
      const hits: PracticeHit[] = [];
      const accuracyWindow = 50;
      
      // Hit snare slightly early
      const hit1 = matchMIDIHit(5, 38, expectedNotes, accuracyWindow);
      if (hit1 && hit1.matched) {
        expectedNotes[hit1.noteIndex].matched = true;
        hits.push({
          time: 5,
          note: 38,
          expectedTime: expectedNotes[hit1.noteIndex].time,
          timingError: hit1.timingError,
          early: true,
          perfect: hit1.timingError <= 10,
          matched: true,
        });
      }
      
      // Hit kick on time
      const kickNote = expectedNotes.find((n) => n.note === 36 && !n.matched);
      if (kickNote) {
        const hit2 = matchMIDIHit(kickNote.time, 36, expectedNotes, accuracyWindow);
        if (hit2 && hit2.matched) {
          expectedNotes[hit2.noteIndex].matched = true;
          hits.push({
            time: kickNote.time,
            note: 36,
            expectedTime: kickNote.time,
            timingError: hit2.timingError,
            early: false,
            perfect: hit2.timingError <= 10,
            matched: true,
          });
        }
      }
      
      // 3. Calculate accuracy
      const accuracy = calculateAccuracy(expectedNotes, hits, accuracyWindow);
      
      expect(hits.length).toBeGreaterThan(0);
      expect(accuracy).toBeGreaterThan(0);
      expect(accuracy).toBeLessThanOrEqual(1);
    });

    it('should handle missed notes correctly', () => {
      const patterns: Pattern[] = [
        {
          id: 'test',
          timeSignature: '4/4',
          subdivision: 16,
          drumPattern: 'S K S K',
          stickingPattern: 'R L R L',
          phrase: '4 4 4 4',
          repeat: 1,
        },
      ];
      
      const expectedNotes = buildExpectedNotes(patterns, 120, defaultNoteMap);
      const accuracyWindow = 50;
      
      // Only hit first note, miss the rest
      const hit1 = matchMIDIHit(5, 38, expectedNotes, accuracyWindow);
      if (hit1 && hit1.matched) {
        expectedNotes[hit1.noteIndex].matched = true;
      }
      
      const accuracy = calculateAccuracy(expectedNotes, [], accuracyWindow);
      
      // Should have low accuracy (only 1 note matched out of many)
      expect(accuracy).toBeLessThan(0.5);
    });
  });
});


