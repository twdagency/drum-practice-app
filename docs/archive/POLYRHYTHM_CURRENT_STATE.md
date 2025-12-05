# Polyrhythm Implementation - Current State

## Date: Current Session

## What's Working

### Display Modes
- ✅ **Two Staves Mode**: Notes are correctly positioned and displayed on separate staves for right and left hands
- ✅ **Stacked Mode**: Notes are correctly positioned (matching two-staves mode) and aligned notes stack vertically as chords
- ✅ Notes are rearranged in DOM to chronological order after rendering

### Note Building
- ✅ Combined notes (with multiple keys) are created for aligned positions in stacked mode
- ✅ Rests are used in left voice for aligned positions in stacked mode
- ✅ Separate notes are created for non-aligned positions

### Playback
- ✅ Audio playback correctly combines aligned notes into single events with `hand: 'both'`
- ✅ Drum sounds play correctly for both hands
- ✅ Click sounds respect `polyrhythmClickMode` settings
- ✅ Metronome-only mode works correctly

### Per-Hand Features
- ✅ Different highlight colors for right (blue), left (green), and both (orange) hands
- ✅ Per-hand accents are supported
- ✅ Polyrhythm click mode options: both, right-only, left-only, metronome-only, none

## Known Issues

### Highlighting in Stacked Mode
- ❌ **Issue**: When "left hand only" is selected, right-hand notes are still highlighting
- ❌ **Issue**: First left-hand note doesn't highlight when it should
- ❌ **Issue**: Highlighting sequence is incorrect - shows first right note, then quickly first left note before second note

### Root Cause Analysis
The highlighting issues appear to be related to:
1. **Attribute Setting**: Notes may not be getting the correct `data-voice` and `data-polyrhythm-note-index` attributes after DOM rearrangement
2. **Matching Logic**: The chronological matching by index may not account for all edge cases (e.g., when notes are combined vs separate)
3. **Fallback Logic**: The fallback highlighting mechanism may be interfering with the filter logic

## Technical Details

### Current Implementation Approach

#### Stacked Mode Rendering
1. Format each voice separately (like two-staves mode) to get correct spacing
2. Draw both voices on the same stave
3. Rearrange SVG note groups to chronological order by x position
4. Set `data-voice` and `data-polyrhythm-note-index` attributes based on chronological order

#### Attribute Setting Logic
- Notes are matched to scheduled events by array index (after chronological rearrangement)
- Annotations are verified to match expected values
- Attributes are set: `data-voice` ('left', 'right', or 'both') and `data-polyrhythm-note-index` (scheduled note index)

#### Highlighting Logic
- Finds notes by `data-polyrhythm-note-index` attribute
- Filters notes based on `polyrhythmClickMode`:
  - `both`: highlights all notes
  - `right-only`: only highlights `voice='right'`
  - `left-only`: only highlights `voice='left'`
  - `metronome-only`/`none`: no highlighting
- Fallback uses array index but checks voice attribute

### Files Involved
- `components/Stave/Stave.tsx`: Rendering, attribute setting, highlighting
- `hooks/usePlayback.ts`: Playback scheduling and audio
- `store/slices/uiSlice.ts`: UI state (display mode, click mode)
- `components/PracticeMode/AudioSettingsModal.tsx`: UI controls

## Next Steps (When Returning to This)

1. **Debug Attribute Setting**:
   - Add more detailed logging to see what attributes are being set
   - Verify that all notes get attributes, especially the first left-hand note
   - Check if combined notes are getting correct attributes

2. **Fix Highlighting Filter**:
   - Ensure the filter correctly excludes right-hand notes when "left-only" is selected
   - Verify that the first left-hand note is included in the filter results

3. **Improve Matching Logic**:
   - Consider matching by beat position and annotation more robustly
   - Handle edge cases where notes might be out of order or missing annotations

4. **Test Cases**:
   - Test with different polyrhythm ratios (3:2, 4:3, 5:4, etc.)
   - Test with different time signatures
   - Test with accents on different hands
   - Test all click mode combinations

## Related Documentation
- `docs/POLYRHYTHM_DEEP_ANALYSIS.md`: Initial analysis and rewrite plan
- `docs/POLYRHYTHM_IMPLEMENTATION_SUMMARY.md`: Implementation summary
- `scripts/test-polyrhythms.js`: Test script for polyrhythm logic

