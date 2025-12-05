/**
 * Practice Voicing Component - Displays drum icons that highlight in time with the pattern
 * Enhanced UI with custom SVG icons, beat markers, and progress bar
 */

'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Pattern } from '@/types/pattern';
import { PolyrhythmPattern } from '@/types/polyrhythm';
import { parseTokens, parseNumberList, getNotesPerBarForPattern } from '@/lib/utils/patternUtils';
import { buildAccentIndices } from '@/lib/utils/patternUtils';
import { polyrhythmToCombinedPattern } from '@/lib/utils/polyrhythmUtils';
import { calculatePolyrhythmPositions } from '@/lib/utils/polyrhythmPositionCalculator';
import { Circle, Square, Disc } from 'lucide-react';

interface VoicingNote {
  index: number;
  voicing: string[]; // Array of drum tokens (can be multiple for simultaneous notes like S+K)
  isAccent: boolean;
  isRest: boolean;
  beatIndex: number; // Which beat this note falls on
  isFirstInBeat: boolean; // Is this the first note of a beat?
}

// Custom drum icon component
function DrumIcon({ type, size = 20, color = 'currentColor' }: { type: string; size?: number; color?: string }) {
  switch (type) {
    case 'S': // Snare - drum with lines
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="12" rx="10" ry="6" />
          <path d="M2 12v4c0 3.3 4.5 6 10 6s10-2.7 10-6v-4" />
          <line x1="4" y1="14" x2="4" y2="18" />
          <line x1="20" y1="14" x2="20" y2="18" />
        </svg>
      );
    case 'K': // Kick - bass drum
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    case 'H': // Hi-Hat closed
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="10" rx="9" ry="3" />
          <ellipse cx="12" cy="14" rx="9" ry="3" />
          <line x1="12" y1="14" x2="12" y2="22" />
        </svg>
      );
    case 'O': // Hi-Hat open
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="8" rx="9" ry="3" />
          <ellipse cx="12" cy="16" rx="9" ry="3" />
          <line x1="12" y1="16" x2="12" y2="22" />
        </svg>
      );
    case 'C': // Crash
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="8" rx="10" ry="4" />
          <line x1="12" y1="12" x2="12" y2="22" />
          <path d="M8 6l2-4M16 6l-2-4" />
        </svg>
      );
    case 'Y': // Ride
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="10" rx="10" ry="5" />
          <circle cx="12" cy="10" r="2" fill={color} />
          <line x1="12" y1="15" x2="12" y2="22" />
        </svg>
      );
    case 'I': // High Tom
    case 'M': // Mid Tom
    case 'T': // Tom (legacy)
    case 'F': // Floor Tom
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="8" rx="8" ry="4" />
          <path d="M4 8v8c0 2.2 3.6 4 8 4s8-1.8 8-4V8" />
        </svg>
      );
    default:
      return <Circle size={size} color={color} />;
  }
}

// Map drum codes to labels and colors
const drumInfoMap: Record<string, { label: string; color: string; shortLabel: string }> = {
  S: { label: 'Snare', shortLabel: 'SN', color: '#3b82f6' },
  K: { label: 'Kick', shortLabel: 'KK', color: '#ef4444' },
  H: { label: 'Hi-Hat', shortLabel: 'HH', color: '#10b981' },
  O: { label: 'HH Open', shortLabel: 'HO', color: '#22c55e' },
  F: { label: 'Floor', shortLabel: 'FT', color: '#f59e0b' },
  I: { label: 'High Tom', shortLabel: 'HT', color: '#8b5cf6' },
  M: { label: 'Mid Tom', shortLabel: 'MT', color: '#ec4899' },
  T: { label: 'Tom', shortLabel: 'TM', color: '#8b5cf6' },
  C: { label: 'Crash', shortLabel: 'CR', color: '#06b6d4' },
  Y: { label: 'Ride', shortLabel: 'RD', color: '#14b8a6' },
};

