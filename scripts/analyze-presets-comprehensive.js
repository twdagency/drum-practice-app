/**
 * Comprehensive Preset Analysis Script
 * 
 * Analyzes all 212 presets to identify:
 * - Duplicate patterns
 * - Missing flams in flam-named patterns
 * - Incorrect sticking patterns
 * - Missing or excessive accents
 * - Incorrect subdivisions
 * - Patterns that don't match their names
 */

const fs = require('fs');
const path = require('path');

// Load presets
const presetsPath = path.join(__dirname, '../public/practice-presets.json');
const presetsData = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));

// Standard rudiment patterns (PAS 40)
const STANDARD_RUDIMENTS = {
  'single stroke roll': 'R L',
  'double stroke roll': 'R R L L',
  'single stroke four': 'R R R R L L L L',
  'five stroke roll': 'R R L L R',
  'six stroke roll': 'R R L L R L',
  'seven stroke roll': 'R R L L R R L',
  'nine stroke roll': 'R R L L R R L L R',
  'ten stroke roll': 'R R L L R R L L R L',
  'eleven stroke roll': 'R R L L R R L L R R L',
  'thirteen stroke roll': 'R R L L R R L L R R L L R',
  'fifteen stroke roll': 'R R L L R R L L R R L L R R L',
  'seventeen stroke roll': 'R R L L R R L L R R L L R R L L R',
  'paradiddle': 'R L R R L R L L',
  'double paradiddle': 'R L R L R R L R L R L L',
  'triple paradiddle': 'R L R L R L R R L R L R L R L L',
  'paradiddle-diddle': 'R L R R L L',
  'flam': 'lR', // or rL
  'flam tap': 'lR rL R L',
  'flam accent': 'lR rL R L', // with accents on R L
  'flam paradiddle': 'lR rL R R L R L L',
  'flam paradiddle-diddle': 'lR rL R R L L',
  'single drag tap': 'llR L',
  'double drag tap': 'llR llL',
  'single ratamacue': 'llR L R',
  'double ratamacue': 'llR llL R L',
  'triple ratamacue': 'lllR lllL R L',
  'swiss army triplet': 'R L R',
  'pataflafla': 'R L R L',
};

// Helper functions
function parseTokens(str) {
  if (!str) return [];
  return str.split(/\s+/).filter(t => t.length > 0);
}

function normalizeSticking(sticking) {
  if (!sticking) return '';
  return parseTokens(sticking).join(' ').toLowerCase();
}

function hasFlamNotation(sticking) {
  if (!sticking) return false;
  const tokens = parseTokens(sticking);
  return tokens.some(t => t.toLowerCase().includes('lr') || t.toLowerCase().includes('rl'));
}

function countAccents(accents) {
  if (!accents || !Array.isArray(accents)) return 0;
  return accents.length;
}

function getPatternSignature(preset) {
  // Create a signature based on drum pattern, sticking, and subdivision
  return {
    drumPattern: preset.drumPattern || '',
    stickingPattern: normalizeSticking(preset.stickingPattern),
    subdivision: preset.subdivision,
    timeSignature: preset.timeSignature,
    accents: preset.accents ? preset.accents.sort((a, b) => a - b).join(',') : 'none'
  };
}

function patternSignatureToString(sig) {
  return `${sig.drumPattern}|${sig.stickingPattern}|${sig.subdivision}|${sig.timeSignature}|${sig.accents}`;
}

// Analysis results
const issues = {
  duplicates: [],
  missingFlams: [],
  incorrectSticking: [],
  excessiveAccents: [],
  missingAccents: [],
  incorrectSubdivision: [],
  nameMismatch: [],
  other: []
};

// Track patterns by signature for duplicate detection
const patternSignatures = new Map();

