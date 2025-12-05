/**
 * AI Practice Coach - Rule-Based Coaching Engine
 * Analyzes practice data to provide personalized, actionable insights
 */

import { PracticeStats, PracticeSession, PresetBestScore } from '@/types/practice';
import { Pattern } from '@/types';

// Coach insight types
export type InsightType = 
  | 'timing_rushing'
  | 'timing_dragging'
  | 'timing_inconsistent'
  | 'accuracy_improving'
  | 'accuracy_declining'
  | 'accuracy_plateau'
  | 'tempo_comfort_zone'
  | 'tempo_ready_increase'
  | 'tempo_need_slow_down'
  | 'practice_streak'
  | 'practice_break'
  | 'practice_duration'
  | 'pattern_mastery'
  | 'pattern_struggle'
  | 'pattern_variety'
  | 'dynamics_ghost'
  | 'dynamics_accent'
  | 'subdivision_issue'
  | 'warmup_suggestion'
  | 'goal_progress'
  | 'celebration'
  | 'challenge'
  | 'technique_tip';

export type InsightPriority = 'urgent' | 'high' | 'medium' | 'low' | 'celebration';

export interface CoachInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  message: string;
  details?: string;
  actionableExercise?: {
    description: string;
    presetId?: string;
    suggestedBpm?: number;
    duration?: number; // minutes
  };
  metric?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
  };
  icon: string;
  category: 'timing' | 'accuracy' | 'tempo' | 'practice' | 'technique' | 'motivation';
}

interface CoachContext {
  stats: PracticeStats;
  recentSessions: PracticeSession[];
  presetScores: PresetBestScore[];
  currentBpm?: number;
  patterns?: Pattern[];
  daysSinceLastPractice: number;
  todayPracticeTime: number;
}

// Priority scores for sorting
const PRIORITY_SCORES: Record<InsightPriority, number> = {
  urgent: 100,
  high: 80,
  celebration: 70,
  medium: 50,
  low: 20,
};

/**
 * Main coaching engine - generates all insights
 */
export function generateCoachingInsights(context: CoachContext): CoachInsight[] {
  const insights: CoachInsight[] = [];
  
  // Run all analysis functions
  insights.push(...analyzeTimingPatterns(context));
  insights.push(...analyzeAccuracyTrends(context));
  insights.push(...analyzeTempoProgression(context));
  insights.push(...analyzePracticeHabits(context));
  insights.push(...analyzePatternProgress(context));
  insights.push(...analyzeDynamics(context));
  insights.push(...generateMotivationalInsights(context));
  insights.push(...generateChallenges(context));
  insights.push(...generateWarmupSuggestions(context));
  
  // Sort by priority and limit
  return insights
    .sort((a, b) => PRIORITY_SCORES[b.priority] - PRIORITY_SCORES[a.priority])
    .slice(0, 8); // Return top 8 most important insights
}

/**
 * Analyze timing patterns (rushing, dragging, inconsistency)
 */
