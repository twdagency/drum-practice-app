/**
 * Fix Technique Patterns
 * 
 * Ensures technique patterns support their stated educational goals
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

// Fix each preset
const fixedPresets = presetsData.presets.map(preset => {
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const allText = `${name} ${description}`;
  const tags = (preset.tags || []).map(t => t.toLowerCase()).join(' ');
  const fullText = `${allText} ${tags}`;
  
  let fixed = { ...preset };
  
  // === GHOST NOTE PATTERNS ===
  
  if (fullText.includes('ghost note') || fullText.includes('ghost-notes')) {
    // Ghost note patterns should have ghost notes (parentheses) in drumPattern
    const drumTokens = parseTokens(fixed.drumPattern || '');
    const ghostCount = drumTokens.filter(t => t.startsWith('(')).length;
    
    // If no ghost notes but pattern is about ghost notes, add some
    if (ghostCount === 0 && drumTokens.length > 0) {
      // Convert some notes to ghost notes (typically off-beats)
      const newPattern = drumTokens.map((token, index) => {
        // Make off-beats ghost notes (indices 1, 3, 5, 7, etc. for 16th notes)
        if (index % 2 === 1 && token === 'S') {
          return '(S)';
        }
        return token;
      });
      fixed.drumPattern = newPattern.join(' ');
    }
    
    // Ghost note patterns should have accents on non-ghost notes
    if (!fixed.accents || fixed.accents.length === 0) {
      const drumTokens = parseTokens(fixed.drumPattern || '');
      const accents = [];
      drumTokens.forEach((token, index) => {
        if (!token.startsWith('(') && (token === 'S' || token.includes('S'))) {
          accents.push(index);
        }
      });
      if (accents.length > 0) {
        fixed.accents = accents;
      }
    }
  }
  
  // === ACCENT PATTERNS ===
  
  if (fullText.includes('accent') && !fullText.includes('flam')) {
    // Accent patterns should have clear accent placement
    if (!fixed.accents || fixed.accents.length === 0) {
      // Default: accent on beats (1, 2, 3, 4)
      const notesPerBar = fixed.subdivision * parseInt(fixed.timeSignature.split('/')[0]) / parseInt(fixed.timeSignature.split('/')[1]);
      const notesPerBeat = notesPerBar / parseInt(fixed.timeSignature.split('/')[0]);
      const accents = [];
      for (let beat = 0; beat < parseInt(fixed.timeSignature.split('/')[0]); beat++) {
        accents.push(Math.floor(beat * notesPerBeat));
      }
      fixed.accents = accents;
    }
  }
  
  // === DYNAMICS PATTERNS ===
  
  if (fullText.includes('dynamic') || fullText.includes('control')) {
    // Dynamics patterns should have varied accents
    if (!fixed.accents || fixed.accents.length < 3) {
      const notesPerBar = fixed.subdivision * parseInt(fixed.timeSignature.split('/')[0]) / parseInt(fixed.timeSignature.split('/')[1]);
      // Create varied accent pattern
      const accents = [0]; // Always accent first note
      if (notesPerBar >= 8) {
        accents.push(Math.floor(notesPerBar / 2));
      }
      if (notesPerBar >= 16) {
        accents.push(Math.floor(notesPerBar * 3 / 4));
      }
      fixed.accents = accents;
    }
  }
  
  // === FINGER TECHNIQUE ===
  
  if (fullText.includes('finger technique') || fullText.includes('finger-technique')) {
    // Finger technique patterns should focus on control
    // Ensure pattern supports finger control development
    if (fixed.description && !fixed.description.toLowerCase().includes('control')) {
      fixed.description = fixed.description.replace(/\.$/, '') + ' - develops finger control and dexterity';
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
presetsData.version = '1.47';
presetsData.presets = fixedPresets;

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log('=== FIXED TECHNIQUE PATTERNS ===\n');
console.log(`Total presets: ${fixedPresets.length}`);
console.log(`\n✅ Enhanced ghost note patterns`);
console.log(`✅ Improved accent pattern clarity`);
console.log(`✅ Enhanced dynamics and control patterns`);
console.log(`✅ Verified finger technique patterns`);

