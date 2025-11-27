/**
 * Fix Famous Beats patterns to use K+H and S+H notation correctly
 * and fix sticking patterns according to the rules:
 * - H when part of a beat should be R (not alternating R L)
 * - For K+H, sticking is just "K" (H is ignored)
 * - For S+H, sticking is whatever comes next in the pattern (H is ignored)
 */

const fs = require('fs');
const path = require('path');

const presetsPath = path.join(__dirname, '../public/practice-presets.json');

// Load presets
const presetsData = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));
const presets = presetsData.presets || [];

// Function to generate sticking pattern from drum pattern
// Rules:
// - K+H: sticking is "K" (H is ignored)
// - S+H: sticking is whatever comes next in the pattern (H is ignored)
// - Single H in a beat: should be R (not alternating R L)
// - Regular S: alternate R/L
function generateStickingForBeat(drumPattern) {
  const tokens = drumPattern.trim().split(/\s+/);
  const sticking = [];
  let snareHand = 'R'; // For alternating snare hits
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];
    
    // Handle combined notes like K+H or S+H
    if (token.includes('+')) {
      const parts = token.split('+');
      const first = parts[0];
      const second = parts[1];
      
      if (first === 'K' && second === 'H') {
        // K+H: sticking is just K (H is ignored)
        sticking.push('K');
      } else if (first === 'S' && second === 'H') {
        // S+H: sticking is the snare hand (alternating R/L, H is ignored)
        sticking.push(snareHand);
        snareHand = snareHand === 'R' ? 'L' : 'R'; // Alternate for next snare
      } else {
        // Other combinations - keep as is
        sticking.push(token);
      }
    } else if (token === 'H') {
      // Single H in a beat pattern should be R (not alternating)
      sticking.push('R');
    } else if (token === 'K') {
      sticking.push('K');
    } else if (token === 'S') {
      // Regular snare - alternate R/L
      sticking.push(snareHand);
      snareHand = snareHand === 'R' ? 'L' : 'R';
    } else if (token === '(S)') {
      // Ghost note snare - alternate R/L
      sticking.push(snareHand);
      snareHand = snareHand === 'R' ? 'L' : 'R';
    } else {
      // Other notes - keep as is
      sticking.push(token);
    }
  }
  
  return sticking.join(' ');
}

// Function to convert patterns like "K H H S H" to "K+H H H S+H"
// Only combines when it's clearly a rock beat pattern (K H H S H), not shuffles (K H S H)
function convertToKH_SH(drumPattern) {
  const tokens = drumPattern.trim().split(/\s+/);
  const converted = [];
  
  // Check if this looks like a rock beat pattern (K H H S H) vs shuffle (K H S H)
  // Rock beat: K on downbeat, H on next subdivision, H on next, S on next, H on next
  // Shuffle: K, H, S, H are all separate hits on different subdivisions
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];
    const nextNextToken = tokens[i + 2];
    
    // Pattern: K followed by H, and then another H (K H H...) = rock beat, combine K+H
    if (token === 'K' && nextToken === 'H' && nextNextToken === 'H') {
      converted.push('K+H');
      i++; // Skip the next H
    }
    // Pattern: S followed by H, and previous was H (K H H S H) = rock beat, combine S+H
    else if (token === 'S' && nextToken === 'H' && tokens[i - 1] === 'H') {
      converted.push('S+H');
      i++; // Skip the next H
    }
    // Keep other tokens as is
    else {
      converted.push(token);
    }
  }
  
  return converted.join(' ');
}

  // Famous beats that should have K+H and S+H patterns
  // For patterns like "K H H S H", convert to "K+H H H S+H"
  // Sticking: K+H -> K, H -> R, S+H -> L (snare alternates, so L after R R R)
  // Note: Patterns should only contain ONE bar - the system will repeat based on 'repeat' field
  // Note: Shuffle patterns like "K H S H" should NOT be combined
  const shufflePatterns = [
    'famous-beat-purdy-shuffle', // K H S H - shuffle, don't combine
    'famous-beat-rosanna-shuffle' // Has ghost notes, different pattern
  ];
  
  const famousBeatsToFix = [
    {
      id: 'famous-beat-back-in-black',
      expectedPattern: 'K+H H H S+H', // ONE bar only
      // K+H -> K, H -> R, H -> R, S+H -> L (snare alternates)
      expectedSticking: 'K R R L' // ONE bar only
    },
    {
      id: 'famous-beat-billie-jean',
      expectedPattern: 'K+H H H S+H',
      expectedSticking: 'K R R L'
    },
    {
      id: 'famous-beat-when-the-levee',
      expectedPattern: 'K+H H H S+H',
      expectedSticking: 'K R R L'
    },
    {
      id: 'famous-beat-enter-sandman',
      expectedPattern: 'K+H H H S+H',
      expectedSticking: 'K R R L'
    },
    {
      id: 'famous-beat-sweet-child',
      expectedPattern: 'K+H H H S+H',
      expectedSticking: 'K R R L'
    },
  // For patterns like "K H S H", H should be R (not alternating)
  {
    id: 'famous-beat-amen-break',
    expectedPattern: 'K H S H K H S H K H S H K H S H',
    // K -> K, H -> R, S -> R (alternating), H -> R
    expectedSticking: 'K R R R K R L R K R R R K R L R'
  },
  {
    id: 'famous-beat-impeach-president',
    expectedPattern: 'K H S H K H S H K H S H K H S H',
    expectedSticking: 'K R R R K R L R K R R R K R L R'
  }
];