function analyzeTimingPatterns(context: CoachContext): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const { recentSessions } = context;
  
  if (recentSessions.length < 3) return insights;
  
  // Calculate timing statistics
  const sessionsWithTiming = recentSessions.filter(s => s.timingAvg !== undefined);
  if (sessionsWithTiming.length < 2) return insights;
  
  const avgTiming = sessionsWithTiming.reduce((sum, s) => sum + (s.timingAvg || 0), 0) / sessionsWithTiming.length;
  
  // Calculate early/late ratio
  const totalEarly = recentSessions.reduce((sum, s) => sum + (s.earlyHits || 0), 0);
  const totalLate = recentSessions.reduce((sum, s) => sum + (s.lateHits || 0), 0);
  const totalPerfect = recentSessions.reduce((sum, s) => sum + (s.perfectHits || 0), 0);
  const totalHits = totalEarly + totalLate + totalPerfect;
  
  if (totalHits < 20) return insights;
  
  const earlyRatio = totalEarly / totalHits;
  const lateRatio = totalLate / totalHits;
  const perfectRatio = totalPerfect / totalHits;
  
  // Rushing detection (>60% early hits)
  if (earlyRatio > 0.6) {
    insights.push({
      id: 'timing-rushing',
      type: 'timing_rushing',
      priority: 'high',
      title: 'Tendency to Rush',
      message: `You're playing ahead of the beat ${Math.round(earlyRatio * 100)}% of the time. This is common and fixable!`,
      details: 'Rushing often happens when we anticipate beats instead of waiting for them. The fix: internalize the pulse.',
      actionableExercise: {
        description: 'Practice with the metronome accenting beats 2 and 4. Focus on "sitting back" into the groove.',
        suggestedBpm: 70,
        duration: 5,
      },
      metric: { label: 'Early Hits', value: `${Math.round(earlyRatio * 100)}%`, trend: 'up' },
      icon: '⏩',
      category: 'timing',
    });
  }
  
  // Dragging detection (>60% late hits)
  if (lateRatio > 0.6) {
    insights.push({
      id: 'timing-dragging',
      type: 'timing_dragging',
      priority: 'high',
      title: 'Tendency to Drag',
      message: `You're playing behind the beat ${Math.round(lateRatio * 100)}% of the time. Let's work on your internal clock.`,
      details: 'Dragging can indicate hesitation or over-thinking. Build confidence through repetition.',
      actionableExercise: {
        description: 'Practice simple patterns at a comfortable tempo, focusing on hitting right ON the click, not after.',
        suggestedBpm: 80,
        duration: 5,
      },
      metric: { label: 'Late Hits', value: `${Math.round(lateRatio * 100)}%`, trend: 'up' },
      icon: '⏪',
      category: 'timing',
    });
  }
  
  // Great timing celebration
  if (perfectRatio > 0.7) {
    insights.push({
      id: 'timing-excellent',
      type: 'celebration',
      priority: 'celebration',
      title: 'Excellent Timing! 🎯',
      message: `${Math.round(perfectRatio * 100)}% of your hits are perfectly timed. Your internal clock is solid!`,
      icon: '🎯',
      category: 'timing',
    });
  }
  
  // High timing variance
  const timingVariance = calculateVariance(sessionsWithTiming.map(s => s.timingAvg || 0));
  if (timingVariance > 100 && perfectRatio < 0.5) {
    insights.push({
      id: 'timing-inconsistent',
      type: 'timing_inconsistent',
      priority: 'medium',
      title: 'Timing Inconsistency',
      message: 'Your timing varies significantly between sessions. Consistency comes from focused, slow practice.',
      actionableExercise: {
        description: 'Spend 5 minutes at 60 BPM before increasing tempo. Accuracy at slow speeds builds fast-tempo reliability.',
        suggestedBpm: 60,
        duration: 5,
      },
      icon: '📊',
      category: 'timing',
    });
  }
  
  return insights;
}

/**
 * Analyze accuracy trends
 */
