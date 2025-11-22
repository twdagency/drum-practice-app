/**
 * Learning Path type definitions
 */

export interface LearningPathStep {
  presetId: string;
  presetName?: string; // Cached name for display
  order: number; // Position in the path
  completed?: boolean; // User progress
  completedAt?: number; // Timestamp when completed
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: number; // Overall difficulty (1-10)
  steps: LearningPathStep[];
  estimatedDuration?: number; // In minutes
  tags?: string[];
  createdAt?: number;
  updatedAt?: number;
}

export interface LearningPathProgress {
  pathId: string;
  currentStepIndex: number;
  stepsCompleted: number;
  totalSteps: number;
  startedAt?: number;
  lastAccessedAt?: number;
  completed?: boolean;
  completedAt?: number;
}

export interface LearningPathsData {
  version: string;
  paths: LearningPath[];
}

