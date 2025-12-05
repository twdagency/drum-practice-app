# Preset Pattern Review and Fix Plan

## Overview

Comprehensive review and correction of all 212 preset patterns to ensure accuracy in:
- **Voicing** (drumPattern - S, K, T, F, H, etc.)
- **Sticking** (stickingPattern - R, L, lR, rL, etc.)
- **Accents** (musically appropriate placement)
- **Subdivisions** (correct note values)
- **Uniqueness** (no duplicate patterns)

## Issues Identified (From Analysis)

**Analysis Results:**
- **84 Duplicate Patterns** - Many presets are identical to others
- **4 Missing Flams** - Flam-named patterns without flam notation
- **30 Incorrect Sticking** - Rudiments don't match PAS 40 standards
- **2 Excessive Accents** - Every note accented unnecessarily
- **32 Missing Accents** - Patterns that should have accents don't
- **5 Name Mismatches** - "Double Stroke" patterns using single stroke sticking

**Total: 369 issues across 123 presets**

### Key Issues Found:

1. **Identical Patterns**: 
   - "Speed: Single Stroke Slow", "Speed: Single Stroke Moderate", and "Speed: Double Stroke Basic" are all identical
   - Many famous beats are identical to each other
   - Many warmup patterns duplicate beginner patterns

2. **Missing Flams**: 
   - "Flam Paradiddle-Diddle" and "Flam Paradiddle-Diddle (Alt)" have no flams
   - "Single Flammed Mill" has no flams

3. **Incorrect Sticking**: 
   - Many stroke rolls (5, 6, 7, 9, 13, 15, 17) are wrong
   - Paradiddle variations incorrectly identified
   - Flam patterns missing flam notation

4. **Name Mismatches**: 
   - 5 "Double Stroke" patterns use single stroke (R L R L) instead of double stroke (R R L L)

5. **Excessive Accents**: 
   - "Accent Pattern - Every Other" accents every note (should be every other)
   - "Flam Drag" accents every note

## Research Sources

- **PAS 40 International Drum Rudiments** (primary reference)
- Standard drumming pedagogy texts
- Common practice patterns for independence, coordination, speed
- Famous beats and fills (authentic transcriptions)

## Implementation Approach

### Phase 1: Categorization and Analysis

**File**: `scripts/analyze-presets.js` (new)

Create analysis script that:
- Groups presets by category
- Identifies duplicates
- Flags patterns missing required elements (flams, accents)
- Validates against known rudiment patterns
- Generates report of issues

**Output**: `docs/PRESET_ANALYSIS_REPORT.md`

### Phase 2: Rudiment Patterns Fix

**Categories**: beginner, intermediate, advanced (rudiments subcategory)

**Standard Rudiments to Verify**:
- Single Stroke Roll: `R L`
- Double Stroke Roll: `R R L L`
- Single Stroke Four: `R R R R L L L L`
- Five Stroke Roll: `R R L L R`
- Six Stroke Roll: `R R L L R L`
- Seven Stroke Roll: `R R L L R R L`
- Nine Stroke Roll: `R R L L R R L L R`
- Paradiddle: `R L R R L R L L`
- Double Paradiddle: `R L R L R R L R L R L L`
- Triple Paradiddle: `R L R L R L R R L R L R L R L L`
- Paradiddle-Diddle: `R L R R L L`
- Flam: `lR` or `rL` (grace note + main note)
- Flam Tap: `lR rL R L`
- Flam Accent: `lR rL R L` (with accents on main notes)
- Flam Paradiddle: `lR rL R R L R L L`
- Flam Paradiddle-Diddle: `lR rL R R L L`
- Single Drag Tap: `llR L` (two grace notes + main)
- Double Drag Tap: `llR llL`
- Single Ratamacue: `llR L R`
- Double Ratamacue: `llR llL R L`
- Triple Ratamacue: `lllR lllL R L`
- Swiss Army Triplet: `R L R`
- Pataflafla: `R L R L`

**File**: `scripts/fix-rudiment-presets.js` (new)

- Verify each rudiment against standard
- Fix sticking patterns
- Add flams where required (lR, rL notation)
- Add accents where musically appropriate
- Ensure correct subdivisions

### Phase 3: Speed Patterns Fix

**Categories**: speed

**Issues to Fix**:
- "Speed: Single Stroke Slow" vs "Speed: Single Stroke Moderate" - differentiate by tempo/BPM only, or add variation
- "Speed: Double Stroke Basic" - currently identical to single stroke, must be `R R L L`
- Ensure each speed pattern has unique characteristics

**File**: `scripts/fix-speed-presets.js` (new)

- Fix double stroke patterns to use `R R L L`
- Ensure single stroke patterns use `R L`
- Add appropriate subdivisions for speed building
- Verify BPM ranges are appropriate

### Phase 4: Independence Patterns Fix

**Categories**: independence

**Issues to Fix**:
- "Independence: Hand-Foot Basic 1" - remove unnecessary accents on every note
- Verify hand-foot coordination patterns are correct
- Ensure kick drum (K) placement is musically appropriate

**File**: `scripts/fix-independence-presets.js` (new)

- Review all hand-foot patterns
- Remove excessive accents
- Add accents only on strong beats where appropriate
- Verify kick drum voicing

### Phase 5: Coordination Patterns Fix

**Categories**: coordination

**File**: `scripts/fix-coordination-presets.js` (new)

- Verify coordination exercises
- Ensure sticking patterns support coordination goals
- Add accents where musically appropriate

### Phase 6: Grooves and Fills Fix

**Categories**: grooves, famous-beats, famous-fills

**File**: `scripts/fix-groove-presets.js` (new)

- Verify famous beats against authentic transcriptions
- Ensure fills are musically accurate
- Add appropriate accents
- Verify voicing (toms, cymbals, etc.)

