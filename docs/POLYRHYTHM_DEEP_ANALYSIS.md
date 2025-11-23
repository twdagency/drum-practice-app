# Polyrhythm Notation - Deep Analysis and Complete Rewrite Plan

## Executive Summary

The current polyrhythm implementation is fundamentally flawed and needs a complete rewrite. This document provides:
1. Research on correct polyrhythm notation
2. Analysis of current implementation issues
3. Complete rewrite plan
4. Implementation specifications

## Part 1: Research - How Polyrhythms Should Be Notated

### Fundamental Principles

**Polyrhythm Definition:**
- Two or more rhythms played simultaneously with different note values
- The rhythms have different numbers of notes but occupy the same time duration
- Example: 4:3 means 4 notes in one voice against 3 notes in another, both in the same measure

### Standard Notation Rules

#### 1. For 4:3 Polyrhythm in 4/4 time:

**Voice 1 (4 notes):**
- 4 quarter notes, evenly spaced
- Positions: beat 1, beat 2, beat 3, beat 4
- Duration: each note = 1 beat
- Notation: 4 quarter notes with normal spacing

**Voice 2 (3 notes):**
- 3 notes in a tuplet
- Tuplet: "3 notes in the time of 4 quarter notes" (the entire measure)
- Positions: evenly spaced across 4 beats
  - Position 0 (beat 1)
  - Position 4/3 ≈ 1.33 beats
  - Position 8/3 ≈ 2.67 beats
- Notation: 3 notes with tuplet bracket labeled "3" over "4"
- The tuplet spans the entire measure

**Key Point:** The 3 notes must be evenly spaced across the full 4-beat measure, not compressed into a smaller duration.

#### 2. For 5:4 Polyrhythm in 4/4 time:

**Voice 1 (5 notes):**
- 5 notes evenly spaced across 4 beats
- Each note = 4/5 = 0.8 beats
- Positions: 0, 0.8, 1.6, 2.4, 3.2 beats
- Notation: 5 notes with tuplet "5 in the time of 4"

**Voice 2 (4 notes):**
- 4 quarter notes
- Positions: 0, 1, 2, 3 beats
- Normal quarter note notation

**Alignment:**
- Only position 0 aligns exactly
- All other notes occur at different times
- Notes should NOT be combined except at position 0

#### 3. For 3:2 Polyrhythm in 4/4 time:

**Voice 1 (3 notes):**
- 3 notes in triplet
- Tuplet: "3 in the time of 2" (half note duration)
- Positions: 0, 2/3, 4/3 beats (within first 2 beats)
- Then repeats for beats 3-4

**Voice 2 (2 notes):**
- 2 half notes
- Positions: 0, 2 beats

### Mathematical Foundation

For a polyrhythm ratio `n:m` in a measure of `B` beats:

**Voice 1 (numerator = n notes):**
- Each note duration = `B / n` beats
- Positions: `i * (B / n)` for i = 0, 1, 2, ..., n-1

**Voice 2 (denominator = m notes):**
- Each note duration = `B / m` beats  
- Positions: `j * (B / m)` for j = 0, 1, 2, ..., m-1

**Alignment Check:**
- Notes align when `i * (B / n) = j * (B / m)`
- Simplifies to: `i * m = j * n`
- This only happens when both are multiples of LCM(n, m)

### VexFlow Requirements

VexFlow handles polyrhythms using:
1. **Tuplets**: `Tuplet` class to group notes
2. **Multiple Voices**: Separate `Voice` objects for each rhythm
3. **Formatter**: `Formatter.joinVoices()` to align voices vertically
4. **Tuplet Configuration**: 
   - `num_notes`: number of notes in the tuplet
   - `notes_occupied`: number of normal notes the tuplet replaces

**Critical VexFlow Tuplet Rules:**
- Tuplet must specify: "X notes in the time of Y notes"
- The `notes_occupied` must match the duration being replaced
- For 4:3, the 3-note tuplet should be "3 in the time of 4 quarter notes"

## Part 2: Current Implementation Analysis

### Critical Issues Found

#### Issue 1: Incorrect Note Position Calculation
**Current Code (polyrhythmUtils.ts:36-63):**
```typescript
const position = (i / numNotes) * measureLength;
const index = Math.round(position);
```

**Problem:**
- Uses subdivision indices (0-15 for 16th notes) instead of beat positions
- Rounding causes incorrect positions
- Doesn't account for actual beat timing

**Should Be:**
- Calculate positions in beats (0-4 for 4/4)
- Use precise fractional positions
- Map to VexFlow note positions correctly

#### Issue 2: Wrong Tuplet Configuration
**Current Code (Stave.tsx:2634-2641):**
```typescript
tupletConfig: {
  num_notes: denominator,
  notes_occupied: numerator,
}
```

