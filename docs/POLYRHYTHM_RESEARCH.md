# Polyrhythm Builder - Research & Design Document

## What are Polyrhythms?

Polyrhythms are two or more rhythms played simultaneously that have different subdivisions. They are fundamental to drumming independence and advanced techniques.

### Common Polyrhythms

1. **3 against 2 (3:2)**
   - Most common polyrhythm
   - Three notes in one hand against two notes in the other
   - Aligns over 2 beats (or 1 bar of 4/4)

2. **4 against 3 (4:3)**
   - Four notes against three notes
   - Aligns over 3 beats

3. **5 against 4 (5:4)**
   - Five notes against four notes
   - Aligns over 4 beats

4. **5 against 3 (5:3)**
   - Five notes against three notes
   - Aligns over 3 beats

5. **7 against 4 (7:4)**
   - Seven notes against four notes
   - Aligns over 4 beats

## Notation Considerations

### Visual Representation Options

#### Option 1: Separate Staff Lines
- **Right hand rhythm**: Upper staff line (e.g., snare position)
- **Left hand rhythm**: Lower staff line (e.g., kick position)
- **Advantages**: Clear separation, easy to read each rhythm independently
- **Disadvantages**: Takes more vertical space, might be harder to see alignment

#### Option 2: Stacked Notes (Same Position)
- Both rhythms shown at same vertical position
- Different note heads or colors to distinguish
- **Advantages**: Shows alignment clearly, compact
- **Disadvantages**: Can be cluttered, harder to read individual rhythms

#### Option 3: Two Separate Staves
- Full stave for each rhythm, stacked vertically
- **Advantages**: Maximum clarity for complex patterns
- **Disadvantages**: Takes a lot of space

#### Option 4: Grid/Time-based Visualization
- Horizontal timeline with markers for each rhythm
- **Advantages**: Very clear alignment, great for learning
- **Disadvantages**: Not standard musical notation

### Recommended Approach: Hybrid
- Use **separate staff positions** (different drum voices) for primary display
- Add **visual alignment indicators** (vertical lines or highlights)
- Optionally show a **timeline/grid view** for complex polyrhythms

## User Interface Options

### Core Features

1. **Rhythm Selection**
   - Dropdown or input for rhythm ratio (e.g., "3 against 2", "4 against 3")
   - Or custom input for any X against Y

2. **Limb/Hand Assignment**
   - Which hand/limb plays which rhythm
   - Options: Right Hand, Left Hand, Right Foot, Left Foot
   - Could also be assigned to drum voices (Snare, Kick, Hi-hat, etc.)

3. **Time Base**
   - How long the polyrhythm cycle lasts
   - Options: 1 beat, 2 beats, 1 bar (4 beats), 2 bars, etc.

4. **Pattern Variation**
   - Same rhythm but different sticking/voicing
   - Different accent patterns within each rhythm

5. **Visualization**
   - Main stave notation
   - Timeline/grid view showing alignment
   - Circle diagram (common polyrhythm visualization)
   - Count-in/metronome highlighting

### Advanced Features

1. **Multiple Layers**
   - More than 2 rhythms (e.g., hands and feet simultaneously)

2. **Accent Patterns**
   - Accents within each rhythm layer

3. **Subdivision Options**
   - Control note values (eighth notes, triplets, sixteenth notes)

4. **Tempo Control**
   - Slow down for practice
   - Tap tempo

5. **Practice Modes**
   - Loop one hand, play other
   - Mute one rhythm while practicing

## Technical Implementation Considerations

### Pattern Data Structure

```typescript
interface PolyrhythmPattern {
  ratio: { numerator: number; denominator: number }; // e.g., 3:2
  rightRhythm: {
    notes: number[]; // Indices where notes occur in the cycle
    limb: 'right-hand' | 'left-hand' | 'right-foot' | 'left-foot';
    voice: 'snare' | 'kick' | 'hi-hat' | 'tom';
    accents?: number[];
  };
  leftRhythm: {
    notes: number[]; // Indices where notes occur in the cycle
    limb: 'right-hand' | 'left-hand' | 'right-foot' | 'left-foot';
    voice: 'snare' | 'kick' | 'hi-hat' | 'tom';
    accents?: number[];
  };
  cycleLength: number; // Total subdivisions for one complete cycle
  timeSignature: string; // e.g., "4/4"
  subdivision: number; // Base subdivision (e.g., 16 for sixteenth notes)
}
```

### Rendering on Stave

The existing pattern rendering uses:
- Different vertical positions for different drum voices (S, K, T, F, H)
- Time-based positioning within bars

For polyrhythms:
- Need to calculate exact timings for each note
- Use different vertical positions or colors to distinguish rhythms
- Show alignment clearly

### Calculation Example: 3 against 2

If we're in a 4/4 time signature with 16th note subdivision:
- Cycle length = 2 beats = 8 sixteenth notes
- Right hand: 3 notes evenly spaced over 8 subdivisions = notes at indices [0, 2.67, 5.33] ≈ [0, 3, 5]
- Left hand: 2 notes evenly spaced over 8 subdivisions = notes at indices [0, 4]

More precisely:
- Right: 0/3, 1/3, 2/3 of cycle = 0, 2.67, 5.33 → round to [0, 3, 5]
- Left: 0/2, 1/2 of cycle = 0, 4 → [0, 4]

## Questions to Answer

1. **What's the minimum viable feature set?**
   - Probably: Select ratio (3:2, 4:3, 5:4), assign hands, generate pattern, display on stave

2. **How should we handle different subdivisions?**
   - Should we always use smallest common denominator?
   - Or let user choose base subdivision?

3. **Should polyrhythms be a separate pattern type, or a variant of regular patterns?**
   - Separate: Clearer separation, dedicated UI
   - Variant: More flexible, can be mixed with regular patterns

4. **How complex should the builder be initially?**
   - Simple: Just select ratio and generate
   - Complex: Full control over every aspect

## Recommended Initial Implementation

1. **Simple Polyrhythm Builder Modal**
   - Dropdown to select common ratios (3:2, 4:3, 5:4, 5:3)
   - Option to input custom ratio
   - Assign right/left hand/limb
   - Generate pattern button

2. **Pattern Generation**
   - Calculate note positions for the cycle
   - Create pattern that can be displayed on stave
   - Use existing pattern structure with `_polyrhythmRightNotes` and `_polyrhythmLeftNotes`

3. **Stave Rendering**
   - Show both rhythms on different staff positions (e.g., snare for one, kick for other)
   - Add visual indicators for alignment (vertical lines or highlights)
   - Ensure notes align correctly in time

4. **Playback**
   - Use existing playback system
   - Ensure both rhythms play correctly aligned

## Future Enhancements

1. **Visualization Tools**
   - Circle diagram
   - Timeline/grid view
   - Alignment highlights

2. **Practice Features**
   - Loop individual rhythms
   - Mute one rhythm
   - Slow practice mode

3. **Advanced Options**
   - Multiple layers (hands + feet)
   - Accent patterns within rhythms
   - Different time signatures

