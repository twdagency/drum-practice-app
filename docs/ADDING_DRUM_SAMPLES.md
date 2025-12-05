# Adding New Drum Sample Packs

## Current Setup

The drum kit selector is implemented! Users can choose from 6 drum kits in the Audio Settings modal.

**Current Status:** Using existing acoustic samples as fallback for all kits until new samples are added.

## Quick Start: Download Free Samples

### 🥁 ACOUSTIC KIT (Current Default)
Already have samples in `public/sounds/` - no action needed!

### 🎹 ELECTRONIC KIT
**Download from:** https://99sounds.org/drum-samples/
1. Download "99 Drum Samples II" 
2. Extract and find electronic-sounding samples
3. Create `public/sounds/electronic/` folder
4. Copy and rename files to: snare.wav, kick.wav, hihat.wav, etc.

### 🎤 808 KIT
**Download from:** https://99sounds.org/music-loops/
1. Download the pack (includes 808 samples in bonus folder)
2. Create `public/sounds/808/` folder
3. Find files in the "808" or "Drums" subfolder
4. Rename to: snare.wav, kick.wav, hihat.wav, etc.

**Alternative:** https://www.musicradar.com/news/sampleradar-378-free-808-drum-samples

### 🎷 JAZZ BRUSHES
**Download from:** https://freesound.org/search/?q=jazz+brush+drum
1. Search for individual samples: "jazz brush snare", "jazz kick", etc.
2. Create `public/sounds/jazz-brushes/` folder
3. Download and rename files

### 🎚️ LO-FI KIT
**Option 1:** Process acoustic samples
- Apply low-pass filter (cut above 8kHz)
- Add saturation/tape warmth
- Reduce high frequencies

**Option 2:** https://freesound.org/search/?q=lo-fi+drum

### 🎸 ROCK KIT
**Download from:** https://bedroomproducersblog.com/2024/02/08/drumthrash-free-drums/
1. Download DrumThrash free acoustic kit
2. These are punchy, rock-suitable drums
3. Create `public/sounds/rock/` folder
4. Copy and rename files

---

## Folder Structure

```
public/sounds/
├── snare.wav        # (existing - fallback for all kits)
├── kick.wav
├── hihat.wav
├── high-tom.wav
├── mid-tom.wav
├── floor.wav
├── crash.wav
├── ride.wav
│
├── acoustic/        # Optional - uses flat files if not present
│   └── (8 wav files)
├── electronic/
│   └── (8 wav files)
├── jazz-brushes/
│   └── (8 wav files - snare can be snare-brush.wav)
├── lo-fi/
│   └── (8 wav files)
├── 808/
│   └── (8 wav files)
└── rock/
    └── (8 wav files)
```

## Required Files Per Kit

Each kit folder needs these 8 files:
- `snare.wav` (or `snare-brush.wav` for jazz)
- `kick.wav`
- `hihat.wav`
- `high-tom.wav`
- `mid-tom.wav`
- `floor.wav`
- `crash.wav`
- `ride.wav`

## Sample Requirements

| Property | Requirement |
|----------|-------------|
| Format | WAV (16-bit or 24-bit) |
| Sample Rate | 44.1kHz or 48kHz |
| Length | 0.5-2 seconds |
| Normalization | Peak normalize to -1dB |

## Fallback Behavior

The audio loader tries paths in this order:
1. Kit-specific folder: `/sounds/{kit}/snare.wav`
2. Acoustic folder: `/sounds/acoustic/snare.wav`
3. Legacy flat path: `/sounds/snare.wav`

This means the app works immediately with existing samples!

## Helper Script

```bash
# Setup folders and check status
node scripts/download-drum-samples.js setup
node scripts/download-drum-samples.js status
node scripts/download-drum-samples.js links
```

## Testing New Samples

1. Add samples to the appropriate folder
2. Open the app: `npm run dev`
3. Go to Audio Settings (🔊 icon in toolbar)
4. Select the kit you added samples for
5. Enable "Play Drum Sounds"
6. Play a pattern to test

## Adding New Kits

Edit `types/drumKit.ts`:

```typescript
{
  id: 'new-kit-id',
  name: 'New Kit Name',
  description: 'Description for UI',
  folder: 'new-kit-folder',
  isPremium: false,
  samples: {
    snare: 'snare.wav',
    kick: 'kick.wav',
    hiHat: 'hihat.wav',
    highTom: 'high-tom.wav',
    midTom: 'mid-tom.wav',
    floor: 'floor.wav',
    crash: 'crash.wav',
    ride: 'ride.wav',
  },
}
```

## Free Sample Sources (All Royalty-Free)

| Source | URL | Best For |
|--------|-----|----------|
| 99Sounds | https://99sounds.org/drum-samples/ | Acoustic, Electronic |
| MusicRadar | https://www.musicradar.com/news/sampleradar-378-free-808-drum-samples | 808 |
| Freesound | https://freesound.org | Any (search specific) |
| Bedroom Producers Blog | https://bedroomproducersblog.com | Curated packs |
| Wavbvkery | https://wavbvkery.com | Electronic |

---

*Last updated: Kit selector implemented, fallback working, samples can be added incrementally*