// Analyze each preset
presetsData.presets.forEach((preset, index) => {
  const presetIssues = [];
  const name = preset.name || '';
  const nameLower = name.toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const tags = (preset.tags || []).map(t => t.toLowerCase()).join(' ');
  const allText = `${nameLower} ${description} ${tags}`;
  
  // Check for duplicates
  const signature = getPatternSignature(preset);
  const sigString = patternSignatureToString(signature);
  
  if (patternSignatures.has(sigString)) {
    const duplicate = patternSignatures.get(sigString);
    issues.duplicates.push({
      preset1: { id: preset.id, name: preset.name },
      preset2: { id: duplicate.id, name: duplicate.name },
      signature: sigString
    });
  } else {
    patternSignatures.set(sigString, preset);
  }
  
  // Check for missing flams
  if (allText.includes('flam') && preset._hasFlams !== false) {
    if (!hasFlamNotation(preset.stickingPattern)) {
      issues.missingFlams.push({
        id: preset.id,
        name: preset.name,
        stickingPattern: preset.stickingPattern,
        expected: 'Should contain lR or rL notation'
      });
    }
  }
  
  // Check for excessive accents (every note accented)
  const accentCount = countAccents(preset.accents);
  const stickingTokens = parseTokens(preset.stickingPattern);
  const stickingCount = stickingTokens.filter(t => {
    const upper = t.toUpperCase();
    return upper === 'R' || upper === 'L' || upper === 'K';
  }).length;
  
  if (accentCount > 0 && accentCount === stickingCount) {
    // Every note is accented - might be excessive
    if (!allText.includes('full accent') && !allText.includes('every note')) {
      issues.excessiveAccents.push({
        id: preset.id,
        name: preset.name,
        accentCount,
        noteCount: stickingCount
      });
    }
  }
  
  // Check for missing accents in patterns that should have them
  if (!preset.accents || preset.accents.length === 0) {
    // Patterns that typically should have accents
    if (allText.includes('accent') || 
        allText.includes('backbeat') ||
        allText.includes('groove') ||
        (allText.includes('flam') && allText.includes('accent'))) {
      issues.missingAccents.push({
        id: preset.id,
        name: preset.name,
        reason: 'Pattern name/description suggests accents should be present'
      });
    }
  }
  
  // Check rudiment sticking patterns
  if (preset.subcategory === 'rudiments' || allText.includes('rudiment')) {
    let matchedRudiment = null;
    let expectedSticking = null;
    
    // Check against standard rudiments
    for (const [rudimentName, standardSticking] of Object.entries(STANDARD_RUDIMENTS)) {
      if (allText.includes(rudimentName)) {
        matchedRudiment = rudimentName;
        expectedSticking = standardSticking;
        break;
      }
    }
    
    if (matchedRudiment && expectedSticking) {
      const presetSticking = normalizeSticking(preset.stickingPattern);
      const expectedNormalized = normalizeSticking(expectedSticking);
      
      // Check if preset sticking is a repetition of expected
      const expectedTokens = parseTokens(expectedSticking);
      const presetTokens = parseTokens(preset.stickingPattern);
      
      // Check for exact match or valid repetition
      let isValid = false;
      if (presetSticking === expectedNormalized) {
        isValid = true;
      } else if (presetTokens.length >= expectedTokens.length) {
        // Check if it's a repetition
        if (presetTokens.length % expectedTokens.length === 0) {
          isValid = true;
          for (let i = 0; i < presetTokens.length; i++) {
            if (presetTokens[i].toLowerCase() !== expectedTokens[i % expectedTokens.length].toLowerCase()) {
              isValid = false;
              break;
            }
          }
        }
      }
      
      if (!isValid) {
        issues.incorrectSticking.push({
          id: preset.id,
          name: preset.name,
          rudiment: matchedRudiment,
          current: preset.stickingPattern,
          expected: expectedSticking
        });
      }
    }
  }
  
  // Check for name mismatches
  // Speed: Double Stroke Basic should have R R L L, not R L R L
  if (nameLower.includes('double stroke') && !nameLower.includes('single')) {
    const sticking = normalizeSticking(preset.stickingPattern);
    if (sticking.includes('r l r l') && !sticking.includes('r r l l')) {
      issues.nameMismatch.push({
        id: preset.id,
        name: preset.name,
        issue: 'Named "double stroke" but uses single stroke pattern (R L R L)',
        current: preset.stickingPattern,
        expected: 'Should use R R L L pattern'
      });
    }
  }
  
  // Check subdivision appropriateness
  if (preset.subdivision && preset.subdivision > 32) {
    issues.incorrectSubdivision.push({
      id: preset.id,
      name: preset.name,
      subdivision: preset.subdivision,
      issue: 'Subdivision > 32 is very unusual'
    });
  }
});

