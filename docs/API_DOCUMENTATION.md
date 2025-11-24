# Drum Practice Generator - API Documentation

## Table of Contents
1. [State Management](#state-management)
2. [Utility Functions](#utility-functions)
3. [Components](#components)
4. [Hooks](#hooks)
5. [Types](#types)

## State Management

### Zustand Store (`store/useStore.ts`)

The application uses Zustand for global state management.

#### Pattern State
```typescript
patterns: Pattern[]
addPattern(pattern: Pattern): void
updatePattern(id: string, updates: Partial<Pattern>): void
removePattern(id: string): void
duplicatePattern(id: string): void
reorderPatterns(fromIndex: number, toIndex: number): void
```

#### Playback State
```typescript
isPlaying: boolean
bpm: number
playbackPosition: number | null
setIsPlaying(playing: boolean): void
setBPM(bpm: number): void
setPlaybackPosition(position: number | null): void
```

#### UI State
```typescript
darkMode: boolean
showGridLines: boolean
showMeasureNumbers: boolean
polyrhythmDisplayMode: 'stacked' | 'two-staves'
toggleDarkMode(): void
setShowGridLines(show: boolean): void
setShowMeasureNumbers(show: boolean): void
setPolyrhythmDisplayMode(mode: 'stacked' | 'two-staves'): void
```

## Utility Functions

### Pattern Utilities (`lib/utils/patternUtils.ts`)

#### `parseTokens(value: string | string[]): string[]`
Parses tokens from a string, handling space-separated and + notation.
```typescript
parseTokens('S K S K') // ['S', 'K', 'S', 'K']
parseTokens('S+K H') // ['S+K', 'H']
parseTokens('(S) S') // ['(S)', 'S'] (ghost notes)
```

#### `parseTimeSignature(value: string): [number, number]`
Parses a time signature string into numerator and denominator.
```typescript
parseTimeSignature('4/4') // [4, 4]
parseTimeSignature('3/4') // [3, 4]
parseTimeSignature('7/8') // [7, 8]
```

#### `calculateNotesPerBar(numerator: number, denominator: number, subdivision: number): number`
Calculates the number of notes per bar.
```typescript
calculateNotesPerBar(4, 4, 16) // 16
calculateNotesPerBar(3, 4, 8) // 6
```

#### `getNotesPerBarForPattern(pattern: Pattern): number`
Gets the number of notes per bar for a pattern, handling both standard and advanced modes.
```typescript
const pattern: Pattern = { /* ... */ };
getNotesPerBarForPattern(pattern) // 16
```

#### `calculateNotesPerBarFromPerBeatSubdivisions(subdivisions: number[]): { totalNotes: number, notesPerBeat: number[] }`
Calculates total notes and notes per beat from per-beat subdivisions.
```typescript
calculateNotesPerBarFromPerBeatSubdivisions([16, 8, 16, 8])
// { totalNotes: 12, notesPerBeat: [4, 2, 4, 2] }
```

#### `calculateNotePositionsFromPerBeatSubdivisions(subdivisions: number[]): number[]`
Calculates the beat position of each note when using per-beat subdivisions.
```typescript
calculateNotePositionsFromPerBeatSubdivisions([16, 8, 16, 8])
// [0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 3, 3]
```

#### `createDefaultPattern(): Pattern`
Creates a new default pattern with sensible defaults.
```typescript
const pattern = createDefaultPattern();
// Returns a Pattern with 4/4 time, 16th notes, basic voicing/sticking
```

#### `calculatePatternComplexity(pattern: Pattern): number`
Calculates a complexity score (0-100) for a pattern.
```typescript
const complexity = calculatePatternComplexity(pattern);
// Returns a number between 0 and 100
```

### Difficulty Utilities (`lib/utils/difficultyUtils.ts`)

#### `calculateDifficultyRating(pattern: Pattern): { score: number, level: 'beginner' | 'intermediate' | 'advanced' | 'expert' }`
Calculates difficulty rating for a pattern.
```typescript
const rating = calculateDifficultyRating(pattern);
// { score: 45, level: 'intermediate' }
```

#### `generatePracticeRecommendations(pattern: Pattern, stats: PracticeStats): Array<{ title: string, description: string }>`
Generates personalized practice recommendations.
```typescript
const recommendations = generatePracticeRecommendations(pattern, stats);
// Returns array of recommendation objects
```

### Export Utilities (`lib/utils/exportUtils.ts`)

#### `exportMIDI(patterns: Pattern[], bpm: number): Blob`
Exports patterns as a MIDI file.
```typescript
const midiBlob = exportMIDI(patterns, 120);
// Returns a Blob that can be downloaded
```

#### `exportSVG(element: HTMLElement): Blob`
Exports an SVG element as an SVG file.
```typescript
const svgBlob = exportSVG(staveElement);
// Returns a Blob that can be downloaded
```

#### `exportPNG(element: HTMLElement): Promise<Blob>`
Exports an element as a PNG image.
```typescript
const pngBlob = await exportPNG(staveElement);
// Returns a Promise<Blob> that can be downloaded
```

#### `exportPDF(): void`
Exports the current notation as a PDF using browser print functionality.
```typescript
exportPDF();
// Opens browser print dialog
```

#### `sharePatternURL(patterns: Pattern[]): string`
Generates a shareable URL for patterns.
```typescript
const url = sharePatternURL(patterns);
// Returns a base64-encoded URL
```

## Components

### Stave Component (`components/Stave/Stave.tsx`)

Renders musical notation using VexFlow.

#### Props
None (uses Zustand store for state)

#### Features
- Renders patterns with correct drum notation
- Supports polyrhythms
- Highlights notes during playback
- Supports ghost notes, flams, drags, ruffs
- Responsive layout

### PatternList Component (`components/PatternList/PatternList.tsx`)

Displays and manages patterns.

#### Features
- Search and filter patterns
- Virtual scrolling for large lists
- Drag-and-drop reordering
- Keyboard navigation

### PatternItem Component (`components/PatternList/PatternItem.tsx`)

Displays a single pattern with editing capabilities.

#### Props
```typescript
interface PatternItemProps {
  pattern: Pattern;
  index: number;
}
```

### Toolbar Component (`components/Toolbar/Toolbar.tsx`)

Main application toolbar with controls.

#### Features
- Playback controls
- Pattern management
- Export options
- Settings toggles

## Hooks

### usePlayback (`hooks/usePlayback.ts`)

Manages audio playback and scheduling.

#### Returns
```typescript
{
  startPlayback: () => void;
  stopPlayback: () => void;
  isPlaying: boolean;
  playbackPosition: number | null;
}
```

### useKeyboardShortcuts (`hooks/useKeyboardShortcuts.ts`)

Handles global keyboard shortcuts.

#### Shortcuts
- Spacebar: Play/Pause
- Escape: Stop
- +/-: Adjust BPM
- Ctrl/Cmd+Z: Undo
- Ctrl/Cmd+Y: Redo
- Ctrl/Cmd+N: New pattern
- Ctrl/Cmd+Shift+N: Random pattern
- Ctrl/Cmd+R: Randomize all

### useMIDIPractice (`hooks/useMIDIPractice.ts`)

Manages MIDI practice mode.

#### Returns
```typescript
{
  enabled: boolean;
  devices: MIDIDevice[];
  selectedDevice: MIDIDevice | null;
  actualHits: Hit[];
  expectedNotes: ExpectedNote[];
  accuracy: number;
  startPractice: () => void;
  stopPractice: () => void;
}
```

### useMicrophonePractice (`hooks/useMicrophonePractice.ts`)

Manages microphone practice mode.

#### Returns
```typescript
{
  enabled: boolean;
  devices: MediaDeviceInfo[];
  selectedDevice: MediaDeviceInfo | null;
  actualHits: Hit[];
  expectedNotes: ExpectedNote[];
  accuracy: number;
  startPractice: () => void;
  stopPractice: () => void;
}
```

## Types

### Pattern (`types/pattern.ts`)

```typescript
interface Pattern {
  id: string;
  timeSignature: string;
  subdivision: number;
  phrase: string;
  drumPattern: string;
  stickingPattern: string;
  bpm?: number;
  repeat?: number;
  _advancedMode?: boolean;
  _perBeatSubdivisions?: number[];
  _perBeatVoicing?: string[];
  _perBeatSticking?: string[];
  _presetAccents?: number[];
  _presetName?: string;
  _presetDescription?: string;
}
```

### PolyrhythmPattern (`types/polyrhythm.ts`)

```typescript
interface PolyrhythmPattern {
  id: string;
  timeSignature: string;
  ratio: string; // e.g., "4:3"
  rightHandPattern: string;
  leftHandPattern: string;
  repeat?: number;
}
```

### PracticeStats (`types/practice.ts`)

```typescript
interface PracticeStats {
  totalPracticeTime: number; // milliseconds
  totalSessions: number;
  currentStreak: number;
  averageAccuracy: number; // 0-100
  averageTiming: number; // 0-100
  sessions: PracticeSession[];
}
```

## Testing

### Running Tests
```bash
npm test              # Run tests
npm run test:ui       # Run tests with UI
npm run test:coverage  # Run tests with coverage
```

### Test Structure
Tests are located in `lib/utils/__tests__/` and use Vitest.

## Contributing

When adding new features:
1. Add types to appropriate type files
2. Add utility functions if needed
3. Update state management if needed
4. Create components following existing patterns
5. Add tests for new functionality
6. Update documentation