function analyzeAccuracyTrends(context: CoachContext): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const { recentSessions, stats } = context;
  
  const sessionsWithAccuracy = recentSessions.filter(s => s.accuracy !== undefined);
  if (sessionsWithAccuracy.length < 3) return insights;
  
  // Calculate trend
  const recent5 = sessionsWithAccuracy.slice(-5);
  const previous5 = sessionsWithAccuracy.slice(-10, -5);
  
  if (recent5.length >= 3) {
    const recentAvg = recent5.reduce((s, x) => s + (x.accuracy || 0), 0) / recent5.length;
    
    if (previous5.length >= 3) {
      const previousAvg = previous5.reduce((s, x) => s + (x.accuracy || 0), 0) / previous5.length;
      const diff = recentAvg - previousAvg;
      
      // Significant improvement
      if (diff > 10) {
        insights.push({
          id: 'accuracy-improving',
          type: 'accuracy_improving',
          priority: 'celebration',
          title: 'Accuracy Improving! 📈',
          message: `Your accuracy jumped ${diff.toFixed(0)}% compared to last week. Whatever you're doing, keep at it!`,
          metric: { label: 'Improvement', value: `+${diff.toFixed(0)}%`, trend: 'up' },
          icon: '📈',
          category: 'accuracy',
        });
      }
      
      // Significant decline
      if (diff < -10) {
        insights.push({
          id: 'accuracy-declining',
          type: 'accuracy_declining',
          priority: 'high',
          title: 'Accuracy Dip Detected',
          message: `Your accuracy dropped ${Math.abs(diff).toFixed(0)}% recently. This might indicate practicing too fast or fatigue.`,
          details: 'Temporary dips are normal, especially when learning new patterns. Consider slowing down.',
          actionableExercise: {
            description: 'Drop tempo by 20 BPM and focus on clean execution. Speed will return with solid fundamentals.',
            duration: 10,
          },
          metric: { label: 'Change', value: `${diff.toFixed(0)}%`, trend: 'down' },
          icon: '📉',
          category: 'accuracy',
        });
      }
      
      // Plateau detection
      if (Math.abs(diff) < 3 && recentAvg < 85 && sessionsWithAccuracy.length >= 8) {
        insights.push({
          id: 'accuracy-plateau',
          type: 'accuracy_plateau',
          priority: 'medium',
          title: 'Progress Plateau',
          message: `You've been hovering around ${recentAvg.toFixed(0)}% accuracy. Time to shake things up!`,
          details: 'Plateaus are a sign your brain has optimized the current approach. Change something: tempo, pattern, or focus area.',
          actionableExercise: {
            description: 'Try a new pattern category or practice the same pattern at a very different tempo.',
            duration: 15,
          },
          icon: '🔄',
          category: 'accuracy',
        });
      }
    }
    
    // Low accuracy warning
    if (recentAvg < 50) {
      insights.push({
        id: 'accuracy-low',
        type: 'tempo_need_slow_down',
        priority: 'urgent',
        title: 'Slow Down to Speed Up',
        message: `Your recent accuracy is ${recentAvg.toFixed(0)}%. You're likely practicing too fast.`,
        details: 'Practicing at 50% accuracy builds bad habits. Drop tempo until you hit 80%+, then gradually increase.',
        actionableExercise: {
          description: 'Find the tempo where you can play at 85% accuracy. That\'s your training tempo.',
          suggestedBpm: 60,
          duration: 10,
        },
        icon: '🐢',
        category: 'accuracy',
      });
    }
  }
  
  return insights;
}

/**
 * Analyze tempo progression
 */
function analyzeTempoProgression(context: CoachContext): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const { recentSessions, stats, presetScores } = context;
  
  // Check if user is stuck in a tempo comfort zone
  const sessionsWithBpm = recentSessions.filter(s => s.bpm !== undefined);
  if (sessionsWithBpm.length >= 5) {
    const bpms = sessionsWithBpm.map(s => s.bpm || 0);
    const avgBpm = bpms.reduce((a, b) => a + b, 0) / bpms.length;
    const bpmVariance = calculateVariance(bpms);
    
    // Very narrow tempo range
    if (bpmVariance < 100 && avgBpm > 80) {
      insights.push({
        id: 'tempo-comfort-zone',
        type: 'tempo_comfort_zone',
        priority: 'medium',
        title: 'Tempo Comfort Zone',
        message: `You've been practicing mostly around ${avgBpm.toFixed(0)} BPM. Challenge yourself with variety!`,
        actionableExercise: {
          description: `Try the same pattern at ${Math.round(avgBpm * 0.7)} BPM (slow focus) and ${Math.round(avgBpm * 1.2)} BPM (speed challenge).`,
          duration: 10,
        },
        icon: '🎚️',
        category: 'tempo',
      });
    }
    
    // Check for high-accuracy sessions at current tempo
    const highAccuracySessions = sessionsWithBpm.filter(s => (s.accuracy || 0) >= 85);
    if (highAccuracySessions.length >= 3) {
      const maxBpmWithAccuracy = Math.max(...highAccuracySessions.map(s => s.bpm || 0));
      
      insights.push({
        id: 'tempo-ready-increase',
        type: 'tempo_ready_increase',
        priority: 'medium',
        title: 'Ready for More Speed 🚀',
        message: `You're consistently hitting 85%+ at ${maxBpmWithAccuracy} BPM. Time to push to ${maxBpmWithAccuracy + 10}!`,
        actionableExercise: {
          description: 'Increase tempo by 5-10 BPM. If accuracy drops below 75%, step back.',
          suggestedBpm: maxBpmWithAccuracy + 10,
          duration: 10,
        },
        icon: '🚀',
        category: 'tempo',
      });
    }
  }
  
  // Check tempo achievements
  const topAchievements = stats.tempoAchievements.sort((a, b) => b.maxBpm - a.maxBpm).slice(0, 1);
  if (topAchievements.length > 0 && topAchievements[0].maxBpm >= 140) {
    insights.push({
      id: 'tempo-achievement',
      type: 'celebration',
      priority: 'celebration',
      title: 'Speed Demon! ⚡',
      message: `You've nailed a pattern at ${topAchievements[0].maxBpm} BPM with 80%+ accuracy. That's impressive!`,
      icon: '⚡',
      category: 'tempo',
    });
  }
  
  return insights;
}

