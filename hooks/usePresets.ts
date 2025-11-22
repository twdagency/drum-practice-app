import { useState, useEffect } from 'react';
import { Preset, PresetsData } from '@/types/preset';
import { loadCustomPresets } from '@/lib/utils/presetStorage';

export const usePresets = () => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to trigger refresh of presets (useful after saving)
  const refreshPresets = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const loadPresets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load both JSON presets and custom presets from localStorage
        const [jsonResponse, customPresets] = await Promise.all([
          fetch('/practice-presets.json'),
          Promise.resolve(loadCustomPresets()),
        ]);
        
        if (!jsonResponse.ok) {
          throw new Error(`Failed to load presets: ${jsonResponse.statusText}`);
        }
        
        const data: PresetsData = await jsonResponse.json();
        const jsonPresets = data.presets || [];
        
        // Merge JSON presets with custom presets (custom presets take precedence for same ID)
        const presetMap = new Map<string, Preset>();
        
        // First add JSON presets
        jsonPresets.forEach(preset => {
          presetMap.set(preset.id, preset);
        });
        
        // Then add/override with custom presets
        customPresets.forEach(preset => {
          presetMap.set(preset.id, preset);
        });
        
        setPresets(Array.from(presetMap.values()));
      } catch (err) {
        console.error('Error loading presets:', err);
        setError(err instanceof Error ? err.message : 'Failed to load presets');
      } finally {
        setLoading(false);
      }
    };

    loadPresets();
  }, [refreshKey]);

  // Get unique categories
  const categories = Array.from(new Set(presets.map(p => p.category))).sort();
  
  // Get unique subcategories
  const subcategories = Array.from(new Set(presets.map(p => p.subcategory))).sort();
  
  // Get unique tags
  const tags = Array.from(new Set(presets.flatMap(p => p.tags))).sort();

  // Filter presets by category
  const filterByCategory = (category: string): Preset[] => {
    if (!category) return presets;
    return presets.filter(p => p.category === category);
  };

  // Filter presets by subcategory
  const filterBySubcategory = (subcategory: string): Preset[] => {
    if (!subcategory) return presets;
    return presets.filter(p => p.subcategory === subcategory);
  };

  // Filter presets by tag
  const filterByTag = (tag: string): Preset[] => {
    if (!tag) return presets;
    return presets.filter(p => p.tags.includes(tag));
  };

  // Search presets by name, description, or tags
  const searchPresets = (query: string): Preset[] => {
    if (!query.trim()) return presets;
    const lowerQuery = query.toLowerCase();
    return presets.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };

  // Filter presets by difficulty
  const filterByDifficulty = (minDifficulty: number, maxDifficulty: number): Preset[] => {
    return presets.filter(p => p.difficulty >= minDifficulty && p.difficulty <= maxDifficulty);
  };

  return {
    presets,
    loading,
    error,
    categories,
    subcategories,
    tags,
    filterByCategory,
    filterBySubcategory,
    filterByTag,
    searchPresets,
    filterByDifficulty,
    refreshPresets,
  };
};

