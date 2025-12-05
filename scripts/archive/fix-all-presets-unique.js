/**
 * Fix All Presets - Make Unique Instead of Deleting
 * 
 * Applies all fixes and makes duplicate patterns unique and correct
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

// Apply all fixes from previous scripts
const fixedPresets = presetsData.presets.map(preset => {
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const allText = `${name} ${description}`;
  const tags = (preset.tags || []).map(t => t.toLowerCase()).join(' ');
  const fullText = `${allText} ${tags}`;
  
  let fixed = { ...preset };
  const notesPerBar = calculateNotesPerBar(preset.timeSignature, preset.subdivision);
  
  // === RUDIMENT FIXES (from previous scripts) ===
  
  // Stroke rolls
  if (fullText.includes('five stroke roll') && !fullText.includes('finger')) {
    fixed.stickingPattern = repeatPattern('R R L L R', notesPerBar);
  } else if (fullText.includes('six stroke roll')) {
    fixed.stickingPattern = repeatPattern('R R L L R L', notesPerBar);
  } else if (fullText.includes('seven stroke roll')) {
    fixed.stickingPattern = repeatPattern('R R L L R R L', notesPerBar);
  } else if (fullText.includes('nine stroke roll')) {
    fixed.stickingPattern = repeatPattern('R R L L R R L L R', notesPerBar);
  } else if (fullText.includes('ten stroke roll')) {
    fixed.stickingPattern = repeatPattern('R R L L R R L L R L', notesPerBar);
  } else if (fullText.includes('eleven stroke roll')) {
    fixed.stickingPattern = repeatPattern('R R L L R R L L R R L', notesPerBar);
  } else if (fullText.includes('thirteen stroke roll')) {
    fixed.stickingPattern = repeatPattern('R R L L R R L L R R L L R', notesPerBar);
  } else if (fullText.includes('fifteen stroke roll')) {
    fixed.stickingPattern = repeatPattern('R R L L R R L L R R L L R R L', notesPerBar);
  } else if (fullText.includes('seventeen stroke roll')) {
    fixed.stickingPattern = repeatPattern('R R L L R R L L R R L L R R L L R', notesPerBar);
  }
  
  // Flam patterns
  if (fullText.includes('flam paradiddle-diddle') && !fullText.includes('alt')) {
    fixed.stickingPattern = repeatPattern('lR rL R R L L', notesPerBar);
    fixed._hasFlams = true;
  } else if (fullText.includes('flam paradiddle-diddle') && fullText.includes('alt')) {
    fixed.stickingPattern = repeatPattern('lR rL R R L L', notesPerBar);
    fixed._hasFlams = true;
  } else if (fullText.includes('flam paradiddle') && !fullText.includes('diddle')) {
    fixed.stickingPattern = repeatPattern('lR rL R R L R L L', notesPerBar);
    fixed._hasFlams = true;
  } else if (fullText.includes('single flammed mill')) {
    fixed.stickingPattern = repeatPattern('lR rL lR rL', notesPerBar);
    fixed._hasFlams = true;
  }
  
  // Paradiddle variations
  if (fullText.includes('paradiddle-diddle') && !fullText.includes('flam')) {
    fixed.stickingPattern = repeatPattern('R L R R L L', notesPerBar);
  } else if (fullText.includes('inverted paradiddle')) {
    fixed.stickingPattern = repeatPattern('R L L R L R R L', notesPerBar);
  } else if (fullText.includes('quarter paradiddle') && preset.subdivision === 4) {
    // Fix quarter note paradiddle to use 8th notes
    fixed.subdivision = 8;
    fixed.phrase = '2 2 2 2';
    fixed.drumPattern = 'S S S S S S S S';
    fixed.stickingPattern = 'R L R R L R L L';
  }
  
  // Double stroke fixes
  if (fullText.includes('double stroke') && !fullText.includes('roll')) {
    fixed.stickingPattern = repeatPattern('R R L L', notesPerBar);
  }
  
  // Complex rudiment combination
  if (fullText.includes('complex rudiment combination') && !fullText.includes('coordination')) {
    fixed.stickingPattern = repeatPattern('lR rL R R L R L L', notesPerBar);
    fixed._hasFlams = true;
  }
  
  // === MAKE DUPLICATES UNIQUE ===
  
  // Single Stroke variations
  if (fullText.includes('single stroke five')) {
    fixed.stickingPattern = repeatPattern('R R R R R L L L L L', notesPerBar);
    fixed.description = 'Five strokes per hand (R R R R R L L L L L) - builds control and speed';
  } else if (fullText.includes('single stroke seven')) {
    fixed.stickingPattern = repeatPattern('R R R R R R R L L L L L L L', notesPerBar);
    fixed.description = 'Seven strokes per hand - extended single stroke pattern';
  } else if (fullText.includes('single stroke nine')) {
    fixed.stickingPattern = repeatPattern('R R R R R R R R R L L L L L L L L L', notesPerBar);
    fixed.description = 'Nine strokes per hand - extended single stroke pattern';
  } else if (fullText.includes('single stroke thirteen')) {
    const pattern = 'R R R R R R R R R R R R R L L L L L L L L L L L L';
    fixed.stickingPattern = repeatPattern(pattern, notesPerBar);
    fixed.description = 'Thirteen strokes per hand - very extended single stroke pattern';
  } else if (fullText.includes('single stroke fifteen')) {
    const pattern = 'R R R R R R R R R R R R R R R L L L L L L L L L L L L L L';
    fixed.stickingPattern = repeatPattern(pattern, notesPerBar);
    fixed.description = 'Fifteen strokes per hand - extremely extended single stroke pattern';
  }
  
  // Speed variations - differentiate by BPM and description
  if (fullText.includes('speed: single stroke slow')) {
    fixed.bpm = 60;
    fixed.description = 'Slow single stroke speed building - start here (60 BPM)';
  } else if (fullText.includes('speed: single stroke moderate')) {
    fixed.bpm = 80;
    fixed.description = 'Moderate tempo single stroke speed (80 BPM)';
  } else if (fullText.includes('speed: single stroke fast')) {
    fixed.bpm = 120;
    fixed.description = 'Fast single stroke speed (120 BPM)';
  } else if (fullText.includes('speed: single stroke accelerating')) {
    fixed.bpm = 100;
    fixed.description = 'Accelerating single stroke pattern - practice gradually increasing speed from 80 to 120 BPM';
  } else if (fullText.includes('speed: extreme single stroke')) {
    fixed.bpm = 140;
    fixed.description = 'Extreme single stroke speed challenge (140+ BPM)';
  } else if (fullText.includes('speed: double stroke fast')) {
    fixed.bpm = 120;
    fixed.description = 'Fast double stroke speed (120 BPM)';
  } else if (fullText.includes('speed: extreme double stroke')) {
    fixed.bpm = 140;
    fixed.description = 'Extreme double stroke speed challenge (140+ BPM)';
  } else if (fullText.includes('speed: paradiddle fast')) {
    fixed.bpm = 120;
    fixed.description = 'Fast paradiddle speed (120 BPM)';
  }
  
  // Mixed subdivision patterns
  if (fullText.includes('mixed subdivision: 16th-8th')) {
    fixed.phrase = '4 2 4 2 4';
    fixed.description = 'Mixed subdivision pattern: alternating 16th notes and 8th notes';
  } else if (fullText.includes('mixed subdivision: quarter-16th')) {
    fixed.phrase = '1 4 1 4 1 4 1';
    fixed.description = 'Mixed subdivision pattern: quarter notes and 16th notes';
  } else if (fullText.includes('mixed subdivision: complex')) {
    fixed.phrase = '3 3 2 2 3 3';
    fixed.description = 'Complex mixed subdivision pattern with varying note values';
  }
  
  // Phrase variations
  if (fullText.includes('phrase variation: 2+2+4')) {
    fixed.phrase = '2 2 4';
    fixed.description = 'Phrase variation: 2+2+4 pattern - develops phrasing and musicality';
  } else if (fullText.includes('phrase variation: 6+6+4')) {
    fixed.phrase = '6 6 4';
    fixed.description = 'Phrase variation: 6+6+4 pattern - extended phrasing';
  } else if (fullText.includes('phrase variation: 5+5+3+3')) {
    fixed.phrase = '5 5 3 3';
    fixed.description = 'Phrase variation: 5+5+3+3 pattern - complex phrasing';
  }
  
  // Warmup patterns - adjust BPMs to differentiate
  if (fullText.includes('warm-up: single stroke')) {
    if (fullText.includes('quarter')) {
      fixed.bpm = 60;
      fixed.description = 'Warm-up: Single stroke roll in quarter notes - slow tempo for warming up';
    } else if (fullText.includes('eighth')) {
      fixed.bpm = 70;
      fixed.description = 'Warm-up: Single stroke roll in eighth notes - moderate tempo for warming up';
    } else if (fullText.includes('triplet')) {
      fixed.bpm = 75;
      fixed.description = 'Warm-up: Single stroke roll in triplets - moderate tempo for warming up';
    } else if (fullText.includes('32nd')) {
      fixed.bpm = 80;
      fixed.description = 'Warm-up: Single stroke roll in 32nd notes - faster tempo for warming up';
    }
  }
  
  // Groove patterns - these should be unique but many are identical
  // We'll need to research actual patterns, but for now mark them
  if (fullText.includes('groove:') && (fullText.includes('funk') || fullText.includes('latin') || fullText.includes('disco') || fullText.includes('pop rock'))) {
    if (!fixed.description.includes('[NEEDS')) {
      fixed.description = (fixed.description || '') + ' [PATTERN NEEDS VERIFICATION]';
    }
  }
  
  // Famous beats/fills - mark as needing research
  if (fullText.includes('famous')) {
    if (!fixed.description.includes('[NEEDS')) {
      fixed.description = (fixed.description || '') + ' [NEEDS AUTHENTIC TRANSCRIPTION]';
    }
  }
  
  return fixed;
});

// Update version
presetsData.version = '1.35';
presetsData.presets = fixedPresets;

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log('=== FIXED ALL PRESETS ===\n');
console.log(`Total presets: ${fixedPresets.length}`);
console.log(`\n✅ Applied all fixes and made duplicates unique`);
console.log(`⚠️  Note: Some patterns marked as needing verification/transcription`);

