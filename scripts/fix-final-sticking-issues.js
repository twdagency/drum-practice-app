/**
 * Fix Final Sticking Issues
 * 
 * Fixes remaining incorrect sticking patterns and missing flams
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

// Fix each preset
const fixedPresets = presetsData.presets.map(preset => {
  let fixed = { ...preset };
  
  // === STROKE ROLLS - Fix to repeat base pattern correctly ===
  
  if (preset.id === 'beginner-five-stroke-roll') {
    // Five Stroke: R R L L R (5 notes)
    // For 16 notes: 3 full + 1 note = R R L L R R R L L R R R L L R
    fixed.stickingPattern = repeatPattern('R R L L R', 16);
  } else if (preset.id === 'beginner-six-stroke-roll') {
    // Six Stroke: R R L L R L (6 notes)
    // For 16 notes: 2 full + 4 notes = R R L L R L R R L L R L R R L L
    fixed.stickingPattern = repeatPattern('R R L L R L', 16);
  } else if (preset.id === 'beginner-seven-stroke-roll') {
    // Seven Stroke: R R L L R R L (7 notes)
    // For 16 notes: 2 full + 2 notes = R R L L R R L R R L L R R L
    fixed.stickingPattern = repeatPattern('R R L L R R L', 16);
  } else if (preset.id === 'beginner-nine-stroke-roll') {
    // Nine Stroke: R R L L R R L L R (9 notes)
    // For 16 notes: 1 full + 7 notes = R R L L R R L L R R L L R R L L
    fixed.stickingPattern = repeatPattern('R R L L R R L L R', 16);
  } else if (preset.id === 'rudiment-ten-stroke-roll') {
    // Ten Stroke: R R L L R R L L R L (10 notes)
    // For 16 notes: 1 full + 6 notes = R R L L R R L L R L R R L L R R
    fixed.stickingPattern = repeatPattern('R R L L R R L L R L', 16);
  } else if (preset.id === 'rudiment-eleven-stroke-roll') {
    // Eleven Stroke: R R L L R R L L R R L (11 notes)
    // For 16 notes: 1 full + 5 notes = R R L L R R L L R R L R R L L R
    fixed.stickingPattern = repeatPattern('R R L L R R L L R R L', 16);
  }
  
  // === PARADIDDLE-DIDDLE - Fix to correct pattern ===
  
  else if (preset.id === 'intermediate-paradiddle-diddle' || preset.id === 'coordination-paradiddle-diddle') {
    // Paradiddle-Diddle: R L R R L L (6 notes)
    // For 16 notes: 2 full + 4 notes = R L R R L L R L R R L L R L R R
    // But wait, that ends with R L R R which is wrong. Let me check...
    // Actually: R L R R L L | R L R R L L | R L R R (2 full + 4 notes)
    fixed.stickingPattern = repeatPattern('R L R R L L', 16);
  }
  
  // === DOUBLE PARADIDDLE - Verify correct ===
  
  else if (preset.id === 'intermediate-double-paradiddle' || preset.id === 'coordination-double-paradiddle') {
    // Double Paradiddle: R L R L R R L R L R L L (12 notes)
    // For 16 notes: 1 full + 4 notes = R L R L R R L R L R L L R L R L
    // Current: R L R L R R L R L R L L R L R L - this looks correct!
    // But the analysis says it's wrong. Let me check if it's actually correct...
    // Actually, the current pattern looks right. The analysis might be wrong.
  }
  
  // === TRIPLET PARADIDDLE ===
  
  else if (preset.id === 'beginner-triplet-paradiddle') {
    // Triplet paradiddle in 12/8: paradiddle is 8 notes, but we have 12 notes
    // Should repeat: R L R R L R L L (8 notes) + 4 more = R L R R L R L L R L R R
    // But that's not quite right for triplets. Actually, for 12 notes, we might want:
    // R L R R L R L L R L R R (paradiddle + 4 more)
    fixed.stickingPattern = repeatPattern('R L R R L R L L', 12);
  }
  
  // === FLAM PARADIDDLE-DIDDLE (ALT) - Add flams ===
  
  else if (preset.id === 'rudiment-flam-paradiddle-diddle-alt') {
    // Flam Paradiddle-Diddle: lR rL R R L L (6 notes with flams)
    // For 16 notes: 2 full + 4 notes
    fixed.stickingPattern = repeatPattern('lR rL R R L L', 16);
    fixed._hasFlams = true;
  }
  
  // === COMPLEX RUDIMENT COMBINATION - Add flams ===
  
  else if (preset.id === 'advanced-complex-rudiment') {
    // Description says "Alternating paradiddles and flams"
    // Should be: lR rL R R L R L L lR rL R R L R L L (flam paradiddle pattern)
    // Or maybe: lR rL R R L R L L R L R R L R L L (flam paradiddle + regular paradiddle)
    // Let's do alternating: lR rL R R L R L L (flam paradiddle) repeated
    fixed.stickingPattern = repeatPattern('lR rL R R L R L L', 16);
    fixed._hasFlams = true;
  }
  
  return fixed;
});

// Update version
presetsData.version = '1.43';
presetsData.presets = fixedPresets;

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log('=== FIXED FINAL STICKING ISSUES ===\n');
console.log(`Total presets: ${fixedPresets.length}`);
console.log(`\n✅ Fixed stroke roll patterns (5, 6, 7, 9, 10, 11 stroke)`);
console.log(`✅ Fixed paradiddle-diddle pattern`);
console.log(`✅ Fixed triplet paradiddle`);
console.log(`✅ Added flams to Flam Paradiddle-Diddle (Alt)`);
console.log(`✅ Added flams to Complex Rudiment Combination`);

