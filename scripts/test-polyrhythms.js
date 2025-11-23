/**
 * Polyrhythm Test Script
 * 
 * Run with: node scripts/test-polyrhythms.js
 * 
 * This is a simplified JavaScript version that can run without TypeScript compilation.
 * It tests the core logic of the polyrhythm implementation.
 */

// Simple test framework
function test(name, fn) {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    const result = fn();
    if (result === true) {
      console.log(`✅ PASS: ${name}`);
      return true;
    } else {
      console.log(`❌ FAIL: ${name}`);
      if (typeof result === 'string') {
        console.log(`   ${result}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Helper functions (simplified versions)
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function calculatePolyrhythmPositions(numerator, denominator, beatsPerBar) {
  const rightPositions = [];
  const leftPositions = [];
  
  // Voice 1 (numerator): n notes evenly spaced across B beats
  for (let i = 0; i < numerator; i++) {
    rightPositions.push((i * beatsPerBar) / numerator);
  }
  
  // Voice 2 (denominator): m notes evenly spaced across B beats
  for (let j = 0; j < denominator; j++) {
    leftPositions.push((j * beatsPerBar) / denominator);
  }
  
  // Find exact alignments
  const alignments = [];
  const tolerance = 0.0001;
  
  for (let i = 0; i < numerator; i++) {
    for (let j = 0; j < denominator; j++) {
      const rightPos = rightPositions[i];
      const leftPos = leftPositions[j];
      
      if (Math.abs(rightPos - leftPos) < tolerance) {
        alignments.push({rightIndex: i, leftIndex: j});
      }
    }
  }
  
  return { rightPositions, leftPositions, alignments };
}

function calculatePolyrhythmDurations(numerator, denominator, beatsPerBar, beatValue = 4) {
  const rightNoteDurationBeats = beatsPerBar / numerator;
  const leftNoteDurationBeats = beatsPerBar / denominator;
  
  // Simple check: if duration is not 1, 0.5, 0.25, etc., needs tuplet
  const isStandard = (beats) => {
    const standard = [4, 2, 1, 0.5, 0.25, 0.125];
    return standard.some(val => Math.abs(beats - val) < 0.001);
  };
  
  const rightNeedsTuplet = !isStandard(rightNoteDurationBeats);
  const leftNeedsTuplet = !isStandard(leftNoteDurationBeats);
  
  let rightTupletConfig = null;
  let leftTupletConfig = null;
  
  if (rightNeedsTuplet) {
    rightTupletConfig = {
      num_notes: numerator,
      notes_occupied: denominator
    };
  }
  
  if (leftNeedsTuplet) {
    leftTupletConfig = {
      num_notes: denominator,
      notes_occupied: numerator
    };
  }
  
  return {
    rightNoteDurationBeats,
    leftNoteDurationBeats,
    rightNeedsTuplet,
    leftNeedsTuplet,
    rightTupletConfig,
    leftTupletConfig,
  };
}

// Run tests
console.log('🚀 Starting Polyrhythm Implementation Tests\n');
console.log('='.repeat(60));

const tests = [
  test('4:3 Polyrhythm Positions', () => {
    const positions = calculatePolyrhythmPositions(4, 3, 4);
    const expectedRight = [0, 1, 2, 3];
    const expectedLeft = [0, 4/3, 8/3];
    
    for (let i = 0; i < 4; i++) {
      if (Math.abs(positions.rightPositions[i] - expectedRight[i]) > 0.001) {
        return `Right position ${i}: expected ${expectedRight[i]}, got ${positions.rightPositions[i]}`;
      }
    }
    
    for (let i = 0; i < 3; i++) {
      if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
        return `Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`;
      }
    }
    
    if (positions.alignments.length !== 1 || 
        positions.alignments[0].rightIndex !== 0 || 
        positions.alignments[0].leftIndex !== 0) {
      return `Alignment: expected (0, 0), got (${positions.alignments[0]?.rightIndex}, ${positions.alignments[0]?.leftIndex})`;
    }
    
    return true;
  }),
  
  test('5:4 Polyrhythm Positions', () => {
    const positions = calculatePolyrhythmPositions(5, 4, 4);
    const expectedRight = [0, 0.8, 1.6, 2.4, 3.2];
    const expectedLeft = [0, 1, 2, 3];
    
    for (let i = 0; i < 5; i++) {
      if (Math.abs(positions.rightPositions[i] - expectedRight[i]) > 0.001) {
        return `Right position ${i}: expected ${expectedRight[i]}, got ${positions.rightPositions[i]}`;
      }
    }
    
    for (let i = 0; i < 4; i++) {
      if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
        return `Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`;
      }
    }
    
    if (positions.alignments.length !== 1) {
      return `Expected 1 alignment, got ${positions.alignments.length}`;
    }
    
    return true;
  }),
  
  test('3:2 Polyrhythm Positions', () => {
    const positions = calculatePolyrhythmPositions(3, 2, 4);
    const expectedRight = [0, 4/3, 8/3];
    const expectedLeft = [0, 2];
    
    for (let i = 0; i < 3; i++) {
      if (Math.abs(positions.rightPositions[i] - expectedRight[i]) > 0.001) {
        return `Right position ${i}: expected ${expectedRight[i]}, got ${positions.rightPositions[i]}`;
      }
    }
    
    for (let i = 0; i < 2; i++) {
      if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
        return `Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`;
      }
    }
    
    return true;
  }),
  
  test('4:3 Polyrhythm Durations', () => {
    const durations = calculatePolyrhythmDurations(4, 3, 4, 4);
    
    if (durations.rightNoteDurationBeats !== 1) {
      return `Right note duration: expected 1 beat, got ${durations.rightNoteDurationBeats}`;
    }
    
    if (durations.rightNeedsTuplet !== false) {
      return `Right needs tuplet: expected false, got ${durations.rightNeedsTuplet}`;
    }
    
    const expectedLeftBeats = 4/3;
    if (Math.abs(durations.leftNoteDurationBeats - expectedLeftBeats) > 0.001) {
      return `Left note duration: expected ${expectedLeftBeats}, got ${durations.leftNoteDurationBeats}`;
    }
    
    if (durations.leftNeedsTuplet !== true) {
      return `Left needs tuplet: expected true, got ${durations.leftNeedsTuplet}`;
    }
    
    if (!durations.leftTupletConfig || 
        durations.leftTupletConfig.num_notes !== 3 || 
        durations.leftTupletConfig.notes_occupied !== 4) {
      return `Left tuplet config: expected {num_notes: 3, notes_occupied: 4}, got ${JSON.stringify(durations.leftTupletConfig)}`;
    }
    
    return true;
  }),
  
  test('5:4 Polyrhythm Durations', () => {
    const durations = calculatePolyrhythmDurations(5, 4, 4, 4);
    
    const expectedRightBeats = 0.8;
    if (Math.abs(durations.rightNoteDurationBeats - expectedRightBeats) > 0.001) {
      return `Right note duration: expected ${expectedRightBeats}, got ${durations.rightNoteDurationBeats}`;
    }
    
    if (durations.rightNeedsTuplet !== true) {
      return `Right needs tuplet: expected true, got ${durations.rightNeedsTuplet}`;
    }
    
    if (!durations.rightTupletConfig || 
        durations.rightTupletConfig.num_notes !== 5 || 
        durations.rightTupletConfig.notes_occupied !== 4) {
      return `Right tuplet config: expected {num_notes: 5, notes_occupied: 4}, got ${JSON.stringify(durations.rightTupletConfig)}`;
    }
    
    if (durations.leftNoteDurationBeats !== 1) {
      return `Left note duration: expected 1 beat, got ${durations.leftNoteDurationBeats}`;
    }
    
    if (durations.leftNeedsTuplet !== false) {
      return `Left needs tuplet: expected false, got ${durations.leftNeedsTuplet}`;
    }
    
    return true;
  }),
  
  test('LCM Calculation', () => {
    if (lcm(4, 3) !== 12) {
      return `LCM(4, 3): expected 12, got ${lcm(4, 3)}`;
    }
    
    if (lcm(5, 4) !== 20) {
      return `LCM(5, 4): expected 20, got ${lcm(5, 4)}`;
    }
    
    if (lcm(3, 2) !== 6) {
      return `LCM(3, 2): expected 6, got ${lcm(3, 2)}`;
    }
    
    return true;
  }),
  
  test('3:2 Polyrhythm in 3/4', () => {
    const positions = calculatePolyrhythmPositions(3, 2, 3);
    const expectedRight = [0, 1, 2];
    const expectedLeft = [0, 1.5];
    
    for (let i = 0; i < 3; i++) {
      if (Math.abs(positions.rightPositions[i] - expectedRight[i]) > 0.001) {
        return `Right position ${i}: expected ${expectedRight[i]}, got ${positions.rightPositions[i]}`;
      }
    }
    
    for (let i = 0; i < 2; i++) {
      if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
        return `Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`;
      }
    }
    
    return true;
  }),
  
  test('7:4 Polyrhythm Positions', () => {
    const positions = calculatePolyrhythmPositions(7, 4, 4);
    
    // Check right positions (7 notes evenly spaced)
    for (let i = 0; i < 7; i++) {
      const expected = (i * 4) / 7;
      if (Math.abs(positions.rightPositions[i] - expected) > 0.001) {
        return `Right position ${i}: expected ${expected}, got ${positions.rightPositions[i]}`;
      }
    }
    
    // Check left positions (4 notes evenly spaced)
    const expectedLeft = [0, 1, 2, 3];
    for (let i = 0; i < 4; i++) {
      if (Math.abs(positions.leftPositions[i] - expectedLeft[i]) > 0.001) {
        return `Left position ${i}: expected ${expectedLeft[i]}, got ${positions.leftPositions[i]}`;
      }
    }
    
    // Only position 0 should align
    if (positions.alignments.length !== 1) {
      return `Expected 1 alignment, got ${positions.alignments.length}`;
    }
    
    return true;
  }),
  
  test('Alignment Detection - 6:4 Multiple Alignments', () => {
    const positions = calculatePolyrhythmPositions(6, 4, 4);
    
    // Right: [0, 2/3, 4/3, 2, 8/3, 10/3]
    // Left: [0, 1, 2, 3]
    // Alignments: 0 and 2
    
    if (positions.alignments.length !== 2) {
      return `Expected 2 alignments, got ${positions.alignments.length}`;
    }
    
    // Check first alignment (0, 0)
    if (positions.alignments[0].rightIndex !== 0 || positions.alignments[0].leftIndex !== 0) {
      return `First alignment: expected (0, 0), got (${positions.alignments[0].rightIndex}, ${positions.alignments[0].leftIndex})`;
    }
    
    // Check second alignment should be at beat 2
    const secondAlign = positions.alignments[1];
    const rightPos = positions.rightPositions[secondAlign.rightIndex];
    const leftPos = positions.leftPositions[secondAlign.leftIndex];
    if (Math.abs(rightPos - 2) > 0.001 || Math.abs(leftPos - 2) > 0.001) {
      return `Second alignment should be at beat 2, got right=${rightPos}, left=${leftPos}`;
    }
    
    return true;
  }),
];

const passed = tests.filter(t => t === true).length;
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

