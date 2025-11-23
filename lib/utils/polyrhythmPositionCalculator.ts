/**
 * Polyrhythm Position Calculator
 * Calculates precise beat positions for polyrhythm notes
 * 
 * This is a complete rewrite based on correct polyrhythm notation principles.
 * Positions are calculated in beats (not subdivisions) for accuracy.
 */

/**
 * Calculate note positions for both voices of a polyrhythm
 * 
 * @param numerator Number of notes in voice 1 (e.g., 4 for 4:3)
 * @param denominator Number of notes in voice 2 (e.g., 3 for 4:3)
 * @param beatsPerBar Number of beats in the measure (e.g., 4 for 4/4)
 * @returns Object containing positions and alignment information
 */
export interface PolyrhythmPositions {
  rightPositions: number[];  // Beat positions for voice 1 (numerator)
  leftPositions: number[];    // Beat positions for voice 2 (denominator)
  alignments: Array<{rightIndex: number, leftIndex: number}>;
}

export function calculatePolyrhythmPositions(
  numerator: number,
  denominator: number,
  beatsPerBar: number
): PolyrhythmPositions {
  const rightPositions: number[] = [];
  const leftPositions: number[] = [];
  
  // Voice 1 (numerator): n notes evenly spaced across B beats
  // Position i = (i * B) / n
  for (let i = 0; i < numerator; i++) {
    const position = (i * beatsPerBar) / numerator;
    rightPositions.push(position);
  }
  
  // Voice 2 (denominator): m notes evenly spaced across B beats
  // Position j = (j * B) / m
  for (let j = 0; j < denominator; j++) {
    const position = (j * beatsPerBar) / denominator;
    leftPositions.push(position);
  }
  
  // Find exact alignments
  // Notes align when: i * B / n = j * B / m
  // Simplifies to: i * m = j * n
  // This happens when both are multiples of LCM(n, m)
  const alignments: Array<{rightIndex: number, leftIndex: number}> = [];
  const tolerance = 0.0001; // Very small tolerance for floating point precision
  
  for (let i = 0; i < numerator; i++) {
    for (let j = 0; j < denominator; j++) {
      const rightPos = rightPositions[i];
      const leftPos = leftPositions[j];
      
      // Check if positions align exactly (within tolerance)
      if (Math.abs(rightPos - leftPos) < tolerance) {
        alignments.push({rightIndex: i, leftIndex: j});
      }
    }
  }
  
  return { rightPositions, leftPositions, alignments };
}

/**
 * Calculate the least common multiple (LCM) of two numbers
 * Used for determining when notes align in polyrhythms
 */
export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * Calculate the greatest common divisor (GCD) of two numbers
 */
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Get the cycle length (LCM) for a polyrhythm
 * This is the number of beats before the pattern repeats
 */
export function getPolyrhythmCycleLength(numerator: number, denominator: number): number {
  return lcm(numerator, denominator);
}

