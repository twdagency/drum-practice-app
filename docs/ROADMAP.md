# DrumPractice Roadmap Q1-Q2 2025

## Strategic Goals
1. Add missing features that Drumeo has (tempo trainer, routines)
2. Add unique features Drumeo doesn't have (OCR upload, MIDI recording)
3. Polish existing features (audio playback, polyrhythms)
4. Build network effects (community, challenges)

## Q1 2025 Sprint Plan

### Sprint 1 (Week of Jan 27): Audio Polish
**Goal**: Make playback educational-quality
- [ ] Add accent support to audio playback
- [ ] Add ghost note support (quiet notes)
- [ ] Add flam/drag/ruff ornament playback
- [ ] Source better drum samples (free: Freesound.org, 99Sounds)
- [ ] Test with users for feedback

**Files to modify**:
- Audio playback component
- Tone.js sampler configuration
- Add samples to /public/audio/

**Success Criteria**:
- Accented notes 30% louder
- Ghost notes 60% quieter
- Flams/drags sound realistic
- User feedback: "playback sounds great"

---

### Sprint 2 (Week of Feb 3): Tempo Trainer
**Goal**: Build unique competitive feature

**User Story**: 
As a drummer, I want the app to gradually increase tempo as I maintain accuracy, so I can build speed systematically.

**Requirements**:
- Start tempo: 60-200 BPM
- Target tempo: 80-300 BPM
- Increment: 1-20 BPM
- Accuracy threshold: 80-98%
- Bars required at each tempo: 2-8
- Progress visualization

**Technical Approach**:
```typescript
interface TempoTrainerConfig {
  startBPM: number;
  targetBPM: number;
  incrementBPM: number;
  accuracyThreshold: number;
  barsRequired: number;
}

class TempoTrainer {
  private currentBPM: number;
  private barsAtCurrentTempo: number = 0;
  
  onBarComplete(accuracy: number) {
    if (accuracy >= this.config.accuracyThreshold) {
      this.barsAtCurrentTempo++;
      if (this.barsAtCurrentTempo >= this.config.barsRequired) {
        this.increaseTempo();
      }
    } else {
      this.barsAtCurrentTempo = 0; // Reset
    }
  }
}
```

**Files to create**:
- `/src/components/practice/TempoTrainer.tsx`
- `/src/components/practice/TempoTrainerConfig.tsx`
- `/src/hooks/useTempoTrainer.ts`

**Success Criteria**:
- Smoothly increases tempo
- Visual progress indication
- Can pause/resume
- Saves best tempo achieved
- Works with existing patterns

---

### Sprint 3 (Week of Feb 10): Pattern Discovery
**Goal**: Help users find appropriate patterns

**Features**:
1. Difficulty filter (1-5 stars)
2. Category filter (Rock, Jazz, etc.)
3. "Recommended for you" section
4. "Similar patterns" suggestions

**Files to modify**:
- `/src/components/patterns/PatternList.tsx`
- `/src/components/patterns/FilterBar.tsx`
- `/src/components/dashboard/Recommendations.tsx`

**Recommendation Algorithm**:
```typescript
function getRecommendations(userId: string) {
  const stats = getUserStats(userId);
  
  return [
    // Patterns at user's level
    getPatternsByDifficulty(stats.averageDifficulty),
    
    // Similar to what they're good at
    getSimilarPatterns(stats.bestPatterns),
    
    // Address weak areas
    getBeginnerPatterns(stats.weakCategories),
    
    // Unexplored categories
    getPatternsByCategory(stats.unpracticedCategories)
  ];
}
```

---

### Sprint 4-6 (Feb 17 - Mar 7): Practice Routines
**Goal**: Answer "What should I practice today?"

**Pre-built Routines** (Create 5-10):
1. 15-Min Quick Practice
2. 30-Min Beginner Routine
3. 45-Min Intermediate Session
4. Speed Building (8-Week Program)
5. Rudiment Mastery
6. Rock Essentials
7. Jazz Fundamentals

**Data Structure**:
```typescript
interface PracticeRoutine {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: Exercise[];
}

interface Exercise {
  patternId: string;
  duration: number;
  startBPM: number;
  targetBPM?: number;
  focusArea: string;
  instructions: string;
}
```

**Example Routine**:
```typescript
const beginner30Min = {
  name: "30-Minute Beginner Routine",
  exercises: [
    {
      patternId: "single-stroke-roll",
      duration: 5,
      startBPM: 60,
      focusArea: "warm-up",
      instructions: "Focus on even strokes. Keep hands relaxed."
    },
    // ... more exercises
  ]
};
```

