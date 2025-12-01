/**
 * Fix Rudiment Presets Script
 * 
 * Fixes all rudiment patterns to match PAS 40 standards:
 * - Correct sticking patterns
 * - Add flams where missing
 * - Fix stroke roll patterns
 * - Ensure paradiddle variations are correct
 */

const fs = require('fs');
const path = require('path');

// Load presets
const presetsPath = path.join(__dirname, '../public/practice-presets.json');
const presetsData = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));

// PAS 40 Standard Rudiment Patterns
const STANDARD_RUDIMENTS = {
  // Single Stroke Rolls
  'single stroke roll': { pattern: 'R L', hasFlams: false },
  'single stroke four': { pattern: 'R R R R L L L L', hasFlams: false },
  
  // Double Stroke Rolls
  'double stroke roll': { pattern: 'R R L L', hasFlams: false },
  
  // Multiple Stroke Rolls
  'five stroke roll': { pattern: 'R R L L R', hasFlams: false },
  'six stroke roll': { pattern: 'R R L L R L', hasFlams: false },
  'seven stroke roll': { pattern: 'R R L L R R L', hasFlams: false },
  'nine stroke roll': { pattern: 'R R L L R R L L R', hasFlams: false },
  'ten stroke roll': { pattern: 'R R L L R R L L R L', hasFlams: false },
  'eleven stroke roll': { pattern: 'R R L L R R L L R R L', hasFlams: false },
  'thirteen stroke roll': { pattern: 'R R L L R R L L R R L L R', hasFlams: false },
  'fifteen stroke roll': { pattern: 'R R L L R R L L R R L L R R L', hasFlams: false },
  'seventeen stroke roll': { pattern: 'R R L L R R L L R R L L R R L L R', hasFlams: false },
  
  // Paradiddles
  'paradiddle': { pattern: 'R L R R L R L L', hasFlams: false },
  'double paradiddle': { pattern: 'R L R L R R L R L R L L', hasFlams: false },
  'triple paradiddle': { pattern: 'R L R L R L R R L R L R L R L L', hasFlams: false },
  'paradiddle-diddle': { pattern: 'R L R R L L', hasFlams: false },
  
  // Flams
  'flam': { pattern: 'lR', hasFlams: true },
  'flam tap': { pattern: 'lR rL R L', hasFlams: true },
  'flam accent': { pattern: 'lR rL R L', hasFlams: true, accents: [2, 3] }, // Accent on R L (main notes)
  'flam paradiddle': { pattern: 'lR rL R R L R L L', hasFlams: true },
  'flam paradiddle-diddle': { pattern: 'lR rL R R L L', hasFlams: true },
  'single flammed mill': { pattern: 'lR rL lR rL', hasFlams: true },
  
  // Drags
  'single drag tap': { pattern: 'llR L', hasFlams: false },
  'double drag tap': { pattern: 'llR llL', hasFlams: false },
  'single ratamacue': { pattern: 'llR L R', hasFlams: false },
  'double ratamacue': { pattern: 'llR llL R L', hasFlams: false },
  'triple ratamacue': { pattern: 'lllR lllL R L', hasFlams: false },
  
  // Other
  'swiss army triplet': { pattern: 'R L R', hasFlams: false },
  'pataflafla': { pattern: 'R L R L', hasFlams: false },
};

// Helper functions
function parseTokens(str) {
  if (!str) return [];
  return str.split(/\s+/).filter(t => t.length > 0);
}

function normalizeSticking(sticking) {
  if (!sticking) return '';
  return parseTokens(sticking).join(' ').toLowerCase();
}

function calculateNotesPerBar(timeSignature, subdivision) {
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  const beatValue = denominator;
  const notesPerBeat = subdivision / beatValue;
  return numerator * notesPerBeat;
}

function repeatPattern(pattern, targetLength) {
  const tokens = parseTokens(pattern);
  const result = [];
  for (let i = 0; i < targetLength; i++) {
    result.push(tokens[i % tokens.length]);
  }
  return result.join(' ');
}

