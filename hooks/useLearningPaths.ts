/**
 * Hook for managing learning paths
 */

import { useState, useEffect, useCallback } from 'react';
import { LearningPath, LearningPathProgress } from '@/types/learningPath';
import {
  loadLearningPaths,
  saveLearningPath,
  deleteLearningPath,
  loadLearningPathProgress,
  saveLearningPathProgress,
  getLearningPathProgress,
  completeLearningPathStep,
  resetLearningPathProgress,
} from '@/lib/utils/learningPathStorage';

export const useLearningPaths = () => {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [progress, setProgress] = useState<Record<string, LearningPathProgress>>({});
  const [loading, setLoading] = useState(true);

  // Load paths and progress on mount
  useEffect(() => {
    const pathsData = loadLearningPaths();
    const progressData = loadLearningPathProgress();
    setPaths(pathsData);
    setProgress(progressData);
    setLoading(false);
  }, []);

  // Refresh paths
  const refreshPaths = useCallback(() => {
    const pathsData = loadLearningPaths();
    const progressData = loadLearningPathProgress();
    setPaths(pathsData);
    setProgress(progressData);
  }, []);

  // Save a path
  const savePath = useCallback((path: LearningPath) => {
    saveLearningPath(path);
    refreshPaths();
  }, [refreshPaths]);

  // Delete a path
  const deletePath = useCallback((pathId: string) => {
    deleteLearningPath(pathId);
    refreshPaths();
  }, [refreshPaths]);

  // Get progress for a path
  const getProgress = useCallback((pathId: string): LearningPathProgress | null => {
    return progress[pathId] || getLearningPathProgress(pathId) || null;
  }, [progress]);

  // Complete a step
  const completeStep = useCallback((pathId: string, stepIndex: number) => {
    completeLearningPathStep(pathId, stepIndex);
    refreshPaths();
  }, [refreshPaths]);

  // Reset progress for a path
  const resetProgress = useCallback((pathId: string) => {
    resetLearningPathProgress(pathId);
    refreshPaths();
  }, [refreshPaths]);

  // Get categories
  const categories = Array.from(new Set(paths.map(p => p.category))).sort();

  // Get paths by category
  const getPathsByCategory = useCallback((category: string): LearningPath[] => {
    if (!category) return paths;
    return paths.filter(p => p.category === category);
  }, [paths]);

  // Get paths by difficulty
  const getPathsByDifficulty = useCallback((minDifficulty: number, maxDifficulty: number): LearningPath[] => {
    return paths.filter(p => p.difficulty >= minDifficulty && p.difficulty <= maxDifficulty);
  }, [paths]);

  return {
    paths,
    progress,
    loading,
    categories,
    refreshPaths,
    savePath,
    deletePath,
    getProgress,
    completeStep,
    resetProgress,
    getPathsByCategory,
    getPathsByDifficulty,
  };
};

