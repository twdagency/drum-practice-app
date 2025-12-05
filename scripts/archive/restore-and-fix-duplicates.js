/**
 * Restore and Fix Duplicate Presets
 * 
 * Instead of deleting duplicates, restore them and fix them to be unique and correct
 */

const fs = require('fs');
const path = require('path');

// Load current presets
const presetsPath = path.join(__dirname, '../public/practice-presets.json');
const currentData = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));

// Load old presets (before deletion)
const oldPresetsPath = path.join(__dirname, '../temp-old-presets.json');
if (!fs.existsSync(oldPresetsPath)) {
  console.error('Old presets file not found. Please restore from git first.');
  process.exit(1);
}
const oldData = JSON.parse(fs.readFileSync(oldPresetsPath, 'utf8'));

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

// Create a map of current presets by ID
const currentPresets = new Map();
currentData.presets.forEach(p => currentPresets.set(p.id, p));

// Presets to restore and fix
const presetsToRestore = [];

oldData.presets.forEach(oldPreset => {
  // If it's not in current presets, it was deleted - restore it
  if (!currentPresets.has(oldPreset.id)) {
    presetsToRestore.push(oldPreset);
  }
});

console.log(`Found ${presetsToRestore.length} presets to restore and fix...\n`);

// Fix each restored preset to be unique and correct
const fixedPresets = presetsToRestore.map(preset => {
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const allText = `${name} ${description}`;
  
  let fixed = { ...preset };
  const notesPerBar = calculateNotesPerBar(preset.timeSignature, preset.subdivision);
  
  // Fix based on pattern name/description
  if (allText.includes('single stroke five')) {
    // Single Stroke Five: 5 strokes per hand = R R R R R L L L L L
    fixed.stickingPattern = repeatPattern('R R R R R L L L L L', notesPerBar);
    fixed.description = 'Five strokes per hand (R R R R R L L L L L) - builds control and speed';
  } else if (allText.includes('single stroke seven')) {
    // Single Stroke Seven: 7 strokes per hand
    fixed.stickingPattern = repeatPattern('R R R R R R R L L L L L L L', notesPerBar);
    fixed.description = 'Seven strokes per hand - extended single stroke pattern';
  } else if (allText.includes('single stroke nine')) {
    // Single Stroke Nine: 9 strokes per hand
    fixed.stickingPattern = repeatPattern('R R R R R R R R R L L L L L L L L L', notesPerBar);
    fixed.description = 'Nine strokes per hand - extended single stroke pattern';
  } else if (allText.includes('single stroke thirteen')) {
    // Single Stroke Thirteen: 13 strokes per hand
    const pattern = 'R R R R R R R R R R R R R L L L L L L L L L L L L';
    fixed.stickingPattern = repeatPattern(pattern, notesPerBar);
    fixed.description = 'Thirteen strokes per hand - very extended single stroke pattern';
  } else if (allText.includes('single stroke fifteen')) {
    // Single Stroke Fifteen: 15 strokes per hand
    const pattern = 'R R R R R R R R R R R R R R R L L L L L L L L L L L L L L';
    fixed.stickingPattern = repeatPattern(pattern, notesPerBar);
    fixed.description = 'Fifteen strokes per hand - extremely extended single stroke pattern';
  } else if (allText.includes('speed: single stroke slow')) {
    // Keep as is but ensure it's correct - maybe lower BPM
    fixed.bpm = Math.min(fixed.bpm || 60, 60);
    fixed.description = 'Slow single stroke speed building - start here (60 BPM)';
  } else if (allText.includes('speed: single stroke moderate')) {
    // Moderate tempo
    fixed.bpm = 80;
    fixed.description = 'Moderate tempo single stroke speed (80 BPM)';
  } else if (allText.includes('speed: single stroke fast')) {
    // Fast tempo
    fixed.bpm = 120;
    fixed.description = 'Fast single stroke speed (120 BPM)';
  } else if (allText.includes('speed: single stroke accelerating')) {
    // This could be a pattern that accelerates, or just a name
    fixed.bpm = 100;
    fixed.description = 'Accelerating single stroke pattern - practice gradually increasing speed';
  } else if (allText.includes('speed: extreme single stroke')) {
    // Very fast
    fixed.bpm = 140;
    fixed.description = 'Extreme single stroke speed challenge (140+ BPM)';
  } else if (allText.includes('speed: double stroke fast')) {
    fixed.bpm = 120;
    fixed.description = 'Fast double stroke speed (120 BPM)';
  } else if (allText.includes('speed: extreme double stroke')) {
    fixed.bpm = 140;
    fixed.description = 'Extreme double stroke speed challenge (140+ BPM)';
  } else if (allText.includes('speed: paradiddle fast')) {
    fixed.bpm = 120;
    fixed.description = 'Fast paradiddle speed (120 BPM)';
  } else if (allText.includes('mixed subdivision: 16th-8th')) {
    // Mix of 16th and 8th notes
    fixed.drumPattern = 'S S S S S S S S S S S S S S S S';
    fixed.stickingPattern = 'R L R L R L R L R L R L R L R L';
    fixed.phrase = '4 2 4 2 4'; // Mixed phrase
    fixed.description = 'Mixed subdivision pattern: 16th notes and 8th notes';
  } else if (allText.includes('mixed subdivision: quarter-16th')) {
    // Mix of quarter and 16th
    fixed.drumPattern = 'S S S S S S S S S S S S S S S S';
    fixed.stickingPattern = 'R L R L R L R L R L R L R L R L';
    fixed.phrase = '1 4 1 4 1 4 1'; // Mixed phrase
    fixed.description = 'Mixed subdivision pattern: quarter notes and 16th notes';
  } else if (allText.includes('mixed subdivision: complex')) {
    // Complex mixed pattern
    fixed.drumPattern = 'S S S S S S S S S S S S S S S S';
    fixed.stickingPattern = 'R L R L R L R L R L R L R L R L';
    fixed.phrase = '3 3 2 2 3 3'; // Complex phrase
    fixed.description = 'Complex mixed subdivision pattern with varying note values';
  } else if (allText.includes('phrase variation: 2+2+4')) {
    // This should be a phrase variation, not just single strokes
    fixed.phrase = '2 2 4';
    fixed.description = 'Phrase variation: 2+2+4 pattern - develops phrasing';
  } else if (allText.includes('phrase variation: 6+6+4')) {
    fixed.phrase = '6 6 4';
    fixed.description = 'Phrase variation: 6+6+4 pattern - extended phrasing';
  } else if (allText.includes('phrase variation: 5+5+3+3')) {
    fixed.phrase = '5 5 3 3';
    fixed.description = 'Phrase variation: 5+5+3+3 pattern - complex phrasing';
  } else if (allText.includes('warm-up: single stroke')) {
    // Warmup patterns can stay similar but maybe adjust BPM
    if (allText.includes('quarter')) {
      fixed.bpm = 60;
    } else if (allText.includes('eighth')) {
      fixed.bpm = 70;
    } else if (allText.includes('triplet')) {
      fixed.bpm = 75;
    } else if (allText.includes('32nd')) {
      fixed.bpm = 80;
    }
  } else if (allText.includes('famous fill') || allText.includes('famous beat')) {
    // These should be unique transcriptions - we'll need to research actual patterns
    // For now, mark them as needing research
    fixed.description = (fixed.description || '') + ' [NEEDS AUTHENTIC TRANSCRIPTION]';
  }
  
  return fixed;
});

// Add fixed presets back
const allPresets = [...currentData.presets, ...fixedPresets];

// Update version
currentData.version = '1.34';
currentData.presets = allPresets;

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(currentData, null, 2), 'utf8');

console.log(`\n=== SUMMARY ===`);
console.log(`Restored and fixed: ${fixedPresets.length} presets`);
console.log(`Total presets now: ${allPresets.length}`);
console.log(`\n✅ Updated presets file: ${presetsPath}`);
console.log(`\n⚠️  Note: Famous beats/fills marked as needing authentic transcriptions`);

