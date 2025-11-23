/**
 * Polyrhythm Implementation Test Script
 * 
 * Run this with: npx tsx lib/utils/__tests__/polyrhythm.test.ts
 * Or: node --loader ts-node/esm lib/utils/__tests__/polyrhythm.test.ts
 * 
 * This script tests:
 * 1. Position calculations (beat-based)
 * 2. Duration calculations (tuplet detection)
 * 3. Alignment detection
 * 4. Expected values for common ratios
 */

import { calculatePolyrhythmPositions, lcm, getPolyrhythmCycleLength } from '../polyrhythmPositionCalculator';
import { calculatePolyrhythmDurations } from '../polyrhythmDurationCalculator';

// Test helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    return false;
  }
  return true;
}

function test(name: string, fn: () => boolean) {
  console.log(`\n🧪 Testing: ${name}`);
  const result = fn();
  if (result) {
    console.log(`✅ PASS: ${name}`);
  }
  return result;
}

// Test 1: 4:3 Polyrhythm in 4/4
test('4:3 Polyrhythm Positions', () => {
  const positions = calculatePolyrhythmPositions(4, 3, 4);
  
  // Right voice: 4 notes evenly spaced across 4 beats
  // Expected: [0, 1, 2, 3]
  const expectedRight = [0, 1, 2, 3];
  let pass = true;
  
  for (let i = 0; i < 4; i++) {
    if (Math.abs(positions.rightPositions[i] - expectedRight[i]) > 0.001) {
      pass = false;
      console.error(`  Right position ${i}: expected ${expectedRight[i]}, got ${positions.rightPositions[i]}`);
    }
  }
  
  // Left voice: 3 notes evenly spaced across 4 beats
  // Expected: [0, 4/3 ≈ 1.333, 8/3 ≈ 2.667]
  const expectedLeft = [0, 4/3, 8/3];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
      pass = false;
      console.error(`  Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`);
    }
  }
  
  // Alignments: Only position 0 should align
  if (positions.alignments.length !== 1) {
    pass = false;
    console.error(`  Expected 1 alignment, got ${positions.alignments.length}`);
  }
  if (positions.alignments[0].rightIndex !== 0 || positions.alignments[0].leftIndex !== 0) {
    pass = false;
    console.error(`  Expected alignment at (0, 0), got (${positions.alignments[0].rightIndex}, ${positions.alignments[0].leftIndex})`);
  }
  
  return pass;
});

// Test 2: 5:4 Polyrhythm in 4/4
test('5:4 Polyrhythm Positions', () => {
  const positions = calculatePolyrhythmPositions(5, 4, 4);
  
  // Right voice: 5 notes evenly spaced across 4 beats
  // Expected: [0, 0.8, 1.6, 2.4, 3.2]
  const expectedRight = [0, 0.8, 1.6, 2.4, 3.2];
  let pass = true;
  
  for (let i = 0; i < 5; i++) {
    if (Math.abs(positions.rightPositions[i] - expectedRight[i]) > 0.001) {
      pass = false;
      console.error(`  Right position ${i}: expected ${expectedRight[i]}, got ${positions.rightPositions[i]}`);
    }
  }
  
  // Left voice: 4 notes evenly spaced across 4 beats
  // Expected: [0, 1, 2, 3]
  const expectedLeft = [0, 1, 2, 3];
  for (let i = 0; i < 4; i++) {
    if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
      pass = false;
      console.error(`  Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`);
    }
  }
  
  // Alignments: Only position 0 should align
  if (positions.alignments.length !== 1) {
    pass = false;
    console.error(`  Expected 1 alignment, got ${positions.alignments.length}`);
  }
  
  return pass;
});

// Test 3: 3:2 Polyrhythm in 4/4
test('3:2 Polyrhythm Positions', () => {
  const positions = calculatePolyrhythmPositions(3, 2, 4);
  
  // Right voice: 3 notes evenly spaced across 4 beats
  // Expected: [0, 4/3 ≈ 1.333, 8/3 ≈ 2.667]
  const expectedRight = [0, 4/3, 8/3];
  let pass = true;
  
  for (let i = 0; i < 3; i++) {
    if (Math.abs(positions.rightPositions[i] - expectedRight[i]) > 0.001) {
      pass = false;
      console.error(`  Right position ${i}: expected ${expectedRight[i]}, got ${positions.rightPositions[i]}`);
    }
  }
  
  // Left voice: 2 notes evenly spaced across 4 beats
  // Expected: [0, 2]
  const expectedLeft = [0, 2];
  for (let i = 0; i < 2; i++) {
    if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
      pass = false;
      console.error(`  Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`);
    }
  }
  
  // Alignments: Position 0 should align
  if (positions.alignments.length < 1) {
    pass = false;
    console.error(`  Expected at least 1 alignment, got ${positions.alignments.length}`);
  }
  
  return pass;
});

