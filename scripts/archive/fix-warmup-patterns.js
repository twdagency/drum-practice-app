/**
 * Fix Warmup Patterns
 * 
 * Ensures warmup patterns have appropriate difficulty progression
 */

const fs = require('fs');
const path = require('path');

// Load presets
const presetsPath = path.join(__dirname, '../public/practice-presets.json');
const presetsData = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));

// Fix each preset
const fixedPresets = presetsData.presets.map(preset => {
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const allText = `${name} ${description}`;
  const tags = (preset.tags || []).map(t => t.toLowerCase()).join(' ');
  const fullText = `${allText} ${tags}`;
  
  let fixed = { ...preset };
  
  // === WARMUP PATTERNS ===
  
  if (fullText.includes('warm-up') || fullText.includes('warmup')) {
    // Warmup patterns should start easy and progress
    // Ensure BPM is appropriate for warmup (typically slower)
    if (!fixed.bpm || fixed.bpm > 100) {
      // Warmups should be slower, typically 60-80 BPM
      if (fixed.subdivision <= 4) {
        fixed.bpm = 60; // Very slow for quarter notes
      } else if (fixed.subdivision <= 8) {
        fixed.bpm = 70; // Slow for eighth notes
      } else {
        fixed.bpm = 80; // Moderate for sixteenth notes
      }
    }
    
    // Warmup patterns should have appropriate difficulty
    if (!fixed.difficulty || fixed.difficulty > 3) {
      // Warmups should be beginner to intermediate (1-3)
      if (fixed.subdivision <= 4) {
        fixed.difficulty = 1;
      } else if (fixed.subdivision <= 8) {
        fixed.difficulty = 2;
      } else {
        fixed.difficulty = 3;
      }
    }
    
    // Ensure description mentions warmup purpose
    if (fixed.description && !fixed.description.toLowerCase().includes('warm')) {
      fixed.description = fixed.description.replace(/\.$/, '') + ' - ideal for warming up';
    }
    
    // Warmup patterns should have longer repeat for extended practice
    if (!fixed.repeat || fixed.repeat < 4) {
      fixed.repeat = 8; // Longer repeats for warmup
    }
  }
  
  // === CLEAN UP DESCRIPTIONS ===
  
  if (fixed.description) {
    fixed.description = fixed.description
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  return fixed;
});

// Update version
presetsData.version = '1.48';
presetsData.presets = fixedPresets;

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log('=== FIXED WARMUP PATTERNS ===\n');
console.log(`Total presets: ${fixedPresets.length}`);
console.log(`\n✅ Set appropriate BPM for warmup patterns (60-80 BPM)`);
console.log(`✅ Adjusted difficulty levels (1-3 for warmups)`);
console.log(`✅ Increased repeat count for extended practice`);
console.log(`✅ Enhanced descriptions with warmup context`);

