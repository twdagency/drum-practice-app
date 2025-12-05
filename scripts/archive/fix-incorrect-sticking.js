/**
 * Fix Incorrect Sticking Patterns
 * 
 * Fixes patterns where sticking doesn't match the expected rudiment or pattern
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
  
  // === PARADIDDLE FIXES ===
  
  if (fullText.includes('paradiddle') && fullText.includes('quarter')) {
    // Paradiddle in quarter notes - needs to be 8th notes to fit full paradiddle
    // OR it should be half paradiddle if staying in quarter notes
    // Let's make it 8th notes to fit full paradiddle
    if (preset.subdivision === 4 && notesPerBar === 4) {
      // Change to 8th notes to fit full paradiddle
      fixed.subdivision = 8;
      fixed.phrase = '2 2 2 2';
      fixed.drumPattern = 'S S S S S S S S';
      fixed.stickingPattern = 'R L R R L R L L';
      fixed.description = 'Paradiddle in eighth notes - full paradiddle pattern';
    }
  }
  
  // === OTHER RUDIMENT FIXES ===
  // Check if pattern name suggests a rudiment but sticking doesn't match
  
  for (const [rudimentName, expectedPattern] of Object.entries(RUDIMENT_PATTERNS)) {
    if (fullText.includes(rudimentName.replace(/-/g, ' ')) || 
        fullText.includes(rudimentName.replace(/-/g, ''))) {
      const expectedTokens = parseTokens(expectedPattern);
      const currentSticking = parseTokens(preset.stickingPattern || '');
      
      // Check if we need to repeat the pattern to fill the bar
      if (currentSticking.length > 0 && notesPerBar > 0) {
        const repeats = Math.ceil(notesPerBar / expectedTokens.length);
        const fullPattern = repeatPattern(expectedPattern, notesPerBar);
        
        // Only fix if current sticking is clearly wrong
        // (not just a different number of repeats)
        const currentPattern = currentSticking.slice(0, expectedTokens.length).join(' ');
        const expectedStart = expectedTokens.join(' ');
        
        if (currentPattern !== expectedStart && 
            currentSticking.length >= expectedTokens.length) {
          // Check if it's a valid repeat
          let isValidRepeat = true;
          for (let i = 0; i < Math.min(currentSticking.length, expectedTokens.length * 2); i++) {
            if (currentSticking[i] !== expectedTokens[i % expectedTokens.length]) {
              isValidRepeat = false;
              break;
            }
          }
          
          if (!isValidRepeat) {
            fixed.stickingPattern = fullPattern;
            console.log(`Fixed ${preset.name}: ${preset.stickingPattern} -> ${fullPattern}`);
          }
        }
      }
    }
  }
  
  // === SPECIFIC FIXES ===
  
  // Fix patterns where sticking count doesn't match drum pattern count
  const drumCount = drumTokens.filter(t => t !== 'K' && !t.startsWith('(')).length;
  const stickingCount = stickingTokens.filter(t => t !== 'K').length;
  
  // If there's a significant mismatch and it's a simple pattern, fix it
  if (Math.abs(drumCount - stickingCount) > 2 && 
      (fullText.includes('single stroke') || fullText.includes('double stroke'))) {
    if (fullText.includes('single stroke')) {
      fixed.stickingPattern = repeatPattern('R L', drumCount);
    } else if (fullText.includes('double stroke')) {
      fixed.stickingPattern = repeatPattern('R R L L', drumCount);
    }
  }
  
  return fixed;
});

// Update version
presetsData.version = '1.39';
presetsData.presets = fixedPresets;

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log('=== FIXED INCORRECT STICKING PATTERNS ===\n');
console.log(`Total presets: ${fixedPresets.length}`);
console.log(`\n✅ Fixed paradiddle quarter notes issue`);
console.log(`✅ Fixed rudiment sticking patterns`);
console.log(`✅ Fixed sticking count mismatches`);

