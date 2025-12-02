# Testing Playback & Visual Metronome

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000`

## Testing Checklist

### 1. Audio Loading ✅
**What to check:**
- Open browser DevTools (F12) → Console tab
- Look for: `"Audio buffers loaded successfully"`
- Should appear shortly after page loads
- **If you see errors:** Check that audio files exist in `public/sounds/`

**Expected files:**
- `public/sounds/snare.wav`
- `public/sounds/kick.wav`
- `public/sounds/tom.wav`
- `public/sounds/floor.wav`

### 2. Pattern Creation ✅
**Steps:**
1. Click the **"Add Pattern"** button (or similar) in the Toolbar
2. A new pattern should appear in the Pattern List
3. The Stave should show musical notation

**What to verify:**
- Pattern appears in the left panel
- Musical notation appears in the right panel
- Pattern fields are editable (time signature, subdivision, phrase, etc.)

### 3. Playback Controls ✅
**Steps:**
1. Make sure you have at least one pattern
2. Click the **Play button** (▶️) in the Toolbar
3. Button should change to **Stop button** (⏹️)

**What to verify:**
- Play button appears when not playing
- Stop button appears when playing
- Button state changes correctly

### 4. Metronome Click Sounds ✅
**Steps:**
1. Click **Play**
2. Listen for click sounds (metronome)

**What to verify:**
- You should hear metronome clicks
- Clicks should match the BPM setting (default 120 BPM)
- Clicks should continue while playing

**Troubleshooting:**
- **No sound?** Check browser console for errors
- **Sound not synced?** Try adjusting BPM up/down
- **Browser requires user interaction:** Click somewhere on the page first, then click Play

### 5. Drum Sound Playback ✅
**Steps:**
1. Enable "Play Drum Sounds" toggle (if available in Toolbar)
2. Make sure pattern has drum sounds (S, K, T, F in drum pattern)
3. Click **Play**

**What to verify:**
- You should hear drum sounds (snare, kick, tom, floor)
- Sounds should play in time with the metronome
- Sounds should match the pattern notation

**Note:** Drum sounds might be disabled by default. Look for a toggle or checkbox.

### 6. Visual Metronome Feedback ✅
**Steps:**
1. Make sure you have patterns with notes
2. Enable "Visual Metronome" (if there's a toggle, or it might be always on)
3. Click **Play**
4. Watch the Stave (musical notation)

**What to verify:**
- Notes should **highlight in orange** as they play
- Active note should have a **glow effect**
- Highlight should move through notes as playback progresses
- Highlight should stop when playback stops

**Visual indicators:**
- Active note: Orange glow/highlight
- Highlight should be on the current note being played
- Smooth transition from note to note

### 7. Count-In ✅
**Steps:**
1. Enable count-in (if there's a toggle)
2. Click **Play**

**What to verify:**
- You should hear **4 clicks** before playback starts
- First click might be accented (louder)
- Playback starts after count-in completes

### 8. BPM Adjustment ✅
**Steps:**
1. Change BPM using +/− buttons or input field
2. Click **Play**

**What to verify:**
- Playback speed changes with BPM
- Metronome clicks match new BPM
- Visual highlighting moves at correct speed

### 9. Loop Handling ✅
**Steps:**
1. Set loop count to 2 or more
2. Click **Play**

**What to verify:**
- Pattern plays the specified number of times
- Visual highlighting restarts for each loop
- Playback stops after all loops complete

### 10. Stop Functionality ✅
**Steps:**
1. Start playback
2. Click **Stop**

**What to verify:**
- Playback stops immediately
- All sounds stop
- Visual highlighting stops/disappears
- Button changes back to Play

## Browser Console Checks

**Open DevTools (F12) and check for:**
- ✅ `"Audio buffers loaded successfully"`
- ✅ No red errors
- ⚠️ Warnings are usually OK (but note them)

**Common errors to watch for:**
- ❌ `"Failed to load audio buffers"` → Audio files missing or corrupted
- ❌ `"AudioContext not available"` → Browser compatibility issue
- ❌ `"VexFlow not available"` → VexFlow library loading issue

## Visual Verification

### What You Should See:

**When Not Playing:**
- Play button (▶️) visible
- No highlighting on stave
- Normal notation display

**When Playing:**
- Stop button (⏹️) visible
- Orange glow on active note
- Highlight moving through notes
- Smooth transitions

**When Playback Completes:**
- Play button returns
- Highlight disappears
- Ready for next playback

## Testing Different Patterns

Try these test patterns:

### Simple Pattern:
- Time Signature: `4/4`
- Subdivision: `16`
- Phrase: `4 4 4 4`
- Drum Pattern: `S S S S`
- Sticking: `R L R L`

**Expected:**
- 16th notes across 4 beats
- Snare hits every 16th note
- Metronome clicks on beats
- Visual highlighting on each note

### Complex Pattern:
- Time Signature: `4/4`
- Subdivision: `16`
- Phrase: `4 4 4 4`
- Drum Pattern: `S K S K S S K S`
- Sticking: `R L R L R L R L`

**Expected:**
- Mix of snare and kick
- Visual highlighting on all notes (including kicks)
- Sounds match pattern

## Troubleshooting

### No Sound At All
1. Check browser console for errors
2. Verify audio files exist in `public/sounds/`
3. Try clicking elsewhere on page first (user interaction required)
4. Check browser volume settings

### Visual Highlighting Not Working
1. Check if `showVisualMetronome` is enabled in UI settings
2. Look for CSS errors in console
3. Verify notes are rendering in stave
4. Check browser console for JavaScript errors

### Playback Not Starting
1. Check console for errors
2. Verify at least one pattern exists
3. Check that audio buffers loaded successfully
4. Try refreshing the page

### Timing Issues
1. Check BPM setting (try different values)
2. Verify pattern subdivision matches BPM
3. Check console for timing errors
4. Try slowing down BPM to verify timing

## Performance Checks

**Monitor:**
- Browser CPU usage (should be reasonable)
- Memory usage (shouldn't grow continuously)
- Smooth visual updates (no stuttering)

**If performance is poor:**
- Check console for warnings
- Try simpler patterns
- Lower BPM to reduce update frequency

## Next Steps After Testing

If everything works:
- ✅ Playback system is functional!
- ✅ Visual metronome is working!
- Ready for next features: Grid lines, measure numbers, scroll animation

If issues are found:
- Note the specific problem
- Check console errors
- Verify audio files exist
- Check browser compatibility (Chrome/Firefox recommended)



