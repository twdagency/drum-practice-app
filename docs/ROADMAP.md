# DrumPractice Roadmap Q1-Q2 2025

## Strategic Goals
1. Add missing features that Drumeo has (tempo trainer, routines)
2. Add unique features Drumeo doesn't have (OCR upload, MIDI recording)
3. Polish existing features (audio playback, polyrhythms)
4. Build network effects (community, challenges)

## Q1 2025 Sprint Plan

### Sprint 1 (Week of Jan 27): Audio Polish ✅ COMPLETE
**Goal**: Make playback educational-quality
**Status**: DONE - All features implemented in `hooks/usePlayback.ts`

- [x] Add accent support to audio playback ✅ (1.3x volume = 30% louder)
- [x] Add ghost note support (quiet notes) ✅ (0.4x volume = 60% quieter)
- [x] Add flam/drag/ruff ornament playback ✅ (40ms/30ms/25ms timing)
- [x] Source drum samples ✅ (9 samples in public/sounds/)
- [x] Add drum kit selector ✅ (6 kits: Acoustic, Electronic, Jazz Brushes, Lo-Fi, 808, Rock)
- [ ] Source additional sample packs for each kit
- [ ] Test with users for feedback

**Implementation Details**:
- Ghost notes: Detected via `(S)` notation, played at 40% volume
- Accents: Detected via accentIndices, played at 130% volume  
- Ornaments: Flam (1 grace note 40ms before), Drag (2 notes 30ms apart), Ruff (3 notes 25ms apart)
- Grace notes played at ghost volume for realistic dynamics

**Success Criteria**:
- ✅ Accented notes 30% louder
- ✅ Ghost notes 60% quieter
- ✅ Flams/drags sound realistic

---

### Sprint 2 (Week of Feb 3): Tempo Trainer ✅ COMPLETE
**Goal**: Build unique competitive feature
**Status**: DONE - `components/PracticeMode/TempoTrainer.tsx` + `hooks/useTempoTrainer.ts`

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

### Sprint 3 (Week of Feb 10): Pattern Discovery ✅ COMPLETE
**Goal**: Help users find appropriate patterns
**Status**: DONE - Full implementation in `components/PracticeMode/PresetsBrowser.tsx`

**Features** (all implemented):
1. ✅ Difficulty filter (1-10 scale with min/max sliders)
2. ✅ Category filter (Rock, Jazz, Funk, Latin, etc.)
3. ✅ "Recommended for you" tab with 4 recommendation types
4. ✅ "Similar patterns" suggestions based on tags/subcategories

**Recommendation Types**:
- `atYourLevel` - Patterns within ±2 of user skill level
- `readyToChallenge` - Slightly harder patterns (+1 or +2 difficulty)
- `newCategories` - Unexplored category patterns
- `similarToMastered` - Patterns with similar tags/subcategories

