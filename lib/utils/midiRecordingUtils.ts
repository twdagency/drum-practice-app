/**
 * Utility functions for converting MIDI recordings to patterns
 */

import { parseTimeSignature } from './patternUtils';
import { MIDINoteMap } from '@/types';

// MIDI note to drum voice mapping
// Using single-letter codes: K, S, H, O, F, I (High Tom), M (Mid Tom)
// Note: The stave component expects:
//   I: High Tom (e/5)
//   M: Mid Tom (d/5)
//   F: Floor Tom (a/4)
//   T: Maps to High Tom (e/5) - legacy support
// 
// Alesis Nitro common mappings:
// - Kick: 36 (C2)
// - Snare: 38 (D2)
// - Floor Tom: 41 (F2) - sometimes 43 on some kits
// - Hi-Hat Closed: 42 (F#2)
// - Low Tom: 45 (A2)
// - Hi-Hat Open: 46 (B2)
// - Low-Mid Tom: 47 (B2)
// - High Tom: 48 (C3)
const MIDI_TO_DRUM_MAP: Record<number, string> = {
  36: 'K',  // Kick (C2)
  38: 'S',  // Snare (D2)
  41: 'F',  // Floor Tom (F2) - Alesis Nitro standard
  43: 'F',  // Floor Tom (G2) - Alternative mapping for some kits
  42: 'H',  // Hi-Hat Closed (F#2)
  46: 'O',  // Hi-Hat Open (B2)
  48: 'I',  // High Tom (C3) - mapped to I for stave positioning
  47: 'M',  // Low-Mid Tom (B2) - mapped to M for stave positioning
  45: 'M',  // Low Tom (A2) - mapped to M (mid tom)
  49: 'I',  // Crash Cymbal 1 (C#3) - mapped to I (high tom position)
  50: 'I',  // High Tom (D3) - mapped to I for stave positioning
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
  _advancedMode?: boolean; // If true, use per-beat subdivisions instead of single subdivision
  _perBeatSubdivisions?: number[]; // Optional per-beat subdivisions for advanced mode
}

export interface SubdivisionDetectionResult {
  subdivision: number; // Single subdivision for simple patterns
  perBeatSubdivisions?: number[]; // Per-beat subdivisions for complex patterns
  detected: boolean;
}

/**
 * Auto-detect subdivision from MIDI note timings
 * Analyzes the intervals between notes to determine the most appropriate subdivision
 */
