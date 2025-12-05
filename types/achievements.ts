/**
 * Achievement and Badge System Types
 */

export type BadgeCategory = 'learning' | 'practice' | 'streak' | 'mastery' | 'speed' | 'special';
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon: string; // lucide-react icon name
  requirement: BadgeRequirement;
  points: number; // Achievement points
}

export type BadgeRequirement = 
  | { type: 'learning_paths_completed'; count: number }
  | { type: 'learning_path_completed'; pathId?: string }
  | { type: 'routines_completed'; count: number }
  | { type: 'routine_completed'; routineId?: string }
  | { type: 'practice_streak'; days: number }
  | { type: 'total_practice_time'; minutes: number }
  | { type: 'patterns_practiced'; count: number }
  | { type: 'accuracy_achieved'; percentage: number; sessions: number }
  | { type: 'max_bpm'; bpm: number }
  | { type: 'steps_completed'; count: number }
  | { type: 'exercises_completed'; count: number }
  | { type: 'first_action'; action: string };

export interface UserBadge {
  badgeId: string;
  earnedAt: number; // timestamp
  progress?: number; // For partial progress tracking
}

export interface AchievementProgress {
  badgeId: string;
  current: number;
  target: number;
  percentage: number;
}

export interface AchievementsState {
  earnedBadges: UserBadge[];
  totalPoints: number;
  level: number;
  // Tracking counters
  learningPathsCompleted: number;
  routinesCompleted: number;
  totalPracticeMinutes: number;
  patternsPracticed: number;
  stepsCompleted: number;
  exercisesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  maxBpmAchieved: number;
  bestAccuracy: number;
}

// Points required for each level
export const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  1000,  // Level 5
  2000,  // Level 6
  3500,  // Level 7
  5500,  // Level 8
  8000,  // Level 9
  12000, // Level 10
];

export const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

