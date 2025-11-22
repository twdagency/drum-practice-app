# Drum Practice Generator - React App

This is the React/Next.js version of the Drum Practice Generator, migrated from the WordPress plugin.

## Getting Started

### Prerequisites
- Node.js 18.x or higher
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

## Project Structure

```
drum-practice-app/
├── app/              # Next.js App Router
├── components/       # React components
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries
├── store/           # Zustand state management
├── types/           # TypeScript type definitions
└── public/          # Static assets
```

## Migration Status

**Current Phase: Phase 3 - Core UI Components (In Progress)**

### ✅ Completed
- Phase 1: Project Setup
- Phase 2: State Management and Types
- Phase 3: Core UI Components (Toolbar, PatternList, Stave)

### Recent Accomplishments
- VexFlow integration with npm package
- Pattern rendering with correct drum notation positions
- Accent recalculation when phrase changes
- Sticking pattern repetition
- Annotation positioning below stave
- Pattern summary moved below header
- Toggle switch layout improvements
- Horizontal scroll prevention
- Pattern fields layout improvements

See `MIGRATION_PROGRESS.md` for detailed progress and next steps.

