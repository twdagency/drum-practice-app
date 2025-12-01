/**
 * Fix Accent Issues
 * 
 * 1. Fix excessive accents (patterns where all notes are accented)
 * 2. Add musically appropriate accents to patterns missing them
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

function calculateNotesPerBar(timeSignature, subdivision) {
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  const beatValue = denominator;
  const notesPerBeat = subdivision / beatValue;
  return numerator * notesPerBeat;
}

// Fix each preset
const fixedPresets = presetsData.presets.map(preset => {
  const name = (preset.name || '').toLowerCase();
  const description = (preset.description || '').toLowerCase();
  const allText = `${name} ${description}`;
  const tags = (preset.tags || []).map(t => t.toLowerCase()).join(' ');
  const fullText = `${allText} ${tags}`;
  
  let fixed = { ...preset };
  const notesPerBar = calculateNotesPerBar(preset.timeSignature, preset.subdivision);
  const drumTokens = parseTokens(preset.drumPattern || '');
  const currentAccents = preset.accents || [];
  const accentCount = currentAccents.length;
  const drumCount = drumTokens.filter(t => t !== 'K' && !t.startsWith('(')).length;
  
  // === FIX EXCESSIVE ACCENTS ===
  
  // "Accent Pattern - Every Other" - should accent every other note, not all
  if (preset.id === 'intermediate-accent-every-other') {
    // Accent every other note (0, 2, 4, 6, 8, 10, 12, 14 for 16 notes)
    const accents = [];
    for (let i = 0; i < notesPerBar; i += 2) {
      accents.push(i);
    }
    fixed.accents = accents;
    console.log(`Fixed ${preset.name}: Changed from all accents to every-other pattern`);
  }
  
  // If all notes are accented and it's not specifically an "all accent" exercise, reduce
  if (accentCount === drumCount && accentCount > 4 && 
      !fullText.includes('all accent') && 
      !fullText.includes('full accent') &&
      preset.id !== 'intermediate-accent-every-other') {
    // Reduce to accenting on beats (1, 3, 5, 7, etc. for 16th notes)
    const accents = [];
    const beatsPerBar = preset.timeSignature.split('/')[0];
    const notesPerBeat = notesPerBar / beatsPerBar;
    
    for (let beat = 0; beat < beatsPerBar; beat++) {
      accents.push(beat * notesPerBeat);
    }
    fixed.accents = accents;
    console.log(`Fixed ${preset.name}: Reduced from ${accentCount} to ${accents.length} accents`);
  }
  
  // === ADD MISSING ACCENTS ===
  // Add musically appropriate accents to patterns that don't have them
  
  if (!fixed.accents || fixed.accents.length === 0) {
    // Patterns that should have accents but don't
    
    // Rudiment patterns - accent the first note of each rudiment
    if (fullText.includes('paradiddle') && !fullText.includes('flam')) {
      // Accent first note of each paradiddle
      const accents = [];
      if (notesPerBar === 8) {
        accents.push(0); // First note
      } else if (notesPerBar === 16) {
        accents.push(0, 8); // First note of each paradiddle
      }
      if (accents.length > 0) {
        fixed.accents = accents;
        console.log(`Added accents to ${preset.name}`);
      }
    }
    
    // Stroke roll patterns - accent on beats
    else if (fullText.includes('stroke roll') || fullText.includes('single stroke') || fullText.includes('double stroke')) {
      const beatsPerBar = parseInt(preset.timeSignature.split('/')[0]);
      const notesPerBeat = notesPerBar / beatsPerBar;
      const accents = [];
      for (let beat = 0; beat < beatsPerBar; beat++) {
        accents.push(beat * notesPerBeat);
      }
      fixed.accents = accents;
      console.log(`Added accents to ${preset.name}`);
    }
    
    // Groove patterns - accent backbeat (2 and 4)
    else if (fullText.includes('groove') && preset.timeSignature === '4/4') {
      const notesPerBeat = notesPerBar / 4;
      fixed.accents = [notesPerBeat * 1, notesPerBeat * 3]; // Beats 2 and 4
      console.log(`Added backbeat accents to ${preset.name}`);
    }
    
    // Famous beats - accent backbeat
    else if (fullText.includes('famous beat') && preset.timeSignature === '4/4') {
      const notesPerBeat = notesPerBar / 4;
      fixed.accents = [notesPerBeat * 1, notesPerBeat * 3]; // Beats 2 and 4
      console.log(`Added backbeat accents to ${preset.name}`);
    }
    
    // Technique patterns - accent on downbeats
    else if (fullText.includes('technique') && preset.timeSignature === '4/4') {
      const notesPerBeat = notesPerBar / 4;
      const accents = [];
      for (let beat = 0; beat < 4; beat++) {
        accents.push(beat * notesPerBeat);
      }
      fixed.accents = accents;
      console.log(`Added downbeat accents to ${preset.name}`);
    }
  }
  
  return fixed;
});

// Update version
presetsData.version = '1.41';
presetsData.presets = fixedPresets;

// Write back
fs.writeFileSync(presetsPath, JSON.stringify(presetsData, null, 2), 'utf8');

console.log('\n=== FIXED ACCENT ISSUES ===\n');
console.log(`Total presets: ${fixedPresets.length}`);
console.log(`\n✅ Fixed excessive accents`);
console.log(`✅ Added musically appropriate accents to patterns missing them`);

