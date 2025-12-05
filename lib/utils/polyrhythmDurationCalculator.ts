/**
 * Polyrhythm Duration Calculator
 * Calculates correct note durations and tuplet configurations for polyrhythms
 * 
 * This determines:
 * - What note duration each voice should use
 * - Whether tuplets are needed
 * - Correct tuplet configuration for VexFlow
 */

export interface PolyrhythmDurations {
  rightDuration: string;      // VexFlow duration string (e.g., 'q', '8', '16')
  leftDuration: string;       // VexFlow duration string
  rightNeedsTuplet: boolean;
  leftNeedsTuplet: boolean;
  rightTupletConfig: {num_notes: number, notes_occupied: number} | null;
  leftTupletConfig: {num_notes: number, notes_occupied: number} | null;
  rightNoteDurationBeats: number;  // Duration of each note in beats
  leftNoteDurationBeats: number;   // Duration of each note in beats
}

/**
 * Convert beats to VexFlow duration string
 * Assumes quarter note = 1 beat (standard for 4/4, 3/4, 2/4)
 * For 6/8, 9/8: assumes dotted quarter = 1 beat
 */
function beatsToVexFlowDuration(beats: number, beatValue: number = 4): string {
  // For standard time (beatValue = 4, quarter note = 1 beat):
  if (beatValue === 4) {
    if (beats >= 4) return 'w';      // Whole note (4 beats)
    if (beats >= 2) return 'h';      // Half note (2 beats)
    if (beats >= 1) return 'q';      // Quarter note (1 beat)
    if (beats >= 0.5) return '8';    // Eighth note (0.5 beats)
    if (beats >= 0.25) return '16';  // Sixteenth note (0.25 beats)
    return '32';                      // 32nd note (0.125 beats)
  }
  
  // For compound time (beatValue = 8, dotted quarter = 1 beat):
  if (beatValue === 8) {
    if (beats >= 3) return 'wd';     // Dotted whole note
    if (beats >= 1.5) return 'hd';   // Dotted half note
    if (beats >= 1) return 'qd';      // Dotted quarter note (1 beat)
    if (beats >= 0.5) return '8';    // Eighth note
    if (beats >= 0.25) return '16';  // Sixteenth note
    return '32';
  }
  
  // Default to quarter note
  return 'q';
}

/**
 * Check if a note duration matches a standard note value
 * Standard values: whole, half, quarter, eighth, sixteenth, etc.
 */
function isStandardNoteValue(beats: number, beatValue: number = 4): boolean {
  if (beatValue === 4) {
    // Standard values: 4, 2, 1, 0.5, 0.25, 0.125
    const standardValues = [4, 2, 1, 0.5, 0.25, 0.125];
    return standardValues.some(val => Math.abs(beats - val) < 0.001);
  }
  
  if (beatValue === 8) {
    // Compound time: dotted values
    const standardValues = [3, 1.5, 1, 0.5, 0.25, 0.125];
    return standardValues.some(val => Math.abs(beats - val) < 0.001);
  }
  
  return false;
}

/**
 * Find the closest standard note duration
 * Used when a tuplet is needed to determine the base duration
 */
function findClosestStandardDuration(beats: number, beatValue: number = 4): number {
  if (beatValue === 4) {
    const standardValues = [4, 2, 1, 0.5, 0.25, 0.125];
    return standardValues.reduce((closest, val) => {
      return Math.abs(val - beats) < Math.abs(closest - beats) ? val : closest;
    });
  }
  
  if (beatValue === 8) {
    const standardValues = [3, 1.5, 1, 0.5, 0.25, 0.125];
    return standardValues.reduce((closest, val) => {
      return Math.abs(val - beats) < Math.abs(closest - beats) ? val : closest;
    });
  }
  
  return 1; // Default to quarter note
}

/**
 * Calculate durations and tuplet configurations for a polyrhythm
 * 
 * For polyrhythms, the key insight is:
 * - If a voice has N notes in the time of M standard notes, use the M-duration with an N:M tuplet
 * - Example: 3:2 in 4/4 = 3 notes in time of 2 half notes = use half notes with 3:2 tuplet
 * 
 * @param numerator Number of notes in voice 1 (right hand)
 * @param denominator Number of notes in voice 2 (left hand)
 * @param beatsPerBar Number of beats in the measure
 * @param beatValue Beat value from time signature (4 = quarter note, 8 = eighth note)
 */
