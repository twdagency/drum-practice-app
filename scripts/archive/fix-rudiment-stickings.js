/**
 * Script to fix rudiment sticking patterns
 * Ensures rudiments use the correct base pattern that repeats to fill the bar
 */

const fs = require('fs');
const path = require('path');

// Load presets
const presetsPath = path.join(__dirname, '../public/practice-presets.json');
const presetsData = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));

// Correct rudiment patterns (base patterns that should repeat)
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
  'flam-tap': 'lR rL R L',
  'flam-accent': 'lR rL R L',
  'flam-paradiddle': 'lR rL R R L R L L',
  'single-drag-tap': 'llR L',
  'double-drag-tap': 'llR llL',
  'single-ratamacue': 'llR L R',
  'double-ratamacue': 'llR llL R L',
  'triple-ratamacue': 'lllR lllL R L',
  'swiss-army-triplet': 'R L R',
  'single-stroke-four': 'R R R R L L L L',
};

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

function getRudimentKey(preset) {
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const tags = (preset.tags || []).map(t => t.toLowerCase());
  const allText = `${name} ${description} ${tags.join(' ')}`;
  
  // More precise matching - check in order of specificity
  // Check for specific rudiments first (most specific)
  if (allText.includes('triple paradiddle')) return 'triple-paradiddle';
  if (allText.includes('double paradiddle')) return 'double-paradiddle';
  if (allText.includes('paradiddle diddle') || allText.includes('paradiddle-diddle')) return 'paradiddle-diddle';
  if (allText.includes('flam paradiddle')) return 'flam-paradiddle';
  if (allText.includes('single paradiddle') || (allText.includes('paradiddle') && !allText.includes('double') && !allText.includes('triple'))) return 'paradiddle';
  
  if (allText.includes('triple ratamacue')) return 'triple-ratamacue';
  if (allText.includes('double ratamacue')) return 'double-ratamacue';
  if (allText.includes('single ratamacue')) return 'single-ratamacue';
  
  if (allText.includes('flam tap') || allText.includes('flam accent')) return 'flam-tap';
  if (allText.includes('flam drag') || allText.includes('flamacue')) return 'flam-tap';
  
  if (allText.includes('single drag tap') || allText.includes('single-drag-tap')) return 'single-drag-tap';
  if (allText.includes('double drag tap') || allText.includes('double-drag-tap')) return 'double-drag-tap';
  
  if (allText.includes('swiss army triplet')) return 'swiss-army-triplet';
  
  if (allText.includes('seventeen stroke roll') || allText.includes('17-stroke')) return 'seventeen-stroke-roll';
  if (allText.includes('fifteen stroke roll') || allText.includes('15-stroke')) return 'fifteen-stroke-roll';
  if (allText.includes('thirteen stroke roll') || allText.includes('13-stroke')) return 'thirteen-stroke-roll';
  if (allText.includes('eleven stroke roll') || allText.includes('11-stroke')) return 'eleven-stroke-roll';
  if (allText.includes('ten stroke roll') || allText.includes('10-stroke')) return 'ten-stroke-roll';
  if (allText.includes('nine stroke roll') || allText.includes('9-stroke')) return 'nine-stroke-roll';
  if (allText.includes('seven stroke roll') || allText.includes('7-stroke')) return 'seven-stroke-roll';
  if (allText.includes('six stroke roll') || allText.includes('6-stroke')) return 'six-stroke-roll';
  if (allText.includes('five stroke roll') || allText.includes('5-stroke')) return 'five-stroke-roll';
  
  if (allText.includes('single stroke four') || allText.includes('single-stroke-four')) return 'single-stroke-four';
  if (allText.includes('single stroke five') || allText.includes('single-stroke-five')) return 'single-stroke-roll'; // Use basic pattern
  if (allText.includes('single stroke seven') || allText.includes('single-stroke-seven')) return 'single-stroke-roll';
  if (allText.includes('single stroke nine') || allText.includes('single-stroke-nine')) return 'single-stroke-roll';
  if (allText.includes('single stroke thirteen') || allText.includes('single-stroke-thirteen')) return 'single-stroke-roll';
  if (allText.includes('single stroke fifteen') || allText.includes('single-stroke-fifteen')) return 'single-stroke-roll';
  
  // Check for double stroke vs single stroke
  if (allText.includes('double stroke roll') || allText.includes('double-stroke-roll')) return 'double-stroke-roll';
  if (allText.includes('single stroke roll') || allText.includes('single-stroke-roll') || allText.includes('single stroke')) return 'single-stroke-roll';
  
  return null;
}

function fixPreset(preset) {
  const rudimentKey = getRudimentKey(preset);
  
  if (rudimentKey) {
    const correctPattern = RUDIMENT_PATTERNS[rudimentKey];
    const notesPerBar = calculateNotesPerBar(preset.timeSignature, preset.subdivision);
    
    // Expand the correct rudiment pattern to fill the bar
    preset.stickingPattern = expandPattern(correctPattern, notesPerBar);
    
    console.log(`Fixed ${preset.id}: ${preset.name} - using ${rudimentKey} pattern`);
  }
  
  return preset;
}

// Fix rudiment presets
console.log('Fixing rudiment sticking patterns...\n');
let fixedCount = 0;

const fixedPresets = presetsData.presets.map((preset) => {
  const before = preset.stickingPattern;
  const fixed = fixPreset(preset);
  if (before !== fixed.stickingPattern) {
    fixedCount++;
  }
  return fixed;
});

presetsData.presets = fixedPresets;
presetsData.version = '1.7';

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');
console.log(`\nFixed ${fixedCount} rudiment sticking patterns!`);
console.log(`Total presets: ${presetsData.presets.length}`);