// Generate report
const report = {
  summary: {
    totalPresets: presetsData.presets.length,
    duplicates: issues.duplicates.length,
    missingFlams: issues.missingFlams.length,
    incorrectSticking: issues.incorrectSticking.length,
    excessiveAccents: issues.excessiveAccents.length,
    missingAccents: issues.missingAccents.length,
    incorrectSubdivision: issues.incorrectSubdivision.length,
    nameMismatch: issues.nameMismatch.length
  },
  issues
};

// Output to console
console.log('=== COMPREHENSIVE PRESET ANALYSIS ===\n');
console.log(`Total Presets: ${report.summary.totalPresets}\n`);
console.log('ISSUES FOUND:\n');
console.log(`❌ Duplicates: ${report.summary.duplicates}`);
console.log(`❌ Missing Flams: ${report.summary.missingFlams}`);
console.log(`❌ Incorrect Sticking: ${report.summary.incorrectSticking}`);
console.log(`⚠️  Excessive Accents: ${report.summary.excessiveAccents}`);
console.log(`⚠️  Missing Accents: ${report.summary.missingAccents}`);
console.log(`⚠️  Incorrect Subdivision: ${report.summary.incorrectSubdivision}`);
console.log(`❌ Name Mismatch: ${report.summary.nameMismatch}\n`);

// Detailed output
if (issues.duplicates.length > 0) {
  console.log('\n=== DUPLICATE PATTERNS ===');
  issues.duplicates.forEach((dup, i) => {
    console.log(`\n${i + 1}. ${dup.preset1.name} (${dup.preset1.id})`);
    console.log(`   Identical to: ${dup.preset2.name} (${dup.preset2.id})`);
  });
}

if (issues.missingFlams.length > 0) {
  console.log('\n=== MISSING FLAMS ===');
  issues.missingFlams.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.name} (${item.id})`);
    console.log(`   Current: ${item.stickingPattern}`);
    console.log(`   Issue: ${item.expected}`);
  });
}

if (issues.incorrectSticking.length > 0) {
  console.log('\n=== INCORRECT STICKING ===');
  issues.incorrectSticking.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.name} (${item.id})`);
    console.log(`   Rudiment: ${item.rudiment}`);
    console.log(`   Current: ${item.current}`);
    console.log(`   Expected: ${item.expected}`);
  });
}

if (issues.excessiveAccents.length > 0) {
  console.log('\n=== EXCESSIVE ACCENTS ===');
  issues.excessiveAccents.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.name} (${item.id})`);
    console.log(`   Accents: ${item.accentCount} / ${item.noteCount} notes (every note accented)`);
  });
}

if (issues.nameMismatch.length > 0) {
  console.log('\n=== NAME MISMATCH ===');
  issues.nameMismatch.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.name} (${item.id})`);
    console.log(`   Issue: ${item.issue}`);
    console.log(`   Current: ${item.current}`);
    console.log(`   Expected: ${item.expected}`);
  });
}

// Save report to file
const reportPath = path.join(__dirname, '../docs/PRESET_ANALYSIS_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(`\n\n✅ Detailed report saved to: ${reportPath}`);

// Summary statistics
const totalIssues = Object.values(report.summary).reduce((sum, val) => sum + val, 0);
console.log(`\n=== SUMMARY ===`);
console.log(`Total Issues Found: ${totalIssues}`);
console.log(`Presets with Issues: ${new Set([
  ...issues.duplicates.flatMap(d => [d.preset1.id, d.preset2.id]),
  ...issues.missingFlams.map(m => m.id),
  ...issues.incorrectSticking.map(i => i.id),
  ...issues.excessiveAccents.map(e => e.id),
  ...issues.nameMismatch.map(n => n.id)
]).size}`);

