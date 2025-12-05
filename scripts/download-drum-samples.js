/**
 * Drum Sample Download Guide & Helper Script
 * 
 * This script helps organize downloaded drum samples into the correct folder structure.
 * 
 * HOW TO USE:
 * 1. Download sample packs from the sources listed below
 * 2. Extract them to a temporary folder
 * 3. Run: node scripts/download-drum-samples.js organize <source-folder>
 * 
 * FREE SAMPLE SOURCES (all royalty-free for commercial use):
 * 
 * ACOUSTIC KIT:
 * - 99Sounds Drum Samples: https://99sounds.org/drum-samples/
 * - DrumThrash Free Acoustic: https://bedroomproducersblog.com/2024/02/08/drumthrash-free-drums/
 * 
 * ELECTRONIC KIT:
 * - 99Sounds Electronic Drums: https://99sounds.org/drum-samples/
 * - Wavbvkery Electronic Drums: https://wavbvkery.com/
 * 
 * 808 KIT:
 * - MusicRadar 808 Samples: https://www.musicradar.com/news/sampleradar-378-free-808-drum-samples
 * - 99Sounds 808 Samples (in Music Loops pack): https://99sounds.org/music-loops/
 * 
 * JAZZ BRUSHES:
 * - Looperman Jazz Brushes: https://www.looperman.com/loops/tags/free-jazz-drum-loops
 * - Look for individual brush snare hits
 * 
 * LO-FI KIT:
 * - Process acoustic samples with low-pass filter and saturation
 * - Or search for "lo-fi drum samples" on Freesound.org
 * 
 * ROCK KIT:
 * - DrumThrash punchy acoustic drums
 * - Process with compression for more punch
 */

const fs = require('fs');
const path = require('path');

const KITS = ['acoustic', 'electronic', 'jazz-brushes', 'lo-fi', '808', 'rock'];
const SAMPLES = ['snare.wav', 'kick.wav', 'hihat.wav', 'high-tom.wav', 'mid-tom.wav', 'floor.wav', 'crash.wav', 'ride.wav'];

const SOUNDS_DIR = path.join(__dirname, '..', 'public', 'sounds');

// Create folder structure
function createFolderStructure() {
  console.log('Creating folder structure...\n');
  
  KITS.forEach(kit => {
    const kitPath = path.join(SOUNDS_DIR, kit);
    if (!fs.existsSync(kitPath)) {
      fs.mkdirSync(kitPath, { recursive: true });
      console.log(`✓ Created: public/sounds/${kit}/`);
    } else {
      console.log(`  Exists: public/sounds/${kit}/`);
    }
  });
  
  console.log('\nFolder structure ready!');
}

// Copy existing samples to acoustic folder
function copyToAcoustic() {
  console.log('\nCopying existing samples to acoustic folder...\n');
  
  const acousticPath = path.join(SOUNDS_DIR, 'acoustic');
  if (!fs.existsSync(acousticPath)) {
    fs.mkdirSync(acousticPath, { recursive: true });
  }
  
  const existingSamples = [
    { from: 'snare.wav', to: 'snare.wav' },
    { from: 'kick.wav', to: 'kick.wav' },
    { from: 'hihat.wav', to: 'hihat.wav' },
    { from: 'high-tom.wav', to: 'high-tom.wav' },
    { from: 'mid-tom.wav', to: 'mid-tom.wav' },
    { from: 'floor.wav', to: 'floor.wav' },
    { from: 'crash.wav', to: 'crash.wav' },
    { from: 'ride.wav', to: 'ride.wav' },
  ];
  
  existingSamples.forEach(({ from, to }) => {
    const sourcePath = path.join(SOUNDS_DIR, from);
    const destPath = path.join(acousticPath, to);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✓ Copied: ${from} → acoustic/${to}`);
    } else {
      console.log(`✗ Not found: ${from}`);
    }
  });
}

// Check what samples are present
function checkStatus() {
  console.log('\n=== DRUM KIT SAMPLE STATUS ===\n');
  
  KITS.forEach(kit => {
    const kitPath = path.join(SOUNDS_DIR, kit);
    console.log(`\n${kit.toUpperCase()}:`);
    
    if (!fs.existsSync(kitPath)) {
      console.log('  ✗ Folder does not exist');
      return;
    }
    
    SAMPLES.forEach(sample => {
      const samplePath = path.join(kitPath, sample);
      if (fs.existsSync(samplePath)) {
        const stats = fs.statSync(samplePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`  ✓ ${sample} (${sizeMB} MB)`);
      } else {
        console.log(`  ✗ ${sample} - MISSING`);
      }
    });
  });
}

// Print download links
function printDownloadLinks() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║                    FREE DRUM SAMPLE DOWNLOAD LINKS                      ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                         ║
║  ACOUSTIC & GENERAL:                                                    ║
║  • 99Sounds Drum Samples I:                                            ║
║    https://99sounds.org/drum-samples/                                   ║
║                                                                         ║
║  • DrumThrash Free Acoustic Kit:                                        ║
║    https://bedroomproducersblog.com/2024/02/08/drumthrash-free-drums/  ║
║                                                                         ║
║  808 SAMPLES:                                                           ║
║  • MusicRadar 378 Free 808 Samples:                                     ║
║    https://www.musicradar.com/news/sampleradar-378-free-808-drum-samples║
║                                                                         ║
║  • 99Sounds Music Loops (includes 808 kit):                             ║
║    https://99sounds.org/music-loops/                                    ║
║                                                                         ║
║  ELECTRONIC:                                                            ║
║  • Wavbvkery Free Electronic Drums:                                     ║
║    https://wavbvkery.com/                                               ║
║                                                                         ║
║  JAZZ BRUSHES:                                                          ║
║  • Freesound.org (search "jazz brush snare"):                           ║
║    https://freesound.org/search/?q=jazz+brush+snare                     ║
║                                                                         ║
║  LO-FI:                                                                 ║
║  • Process acoustic samples with saturation and low-pass filter         ║
║  • Or search Freesound for "lo-fi drums"                                ║
║                                                                         ║
║  ROCK:                                                                  ║
║  • Use punchy acoustic samples or add compression                       ║
║                                                                         ║
╚════════════════════════════════════════════════════════════════════════╝

INSTRUCTIONS:
1. Download samples from links above
2. Extract to temporary folder
3. Rename files to match: snare.wav, kick.wav, hihat.wav, 
   high-tom.wav, mid-tom.wav, floor.wav, crash.wav, ride.wav
4. Copy to public/sounds/<kit-name>/
5. Run: node scripts/download-drum-samples.js status

`);
}

// Main
const command = process.argv[2] || 'help';

switch (command) {
  case 'setup':
    createFolderStructure();
    copyToAcoustic();
    console.log('\n✓ Setup complete! Run "npm run dev" and test the app.');
    break;
    
  case 'status':
    checkStatus();
    break;
    
  case 'links':
    printDownloadLinks();
    break;
    
  case 'help':
  default:
    console.log(`
Drum Sample Download Helper

Usage:
  node scripts/download-drum-samples.js <command>

Commands:
  setup   - Create folder structure and copy existing samples to acoustic/
  status  - Check which samples are present for each kit
  links   - Show download links for free sample packs
  help    - Show this help message

Example:
  node scripts/download-drum-samples.js setup
  node scripts/download-drum-samples.js links
  node scripts/download-drum-samples.js status
`);
}


