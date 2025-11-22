# Download Drum Sounds from Open Source Drum Kit

This guide helps you download drum sounds from [the-open-source-drumkit](https://github.com/crabacus/the-open-source-drumkit).

## Current Sound Requirements

The app currently uses:
- `snare.wav` (S)
- `kick.wav` (K)
- `tom.wav` (T)
- `floor.wav` (F)

## Repository Structure

The repository has these folders:
- `snare/` - Snare drum samples
- `kick/` - Kick drum samples
- `toms/` - Tom samples
- `hihat/` - Hi-hat samples
- `crash/`, `gong/`, `ride/`, `rimshot/`, `sidestick/` - Additional samples

## Manual Download Steps

1. Visit the repository: https://github.com/crabacus/the-open-source-drumkit
2. Navigate to each folder and download one `.wav` file:
   - **snare folder** → Pick one file → Save as `public/sounds/snare.wav`
   - **kick folder** → Pick one file → Save as `public/sounds/kick.wav`
   - **toms folder** → Pick one file → Save as `public/sounds/tom.wav`
   - **toms folder** → Pick a different file → Save as `public/sounds/floor.wav` (or use a tom for floor)

## Alternative: Use Git Clone (if you have git installed)

```bash
# Clone the repository to a temporary location
git clone https://github.com/crabacus/the-open-source-drumkit.git temp-drumkit

# Copy the first file from each folder
# (You'll need to manually choose which file from each folder)
# Example (adjust file names based on what's actually in the folders):
copy temp-drumkit\snare\*.wav public\sounds\snare.wav
copy temp-drumkit\kick\*.wav public\sounds\kick.wav
copy temp-drumkit\toms\*.wav public\sounds\tom.wav

# Clean up
rmdir /s temp-drumkit
```

## Note

The repository folders contain multiple samples. You may want to:
1. Listen to a few samples from each folder
2. Pick the ones that sound best for your use case
3. Ensure they're not too long (short samples work best for drum patterns)

