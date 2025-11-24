/**
 * Script to update preset sticking patterns to use shorter patterns (2-4 notes)
 * that repeat, matching the new feature requirements
 */

const fs = require('fs');
const path = require('path');

// Helper function to parse tokens
function parseTokens(value) {
  if (!value) return [];
  if (typeof value !== 'string') {
    if (Array.isArray) return value;
    value = String(value);
  }
  return value.trim().split(/\s+/).map(t => t.trim()).filter(Boolean);
}

// Helper function to format list
function formatList(list) {
  return list.join(' ');
}

// Generate shorter sticking pattern (2-4 notes) based on voicing
function generateShortSticking(drumPattern, notesPerBeat) {
  const drumTokens = parseTokens(drumPattern);
  
  // Find base voicing length (detect repetition)
  let baseVoicingLength = drumTokens.length;
  for (let len = 1; len <= Math.min(drumTokens.length / 2, 4); len++) {
    if (drumTokens.length % len === 0) {
      let isRepeating = true;
      for (let i = 0; i < drumTokens.length; i++) {
        if (drumTokens[i] !== drumTokens[i % len]) {
          isRepeating = false;
          break;
        }
      }
      if (isRepeating) {
        baseVoicingLength = len;
        break;
      }
    }
  }
  
  // Use just the base pattern tokens
  const baseVoicingTokens = drumTokens.slice(0, Math.min(baseVoicingLength, 4));
  
  // Check if voicing has K
  const hasKick = baseVoicingTokens.some(token => {
    const normalized = token.replace(/\+/g, ' ').toUpperCase();
    return normalized.includes('K');
  });
  
  // Determine sticking pattern length
  let stickingLength;
  if (hasKick) {
    // If voicing has K, sticking must be at least as long as voicing and divisible by it
    const minLength = baseVoicingTokens.length;
    const maxLength = Math.min(baseVoicingTokens.length * 2, 4);
    const validLengths = [];
    for (let len = minLength; len <= maxLength; len++) {
      if (len % baseVoicingTokens.length === 0 && len >= 2) {
        validLengths.push(len);
      }
    }
    stickingLength = validLengths.length > 0 
      ? validLengths[Math.floor(Math.random() * validLengths.length)]
      : baseVoicingTokens.length;
  } else {
    // No K: sticking can be 2-4 notes
    stickingLength = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
  }
  
  // Generate sticking pattern
  const stickingOptions = ['R', 'L'];
  const stickingTokens = [];
  
  // Respect rests in voicing
  for (let i = 0; i < stickingLength; i++) {
    const voicingToken = baseVoicingTokens[i % baseVoicingTokens.length];
    if (voicingToken && voicingToken.toUpperCase() === 'R' || voicingToken === '-') {
      stickingTokens.push('-');
    } else if (hasKick && voicingToken && voicingToken.toUpperCase().includes('K')) {
      stickingTokens.push('K');
    } else {
      // Alternate R/L, but avoid same hand twice in a row if possible
      const lastStick = stickingTokens[stickingTokens.length - 1];
      if (lastStick === 'R') {
        stickingTokens.push('L');
      } else if (lastStick === 'L') {
        stickingTokens.push('R');
      } else {
        stickingTokens.push(stickingOptions[Math.floor(Math.random() * stickingOptions.length)]);
      }
    }
  }
  
  return formatList(stickingTokens);
}

// Update a single preset
function updatePresetSticking(preset) {
  const { drumPattern, subdivision, timeSignature } = preset;
  
  // Calculate notes per beat
  const timeSigMatch = (timeSignature || '4/4').match(/^(\d+)\s*\/\s*(\d+)$/);
  const numerator = timeSigMatch ? parseInt(timeSigMatch[1], 10) : 4;
  const denominator = timeSigMatch ? parseInt(timeSigMatch[2], 10) : 4;
  const beatValue = denominator;
  const notesPerBeat = subdivision / beatValue;
  
  // Generate shorter sticking pattern
  const newSticking = generateShortSticking(drumPattern, notesPerBeat);
  
  return {
    ...preset,
    stickingPattern: newSticking
  };
}

// Main function
function main() {
  const presetsPath = path.join(__dirname, '..', 'public', 'practice-presets.json');
  
  console.log('Reading presets file...');
  const data = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));
  
  console.log(`Found ${data.presets.length} presets`);
  console.log('Updating sticking patterns...');
  
  // Update each preset
  const updatedPresets = data.presets.map((preset, index) => {
    if ((index + 1) % 20 === 0) {
      console.log(`  Updated ${index + 1}/${data.presets.length} presets...`);
    }
    return updatePresetSticking(preset);
  });
  
  // Update version
  data.version = '1.4';
  data.presets = updatedPresets;
  
  // Write back
  console.log('Writing updated presets file...');
  fs.writeFileSync(presetsPath, JSON.stringify(data, null, 2), 'utf8');
  
  console.log('Done! Updated all presets with shorter sticking patterns.');
}

main();