### Phase 7: Technique Patterns Fix

**Categories**: technique

**File**: `scripts/fix-technique-presets.js` (new)

- Verify technique exercises
- Ensure patterns support stated technique goals
- Add accents where appropriate

### Phase 8: Warmup Patterns Fix

**Categories**: warmup

**File**: `scripts/fix-warmup-presets.js` (new)

- Verify warmup exercises
- Ensure appropriate difficulty progression
- Add accents where musically appropriate

### Phase 9: Advanced Patterns Fix

**Categories**: advanced

**File**: `scripts/fix-advanced-presets.js` (new)

- Verify complex patterns
- Ensure flams, drags, and advanced techniques are correctly notated
- Add accents where musically appropriate

### Phase 10: Accent System Implementation

**Musical Accent Guidelines**:
- **Downbeats**: Accent beat 1 (and sometimes beat 3 in 4/4)
- **Syncopation**: Accent off-beats for rhythmic interest
- **Rudiments**: Accent main notes in flams, not grace notes
- **Independence**: Accent hand patterns on strong beats, not every note
- **Grooves**: Accent backbeats (beats 2 and 4) typically
- **Fills**: Accent strong notes in fill patterns

**File**: `scripts/add-musical-accents.js` (new)

- Analyze each pattern for musically appropriate accent placement
- Add accents array to presets where appropriate
- Avoid accents on every note unless specifically a "full accent" exercise

### Phase 11: Duplicate Detection and Removal

**File**: `scripts/detect-duplicates.js` (new)

- Compare all patterns for exact duplicates
- Compare patterns with same name but different IDs
- Generate report of duplicates
- Either fix duplicates to be unique or remove redundant ones

### Phase 12: Validation and Testing

**File**: `scripts/validate-all-presets.js` (new)

Comprehensive validation:
- All sticking patterns match drum patterns (accounting for K)
- All rudiments match standard patterns
- All flam patterns have flam notation (lR, rL)
- All accents are musically appropriate
- No duplicate patterns
- Subdivisions are correct
- Time signatures are valid
- Phrase values sum correctly

**File**: `scripts/test-preset-playback.js` (new)

- Test each preset in the app
- Verify notation renders correctly
- Verify playback sounds correct
- Verify accents display correctly

## File Structure

```
scripts/
  analyze-presets.js          # Phase 1: Analysis
  fix-rudiment-presets.js     # Phase 2: Rudiments
  fix-speed-presets.js        # Phase 3: Speed
  fix-independence-presets.js # Phase 4: Independence
  fix-coordination-presets.js # Phase 5: Coordination
  fix-groove-presets.js       # Phase 6: Grooves/Fills
  fix-technique-presets.js    # Phase 7: Technique
  fix-warmup-presets.js       # Phase 8: Warmup
  fix-advanced-presets.js     # Phase 9: Advanced
  add-musical-accents.js      # Phase 10: Accents
  detect-duplicates.js        # Phase 11: Duplicates
  validate-all-presets.js     # Phase 12: Validation
  test-preset-playback.js     # Phase 12: Testing

docs/
  PRESET_REVIEW_AND_FIX_PLAN.md
  PRESET_ANALYSIS_REPORT.md
  RUDIMENT_REFERENCE.md
  ACCENT_GUIDELINES.md
  FIX_LOG.md
```

## Rudiment Reference Data

**File**: `lib/rudiments/standard-patterns.ts` (new)

TypeScript module with:
- All PAS 40 rudiments with correct sticking
- Flam notation guide
- Accent placement guidelines
- Subdivision recommendations

## Accent Guidelines

**File**: `docs/ACCENT_GUIDELINES.md` (new)

Detailed guidelines for when to add accents:
- **Always accent**: Downbeats in basic patterns, main notes in flams
- **Often accent**: Backbeats in grooves, strong beats in fills
- **Sometimes accent**: Syncopated patterns, off-beats for interest
- **Rarely accent**: Every note (only in specific "full accent" exercises)
- **Never accent**: Grace notes in flams/drags

## Implementation Order

1. **Phase 1**: Analyze all presets (identify all issues)
2. **Phase 2-9**: Fix by category (can be done in parallel after analysis)
3. **Phase 10**: Add accents systematically
4. **Phase 11**: Remove duplicates
5. **Phase 12**: Final validation and testing

## Quality Checklist

For each preset, verify:
- [ ] Sticking pattern is correct for the named pattern
- [ ] Drum pattern (voicing) matches sticking
- [ ] Subdivision is appropriate
- [ ] Time signature is correct
- [ ] Phrase values sum correctly
- [ ] Flams are notated (lR, rL) if pattern name includes "flam"
- [ ] Accents are musically appropriate (not on every note unless intentional)
- [ ] Pattern is unique (not duplicate of another)
- [ ] BPM is appropriate for difficulty
- [ ] Description accurately describes the pattern
- [ ] Tags are accurate

## Success Criteria

- All 212 presets reviewed
- All rudiments match PAS 40 standards
- All flam patterns have flam notation
- Accents added where musically appropriate (target: ~50-70% of presets should have accents)
- No duplicate patterns
- All patterns play correctly in the app
- All notation renders correctly

## Timeline Estimate

- Phase 1 (Analysis): 2-3 hours
- Phases 2-9 (Category fixes): 8-12 hours
- Phase 10 (Accents): 3-4 hours
- Phase 11 (Duplicates): 1-2 hours
- Phase 12 (Validation): 2-3 hours

**Total**: ~16-24 hours of focused work

## Notes

- Preserve existing preset IDs to avoid breaking user data
- Update version number in practice-presets.json after fixes
- Create backup before making changes
- Test each category fix before moving to next
- Document all changes in FIX_LOG.md

