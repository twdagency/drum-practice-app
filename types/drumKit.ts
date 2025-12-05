/**
 * Drum Kit Types
 * Define available drum sample packs/kits
 */

export type DrumKitId = 
  | 'acoustic'      // Standard acoustic kit (current default)
  | 'electronic'    // Electronic/synthetic drums
  | 'jazz-brushes'  // Jazz kit with brushes
  | 'lo-fi'         // Lo-fi/vintage drums
  | '808'           // TR-808 style
  | 'rock';         // Punchy rock kit

export interface DrumKit {
  id: DrumKitId;
  name: string;
  description: string;
  folder: string;        // Folder name in public/sounds/
  isPremium?: boolean;   // Premium-only kit
  samples: {
    snare: string;
    kick: string;
    hiHat: string;
    highTom: string;
    midTom: string;
    floor: string;
    crash: string;
    ride: string;
  };
}

export const DRUM_KITS: DrumKit[] = [
  {
    id: 'acoustic',
    name: 'Acoustic',
    description: 'Clean acoustic drum kit - great for all-around practice',
    folder: 'acoustic',
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
  },
  {
    id: 'electronic',
    name: 'Electronic',
    description: 'Punchy electronic drums - perfect for modern styles',
    folder: 'electronic',
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
  },
  {
    id: 'jazz-brushes',
    name: 'Jazz Brushes',
    description: 'Soft brush sounds - ideal for jazz and ballads',
    folder: 'jazz-brushes',
    samples: {
      snare: 'snare-brush.wav',
      kick: 'kick.wav',
      hiHat: 'hihat.wav',
      highTom: 'high-tom.wav',
      midTom: 'mid-tom.wav',
      floor: 'floor.wav',
      crash: 'crash.wav',
      ride: 'ride.wav',
    },
  },
  {
    id: 'lo-fi',
    name: 'Lo-Fi',
    description: 'Vintage lo-fi drums - warm and nostalgic',
    folder: 'lo-fi',
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
  },
  {
    id: '808',
    name: 'TR-808',
    description: 'Classic 808 sounds - hip-hop and electronic essentials',
    folder: '808',
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
  },
  {
    id: 'rock',
    name: 'Rock',
    description: 'Powerful rock drums - punchy and aggressive',
    folder: 'rock',
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
  },
];

export function getDrumKit(id: DrumKitId): DrumKit {
  return DRUM_KITS.find(kit => kit.id === id) || DRUM_KITS[0];
}

export function getSamplePath(kit: DrumKit, sample: keyof DrumKit['samples']): string {
  return `/sounds/${kit.folder}/${kit.samples[sample]}`;
}


