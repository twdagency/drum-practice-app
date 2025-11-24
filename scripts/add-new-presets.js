/**
 * Script to add new pattern presets showcasing new features
 * - Ghost notes
 * - Mixed subdivisions (per-beat)
 * - More time signatures
 * - More groove patterns
 */

const fs = require('fs');
const path = require('path');

const presetsFile = path.join(__dirname, '../public/practice-presets.json');
const data = JSON.parse(fs.readFileSync(presetsFile, 'utf8'));

const newPresets = [
  // Ghost Note Patterns
  {
    id: "beginner-ghost-notes-basic",
    name: "Ghost Notes: Basic Pattern",
    category: "beginner",
    subcategory: "technique",
    tags: ["ghost-notes", "dynamics", "basic"],
    description: "Basic pattern with ghost notes - practice soft hits",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "4 4 4 4",
    drumPattern: "S (S) S (S) S (S) S (S)",
    stickingPattern: "R L R L",
    bpm: 80,
    repeat: 4,
    difficulty: 2
  },
  {
    id: "intermediate-ghost-notes-groove",
    name: "Ghost Notes: Groove Pattern",
    category: "intermediate",
    subcategory: "grooves",
    tags: ["ghost-notes", "groove", "funk"],
    description: "Funk groove with ghost notes on snare",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "4 4 4 4",
    drumPattern: "K (S) K S (S) K (S) K S",
    stickingPattern: "K R L R",
    bpm: 90,
    repeat: 4,
    difficulty: 4
  },
  {
    id: "intermediate-ghost-notes-advanced",
    name: "Ghost Notes: Advanced Pattern",
    category: "intermediate",
    subcategory: "technique",
    tags: ["ghost-notes", "dynamics", "advanced"],
    description: "Advanced ghost note pattern with accents",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "4 4 4 4",
    drumPattern: "S (S) (S) S (S) S (S) (S) S",
    stickingPattern: "R L R L",
    bpm: 100,
    repeat: 4,
    difficulty: 5
  },
  
  // Mixed Subdivision Patterns (Per-Beat)
  {
    id: "intermediate-mixed-subdivision-1",
    name: "Mixed Subdivision: 16th-8th Pattern",
    category: "intermediate",
    subcategory: "subdivisions",
    tags: ["mixed-subdivision", "per-beat", "subdivisions"],
    description: "Pattern with 16th notes on beat 1, 8th notes on beats 2-4",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "4 2 2 2",
    drumPattern: "S S S S S S S S",
    stickingPattern: "R L R L",
    bpm: 85,
    repeat: 4,
    difficulty: 4,
    _advancedMode: true,
    _perBeatSubdivisions: [16, 8, 8, 8],
    _perBeatVoicing: ["S S S S", "S S", "S S", "S S"],
    _perBeatSticking: ["R L R L", "R L", "R L", "R L"]
  },
  {
    id: "intermediate-mixed-subdivision-2",
    name: "Mixed Subdivision: Quarter-16th Pattern",
    category: "intermediate",
    subcategory: "subdivisions",
    tags: ["mixed-subdivision", "per-beat", "subdivisions"],
    description: "Pattern with quarter notes on beats 1-2, 16th notes on beats 3-4",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "1 1 4 4",
    drumPattern: "S S S S S S S S",
    stickingPattern: "R L R L R L R L",
    bpm: 80,
    repeat: 4,
    difficulty: 5,
    _advancedMode: true,
    _perBeatSubdivisions: [4, 4, 16, 16],
    _perBeatVoicing: ["S", "S", "S S S S", "S S S S"],
    _perBeatSticking: ["R", "L", "R L R L", "R L R L"]
  },
  {
    id: "advanced-mixed-subdivision-complex",
    name: "Mixed Subdivision: Complex Pattern",
    category: "advanced",
    subcategory: "subdivisions",
    tags: ["mixed-subdivision", "per-beat", "complex"],
    description: "Complex pattern with varying subdivisions per beat",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "4 8 2 2",
    drumPattern: "S S S S S S S S S S S S",
    stickingPattern: "R L R L R L R L R L R L",
    bpm: 90,
    repeat: 4,
    difficulty: 7,
    _advancedMode: true,
    _perBeatSubdivisions: [16, 8, 8, 8],
    _perBeatVoicing: ["S S S S", "S S S S", "S S", "S S"],
    _perBeatSticking: ["R L R L", "R L R L", "R L", "R L"]
  },
  
  // Time Signature Variations
  {
    id: "intermediate-3-4-time",
    name: "3/4 Time: Basic Pattern",
    category: "intermediate",
    subcategory: "grooves",
    tags: ["3-4", "waltz", "time-signature"],
    description: "Basic pattern in 3/4 time (waltz feel)",
    timeSignature: "3/4",
    subdivision: 8,
    phrase: "2 2 2",
    drumPattern: "K S K S K S",
    stickingPattern: "K R K L K R",
    bpm: 100,
    repeat: 4,
    difficulty: 3
  },
  {
    id: "intermediate-5-4-time",
    name: "5/4 Time: Basic Pattern",
    category: "intermediate",
    subcategory: "grooves",
    tags: ["5-4", "odd-time", "time-signature"],
    description: "Basic pattern in 5/4 time (odd time signature)",
    timeSignature: "5/4",
    subdivision: 8,
    phrase: "2 2 2 2 2",
    drumPattern: "K S K S K S K S K S",
    stickingPattern: "K R K L K R K L K R",
    bpm: 90,
    repeat: 4,
    difficulty: 5
  },
  {
    id: "advanced-7-8-time",
    name: "7/8 Time: Basic Pattern",
    category: "advanced",
    subcategory: "grooves",
    tags: ["7-8", "odd-time", "time-signature"],
    description: "Basic pattern in 7/8 time (odd time signature)",
    timeSignature: "7/8",
    subdivision: 8,
    phrase: "2 2 2 1",
    drumPattern: "K S K S K S S",
    stickingPattern: "K R K L K R L",
    bpm: 100,
    repeat: 4,
    difficulty: 6
  },
  
  // More Groove Patterns with Ghost Notes
  {
    id: "intermediate-funk-ghost-notes",
    name: "Funk Groove: Ghost Notes",
    category: "intermediate",
    subcategory: "funk",
    tags: ["funk", "ghost-notes", "groove"],
    description: "Classic funk groove with ghost notes",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "4 4 4 4",
    drumPattern: "K (S) K (S) K S (S) K (S)",
    stickingPattern: "K R L R",
    bpm: 95,
    repeat: 4,
    difficulty: 5
  },
  {
    id: "intermediate-rock-ghost-notes",
    name: "Rock Groove: Ghost Notes",
    category: "intermediate",
    subcategory: "rock",
    tags: ["rock", "ghost-notes", "groove"],
    description: "Rock groove with ghost notes for dynamics",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "4 4 4 4",
    drumPattern: "K (S) (S) S K (S) (S) S",
    stickingPattern: "K R L R",
    bpm: 100,
    repeat: 4,
    difficulty: 4
  },
  
  // More Flam/Drag/Ruff Patterns
  {
    id: "intermediate-flam-paradiddle-diddle",
    name: "Flam Paradiddle-Diddle",
    category: "intermediate",
    subcategory: "rudiments",
    tags: ["flam", "paradiddle-diddle", "rudiment"],
    description: "Flam combined with paradiddle-diddle",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "4 4 4 4",
    drumPattern: "S S S S S S S S",
    stickingPattern: "lR L R L R R lL R L R L L",
    bpm: 85,
    repeat: 4,
    difficulty: 6
  },
  {
    id: "advanced-drag-paradiddle",
    name: "Drag Paradiddle",
    category: "advanced",
    subcategory: "rudiments",
    tags: ["drag", "paradiddle", "rudiment"],
    description: "Drag (ruff) combined with paradiddle",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "4 4 4 4",
    drumPattern: "S S S S S S S S",
    stickingPattern: "llR L R R L R L L",
    bpm: 80,
    repeat: 4,
    difficulty: 7
  },
  {
    id: "advanced-ruff-paradiddle",
    name: "Ruff Paradiddle",
    category: "advanced",
    subcategory: "rudiments",
    tags: ["ruff", "paradiddle", "rudiment"],
    description: "Ruff (three grace notes) combined with paradiddle",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "4 4 4 4",
    drumPattern: "S S S S S S S S",
    stickingPattern: "lllR L R R L R L L",
    bpm: 75,
    repeat: 4,
    difficulty: 8
  },
  
  // Independence Patterns with Ghost Notes
  {
    id: "intermediate-independence-ghost-notes",
    name: "Independence: Ghost Notes",
    category: "intermediate",
    subcategory: "coordination",
    tags: ["independence", "ghost-notes", "coordination"],
    description: "Independence pattern incorporating ghost notes",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "4 4 4 4",
    drumPattern: "H (S) K H (S) K H (S) K H (S) K",
    stickingPattern: "R L K",
    bpm: 85,
    repeat: 4,
    difficulty: 5
  },
  
  // Warm-up Patterns
  {
    id: "warmup-ghost-notes",
    name: "Warm-up: Ghost Notes",
    category: "warmup",
    subcategory: "technique",
    tags: ["warmup", "ghost-notes", "dynamics"],
    description: "Warm-up pattern focusing on ghost note control",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "4 4 4 4",
    drumPattern: "(S) (S) (S) (S) (S) (S) (S) (S)",
    stickingPattern: "R L R L",
    bpm: 70,
    repeat: 4,
    difficulty: 2
  },
  {
    id: "warmup-mixed-subdivision",
    name: "Warm-up: Mixed Subdivision",
    category: "warmup",
    subcategory: "subdivisions",
    tags: ["warmup", "mixed-subdivision", "per-beat"],
    description: "Warm-up with mixed subdivisions to develop timing",
    timeSignature: "4/4",
    subdivision: 16,
    phrase: "4 8 4 8",
    drumPattern: "S S S S S S S S S S S S",
    stickingPattern: "R L R L R L R L R L R L",
    bpm: 75,
    repeat: 4,
    difficulty: 3,
    _advancedMode: true,
    _perBeatSubdivisions: [16, 8, 16, 8],
    _perBeatVoicing: ["S S S S", "S S", "S S S S", "S S"],
    _perBeatSticking: ["R L R L", "R L", "R L R L", "R L"]
  }
];

// Check for duplicates and add new presets
const existingIds = new Set(data.presets.map(p => p.id));
const presetsToAdd = newPresets.filter(p => !existingIds.has(p.id));

if (presetsToAdd.length > 0) {
  data.presets.push(...presetsToAdd);
  data.presets.sort((a, b) => {
    // Sort by category, then difficulty
    const categoryOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4, warmup: 0, independence: 2, coordination: 2, grooves: 2, technique: 2, speed: 3 };
    const catDiff = (categoryOrder[a.category] || 5) - (categoryOrder[b.category] || 5);
    if (catDiff !== 0) return catDiff;
    return (a.difficulty || 5) - (b.difficulty || 5);
  });
  
  fs.writeFileSync(presetsFile, JSON.stringify(data, null, 2));
  console.log(`Added ${presetsToAdd.length} new presets to practice-presets.json`);
  console.log(`Total presets: ${data.presets.length}`);
} else {
  console.log('No new presets to add (all already exist)');
}

