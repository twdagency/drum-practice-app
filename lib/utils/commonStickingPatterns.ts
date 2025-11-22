/**
 * Common sticking patterns for drum practice
 * These are short patterns that can be repeated to fill a bar
 */

export interface StickingPattern {
  name: string;
  pattern: string;
  description?: string;
}

export const commonStickingPatterns: StickingPattern[] = [
  { name: 'Single Stroke Roll', pattern: 'R L', description: 'Alternating hands' },
  { name: 'Double Stroke Roll', pattern: 'R R L L', description: 'Two strokes per hand' },
  { name: 'Paradiddle', pattern: 'R L R R L R L L', description: 'Classic paradiddle' },
  { name: 'Inverted Paradiddle', pattern: 'R L L R L R R L', description: 'Inverted paradiddle' },
  { name: 'Paradiddle-diddle', pattern: 'R L R R L L', description: 'Paradiddle with double' },
  { name: 'Flam', pattern: 'lR rL', description: 'Flam pattern (lR = left flam, rL = right flam)' },
  { name: 'Swiss Army Triplet', pattern: 'R L R', description: 'Three-note pattern' },
  { name: 'Pataflafla', pattern: 'R L R L', description: 'Four-note pattern' },
  { name: 'Single Stroke Four', pattern: 'R R R R L L L L', description: 'Four strokes per hand' },
  { name: 'Double Paradiddle', pattern: 'R L R L R R L R L R L L', description: 'Extended paradiddle' },
  { name: 'Triple Paradiddle', pattern: 'R L R L R L R R L R L R L R L L', description: 'Long paradiddle variation' },
  { name: 'Flam Tap', pattern: 'lR rL R L', description: 'Flam tap pattern' },
  { name: 'Flam Accent', pattern: 'lR rL R L', description: 'Flam with accents' },
  { name: 'Drag', pattern: 'R R L', description: 'Drag pattern' },
  { name: 'Single Drag Tap', pattern: 'R R L R L L', description: 'Drag tap combination' },
  { name: 'Double Drag Tap', pattern: 'R R L R R L L L', description: 'Double drag tap' },
  { name: 'Lesson 25', pattern: 'R L R L R L R L', description: 'Eight-note pattern' },
  { name: 'Six Stroke Roll', pattern: 'R R L L R L', description: 'Six-note pattern' },
  { name: 'Seven Stroke Roll', pattern: 'R R L L R L R', description: 'Seven-note pattern' },
  { name: 'Nine Stroke Roll', pattern: 'R R L L R R L L R', description: 'Nine-note pattern' },
];

/**
 * Get a sticking pattern by name
 */
export function getStickingPatternByName(name: string): StickingPattern | undefined {
  return commonStickingPatterns.find(p => p.name === name);
}

/**
 * Get all sticking pattern names
 */
export function getStickingPatternNames(): string[] {
  return commonStickingPatterns.map(p => p.name);
}

