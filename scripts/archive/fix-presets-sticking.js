/**
 * Script to fix preset sticking patterns
 * Preserves rudiment patterns (paradiddles, etc.) that need specific lengths
 * Only shortens simple patterns that can repeat
 */

const fs = require('fs');
const path = require('path');

// Rudiment patterns that must be preserved exactly
const RUDIMENT_PATTERNS = {
  // Paradiddles
  'paradiddle': 'R L R R L R L L',
  'single paradiddle': 'R L R R L R L L',
  'inverted paradiddle': 'R L L R L R R L',
  'paradiddle-diddle': 'R L R R L L',
  'double paradiddle': 'R L R L R R L R L R L L',
  'triple paradiddle': 'R L R L R L R R L R L R L R L L',
  
  // Rolls
  'single stroke roll': 'R L',
  'double stroke roll': 'R R L L',
  'single stroke four': 'R R R R L L L L',
  'six stroke roll': 'R R L L R L',
  'seven stroke roll': 'R R L L R L R',
  'nine stroke roll': 'R R L L R R L L R',
  
  // Drags
  'drag': 'R R L',
  'single drag tap': 'R R L R L L',
  'double drag tap': 'R R L R R L L L',
  
  // Other rudiments
  'swiss army triplet': 'R L R',
  'pataflafla': 'R L R L',
  'flam tap': 'lR rL R L',
  'flam accent': 'lR rL R L',
};

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

// Check if preset name/tags/description indicates a rudiment
function isRudimentPreset(preset) {
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const tags = (preset.tags || []).map(t => t.toLowerCase());
  const allText = `${name} ${description} ${tags.join(' ')}`;
  
  // Check for rudiment keywords
  const rudimentKeywords = [
    'paradiddle', 'roll', 'drag', 'flam', 'ruff',
    'rudiment', 'swiss army', 'pataflafla', 'triplet'
  ];
  
  return rudimentKeywords.some(keyword => allText.includes(keyword));
}

// Get the correct rudiment sticking pattern
function getRudimentSticking(preset) {
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const tags = (preset.tags || []).map(t => t.toLowerCase());
  const allText = `${name} ${description} ${tags.join(' ')}`;
  
  // Check each rudiment pattern
  for (const [key, pattern] of Object.entries(RUDIMENT_PATTERNS)) {
    if (allText.includes(key)) {
      return pattern;
    }
  }
  
  return null;
}

// Generate shorter sticking pattern for non-rudiment patterns
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
    if (voicingToken && (voicingToken.toUpperCase() === 'R' || voicingToken === '-')) {
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
  // Check if this is a rudiment that needs preserving
  if (isRudimentPreset(preset)) {
    const rudimentSticking = getRudimentSticking(preset);
    if (rudimentSticking) {
      // Preserve the rudiment pattern
      return {
        ...preset,
        stickingPattern: rudimentSticking
      };
    }
  }
  
  // For non-rudiments, generate shorter sticking
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
  console.log('Fixing sticking patterns (preserving rudiments)...');
  
  let rudimentCount = 0;
  let shortenedCount = 0;
  
  // Update each preset
  const updatedPresets = data.presets.map((preset, index) => {
    if ((index + 1) % 20 === 0) {
      console.log(`  Processing ${index + 1}/${data.presets.length} presets...`);
    }
    
    const isRudiment = isRudimentPreset(preset);
    if (isRudiment) {
      rudimentCount++;
    } else {
      shortenedCount++;
    }
    
    return updatePresetSticking(preset);
  });
  
  // Update version
  data.version = '1.5';
  data.presets = updatedPresets;
  
  // Write back
  console.log('Writing updated presets file...');
  fs.writeFileSync(presetsPath, JSON.stringify(data, null, 2), 'utf8');
  
  console.log(`Done! Preserved ${rudimentCount} rudiment patterns, shortened ${shortenedCount} simple patterns.`);
}

main();

