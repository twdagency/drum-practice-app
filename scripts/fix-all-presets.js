/**
 * Comprehensive script to fix all preset issues:
 * 1. Expand drum patterns to match subdivision
 * 2. Fix rudiment stickings
 * 3. Fix phrase values
 * 4. Ensure all counts match
 */

const fs = require('fs');
const path = require('path');

// Load presets
const presetsPath = path.join(__dirname, '../public/practice-presets.json');
const presetsData = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));

// Known rudiment patterns (correct stickings)
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
  'single-stroke-five': 'R R R R R L L L L L',
  'single-stroke-seven': 'R R R R R R R L L L L L L L',
  'single-stroke-nine': 'R R R R R R R R R L L L L L L L L L',
  'single-stroke-thirteen': 'R R R R R R R R R R R R R L L L L L L L L L L L L',
  'single-stroke-fifteen': 'R R R R R R R R R R R R R R R L L L L L L L L L L L L L L L',
};

// Helper functions
function parseTokens(str) {
  if (!str) return [];
  return str.split(/\s+/).filter(t => t.length > 0);
}

function parseNumberList(str) {
  if (!str) return [];
  return str.split(/\s+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
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
  
  // If pattern is already the right length, return it
  if (tokens.length === targetLength) return pattern;
  
  // If pattern is shorter, repeat it
  const expanded = [];
  for (let i = 0; i < targetLength; i++) {
    expanded.push(tokens[i % tokens.length]);
  }
  return formatList(expanded);
}

function expandSticking(sticking, targetLength, isRudiment = false) {
  const tokens = parseTokens(sticking);
  if (tokens.length === 0) return sticking;
  
  // If it's a rudiment, preserve the exact pattern and repeat
  if (isRudiment) {
    const expanded = [];
    for (let i = 0; i < targetLength; i++) {
      expanded.push(tokens[i % tokens.length]);
    }
    return formatList(expanded);
  }
  
  // For non-rudiments, try to find a repeating pattern
  // Find the shortest repeating unit
  let baseLength = tokens.length;
  for (let len = 1; len <= Math.min(tokens.length / 2, 8); len++) {
    if (tokens.length % len === 0) {
      let isRepeating = true;
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] !== tokens[i % len]) {
          isRepeating = false;
          break;
        }
      }
      if (isRepeating) {
        baseLength = len;
        break;
      }
    }
  }
  
  // Expand using the base pattern
  const basePattern = tokens.slice(0, baseLength);
  const expanded = [];
  for (let i = 0; i < targetLength; i++) {
    expanded.push(basePattern[i % baseLength]);
  }
  return formatList(expanded);
}

function getRudimentSticking(preset) {
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const tags = (preset.tags || []).map(t => t.toLowerCase());
  const allText = `${name} ${description} ${tags.join(' ')}`;
  
  for (const [key, pattern] of Object.entries(RUDIMENT_PATTERNS)) {
    if (allText.includes(key.replace(/-/g, ' '))) {
      return pattern;
    }
  }
  
  return null;
}

function isRudimentPreset(preset) {
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const tags = (preset.tags || []).map(t => t.toLowerCase());
  const allText = `${name} ${description} ${tags.join(' ')}`;
  
  const rudimentKeywords = [
    'paradiddle', 'roll', 'drag', 'flam', 'ruff', 'rudiment',
    'swiss army', 'pataflafla', 'ratamacue', 'mill'
  ];
  
  return rudimentKeywords.some(keyword => allText.includes(keyword));
}

function fixPreset(preset) {
  const notesPerBar = calculateNotesPerBar(preset.timeSignature, preset.subdivision);
  
  // Fix drum pattern
  const drumPatternCount = parseTokens(preset.drumPattern).length;
  if (drumPatternCount !== notesPerBar) {
    preset.drumPattern = expandPattern(preset.drumPattern, notesPerBar);
  }
  
  // Fix sticking pattern
  const isRudiment = isRudimentPreset(preset);
  const rudimentSticking = isRudiment ? getRudimentSticking(preset) : null;
  
  if (rudimentSticking) {
    // Use correct rudiment sticking and expand it
    preset.stickingPattern = expandSticking(rudimentSticking, notesPerBar, true);
  } else {
    // Expand existing sticking
    const stickingCount = parseTokens(preset.stickingPattern).length;
    if (stickingCount !== notesPerBar) {
      preset.stickingPattern = expandSticking(preset.stickingPattern, notesPerBar, false);
    }
  }
  
  // Fix phrase - should sum to notesPerBar
  const phraseValues = parseNumberList(preset.phrase);
  const phraseSum = phraseValues.reduce((sum, val) => sum + val, 0);
  
  if (phraseSum !== notesPerBar) {
    // Try to fix phrase by adjusting values proportionally
    // For now, create a simple phrase based on beats
    const [numerator] = preset.timeSignature.split('/').map(Number);
    const notesPerBeat = notesPerBar / numerator;
    const newPhrase = Array(numerator).fill(notesPerBeat);
    preset.phrase = formatList(newPhrase);
  }
  
  return preset;
}

// Fix all presets
console.log('Fixing presets...');
const fixedPresets = presetsData.presets.map((preset, index) => {
  if ((index + 1) % 20 === 0) {
    console.log(`  Fixed ${index + 1}/${presetsData.presets.length} presets...`);
  }
  return fixPreset(preset);
});

presetsData.presets = fixedPresets;
presetsData.version = '1.6';

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');
console.log(`\nFixed ${presetsData.presets.length} presets!`);