/**
 * Analyze practice habits
 */
function analyzePracticeHabits(context: CoachContext): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const { stats, daysSinceLastPractice, todayPracticeTime } = context;
  
  // Streak celebration
  if (stats.currentStreak >= 7) {
    insights.push({
      id: 'streak-week',
      type: 'practice_streak',
      priority: 'celebration',
      title: `${stats.currentStreak} Day Streak! 🔥`,
      message: `You've practiced ${stats.currentStreak} days in a row. Consistency is the key to mastery!`,
      icon: '🔥',
      category: 'practice',
    });
  } else if (stats.currentStreak >= 3) {
    insights.push({
      id: 'streak-building',
      type: 'practice_streak',
      priority: 'low',
      title: 'Streak Building 📆',
      message: `${stats.currentStreak} days strong! ${7 - stats.currentStreak} more for a week streak.`,
      icon: '📆',
      category: 'practice',
    });
  }
  
  // Haven't practiced recently
  if (daysSinceLastPractice >= 3) {
    insights.push({
      id: 'practice-break',
      type: 'practice_break',
      priority: 'urgent',
      title: 'Time to Get Back! 🥁',
      message: `It's been ${daysSinceLastPractice} days since your last session. Even 5 minutes today will help maintain your progress.`,
      actionableExercise: {
        description: 'Quick 5-minute warm-up: Single strokes at 80 BPM, then one pattern you know well.',
        suggestedBpm: 80,
        duration: 5,
      },
      icon: '🥁',
      category: 'practice',
    });
  } else if (daysSinceLastPractice === 2) {
    insights.push({
      id: 'practice-reminder',
      type: 'practice_break',
      priority: 'medium',
      title: 'Don\'t Break the Chain',
      message: `2 days without practice. Hop back in today to keep your streak alive!`,
      actionableExercise: {
        description: 'A short session beats no session. Even 10 focused minutes count.',
        duration: 10,
      },
      icon: '⏰',
      category: 'practice',
    });
  }
  
  // Short sessions
  const recentDurations = context.recentSessions.map(s => s.duration);
  if (recentDurations.length >= 3) {
    const avgDuration = recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length;
    
    if (avgDuration < 120) { // Less than 2 minutes average
      insights.push({
        id: 'sessions-short',
        type: 'practice_duration',
        priority: 'medium',
        title: 'Longer Sessions = Better Results',
        message: 'Your sessions average under 2 minutes. Try to extend to 10-15 minutes for deeper learning.',
        details: 'Short bursts are fine for maintenance, but skill development needs focused time.',
        icon: '⏱️',
        category: 'practice',
      });
    }
    
    if (avgDuration > 1800) { // Over 30 minutes average
      insights.push({
        id: 'sessions-long',
        type: 'practice_duration',
        priority: 'low',
        title: 'Quality Over Quantity',
        message: 'You\'re putting in serious time! Remember: focused 20-minute sessions often beat unfocused hour-long ones.',
        details: 'Take breaks every 25-30 minutes to stay sharp.',
        icon: '🧠',
        category: 'practice',
      });
    }
  }
  
  // Total practice milestone
  const totalHours = Math.floor(stats.totalPracticeTime / 3600);
  if (totalHours >= 10 && totalHours < 11) {
    insights.push({
      id: 'milestone-10h',
      type: 'celebration',
      priority: 'celebration',
      title: '10 Hours Milestone! 🎉',
      message: 'You\'ve logged 10+ hours of practice. You\'re building real skill!',
      icon: '🎉',
      category: 'motivation',
    });
  }
  
  return insights;
}