function identifyRudiment(preset) {
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const tags = (preset.tags || []).map(t => t.toLowerCase()).join(' ');
  const allText = `${name} ${description} ${tags}`;
  
  // Check each rudiment (most specific first)
  const rudimentChecks = [
    ['triple paradiddle', 'triple paradiddle'],
    ['double paradiddle', 'double paradiddle'],
    ['paradiddle-diddle', 'paradiddle diddle', 'paradiddle-diddle'],
    ['flam paradiddle-diddle', 'flam paradiddle diddle', 'flam paradiddle-diddle'],
    ['flam paradiddle', 'flam paradiddle'],
    ['paradiddle', 'paradiddle'],
    ['triple ratamacue', 'triple ratamacue'],
    ['double ratamacue', 'double ratamacue'],
    ['single ratamacue', 'single ratamacue'],
    ['double drag tap', 'double drag tap'],
    ['single drag tap', 'single drag tap', 'drag tap'],
    ['flam accent', 'flam accent'],
    ['flam tap', 'flam tap'],
    ['single flammed mill', 'single flammed mill', 'flammed mill'],
    ['seventeen stroke roll', 'seventeen stroke roll', '17-stroke'],
    ['fifteen stroke roll', 'fifteen stroke roll', '15-stroke'],
    ['thirteen stroke roll', 'thirteen stroke roll', '13-stroke'],
    ['eleven stroke roll', 'eleven stroke roll', '11-stroke'],
    ['ten stroke roll', 'ten stroke roll', '10-stroke'],
    ['nine stroke roll', 'nine stroke roll', '9-stroke'],
    ['seven stroke roll', 'seven stroke roll', '7-stroke'],
    ['six stroke roll', 'six stroke roll', '6-stroke'],
    ['five stroke roll', 'five stroke roll', '5-stroke'],
    ['single stroke four', 'single stroke four'],
    ['double stroke roll', 'double stroke roll', 'double-stroke'],
    ['single stroke roll', 'single stroke roll', 'single-stroke'],
    ['swiss army triplet', 'swiss army triplet'],
    ['pataflafla', 'pataflafla'],
  ];
  
  for (const [rudimentKey, ...searchTerms] of rudimentChecks) {
    if (STANDARD_RUDIMENTS[rudimentKey] && searchTerms.some(term => allText.includes(term))) {
      return { key: rudimentKey, data: STANDARD_RUDIMENTS[rudimentKey] };
    }
  }
  
  return null;
}

// Fix a single preset
function fixRudimentPreset(preset) {
  const rudiment = identifyRudiment(preset);
  
  if (!rudiment) {
    return preset; // Not a rudiment, return unchanged
  }
  
  const { key, data } = rudiment;
  const { pattern, hasFlams, accents } = data;
  
  // Calculate notes per bar
  const notesPerBar = calculateNotesPerBar(preset.timeSignature, preset.subdivision);
  const patternTokens = parseTokens(pattern);
  const patternLength = patternTokens.length;
  
  // Determine how to repeat the pattern
  let newSticking;
  if (notesPerBar % patternLength === 0) {
    // Pattern divides evenly - repeat it
    newSticking = repeatPattern(pattern, notesPerBar);
  } else {
    // Pattern doesn't divide evenly - repeat and truncate
    const repetitions = Math.ceil(notesPerBar / patternLength);
    newSticking = repeatPattern(pattern, notesPerBar);
  }
  
  // Update preset
  const updated = {
    ...preset,
    stickingPattern: newSticking
  };
  
  // Set _hasFlams flag
  if (hasFlams) {
    updated._hasFlams = true;
  } else if (preset._hasFlams && !hasFlams) {
    // Remove flag if it shouldn't have flams
    delete updated._hasFlams;
  }
  
  // Add accents if specified
  if (accents && Array.isArray(accents)) {
    // Calculate accent positions based on pattern repetition
    const accentPositions = [];
    const repetitions = Math.ceil(notesPerBar / patternLength);
    
    for (let rep = 0; rep < repetitions; rep++) {
      for (const accent of accents) {
        const pos = rep * patternLength + accent;
        if (pos < notesPerBar) {
          accentPositions.push(pos);
        }
      }
    }
    
    updated.accents = accentPositions;
  }
  
  return updated;
}

// Main execution
console.log('Fixing rudiment presets...\n');

let fixedCount = 0;
let unchangedCount = 0;

const updatedPresets = presetsData.presets.map((preset, index) => {
  const originalSticking = preset.stickingPattern;
  const updated = fixRudimentPreset(preset);
  
  if (originalSticking !== updated.stickingPattern) {
    fixedCount++;
    console.log(`✓ Fixed: ${preset.name} (${preset.id})`);
    console.log(`  Old: ${originalSticking}`);
    console.log(`  New: ${updated.stickingPattern}\n`);
  } else {
    unchangedCount++;
  }
  
  return updated;
});

// Update version
presetsData.version = '1.30';
presetsData.presets = updatedPresets;

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log('\n=== SUMMARY ===');
console.log(`Total presets: ${presetsData.presets.length}`);
console.log(`Fixed: ${fixedCount}`);
console.log(`Unchanged: ${unchangedCount}`);
console.log(`\n✅ Updated presets file: ${presetsPath}`);

