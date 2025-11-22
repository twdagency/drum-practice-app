# React Migration Progress

## Current Status: Phase 4 - Practice Modes (Ready to Start)

### ✅ Completed

#### Phase 1: Project Setup
- [x] Next.js 14 project initialized with TypeScript
- [x] Tailwind CSS configured
- [x] Zustand store structure defined
- [x] Project structure created
- [x] Static assets copied

#### Phase 2: State Management and Types
- [x] TypeScript types defined (`types/pattern.ts`)
- [x] Zustand store slices created:
  - [x] Pattern slice (with undo/redo)
  - [x] Playback slice
  - [x] UI slice
  - [x] Practice modes slices (MIDI, Microphone)
- [x] Utility functions extracted (`lib/utils/patternUtils.ts`, `lib/utils/randomSets.ts`)

#### Phase 3: Core UI Components
- [x] **Toolbar Component**
  - [x] ToolbarButton component
  - [x] ToolbarDropdown component
  - [x] ToolbarGroup component
  - [x] ToolbarDivider component
  - [x] Main Toolbar component with all groups
  - [x] Integrated with Zustand store

- [x] **PatternList Component**
  - [x] PatternList container
  - [x] PatternItem component
  - [x] PatternFields component (all input fields)
  - [x] AccentEditor component
  - [x] Drag-and-drop functionality
  - [x] Real-time validation
  - [x] Randomize functions for all fields
  - [x] Pattern summary moved below header

- [x] **Stave Component**
  - [x] VexFlow integration
  - [x] Dynamic VexFlow loading (npm package)
  - [x] Multi-pattern rendering
  - [x] Note positioning (standard drum notation)
  - [x] Accents rendering
  - [x] Sticking pattern annotations
  - [x] Time signature display
  - [x] Beams for subdivisions
  - [x] Dark mode support
  - [x] Responsive width
  - [x] Horizontal scroll prevention

#### Recent Fixes
- [x] VexFlow loading from npm package (instead of CDN)
- [x] Accent recalculation when phrase changes
- [x] Sticking pattern repetition for all notes
- [x] Annotation positioning below stave (CSS transform)
- [x] Pattern summary moved below header
- [x] Toggle switch layout improvements
- [x] Pattern fields layout improvements
- [x] Horizontal scroll prevention in music notation
- [x] Visual metronome made draggable with close button
- [x] Fixed sticking letter highlighting to properly clear fill attribute
- [x] Fixed visual metronome z-index to appear above toolbar
- [x] Fixed visual metronome dragging after reopening (position persistence with localStorage)

#### Phase 3: Playback System (Newly Completed)
- [x] **Audio Loading System**
  - [x] Audio loader utility (`lib/audio/audioLoader.ts`)
  - [x] Audio buffer loading from WAV files
  - [x] AudioContext management and resumption
- [x] **Playback Hooks**
  - [x] `useAudioLoader` hook for loading audio on mount
  - [x] `usePlayback` hook with metronome timing
  - [x] Drum sound playback synchronized with patterns
  - [x] Count-in functionality (4 beats before start)
  - [x] Loop handling (multiple loop support)
  - [x] Slow motion playback support
  - [x] Backwards playback support
  - [x] Measure loop range support
  - [x] Metronome click sounds (oscillator-based)
  - [x] Playback cancellation on stop

### 🚧 In Progress / Known Issues

- [ ] Pattern fields layout could be further optimized

### 📋 Next Steps

#### Phase 4: Practice Modes (Completed ✅)
- [x] **MIDI Practice Mode**
  - [x] MIDI device detection and selection (`useMIDIDevices` hook)
  - [x] MIDI practice logic (`useMIDIPractice` hook)
  - [x] MIDI calibration tool with visual feedback
  - [x] Real-time accuracy tracking and stats display
  - [x] Visual feedback (color coding, timing measurements)
  - [x] Settings persistence (device, tolerance, latency)
  - [x] Toolbar integration with practice stats
- [x] **Microphone Practice Mode**
  - [x] Microphone device detection and selection (`useMicrophoneDevices` hook)
  - [x] Microphone practice logic (`useMicrophonePractice` hook)
  - [x] Microphone calibration tool with live audio level feedback
  - [x] Real-time accuracy tracking and stats display
  - [x] Visual feedback (color coding, timing measurements)
  - [x] Settings persistence (device, sensitivity, threshold, latency)
  - [x] Toolbar integration with practice stats

#### Phase 5: Advanced Features
- [x] **Presets and Library** (Completed ✅)
  - [x] Preset browser modal/component
  - [x] Load preset patterns from JSON
  - [x] Preset categories and filtering
  - [x] Combine presets functionality
  - [x] Save custom patterns as presets
- [x] Pattern generation hooks
  - [x] Generate random pattern button
  - [x] Randomize all patterns button
- [x] Learning paths
  - [x] Learning path types and interfaces
  - [x] Progress tracking with localStorage
  - [x] Learning path modal component
  - [x] Default learning paths based on presets
  - [x] Path navigation and step loading
- [x] Polyrhythm builder
  - [x] PolyrhythmPattern type (separate from regular patterns)
  - [x] Polyrhythm calculation utilities (note positions, cycle length)
  - [x] PolyrhythmBuilder modal with ratio selection and hand assignment
  - [x] PolyrhythmList and PolyrhythmPatternItem components
  - [x] Stave rendering for polyrhythms (separate positions mode)
  - [x] Playback support for polyrhythms
  - [x] Learning exercise mode (right hand only → left hand only → together with loop controls)
  - [x] UI settings for polyrhythm display preferences

#### Phase 6: Backend Integration
- [ ] API routes setup
- [ ] User authentication
- [ ] Pattern saving/loading
- [ ] Collections
- [ ] Progress tracking

### 📝 Notes

- VexFlow is loaded via npm package (`vexflow@4.2.2`) using dynamic import
- Pattern accents automatically recalculate from phrase when phrase changes
- Sticking patterns repeat if shorter than total notes
- Annotations are positioned below stave using CSS transform
- Pattern summary (4/4 16th 444 SSS) is displayed below the header
- Toggle switches have proper spacing with min-width on labels
- Audio buffers are loaded on app mount via `useAudioLoader` hook
- Playback uses setTimeout for precise timing (Web Audio API scheduling)
- Metronome clicks are generated using oscillators (no audio file needed)
- Playback automatically stops when all loops complete or when stopped manually

### 🔧 Technical Details

**VexFlow Loading:**
- Uses dynamic import in `VexFlowLoader.tsx`
- Exposes as `window.VF` and `window.Vex.Flow` for compatibility
- Version: 4.2.2

**Note Positions (Standard Drum Notation):**
- Snare (S): `c/5`
- Kick (K): `f/4`
- Tom (T): `e/5`
- Floor (F): `a/4`
- Hi-hat (H): `g/5/x`

**State Management:**
- Zustand store with slices for patterns, playback, UI, and practice modes
- Undo/redo functionality implemented
- History size: 50 entries

