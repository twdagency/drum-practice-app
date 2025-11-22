/**
 * Utility functions for saving and loading custom presets from localStorage
 */

import { Preset } from '@/types/preset';
import { Pattern } from '@/types/pattern';

const CUSTOM_PRESETS_KEY = 'dpgen_custom_presets';

/**
 * Load custom presets from localStorage
 */
export function loadCustomPresets(): Preset[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading custom presets:', error);
    return [];
  }
}

/**
 * Save a custom preset to localStorage
 */
export function saveCustomPreset(preset: Preset): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = loadCustomPresets();
    
    // Check if preset with same ID already exists
    const existingIndex = existing.findIndex(p => p.id === preset.id);
    
    if (existingIndex >= 0) {
      // Update existing preset
      existing[existingIndex] = preset;
    } else {
      // Add new preset
      existing.push(preset);
    }
    
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Error saving custom preset:', error);
    throw new Error('Failed to save preset');
  }
}

/**
 * Delete a custom preset from localStorage
 */
export function deleteCustomPreset(presetId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = loadCustomPresets();
    const filtered = existing.filter(p => p.id !== presetId);
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting custom preset:', error);
    throw new Error('Failed to delete preset');
  }
}

/**
 * Convert a Pattern to a Preset
 */
export function patternToPreset(
  pattern: Pattern,
  metadata: {
    name: string;
    category: string;
    subcategory: string;
    tags: string[];
    description: string;
    difficulty: number;
    bpm?: number;
  }
): Preset {
  // Generate a unique ID based on name and timestamp
  const id = `custom-${metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
  
  return {
    id,
    name: metadata.name,
    category: metadata.category,
    subcategory: metadata.subcategory,
    tags: metadata.tags,
    description: metadata.description,
    timeSignature: pattern.timeSignature,
    subdivision: pattern.subdivision,
    phrase: pattern.phrase,
    drumPattern: pattern.drumPattern,
    stickingPattern: pattern.stickingPattern,
    bpm: metadata.bpm || 60,
    repeat: pattern.repeat || 4,
    difficulty: metadata.difficulty,
  };
}

/**
 * Generate a default preset name from pattern data
 */
export function generateDefaultPresetName(pattern: Pattern, index: number): string {
  const subdivision = pattern.subdivision;
  const subdivisionText = subdivision === 4 ? 'Quarter' :
                          subdivision === 8 ? 'Eighth' :
                          subdivision === 12 ? 'Triplet' :
                          subdivision === 16 ? '16th' :
                          subdivision === 24 ? 'Triplet 16th' :
                          subdivision === 32 ? '32nd' :
                          `${subdivision}`;
  
  return `Custom ${subdivisionText} Pattern ${index + 1}`;
}