**Files to create**:
- `/src/data/routines/` (routine definitions)
- `/src/components/routines/RoutineSelector.tsx`
- `/src/components/routines/RoutinePlayer.tsx`
- `/src/components/routines/RoutineProgress.tsx`

---

## Q2 2025: Growth Features

### Month 4: OCR Notation Upload
**Approach**: Use Audiveris (open-source music OCR)
**Implementation**: Docker container + Node.js wrapper
**Premium Feature**: Limit to 5 uploads/month for Pro, unlimited for Premium

### Month 5: Community Pattern Sharing
**Implementation**: 
- Public pattern library
- User uploads (Pro+)
- Rating/review system
- Fork and edit patterns

### Month 6: Live Features
- Weekly challenges
- Drum battle mode
- Live teacher sessions (beta)

---

## Technical Debt to Address
- [x] Fix CommandPalette infinite loop ✅
- [x] Implement Stripe webhook database updates ✅
- [x] Integrate PRACTICE20 discount code ✅
- [ ] Create demo video
- [ ] Mobile optimization testing
- [ ] Performance audit (pattern list with 175+ items)

---

## Metrics to Track
- Trial → Paid conversion (target: 20%)
- Daily Active Users
- Average practice session length
- Patterns created per user
- Features used (MIDI vs mic vs playback)
- Churn rate (target: <5%/month)

---

## Competitor Monitoring
- [ ] Check Drumeo feature updates monthly
- [ ] Monitor Melodics pricing changes
- [ ] Track new entrants (Reddit r/drums, Google Alerts)
```

---

## 🎯 METHOD 3: Chat with Cursor About Specific Features

When you start a feature, give Cursor this context:
```
I'm working on [FEATURE NAME] for my drum practice app.

Context about this feature:
- Priority: [HIGH/MEDIUM/LOW]
- Goal: [What problem does this solve?]
- User story: [As a {user}, I want {feature}, so that {benefit}]
- Estimated time: [X days/weeks]

Existing relevant code:
- We already have: [list related features]
- Location: [file paths]
- Tech stack: [relevant libraries]

Requirements:
[Detailed requirements]

Please help me implement this by:
1. Suggesting the best file structure
2. Writing the core component
3. Integrating with existing features
4. Adding proper TypeScript types
5. Including error handling and loading states
```

**Example for Tempo Trainer**:
```
I'm working on a Tempo Trainer feature for my drum practice app.

Context:
- Priority: HIGH
- Goal: Help users systematically build speed
- User story: As a drummer, I want tempo to automatically increase as I maintain accuracy, so I can build speed without manually adjusting
- Estimated time: 1-2 weeks

Existing relevant code:
- We already have: Metronome, accuracy tracking, practice stats
- We use: Tone.js for audio, React hooks for state
- File structure: /src/components/practice/

Requirements:
- Start tempo: configurable 60-200 BPM
- Target tempo: configurable 80-300 BPM
- Increment: configurable 1-20 BPM
- Only increase if accuracy stays above threshold (e.g., 90%)
- Require X bars at each tempo before advancing
- Show progress: current BPM / target BPM
- Visual progress bar
- Can pause/resume
- Save best tempo achieved per pattern

Please help me:
1. Create TempoTrainer.tsx component
2. Create useTempoTrainer hook for logic
3. Integrate with existing metronome
4. Add configuration UI
5. Add progress visualization

---

## Future Considerations (Bookmarked)

### Microphone Hit Detection Enhancements
*Added: Dec 2024 - Consider for future optimization*

**Currently Implemented:**
- Spectral Flux + HFC + RMS combined detection (v2 processor)
- Adaptive thresholding
- Ghost/accent dynamic detection

**Potential Future Improvements:**

1. **Multi-band Onset Detection**
   - Split into frequency bands: kick (20-200Hz), snare (200-2000Hz), hi-hat (2000Hz+)
   - Better differentiation between drum types
   - Could improve accuracy for kit practice

2. **Look-ahead Buffering**
   - Small delay (~10-20ms) to find exact onset peak
   - Trade latency for precision
   - Useful for recording/transcription modes

3. **MIDI Velocity Mapping**
   - Train ghost/accent thresholds per user/environment
   - Calibration wizard for dynamics
   - Save profiles per microphone

4. **Machine Learning Approach**
   - TensorFlow.js for drum classification
   - YAMNet or Magenta's Onsets and Frames
   - Higher accuracy but more complexity/latency

5. **WebAssembly DSP**
   - Essentia.js (compiled from C++)
   - Near-native FFT performance
   - Smaller bundle than ML approach

6. **User Calibration Profiles**
   - Save optimal settings per user/room/mic
   - Auto-detect environment and suggest settings
   - Share profiles between users