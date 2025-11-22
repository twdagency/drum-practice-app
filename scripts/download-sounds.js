/**
 * Script to download drum sounds from the-open-source-drumkit repository
 * 
 * This script downloads the first .wav file from each folder in the repository.
 * You may need to manually adjust which file to use if you want specific samples.
 * 
 * Usage: node scripts/download-sounds.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// GitHub raw content URL base
const BASE_URL = 'https://raw.githubusercontent.com/crabacus/the-open-source-drumkit/master/';

// Mapping of our sound files to repository folders
// Note: You'll need to check what files are actually in each folder
// This is a template - adjust file names based on what's in the repo
const SOUNDS_TO_DOWNLOAD = [
  { repoFolder: 'snare', fileName: 'snare.wav', localPath: 'public/sounds/snare.wav' },
  { repoFolder: 'kick', fileName: 'kick.wav', localPath: 'public/sounds/kick.wav' },
  { repoFolder: 'toms', fileName: 'tom.wav', localPath: 'public/sounds/tom.wav' },
  { repoFolder: 'toms', fileName: 'floor.wav', localPath: 'public/sounds/floor.wav' },
];

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${filePath}`);
          resolve();
        });
      } else if (response.statusCode === 404) {
        file.close();
        fs.unlinkSync(filePath);
        console.error(`✗ File not found: ${url}`);
        console.error(`  Please check the repository for available files in that folder`);
        reject(new Error(`File not found: ${url}`));
      } else {
        file.close();
        fs.unlinkSync(filePath);
        reject(new Error(`Failed to download: ${url} (Status: ${response.statusCode})`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

async function main() {
  console.log('Downloading drum sounds from the-open-source-drumkit...\n');
  
  // Ensure sounds directory exists
  const soundsDir = path.join(process.cwd(), 'public', 'sounds');
  if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true });
  }
  
  for (const sound of SOUNDS_TO_DOWNLOAD) {
    const url = `${BASE_URL}${sound.repoFolder}/${sound.fileName}`;
    const filePath = path.join(process.cwd(), sound.localPath);
    
    try {
      await downloadFile(url, filePath);
    } catch (error) {
      console.error(`Error downloading ${sound.fileName}:`, error.message);
      console.log(`\nPlease manually download from: https://github.com/crabacus/the-open-source-drumkit/tree/master/${sound.repoFolder}`);
    }
  }
  
  console.log('\n✓ Done! If some files failed, check the repository manually.');
  console.log('Repository: https://github.com/crabacus/the-open-source-drumkit');
}

main().catch(console.error);