// Test 4: 4:3 Duration Calculation
test('4:3 Polyrhythm Durations', () => {
  const durations = calculatePolyrhythmDurations(4, 3, 4, 4);
  
  // Right: 4 notes, each 1 beat = quarter notes, no tuplet
  let pass = true;
  
  if (durations.rightNoteDurationBeats !== 1) {
    pass = false;
    console.error(`  Right note duration: expected 1 beat, got ${durations.rightNoteDurationBeats}`);
  }
  
  if (durations.rightDuration !== 'q') {
    pass = false;
    console.error(`  Right duration string: expected 'q', got '${durations.rightDuration}'`);
  }
  
  if (durations.rightNeedsTuplet !== false) {
    pass = false;
    console.error(`  Right needs tuplet: expected false, got ${durations.rightNeedsTuplet}`);
  }
  
  // Left: 3 notes, each 4/3 beats, needs tuplet
  const expectedLeftBeats = 4/3;
  if (Math.abs(durations.leftNoteDurationBeats - expectedLeftBeats) > 0.001) {
    pass = false;
    console.error(`  Left note duration: expected ${expectedLeftBeats}, got ${durations.leftNoteDurationBeats}`);
  }
  
  if (durations.leftNeedsTuplet !== true) {
    pass = false;
    console.error(`  Left needs tuplet: expected true, got ${durations.leftNeedsTuplet}`);
  }
  
  if (!durations.leftTupletConfig) {
    pass = false;
    console.error(`  Left tuplet config: expected config, got null`);
  } else {
    if (durations.leftTupletConfig.num_notes !== 3) {
      pass = false;
      console.error(`  Left tuplet num_notes: expected 3, got ${durations.leftTupletConfig.num_notes}`);
    }
    if (durations.leftTupletConfig.notes_occupied !== 4) {
      pass = false;
      console.error(`  Left tuplet notes_occupied: expected 4, got ${durations.leftTupletConfig.notes_occupied}`);
    }
  }
  
  return pass;
});

// Test 5: 5:4 Duration Calculation
test('5:4 Polyrhythm Durations', () => {
  const durations = calculatePolyrhythmDurations(5, 4, 4, 4);
  
  let pass = true;
  
  // Right: 5 notes, each 0.8 beats, needs tuplet
  const expectedRightBeats = 0.8;
  if (Math.abs(durations.rightNoteDurationBeats - expectedRightBeats) > 0.001) {
    pass = false;
    console.error(`  Right note duration: expected ${expectedRightBeats}, got ${durations.rightNoteDurationBeats}`);
  }
  
  if (durations.rightNeedsTuplet !== true) {
    pass = false;
    console.error(`  Right needs tuplet: expected true, got ${durations.rightNeedsTuplet}`);
  }
  
  if (!durations.rightTupletConfig) {
    pass = false;
    console.error(`  Right tuplet config: expected config, got null`);
  } else {
    if (durations.rightTupletConfig.num_notes !== 5) {
      pass = false;
      console.error(`  Right tuplet num_notes: expected 5, got ${durations.rightTupletConfig.num_notes}`);
    }
    if (durations.rightTupletConfig.notes_occupied !== 4) {
      pass = false;
      console.error(`  Right tuplet notes_occupied: expected 4, got ${durations.rightTupletConfig.notes_occupied}`);
    }
  }
  
  // Left: 4 notes, each 1 beat = quarter notes, no tuplet
  if (durations.leftNoteDurationBeats !== 1) {
    pass = false;
    console.error(`  Left note duration: expected 1 beat, got ${durations.leftNoteDurationBeats}`);
  }
  
  if (durations.leftNeedsTuplet !== false) {
    pass = false;
    console.error(`  Left needs tuplet: expected false, got ${durations.leftNeedsTuplet}`);
  }
  
  return pass;
});