**Problem:**
- For 4:3, this says "3 notes in time of 4" which is correct
- BUT the note durations are wrong
- The 3 notes should each be quarter-note duration within the tuplet
- Currently using wrong duration calculations

#### Issue 3: Incorrect Note Duration Calculation
**Current Code (Stave.tsx:2424-2450):**
```typescript
const rightNoteDuration = beatsPerBar / numerator;
const leftNoteDuration = beatsPerBar / denominator;
```

**Problem:**
- Calculates duration per note, but doesn't account for tuplets
- For 4:3, right should be quarter notes (1 beat each)
- For 4:3, left should be quarter notes in a tuplet (but tuplet makes them span 4 beats total)
- The duration strings are wrong

#### Issue 4: Wrong Voice Structure
**Current Code:**
- Creates notes sequentially
- Doesn't properly use VexFlow's Voice system
- Doesn't use `Formatter.joinVoices()` correctly
- Notes aren't aligned in time properly

#### Issue 5: Alignment Detection Issues
**Current Code (Stave.tsx:2468-2470):**
```typescript
const positionsAlign = (pos1: number, pos2: number, tolerance: number = 0.001): boolean => {
  return Math.abs(pos1 - pos2) < tolerance;
};
```

**Problem:**
- Uses fractional positions (0-1) but compares incorrectly
- Should compare beat positions, not normalized positions
- Tolerance might be too strict or too loose depending on context

#### Issue 6: Playback Timing
**Current Issue:**
- Playback likely uses the wrong timing
- Notes should play at precise beat positions
- Need to verify playback implementation

## Part 3: Complete Rewrite Plan

### Architecture Overview

```
┌─────────────────────────────────────────┐
│  Polyrhythm Pattern (Data Structure)    │
│  - ratio: {numerator, denominator}      │
│  - timeSignature: "4/4"                 │
│  - rightRhythm: {notes[], voice, limb}  │
│  - leftRhythm: {notes[], voice, limb}  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Position Calculator                    │
│  - Calculate beat positions             │
│  - Handle tuplet spacing                │
│  - Detect alignments                    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  VexFlow Note Builder                   │
│  - Create Voice 1 (numerator)           │
│  - Create Voice 2 (denominator)         │
│  - Apply tuplets correctly              │
│  - Set note durations                   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  VexFlow Formatter                      │
│  - joinVoices() to align                │
│  - Format stave                         │
└─────────────────────────────────────────┘
```

### Step 1: Rewrite Position Calculator

**New Function: `calculatePolyrhythmPositions`**

```typescript
interface PolyrhythmPositions {
  rightPositions: number[];  // Beat positions (0-4 for 4/4)
  leftPositions: number[];   // Beat positions (0-4 for 4/4)
  alignments: Array<{rightIndex: number, leftIndex: number}>;
}

function calculatePolyrhythmPositions(
  numerator: number,
  denominator: number,
  beatsPerBar: number
): PolyrhythmPositions {
  // Calculate precise beat positions
  const rightPositions: number[] = [];
  const leftPositions: number[] = [];
  
  // Voice 1: n notes evenly spaced across B beats
  for (let i = 0; i < numerator; i++) {
    rightPositions.push((i * beatsPerBar) / numerator);
  }
  
  // Voice 2: m notes evenly spaced across B beats
  for (let j = 0; j < denominator; j++) {
    leftPositions.push((j * beatsPerBar) / denominator);
  }
  
  // Find exact alignments (i*m = j*n)
  const alignments: Array<{rightIndex: number, leftIndex: number}> = [];
  for (let i = 0; i < numerator; i++) {
    for (let j = 0; j < denominator; j++) {
      // Check if positions align exactly
      const rightPos = rightPositions[i];
      const leftPos = leftPositions[j];
      if (Math.abs(rightPos - leftPos) < 0.0001) {
        alignments.push({rightIndex: i, leftIndex: j});
      }
    }
  }
  
  return { rightPositions, leftPositions, alignments };
}
```

### Step 2: Rewrite Note Duration Calculator

**New Function: `calculatePolyrhythmDurations`**

