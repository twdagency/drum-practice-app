# Per-Beat Subdivisions Implementation

## Overview
This feature allows users to set different subdivisions for each beat in a bar, creating more complex rhythmic patterns. For example, in 4/4 time:
- Beat 1: 16th notes (4 notes)
- Beat 2: 8th notes (2 notes)
- Beat 3: Quarter note (1 note)
- Beat 4: Quarter note (1 note)
Total: 8 notes

## Implementation Status

### ✅ Completed
1. **Pattern Type Updates**
   - Added `_advancedMode?: boolean` flag to Pattern interface
   - Added `_perNoteSubdivisions?: number[]` array to store subdivisions for each note

2. **Utility Functions**
   - `calculateNotesPerBarFromPerNoteSubdivisions()`: Calculates total beats from per-note subdivisions
   - `calculateNoteDurations()`: Calculates duration in beats for each note

3. **UI Components**
   - Created `PerNoteSubdivisionEditor` component for editing per-note subdivisions
   - Added toggle for "Advanced (per-note subdivisions)" mode in PatternFields
   - Shows validation (total beats vs required beats for time signature)
   - Allows adding/removing notes and changing subdivision per note

### 🚧 In Progress / TODO
1. **Pattern Generation**
   - Update `generateRandomPattern()` to support per-note subdivisions
   - Update `randomizePattern()` to support per-note subdivisions
   - Add randomizer for per-note subdivisions

2. **Rendering (Stave.tsx)**
   - Update note building to use per-note subdivisions when `_advancedMode` is true
   - Handle mixed subdivisions in VexFlow rendering
   - Ensure correct note durations and spacing

3. **Playback (usePlayback.ts)**
   - Update scheduling to use per-note durations when `_advancedMode` is true
   - Ensure clicks and highlighting work correctly with mixed subdivisions
   - Calculate correct timing for each note based on its subdivision

4. **Pattern Utilities**
   - Update `calculateNotesPerBar()` to check for advanced mode
   - Update accent handling to work with per-note subdivisions
   - Update pattern validation

## Technical Details

### Data Structure
```typescript
Pattern {
  subdivision: number; // Default subdivision (used when _advancedMode is false)
  _advancedMode?: boolean; // If true, use _perBeatSubdivisions
  _perBeatSubdivisions?: number[]; // Array of subdivisions, one per beat
}
```

### Example
For a pattern in 4/4 with beat 1 = 16th notes, beat 2 = 8th notes, beats 3-4 = quarter notes:
- `_advancedMode: true`
- `_perBeatSubdivisions: [16, 8, 4, 4]`
- Beat 1: 4 notes (16/4 = 4 sixteenth notes per quarter beat)
- Beat 2: 2 notes (8/4 = 2 eighth notes per quarter beat)
- Beat 3: 1 note (4/4 = 1 quarter note per quarter beat)
- Beat 4: 1 note (4/4 = 1 quarter note per quarter beat)
- Total: 8 notes, 4 beats (fills the bar correctly)

### Validation
The UI shows:
- Number of beats configured vs required beats from time signature
- Number of notes per beat for each beat
- Total notes per bar
- Warning if beat count doesn't match time signature
- Success indicator when beat count matches

## Next Steps

1. Update pattern generation to create valid per-note subdivision patterns
2. Update rendering to handle mixed subdivisions
3. Update playback to schedule notes correctly
4. Add randomizers for per-note subdivisions
5. Test with various time signatures and subdivision combinations

