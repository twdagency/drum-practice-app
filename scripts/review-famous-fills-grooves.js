/**
 * Review and fix famous fills and grooves patterns
 * Similar to famous beats review - check for K+H, S+H, single bar patterns, etc.
 */

const fs = require('fs');
const path = require('path');

const presetsPath = path.join(__dirname, '../public/practice-presets.json');

// Load presets
const presetsData = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));
const presets = presetsData.presets || [];

let reviewedCount = 0;
let issuesFound = [];

// Review all famous fills and grooves
presets.forEach((preset) => {
  if (preset.category === 'famous-fills' || preset.category === 'famous-grooves') {
    reviewedCount++;
    const issues = [];
    
    // Check if pattern repeats unnecessarily (should be single bar)
    const drumTokens = preset.drumPattern.trim().split(/\s+/);
    const stickingTokens = preset.stickingPattern.trim().split(/\s+/);
    const notesPerBar = calculateNotesPerBar(preset.timeSignature, preset.subdivision);
    
    // Check if pattern is longer than one bar
    if (drumTokens.length > notesPerBar) {
      issues.push(`Pattern has ${drumTokens.length} notes but should be ${notesPerBar} (one bar)`);
    }
    
    // Check if sticking pattern matches drum pattern length
    if (drumTokens.length !== stickingTokens.length) {
      issues.push(`Sticking pattern (${stickingTokens.length}) doesn't match drum pattern (${drumTokens.length})`);
    }
    
    // Check for potential K+H or S+H patterns that should be combined
    const hasRockBeatPattern = preset.drumPattern.includes('K H H S H');
    if (hasRockBeatPattern) {
      issues.push(`May need K+H and S+H notation: "${preset.drumPattern}"`);
    }
    
    // Check for H in sticking that should be R (not alternating)
    if (preset.drumPattern.includes('H') && preset.stickingPattern.includes('L')) {
      // Check if it's a beat pattern (not a fill)
      const isBeatPattern = preset.drumPattern.match(/K.*H.*S.*H/);
      if (isBeatPattern) {
        issues.push(`H in beat pattern should be R, not alternating R/L`);
      }
    }
    
    if (issues.length > 0) {
      issuesFound.push({
        name: preset.name,
        id: preset.id,
        issues: issues,
        drumPattern: preset.drumPattern,
        stickingPattern: preset.stickingPattern,
        timeSignature: preset.timeSignature,
        subdivision: preset.subdivision,
        repeat: preset.repeat
      });
    }
  }
});

// Helper function to calculate notes per bar
function calculateNotesPerBar(timeSignature, subdivision) {
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  const beatValue = denominator;
  const subdivisionsPerBeat = subdivision / beatValue;
  return Math.round(numerator * subdivisionsPerBeat);
}

// Print results
console.log(`\n📊 Review Summary:`);
console.log(`   Reviewed: ${reviewedCount} famous fills/grooves`);
console.log(`   Issues found: ${issuesFound.length} patterns\n`);

if (issuesFound.length > 0) {
  console.log(`⚠️  Patterns with issues:\n`);
  issuesFound.forEach((item, index) => {
    console.log(`${index + 1}. ${item.name} (${item.id})`);
    console.log(`   Time Signature: ${item.timeSignature}, Subdivision: ${item.subdivision}, Repeat: ${item.repeat}`);
    console.log(`   Drum Pattern: ${item.drumPattern}`);
    console.log(`   Sticking Pattern: ${item.stickingPattern}`);
    console.log(`   Issues:`);
    item.issues.forEach(issue => {
      console.log(`     - ${issue}`);
    });
    console.log('');
  });
} else {
  console.log(`✅ No issues found! All patterns look good.`);
}

console.log(`\n💡 Note: This script only identifies issues. Use fix-famous-beats-kh-sh.js as a template to create a fix script.`);


