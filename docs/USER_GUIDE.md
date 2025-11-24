# Drum Practice Generator - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Creating Patterns](#creating-patterns)
3. [Advanced Features](#advanced-features)
4. [Practice Modes](#practice-modes)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Exporting and Sharing](#exporting-and-sharing)
7. [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

### First Steps
1. **Add a Pattern**: Click the "Add Pattern" button to create your first drum pattern
2. **Set Time Signature**: Choose your time signature (e.g., 4/4, 3/4, 7/8)
3. **Choose Subdivision**: Select the note subdivision (4=quarter notes, 8=eighth notes, 16=sixteenth notes, etc.)
4. **Enter Voicing Pattern**: Type your drum pattern using drum notation (S=Snare, K=Kick, H=Hi-hat, F=Floor Tom, etc.)
5. **Enter Sticking Pattern**: Type your sticking pattern (R=Right, L=Left, K=Kick)

### Basic Pattern Notation

#### Drum Voices
- **S** - Snare drum
- **K** - Kick drum
- **H** - Hi-hat
- **F** - Floor tom
- **Ht** or **I** - High tom
- **Mt** or **M** - Mid tom
- **T** - Tom (maps to high tom)

#### Simultaneous Hits
Use `+` to indicate simultaneous hits:
- `S+K` - Snare and kick together
- `H+K` - Hi-hat and kick together

#### Rests
Use `-` to indicate a rest (no hit):
- `S - S -` - Snare on beats 1 and 3, rest on beats 2 and 4

#### Ghost Notes
Wrap a note in parentheses for ghost notes (softer hits):
- `(S)` - Ghost snare
- `S (S) S (S)` - Alternating regular and ghost snare hits

## Creating Patterns

### Standard Patterns
1. Enter your voicing pattern in the "Voicing Pattern" field
2. Enter your sticking pattern in the "Sticking Pattern" field
3. Adjust the subdivision to change note density
4. Set accents using the accent editor
5. Adjust the repeat count to play the pattern multiple times

### Advanced Per-Beat Subdivisions
Enable "Advanced Mode" to set different subdivisions for each beat:

1. Toggle "Advanced Mode" under the Subdivision section
2. Set subdivisions for each beat (e.g., Beat 1: 16th notes, Beat 2: 8th notes)
3. Enter voicing and sticking patterns for each beat
4. Use the randomize buttons to generate random per-beat patterns

### Pattern Presets
Browse and load from 175+ preset patterns:
1. Click "Browse Presets" in the toolbar
2. Filter by category (Beginner, Intermediate, Advanced, etc.)
3. Search for specific patterns
4. Click "Load" to add a pattern to your list

## Advanced Features

### Ornaments

#### Flams
Use lowercase `l` or `r` before a note for a flam:
- `lR` - Left-hand flam on right-hand note
- `rL` - Right-hand flam on left-hand note

#### Drags
Use two lowercase letters for a drag (ruff):
- `llR` - Drag on right-hand note
- `rrL` - Drag on left-hand note

#### Ruffs
Use three lowercase letters for a ruff:
- `lllR` - Ruff on right-hand note
- `rrrL` - Ruff on left-hand note

### Polyrhythms
Create polyrhythms where each hand plays a different rhythm:
1. Click "Add Polyrhythm" in the toolbar
2. Set the ratio (e.g., 4:3 means right hand plays 4 notes while left plays 3)
3. Choose display mode (Stacked or Two Staves)
4. Set click mode (Both Hands, Right Hand Only, Left Hand Only)

## Practice Modes

### MIDI Practice
Practice with a MIDI drum pad or keyboard:
1. Click "MIDI Practice" in the toolbar
2. Connect your MIDI device
3. Calibrate your device (optional)
4. Start playback and play along
5. View real-time accuracy and timing feedback

### Microphone Practice
Practice with audio input from a microphone:
1. Click "Microphone Practice" in the toolbar
2. Select your microphone device
3. Calibrate sensitivity (optional)
4. Start playback and play along
5. View real-time accuracy feedback

### Practice Statistics
Track your practice progress:
- Total practice time
- Number of sessions
- Current streak
- Average accuracy
- Average timing
- Daily practice charts
- Goal tracking

## Keyboard Shortcuts

- **Spacebar** - Play/Pause
- **Escape** - Stop playback
- **+/-** - Increase/Decrease BPM
- **Ctrl/Cmd + Z** - Undo
- **Ctrl/Cmd + Y** or **Ctrl/Cmd + Shift + Z** - Redo
- **Ctrl/Cmd + N** - Add new pattern
- **Ctrl/Cmd + Shift + N** - Generate random pattern
- **Ctrl/Cmd + R** - Randomize all patterns
- **?** - Show keyboard shortcuts

## Exporting and Sharing

### Export Options
1. **MIDI Export** - Export patterns as MIDI files
2. **SVG Export** - Export notation as SVG images
3. **PNG Export** - Export notation as PNG images
4. **PDF Export** - Export notation as PDF (print-friendly)
5. **Shareable URL** - Generate a URL to share patterns
6. **Export Collection** - Export all patterns as JSON
7. **Import Collection** - Import patterns from JSON

### Pattern Library
Save patterns to your personal library:
1. Click "Pattern Library" in the toolbar
2. Click "Save Current Patterns" to save all patterns
3. Search and filter saved patterns
4. Load patterns from your library
5. Share patterns with others

## Tips and Best Practices

### Pattern Creation
- Start simple and gradually increase complexity
- Use ghost notes to add dynamics and groove
- Experiment with different subdivisions
- Try per-beat subdivisions for complex patterns
- Use accents to emphasize important beats

### Practice Tips
- Start slow and gradually increase tempo
- Use the visual metronome to maintain steady timing
- Practice with both MIDI and microphone modes
- Track your progress with practice statistics
- Set practice goals to stay motivated

### Performance
- Patterns with many repeats may take longer to render
- Use the search feature to quickly find patterns
- Collapse pattern sections you're not editing
- Export patterns you want to keep

### Accessibility
- All interactive elements support keyboard navigation
- Use arrow keys to navigate between patterns
- Screen reader support is available for all features
- High contrast mode available in dark mode

## Troubleshooting

### Playback Issues
- Ensure your audio is not muted
- Check browser audio permissions
- Try refreshing the page if playback stops

### MIDI Issues
- Ensure your MIDI device is connected
- Check browser MIDI permissions
- Try recalibrating your device

### Rendering Issues
- Large patterns may take time to render
- Try reducing the number of repeats
- Clear browser cache if notation doesn't display

### Performance Issues
- Close other browser tabs
- Reduce the number of patterns
- Disable visual effects if needed

## Support

For issues, questions, or feature requests, please check the documentation or create an issue in the project repository.

