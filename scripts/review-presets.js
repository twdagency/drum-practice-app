/**
 * Script to review all presets for correctness
 * Checks:
 * - Sticking pattern matches drum pattern note count
 * - Phrase values match subdivision
 * - Subdivision is correct for time signature
 * - Rudiment patterns are correct
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

function parseNumberList(str) {
  if (!str) return [];
  return str.split(/\s+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
}

function countNotesInPattern(pattern) {
  const tokens = parseTokens(pattern);
  let count = 0;
  tokens.forEach(token => {
    // Remove parentheses for ghost notes, but still count them
    const cleanToken = token.replace(/[()]/g, '');
    // Handle simultaneous hits (e.g., "S+K" counts as 1 note position)
    if (cleanToken.includes('+')) {
      count++;
    } else if (cleanToken.length > 0 && cleanToken !== 'R') {
      count++;
    }
  });
  return count;
}

function countStickingNotes(sticking) {
  const tokens = parseTokens(sticking);
  let count = 0;
  tokens.forEach(token => {
    const upper = token.toUpperCase();
    // Count R, L, K, but not flam indicators (l, r)
    if (upper === 'R' || upper === 'L' || upper === 'K') {
      count++;
    } else if (token.length > 1 && (token.includes('R') || token.includes('L'))) {
      // Handle flams like "lR" or "rL" - count the main note
      if (token.endsWith('R') || token.endsWith('L')) {
        count++;
      }
    }
  });
  return count;
}

function calculateNotesPerBar(timeSignature, subdivision) {
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  const beatValue = denominator;
  const notesPerBeat = subdivision / beatValue;
  return numerator * notesPerBeat;
}

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
};

// Issues found
const issues = [];
const warnings = [];

presetsData.presets.forEach((preset, index) => {
  const presetIssues = [];
  const presetWarnings = [];
  
  // Check 1: Phrase sum should match notes per bar
  const phraseValues = parseNumberList(preset.phrase);
  const phraseSum = phraseValues.reduce((sum, val) => sum + val, 0);
  const notesPerBar = calculateNotesPerBar(preset.timeSignature, preset.subdivision);
  
  if (phraseSum !== notesPerBar) {
    presetIssues.push(`Phrase sum (${phraseSum}) doesn't match notes per bar (${notesPerBar})`);
  }
  
  // Check 2: Drum pattern note count should match notes per bar
  const drumPatternCount = countNotesInPattern(preset.drumPattern);
  if (drumPatternCount !== notesPerBar) {
    presetIssues.push(`Drum pattern has ${drumPatternCount} notes, expected ${notesPerBar}`);
  }
  
  // Check 3: Sticking pattern should match drum pattern (or be close for independence patterns)
  const stickingCount = countStickingNotes(preset.stickingPattern);
  // For patterns with kick (K), sticking might have fewer notes
  const hasKick = preset.drumPattern.includes('K') || preset.stickingPattern.includes('K');
  if (!hasKick && stickingCount !== drumPatternCount) {
    presetWarnings.push(`Sticking count (${stickingCount}) doesn't match drum pattern count (${drumPatternCount})`);
  }
  
  // Check 4: Verify rudiment patterns if it's a rudiment
  if (preset.subcategory === 'rudiments' || preset.tags.some(t => t.includes('rudiment'))) {
    const nameLower = preset.name.toLowerCase();
    const descriptionLower = (preset.description || '').toLowerCase();
    const allText = `${nameLower} ${descriptionLower} ${preset.tags.join(' ')}`;
    
    // Check if it matches a known rudiment pattern (check most specific first)
    let matchedRudiment = null;
    let matchedSticking = null;
    
    // Check in order of specificity (most specific first)
    const rudimentChecks = [
      ['triple-paradiddle', 'triple paradiddle'],
      ['double-paradiddle', 'double paradiddle'],
      ['paradiddle-diddle', 'paradiddle diddle', 'paradiddle-diddle'],
      ['flam-paradiddle', 'flam paradiddle'],
      ['paradiddle', 'paradiddle'],
      ['triple-ratamacue', 'triple ratamacue'],
      ['double-ratamacue', 'double ratamacue'],
      ['single-ratamacue', 'single ratamacue'],
      ['flam-tap', 'flam tap', 'flam accent'],
      ['single-drag-tap', 'single drag tap', 'single-drag-tap'],
      ['double-drag-tap', 'double drag tap', 'double-drag-tap'],
      ['swiss-army-triplet', 'swiss army triplet'],
      ['seventeen-stroke-roll', 'seventeen stroke roll', '17-stroke'],
      ['fifteen-stroke-roll', 'fifteen stroke roll', '15-stroke'],
      ['thirteen-stroke-roll', 'thirteen stroke roll', '13-stroke'],
      ['eleven-stroke-roll', 'eleven stroke roll', '11-stroke'],
      ['ten-stroke-roll', 'ten stroke roll', '10-stroke'],
      ['nine-stroke-roll', 'nine stroke roll', '9-stroke'],
      ['seven-stroke-roll', 'seven stroke roll', '7-stroke'],
      ['six-stroke-roll', 'six stroke roll', '6-stroke'],
      ['five-stroke-roll', 'five stroke roll', '5-stroke'],
      ['single-stroke-four', 'single stroke four'],
      ['double-stroke-roll', 'double stroke roll', 'double-stroke'],
      ['single-stroke-roll', 'single stroke roll', 'single-stroke'],
    ];
    
    for (const [rudimentKey, ...searchTerms] of rudimentChecks) {
      if (RUDIMENT_PATTERNS[rudimentKey] && searchTerms.some(term => allText.includes(term))) {
        matchedRudiment = rudimentKey;
        matchedSticking = RUDIMENT_PATTERNS[rudimentKey];
        break;
      }
    }
    
    if (matchedRudiment && matchedSticking) {
        const normalizedPreset = preset.stickingPattern.replace(/\s+/g, ' ').trim();
        const normalizedCorrect = matchedSticking.replace(/\s+/g, ' ').trim();
        
        // Check if preset sticking is a repetition of the correct pattern
        const correctTokens = parseTokens(matchedSticking);
        const presetTokens = parseTokens(preset.stickingPattern);
        
        // Check if preset is a valid repetition of the correct pattern
        let isValidRepetition = false;
        if (presetTokens.length >= correctTokens.length) {
          // Check if it's an exact repetition
          if (presetTokens.length % correctTokens.length === 0) {
            isValidRepetition = true;
            for (let i = 0; i < presetTokens.length; i++) {
              if (presetTokens[i] !== correctTokens[i % correctTokens.length]) {
                isValidRepetition = false;
                break;
              }
            }
          } else {
            // Check if it's a partial repetition (for rudiments that don't divide evenly)
            // For example, 5-stroke roll (5 notes) in a 16-note bar
            // Check if the pattern appears at least once and the rest is a continuation
            const patternFound = presetTokens.join(' ').includes(matchedSticking);
            if (patternFound) {
              // Check if it starts with the pattern
              let matchesStart = true;
              for (let i = 0; i < Math.min(correctTokens.length, presetTokens.length); i++) {
                if (presetTokens[i] !== correctTokens[i]) {
                  matchesStart = false;
                  break;
                }
              }
              if (matchesStart) {
                isValidRepetition = true; // Accept partial matches for uneven divisions
              }
            }
          }
        }
        
        if (!isValidRepetition && normalizedPreset !== normalizedCorrect) {
          // Only flag if it's clearly wrong - allow variations for special cases
          const notesPerBar = calculateNotesPerBar(preset.timeSignature, preset.subdivision);
          const correctLength = correctTokens.length;
          // If the rudiment doesn't divide evenly, be more lenient
          if (notesPerBar % correctLength !== 0) {
            // Check if at least the first part matches
            let firstPartMatches = true;
            for (let i = 0; i < Math.min(correctLength, presetTokens.length); i++) {
              if (presetTokens[i] !== correctTokens[i]) {
                firstPartMatches = false;
                break;
              }
            }
            if (firstPartMatches) {
              // Accept it - it's a valid adaptation for uneven divisions
              isValidRepetition = true;
            }
          }
          
          if (!isValidRepetition) {
            presetIssues.push(`Rudiment sticking doesn't match standard: expected "${matchedSticking}" (or repetition), got "${preset.stickingPattern}"`);
          }
        }
    }
  }
  
  // Check 5: Subdivision validation
  const validSubdivisions = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32];
  if (!validSubdivisions.includes(preset.subdivision)) {
    presetWarnings.push(`Unusual subdivision: ${preset.subdivision}`);
  }
  
  // Check 6: Time signature validation
  const [numerator, denominator] = preset.timeSignature.split('/').map(Number);
  if (isNaN(numerator) || isNaN(denominator)) {
    presetIssues.push(`Invalid time signature: ${preset.timeSignature}`);
  }
  
  if (presetIssues.length > 0) {
    issues.push({
      preset: preset.id,
      name: preset.name,
      issues: presetIssues
    });
  }
  
  if (presetWarnings.length > 0) {
    warnings.push({
      preset: preset.id,
      name: preset.name,
      warnings: presetWarnings
    });
  }
});

// Output results
console.log('=== PRESET REVIEW RESULTS ===\n');
console.log(`Total presets reviewed: ${presetsData.presets.length}\n`);

if (issues.length > 0) {
  console.log(`❌ ISSUES FOUND (${issues.length} presets):\n`);
  issues.forEach(({ preset, name, issues: presetIssues }) => {
    console.log(`  ${preset} - ${name}:`);
    presetIssues.forEach(issue => console.log(`    - ${issue}`));
    console.log('');
  });
} else {
  console.log('✅ No critical issues found!\n');
}

if (warnings.length > 0) {
  console.log(`⚠️  WARNINGS (${warnings.length} presets):\n`);
  warnings.forEach(({ preset, name, warnings: presetWarnings }) => {
    console.log(`  ${preset} - ${name}:`);
    presetWarnings.forEach(warning => console.log(`    - ${warning}`));
    console.log('');
  });
} else {
  console.log('✅ No warnings!\n');
}

// Summary
console.log('=== SUMMARY ===');
console.log(`Issues: ${issues.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Total presets: ${presetsData.presets.length}`);

