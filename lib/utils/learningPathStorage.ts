/**
 * Utility functions for managing learning paths and progress
 */

import { LearningPath, LearningPathProgress } from '@/types/learningPath';

const LEARNING_PATHS_KEY = 'dpgen_learning_paths';
const LEARNING_PROGRESS_KEY = 'dpgen_learning_progress';

/**
 * Load learning paths from localStorage
 */
export function loadLearningPaths(): LearningPath[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(LEARNING_PATHS_KEY);
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading learning paths:', error);
    return [];
  }
}

/**
 * Save a learning path to localStorage
 */
export function saveLearningPath(path: LearningPath): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = loadLearningPaths();
    const existingIndex = existing.findIndex(p => p.id === path.id);
    
    const updatedPath = {
      ...path,
      updatedAt: Date.now(),
    };
    
    if (existingIndex >= 0) {
      existing[existingIndex] = updatedPath;
    } else {
      existing.push({
        ...updatedPath,
        createdAt: Date.now(),
      });
    }
    
    localStorage.setItem(LEARNING_PATHS_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Error saving learning path:', error);
    throw new Error('Failed to save learning path');
  }
}

/**
 * Delete a learning path from localStorage
 */
export function deleteLearningPath(pathId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = loadLearningPaths();
    const filtered = existing.filter(p => p.id !== pathId);
    localStorage.setItem(LEARNING_PATHS_KEY, JSON.stringify(filtered));
    
    // Also delete progress for this path
    deleteLearningPathProgress(pathId);
  } catch (error) {
    console.error('Error deleting learning path:', error);
    throw new Error('Failed to delete learning path');
  }
}

/**
 * Load learning path progress from localStorage
 */
export function loadLearningPathProgress(): Record<string, LearningPathProgress> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(LEARNING_PROGRESS_KEY);
    if (!stored) return {};
    
    const data = JSON.parse(stored);
    return typeof data === 'object' && data !== null ? data : {};
  } catch (error) {
    console.error('Error loading learning path progress:', error);
    return {};
  }
}

/**
 * Save learning path progress
 */
export function saveLearningPathProgress(progress: LearningPathProgress): void {
  if (typeof window === 'undefined') return;
  
  try {
    const allProgress = loadLearningPathProgress();
    allProgress[progress.pathId] = {
      ...progress,
      lastAccessedAt: Date.now(),
    };
    localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Error saving learning path progress:', error);
    throw new Error('Failed to save progress');
  }
}

/**
 * Delete learning path progress
 */
export function deleteLearningPathProgress(pathId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const allProgress = loadLearningPathProgress();
    delete allProgress[pathId];
    localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Error deleting learning path progress:', error);
  }
}

/**
 * Get progress for a specific learning path
 */
export function getLearningPathProgress(pathId: string): LearningPathProgress | null {
  const allProgress = loadLearningPathProgress();
  return allProgress[pathId] || null;
}

/**
 * Mark a step as completed
 */
export function completeLearningPathStep(pathId: string, stepIndex: number): void {
  const progress = getLearningPathProgress(pathId);
  const paths = loadLearningPaths();
  const path = paths.find(p => p.id === pathId);
  
  if (!path) return;
  
  const newProgress: LearningPathProgress = progress || {
    pathId,
    currentStepIndex: stepIndex,
    stepsCompleted: 0,
    totalSteps: path.steps.length,
    startedAt: Date.now(),
  };
  
  // Update step index if moving forward
  if (stepIndex >= newProgress.currentStepIndex) {
    newProgress.currentStepIndex = stepIndex + 1;
    newProgress.stepsCompleted = Math.max(newProgress.stepsCompleted, stepIndex + 1);
  }
  
  // Check if path is complete
  if (newProgress.stepsCompleted >= newProgress.totalSteps) {
    newProgress.completed = true;
    newProgress.completedAt = Date.now();
    newProgress.currentStepIndex = newProgress.totalSteps;
  }
  
  saveLearningPathProgress(newProgress);
}

/**
 * Reset progress for a learning path
 */
export function resetLearningPathProgress(pathId: string): void {
  deleteLearningPathProgress(pathId);
}