// Test 6: LCM Calculation
test('LCM Calculation', () => {
  let pass = true;
  
  if (lcm(4, 3) !== 12) {
    pass = false;
    console.error(`  LCM(4, 3): expected 12, got ${lcm(4, 3)}`);
  }
  
  if (lcm(5, 4) !== 20) {
    pass = false;
    console.error(`  LCM(5, 4): expected 20, got ${lcm(5, 4)}`);
  }
  
  if (lcm(3, 2) !== 6) {
    pass = false;
    console.error(`  LCM(3, 2): expected 6, got ${lcm(3, 2)}`);
  }
  
  return pass;
});

// Test 7: Cycle Length
test('Cycle Length Calculation', () => {
  let pass = true;
  
  if (getPolyrhythmCycleLength(4, 3) !== 12) {
    pass = false;
    console.error(`  Cycle length(4, 3): expected 12, got ${getPolyrhythmCycleLength(4, 3)}`);
  }
  
  if (getPolyrhythmCycleLength(5, 4) !== 20) {
    pass = false;
    console.error(`  Cycle length(5, 4): expected 20, got ${getPolyrhythmCycleLength(5, 4)}`);
  }
  
  return pass;
});

// Test 8: Different Time Signatures
test('3:2 Polyrhythm in 3/4', () => {
  const positions = calculatePolyrhythmPositions(3, 2, 3);
  
  // Right: 3 notes in 3 beats = [0, 1, 2]
  // Left: 2 notes in 3 beats = [0, 1.5]
  let pass = true;
  
  const expectedRight = [0, 1, 2];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(positions.rightPositions[i] - expectedRight[i]) > 0.001) {
      pass = false;
      console.error(`  Right position ${i}: expected ${expectedRight[i]}, got ${positions.rightPositions[i]}`);
    }
  }
  
  const expectedLeft = [0, 1.5];
  for (let i = 0; i < 2; i++) {
    if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
      pass = false;
      console.error(`  Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`);
    }
  }
  
  return pass;
});

// Test 9: 7:4 Polyrhythm
test('7:4 Polyrhythm Positions', () => {
  const positions = calculatePolyrhythmPositions(7, 4, 4);
  
  // Right: 7 notes evenly spaced = [0, 4/7, 8/7, 12/7, 16/7, 20/7, 24/7]
  // Left: 4 notes evenly spaced = [0, 1, 2, 3]
  let pass = true;
  
  // Check right positions
  for (let i = 0; i < 7; i++) {
    const expected = (i * 4) / 7;
    if (Math.abs(positions.rightPositions[i] - expected) > 0.001) {
      pass = false;
      console.error(`  Right position ${i}: expected ${expected}, got ${positions.rightPositions[i]}`);
    }
  }
  
  // Check left positions
  const expectedLeft = [0, 1, 2, 3];
  for (let i = 0; i < 4; i++) {
    if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
      pass = false;
      console.error(`  Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`);
    }
  }
  
  // Only position 0 should align
  if (positions.alignments.length !== 1) {
    pass = false;
    console.error(`  Expected 1 alignment, got ${positions.alignments.length}`);
  }
  
  return pass;
});

// Test 10: Alignment Edge Cases
test('Alignment Detection - Multiple Alignments', () => {
  // 6:4 polyrhythm should have alignments at 0 and 2
  const positions = calculatePolyrhythmPositions(6, 4, 4);
  
  // Right: [0, 2/3, 4/3, 2, 8/3, 10/3]
  // Left: [0, 1, 2, 3]
  // Alignments: 0 and 2
  let pass = true;
  
  if (positions.alignments.length !== 2) {
    pass = false;
    console.error(`  Expected 2 alignments, got ${positions.alignments.length}`);
  } else {
    // Check first alignment (0, 0)
    if (positions.alignments[0].rightIndex !== 0 || positions.alignments[0].leftIndex !== 0) {
      pass = false;
      console.error(`  First alignment: expected (0, 0), got (${positions.alignments[0].rightIndex}, ${positions.alignments[0].leftIndex})`);
    }
    // Check second alignment (3, 2) - right note at position 2, left note at position 2
    const secondAlign = positions.alignments[1];
    if (Math.abs(positions.rightPositions[secondAlign.rightIndex] - 2) > 0.001 ||
        Math.abs(positions.leftPositions[secondAlign.leftIndex] - 2) > 0.001) {
      pass = false;
      console.error(`  Second alignment should be at beat 2`);
    }
  }
  
  return pass;
});

