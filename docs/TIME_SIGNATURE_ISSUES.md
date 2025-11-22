# Time Signature and Subdivision Issues

## Problem

The current system incorrectly handles time signatures and subdivisions:

### 1. Subdivision vs Notes Per Bar Confusion

**Current Issue**: `subdivision` is used both as:
- The note type (4=quarter, 8=eighth, 12=triplets, 16=sixteenth, etc.)
- The assumed total notes per bar (which is only true for 4/4 time)

**Example Problems**:
- **4/4 time with 16th notes**: subdivision=16 → 16 notes per bar ✓ (correct)
- **3/4 time with 16th notes**: subdivision=16 → should be 12 notes per bar, but system uses 16 ✗
- **7/8 time with 16th notes**: subdivision=16 → should be 14 notes per bar, but system uses 16 ✗
- **6/8 time with 16th notes**: subdivision=16 → should be 12 notes per bar (6 beats × 2 eighth-note beats), but system uses 16 ✗

### 2. Hardcoded Phrases

**Current Issue**: Phrases in `randomSets.ts` are hardcoded assuming 4/4 time:
```typescript
16: [
  [4, 4, 4, 4],  // = 16 notes (works for 4/4, but not 3/4, 7/8, etc.)
  [6, 6, 4],      // = 16 notes
  // ...
]
```

These phrases don't account for different time signatures:
- For 3/4 time with 16th notes: need phrases that sum to 12
- For 7/8 time with 16th notes: need phrases that sum to 14
- For 6/8 time: depends on how 6/8 is interpreted (compound vs simple)

### 3. Accent Generation

**Current Issue**: `randomizeAccents(subdivision)` uses subdivision directly:
- For 3/4 time with 16th notes, it generates accents 0-15, but should be 0-11
- Accents should be based on actual notes per bar, not subdivision

### 4. Voicing and Sticking Patterns

**Current Issue**: Patterns are generated with a fixed length based on subdivision:
- For 3/4 time, a pattern like "S S S S" (4 notes) doesn't fit the bar properly
- Patterns should repeat or adjust to match the actual notes per bar

## How Subdivision Should Work

`subdivision` represents the note type relative to a quarter note:
- `4` = quarter notes (1 per beat in 4/4)
- `8` = eighth notes (2 per beat in 4/4)
- `12` = eighth note triplets (3 per beat in 4/4)
- `16` = sixteenth notes (4 per beat in 4/4)
- `24` = sixteenth note triplets (6 per beat in 4/4)
- `32` = thirty-second notes (8 per beat in 4/4)

## How Time Signature Should Work

The time signature tells us:
- `numerator`: How many beats per bar
- `denominator`: What note value gets the beat (4=quarter, 8=eighth)

**Notes per bar calculation**:
```
notesPerBar = numerator × (subdivision / denominator)
```

**Examples**:
- 4/4 with 16: `4 × (16/4) = 4 × 4 = 16` ✓
- 3/4 with 16: `3 × (16/4) = 3 × 4 = 12` ✓
- 7/8 with 16: `7 × (16/8) = 7 × 2 = 14` ✓
- 6/8 with 16: `6 × (16/8) = 6 × 2 = 12` ✓ (if 6/8 is compound with 2 eighth-note beats)
- 5/4 with 16: `5 × (16/4) = 5 × 4 = 20` ✓

## Special Cases

### 6/8 Time Signature
6/8 can be interpreted two ways:
1. **Compound time**: 2 beats per bar (each beat is a dotted quarter = 3 eighth notes)
   - With 16th notes: `2 × (16/4) = 2 × 4 = 8` notes per bar
   - But 6/8 usually means the beat is an eighth note, so: `6 × (16/8) = 6 × 2 = 12`

2. **Simple time**: 6 beats per bar (each beat is an eighth note)
   - With 16th notes: `6 × (16/8) = 6 × 2 = 12` notes per bar

We should use the standard interpretation: denominator=8 means eighth note gets the beat, so `6 × 2 = 12` sixteenth notes per bar.

## Required Fixes

1. **Update `calculateNotesPerBar`**: Already exists, verify it handles all cases correctly
2. **Generate phrases dynamically**: Phrases should sum to actual notes per bar, not hardcoded subdivision
3. **Fix accent generation**: Use actual notes per bar instead of subdivision
4. **Fix pattern generation**: Generate drum patterns and sticking patterns that match actual notes per bar
5. **Update random pattern generation**: Account for time signature when generating patterns
6. **Validate phrases on load**: Ensure phrases sum to correct notes per bar for current time signature

