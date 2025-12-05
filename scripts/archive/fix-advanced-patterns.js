/**
 * Fix Advanced Patterns
 * 
 * Ensures advanced patterns have correct flam/drag notation and complexity
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
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const allText = `${name} ${description}`;
  const tags = (preset.tags || []).map(t => t.toLowerCase()).join(' ');
  const fullText = `${allText} ${tags}`;
  
  let fixed = { ...preset };
  const notesPerBar = fixed.subdivision * parseInt(fixed.timeSignature.split('/')[0]) / parseInt(fixed.timeSignature.split('/')[1]);
  const stickingTokens = parseTokens(fixed.stickingPattern || '');
  
  // === FLAM PATTERNS ===
  
  if (fullText.includes('flam') && !fullText.includes('drag')) {
    // Flam patterns should have lR or rL notation
    const hasFlams = stickingTokens.some(t => t.includes('lR') || t.includes('rL'));
    
    if (!hasFlams && fixed._hasFlams !== false) {
      // Add flams to the pattern
      // For flam patterns, typically every other note or specific pattern
      const newSticking = stickingTokens.map((token, index) => {
        // Alternate flams: lR on even indices, rL on odd (or vice versa)
        if (token === 'R' || token === 'L') {
          return index % 2 === 0 ? 'lR' : 'rL';
        }
        return token;
      });
      fixed.stickingPattern = newSticking.join(' ');
      fixed._hasFlams = true;
    }
  }
  
  // === DRAG PATTERNS ===
  
  if (fullText.includes('drag') && !fullText.includes('flam')) {
    // Drag patterns should have llR or llL notation (double grace notes)
    const hasDrags = stickingTokens.some(t => t.includes('llR') || t.includes('llL') || t.includes('lllR') || t.includes('lllL'));
    
    if (!hasDrags) {
      // Add drags to the pattern
      const newSticking = stickingTokens.map((token, index) => {
        // Single drag: llR or llL
        if (token === 'R') {
          return 'llR';
        } else if (token === 'L') {
          return 'llL';
        }
        return token;
      });
      fixed.stickingPattern = newSticking.join(' ');
    }
  }
  
  // === RUFF PATTERNS ===
  
  if (fullText.includes('ruff')) {
    // Ruff patterns should have lllR or lllL notation (triple grace notes)
    const hasRuffs = stickingTokens.some(t => t.includes('lllR') || t.includes('lllL'));
    
    if (!hasRuffs) {
      const newSticking = stickingTokens.map((token, index) => {
        // Ruff: lllR or lllL
        if (token === 'R') {
          return 'lllR';
        } else if (token === 'L') {
          return 'lllL';
        }
        return token;
      });
      fixed.stickingPattern = newSticking.join(' ');
    }
  }
  
  // === ADVANCED PATTERNS SHOULD HAVE HIGHER DIFFICULTY ===
  
  if (fixed.category === 'advanced' || fullText.includes('advanced')) {
    if (!fixed.difficulty || fixed.difficulty < 6) {
      // Advanced patterns should be difficulty 6-9
      const baseDifficulty = 6;
      let additionalDifficulty = 0;
      
      // Increase difficulty based on complexity
      if (fullText.includes('flam') || fullText.includes('drag') || fullText.includes('ruff')) {
        additionalDifficulty += 1;
      }
      if (fixed.subdivision >= 16) {
        additionalDifficulty += 1;
      }
      if (fullText.includes('combination') || fullText.includes('complex')) {
        additionalDifficulty += 1;
      }
      
      fixed.difficulty = Math.min(9, baseDifficulty + additionalDifficulty);
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
presetsData.version = '1.49';
presetsData.presets = fixedPresets;

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log('=== FIXED ADVANCED PATTERNS ===\n');
console.log(`Total presets: ${fixedPresets.length}`);
console.log(`\n✅ Verified flam notation in flam patterns`);
console.log(`✅ Verified drag notation in drag patterns`);
console.log(`✅ Verified ruff notation in ruff patterns`);
console.log(`✅ Set appropriate difficulty levels (6-9 for advanced)`);

