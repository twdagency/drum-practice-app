/**
 * Achievement System Hook
 * Tracks progress and awards badges
 */

import { useState, useEffect, useCallback } from 'react';
import { AchievementsState, UserBadge, AchievementProgress, Badge, BadgeRequirement } from '@/types/achievements';
import { BADGES, getBadgeById, calculateLevel } from '@/lib/data/badges';

const STORAGE_KEY = 'drum-practice-achievements';

const defaultState: AchievementsState = {
  earnedBadges: [],
  totalPoints: 0,
  level: 1,
  learningPathsCompleted: 0,
  routinesCompleted: 0,
  totalPracticeMinutes: 0,
  patternsPracticed: 0,
  stepsCompleted: 0,
  exercisesCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  maxBpmAchieved: 0,
  bestAccuracy: 0,
};

function loadState(): AchievementsState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultState, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading achievements:', e);
  }
  return defaultState;
}

function saveState(state: AchievementsState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving achievements:', e);
  }
}

export function useAchievements() {
  const [state, setState] = useState<AchievementsState>(defaultState);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setIsLoaded(true);
  }, []);

  // Save on change
  useEffect(() => {
    if (isLoaded) {
      saveState(state);
    }
  }, [state, isLoaded]);

  // Check if a badge requirement is met
  const checkRequirement = useCallback((requirement: BadgeRequirement): boolean => {
    switch (requirement.type) {
      case 'learning_paths_completed':
        return state.learningPathsCompleted >= requirement.count;
      case 'routines_completed':
        return state.routinesCompleted >= requirement.count;
      case 'practice_streak':
        return state.longestStreak >= requirement.days;
      case 'total_practice_time':
        return state.totalPracticeMinutes >= requirement.minutes;
      case 'patterns_practiced':
        return state.patternsPracticed >= requirement.count;
      case 'steps_completed':
        return state.stepsCompleted >= requirement.count;
      case 'exercises_completed':
        return state.exercisesCompleted >= requirement.count;
      case 'max_bpm':
        return state.maxBpmAchieved >= requirement.bpm;
      case 'accuracy_achieved':
        return state.bestAccuracy >= requirement.percentage;
      default:
        return false;
    }
  }, [state]);

  // Check and award new badges
  const checkForNewBadges = useCallback(() => {
    const earnedIds = new Set(state.earnedBadges.map(b => b.badgeId));
    let totalNewPoints = 0;
    const newlyEarned: UserBadge[] = [];

    for (const badge of BADGES) {
      if (earnedIds.has(badge.id)) continue;
      
      if (checkRequirement(badge.requirement)) {
        const userBadge: UserBadge = {
          badgeId: badge.id,
          earnedAt: Date.now(),
        };
        newlyEarned.push(userBadge);
        totalNewPoints += badge.points;
        
        // Show notification for last earned badge
        setNewBadge(badge);
      }
    }

    if (newlyEarned.length > 0) {
      setState(prev => {
        const newTotalPoints = prev.totalPoints + totalNewPoints;
        return {
          ...prev,
          earnedBadges: [...prev.earnedBadges, ...newlyEarned],
          totalPoints: newTotalPoints,
          level: calculateLevel(newTotalPoints),
        };
      });
    }
  }, [state.earnedBadges, checkRequirement]);

  // Track learning path completion
  const trackLearningPathCompleted = useCallback(() => {
    setState(prev => ({
      ...prev,
      learningPathsCompleted: prev.learningPathsCompleted + 1,
    }));
    setTimeout(checkForNewBadges, 100);
  }, [checkForNewBadges]);

  // Track learning path step completion
  const trackStepCompleted = useCallback(() => {
    setState(prev => ({
      ...prev,
      stepsCompleted: prev.stepsCompleted + 1,
    }));
    setTimeout(checkForNewBadges, 100);
  }, [checkForNewBadges]);

  // Track routine completion
  const trackRoutineCompleted = useCallback(() => {
    setState(prev => ({
      ...prev,
      routinesCompleted: prev.routinesCompleted + 1,
    }));
    setTimeout(checkForNewBadges, 100);
  }, [checkForNewBadges]);

  // Track exercise completion
  const trackExerciseCompleted = useCallback(() => {
    setState(prev => ({
      ...prev,
      exercisesCompleted: prev.exercisesCompleted + 1,
    }));
    setTimeout(checkForNewBadges, 100);
  }, [checkForNewBadges]);

  // Track practice time
  const trackPracticeTime = useCallback((minutes: number) => {
    setState(prev => ({
      ...prev,
      totalPracticeMinutes: prev.totalPracticeMinutes + minutes,
    }));
    setTimeout(checkForNewBadges, 100);
  }, [checkForNewBadges]);

  // Track pattern practiced
  const trackPatternPracticed = useCallback(() => {
    setState(prev => ({
      ...prev,
      patternsPracticed: prev.patternsPracticed + 1,
    }));
    setTimeout(checkForNewBadges, 100);
  }, [checkForNewBadges]);

  // Track streak
  const trackStreak = useCallback((days: number) => {
    setState(prev => ({
      ...prev,
      currentStreak: days,
      longestStreak: Math.max(prev.longestStreak, days),
    }));
    setTimeout(checkForNewBadges, 100);
  }, [checkForNewBadges]);

  // Track max BPM
  const trackMaxBpm = useCallback((bpm: number) => {
    setState(prev => ({
      ...prev,
      maxBpmAchieved: Math.max(prev.maxBpmAchieved, bpm),
    }));
    setTimeout(checkForNewBadges, 100);
  }, [checkForNewBadges]);

  // Track accuracy
  const trackAccuracy = useCallback((accuracy: number) => {
    setState(prev => ({
      ...prev,
      bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
    }));
    setTimeout(checkForNewBadges, 100);
  }, [checkForNewBadges]);

  // Track first-time actions
  const trackFirstAction = useCallback((action: string) => {
    const badgeId = `first-${action.replace('_', '-')}`;
    const badge = getBadgeById(badgeId);
    
    if (badge && !state.earnedBadges.find(b => b.badgeId === badgeId)) {
      const userBadge: UserBadge = {
        badgeId: badge.id,
        earnedAt: Date.now(),
      };
      
      setState(prev => {
        const newTotalPoints = prev.totalPoints + badge.points;
        return {
          ...prev,
          earnedBadges: [...prev.earnedBadges, userBadge],
          totalPoints: newTotalPoints,
          level: calculateLevel(newTotalPoints),
        };
      });
      
      setNewBadge(badge);
    }
  }, [state.earnedBadges]);

  // Get progress towards a badge
  const getBadgeProgress = useCallback((badge: Badge): AchievementProgress | null => {
    const req = badge.requirement;
    let current = 0;
    let target = 0;

    switch (req.type) {
      case 'learning_paths_completed':
        current = state.learningPathsCompleted;
        target = req.count;
        break;
      case 'routines_completed':
        current = state.routinesCompleted;
        target = req.count;
        break;
      case 'practice_streak':
        current = state.longestStreak;
        target = req.days;
        break;
      case 'total_practice_time':
        current = state.totalPracticeMinutes;
        target = req.minutes;
        break;
      case 'patterns_practiced':
        current = state.patternsPracticed;
        target = req.count;
        break;
      case 'steps_completed':
        current = state.stepsCompleted;
        target = req.count;
        break;
      case 'exercises_completed':
        current = state.exercisesCompleted;
        target = req.count;
        break;
      case 'max_bpm':
        current = state.maxBpmAchieved;
        target = req.bpm;
        break;
      case 'accuracy_achieved':
        current = state.bestAccuracy;
        target = req.percentage;
        break;
      default:
        return null;
    }

    return {
      badgeId: badge.id,
      current,
      target,
      percentage: Math.min(100, (current / target) * 100),
    };
  }, [state]);

  // Get all badges with earned status
  const getAllBadges = useCallback(() => {
    const earnedIds = new Set(state.earnedBadges.map(b => b.badgeId));
    return BADGES.map(badge => ({
      ...badge,
      earned: earnedIds.has(badge.id),
      earnedAt: state.earnedBadges.find(b => b.badgeId === badge.id)?.earnedAt,
      progress: getBadgeProgress(badge),
    }));
  }, [state.earnedBadges, getBadgeProgress]);

  // Get recently earned badges
  const getRecentBadges = useCallback((limit: number = 5) => {
    return [...state.earnedBadges]
      .sort((a, b) => b.earnedAt - a.earnedAt)
      .slice(0, limit)
      .map(ub => getBadgeById(ub.badgeId))
      .filter(Boolean) as Badge[];
  }, [state.earnedBadges]);

  // Clear new badge notification
  const clearNewBadge = useCallback(() => {
    setNewBadge(null);
  }, []);

  // Reset all achievements (for testing)
  const resetAchievements = useCallback(() => {
    setState(defaultState);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    state,
    isLoaded,
    newBadge,
    clearNewBadge,
    
    // Tracking functions
    trackLearningPathCompleted,
    trackStepCompleted,
    trackRoutineCompleted,
    trackExerciseCompleted,
    trackPracticeTime,
    trackPatternPracticed,
    trackStreak,
    trackMaxBpm,
    trackAccuracy,
    trackFirstAction,
    
    // Query functions
    getAllBadges,
    getRecentBadges,
    getBadgeProgress,
    
    // Admin
    resetAchievements,
  };
}