export function PracticeVoicing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const patterns = useStore((state) => state.patterns);
  const polyrhythmPatterns = useStore((state) => state.polyrhythmPatterns);
  const playbackPosition = useStore((state) => state.playbackPosition);
  const isPlaying = useStore((state) => state.isPlaying);
  const highlightColors = useStore((state) => state.highlightColors);
  const darkMode = useStore((state) => state.darkMode);
  const practiceViewNotesAhead = useStore((state) => state.practiceViewNotesAhead);
  const practiceViewVisualFeedback = useStore((state) => state.practiceViewVisualFeedback);
  const practiceViewShowTimingErrors = useStore((state) => state.practiceViewShowTimingErrors);
  const midiPractice = useStore((state) => state.midiPractice);
  const microphonePractice = useStore((state) => state.microphonePractice);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  // Calculate subdivision from patterns (use minimum if multiple patterns with different subdivisions)
  const subdivision = useMemo(() => {
    if (patterns.length === 0) return 16;
    
    const subdivisions: number[] = [];
    patterns.forEach((pattern) => {
      if (pattern._advancedMode && pattern._perBeatSubdivisions && pattern._perBeatSubdivisions.length > 0) {
        // For advanced mode, use the minimum subdivision to ensure we don't break mid-beat
        subdivisions.push(Math.min(...pattern._perBeatSubdivisions));
      } else {
        subdivisions.push(pattern.subdivision || 16);
      }
    });
    
    // Use the minimum subdivision to ensure we don't break mid-subdivision
    return Math.min(...subdivisions);
  }, [patterns]);

  // Calculate notes per line based on container width and subdivision
  const notesPerLine = useMemo(() => {
    // For triplets (12) or sextuplets (24), use 6 per line; otherwise 8
    const maxNotesPerLine = (subdivision === 12 || subdivision === 24) ? 6 : 8;
    
    if (!containerWidth || subdivision === 0) {
      // If we can't calculate, still enforce the max
      return maxNotesPerLine;
    }
    
    // Estimate note width: minWidth (80px) + padding (0.75rem * 2 = 1.5rem = 24px) + gap (0.5rem = 8px)
    const estimatedNoteWidth = 80 + 24 + 8; // ~112px per note
    const availableWidth = containerWidth - 64; // Account for padding (2rem * 2 = 64px)
    const notesThatFit = Math.floor(availableWidth / estimatedNoteWidth);
    
    // Round down to nearest multiple of subdivision
    const rounded = Math.floor(notesThatFit / subdivision) * subdivision;
    const calculated = Math.max(subdivision, rounded); // At least one subdivision worth
    
    // Cap at maxNotesPerLine (6 for triplets/sextuplets, 8 otherwise)
    return Math.min(maxNotesPerLine, calculated);
  }, [containerWidth, subdivision]);

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  // Build all voicing notes from patterns
  const voicingNotes = useMemo(() => {
    const allNotes: VoicingNote[] = [];
    let globalIndex = 0;
    let globalBeatIndex = 0;

    patterns.forEach((pattern) => {
      const repeat = pattern.repeat || 1;
      const timeSig = pattern.timeSignature || '4/4';
      const [beatsPerBar] = timeSig.split('/').map(Number);
      
      for (let r = 0; r < repeat; r++) {
        let notesInThisPattern: VoicingNote[] = [];
        let patternBeatIndex = 0;

        if (pattern._advancedMode && pattern._perBeatVoicing && pattern._perBeatSubdivisions) {
          // Advanced mode: use per-beat voicing and subdivisions
          const [, beatValue] = timeSig.split('/').map(Number);
          const denominator = beatValue || 4;

          let noteIndex = 0;
          for (let beat = 0; beat < beatsPerBar; beat++) {
            const voicingPattern = pattern._perBeatVoicing[beat] || '';
            const voicingTokens = parseTokens(voicingPattern);
            const beatSubdivision = pattern._perBeatSubdivisions[beat] || 16;
            const notesPerBeat = beatSubdivision / denominator;

            for (let i = 0; i < notesPerBeat; i++) {
              const tokenIndex = i % voicingTokens.length;
              const token = voicingTokens[tokenIndex] || '-';
              const isRest = token === '-' || token === '';
              
              // Parse voicing token (can be single like "S" or compound like "S+K")
              const voicingArray: string[] = [];
              if (!isRest) {
                // Split by + to handle simultaneous notes
                const parts = token.split('+');
                for (const part of parts) {
                  const trimmed = part.trim().toUpperCase();
                  // Normalize two-letter codes
                  if (trimmed === 'HT') voicingArray.push('I');
                  else if (trimmed === 'MT') voicingArray.push('M');
                  else if (trimmed) voicingArray.push(trimmed);
                }
              }
              
              // Check if this note is accented
              const accentIndices = pattern._presetAccents || [];
              const isAccent = accentIndices.includes(noteIndex);

              notesInThisPattern.push({
                index: globalIndex + noteIndex,
                voicing: voicingArray,
                isAccent,
                isRest,
                beatIndex: globalBeatIndex + beat,
                isFirstInBeat: i === 0,
              });
              noteIndex++;
            }
          }
          patternBeatIndex = beatsPerBar;
        } else {
          // Regular mode: use single voicing pattern
          const voicingPattern = pattern.drumPattern || '';
          const voicingTokens = parseTokens(voicingPattern);
          const notesPerBar = getNotesPerBarForPattern(pattern);
          const notesPerBeat = notesPerBar / beatsPerBar;
          
          // Build accent indices from phrase
          const phraseValues = parseNumberList(pattern.phrase || '');
          const accentIndices = pattern._presetAccents || buildAccentIndices(phraseValues);

          for (let i = 0; i < notesPerBar; i++) {
            const tokenIndex = i % voicingTokens.length;
            const token = voicingTokens[tokenIndex] || '-';
            const isRest = token === '-' || token === '';
            
            // Parse voicing token (can be single like "S" or compound like "S+K")
            const voicingArray: string[] = [];
            if (!isRest) {
              // Split by + to handle simultaneous notes
              const parts = token.split('+');
              for (const part of parts) {
                const trimmed = part.trim().toUpperCase();
                // Normalize two-letter codes
                if (trimmed === 'HT') voicingArray.push('I');
                else if (trimmed === 'MT') voicingArray.push('M');
                else if (trimmed) voicingArray.push(trimmed);
              }
            }
            
            const isAccent = accentIndices.includes(i);
            const beatForNote = Math.floor(i / notesPerBeat);

            notesInThisPattern.push({
              index: globalIndex + i,
              voicing: voicingArray,
              isAccent,
              isRest,
              beatIndex: globalBeatIndex + beatForNote,
              isFirstInBeat: i % notesPerBeat === 0,
            });
          }
          patternBeatIndex = beatsPerBar;
        }

        allNotes.push(...notesInThisPattern);
        globalIndex += notesInThisPattern.length;
        globalBeatIndex += patternBeatIndex;
      }
    });

    // Process polyrhythm patterns
    // Voice to drum token mapping
    const voiceToDrum: Record<string, string> = {
      snare: 'S',
      kick: 'K',
      'hi-hat': 'H',
      hihat: 'H',
      tom: 'I',
      floor: 'F',
    };
    
    polyrhythmPatterns.forEach((polyrhythmPattern: PolyrhythmPattern) => {
      const repeat = polyrhythmPattern.repeat || 1;
      const { numerator, denominator } = polyrhythmPattern.ratio;
      const positions = calculatePolyrhythmPositions(numerator, denominator, 4); // Assume 4/4
      
      // Get drum sounds for each hand
      const rightDrum = voiceToDrum[polyrhythmPattern.rightRhythm.voice] || 'S';
      const leftDrum = voiceToDrum[polyrhythmPattern.leftRhythm.voice] || 'K';
      
      for (let r = 0; r < repeat; r++) {
        // Combine all events sorted by position
        interface PolyEvent { position: number; voicing: string[]; isAccent: boolean }
        const events: PolyEvent[] = [];
        
        // Add right hand notes
        for (let i = 0; i < numerator; i++) {
          const isAccent = polyrhythmPattern.rightRhythm.accents?.includes(i) || false;
          events.push({
            position: positions.rightPositions[i],
            voicing: [rightDrum],
            isAccent,
          });
        }
        
        // Add left hand notes (merge if aligned)
        for (let j = 0; j < denominator; j++) {
          const alignment = positions.alignments.find(a => a.leftIndex === j);
          const isAccent = polyrhythmPattern.leftRhythm.accents?.includes(j) || false;
          
          if (alignment) {
            // Merge with existing right hand event
            const existingIdx = events.findIndex(e => 
              Math.abs(e.position - positions.leftPositions[j]) < 0.001
            );
            if (existingIdx !== -1) {
              events[existingIdx].voicing.push(leftDrum);
              events[existingIdx].isAccent = events[existingIdx].isAccent || isAccent;
            }
          } else {
            events.push({
              position: positions.leftPositions[j],
              voicing: [leftDrum],
              isAccent,
            });
          }
        }
        
        // Sort by position
        events.sort((a, b) => a.position - b.position);
        
        // Add to allNotes with beat tracking
        events.forEach((event, idx) => {
          const beatForNote = Math.floor(event.position);
          allNotes.push({
            index: globalIndex + idx,
            voicing: event.voicing,
            isAccent: event.isAccent,
            isRest: false,
            beatIndex: globalBeatIndex + beatForNote,
            isFirstInBeat: idx === 0 || (idx > 0 && Math.floor(events[idx - 1].position) !== beatForNote),
          });
        });
        
        globalIndex += events.length;
        globalBeatIndex += 4; // Polyrhythms assume 4 beats
      }
    });

    // Show all notes (no repetition detection)
    return allNotes;
  }, [patterns, polyrhythmPatterns]);

  // Scroll to current position
  useEffect(() => {
    if (!containerRef.current || playbackPosition === null || !isPlaying) return;

    const currentNoteElement = containerRef.current.querySelector(
      `[data-note-index="${playbackPosition}"]`
    ) as HTMLElement;

    if (currentNoteElement) {
      currentNoteElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [playbackPosition, isPlaying]);

  // Group notes by lines that respect subdivision
  const noteGroups = useMemo(() => {
    // For triplets (12) or sextuplets (24), use 6 per line; otherwise 8
    const maxNotesPerLine = (subdivision === 12 || subdivision === 24) ? 6 : 8;
    const effectiveNotesPerLine = notesPerLine && notesPerLine > 0 ? Math.min(maxNotesPerLine, notesPerLine) : maxNotesPerLine;
    
    const groups: VoicingNote[][] = [];
    for (let i = 0; i < voicingNotes.length; i += effectiveNotesPerLine) {
      groups.push(voicingNotes.slice(i, i + effectiveNotesPerLine));
    }
    return groups;
  }, [voicingNotes, notesPerLine]);

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    if (playbackPosition === null || voicingNotes.length === 0) return 0;
    return ((playbackPosition + 1) / voicingNotes.length) * 100;
  }, [playbackPosition, voicingNotes.length]);

  if (voicingNotes.length === 0) {
    return (
      <div
        style={{
          padding: '3rem',
          textAlign: 'center',
          color: darkMode ? '#94a3b8' : '#64748b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ fontSize: '3rem', opacity: 0.3 }}>🥁</div>
        <p style={{ fontSize: '1rem' }}>No patterns to display. Add a pattern to see voicing notation.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
        minHeight: '400px',
        borderRadius: 'var(--dpgen-radius, 14px)',
        position: 'relative',
      }}
    >
      {/* Progress Bar - always present to prevent layout shift */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: darkMode ? '#1e293b' : '#e2e8f0',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '0.5rem',
          zIndex: 10,
          opacity: isPlaying ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: highlightColors.default,
            transition: 'width 0.1s ease-out',
            borderRadius: '2px',
          }}
        />
      </div>

      {/* Current Position Indicator - always present to prevent layout shift */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '20px',
          alignSelf: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '0.5rem',
          opacity: isPlaying ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      >
        <span style={{ 
          fontSize: '0.75rem', 
          color: darkMode ? '#94a3b8' : '#64748b',
          fontWeight: 500,
        }}>
          Note {(playbackPosition ?? 0) + 1} of {voicingNotes.length}
        </span>
      </div>
      {noteGroups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            gap: '0.5rem',
            alignItems: 'center',
            justifyContent: 'stretch',
            width: '100%',
            overflow: 'hidden',
            padding: '0.75rem 0',
          }}
        >
          {group.map((note, noteIndexInGroup) => {
        // Check if this note is currently being played
        const isActive = playbackPosition === note.index && isPlaying;
        const isHighlighted = isActive;
        const isUpcoming = isPlaying && playbackPosition !== null && 
          note.index > playbackPosition && note.index <= playbackPosition + 3;
        
        // Show beat marker
        const showBeatMarker = note.isFirstInBeat && noteIndexInGroup > 0;
        
        // Get practice mode hit for this note (if any)
        const activePractice = midiPractice.enabled ? midiPractice : microphonePractice.enabled ? microphonePractice : null;
        let practiceHit = null;
        if (activePractice?.expectedNotes && activePractice?.actualHits) {
          // Find the expected note that matches this pattern note index
          const expectedNote = activePractice.expectedNotes.find(exp => exp.index === note.index);
          if (expectedNote) {
            // Find the hit that matches this expected note by comparing expectedTime
            practiceHit = activePractice.actualHits.find(hit => 
              hit.matched && 
              isFinite(hit.timingError) && 
              hit.timingError !== Infinity &&
              Math.abs(hit.expectedTime - expectedNote.time) < 100 // Match within 100ms
            );
          }
        }
        const toleranceWindow = activePractice?.accuracyWindow || 50;
        
        // Calculate timing color if practice mode is active and visual feedback is enabled
        let timingColor: string | null = null;
        let timingText: string | null = null;
        if (practiceHit && practiceViewVisualFeedback) {
          const absTimingError = Math.abs(practiceHit.rawTimingError);
          if (absTimingError <= toleranceWindow) {
            timingColor = '#10b981'; // Green - within tolerance
          } else if (absTimingError <= toleranceWindow * 1.2) {
            timingColor = '#f59e0b'; // Yellow - within 20% outside tolerance
          } else {
            timingColor = '#ef4444'; // Red - more than 20% outside tolerance
          }
        }
        
        if (practiceHit && practiceViewShowTimingErrors) {
          const sign = practiceHit.rawTimingError >= 0 ? '+' : '';
          timingText = `${sign}${Math.round(practiceHit.rawTimingError)}ms`;
        }
        
        // Calculate opacity based on notes ahead setting
        let noteOpacity = 1;
        if (practiceViewNotesAhead > 0 && playbackPosition !== null && isPlaying) {
          const notesAhead = note.index - playbackPosition;
          if (notesAhead < 0) {
            // Notes before current position - fade them out
            noteOpacity = 0.2;
          } else if (notesAhead <= practiceViewNotesAhead) {
            // Notes within the visible range - full opacity
            noteOpacity = 1;
          } else {
            // Notes beyond visible range - fade them
            const fadeStart = practiceViewNotesAhead;
            const fadeRange = Math.max(1, practiceViewNotesAhead * 0.5); // Fade over half the visible range
            const fadeProgress = Math.min(1, (notesAhead - fadeStart) / fadeRange);
            noteOpacity = Math.max(0.1, 1 - fadeProgress * 0.9); // Fade from 1 to 0.1
          }
        } else if (practiceViewNotesAhead > 0 && !isPlaying && playbackPosition === null) {
          // If not playing, show first few notes clearly
          if (note.index > practiceViewNotesAhead) {
            const fadeStart = practiceViewNotesAhead;
            const fadeRange = Math.max(1, practiceViewNotesAhead * 0.5);
            const fadeProgress = Math.min(1, (note.index - fadeStart) / fadeRange);
            noteOpacity = Math.max(0.1, 1 - fadeProgress * 0.9);
          }
        }

        // Get drum info for styling
        const primaryDrumCode = note.voicing[0] || 'S';
        const primaryDrumInfo = drumInfoMap[primaryDrumCode] || {
          label: primaryDrumCode,
          shortLabel: primaryDrumCode,
          color: highlightColors.default,
        };
        let drumColor = primaryDrumInfo.color;
        
        // Override with timing color if practice mode is active
        if (timingColor && practiceViewVisualFeedback) {
          drumColor = timingColor;
        }

        // Rest note - minimal styling
        if (note.isRest) {
          return (
            <React.Fragment key={note.index}>
              {showBeatMarker && (
                <div
                  style={{
                    width: '2px',
                    height: '50px',
                    backgroundColor: darkMode ? '#334155' : '#cbd5e1',
                    borderRadius: '1px',
                    margin: '0 0.25rem',
                  }}
                />
              )}
              <div
                data-note-index={note.index}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: '1 1 0',
                  minWidth: '60px',
                  maxWidth: '120px',
                  height: '80px',
                  borderRadius: '14px',
                  backgroundColor: darkMode ? '#1e293b' : '#f1f5f9',
                  opacity: 0.4 * noteOpacity,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ 
                  fontSize: '1.5rem', 
                  color: darkMode ? '#475569' : '#94a3b8',
                  fontWeight: 300,
                }}>·</span>
              </div>
            </React.Fragment>
          );
        }

        // Multiple drums stacked
        const hasMultipleDrums = note.voicing.length > 1;

        return (
          <React.Fragment key={note.index}>
            {showBeatMarker && (
              <div
                style={{
                  width: '2px',
                  height: '50px',
                  backgroundColor: darkMode ? '#334155' : '#cbd5e1',
                  borderRadius: '1px',
                  margin: '0 0.25rem',
                }}
              />
            )}
            <div
              data-note-index={note.index}
              style={{
                position: 'relative',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '1 1 0',
                minWidth: '60px',
                maxWidth: '120px',
                height: hasMultipleDrums ? '90px' : '80px',
                padding: '0.5rem',
                borderRadius: '14px',
                backgroundColor: isHighlighted
                  ? drumColor
                  : isUpcoming
                  ? (darkMode ? '#1e293b' : '#ffffff')
                  : (darkMode ? '#1e293b' : '#ffffff'),
                transition: 'all 0.15s ease',
                transform: isHighlighted ? 'scale(1.08)' : isUpcoming ? 'scale(1.03)' : 'scale(1)',
                boxShadow: isHighlighted
                  ? `0 4px 20px ${drumColor}50, 0 0 0 3px ${drumColor}30`
                  : isUpcoming
                  ? `0 2px 8px rgba(0,0,0,0.1)`
                  : '0 1px 3px rgba(0,0,0,0.05)',
                border: note.isAccent
                  ? `3px solid ${drumColor}`
                  : isHighlighted
                  ? 'none'
                  : isUpcoming
                  ? `2px solid ${drumColor}40`
                  : `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                opacity: noteOpacity,
                cursor: 'default',
              }}
            >
              {/* Pulse animation ring for active note */}
              {isHighlighted && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '16px',
                    border: `2px solid ${drumColor}`,
                    animation: 'pulse-ring 0.6s ease-out infinite',
                    opacity: 0.6,
                  }}
                />
              )}
              
              {/* Drum icons */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: hasMultipleDrums ? 'row' : 'column',
                  gap: hasMultipleDrums ? '0.25rem' : '0.125rem',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {note.voicing.slice(0, 2).map((drumCode, idx) => {
                  const drumInfo = drumInfoMap[drumCode] || {
                    label: drumCode,
                    shortLabel: drumCode,
                    color: highlightColors.default,
                  };
                  const iconColor = isHighlighted ? '#ffffff' : drumInfo.color;

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <DrumIcon 
                        type={drumCode} 
                        size={hasMultipleDrums ? 24 : 32} 
                        color={iconColor}
                      />
                    </div>
                  );
                })}
                {note.voicing.length > 2 && (
                  <span style={{
                    fontSize: '0.6rem',
                    color: isHighlighted ? 'rgba(255,255,255,0.8)' : (darkMode ? '#64748b' : '#94a3b8'),
                  }}>
                    +{note.voicing.length - 2}
                  </span>
                )}
              </div>
              
              {/* Drum label(s) */}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: note.isAccent ? 700 : 600,
                  color: isHighlighted ? 'rgba(255,255,255,0.9)' : (darkMode ? '#94a3b8' : '#64748b'),
                  textAlign: 'center',
                  marginTop: '4px',
                  letterSpacing: '0.02em',
                }}
              >
                {hasMultipleDrums 
                  ? note.voicing.slice(0, 2).map(d => drumInfoMap[d]?.shortLabel || d).join('+')
                  : drumInfoMap[primaryDrumCode]?.shortLabel || primaryDrumCode
                }
              </span>
              
              {timingText && (
                <span style={{ 
                  fontSize: '0.5rem', 
                  marginTop: '1px',
                  color: isHighlighted ? 'rgba(255,255,255,0.9)' : timingColor || (darkMode ? '#94a3b8' : '#64748b'),
                  fontWeight: 600,
                }}>
                  {timingText}
                </span>
              )}
            </div>
          </React.Fragment>
        );
          })}
        </div>
      ))}

      {/* Keyframes for animations */}
      <style jsx global>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
