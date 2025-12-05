/**
 * Fix Remaining Rudiment Issues
 * 
 * Fixes specific rudiment patterns that are genuinely incorrect
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

// Specific fixes for patterns that are genuinely wrong
const fixes = {
  'beginner-five-stroke-roll': {
    basePattern: 'R R L L R',
    notes: 5
  },
  'beginner-seven-stroke-roll': {
    basePattern: 'R R L L R R L',
    notes: 7
  },
  'beginner-nine-stroke-roll': {
    basePattern: 'R R L L R R L L R',
    notes: 9
  },
  'rudiment-ten-stroke-roll': {
    basePattern: 'R R L L R R L L R L',
    notes: 10
  },
  'rudiment-eleven-stroke-roll': {
    basePattern: 'R R L L R R L L R R L',
    notes: 11
  },
  'rudiment-thirteen-stroke-roll': {
    basePattern: 'R R L L R R L L R R L L R',
    notes: 13
  },
  'rudiment-fifteen-stroke-roll': {
    basePattern: 'R R L L R R L L R R L L R R L',
    notes: 15
  },
  'rudiment-seventeen-stroke-roll': {
    basePattern: 'R R L L R R L L R R L L R R L L R',
    notes: 17
  },
  'intermediate-single-ratamacue': {
    basePattern: 'llR L R',
    notes: 3
  }
};

// Fix a preset
function fixPreset(preset) {
  const fix = fixes[preset.id];
  if (!fix) {
    return preset;
  }
  
  const notesPerBar = calculateNotesPerBar(preset.timeSignature, preset.subdivision);
  const newSticking = repeatPattern(fix.basePattern, notesPerBar);
  
  if (newSticking !== preset.stickingPattern) {
    return {
      ...preset,
      stickingPattern: newSticking
    };
  }
  
  return preset;
}

// Main execution
console.log('Fixing remaining rudiment patterns...\n');

let fixedCount = 0;

const updatedPresets = presetsData.presets.map((preset) => {
  const originalSticking = preset.stickingPattern;
  const updated = fixPreset(preset);
  
  if (originalSticking !== updated.stickingPattern) {
    fixedCount++;
    console.log(`✓ Fixed: ${preset.name} (${preset.id})`);
    console.log(`  Old: ${originalSticking}`);
    console.log(`  New: ${updated.stickingPattern}\n`);
  }
  
  return updated;
});

// Update version
presetsData.version = '1.32';
presetsData.presets = updatedPresets;

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log('\n=== SUMMARY ===');
console.log(`Fixed: ${fixedCount}`);
console.log(`\n✅ Updated presets file: ${presetsPath}`);
