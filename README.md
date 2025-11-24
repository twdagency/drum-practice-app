# Drum Practice Generator

A comprehensive web application for creating, practicing, and sharing drum patterns with musical notation, MIDI support, and real-time practice feedback.

## Features

- 🥁 **Pattern Creation**: Create drum patterns with voicing, sticking, accents, and more
- 🎵 **Musical Notation**: Professional notation rendering using VexFlow
- 🎹 **MIDI Support**: Practice with MIDI drum pads and keyboards
- 🎤 **Microphone Practice**: Practice with audio input from microphones
- 📊 **Practice Statistics**: Track your progress with detailed statistics
- 🎯 **Difficulty Ratings**: Automatic difficulty calculation and recommendations
- 📚 **175+ Presets**: Browse and load from a library of preset patterns
- 🔄 **Polyrhythms**: Create and practice complex polyrhythmic patterns
- 👻 **Ghost Notes**: Add dynamics with ghost note notation
- 🎨 **Ornaments**: Support for flams, drags, and ruffs
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- ⌨️ **Keyboard Shortcuts**: Efficient keyboard navigation
- 📤 **Export Options**: Export as MIDI, SVG, PNG, PDF, or shareable URLs

## Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or yarn

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

Build for production:

```bash
npm run build
npm start
```

### Testing

Run tests:

```bash
npm test              # Run tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage
```

## Documentation

- **[User Guide](docs/USER_GUIDE.md)** - Complete user documentation
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Developer API reference
- **[Polyrhythm Documentation](docs/POLYRHYTHM_IMPLEMENTATION_SUMMARY.md)** - Polyrhythm implementation details

## Project Structure

```
drum-practice-app/
├── app/                    # Next.js App Router
├── components/             # React components
│   ├── PatternList/       # Pattern management components
│   ├── PolyrhythmList/     # Polyrhythm components
│   ├── PracticeMode/       # Practice mode components
│   ├── Stave/              # Musical notation rendering
│   ├── Toolbar/            # Main toolbar
│   └── shared/             # Shared UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
│   └── utils/              # Utility functions
│       └── __tests__/      # Unit tests
├── store/                  # Zustand state management
├── types/                  # TypeScript type definitions
├── docs/                   # Documentation
└── public/                 # Static assets
    └── practice-presets.json # Pattern presets
```

## Key Technologies

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **VexFlow** - Musical notation rendering
- **Vitest** - Testing framework
- **Tailwind CSS** - Styling

## Features in Detail

### Pattern Creation
- Standard and advanced (per-beat) subdivision modes
- Ghost notes, flams, drags, and ruffs
- Accent patterns
- Custom time signatures
- Pattern repeats

### Practice Modes
- **MIDI Practice**: Real-time feedback with MIDI devices
- **Microphone Practice**: Audio input analysis
- **Visual Metronome**: Animated metronome with beat indicators
- **Practice Statistics**: Track accuracy, timing, and progress

### Export and Sharing
- MIDI export
- SVG/PNG image export
- PDF export (print-friendly)
- Shareable URLs
- Pattern library (local storage)

## Contributing

See [API Documentation](docs/API_DOCUMENTATION.md) for developer guidelines.

## License

[Add your license here]

