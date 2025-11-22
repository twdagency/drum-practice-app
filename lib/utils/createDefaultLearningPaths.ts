/**
 * Create default learning paths based on presets
 */

import { LearningPath } from '@/types/learningPath';
import { Preset } from '@/types/preset';

/**
 * Create default learning paths from presets
 * Organizes presets into structured learning paths by category and difficulty
 */
export function createDefaultLearningPaths(presets: Preset[]): LearningPath[] {
  const paths: LearningPath[] = [];

  // Group presets by category
  const presetsByCategory = new Map<string, Preset[]>();
  presets.forEach(preset => {
    if (!presetsByCategory.has(preset.category)) {
      presetsByCategory.set(preset.category, []);
    }
    presetsByCategory.get(preset.category)!.push(preset);
  });

  // Create a learning path for each category
  presetsByCategory.forEach((categoryPresets, category) => {
    // Sort by difficulty
    const sortedPresets = [...categoryPresets].sort((a, b) => a.difficulty - b.difficulty);

    if (sortedPresets.length === 0) return;

    // Create learning path
    const path: LearningPath = {
      id: `default-${category}`,
      name: `${category.charAt(0).toUpperCase() + category.slice(1)} Fundamentals`,
      description: `A progressive learning path through ${category} drumming techniques, starting with the basics and building up to more advanced patterns.`,
      category: category,
      difficulty: Math.round(sortedPresets.reduce((sum, p) => sum + p.difficulty, 0) / sortedPresets.length),
      steps: sortedPresets.map((preset, index) => ({
        presetId: preset.id,
        presetName: preset.name,
        order: index,
      })),
      estimatedDuration: sortedPresets.length * 5, // ~5 minutes per pattern
      tags: ['default', category, 'progressive'],
      createdAt: Date.now(),
    };

    paths.push(path);
  });

  // Create a "Complete Beginner" path with easiest presets
  const beginnerPresets = presets
    .filter(p => p.difficulty <= 2)
    .sort((a, b) => a.difficulty - b.difficulty)
    .slice(0, 10);

  if (beginnerPresets.length > 0) {
    paths.unshift({
      id: 'default-beginner-complete',
      name: 'Complete Beginner Path',
      description: 'Start here! A gentle introduction to drumming with the easiest patterns and rudiments.',
      category: 'beginner',
      difficulty: 1,
      steps: beginnerPresets.map((preset, index) => ({
        presetId: preset.id,
        presetName: preset.name,
        order: index,
      })),
      estimatedDuration: beginnerPresets.length * 5,
      tags: ['default', 'beginner', 'starter'],
      createdAt: Date.now(),
    });
  }

  return paths;
}

