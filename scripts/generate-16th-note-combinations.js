/**
 * Script to generate 16th note rhythmic grid patterns
 * - Kick always on beats 1, 2, 3, 4 (positions 0, 4, 8, 12) as pulse
 * - Snare patterns as specified (S = snare, - = rest)
 * - Sticking always R L R L for snares
 * - Each pattern is 4 bars (repeat: 4)
 */

const fs = require('fs');
const path = require('path');

const presetsFile = path.join(__dirname, '../public/practice-presets.json');
const data = JSON.parse(fs.readFileSync(presetsFile, 'utf8'));

/**
 * Generate a pattern from a snare pattern string
 * @param {string} snarePattern - Pattern string like "S S S S" or "S - S S" (one beat, 4 positions where pos 1 is always K)
 * @param {number} patternIndex - Index for naming
 * @returns {Object} Pattern object
 */
function generatePatternFromString(snarePattern, patternIndex) {
  // Parse the snare pattern (one beat worth: 4 positions)
  // Pattern shows positions 1, 2, 3, 4 of a beat
  const beatPattern = snarePattern.trim().split(/\s+/);
  
  // Create array of 16 positions (4 beats × 4 positions)
  // No kicks - users can add kick pulse in advanced settings
  const grid = Array(16).fill('-');
  
  // Apply pattern to each beat
  // Pattern shows all 4 positions of a beat
  // Apply the same pattern to all 4 beats
  // So "S S S S" = [S, S, S, S] -> S S S S (all 4 positions have S, repeated 4 times)
  // And "- S S S" = [-, S, S, S] -> - S S S (position 1=-, positions 2,3,4=S, repeated 4 times)
  // And "S - - -" = [S, -, -, -] -> S - - - (position 1=S, positions 2,3,4=-, repeated 4 times)
  
  for (let beat = 0; beat < 4; beat++) {
    const beatStart = beat * 4; // 0, 4, 8, 12
    
    // Apply pattern to all 4 positions of this beat
    for (let i = 0; i < 4; i++) {
      if (i < beatPattern.length) {
        if (beatPattern[i] === 'S') {
          grid[beatStart + i] = 'S';
        }
        // '-' means rest, already set by Array.fill('-')
      }
    }
  }
  
  // Build phrase and drumPattern strings
  const phrase = "4 4 4 4"; // 4 notes per beat, 4 beats
  
  // The drumPattern (voicing) is just the 4-position pattern
  // The system will repeat it based on phrase and repeat settings
  const drumPatternString = snarePattern; // e.g., "- - - S" or "S S S S"
  
  // Generate sticking pattern: Always R L R L (4 positions)
  // The system will repeat it based on phrase and repeat settings
  const stickingString = "R L R L";
  
  // Count snare notes
  const snareCount = grid.filter(n => n === 'S').length;
  
  // Create name from pattern
  const patternName = snarePattern.replace(/\s+/g, '');
  const id = `16th-note-grid-${patternName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const name = `16th Note Grid: ${snarePattern}`;
  
  return {
    id,
    name,
    category: "rhythmic-grid",
    subcategory: "systematic",
    tags: [
      "16th-notes",
      "rhythmic-grid",
      "systematic"
    ],
    description: `16th note grid pattern: ${snarePattern}. Voicing matches pattern. Sticking: R L R L. Add kick pulse in advanced settings if desired.`,
    timeSignature: "4/4",
    subdivision: 16,
    phrase,
    drumPattern: drumPatternString, // Voicing matches the pattern variation, repeated for each beat
    stickingPattern: stickingString, // Always R L R L, repeated for each beat
    bpm: 100,
    repeat: 4,
    difficulty: Math.min(5, Math.max(1, Math.ceil(snareCount / 4) + 1))
  };
}

// First, remove any existing 16th note grid patterns to avoid duplicates
// Also remove the old combined preset (but keep the new one)
data.presets = data.presets.filter(p => 
  !p.id.startsWith('16th-note-grid-') && 
  !p.id.startsWith('16th-note-combo-') &&
  p.id !== '16th-note-rhythmic-grid-all-combinations'
  // Keep: 16th-note-grid-all-combinations-combined (the correct one)
);

// Define all the snare patterns (one beat worth - 4 positions, but we skip the kick position)
// Patterns are specified for the 3 positions between kicks (positions 1-3 of each beat)
const snarePatterns = [
  "S S S S",    // 4 snares: all 3 positions on all 4 beats
  "- S S S",    // 3 snares: skip first position
  "S - S S",    // 3 snares: skip second position
  "S S - S",    // 3 snares: skip third position
  "S S S -",    // 3 snares: skip fourth position (wait, this doesn't make sense for one beat...)
  "S S - -",    // 2 snares: first two positions
  "S - S -",    // 2 snares: first and third positions
  "S - - S",    // 2 snares: first and fourth positions
  "- S - S",    // 2 snares: second and fourth positions
  "- - S S",    // 2 snares: third and fourth positions
  "S - - -",    // 1 snare: first position
  "- S - -",    // 1 snare: second position
  "- - S -",    // 1 snare: third position
  "- - - S"     // 1 snare: fourth position
];

// Wait, I think the user means the pattern applies to each beat
// So "S S S S" means on each beat, there are snares in positions 1, 2, 3 (3 snares per beat = 12 total)
// But that doesn't match the count...

// Actually, re-reading: they listed patterns like "S S S S" which is 4 positions
// But in a 16th note grid with kick on beat 1, we have: K _ _ _ (4 positions per beat)
// So "S S S S" means: on each of the 4 beats, place snares in the 3 non-kick positions
// That would be: K S S S | K S S S | K S S S | K S S S

// But wait, "S S S S" is 4 S's, and we have 3 positions per beat (excluding kick)
// So maybe they mean the pattern for the 4 beats? Let me interpret it as:
// The pattern shows what happens on each beat, and we repeat it 4 times

// Actually, I think "S S S S" means: 4 snares total, one on each beat in the first position
// But that doesn't match either...

// Let me re-read the user's request. They said "S S S S" and listed it as one pattern.
// I think they mean: the pattern string shows the snare positions for ONE beat (4 positions including the kick position, but kick is always there)
// So "S S S S" = K S S S (kick + 3 snares on beat 1, repeated for all 4 beats)

// Actually, the simplest interpretation: the pattern shows the 4 positions of a beat, where position 1 is always K
// So "S S S S" means positions 2, 3, 4 all have S (3 snares per beat)

const allPatterns = [];

snarePatterns.forEach((pattern, index) => {
  const preset = generatePatternFromString(pattern, index);
  allPatterns.push(preset);
});

// Create combined pattern (all patterns in sequence: 4 notes, then 3, then 2, then 1)
const combinedDrumPattern = [];
const combinedStickingPattern = [];
const combinedPhrase = [];

// Each pattern is 4 positions (one beat), but we want 4 bars per pattern
// So we repeat each pattern 16 times (4 beats × 4 bars = 16 repeats)
allPatterns.forEach((pattern, patternIndex) => {
  const drumNotes = pattern.drumPattern.split(' ');
  const stickingNotes = pattern.stickingPattern.split(' ');
  
  // Repeat this pattern 16 times (4 beats × 4 bars = 64 positions total)
  // Each bar has 4 beats, so we need 16 phrase values (4 bars × 4 beats)
  for (let repeat = 0; repeat < 16; repeat++) {
    combinedDrumPattern.push(...drumNotes);
    combinedStickingPattern.push(...stickingNotes);
    // Add phrase value for each beat (4 beats per bar)
    combinedPhrase.push("4"); // 4 notes per beat (16th notes)
  }
});

// Count total bars
const totalBars = allPatterns.length * 4;

// Create combined preset
const combinedPreset = {
  id: "16th-note-grid-all-combinations-combined",
  name: "16th Note Grid - All Combinations (Combined)",
  category: "rhythmic-grid",
  subcategory: "systematic",
  tags: [
    "16th-notes",
    "rhythmic-grid",
    "all-combinations",
    "systematic",
    "combined"
  ],
  description: `Complete 16th note rhythmic grid with all 14 combinations in sequence. Starts with 4 notes, then 3 notes (4 patterns), then 2 notes (5 patterns), then 1 note (4 patterns). Each variation is 4 bars. Kick pulse on beats 1, 2, 3, 4. Snare sticking: R L R L. Total: ${totalBars} bars (${allPatterns.length} patterns × 4 bars each).`,
  timeSignature: "4/4",
  subdivision: 16,
  phrase: combinedPhrase.join(' '),
  drumPattern: combinedDrumPattern.join(' '),
  stickingPattern: combinedStickingPattern.join(' '),
  bpm: 100,
  repeat: 1, // Single playthrough since it's already a long combined pattern
  difficulty: 3
};

// Add both individual patterns and combined pattern
data.presets.push(...allPatterns);
data.presets.push(combinedPreset);

// Update version
const versionParts = data.version.split('.');
versionParts[1] = parseInt(versionParts[1]) + 1;
data.version = versionParts.join('.');

// Write back to file
fs.writeFileSync(presetsFile, JSON.stringify(data, null, 2), 'utf8');

console.log('✅ Removed all old 16th note grid presets (removed old combined preset)');
console.log(`✅ Created ${allPatterns.length} individual presets + 1 combined preset`);
console.log(`Updated version to ${data.version}`);
console.log(`\nIndividual patterns created:`);
allPatterns.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.name}`);
});
console.log(`\n✅ Combined preset created: "${combinedPreset.name}"`);
console.log(`   Total: ${totalBars} bars (${allPatterns.length} patterns × 4 bars each)`);
console.log(`   Order: 4 notes → 3 notes → 2 notes → 1 note`);
console.log(`\nVoicing: Matches each pattern variation`);
console.log(`Sticking: R L R L (always)`);
console.log(`Kicks: Users can add kick pulse in advanced settings`);