/**
 * Analyze pattern-specific progress
 */
function analyzePatternProgress(context: CoachContext): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const { presetScores, recentSessions } = context;
  
  if (presetScores.length === 0) return insights;
  
  // Find struggling patterns (many attempts, low accuracy)
  const strugglingPatterns = presetScores.filter(p => 
    p.attempts >= 5 && p.bestAccuracy < 70
  );
  
  if (strugglingPatterns.length > 0) {
    const worst = strugglingPatterns.sort((a, b) => a.bestAccuracy - b.bestAccuracy)[0];
    insights.push({
      id: 'pattern-struggle',
      type: 'pattern_struggle',
      priority: 'high',
      title: 'Pattern Needs Attention',
      message: `"${worst.presetName}" has ${worst.attempts} attempts but only ${worst.bestAccuracy.toFixed(0)}% best accuracy.`,
      details: 'Break it down: practice just the first half, or slow way down. Master the pieces before the whole.',
      actionableExercise: {
        description: `Practice "${worst.presetName}" at 50% of your usual tempo. Focus on clean execution, not speed.`,
        presetId: worst.presetId,
        duration: 10,
      },
      icon: '🎯',
      category: 'technique',
    });
  }
  
  // Find mastered patterns
  const masteredPatterns = presetScores.filter(p => p.mastery === 'master');
  if (masteredPatterns.length > 0) {
    insights.push({
      id: 'patterns-mastered',
      type: 'pattern_mastery',
      priority: 'celebration',
      title: `${masteredPatterns.length} Pattern${masteredPatterns.length > 1 ? 's' : ''} Mastered! 🏆`,
      message: `You've achieved mastery on: ${masteredPatterns.slice(0, 3).map(p => p.presetName).join(', ')}${masteredPatterns.length > 3 ? ` +${masteredPatterns.length - 3} more` : ''}`,
      icon: '🏆',
      category: 'technique',
    });
  }
  
  // Pattern variety check
  const uniquePatternsRecent = new Set(recentSessions.filter(s => s.presetId).map(s => s.presetId)).size;
  const totalRecent = recentSessions.length;
  
  if (totalRecent >= 5 && uniquePatternsRecent < 2) {
    insights.push({
      id: 'pattern-variety',
      type: 'pattern_variety',
      priority: 'medium',
      title: 'Mix It Up!',
      message: 'You\'ve been practicing the same pattern(s) repeatedly. Variety accelerates learning.',
      details: 'Different patterns activate different neural pathways. Cross-training makes you better overall.',
      actionableExercise: {
        description: 'Try 3 different patterns today, even briefly. New challenges spark new growth.',
        duration: 15,
      },
      icon: '🎲',
      category: 'practice',
    });
  }
  
  // Check for improving patterns
  const improvingPatterns = presetScores.filter(p => {
    if (!p.accuracyHistory || p.accuracyHistory.length < 3) return false;
    const recent = p.accuracyHistory.slice(-3).map(h => h.accuracy);
    const older = p.accuracyHistory.slice(-6, -3).map(h => h.accuracy);
    if (older.length === 0) return false;
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    return recentAvg - olderAvg > 10;
  });
  
  if (improvingPatterns.length > 0) {
    insights.push({
      id: 'pattern-improving',
      type: 'accuracy_improving',
      priority: 'celebration',
      title: 'Pattern Breakthrough! 📈',
      message: `"${improvingPatterns[0].presetName}" is really clicking - your accuracy is climbing fast!`,
      icon: '📈',
      category: 'technique',
    });
  }
  
  return insights;
}

/**
 * Analyze dynamics (ghost notes, accents)
 */