let fixedCount = 0;
let reviewedCount = 0;

// Process all famous beats
presets.forEach((preset, index) => {
  if (preset.category === 'famous-beats') {
    reviewedCount++;
    const originalDrumPattern = preset.drumPattern;
    const originalSticking = preset.stickingPattern;
    
    // Skip shuffle patterns - they shouldn't have K+H or S+H
    if (shufflePatterns.includes(preset.id)) {
      // Only fix sticking for shuffle patterns (H should be R, not alternating)
      if (originalDrumPattern.includes('H') && originalSticking.includes('L')) {
        const newSticking = generateStickingForBeat(originalDrumPattern);
        if (newSticking !== originalSticking) {
          preset.stickingPattern = newSticking;
          console.log(`\n✅ Fixed sticking (shuffle): ${preset.name}`);
          console.log(`   Old sticking: ${originalSticking}`);
          console.log(`   New sticking: ${preset.stickingPattern}`);
          fixedCount++;
        }
      }
      return; // Skip further processing for shuffle patterns
    }
    
    // Check if this is a pattern that should have K+H and S+H
    const fixInfo = famousBeatsToFix.find(f => f.id === preset.id);
    
    if (fixInfo) {
      // Apply the fix
      preset.drumPattern = fixInfo.expectedPattern;
      preset.stickingPattern = fixInfo.expectedSticking;
      
      console.log(`\n✅ Fixed: ${preset.name}`);
      console.log(`   Old drum: ${originalDrumPattern}`);
      console.log(`   New drum: ${preset.drumPattern}`);
      console.log(`   Old sticking: ${originalSticking}`);
      console.log(`   New sticking: ${preset.stickingPattern}`);
      
      fixedCount++;
    } else {
      // For other famous beats, check if they have "K H H" patterns (rock beats) that should be combined
      // Skip shuffle patterns like "K H S H" which should remain separate
      const isShufflePattern = /K\s+H\s+S\s+H/.test(originalDrumPattern) && 
                                !originalDrumPattern.includes('K H H');
      
      if (!isShufflePattern && (originalDrumPattern.includes('K H H') || originalDrumPattern.match(/K\s+H\s+H\s+S\s+H/))) {
        const converted = convertToKH_SH(originalDrumPattern);
        if (converted !== originalDrumPattern) {
          preset.drumPattern = converted;
          // Generate new sticking
          preset.stickingPattern = generateStickingForBeat(converted);
          
          console.log(`\n✅ Fixed: ${preset.name}`);
          console.log(`   Old drum: ${originalDrumPattern}`);
          console.log(`   New drum: ${preset.drumPattern}`);
          console.log(`   Old sticking: ${originalSticking}`);
          console.log(`   New sticking: ${preset.stickingPattern}`);
          
          fixedCount++;
        }
      }
      
      // Also fix sticking for patterns with H that are alternating R L incorrectly
      if (originalDrumPattern.includes('H') && originalSticking.includes('L')) {
        // Check if H is part of a beat pattern (not a fill)
        // For now, we'll be conservative and only fix obvious cases
        const tokens = originalDrumPattern.split(/\s+/);
        const hasBeatPattern = tokens.some((t, i) => {
          return (t === 'K' && tokens[i + 1] === 'H') || 
                 (t === 'S' && tokens[i + 1] === 'H') ||
                 (t === 'H' && (tokens[i - 1] === 'K' || tokens[i - 1] === 'S'));
        });
        
        if (hasBeatPattern) {
          // Regenerate sticking with H as R
          const newSticking = generateStickingForBeat(originalDrumPattern);
          if (newSticking !== originalSticking) {
            preset.stickingPattern = newSticking;
            
            console.log(`\n✅ Fixed sticking: ${preset.name}`);
            console.log(`   Old sticking: ${originalSticking}`);
            console.log(`   New sticking: ${preset.stickingPattern}`);
            
            fixedCount++;
          }
        }
      }
    }
  }
});

// Save updated presets
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log(`\n\n📊 Summary:`);
console.log(`   Reviewed: ${reviewedCount} famous beats`);
console.log(`   Fixed: ${fixedCount} patterns`);
console.log(`\n✅ Presets updated and saved to ${presetsPath}`);

