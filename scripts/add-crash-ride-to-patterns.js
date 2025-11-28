/**
 * Add Crash (C) and Ride (Y) cymbals to patterns that should have them
 * - Fills typically end with a crash cymbal
 * - Some beats use ride cymbal instead of hi-hat
 */

const fs = require('fs');
const path = require('path');

const presetsPath = path.join(__dirname, '../public/practice-presets.json');

// Load presets
const presetsData = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));
const presets = presetsData.presets || [];

let updatedCount = 0;

// Patterns that should end with crash cymbal (fills)
const fillsToUpdate = [
  {
    id: 'famous-fill-peart-tom-sawyer',
    // Tom Sawyer fill typically ends with crash
    // Current: "T T T T F F F F T T T T S+K S+K S+K S+K"
    // Should end with crash on the last note or after
    newPattern: 'T T T T F F F F T T T T S+K S+K S+K C',
    newSticking: 'R L R L R L R L R L R L K K K R' // Crash is right hand
  },
  {
    id: 'famous-fill-collins-air-tonight',
    // In the Air Tonight fill ends with crash
    // Current: "T T T T F F F F T T T T S+K S+K S+K S+K"
    newPattern: 'T T T T F F F F T T T T S+K S+K S+K C',
    newSticking: 'R L R L R L R L R L R L K K K R'
  },
  {
    id: 'famous-fill-grohl-teen-spirit',
    // Smells Like Teen Spirit fill ends with crash
    // Current: "S+K S+K S+K S+K S+K S+K S+K S+K S+K S+K S+K S+K S+K S+K S+K S+K"
    newPattern: 'S+K S+K S+K S+K S+K S+K S+K S+K S+K S+K S+K S+K S+K S+K S+K C',
    newSticking: 'K K K K K K K K K K K K K K K R'
  },
  {
    id: 'famous-fill-moon-wont-get-fooled',
    // Won't Get Fooled Again fill ends with crash
    // Need to check current pattern first
  }
];

// Process presets
presets.forEach((preset) => {
  // Update famous fills that should end with crash
  const fillUpdate = fillsToUpdate.find(f => f.id === preset.id);
  if (fillUpdate && fillUpdate.newPattern) {
    const oldPattern = preset.drumPattern;
    const oldSticking = preset.stickingPattern;
    
    preset.drumPattern = fillUpdate.newPattern;
    preset.stickingPattern = fillUpdate.newSticking;
    
    console.log(`\n✅ Updated: ${preset.name}`);
    console.log(`   Old drum: ${oldPattern}`);
    console.log(`   New drum: ${preset.drumPattern}`);
    console.log(`   Old sticking: ${oldSticking}`);
    console.log(`   New sticking: ${preset.stickingPattern}`);
    
    updatedCount++;
  }
  
  // Check for Keith Moon fill (need to see current pattern)
  if (preset.id === 'famous-fill-moon-wont-get-fooled') {
    // This fill is complex, might need manual review
    // For now, if it doesn't end with crash, add it
    if (!preset.drumPattern.includes('C') && preset.drumPattern.trim().split(/\s+/).length > 0) {
      const tokens = preset.drumPattern.trim().split(/\s+/);
      const lastToken = tokens[tokens.length - 1];
      // If last token is not a crash, replace it or add crash after
      if (lastToken !== 'C') {
        tokens[tokens.length - 1] = 'C';
        preset.drumPattern = tokens.join(' ');
        
        // Update sticking - crash is right hand
        const stickingTokens = preset.stickingPattern.trim().split(/\s+/);
        if (stickingTokens.length === tokens.length) {
          stickingTokens[stickingTokens.length - 1] = 'R';
          preset.stickingPattern = stickingTokens.join(' ');
        }
        
        console.log(`\n✅ Updated: ${preset.name}`);
        console.log(`   Added crash cymbal at end`);
        updatedCount++;
      }
    }
  }
});

// Save updated presets
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log(`\n\n📊 Summary:`);
console.log(`   Updated: ${updatedCount} patterns`);
console.log(`\n✅ Presets updated and saved to ${presetsPath}`);