export function calculatePolyrhythmDurations(
  numerator: number,
  denominator: number,
  beatsPerBar: number,
  beatValue: number = 4
): PolyrhythmDurations {
  // Voice 1 (numerator): n notes in B beats
  // Each note = B/n beats (actual duration)
  const rightNoteDurationBeats = beatsPerBar / numerator;
  
  // Voice 2 (denominator): m notes in B beats
  // Each note = B/m beats (actual duration)
  const leftNoteDurationBeats = beatsPerBar / denominator;
  
  // Check if standard note values work
  const rightIsStandard = isStandardNoteValue(rightNoteDurationBeats, beatValue);
  const leftIsStandard = isStandardNoteValue(leftNoteDurationBeats, beatValue);
  
  // Determine durations and tuplets
  let rightDuration: string;
  let leftDuration: string;
  let rightNeedsTuplet = false;
  let leftNeedsTuplet = false;
  let rightTupletConfig = null;
  let leftTupletConfig = null;
  
  if (rightIsStandard) {
    // Right voice fits standard durations (e.g., 4 notes in 4/4 = quarter notes)
    rightDuration = beatsToVexFlowDuration(rightNoteDurationBeats, beatValue);
  } else {
    // Right voice needs a tuplet
    // Find what standard duration the tuplet should be based on
    // For N notes in time of M, use the duration that M notes would normally have
    // Example: 3 notes in 4/4 = 3 notes in time of 2 half notes (3:2 tuplet of half notes)
    //          5 notes in 4/4 = 5 notes in time of 4 quarter notes (5:4 tuplet of quarter notes)
    rightNeedsTuplet = true;
    
    // The tuplet base duration is what the OTHER voice (denominator) uses
    // Or if both need tuplets, find the nearest standard duration
    const baseDurationBeats = beatsPerBar / denominator; // Duration of denominator notes
    if (isStandardNoteValue(baseDurationBeats, beatValue)) {
      // Use the denominator's note duration as the base
      rightDuration = beatsToVexFlowDuration(baseDurationBeats, beatValue);
      rightTupletConfig = {
        num_notes: numerator,
        notes_occupied: denominator
      };
    } else {
      // Find nearest standard duration for the base
      const nearestBase = findClosestStandardDuration(rightNoteDurationBeats, beatValue);
      rightDuration = beatsToVexFlowDuration(nearestBase, beatValue);
      // Calculate how many of these notes would fit
      const notesOccupied = Math.round(beatsPerBar / nearestBase);
      rightTupletConfig = {
        num_notes: numerator,
        notes_occupied: notesOccupied
      };
    }
  }
  
  if (leftIsStandard) {
    // Left voice fits standard durations (e.g., 2 notes in 4/4 = half notes)
    leftDuration = beatsToVexFlowDuration(leftNoteDurationBeats, beatValue);
  } else {
    // Left voice needs a tuplet
    leftNeedsTuplet = true;
    
    const baseDurationBeats = beatsPerBar / numerator; // Duration of numerator notes
    if (isStandardNoteValue(baseDurationBeats, beatValue)) {
      // Use the numerator's note duration as the base
      leftDuration = beatsToVexFlowDuration(baseDurationBeats, beatValue);
      leftTupletConfig = {
        num_notes: denominator,
        notes_occupied: numerator
      };
    } else {
      // Find nearest standard duration for the base
      const nearestBase = findClosestStandardDuration(leftNoteDurationBeats, beatValue);
      leftDuration = beatsToVexFlowDuration(nearestBase, beatValue);
      const notesOccupied = Math.round(beatsPerBar / nearestBase);
      leftTupletConfig = {
        num_notes: denominator,
        notes_occupied: notesOccupied
      };
    }
  }
  
  return {
    rightDuration,
    leftDuration,
    rightNeedsTuplet,
    leftNeedsTuplet,
    rightTupletConfig,
    leftTupletConfig,
    rightNoteDurationBeats,
    leftNoteDurationBeats,
  };
}

/**
 * Examples:
 * 
 * 4:3 in 4/4:
 * - Right: 4 notes, each 1 beat = quarter notes, no tuplet
 * - Left: 3 notes, each 4/3 beats = needs tuplet "3 in time of 4"
 * 
 * 5:4 in 4/4:
 * - Right: 5 notes, each 0.8 beats = needs tuplet "5 in time of 4"
 * - Left: 4 notes, each 1 beat = quarter notes, no tuplet
 * 
 * 3:2 in 4/4:
 * - Right: 3 notes, each 4/3 beats = needs tuplet "3 in time of 2" (half note duration)
 * - Left: 2 notes, each 2 beats = half notes, no tuplet
 */

