/**
 * Remove Duplicate Patterns
 * 
 * Removes duplicate patterns based on suggestions, preferring canonical names
 */

const fs = require('fs');
const path = require('path');

// Load presets
const presetsPath = path.join(__dirname, '../public/practice-presets.json');
const presetsData = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));

// Load suggestions
const suggestionsPath = path.join(__dirname, '../docs/DUPLICATE_REMOVAL_SUGGESTIONS.json');
const suggestionsData = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));

// IDs to remove - but we'll be smart about which to keep
const idsToRemove = new Set();

// Canonical names to always keep (priority order)
const canonicalNames = [
  'beginner-single-stroke-roll',
  'beginner-double-stroke-roll',
  'beginner-paradiddle',
  'beginner-single-stroke-quarter',
  'beginner-single-stroke-eighth',
  'beginner-double-stroke-eighth',
  'beginner-paradiddle-eighth',
  'intermediate-flam-tap',
  'intermediate-double-paradiddle',
  'intermediate-triple-paradiddle',
  'intermediate-single-ratamacue',
  'advanced-triple-ratamacue',
  'beginner-hihat-paradiddle',
  'groove-basic-rock-hihat',
  'groove-rock-hihat',
  'groove-funk-hihat',
  'groove-jazz-hihat',
  'independence-hand-foot-pattern-1',
  'independence-hand-foot-pattern-2',
  'rudiment-seventeen-stroke-roll',
  'beginner-five-stroke-roll',
  'beginner-basic-accent',
];

suggestionsData.suggestions.forEach(({ keep, remove }) => {
  // Find the best candidate to keep
  const allCandidates = [keep, ...remove];
  
  // Check for canonical names first
  const canonical = allCandidates.find(c => canonicalNames.includes(c.id));
  const finalKeep = canonical || keep;
  
  // Remove all others
  allCandidates.forEach(p => {
    if (p.id !== finalKeep.id) {
      idsToRemove.add(p.id);
    }
  });
});

console.log(`Removing ${idsToRemove.size} duplicate presets...\n`);

// Filter out duplicates
const originalCount = presetsData.presets.length;
const filteredPresets = presetsData.presets.filter(preset => {
  if (idsToRemove.has(preset.id)) {
    console.log(`  Removing: ${preset.name} (${preset.id})`);
    return false;
  }
  return true;
});

const removedCount = originalCount - filteredPresets.length;

// Update version
presetsData.version = '1.33';
presetsData.presets = filteredPresets;

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log(`\n=== SUMMARY ===`);
console.log(`Original presets: ${originalCount}`);
console.log(`Removed: ${removedCount}`);
console.log(`Remaining: ${filteredPresets.length}`);
console.log(`\n✅ Updated presets file: ${presetsPath}`);