// Run all tests
console.log('🚀 Starting Polyrhythm Implementation Tests\n');
console.log('=' .repeat(60));

const tests = [
  test('4:3 Polyrhythm Positions', () => {
    const positions = calculatePolyrhythmPositions(4, 3, 4);
    const expectedRight = [0, 1, 2, 3];
    const expectedLeft = [0, 4/3, 8/3];
    let pass = true;
    
    for (let i = 0; i < 4; i++) {
      if (Math.abs(positions.rightPositions[i] - expectedRight[i]) > 0.001) {
        pass = false;
        console.error(`  Right position ${i}: expected ${expectedRight[i]}, got ${positions.rightPositions[i]}`);
      }
    }
    
    for (let i = 0; i < 3; i++) {
      if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
        pass = false;
        console.error(`  Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`);
      }
    }
    
    if (positions.alignments.length !== 1 || positions.alignments[0].rightIndex !== 0 || positions.alignments[0].leftIndex !== 0) {
      pass = false;
      console.error(`  Alignment: expected (0, 0), got (${positions.alignments[0]?.rightIndex}, ${positions.alignments[0]?.leftIndex})`);
    }
    
    return pass;
  }),
  
  test('5:4 Polyrhythm Positions', () => {
    const positions = calculatePolyrhythmPositions(5, 4, 4);
    const expectedRight = [0, 0.8, 1.6, 2.4, 3.2];
    const expectedLeft = [0, 1, 2, 3];
    let pass = true;
    
    for (let i = 0; i < 5; i++) {
      if (Math.abs(positions.rightPositions[i] - expectedRight[i]) > 0.001) {
        pass = false;
        console.error(`  Right position ${i}: expected ${expectedRight[i]}, got ${positions.rightPositions[i]}`);
      }
    }
    
    for (let i = 0; i < 4; i++) {
      if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
        pass = false;
        console.error(`  Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`);
      }
    }
    
    if (positions.alignments.length !== 1) {
      pass = false;
      console.error(`  Expected 1 alignment, got ${positions.alignments.length}`);
    }
    
    return pass;
  }),
  
  test('3:2 Polyrhythm Positions', () => {
    const positions = calculatePolyrhythmPositions(3, 2, 4);
    const expectedRight = [0, 4/3, 8/3];
    const expectedLeft = [0, 2];
    let pass = true;
    
    for (let i = 0; i < 3; i++) {
      if (Math.abs(positions.rightPositions[i] - expectedRight[i]) > 0.001) {
        pass = false;
        console.error(`  Right position ${i}: expected ${expectedRight[i]}, got ${positions.rightPositions[i]}`);
      }
    }
    
    for (let i = 0; i < 2; i++) {
      if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
        pass = false;
        console.error(`  Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`);
      }
    }
    
    return pass;
  }),
  
  test('4:3 Polyrhythm Durations', () => {
    const durations = calculatePolyrhythmDurations(4, 3, 4, 4);
    let pass = true;
    
    if (durations.rightNoteDurationBeats !== 1) {
      pass = false;
      console.error(`  Right note duration: expected 1 beat, got ${durations.rightNoteDurationBeats}`);
    }
    
    if (durations.rightNeedsTuplet !== false) {
      pass = false;
      console.error(`  Right needs tuplet: expected false, got ${durations.rightNeedsTuplet}`);
    }
    
    const expectedLeftBeats = 4/3;
    if (Math.abs(durations.leftNoteDurationBeats - expectedLeftBeats) > 0.001) {
      pass = false;
      console.error(`  Left note duration: expected ${expectedLeftBeats}, got ${durations.leftNoteDurationBeats}`);
    }
    
    if (durations.leftNeedsTuplet !== true) {
      pass = false;
      console.error(`  Left needs tuplet: expected true, got ${durations.leftNeedsTuplet}`);
    }
    
    if (!durations.leftTupletConfig || durations.leftTupletConfig.num_notes !== 3 || durations.leftTupletConfig.notes_occupied !== 4) {
      pass = false;
      console.error(`  Left tuplet config: expected {num_notes: 3, notes_occupied: 4}, got ${JSON.stringify(durations.leftTupletConfig)}`);
    }
    
    return pass;
  }),
  
  test('5:4 Polyrhythm Durations', () => {
    const durations = calculatePolyrhythmDurations(5, 4, 4, 4);
    let pass = true;
    
    const expectedRightBeats = 0.8;
    if (Math.abs(durations.rightNoteDurationBeats - expectedRightBeats) > 0.001) {
      pass = false;
      console.error(`  Right note duration: expected ${expectedRightBeats}, got ${durations.rightNoteDurationBeats}`);
    }
    
    if (durations.rightNeedsTuplet !== true) {
      pass = false;
      console.error(`  Right needs tuplet: expected true, got ${durations.rightNeedsTuplet}`);
    }
    
    if (!durations.rightTupletConfig || durations.rightTupletConfig.num_notes !== 5 || durations.rightTupletConfig.notes_occupied !== 4) {
      pass = false;
      console.error(`  Right tuplet config: expected {num_notes: 5, notes_occupied: 4}, got ${JSON.stringify(durations.rightTupletConfig)}`);
    }
    
    if (durations.leftNoteDurationBeats !== 1) {
      pass = false;
      console.error(`  Left note duration: expected 1 beat, got ${durations.leftNoteDurationBeats}`);
    }
    
    if (durations.leftNeedsTuplet !== false) {
      pass = false;
      console.error(`  Left needs tuplet: expected false, got ${durations.leftNeedsTuplet}`);
    }
    
    return pass;
  }),
  
  test('LCM Calculation', () => {
    let pass = true;
    
    if (lcm(4, 3) !== 12) {
      pass = false;
      console.error(`  LCM(4, 3): expected 12, got ${lcm(4, 3)}`);
    }
    
    if (lcm(5, 4) !== 20) {
      pass = false;
      console.error(`  LCM(5, 4): expected 20, got ${lcm(5, 4)}`);
    }
    
    if (lcm(3, 2) !== 6) {
      pass = false;
      console.error(`  LCM(3, 2): expected 6, got ${lcm(3, 2)}`);
    }
    
    return pass;
  }),
  
  test('3:2 Polyrhythm in 3/4', () => {
    const positions = calculatePolyrhythmPositions(3, 2, 3);
    const expectedRight = [0, 1, 2];
    const expectedLeft = [0, 1.5];
    let pass = true;
    
    for (let i = 0; i < 3; i++) {
      if (Math.abs(positions.rightPositions[i] - expectedRight[i]) > 0.001) {
        pass = false;
        console.error(`  Right position ${i}: expected ${expectedRight[i]}, got ${positions.rightPositions[i]}`);
      }
    }
    
    for (let i = 0; i < 2; i++) {
      if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
        pass = false;
        console.error(`  Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`);
      }
    }
    
    return pass;
  }),
  
  test('7:4 Polyrhythm Positions', () => {
    const positions = calculatePolyrhythmPositions(7, 4, 4);
    let pass = true;
    
    // Check right positions (7 notes evenly spaced)
    for (let i = 0; i < 7; i++) {
      const expected = (i * 4) / 7;
      if (Math.abs(positions.rightPositions[i] - expected) > 0.001) {
        pass = false;
        console.error(`  Right position ${i}: expected ${expected}, got ${positions.rightPositions[i]}`);
      }
    }
    
    // Check left positions (4 notes evenly spaced)
    const expectedLeft = [0, 1, 2, 3];
    for (let i = 0; i < 4; i++) {
      if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
        pass = false;
        console.error(`  Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`);
      }
    }
    
    // Only position 0 should align
    if (positions.alignments.length !== 1) {
      pass = false;
      console.error(`  Expected 1 alignment, got ${positions.alignments.length}`);
    }
    
    return pass;
  }),
];

const passed = tests.filter(t => t).length;
const total = tests.length;

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);

if (passed === total) {
  console.log('✅ All tests passed! Polyrhythm implementation is correct.\n');
  process.exit(0);
} else {
  console.log(`❌ ${total - passed} test(s) failed. Please review the errors above.\n`);
  process.exit(1);
}

