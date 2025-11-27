/**
 * Script to fix remaining rudiment sticking issues
 * Handles special cases where rudiments don't fit evenly into subdivisions
 */

const fs = require('fs');
const path = require('path');

// Load presets
const presetsPath = path.join(__dirname, '../public/practice-presets.json');
const presetsData = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));

// Helper functions
function parseTokens(str) {
  if (!str) return [];
  return str.split(/\s+/).filter(t => t.length > 0);
}

function formatList(list) {
  return list.join(' ');
}

function calculateNotesPerBar(timeSignature, subdivision) {
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  const beatValue = denominator;
  const notesPerBeat = subdivision / beatValue;
  return numerator * notesPerBeat;
}

function expandPattern(pattern, targetLength) {
  const tokens = parseTokens(pattern);
  if (tokens.length === 0) return pattern;
  if (tokens.length === targetLength) return pattern;
  
  const expanded = [];
  for (let i = 0; i < targetLength; i++) {
    expanded.push(tokens[i % tokens.length]);
  }
  return formatList(expanded);
}

// Specific fixes for problematic presets
const specificFixes = {
  'beginner-quarter-paradiddle': {
    // Quarter notes - paradiddle is 8 notes, but we only have 4 notes per bar
    // Use first 4 notes of paradiddle: R L R R
    sticking: 'R L R R'
  },
  'beginner-five-stroke-roll': {
    // Five stroke roll: R R L L R (5 notes)
    // For 16 notes, repeat: R R L L R R L L R R L L R R L L R (17 notes - close enough, trim last)
    sticking: 'R R L L R R L L R R L L R R L L'
  },
  'beginner-six-stroke-roll': {
    // Six stroke roll: R R L L R L (6 notes)
    // For 16 notes: R R L L R L R R L L R L R R L L (16 notes - perfect!)
    sticking: 'R R L L R L R R L L R L R R L L'
  },
  'beginner-seven-stroke-roll': {
    // Seven stroke roll: R R L L R R L (7 notes)
    // For 16 notes: R R L L R R L R R L L R R L R (15 notes - add one more)
    sticking: 'R R L L R R L R R L L R R L R R'
  },
  'beginner-nine-stroke-roll': {
    // Nine stroke roll: R R L L R R L L R (9 notes)
    // For 16 notes: R R L L R R L L R R L L R R L L (16 notes - perfect!)
    sticking: 'R R L L R R L L R R L L R R L L'
  },
  'beginner-triplet-paradiddle': {
    // Triplet paradiddle - subdivision 12, paradiddle is 8 notes
    // For 12 notes: R L R R L R L L R L R R (12 notes - perfect!)
    sticking: 'R L R R L R L L R L R R'
  },
  'intermediate-paradiddle-diddle': {
    // Paradiddle-diddle: R L R R L L (6 notes)
    // For 16 notes: R L R R L L R L R R L L R L R R (16 notes - perfect!)
    sticking: 'R L R R L L R L R R L L R L R R'
  },
  'intermediate-double-paradiddle': {
    // Double paradiddle: R L R L R R L R L R L L (12 notes)
    // For 16 notes: R L R L R R L R L R L L R L R L (16 notes - perfect!)
    sticking: 'R L R L R R L R L R L L R L R L'
  },
  'rudiment-ten-stroke-roll': {
    // Ten stroke roll: R R L L R R L L R L (10 notes)
    // For 16 notes: R R L L R R L L R L R R L L R R (16 notes - perfect!)
    sticking: 'R R L L R R L L R L R R L L R R'
  },
  'rudiment-eleven-stroke-roll': {
    // Eleven stroke roll: R R L L R R L L R R L (11 notes)
    // For 16 notes: R R L L R R L L R R L R R L L R (16 notes - perfect!)
    sticking: 'R R L L R R L L R R L R R L L R'
  },
  'intermediate-triple-paradiddle': {
    // Triple paradiddle: R L R L R L R R L R L R L R L L (16 notes)
    // Perfect fit!
    sticking: 'R L R L R L R R L R L R L R L L'
  },
  'intermediate-flam-paradiddle': {
    // Flam paradiddle: lR rL R R L R L L (8 notes with flams)
    // For 16 notes: lR rL R R L R L L lR rL R R L R L L (16 notes - perfect!)
    sticking: 'lR rL R R L R L L lR rL R R L R L L'
  },
  'intermediate-single-ratamacue': {
    // Single ratamacue: llR L R (3 notes)
    // For 16 notes: llR L R llR L R llR L R llR L R llR L (15 notes - add one)
    sticking: 'llR L R llR L R llR L R llR L R llR L R'
  },
  'rudiment-thirteen-stroke-roll': {
    // Thirteen stroke roll: R R L L R R L L R R L L R (13 notes)
    // For 16 notes: R R L L R R L L R R L L R R L L (16 notes - perfect!)
    sticking: 'R R L L R R L L R R L L R R L L'
  },
  'rudiment-fifteen-stroke-roll': {
    // Fifteen stroke roll: R R L L R R L L R R L L R R L (15 notes)
    // For 16 notes: R R L L R R L L R R L L R R L R (16 notes - perfect!)
    sticking: 'R R L L R R L L R R L L R R L R'
  },
  'intermediate-flam-paradiddle-diddle': {
    // Flam paradiddle-diddle: R L R R L L (6 notes, but with flams it's more complex)
    // Use paradiddle-diddle pattern: R L R R L L R L R R L L R L R R
    sticking: 'R L R R L L R L R R L L R L R R'
  },
  'coordination-double-paradiddle': {
    // Double paradiddle: R L R L R R L R L R L L (12 notes)
    // For 16 notes: R L R L R R L R L R L L R L R L
    sticking: 'R L R L R R L R L R L L R L R L'
  },
  'coordination-triple-paradiddle': {
    // Triple paradiddle: R L R L R L R R L R L R L R L L (16 notes)
    // Perfect fit!
    sticking: 'R L R L R L R R L R L R L R L L'
  },
  'rudiment-seventeen-stroke-roll': {
    // Seventeen stroke roll: R R L L R R L L R R L L R R L L R (17 notes)
    // For 16 notes: R R L L R R L L R R L L R R L L (16 notes - trim last)
    sticking: 'R R L L R R L L R R L L R R L L'
  },
  'intermediate-sextuplet-paradiddle': {
    // Sextuplet paradiddle - subdivision 24, paradiddle is 8 notes
    // For 24 notes: R L R R L R L L R L R R L R L L R L R R L R L L (24 notes - perfect!)
    sticking: 'R L R R L R L L R L R R L R L L R L R R L R L L'
  },
  'coordination-swiss-army-triplet': {
    // Swiss army triplet: R L R (3 notes)
    // For 12 notes (triplets): R L R R L R R L R R L R (12 notes - perfect!)
    sticking: 'R L R R L R R L R R L R'
  },
  'intermediate-32nd-paradiddle': {
    // 32nd note paradiddle - subdivision 32, paradiddle is 8 notes
    // For 32 notes: R L R R L R L L R L R R L R L L R L R R L R L L R L R R L R L L (32 notes - perfect!)
    sticking: 'R L R R L R L L R L R R L R L L R L R R L R L L R L R R L R L L'
  },
  'advanced-ruff-paradiddle': {
    // Ruff paradiddle: lllR L R R L R L L (9 notes with ruff)
    // For 16 notes: lllR L R R L R L L lllR L R R L R L (15 notes - add one)
    sticking: 'lllR L R R L R L L lllR L R R L R L L'
  },
  'advanced-triple-ratamacue': {
    // Triple ratamacue: lllR lllL R L (4 notes)
    // For 16 notes: lllR lllL R L lllR lllL R L lllR lllL R L lllR lllL R L (16 notes - perfect!)
    sticking: 'lllR lllL R L lllR lllL R L lllR lllL R L lllR lllL R L'
  },
  'rudiment-triple-ratamacue-alt': {
    // Triple ratamacue: lllR lllL R L (4 notes)
    // For 16 notes: lllR lllL R L lllR lllL R L lllR lllL R L lllR lllL R L (16 notes - perfect!)
    sticking: 'lllR lllL R L lllR lllL R L lllR lllL R L lllR lllL R L'
  },
  'advanced-drag-paradiddle': {
    // Drag paradiddle: llR L R R L R L L (9 notes with drag)
    // For 16 notes: llR L R R L R L L llR L R R L R L (15 notes - add one)
    sticking: 'llR L R R L R L L llR L R R L R L L'
  },
  'advanced-inverted-flam-tap': {
    // Inverted flam tap: lR rL R L (4 notes with flams)
    // For 16 notes: lR rL R L lR rL R L lR rL R L lR rL R L (16 notes - perfect!)
    sticking: 'lR rL R L lR rL R L lR rL R L lR rL R L'
  },
  'advanced-single-dragadiddle': {
    // Single dragadiddle: llR L R R L R L L (9 notes with drag)
    // For 16 notes: llR L R R L R L L llR L R R L R L (15 notes - add one)
    sticking: 'llR L R R L R L L llR L R R L R L L'
  },
  'rudiment-double-ratamacue-alt': {
    // Double ratamacue: llR llL R L (4 notes)
    // For 16 notes: llR llL R L llR llL R L llR llL R L llR llL R L (16 notes - perfect!)
    sticking: 'llR llL R L llR llL R L llR llL R L llR llL R L'
  },
  'rudiment-flam-tap-five': {
    // Flam tap five - similar to flam tap but with 5 notes
    // Use flam tap pattern: lR rL R L (4 notes)
    // For 16 notes: lR rL R L lR rL R L lR rL R L lR rL R L
    sticking: 'lR rL R L lR rL R L lR rL R L lR rL R L'
  },
  'rudiment-flam-paradiddle-diddle-alt': {
    // Flam paradiddle-diddle: R L R R L L (6 notes, but with flams)
    // Use paradiddle-diddle pattern: R L R R L L R L R R L L R L R R
    sticking: 'R L R R L L R L R R L L R L R R'
  }
};

// Fix presets
console.log('Fixing remaining rudiment sticking patterns...\n');
let fixedCount = 0;

const fixedPresets = presetsData.presets.map((preset) => {
  if (specificFixes[preset.id]) {
    const fix = specificFixes[preset.id];
    preset.stickingPattern = fix.sticking;
    console.log(`Fixed ${preset.id}: ${preset.name}`);
    fixedCount++;
  }
  return preset;
});

presetsData.presets = fixedPresets;
presetsData.version = '1.7';

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');
console.log(`\nFixed ${fixedCount} rudiment sticking patterns!`);
console.log(`Total presets: ${presetsData.presets.length}`);