function analyzeDynamics(context: CoachContext): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const { recentSessions } = context;
  
  const sessionsWithDynamics = recentSessions.filter(s => s.dynamicAccuracy !== undefined);
  if (sessionsWithDynamics.length < 2) return insights;
  
  const avgDynamicAccuracy = sessionsWithDynamics.reduce((sum, s) => sum + (s.dynamicAccuracy || 0), 0) / sessionsWithDynamics.length;
  
  if (avgDynamicAccuracy < 50) {
    insights.push({
      id: 'dynamics-weak',
      type: 'dynamics_ghost',
      priority: 'medium',
      title: 'Work on Dynamics',
      message: `Your ghost note/accent accuracy is ${avgDynamicAccuracy.toFixed(0)}%. Dynamics add groove and musicality.`,
      details: 'Ghost notes should be felt, not heard loudly. Accents should pop. Exaggerate the difference.',
      actionableExercise: {
        description: 'Practice ghost notes at very low volume, then add accents at full power. Contrast is key.',
        suggestedBpm: 60,
        duration: 10,
      },
      icon: '🔊',
      category: 'technique',
    });
  } else if (avgDynamicAccuracy > 80) {
    insights.push({
      id: 'dynamics-great',
      type: 'celebration',
      priority: 'low',
      title: 'Great Dynamic Control 🎚️',
      message: `${avgDynamicAccuracy.toFixed(0)}% dynamic accuracy - your ghost notes and accents are on point!`,
      icon: '🎚️',
      category: 'technique',
    });
  }
  
  return insights;
}

/**
 * Generate motivational insights
 */
function generateMotivationalInsights(context: CoachContext): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const { stats, recentSessions } = context;
  
  // Session count milestones
  const sessionCount = stats.sessions.length;
  if (sessionCount === 10) {
    insights.push({
      id: 'milestone-10-sessions',
      type: 'celebration',
      priority: 'celebration',
      title: '10 Sessions Complete! 🌟',
      message: 'You\'ve completed 10 practice sessions. The habit is forming!',
      icon: '🌟',
      category: 'motivation',
    });
  } else if (sessionCount === 50) {
    insights.push({
      id: 'milestone-50-sessions',
      type: 'celebration',
      priority: 'celebration',
      title: '50 Sessions Milestone! 💪',
      message: 'Fifty sessions! You\'re officially serious about drumming.',
      icon: '💪',
      category: 'motivation',
    });
  }
  
  // Today's practice acknowledgment
  if (context.todayPracticeTime > 600) { // More than 10 minutes today
    insights.push({
      id: 'today-great',
      type: 'celebration',
      priority: 'low',
      title: 'Great Session Today! ✨',
      message: `You've put in ${Math.round(context.todayPracticeTime / 60)} minutes today. Quality practice time!`,
      icon: '✨',
      category: 'motivation',
    });
  }
  
  return insights;
}

/**
 * Generate practice challenges
 */
function generateChallenges(context: CoachContext): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const { stats, presetScores } = context;
  
  // Find a pattern to challenge them on
  const intermediatePatterns = presetScores.filter(p => 
    p.mastery === 'intermediate' || p.mastery === 'learning'
  );
  
  if (intermediatePatterns.length > 0 && stats.sessions.length >= 5) {
    const challenge = intermediatePatterns[Math.floor(Math.random() * intermediatePatterns.length)];
    
    insights.push({
      id: 'challenge-pattern',
      type: 'challenge',
      priority: 'medium',
      title: 'Today\'s Challenge 🎯',
      message: `Can you beat your best on "${challenge.presetName}"? Current best: ${challenge.bestAccuracy.toFixed(0)}%`,
      actionableExercise: {
        description: `3 focused attempts on "${challenge.presetName}". Beat ${challenge.bestAccuracy.toFixed(0)}% and you're leveling up!`,
        presetId: challenge.presetId,
        duration: 10,
      },
      icon: '🎯',
      category: 'motivation',
    });
  }
  
  // Speed challenge for proficient users
  const proficientPatterns = presetScores.filter(p => p.mastery === 'proficient' && p.bestBpm > 0);
  if (proficientPatterns.length > 0) {
    const speedChallenge = proficientPatterns[0];
    
    insights.push({
      id: 'challenge-speed',
      type: 'challenge',
      priority: 'low',
      title: 'Speed Challenge ⚡',
      message: `Try "${speedChallenge.presetName}" at ${speedChallenge.bestBpm + 15} BPM. Push your limits!`,
      actionableExercise: {
        description: 'One attempt at the higher tempo. Even a struggle attempt builds speed over time.',
        presetId: speedChallenge.presetId,
        suggestedBpm: speedChallenge.bestBpm + 15,
      },
      icon: '⚡',
      category: 'motivation',
    });
  }
  
  return insights;
}

