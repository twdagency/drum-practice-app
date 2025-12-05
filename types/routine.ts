/**
 * Practice Routine Type Definitions
 * Structured guided practice sessions
 */

export type RoutineDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type RoutineCategory = 'warmup' | 'technique' | 'speed' | 'genre' | 'comprehensive' | 'challenge';

export interface RoutineExercise {
  id: string;
  presetId: string; // Links to preset pattern
  name: string;
  duration: number; // minutes
  startBPM: number;
  targetBPM?: number; // For tempo progression exercises
  focusArea: string;
  instructions: string;
  tips?: string[];
  restAfter?: number; // seconds of rest after exercise
}

export interface PracticeRoutine {
  id: string;
  name: string;
  description: string;
  category: RoutineCategory;
  difficulty: RoutineDifficulty;
  totalDuration: number; // minutes (calculated from exercises)
  icon: string; // Emoji for visual representation
  exercises: RoutineExercise[];
  tags: string[];
  goals: string[]; // What user will achieve
  prerequisites?: string[]; // Recommended prior experience
}

export interface RoutineProgress {
  routineId: string;
  currentExerciseIndex: number;
  exerciseStartTime: number | null;
  exerciseElapsedTime: number;
  completedExercises: string[]; // exercise IDs
  totalTimeSpent: number; // seconds
  isActive: boolean;
  isPaused: boolean;
  startedAt: number; // timestamp
}

export interface RoutineHistory {
  routineId: string;
  routineName: string;
  completedAt: number; // timestamp
  totalTime: number; // seconds
  exercisesCompleted: number;
  exercisesTotal: number;
  averageAccuracy?: number;
}

export interface RoutineState {
  availableRoutines: PracticeRoutine[];
  currentRoutine: PracticeRoutine | null;
  progress: RoutineProgress | null;
  history: RoutineHistory[];
}