export function detectSubdivisionFromNotes(
  notes: MIDIRecordedNote[],
  timeSignature: string,
  bpm: number
): SubdivisionDetectionResult {
  if (notes.length < 2) {
    // Default to 16th notes if not enough data
    return { subdivision: 16, detected: false };
  }

  const timeSig = timeSignature.split('/');
  const beatValue = parseInt(timeSig[1], 10);
  const msPerBeat = 60000 / bpm;
  
  // Calculate intervals between consecutive notes
  const intervals: number[] = [];
  for (let i = 1; i < notes.length; i++) {
    const interval = notes[i].time - notes[i - 1].time;
    if (interval > 0 && interval < msPerBeat * 2) { // Only consider reasonable intervals
      intervals.push(interval);
    }
  }

  if (intervals.length === 0) {
    return { subdivision: 16, detected: false };
  }

  // Find the most common interval (rounded to nearest grid position)
  const intervalCounts: Record<number, number> = {};
  intervals.forEach(interval => {
    // Try different subdivisions and see which one fits best
    const possibleSubdivisions = [4, 8, 12, 16, 24, 32];
    for (const subdiv of possibleSubdivisions) {
      const notesPerBeat = subdiv / beatValue;
      const msPerGrid = msPerBeat / notesPerBeat;
      const gridPosition = Math.round(interval / msPerGrid);
      const quantizedInterval = gridPosition * msPerGrid;
      const error = Math.abs(interval - quantizedInterval);
      
      // If error is small (within 5% of grid spacing), count it
      if (error < msPerGrid * 0.05) {
        const key = Math.round(quantizedInterval / msPerGrid);
        intervalCounts[key] = (intervalCounts[key] || 0) + 1;
      }
    }
  });

  // Find the smallest meaningful subdivision
  // Check if notes align to different subdivisions per beat
  const notesPerBeat = notes.length / (notes[notes.length - 1].time - notes[0].time) * msPerBeat;
  
  // Group notes by beat to detect per-beat subdivisions
  const notesByBeat: MIDIRecordedNote[][] = [];
  let currentBeat = -1;
  let currentBeatNotes: MIDIRecordedNote[] = [];
  
  notes.forEach(note => {
    const beatNumber = Math.floor(note.time / msPerBeat);
    if (beatNumber !== currentBeat) {
      if (currentBeatNotes.length > 0) {
        notesByBeat.push(currentBeatNotes);
      }
      currentBeat = beatNumber;
      currentBeatNotes = [note];
    } else {
      currentBeatNotes.push(note);
    }
  });
  if (currentBeatNotes.length > 0) {
    notesByBeat.push(currentBeatNotes);
  }

  // Always detect per-beat subdivisions if we have any beats
  // This ensures we use per-beat mode even if all beats are the same subdivision
  if (notesByBeat.length >= 1) {
    const beatSubdivisions: number[] = [];
    let hasVariation = false;
    
    console.log(`[detectSubdivisionFromNotes] Analyzing ${notesByBeat.length} beats for per-beat subdivisions`);
    
    for (let beatIdx = 0; beatIdx < notesByBeat.length; beatIdx++) {
      const beatNotes = notesByBeat[beatIdx];
      if (beatNotes.length === 1) {
        // Single note in beat - determine if it's a quarter note or eighth note
        const beatStart = Math.floor(beatNotes[0].time / msPerBeat) * msPerBeat;
        const timeWithinBeat = beatNotes[0].time - beatStart;
        
        // Check if it's on the beat (quarter note) or on an 8th note position
        const msPerEighth = msPerBeat / 2;
        
        // Adjust tolerance based on BPM - at higher speeds, timing is tighter
        // Use a percentage-based tolerance that scales with beat duration
        // At 60 BPM: msPerBeat = 1000ms, tolerance = 120ms (12%)
        // At 120 BPM: msPerBeat = 500ms, tolerance = 60ms (12%)
        // At 240 BPM: msPerBeat = 250ms, tolerance = 30ms (12%)
        // But also use a minimum absolute tolerance (e.g., 20ms) to handle very fast tempos
        const quarterTolerance = Math.max(msPerBeat * 0.12, 20); // 12% or 20ms minimum
        const eighthTolerance = Math.max(msPerEighth * 0.18, 15); // 18% or 15ms minimum
        
        // Check quarter note position (on the beat)
        const quarterError = Math.abs(timeWithinBeat);
        const isQuarter = quarterError < quarterTolerance;
        
        // Check eighth note positions (on the beat or halfway)
        const eighthPosition = Math.round(timeWithinBeat / msPerEighth);
        const eighthTarget = eighthPosition * msPerEighth;
        const eighthError = Math.abs(timeWithinBeat - eighthTarget);
        const isEighth = !isQuarter && eighthError < eighthTolerance;
        
        if (isQuarter) {
          beatSubdivisions.push(4); // Quarter note
        } else if (isEighth) {
          beatSubdivisions.push(8); // Eighth note
        } else {
          // Default based on which is closer, but prefer quarter if very close
          if (quarterError < msPerBeat * 0.25) {
            beatSubdivisions.push(4); // Close enough to beat start
          } else if (eighthError < msPerEighth * 0.3) {
            beatSubdivisions.push(8); // Close to 8th note position
          } else {
            beatSubdivisions.push(4); // Default to quarter
          }
        }
        continue;
      }
      
      // Multiple notes in beat - find smallest subdivision that fits
      const beatIntervals: number[] = [];
      for (let i = 1; i < beatNotes.length; i++) {
        const interval = beatNotes[i].time - beatNotes[i - 1].time;
        if (interval > 0 && interval < msPerBeat) {
          beatIntervals.push(interval);
        }
      }
      
      if (beatIntervals.length === 0) {
        beatSubdivisions.push(4); // Default to quarter
        continue;
      }
      
      // Find the smallest meaningful interval
      const minInterval = Math.min(...beatIntervals);
      const possibleSubdivisions = [4, 8, 12, 16, 24, 32];
      let bestSubdivision = 4;
      let bestError = Infinity;
      
      // For fast subdivisions, use more lenient tolerance
      // The faster the notes, the more timing variation is expected
      const avgInterval = beatIntervals.reduce((a, b) => a + b, 0) / beatIntervals.length;
      const isFastSubdivision = avgInterval < msPerBeat / 4; // Faster than 16th notes
      const baseTolerance = isFastSubdivision ? 0.25 : 0.15; // 25% for fast, 15% for slower
      
      for (const subdiv of possibleSubdivisions) {
        const notesPerBeatForSubdiv = subdiv / beatValue;
        const msPerGrid = msPerBeat / notesPerBeatForSubdiv;
        
        // Use adaptive tolerance based on grid spacing
        // For very small grid spacing (fast subdivisions), be more lenient
        const tolerance = Math.max(baseTolerance, msPerGrid * 0.3 / msPerBeat); // At least 30% of grid spacing
        
        // Check if all intervals fit this subdivision
        let allFit = true;
        let totalError = 0;
        for (const interval of beatIntervals) {
          const gridPosition = Math.round(interval / msPerGrid);
          const quantizedInterval = gridPosition * msPerGrid;
          const error = Math.abs(interval - quantizedInterval);
          if (error > msPerGrid * tolerance) {
            allFit = false;
            break;
          }
          totalError += error;
        }
        
        if (allFit && totalError < bestError) {
          bestError = totalError;
          bestSubdivision = subdiv;
        }
      }
      
      console.log(`[detectSubdivisionFromNotes] Beat ${beatIdx}: ${beatNotes.length} notes, minInterval: ${minInterval.toFixed(2)}ms, detected: ${bestSubdivision}, isFast: ${isFastSubdivision}`);
      
      beatSubdivisions.push(bestSubdivision);
      if (beatSubdivisions.length > 1 && bestSubdivision !== beatSubdivisions[0]) {
        hasVariation = true;
      }
      
      console.log(`[detectSubdivisionFromNotes] Beat ${beatIdx}: ${beatNotes.length} note(s), detected subdivision: ${bestSubdivision}`);
    }
    
    // Always use per-beat subdivisions if we detected any beats
    // This ensures proper pattern structure even if all beats have the same subdivision
    if (beatSubdivisions.length >= 1) {
      // Pad to match time signature if needed
      const [numerator] = timeSignature.split('/').map(Number);
      
      // If we have fewer beats than the time signature, repeat the pattern
      if (beatSubdivisions.length < numerator) {
        const pattern = [...beatSubdivisions];
        while (beatSubdivisions.length < numerator) {
          beatSubdivisions.push(...pattern);
        }
      }
      
      // Trim to match time signature exactly
      const finalSubdivisions = beatSubdivisions.slice(0, numerator);
      
      console.log('[detectSubdivisionFromNotes] Using per-beat subdivisions:', finalSubdivisions, 'hasVariation:', hasVariation);
      
      return {
        subdivision: Math.max(...finalSubdivisions), // Use max as base subdivision
        perBeatSubdivisions: finalSubdivisions,
        detected: true
      };
    }
    
    // Even if no variation, if we have enough beats, return per-beat subdivisions
    // This ensures we use per-beat mode even if all beats are the same
    const [numerator] = timeSignature.split('/').map(Number);
    if (beatSubdivisions.length >= numerator) {
      const finalSubdivisions = beatSubdivisions.slice(0, numerator);
      console.log('[detectSubdivisionFromNotes] Using per-beat subdivisions (no variation):', finalSubdivisions);
      return {
        subdivision: Math.max(...finalSubdivisions),
        perBeatSubdivisions: finalSubdivisions,
        detected: true
      };
    } else if (beatSubdivisions.length > 0) {
      // Even if we don't have enough beats, use what we have and pad
      const finalSubdivisions = [...beatSubdivisions];
      while (finalSubdivisions.length < numerator) {
        // Repeat the pattern
        finalSubdivisions.push(...beatSubdivisions);
      }
      const trimmed = finalSubdivisions.slice(0, numerator);
      console.log('[detectSubdivisionFromNotes] Using per-beat subdivisions (padded):', trimmed);
      return {
        subdivision: Math.max(...trimmed),
        perBeatSubdivisions: trimmed,
        detected: true
      };
    }
  }
  
  console.log('[detectSubdivisionFromNotes] No per-beat subdivisions detected, using uniform subdivision');

  // Otherwise, detect a single subdivision
  // Find the smallest subdivision that fits most intervals
  const possibleSubdivisions = [4, 8, 12, 16, 24, 32];
  let bestSubdivision = 16;
  let bestScore = 0;

  for (const subdiv of possibleSubdivisions) {
    const notesPerBeatForSubdiv = subdiv / beatValue;
    const msPerGrid = msPerBeat / notesPerBeatForSubdiv;
    let score = 0;
    
    intervals.forEach(interval => {
      const gridPosition = Math.round(interval / msPerGrid);
      const quantizedInterval = gridPosition * msPerGrid;
      const error = Math.abs(interval - quantizedInterval);
      
      if (error < msPerGrid * 0.1) {
        score++;
      }
    });
    
    if (score > bestScore) {
      bestScore = score;
      bestSubdivision = subdiv;
    }
  }

  return {
    subdivision: bestSubdivision,
    detected: bestScore > intervals.length * 0.5 // Consider detected if >50% of intervals fit
  };
}