/**
 * Generate warmup suggestions
 */
function generateWarmupSuggestions(context: CoachContext): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const { todayPracticeTime, stats } = context;
  
  // If just starting today's practice
  if (todayPracticeTime < 60 && stats.sessions.length > 0) {
    const warmupTips = [
      {
        title: 'Warm-Up: Single Strokes',
        description: '2 minutes of single strokes (RLRL) starting at 60 BPM, gradually increasing.',
      },
      {
        title: 'Warm-Up: Double Strokes',
        description: '2 minutes of double strokes (RRLL) focusing on even volume between hands.',
      },
      {
        title: 'Warm-Up: Paradiddles',
        description: 'The ultimate warm-up: alternates between single and double strokes.',
      },
    ];
    
    const tip = warmupTips[Math.floor(Math.random() * warmupTips.length)];
    
    insights.push({
      id: 'warmup-suggestion',
      type: 'warmup_suggestion',
      priority: 'low',
      title: tip.title,
      message: 'Starting cold? A quick warm-up prevents injury and improves your session.',
      actionableExercise: {
        description: tip.description,
        suggestedBpm: 60,
        duration: 2,
      },
      icon: '🔥',
      category: 'technique',
    });
  }
  
  return insights;
}

/**
 * Get a single "tip of the session" based on current context
 */
export function getSessionTip(context: CoachContext): CoachInsight | null {
  const insights = generateCoachingInsights(context);
  
  // Filter to actionable insights
  const actionable = insights.filter(i => i.actionableExercise);
  if (actionable.length > 0) {
    return actionable[0];
  }
  
  return insights[0] || null;
}

/**
 * Get post-session feedback
 */
export function getPostSessionFeedback(session: PracticeSession, context: CoachContext): CoachInsight[] {
  const feedback: CoachInsight[] = [];
  
  // Accuracy feedback
  if (session.accuracy !== undefined) {
    if (session.accuracy >= 90) {
      feedback.push({
        id: 'session-excellent',
        type: 'celebration',
        priority: 'celebration',
        title: 'Excellent Session! 🌟',
        message: `${session.accuracy.toFixed(0)}% accuracy - that's professional-level consistency!`,
        icon: '🌟',
        category: 'accuracy',
      });
    } else if (session.accuracy >= 80) {
      feedback.push({
        id: 'session-good',
        type: 'celebration',
        priority: 'low',
        title: 'Solid Practice 👍',
        message: `${session.accuracy.toFixed(0)}% accuracy. Good work! Ready to bump up the tempo?`,
        icon: '👍',
        category: 'accuracy',
      });
    } else if (session.accuracy < 60) {
      feedback.push({
        id: 'session-struggle',
        type: 'technique_tip',
        priority: 'medium',
        title: 'Challenging Session',
        message: `${session.accuracy.toFixed(0)}% accuracy. That was tough! Try slowing down by 20 BPM next time.`,
        details: 'Struggling at a tempo means you\'re at your learning edge. Slow down to lock in the pattern.',
        icon: '💪',
        category: 'accuracy',
      });
    }
  }
  
  // Timing feedback
  if (session.perfectHits !== undefined && session.earlyHits !== undefined && session.lateHits !== undefined) {
    const total = session.perfectHits + session.earlyHits + session.lateHits;
    if (total > 0) {
      const perfectRatio = session.perfectHits / total;
      
      if (perfectRatio > 0.8) {
        feedback.push({
          id: 'session-timing-great',
          type: 'celebration',
          priority: 'low',
          title: 'Timing Lock! ⏱️',
          message: `${Math.round(perfectRatio * 100)}% of your hits were perfectly timed. Your internal clock is solid.`,
          icon: '⏱️',
          category: 'timing',
        });
      }
    }
  }
  
  return feedback;
}

// Helper function
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

