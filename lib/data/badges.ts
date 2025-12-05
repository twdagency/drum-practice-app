/**
 * Badge Definitions
 * All available badges that can be earned
 */

import { Badge } from '@/types/achievements';

export const BADGES: Badge[] = [
  // ============================================
  // LEARNING PATH BADGES
  // ============================================
  {
    id: 'first-path',
    name: 'Pathfinder',
    description: 'Complete your first learning path',
    category: 'learning',
    rarity: 'common',
    icon: 'route',
    requirement: { type: 'learning_paths_completed', count: 1 },
    points: 50,
  },
  {
    id: 'path-explorer',
    name: 'Path Explorer',
    description: 'Complete 3 learning paths',
    category: 'learning',
    rarity: 'uncommon',
    icon: 'compass',
    requirement: { type: 'learning_paths_completed', count: 3 },
    points: 150,
  },
  {
    id: 'path-master',
    name: 'Path Master',
    description: 'Complete 5 learning paths',
    category: 'learning',
    rarity: 'rare',
    icon: 'graduation-cap',
    requirement: { type: 'learning_paths_completed', count: 5 },
    points: 300,
  },
  {
    id: 'path-legend',
    name: 'Path Legend',
    description: 'Complete 10 learning paths',
    category: 'learning',
    rarity: 'epic',
    icon: 'trophy',
    requirement: { type: 'learning_paths_completed', count: 10 },
    points: 500,
  },
  {
    id: 'step-starter',
    name: 'Step Starter',
    description: 'Complete 10 learning path steps',
    category: 'learning',
    rarity: 'common',
    icon: 'footprints',
    requirement: { type: 'steps_completed', count: 10 },
    points: 25,
  },
  {
    id: 'step-climber',
    name: 'Step Climber',
    description: 'Complete 50 learning path steps',
    category: 'learning',
    rarity: 'uncommon',
    icon: 'trending-up',
    requirement: { type: 'steps_completed', count: 50 },
    points: 100,
  },
  {
    id: 'step-master',
    name: 'Step Master',
    description: 'Complete 100 learning path steps',
    category: 'learning',
    rarity: 'rare',
    icon: 'award',
    requirement: { type: 'steps_completed', count: 100 },
    points: 250,
  },

  // ============================================
  // PRACTICE ROUTINE BADGES
  // ============================================
  {
    id: 'first-routine',
    name: 'Routine Rookie',
    description: 'Complete your first practice routine',
    category: 'practice',
    rarity: 'common',
    icon: 'clipboard-check',
    requirement: { type: 'routines_completed', count: 1 },
    points: 50,
  },
  {
    id: 'routine-regular',
    name: 'Routine Regular',
    description: 'Complete 5 practice routines',
    category: 'practice',
    rarity: 'uncommon',
    icon: 'calendar-check',
    requirement: { type: 'routines_completed', count: 5 },
    points: 150,
  },
  {
    id: 'routine-warrior',
    name: 'Routine Warrior',
    description: 'Complete 15 practice routines',
    category: 'practice',
    rarity: 'rare',
    icon: 'shield',
    requirement: { type: 'routines_completed', count: 15 },
    points: 300,
  },
  {
    id: 'routine-champion',
    name: 'Routine Champion',
    description: 'Complete 30 practice routines',
    category: 'practice',
    rarity: 'epic',
    icon: 'crown',
    requirement: { type: 'routines_completed', count: 30 },
    points: 500,
  },
  {
    id: 'exercise-starter',
    name: 'Exercise Starter',
    description: 'Complete 25 routine exercises',
    category: 'practice',
    rarity: 'common',
    icon: 'dumbbell',
    requirement: { type: 'exercises_completed', count: 25 },
    points: 25,
  },
  {
    id: 'exercise-enthusiast',
    name: 'Exercise Enthusiast',
    description: 'Complete 100 routine exercises',
    category: 'practice',
    rarity: 'uncommon',
    icon: 'flame',
    requirement: { type: 'exercises_completed', count: 100 },
    points: 100,
  },
  {
    id: 'exercise-addict',
    name: 'Exercise Addict',
    description: 'Complete 250 routine exercises',
    category: 'practice',
    rarity: 'rare',
    icon: 'zap',
    requirement: { type: 'exercises_completed', count: 250 },
    points: 250,
  },

  // ============================================
  // STREAK BADGES
  // ============================================
  {
    id: 'streak-3',
    name: 'Getting Started',
    description: 'Practice 3 days in a row',
    category: 'streak',
    rarity: 'common',
    icon: 'flame',
    requirement: { type: 'practice_streak', days: 3 },
    points: 30,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Practice 7 days in a row',
    category: 'streak',
    rarity: 'uncommon',
    icon: 'flame',
    requirement: { type: 'practice_streak', days: 7 },
    points: 75,
  },
  {
    id: 'streak-14',
    name: 'Two Week Titan',
    description: 'Practice 14 days in a row',
    category: 'streak',
    rarity: 'rare',
    icon: 'flame',
    requirement: { type: 'practice_streak', days: 14 },
    points: 150,
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Practice 30 days in a row',
    category: 'streak',
    rarity: 'epic',
    icon: 'flame',
    requirement: { type: 'practice_streak', days: 30 },
    points: 350,
  },
  {
    id: 'streak-100',
    name: 'Century Streak',
    description: 'Practice 100 days in a row',
    category: 'streak',
    rarity: 'legendary',
    icon: 'sparkles',
    requirement: { type: 'practice_streak', days: 100 },
    points: 1000,
  },

  // ============================================
  // PRACTICE TIME BADGES
  // ============================================
  {
    id: 'time-1h',
    name: 'First Hour',
    description: 'Accumulate 1 hour of practice time',
    category: 'practice',
    rarity: 'common',
    icon: 'clock',
    requirement: { type: 'total_practice_time', minutes: 60 },
    points: 25,
  },
  {
    id: 'time-5h',
    name: 'Dedicated Drummer',
    description: 'Accumulate 5 hours of practice time',
    category: 'practice',
    rarity: 'uncommon',
    icon: 'clock',
    requirement: { type: 'total_practice_time', minutes: 300 },
    points: 100,
  },
  {
    id: 'time-20h',
    name: 'Committed Player',
    description: 'Accumulate 20 hours of practice time',
    category: 'practice',
    rarity: 'rare',
    icon: 'clock',
    requirement: { type: 'total_practice_time', minutes: 1200 },
    points: 300,
  },
  {
    id: 'time-50h',
    name: 'Practice Veteran',
    description: 'Accumulate 50 hours of practice time',
    category: 'practice',
    rarity: 'epic',
    icon: 'timer',
    requirement: { type: 'total_practice_time', minutes: 3000 },
    points: 500,
  },
  {
    id: 'time-100h',
    name: 'Centurion',
    description: 'Accumulate 100 hours of practice time',
    category: 'practice',
    rarity: 'legendary',
    icon: 'hourglass',
    requirement: { type: 'total_practice_time', minutes: 6000 },
    points: 1000,
  },

  // ============================================
  // MASTERY BADGES
  // ============================================
  {
    id: 'accuracy-80',
    name: 'Accurate Player',
    description: 'Achieve 80% accuracy in 5 practice sessions',
    category: 'mastery',
    rarity: 'common',
    icon: 'target',
    requirement: { type: 'accuracy_achieved', percentage: 80, sessions: 5 },
    points: 50,
  },
  {
    id: 'accuracy-90',
    name: 'Precision Drummer',
    description: 'Achieve 90% accuracy in 10 practice sessions',
    category: 'mastery',
    rarity: 'uncommon',
    icon: 'target',
    requirement: { type: 'accuracy_achieved', percentage: 90, sessions: 10 },
    points: 150,
  },
  {
    id: 'accuracy-95',
    name: 'Master of Precision',
    description: 'Achieve 95% accuracy in 20 practice sessions',
    category: 'mastery',
    rarity: 'rare',
    icon: 'crosshair',
    requirement: { type: 'accuracy_achieved', percentage: 95, sessions: 20 },
    points: 300,
  },
  {
    id: 'patterns-10',
    name: 'Pattern Explorer',
    description: 'Practice 10 different patterns',
    category: 'mastery',
    rarity: 'common',
    icon: 'layers',
    requirement: { type: 'patterns_practiced', count: 10 },
    points: 30,
  },
  {
    id: 'patterns-50',
    name: 'Pattern Collector',
    description: 'Practice 50 different patterns',
    category: 'mastery',
    rarity: 'uncommon',
    icon: 'layers',
    requirement: { type: 'patterns_practiced', count: 50 },
    points: 100,
  },
  {
    id: 'patterns-100',
    name: 'Pattern Master',
    description: 'Practice 100 different patterns',
    category: 'mastery',
    rarity: 'rare',
    icon: 'library',
    requirement: { type: 'patterns_practiced', count: 100 },
    points: 250,
  },

  // ============================================
  // SPEED BADGES
  // ============================================
  {
    id: 'speed-120',
    name: 'Speed Learner',
    description: 'Successfully practice at 120 BPM',
    category: 'speed',
    rarity: 'common',
    icon: 'gauge',
    requirement: { type: 'max_bpm', bpm: 120 },
    points: 30,
  },
  {
    id: 'speed-150',
    name: 'Fast Hands',
    description: 'Successfully practice at 150 BPM',
    category: 'speed',
    rarity: 'uncommon',
    icon: 'gauge',
    requirement: { type: 'max_bpm', bpm: 150 },
    points: 75,
  },
  {
    id: 'speed-180',
    name: 'Speed Demon',
    description: 'Successfully practice at 180 BPM',
    category: 'speed',
    rarity: 'rare',
    icon: 'rocket',
    requirement: { type: 'max_bpm', bpm: 180 },
    points: 150,
  },
  {
    id: 'speed-200',
    name: 'Lightning Hands',
    description: 'Successfully practice at 200 BPM',
    category: 'speed',
    rarity: 'epic',
    icon: 'zap',
    requirement: { type: 'max_bpm', bpm: 200 },
    points: 300,
  },
  {
    id: 'speed-240',
    name: 'Hyperspeed',
    description: 'Successfully practice at 240 BPM',
    category: 'speed',
    rarity: 'legendary',
    icon: 'sparkles',
    requirement: { type: 'max_bpm', bpm: 240 },
    points: 500,
  },

  // ============================================
  // SPECIAL / FIRST-TIME BADGES
  // ============================================
  {
    id: 'first-pattern',
    name: 'First Beat',
    description: 'Create your first pattern',
    category: 'special',
    rarity: 'common',
    icon: 'music',
    requirement: { type: 'first_action', action: 'create_pattern' },
    points: 10,
  },
  {
    id: 'first-practice',
    name: 'Practice Begins',
    description: 'Complete your first practice session',
    category: 'special',
    rarity: 'common',
    icon: 'play',
    requirement: { type: 'first_action', action: 'practice_session' },
    points: 10,
  },
  {
    id: 'first-step',
    name: 'First Step',
    description: 'Complete your first learning path step',
    category: 'special',
    rarity: 'common',
    icon: 'footprints',
    requirement: { type: 'first_action', action: 'complete_step' },
    points: 10,
  },
  {
    id: 'first-exercise',
    name: 'First Exercise',
    description: 'Complete your first routine exercise',
    category: 'special',
    rarity: 'common',
    icon: 'dumbbell',
    requirement: { type: 'first_action', action: 'complete_exercise' },
    points: 10,
  },
];

// Helper functions
export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find(b => b.id === id);
}

export function getBadgesByCategory(category: string): Badge[] {
  return BADGES.filter(b => b.category === category);
}

export function getBadgesByRarity(rarity: string): Badge[] {
  return BADGES.filter(b => b.rarity === rarity);
}

export function calculateLevel(points: number): number {
  const { LEVEL_THRESHOLDS } = require('@/types/achievements');
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