**Additional Features**:
- Quick filters: new, practiced, struggling, mastered
- Subcategory and tag filtering
- Search functionality
```

---

### Sprint 4-6 (Feb 17 - Mar 7): Practice Routines ✅ COMPLETE
**Goal**: Answer "What should I practice today?"
**Status**: DONE - 8 routines in `lib/data/routines.ts`, full UI with `RoutineSelector.tsx` + `RoutinePlayer.tsx`

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
- [x] Fix CommandPalette infinite loop ✅ (DONE)
- [x] Implement Stripe webhook database updates ✅ (DONE - full DB integration)
- [x] Integrate PRACTICE20 discount code ✅ (DONE - exit intent + checkout)
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

## 🥁 Routine System Enhancement Roadmap
*Added: January 2025*

### ✅ Phase 1: Immediate Improvements (COMPLETE)
**Status**: DONE - January 2025

- [x] **Custom Starting BPM** - Users can adjust all routine BPMs by ±50 BPM
  - Tempo adjustment controls on routine start screen
  - Shows "Easier" or "Harder" label
  - Applied to start BPM, target BPM, and tempo progression
  
- [x] **Improved Routine Content**
  - Fixed "40-Minute Rudiment Deep Dive" → "40-Minute Rudiment Session"
  - Added PAS rudiment numbers (#1, #3, #17, etc.)
  - Better tips and instructions throughout
  
- [x] **New Routines Added**
  - 15-Minute Flam Focus (intermediate)
  - 20-Minute Groove & Feel (musicality focus)
  - 15-Minute Daily Maintenance (quick chops maintenance)

---

### 📝 Phase 2: User-Created Routines
**Priority**: HIGH | **Estimated**: 2-3 weeks

**Goal**: Let users create and save their own practice routines

**Features**:
- [ ] Routine Builder UI (extend/repurpose "Combine Presets" area)
- [ ] Drag-and-drop exercise ordering
- [ ] Set duration, start BPM, target BPM per exercise
- [ ] Add custom tips and focus areas
- [ ] Save/edit/delete custom routines
- [ ] Import/export as JSON for backup

**Technical Approach**:
```typescript
interface UserRoutine extends PracticeRoutine {
  userId: string;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  forkCount?: number;
  originalRoutineId?: string; // If forked from another
}
```

**Files to create/modify**:
- `/components/Routines/RoutineBuilder.tsx`
- `/components/Routines/ExerciseEditor.tsx`
- `/store/slices/userRoutinesSlice.ts`
- `/lib/data/userRoutines.ts` (localStorage initially)

---

### 🌐 Phase 3: Social & Sharing Features  
**Priority**: MEDIUM | **Estimated**: 3-4 weeks

**Goal**: Enable community sharing and discovery of routines

**Features**:
- [ ] Share routines via unique link
- [ ] Community routine library (browse public routines)
- [ ] Fork and customize shared routines
- [ ] Rating system (1-5 stars)
- [ ] Review/comment system
- [ ] Filter by: difficulty, duration, category, rating, popularity
- [ ] Featured/Staff Picks section
- [ ] Follow other users

**Database Schema** (Supabase):
```sql
-- User routines table
CREATE TABLE user_routines (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT,
  total_duration INT,
  exercises JSONB,
  is_public BOOLEAN DEFAULT false,
  fork_count INT DEFAULT 0,
  original_routine_id UUID REFERENCES user_routines,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine ratings
CREATE TABLE routine_ratings (
  id UUID PRIMARY KEY,
  routine_id UUID REFERENCES user_routines,
  user_id UUID REFERENCES auth.users,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(routine_id, user_id)
);

-- Routine plays (for popularity tracking)
CREATE TABLE routine_plays (
  id UUID PRIMARY KEY,
  routine_id UUID REFERENCES user_routines,
  user_id UUID REFERENCES auth.users,
  completed BOOLEAN DEFAULT false,
  played_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 🎮 Phase 4: Group Routines (Multiplayer)
**Priority**: HIGH (Unique Feature!) | **Estimated**: 6-8 weeks

**Goal**: Real-time group practice sessions with live leaderboard

**Concept**: 
Like a fitness class but for drumming! Users join a lobby, practice the same routine together in real-time, and compete on a live leaderboard.

**Features**:
- [ ] Create/host routine lobby
- [ ] Join existing lobbies (public or invite code)
- [ ] Lobby browser with filters (difficulty, starting time, routine type)
- [ ] Countdown to synchronized start
- [ ] Real-time score tracking during practice
- [ ] Live leaderboard showing all participants
- [ ] Post-routine results and rankings
- [ ] Chat/reactions during practice
- [ ] Scheduled routines (e.g., "Daily 8am warmup")
- [ ] Recurring group sessions

**Technical Architecture**:
```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Client A      │◄──────────────────►│   Server        │
│   (Drummer 1)   │                    │   (Node.js)     │
└─────────────────┘                    │                 │
                                       │  - Lobby mgmt   │
┌─────────────────┐     WebSocket      │  - Score sync   │
│   Client B      │◄──────────────────►│  - Leaderboard  │
│   (Drummer 2)   │                    │  - Timing sync  │
└─────────────────┘                    │                 │
                                       └────────┬────────┘
┌─────────────────┐     WebSocket              │
│   Client C      │◄──────────────────►        │
│   (Drummer 3)   │                            │
└─────────────────┘                            ▼
                                       ┌─────────────────┐
                                       │   Database      │
                                       │   (Supabase)    │
                                       │                 │
                                       │  - Lobbies      │
                                       │  - Sessions     │
                                       │  - Results      │
                                       └─────────────────┘
```

**Database Schema**:
```sql
-- Group lobbies
CREATE TABLE group_lobbies (
  id UUID PRIMARY KEY,
  host_user_id UUID REFERENCES auth.users,
  routine_id UUID REFERENCES user_routines,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('waiting', 'countdown', 'in_progress', 'completed')),
  max_participants INT DEFAULT 20,
  is_public BOOLEAN DEFAULT true,
  invite_code TEXT UNIQUE,
  scheduled_start TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lobby participants
CREATE TABLE lobby_participants (
  id UUID PRIMARY KEY,
  lobby_id UUID REFERENCES group_lobbies,
  user_id UUID REFERENCES auth.users,
  display_name TEXT,
  current_score INT DEFAULT 0,
  current_accuracy DECIMAL(5,2),
  current_exercise_index INT DEFAULT 0,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lobby_id, user_id)
);

-- Session results (final scores)
CREATE TABLE group_session_results (
  id UUID PRIMARY KEY,
  lobby_id UUID REFERENCES group_lobbies,
  user_id UUID REFERENCES auth.users,
  final_score INT,
  final_accuracy DECIMAL(5,2),
  exercises_completed INT,
  total_exercises INT,
  rank INT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Real-time Events** (WebSocket):
```typescript
// Server → Client
type ServerEvent = 
  | { type: 'PARTICIPANT_JOINED'; user: { id: string; name: string } }
  | { type: 'PARTICIPANT_LEFT'; userId: string }
  | { type: 'PARTICIPANT_READY'; userId: string }
  | { type: 'COUNTDOWN_START'; startsAt: number }
  | { type: 'SESSION_START' }
  | { type: 'SCORE_UPDATE'; scores: { [userId: string]: { score: number; accuracy: number } } }
  | { type: 'EXERCISE_CHANGE'; exerciseIndex: number }
  | { type: 'SESSION_COMPLETE'; results: SessionResult[] }
  | { type: 'CHAT_MESSAGE'; userId: string; message: string };

// Client → Server
type ClientEvent = 
  | { type: 'JOIN_LOBBY'; lobbyId: string }
  | { type: 'LEAVE_LOBBY' }
  | { type: 'SET_READY'; ready: boolean }
  | { type: 'REPORT_SCORE'; score: number; accuracy: number }
  | { type: 'SEND_CHAT'; message: string }
  | { type: 'SEND_REACTION'; emoji: string };
```

**UI Components**:
- `/components/GroupPlay/LobbyBrowser.tsx` - Browse/search public lobbies
- `/components/GroupPlay/CreateLobby.tsx` - Create new lobby
- `/components/GroupPlay/LobbyRoom.tsx` - Waiting room before start
- `/components/GroupPlay/LiveLeaderboard.tsx` - Real-time scores during play
- `/components/GroupPlay/SessionResults.tsx` - Post-routine rankings
- `/components/GroupPlay/GroupChat.tsx` - In-lobby chat

**Premium Feature Tiers**:
- Free: Join public lobbies
- Pro: Create private lobbies, schedule sessions
- Premium: Unlimited participants, recurring sessions

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