/**
 * Convert MIDI notes to drum pattern
 * Now supports auto-detection of subdivision
 */
export function convertMIDIRecordingToPattern(
  notes: MIDIRecordedNote[],
  timeSignature: string,
  subdivision?: number, // Optional - will auto-detect if not provided
  bpm: number = 120,
  customNoteMap?: MIDINoteMap, // Optional custom MIDI note mapping
  maxBars?: number // Optional maximum number of bars to create
): ConvertedPattern[] {
  if (notes.length === 0) {
    return [];
  }

  // Auto-detect subdivision if not provided
  let detectedSubdivision: SubdivisionDetectionResult;
  if (subdivision === undefined) {
    detectedSubdivision = detectSubdivisionFromNotes(notes, timeSignature, bpm);
    subdivision = detectedSubdivision.subdivision;
    console.log('[convertMIDIRecordingToPattern] Detected subdivision:', detectedSubdivision);
  } else {
    detectedSubdivision = { subdivision, detected: false };
  }

  // Log all unique MIDI note numbers received for debugging
  const uniqueNotes = [...new Set(notes.map(n => n.note))].sort((a, b) => a - b);
  console.log(`[convertMIDIRecordingToPattern] All MIDI notes received: ${uniqueNotes.join(', ')}`);
  
  // Create reverse mapping from custom note map if provided
  // Maps MIDI note number -> drum code
  const customReverseMap: Record<number, string> = {};
  if (customNoteMap) {
    Object.entries(customNoteMap).forEach(([drumCode, midiNote]) => {
      if (midiNote > 0) {
        customReverseMap[midiNote] = drumCode;
      }
    });
  }
  
  // Map MIDI notes to drum voices
  // First check custom map, then fall back to default map
  const mappedNotes = notes.map(n => {
    let drum = customReverseMap[n.note] || MIDI_TO_DRUM_MAP[n.note];
    
    if (!drum) {
      // If note is not in map, try to infer from common ranges
      // Floor Tom: 41 (check this first before Hi-Hat range)
      if (n.note === 41) {
        drum = 'F';
        console.log(`[convertMIDIRecordingToPattern] MIDI note ${n.note} (Floor Tom) mapped to: ${drum} via fallback`);
      }
      // Kick range: 35-36
      else if (n.note >= 35 && n.note <= 36) {
        drum = 'K';
      }
      // Snare range: 38-40
      else if (n.note >= 38 && n.note <= 40) {
        drum = 'S';
      }
      // Hi-Hat range: 42-46 (note: 41 is Floor Tom, not Hi-Hat)
      else if (n.note >= 42 && n.note <= 46) {
        drum = n.note === 46 ? 'O' : 'H';
        console.log(`[convertMIDIRecordingToPattern] MIDI note ${n.note} (Hi-Hat range) mapped to: ${drum} via fallback`);
      }
      // High Tom range: 48-50 (C3-D3)
      else if (n.note >= 48 && n.note <= 50) {
        drum = 'I'; // High Tom -> I for stave positioning
      }
      // Mid Tom range: 45, 47 (A2, B2) - note: 45 is also in this range
      else if (n.note === 45 || n.note === 47) {
        drum = 'M'; // Mid Tom -> M for stave positioning
      }
      // Default to snare for unknown notes
      else {
        console.warn(`[convertMIDIRecordingToPattern] Unknown MIDI note ${n.note}, defaulting to Snare. Consider adding to MIDI_TO_DRUM_MAP.`);
        drum = 'S';
      }
    } else {
      // Log when note is found in map (especially for floor tom and hi-hat)
      if (n.note === 41 || (n.note >= 42 && n.note <= 46)) {
        console.log(`[convertMIDIRecordingToPattern] MIDI note ${n.note} found in map, mapped to: ${drum}`);
      }
    }
    
    return {
      ...n,
      drum: drum || 'S' // Ensure drum is always set
    };
  });
  
  // Log mapping summary
  const drumCounts: Record<string, number> = {};
  mappedNotes.forEach(n => {
    drumCounts[n.drum] = (drumCounts[n.drum] || 0) + 1;
  });
  console.log(`[convertMIDIRecordingToPattern] Drum mapping summary:`, drumCounts);

  const timeSig = timeSignature.split('/');
  const beatsPerMeasure = parseInt(timeSig[0], 10);
  const beatValue = parseInt(timeSig[1], 10);
  
  // Calculate grid spacing (in milliseconds)
  const msPerBeat = 60000 / bpm;
  
  // Group notes by measure first
  const notesByMeasure: Array<{ measureIndex: number; notes: typeof mappedNotes }> = [];
  mappedNotes.forEach(note => {
    const beatNumber = Math.floor(note.time / msPerBeat);
    const measureIndex = Math.floor(beatNumber / beatsPerMeasure);
    let measureGroup = notesByMeasure.find(g => g.measureIndex === measureIndex);
    if (!measureGroup) {
      measureGroup = { measureIndex, notes: [] };
      notesByMeasure.push(measureGroup);
    }
    measureGroup.notes.push(note);
  });
  
  // Sort by measure
  notesByMeasure.sort((a, b) => a.measureIndex - b.measureIndex);
  
  // Determine number of measures
  const maxMeasureIndex = notesByMeasure.length > 0 ? Math.max(...notesByMeasure.map(m => m.measureIndex)) : 0;
  const measures: number = maxBars !== undefined ? maxBars : maxMeasureIndex + 1;
  
  console.log(`[convertMIDIRecordingToPattern] Creating ${measures} measure(s) from ${notesByMeasure.length} measure groups`);
  
  // Create patterns for each measure separately
  // Each measure can have its own per-beat subdivisions
  const newPatterns: ConvertedPattern[] = [];
  
  for (let measureIndex = 0; measureIndex < measures; measureIndex++) {
    // Get notes in this measure
    const measureGroup = notesByMeasure.find(m => m.measureIndex === measureIndex);
    if (!measureGroup || measureGroup.notes.length === 0) {
      continue; // Skip empty measures
    }
    
    const measureNotes = measureGroup.notes;
    
    // Detect subdivisions for this measure only
    const measureDetectedSubdivision = detectSubdivisionFromNotes(measureNotes, timeSignature, bpm);
    const measureUsePerBeatSubdivisions = measureDetectedSubdivision.perBeatSubdivisions && measureDetectedSubdivision.perBeatSubdivisions.length > 0;
    const measurePerBeatSubdivisions = measureUsePerBeatSubdivisions ? measureDetectedSubdivision.perBeatSubdivisions : null;
    const measureSubdivision = measureDetectedSubdivision.subdivision;
    
    console.log(`[convertMIDIRecordingToPattern] Measure ${measureIndex + 1}: ${measureNotes.length} notes, subdivision: ${measureSubdivision}, perBeat: ${measurePerBeatSubdivisions?.join(',') || 'none'}`);
    
    // Quantize notes for this measure using its own subdivisions
    const measureNotesByBeat: Array<{ beat: number; notes: typeof measureNotes }> = [];
    measureNotes.forEach(note => {
      const beatNumber = Math.floor(note.time / msPerBeat);
      const beatInMeasure = beatNumber % beatsPerMeasure;
      let beatGroup = measureNotesByBeat.find(g => g.beat === beatInMeasure);
      if (!beatGroup) {
        beatGroup = { beat: beatInMeasure, notes: [] };
        measureNotesByBeat.push(beatGroup);
      }
      beatGroup.notes.push(note);
    });
    measureNotesByBeat.sort((a, b) => a.beat - b.beat);
    
    // Quantize notes for this measure and create grid map
    const measureGridMap: Record<number, string[]> = {};
    const noteDeduplicationMap: Map<string, boolean> = new Map();
    let measureGridOffset = 0; // Grid position offset for this measure
    
    measureNotesByBeat.forEach(beatGroup => {
      const beatSubdivision = measureUsePerBeatSubdivisions && measurePerBeatSubdivisions
        ? measurePerBeatSubdivisions[beatGroup.beat % measurePerBeatSubdivisions.length]
        : measureSubdivision;
      
      const notesPerBeatForSubdiv = beatSubdivision / beatValue;
      const msPerGrid = msPerBeat / notesPerBeatForSubdiv;
      
      beatGroup.notes.forEach(note => {
        // Deduplicate at the raw note level
        const timeKey = Math.round(note.time / 5) * 5; // Round to 5ms for deduplication
        const dedupeKey = `${note.note}-${note.drum}-${timeKey}`;
        
        if (noteDeduplicationMap.has(dedupeKey)) {
          console.log(`[convertMIDIRecordingToPattern] Filtered duplicate: note ${note.note} (${note.drum}) at ${note.time.toFixed(2)}ms`);
          return;
        }
        noteDeduplicationMap.set(dedupeKey, true);
        
        const beatStartTime = (measureIndex * beatsPerMeasure + beatGroup.beat) * msPerBeat;
        const timeWithinBeat = note.time - beatStartTime;
        const beatGridPosition = Math.max(0, Math.round(timeWithinBeat / msPerGrid));
        
        const gridPosition = measureGridOffset + beatGridPosition;
        
        if (!measureGridMap[gridPosition]) {
          measureGridMap[gridPosition] = [];
        }
        if (!measureGridMap[gridPosition].includes(note.drum)) {
          measureGridMap[gridPosition].push(note.drum);
        }
      });
      
      // Update grid offset for next beat
      measureGridOffset += notesPerBeatForSubdiv;
    });
    
    // Calculate notes per measure for this measure's subdivisions
    let measureNotesPerMeasure = 0;
    if (measureUsePerBeatSubdivisions && measurePerBeatSubdivisions) {
      for (let i = 0; i < beatsPerMeasure; i++) {
        const beatSubdiv = measurePerBeatSubdivisions[i % measurePerBeatSubdivisions.length];
        measureNotesPerMeasure += beatSubdiv / beatValue;
      }
    } else {
      const notesPerBeat = measureSubdivision / beatValue;
      measureNotesPerMeasure = beatsPerMeasure * notesPerBeat;
    }
    
    // Build phrase and drum pattern for this measure using its own per-beat subdivisions
    const phrase: number[] = [];
    const drumPattern: string[] = [];
    
    let currentGridPos = 0; // Start from 0 for each measure
    let beatIndex = 0;
    
    while (beatIndex < beatsPerMeasure && currentGridPos < measureNotesPerMeasure) {
      const beatSubdivision = measureUsePerBeatSubdivisions && measurePerBeatSubdivisions
        ? measurePerBeatSubdivisions[beatIndex % measurePerBeatSubdivisions.length]
        : measureSubdivision;
      const notesPerBeatForSubdiv = beatSubdivision / beatValue;
      
      // Find all notes in this beat
      const beatStartGrid = currentGridPos;
      const beatEndGrid = currentGridPos + notesPerBeatForSubdiv - 1;
      const beatNotes: Array<{ gridPos: number; drums: string[] }> = [];
      
      for (let pos = beatStartGrid; pos <= beatEndGrid && pos < measureNotesPerMeasure; pos++) {
        if (measureGridMap[pos] && measureGridMap[pos].length > 0) {
          const drumsAtPosition = measureGridMap[pos];
          if (drumsAtPosition.length === 1) {
            beatNotes.push({ gridPos: pos, drums: [drumsAtPosition[0]] });
          } else {
            // Multiple drums at same position - combine them (e.g., "S+K")
            // Sort for consistency (K, S, H, T, F, O)
            const sortedDrums = drumsAtPosition.sort((a, b) => {
              const order: Record<string, number> = { 'K': 0, 'S': 1, 'H': 2, 'T': 3, 'F': 4, 'O': 5 };
              return (order[a] || 99) - (order[b] || 99);
            });
            beatNotes.push({ gridPos: pos, drums: [sortedDrums.join('+')] });
          }
        }
      }
      
      // Only process this beat if it has notes
      if (beatNotes.length > 0) {
        // Build the drum pattern for this beat
        const beatDrums: string[] = [];
        
        // Sort notes by grid position
        beatNotes.sort((a, b) => a.gridPos - b.gridPos);
        
        // For single note beats, just add the note (no rests needed)
        if (beatNotes.length === 1) {
          beatDrums.push(beatNotes[0].drums[0]);
        } else {
          // Multiple notes - build pattern with rests between notes if needed
          let lastNotePos = beatStartGrid - 1;
          beatNotes.forEach(note => {
            // Add rests for gaps between notes
            const gap = note.gridPos - lastNotePos - 1;
            for (let i = 0; i < gap; i++) {
              beatDrums.push('R');
            }
            beatDrums.push(note.drums[0]);
            lastNotePos = note.gridPos;
          });
        }
        
        phrase.push(notesPerBeatForSubdiv);
        drumPattern.push(beatDrums.join(' '));
        
        console.log(`[convertMIDIRecordingToPattern] Beat ${beatIndex}: subdivision=${beatSubdivision}, notesPerBeat=${notesPerBeatForSubdiv}, pattern="${beatDrums.join(' ')}"`);
      }
      
      currentGridPos += notesPerBeatForSubdiv;
      beatIndex++;
    }
    
    // Only create pattern if there are notes in this measure
    if (phrase.length > 0 && drumPattern.length > 0) {
      const [beats, beatType] = parseTimeSignature(timeSignature);
      const pattern: ConvertedPattern = {
        id: Date.now() + measureIndex,
        timeSignature: timeSignature,
        beats,
        beatType,
        subdivision: measureSubdivision,
        phrase: phrase.join(' '),
        drumPattern: drumPattern.join(' '),
        stickingPattern: '', // Can be auto-generated or left empty
        leftFoot: false,
        rightFoot: false,
        repeat: 1,
        _advancedMode: measureUsePerBeatSubdivisions, // Enable advanced mode if using per-beat subdivisions
      };
      
      // Add per-beat subdivisions if detected
      if (measureUsePerBeatSubdivisions && measurePerBeatSubdivisions) {
        pattern._perBeatSubdivisions = measurePerBeatSubdivisions;
      }
      
      newPatterns.push(pattern);
    }
  }

  return newPatterns;
}


