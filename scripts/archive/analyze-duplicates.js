/**
 * Analyze Duplicate Patterns
 * 
 * Identifies duplicate patterns and suggests which ones to keep/remove
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

function normalizeSticking(sticking) {
  if (!sticking) return '';
  return parseTokens(sticking).join(' ').toLowerCase();
}

function getPatternSignature(preset) {
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

// Find duplicates
const patternSignatures = new Map();
const duplicates = [];

presetsData.presets.forEach((preset) => {
  const signature = getPatternSignature(preset);
  const sigString = patternSignatureToString(signature);
  
  if (patternSignatures.has(sigString)) {
    const existing = patternSignatures.get(sigString);
    duplicates.push({
      preset1: { id: preset.id, name: preset.name, category: preset.category },
      preset2: { id: existing.id, name: existing.name, category: existing.category },
      signature: sigString
    });
  } else {
    patternSignatures.set(sigString, preset);
  }
});

// Group duplicates by signature
const duplicateGroups = new Map();
duplicates.forEach(dup => {
  const sig = dup.signature;
  if (!duplicateGroups.has(sig)) {
    duplicateGroups.set(sig, []);
  }
  duplicateGroups.get(sig).push(dup);
});

// Analyze and suggest which to keep
console.log('=== DUPLICATE PATTERN ANALYSIS ===\n');
console.log(`Total duplicate pairs: ${duplicates.length}\n`);
console.log(`Unique duplicate groups: ${duplicateGroups.size}\n`);

const suggestions = [];

duplicateGroups.forEach((group, sig) => {
  console.log(`\n--- Group: ${sig.substring(0, 50)}... ---`);
  
  // Collect all unique presets in this group
  const allPresets = new Set();
  group.forEach(dup => {
    allPresets.add(JSON.stringify(dup.preset1));
    allPresets.add(JSON.stringify(dup.preset2));
  });
  
  const presets = Array.from(allPresets).map(p => JSON.parse(p));
  
  presets.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} (${p.id}) [${p.category}]`);
  });
  
  // Suggest which to keep based on:
  // 1. More specific name
  // 2. Better category (beginner > intermediate > advanced for basic patterns)
  // 3. Earlier in alphabet (tiebreaker)
  
  const sorted = presets.sort((a, b) => {
    // Prefer more specific categories
    const categoryOrder = { 'beginner': 1, 'coordination': 2, 'independence': 3, 'intermediate': 4, 'advanced': 5, 'speed': 6, 'grooves': 7, 'warmup': 8 };
    const catA = categoryOrder[a.category] || 99;
    const catB = categoryOrder[b.category] || 99;
    if (catA !== catB) return catA - catB;
    
    // Prefer shorter IDs (usually more canonical)
    if (a.id.length !== b.id.length) return a.id.length - b.id.length;
    
    // Alphabetical
    return a.id.localeCompare(b.id);
  });
  
  const keep = sorted[0];
  const remove = sorted.slice(1);
  
  suggestions.push({
    keep: keep,
    remove: remove,
    signature: sig
  });
  
  console.log(`\n  → KEEP: ${keep.name} (${keep.id})`);
  remove.forEach(r => {
    console.log(`  → REMOVE: ${r.name} (${r.id})`);
  });
});

// Summary
console.log('\n\n=== SUMMARY ===');
console.log(`Total duplicates: ${duplicates.length}`);
console.log(`Unique groups: ${duplicateGroups.size}`);
console.log(`Suggested removals: ${suggestions.reduce((sum, s) => sum + s.remove.length, 0)}`);

// Save suggestions
const suggestionsPath = path.join(__dirname, '../docs/DUPLICATE_REMOVAL_SUGGESTIONS.json');
fs.writeFileSync(suggestionsPath, JSON.stringify({ suggestions, totalDuplicates: duplicates.length }, null, 2), 'utf8');
console.log(`\n✅ Suggestions saved to: ${suggestionsPath}`);

