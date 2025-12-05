/**
 * Fix Incorrect Sticking Patterns - Corrected Version
 * 
 * Properly fixes patterns where sticking doesn't match the expected rudiment
 */

const fs = require('fs');
const path = require('path');

// Load presets
const presetsPath = path.join(__dirname, '../public/practice-presets.json');
const presetsData = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));

// Rudiment patterns (standard PAS 40)
const RUDIMENT_PATTERNS = {
  'single-stroke-roll': 'R L',
  'double-stroke-roll': 'R R L L',
  'paradiddle': 'R L R R L R L L',
  'double-paradiddle': 'R L R L R R L R L R L L',
  'triple-paradiddle': 'R L R L R L R R L R L R L R L L',
  'paradiddle-diddle': 'R L R R L L',
  'five-stroke-roll': 'R R L L R',
  'six-stroke-roll': 'R R L L R L',
  'seven-stroke-roll': 'R R L L R R L',
  'nine-stroke-roll': 'R R L L R R L L R',
  'ten-stroke-roll': 'R R L L R R L L R L',
  'eleven-stroke-roll': 'R R L L R R L L R R L',
  'thirteen-stroke-roll': 'R R L L R R L L R R L L R',
  'fifteen-stroke-roll': 'R R L L R R L L R R L L R R L',
  'seventeen-stroke-roll': 'R R L L R R L L R R L L R R L L R',
};

// Helper functions
function parseTokens(str) {
  if (!str) return [];
  return str.split(/\s+/).filter(t => t.length > 0);
}

function repeatPattern(pattern, targetLength) {
  const tokens = parseTokens(pattern);
  const result = [];
  for (let i = 0; i < targetLength; i++) {
    result.push(tokens[i % tokens.length]);
  }
  return result.join(' ');
}

function calculateNotesPerBar(timeSignature, subdivision) {
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  const beatValue = denominator;
  const notesPerBeat = subdivision / beatValue;
  return numerator * notesPerBeat;
}

// Fix each preset
const fixedPresets = presetsData.presets.map(preset => {
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const allText = `${name} ${description}`;
  const tags = (preset.tags || []).map(t => t.toLowerCase()).join(' ');
  const fullText = `${allText} ${tags}`;
  
  let fixed = { ...preset };
  const notesPerBar = calculateNotesPerBar(preset.timeSignature, preset.subdivision);
  const drumTokens = parseTokens(preset.drumPattern || '');
  const stickingTokens = parseTokens(preset.stickingPattern || '');
  
  // === SPECIFIC RUDIMENT FIXES ===
  
  // Paradiddle in quarter notes - needs to be 8th notes to fit full paradiddle
  if (preset.id === 'beginner-quarter-paradiddle') {
    fixed.subdivision = 8;
    fixed.phrase = '2 2 2 2';
    fixed.drumPattern = 'S S S S S S S S';
    fixed.stickingPattern = 'R L R R L R L L';
    fixed.description = 'Paradiddle in eighth notes - full paradiddle pattern';
  }
  
  // Stroke rolls - fix to repeat base pattern correctly
  if (preset.id === 'beginner-five-stroke-roll') {
    fixed.stickingPattern = repeatPattern('R R L L R', notesPerBar);
  } else if (preset.id === 'beginner-six-stroke-roll') {
    fixed.stickingPattern = repeatPattern('R R L L R L', notesPerBar);
  } else if (preset.id === 'beginner-seven-stroke-roll') {
    fixed.stickingPattern = repeatPattern('R R L L R R L', notesPerBar);
  } else if (preset.id === 'beginner-nine-stroke-roll') {
    fixed.stickingPattern = repeatPattern('R R L L R R L L R', notesPerBar);
  } else if (preset.id === 'rudiment-ten-stroke-roll') {
    fixed.stickingPattern = repeatPattern('R R L L R R L L R L', notesPerBar);
  } else if (preset.id === 'rudiment-eleven-stroke-roll') {
    fixed.stickingPattern = repeatPattern('R R L L R R L L R R L', notesPerBar);
  }
  
  // Paradiddle variations - restore correct patterns
  if (preset.id === 'intermediate-paradiddle-diddle' || preset.id === 'coordination-paradiddle-diddle') {
    fixed.stickingPattern = repeatPattern('R L R R L L', notesPerBar);
  } else if (preset.id === 'intermediate-double-paradiddle' || preset.id === 'coordination-double-paradiddle') {
    fixed.stickingPattern = repeatPattern('R L R L R R L R L R L L', notesPerBar);
  } else if (preset.id === 'intermediate-triple-paradiddle' || preset.id === 'coordination-triple-paradiddle') {
    fixed.stickingPattern = repeatPattern('R L R L R L R R L R L R L R L L', notesPerBar);
  }
  
  // Triplet paradiddle - should be paradiddle pattern repeated
  if (preset.id === 'beginner-triplet-paradiddle') {
    // Triplet paradiddle in 12/8 or 4/4 with triplets
    // For 12/8, paradiddle fits: R L R R L R L L (8 notes) needs to fit in 12
    fixed.stickingPattern = repeatPattern('R L R R L R L L', notesPerBar);
  }
  
  // Flam paradiddle - should have flams but correct paradiddle base
  if (preset.id === 'intermediate-flam-paradiddle' || preset.id === 'advanced-flam-paradiddle') {
    // Flam paradiddle: lR rL R R L R L L
    fixed.stickingPattern = repeatPattern('lR rL R R L R L L', notesPerBar);
  }
  
  // Flam paradiddle-diddle - should have flams and correct pattern
  if (preset.id === 'intermediate-flam-paradiddle-diddle' || preset.id === 'advanced-flam-paradiddle-diddle') {
    // Flam paradiddle-diddle: lR rL R R L L
    fixed.stickingPattern = repeatPattern('lR rL R R L L', notesPerBar);
  }
  
  // Inverted paradiddle - R L L R L R R L
  if (preset.id === 'coordination-inverted-paradiddle') {
    fixed.stickingPattern = repeatPattern('R L L R L R R L', notesPerBar);
  }
  
  // Drag paradiddle - should have drags but correct paradiddle base
  if (preset.id === 'advanced-drag-paradiddle') {
    // Drag paradiddle: llR L R R L R L L
    fixed.stickingPattern = repeatPattern('llR L R R L R L L', notesPerBar);
  }
  
  // Single dragadiddle - should have drags
  if (preset.id === 'advanced-single-dragadiddle') {
    // Single dragadiddle: llR L R R L L
    fixed.stickingPattern = repeatPattern('llR L R R L L', notesPerBar);
  }
  
  // Ruff paradiddle - should have ruffs
  if (preset.id === 'advanced-ruff-paradiddle') {
    // Ruff paradiddle: lllR L R R L R L L
    fixed.stickingPattern = repeatPattern('lllR L R R L R L L', notesPerBar);
  }
  
  return fixed;
});

// Update version
presetsData.version = '1.40';
presetsData.presets = fixedPresets;

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log('=== FIXED INCORRECT STICKING PATTERNS (CORRECTED) ===\n');
console.log(`Total presets: ${fixedPresets.length}`);
console.log(`\n✅ Fixed paradiddle quarter notes`);
console.log(`✅ Fixed stroke roll patterns`);
console.log(`✅ Fixed paradiddle variations (double, triple, paradiddle-diddle)`);
console.log(`✅ Fixed flam and drag paradiddle patterns`);
console.log(`✅ Fixed inverted paradiddle`);

