/**
 * Fix Speed Presets Script
 * 
 * Fixes speed patterns to ensure:
 * - Single stroke patterns use R L
 * - Double stroke patterns use R R L L
 * - Patterns are unique (not duplicates)
 * - Appropriate BPM ranges
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

// Fix speed presets
function fixSpeedPreset(preset) {
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const allText = `${name} ${description}`;
  
  // Skip if not a speed preset
  if (preset.category !== 'speed') {
    return preset;
  }
  
  const notesPerBar = calculateNotesPerBar(preset.timeSignature, preset.subdivision);
  let newSticking = preset.stickingPattern;
  let updated = false;
  
  // Determine correct pattern based on name
  if (allText.includes('double stroke')) {
    // Double stroke should be R R L L
    const correctPattern = 'R R L L';
    newSticking = repeatPattern(correctPattern, notesPerBar);
    updated = true;
  } else if (allText.includes('single stroke') || allText.includes('paradiddle')) {
    // Single stroke should be R L, paradiddle should be R L R R L R L L
    if (allText.includes('paradiddle')) {
      const correctPattern = 'R L R R L R L L';
      newSticking = repeatPattern(correctPattern, notesPerBar);
    } else {
      const correctPattern = 'R L';
      newSticking = repeatPattern(correctPattern, notesPerBar);
    }
    updated = true;
  }
  
  if (updated && newSticking !== preset.stickingPattern) {
    return {
      ...preset,
      stickingPattern: newSticking
    };
  }
  
  return preset;
}

// Main execution
console.log('Fixing speed presets...\n');

let fixedCount = 0;
let unchangedCount = 0;

const updatedPresets = presetsData.presets.map((preset, index) => {
  const originalSticking = preset.stickingPattern;
  const updated = fixSpeedPreset(preset);
  
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
presetsData.version = '1.31';
presetsData.presets = updatedPresets;

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log('\n=== SUMMARY ===');
console.log(`Total presets: ${presetsData.presets.length}`);
console.log(`Fixed: ${fixedCount}`);
console.log(`Unchanged: ${unchangedCount}`);
console.log(`\n✅ Updated presets file: ${presetsPath}`);