```typescript
interface PolyrhythmDurations {
  rightDuration: string;      // VexFlow duration string
  leftDuration: string;        // VexFlow duration string
  rightNeedsTuplet: boolean;
  leftNeedsTuplet: boolean;
  rightTupletConfig: {num_notes: number, notes_occupied: number} | null;
  leftTupletConfig: {num_notes: number, notes_occupied: number} | null;
}

function calculatePolyrhythmDurations(
  numerator: number,
  denominator: number,
  beatsPerBar: number
): PolyrhythmDurations {
  // Voice 1: n notes in B beats
  // Each note = B/n beats
  const rightNoteDurationBeats = beatsPerBar / numerator;
  
  // Voice 2: m notes in B beats
  // Each note = B/m beats
  const leftNoteDurationBeats = beatsPerBar / denominator;
  
  // Convert beats to VexFlow duration
  // For 4/4: 1 beat = quarter note = 'q'
  // For 3/4: 1 beat = quarter note = 'q'
  // For 6/8: 1 beat = dotted quarter = 'qd'
  
  // Determine if tuplet is needed
  // Tuplet needed if note duration doesn't match standard note values
  const rightNeedsTuplet = !isStandardNoteValue(rightNoteDurationBeats);
  const leftNeedsTuplet = !isStandardNoteValue(leftNoteDurationBeats);
  
  // For 4:3 in 4/4:
  // Right: 4 notes, each 1 beat = quarter notes, no tuplet
  // Left: 3 notes, each 4/3 beats = needs tuplet "3 in time of 4"
  
  // Calculate tuplet configs
  let rightTupletConfig = null;
  let leftTupletConfig = null;
  
  if (rightNeedsTuplet) {
    // Find closest standard duration
    const baseDuration = findClosestStandardDuration(rightNoteDurationBeats);
    rightTupletConfig = {
      num_notes: numerator,
      notes_occupied: Math.round(numerator * baseDuration / rightNoteDurationBeats)
    };
  }
  
  if (leftNeedsTuplet) {
    const baseDuration = findClosestStandardDuration(leftNoteDurationBeats);
    leftTupletConfig = {
      num_notes: denominator,
      notes_occupied: Math.round(denominator * baseDuration / leftNoteDurationBeats)
    };
  }
  
  return {
    rightDuration: beatsToVexFlowDuration(rightNoteDurationBeats),
    leftDuration: beatsToVexFlowDuration(leftNoteDurationBeats),
    rightNeedsTuplet,
    leftNeedsTuplet,
    rightTupletConfig,
    leftTupletConfig,
  };
}
```

### Step 3: Rewrite VexFlow Note Building

**New Function: `buildPolyrhythmVoices`**

Key changes:
1. Create two separate VexFlow `Voice` objects
2. Build notes with correct durations and positions
3. Apply tuplets correctly
4. Handle aligned notes properly
5. Use `Formatter.joinVoices()` to align

### Step 4: Fix Playback Timing

**New Function: `calculatePolyrhythmPlaybackTimings`**

Calculate exact playback times for each note based on:
- Beat positions
- BPM
- Precise timing (no rounding errors)

## Part 4: Implementation Checklist

### Phase 1: Research & Design (Current)
- [x] Research correct polyrhythm notation
- [x] Analyze current implementation
- [x] Create rewrite plan
- [ ] Review VexFlow documentation for tuplets
- [ ] Test VexFlow tuplet examples

### Phase 2: Core Rewrite
- [ ] Rewrite `calculatePolyrhythmPositions`
- [ ] Rewrite `calculatePolyrhythmDurations`
- [ ] Rewrite `buildPolyrhythmVoices` in Stave.tsx
- [ ] Fix tuplet configuration
- [ ] Fix note alignment detection

### Phase 3: VexFlow Integration
- [ ] Implement proper Voice creation
- [ ] Implement proper tuplet application
- [ ] Implement `Formatter.joinVoices()`
- [ ] Test with various ratios (3:2, 4:3, 5:4, 7:4)

### Phase 4: Playback Fix
- [ ] Rewrite playback timing calculation
- [ ] Test playback accuracy
- [ ] Verify note timing matches notation

### Phase 5: Testing & Validation
- [ ] Visual inspection of notation
- [ ] Compare with standard notation examples
- [ ] Test all common ratios
- [ ] Test with different time signatures
- [ ] Verify playback matches notation

## Part 5: Specific Fixes for Common Ratios

### 4:3 Polyrhythm
- Right: 4 quarter notes (no tuplet)
- Left: 3 quarter notes in tuplet "3 in time of 4"
- Tuplet spans entire measure

### 5:4 Polyrhythm
- Right: 5 notes in tuplet "5 in time of 4"
- Left: 4 quarter notes (no tuplet)
- Only first notes align

### 3:2 Polyrhythm
- Right: 3 notes in tuplet "3 in time of 2" (half note duration)
- Left: 2 half notes
- Pattern repeats in 4/4 (two groups per measure)

## Next Steps

1. **Immediate**: Review VexFlow tuplet documentation and examples
2. **Then**: Implement new position calculator
3. **Then**: Implement new duration calculator
4. **Then**: Rewrite VexFlow note building
5. **Finally**: Test thoroughly with multiple ratios

This is a complete rewrite - the current approach is fundamentally wrong and needs to be replaced entirely.

