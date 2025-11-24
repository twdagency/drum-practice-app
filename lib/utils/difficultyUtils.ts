/**
 * Difficulty rating and recommendation utilities
 */

import { Pattern } from '@/types';
import { getNotesPerBarForPattern, parseTokens, parseTimeSignature } from './patternUtils';

export interface DifficultyRating {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  score: number; // 0-100
  factors: {
    subdivision: number;
    timeSignature: number;
    notesPerBar: number;
    accents: number;
    rests: number;
    advancedMode: number;
    polyrhythm: number;
    ghostNotes: number;
    ornaments: number;
  };
}

export interface PracticeRecommendation {
  type: 'tempo' | 'accuracy' | 'endurance' | 'technique' | 'timing';
  message: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Calculate comprehensive difficulty rating for a pattern
 */
export function calculateDifficultyRating(pattern: Pattern): DifficultyRating {
  const notesPerBar = getNotesPerBarForPattern(pattern);
  const [numerator, denominator] = parseTimeSignature(pattern.timeSignature || '4/4');
  const drumPattern = parseTokens(pattern.drumPattern || '');
  const stickingPattern = parseTokens(pattern.stickingPattern || '');
  
  // Count accents
  const accentCount = (pattern._presetAccents || []).length;
  
  // Count rests
  const restCount = drumPattern.filter(token => 
    token.toUpperCase() === 'R' || token === '-'
  ).length;
  
  // Check for advanced mode (per-beat subdivisions)
  const hasAdvancedMode = pattern._advancedMode || false;
  const advancedModeComplexity = hasAdvancedMode 
    ? (pattern._perBeatSubdivisions?.length || 0) * 2 
    : 0;
  
  // Check for polyrhythm
  const hasPolyrhythm = !!(pattern._polyrhythmRightNotes || pattern._polyrhythmLeftNotes);
  const polyrhythmComplexity = hasPolyrhythm ? 15 : 0;
  
  // Count ghost notes (tokens in parentheses)
  const ghostNoteCount = drumPattern.filter(token => 
    token.startsWith('(') && token.endsWith(')')
  ).length;
  
  // Count ornaments (flams, drags, ruffs - lowercase letters before main note)
  const ornamentCount = stickingPattern.filter(token => 
    /^[a-z]+[A-Z]/.test(token)
  ).length;
  
  // Calculate factors (recalibrated to match 1-10 preset difficulty scale)
  // Base difficulty from subdivision (most important factor)
  let baseDifficulty = 1;
  if (pattern.subdivision <= 4) {
    baseDifficulty = 1; // Quarter notes = very easy
  } else if (pattern.subdivision <= 8) {
    baseDifficulty = 2; // Eighth notes = easy
  } else if (pattern.subdivision <= 16) {
    baseDifficulty = 3; // Sixteenth notes = beginner/intermediate
  } else if (pattern.subdivision <= 24) {
    baseDifficulty = 5; // Triplet sixteenths = intermediate
  } else {
    baseDifficulty = 7; // 32nd notes = advanced
  }
  
  // Adjust for time signature complexity
  if (numerator !== 4) {
    if (numerator === 3) {
      baseDifficulty += 0.5; // 3/4 is slightly harder
    } else {
      baseDifficulty += 1; // Odd time signatures are harder
    }
  }
  
  // Adjust for number of notes (more notes = slightly harder)
  if (notesPerBar > 32) {
    baseDifficulty += 1;
  } else if (notesPerBar > 16) {
    baseDifficulty += 0.5;
  }
  
  // Accents add moderate difficulty
  if (accentCount > 0) {
    baseDifficulty += Math.min(accentCount * 0.3, 1.5);
  }
  
  // Rests add slight difficulty
  if (restCount > 0) {
    baseDifficulty += Math.min(restCount * 0.1, 0.5);
  }
  
  // Advanced mode (per-beat subdivisions) adds significant difficulty
  if (hasAdvancedMode) {
    baseDifficulty += Math.min(advancedModeComplexity * 0.5, 2);
  }
  
  // Polyrhythms add significant difficulty
  if (hasPolyrhythm) {
    baseDifficulty += 2;
  }
  
  // Ghost notes add moderate difficulty
  if (ghostNoteCount > 0) {
    baseDifficulty += Math.min(ghostNoteCount * 0.4, 1.5);
  }
  
  // Ornaments (flams, drags, ruffs) add significant difficulty
  if (ornamentCount > 0) {
    baseDifficulty += Math.min(ornamentCount * 0.8, 2.5);
  }
  
  // Clamp to 1-10 scale and convert to 0-100 for display
  const difficultyScore = Math.max(1, Math.min(10, Math.round(baseDifficulty * 10) / 10));
  const score = Math.round(difficultyScore * 10); // Convert 1-10 to 0-100 for display
  
  // Map 1-10 scale to levels (matching preset difficulty ratings)
  // 1-3 = Beginner, 4-6 = Intermediate, 7-8 = Advanced, 9-10 = Expert
  let level: DifficultyRating['level'];
  if (difficultyScore <= 3) {
    level = 'beginner';
  } else if (difficultyScore <= 6) {
    level = 'intermediate';
  } else if (difficultyScore <= 8) {
    level = 'advanced';
  } else {
    level = 'expert';
  }
  
  // Store factors for reference (normalized values)
  const factors = {
    subdivision: pattern.subdivision,
    timeSignature: numerator,
    notesPerBar: notesPerBar,
    accents: accentCount,
    rests: restCount,
    advancedMode: hasAdvancedMode ? 1 : 0,
    polyrhythm: hasPolyrhythm ? 1 : 0,
    ghostNotes: ghostNoteCount,
    ornaments: ornamentCount,
  };
  
  return {
    level,
    score,
    factors,
  };
}

/**
 * Generate practice recommendations based on pattern difficulty and user stats
 */
export function generatePracticeRecommendations(
  pattern: Pattern,
  difficulty: DifficultyRating,
  userStats?: {
    avgAccuracy?: number;
    avgTiming?: number;
    practiceTime?: number;
  }
): PracticeRecommendation[] {
  const recommendations: PracticeRecommendation[] = [];
  
  // Tempo recommendations
  if (difficulty.score > 60) {
    recommendations.push({
      type: 'tempo',
      message: 'Start slow (60-80 BPM) and gradually increase tempo as you build muscle memory.',
      priority: 'high',
    });
  } else if (difficulty.score > 30) {
    recommendations.push({
      type: 'tempo',
      message: 'Practice at a comfortable tempo (80-100 BPM) before increasing speed.',
      priority: 'medium',
    });
  }
  
  // Accuracy recommendations
  if (userStats?.avgAccuracy && userStats.avgAccuracy < 70) {
    recommendations.push({
      type: 'accuracy',
      message: 'Focus on accuracy over speed. Practice slowly until you can play consistently.',
      priority: 'high',
    });
  }
  
  if (difficulty.factors.ghostNotes > 0) {
    recommendations.push({
      type: 'technique',
      message: 'Pay attention to ghost notes - play them softer than regular notes.',
      priority: 'medium',
    });
  }
  
  if (difficulty.factors.ornaments > 0) {
    recommendations.push({
      type: 'technique',
      message: 'Practice flams, drags, and ruffs separately before incorporating them into the pattern.',
      priority: 'high',
    });
  }
  
  // Timing recommendations
  if (userStats?.avgTiming && userStats.avgTiming > 50) {
    recommendations.push({
      type: 'timing',
      message: 'Work on timing precision. Use a metronome and focus on staying in time.',
      priority: 'high',
    });
  }
  
  if (difficulty.factors.polyrhythm > 0) {
    recommendations.push({
      type: 'technique',
      message: 'Practice each hand separately, then combine. Use the learning mode feature.',
      priority: 'high',
    });
  }
  
  if (difficulty.factors.advancedMode > 0) {
    recommendations.push({
      type: 'technique',
      message: 'This pattern uses mixed subdivisions. Practice each beat separately first.',
      priority: 'high',
    });
  }
  
  // Endurance recommendations
  if (difficulty.factors.notesPerBar > 2 && pattern.repeat && pattern.repeat > 4) {
    recommendations.push({
      type: 'endurance',
      message: 'Build endurance by gradually increasing the number of repeats.',
      priority: 'medium',
    });
  }
  
  // Default recommendation for beginners
  if (difficulty.level === 'beginner' && recommendations.length === 0) {
    recommendations.push({
      type: 'tempo',
      message: 'Great pattern to start with! Focus on consistency and steady tempo.',
      priority: 'low',
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Get difficulty color for UI display
 */
export function getDifficultyColor(level: DifficultyRating['level']): string {
  switch (level) {
    case 'beginner':
      return '#10b981'; // green
    case 'intermediate':
      return '#f59e0b'; // amber
    case 'advanced':
      return '#f97316'; // orange
    case 'expert':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Get difficulty label for UI display
 */
export function getDifficultyLabel(level: DifficultyRating['level']): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

