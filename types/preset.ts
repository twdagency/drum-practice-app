export interface Preset {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  tags: string[];
  description: string;
  timeSignature: string;
  subdivision: number;
  phrase: string;
  drumPattern: string;
  stickingPattern: string;
  bpm: number;
  repeat: number;
  difficulty: number;
}

export interface PresetsData {
  version: string;
  presets: Preset[];
}

