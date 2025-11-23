/**
 * Utility functions for converting MIDI recordings to patterns
 */

import { parseTimeSignature } from './patternUtils';

// MIDI note to drum voice mapping
const MIDI_TO_DRUM_MAP: Record<number, string> = {
  36: 'K',  // Kick (C2)
  38: 'S',  // Snare (D2)
  42: 'H',  // Hi-Hat Closed (F#2)
  46: 'O',  // Hi-Hat Open (B2)
  41: 'F',  // Floor Tom (F2)
  48: 'T',  // High Tom (C3)
  47: 'T',  // Low-Mid Tom (B2)
  45: 'T',  // Low Tom (A2)
  49: 'T',  // Crash Cymbal 1 (C#3)
  50: 'T',  // High Tom (D3)
};

export interface MIDIRecordedNote {
  time: number; // ms
  note: number; // MIDI note number
  velocity: number; // 0-127
}

export interface ConvertedPattern {
  id: number;
  timeSignature: string;
  beats: number;
  beatType: number;
  subdivision: number;
  phrase: string;
  drumPattern: string;
  stickingPattern: string;
  leftFoot: boolean;
  rightFoot: boolean;
  repeat: number;
}

/**
 * Convert MIDI notes to drum pattern
 */
export function convertMIDIRecordingToPattern(
  notes: MIDIRecordedNote[],
  timeSignature: string,
  subdivision: number,
  bpm: number
): ConvertedPattern[] {
  if (notes.length === 0) {
    return [];
  }

  // Map MIDI notes to drum voices
  const mappedNotes = notes.map(n => {
    let drum = MIDI_TO_DRUM_MAP[n.note];
    if (!drum) {
      // If note is not in map, try to infer from common ranges
      // Kick range: 35-36
      if (n.note >= 35 && n.note <= 36) {
        drum = 'K';
      }
      // Snare range: 38-40
      else if (n.note >= 38 && n.note <= 40) {
        drum = 'S';
      }
      // Hi-Hat range: 42-46
      else if (n.note >= 42 && n.note <= 46) {
        drum = n.note === 46 ? 'O' : 'H';
      }
      // Floor Tom: 41, 43
      else if (n.note === 41 || n.note === 43) {
        drum = 'F';
      }
      // Tom range: 45, 47-50
      else if ((n.note >= 45 && n.note <= 50) && n.note !== 46) {
        drum = 'T';
      }
      // Default to snare for unknown notes
      else {
        console.warn(`Unknown MIDI note ${n.note}, defaulting to Snare. Consider adding to MIDI_TO_DRUM_MAP.`);
        drum = 'S';
      }
    }
    return {
      ...n,
      drum: drum || 'S' // Ensure drum is always set
    };
  });

  // Quantize notes to grid based on subdivision
  const timeSig = timeSignature.split('/');
  const beatsPerMeasure = parseInt(timeSig[0], 10);
  const beatValue = parseInt(timeSig[1], 10);
  
  // Calculate grid spacing (in milliseconds)
  const msPerBeat = 60000 / bpm;
  const notesPerBeat = subdivision / beatValue;
  const msPerGrid = msPerBeat / notesPerBeat;
  const notesPerMeasure = beatsPerMeasure * notesPerBeat;

  // Quantize notes to grid
  const quantizedNotes = mappedNotes.map(n => ({
    ...n,
    gridPosition: Math.round(n.time / msPerGrid)
  }));

  // Group by grid position, handling simultaneous notes
  const gridMap: Record<number, string[]> = {};
  quantizedNotes.forEach(n => {
    if (!gridMap[n.gridPosition]) {
      gridMap[n.gridPosition] = [];
    }
    // Avoid duplicates (same drum at same position)
    if (!gridMap[n.gridPosition].includes(n.drum)) {
      gridMap[n.gridPosition].push(n.drum);
    }
  });

  // Find the length of the pattern (max grid position)
  const maxGrid = Math.max(...Object.keys(gridMap).map(Number), 0);
  
  // Calculate how many measures we have
  const measures = Math.ceil((maxGrid + 1) / notesPerMeasure);
  
  // Create patterns for each measure
  const newPatterns: ConvertedPattern[] = [];
  const phraseGroupSize = subdivision / 4; // Group into quarter note groups
  
  for (let measureIndex = 0; measureIndex < measures; measureIndex++) {
    const measureStartGrid = measureIndex * notesPerMeasure;
    const measureEndGrid = Math.min(measureStartGrid + notesPerMeasure - 1, maxGrid);
    
    // Build phrase and drum pattern for this measure
    const phrase: number[] = [];
    const drumPattern: string[] = [];
    
    for (let i = measureStartGrid; i <= measureEndGrid; i += phraseGroupSize) {
      const groupDrums: string[] = [];
      
      for (let j = 0; j < phraseGroupSize && (i + j) <= measureEndGrid; j++) {
        const gridPos = i + j;
        if (gridMap[gridPos] && gridMap[gridPos].length > 0) {
          // Handle simultaneous notes (e.g., "S+K" for snare and kick together)
          const drumsAtPosition = gridMap[gridPos];
          if (drumsAtPosition.length === 1) {
            groupDrums.push(drumsAtPosition[0]);
          } else {
            // Multiple drums at same position - combine them (e.g., "S+K")
            // Sort for consistency (K, S, H, T, F, O)
            const sortedDrums = drumsAtPosition.sort((a, b) => {
              const order: Record<string, number> = { 'K': 0, 'S': 1, 'H': 2, 'T': 3, 'F': 4, 'O': 5 };
              return (order[a] || 99) - (order[b] || 99);
            });
            groupDrums.push(sortedDrums.join('+'));
          }
        } else {
          groupDrums.push('R'); // Rest
        }
      }
      
      phrase.push(phraseGroupSize);
      // Join drums in the group with spaces (e.g., "S R K R" for a 4-note group)
      drumPattern.push(groupDrums.join(' '));
    }
    
    // Only create pattern if there are notes in this measure
    const hasNotes = drumPattern.some(p => p.split(' ').some(d => d !== 'R'));
    if (hasNotes || measureIndex === 0) { // Always create first measure even if empty
      const [beats, beatType] = parseTimeSignature(timeSignature);
      newPatterns.push({
        id: Date.now() + measureIndex,
        timeSignature: timeSignature,
        beats,
        beatType,
        subdivision: subdivision,
        phrase: phrase.join(' '),
        drumPattern: drumPattern.join(' '),
        stickingPattern: '', // Can be auto-generated or left empty
        leftFoot: false,
        rightFoot: false,
        repeat: 1
      });
    }
  }

  return newPatterns;
}


