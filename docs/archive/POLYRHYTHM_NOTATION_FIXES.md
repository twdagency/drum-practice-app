# Polyrhythm Notation Fixes

## Current Issues

1. **Note Alignment**: Notes are being combined incorrectly. In a 5:4 polyrhythm, only the first notes should align (at position 0), not subsequent notes.

2. **4:3 Polyrhythm Notation**: 
   - Right hand: 4 quarter notes evenly spaced (beats 1, 2, 3, 4)
   - Left hand: 3 notes in a triplet that occupies the time of the whole measure (4 beats)
   - Currently, the left hand notes appear to finish before the right hand, which is incorrect.

3. **Tuplet Configuration**: The tuplet configuration needs to ensure that both rhythms span the same duration (the measure length).

## Research Findings

### For 4:3 Polyrhythm in 4/4 time:
- **Right hand**: 4 quarter notes, each 1 beat, spaced at beats 0, 1, 2, 3
- **Left hand**: 3 notes evenly spaced across 4 beats (the whole measure)
  - Positions: 0, 4/3, 8/3 of the measure (approximately 0, 1.33, 2.67 beats)
  - This is a **triplet** that occupies the time of **4 quarter notes** (the whole measure)
  - Traditional notation: 3 notes with a tuplet bracket labeled "3" over "4" (3 notes in time of 4)

### For 5:4 Polyrhythm in 4/4 time:
- **Right hand**: 5 notes evenly spaced (positions 0, 0.8, 1.6, 2.4, 3.2)
- **Left hand**: 4 quarter notes (positions 0, 1, 2, 3)
- **Only position 0 aligns exactly** - the notes should only be combined at the start

### Note Alignment Tolerance
- Notes should only be combined when they align **exactly** in time
- Tolerance should be very small (0.001) to account only for floating point precision
- Current tolerance of 0.05 is too high and causes incorrect combinations

## Required Fixes

1. **Reduce alignment tolerance** to 0.001 (only exact matches)
2. **Fix tuplet configuration**: For 4:3, the tuplet should be "3 notes in time of 4 quarter notes" (whole measure)
3. **Verify note spacing**: Both voices should span the full measure duration
4. **Test alignment detection**: Only notes at exactly the same time position should be combined

