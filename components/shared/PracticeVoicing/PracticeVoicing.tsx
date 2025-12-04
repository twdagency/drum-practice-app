/**
 * Practice Voicing Component - Displays drum icons that highlight in time with the pattern
 */

'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Pattern } from '@/types/pattern';
import { parseTokens, parseNumberList, getNotesPerBarForPattern } from '@/lib/utils/patternUtils';
import { buildAccentIndices } from '@/lib/utils/patternUtils';

interface VoicingNote {
  index: number;
  voicing: string[]; // Array of drum tokens (can be multiple for simultaneous notes like S+K)
  isAccent: boolean;
  isRest: boolean;
}

// Map drum codes to icon classes and labels
const drumIconMap: Record<string, { icon: string; label: string; color: string }> = {
  S: { icon: 'fas fa-drum', label: 'Snare', color: '#3b82f6' }, // Blue
  K: { icon: 'fas fa-square', label: 'Kick', color: '#ef4444' }, // Red - using square for kick
  H: { icon: 'fas fa-circle', label: 'Hi-Hat', color: '#10b981' }, // Green
  O: { icon: 'fas fa-circle', label: 'Hi-Hat Open', color: '#10b981' }, // Green
  F: { icon: 'fas fa-drum', label: 'Floor Tom', color: '#f59e0b' }, // Amber - using drum icon
  I: { icon: 'fas fa-drum', label: 'High Tom', color: '#8b5cf6' }, // Purple - using drum icon
  M: { icon: 'fas fa-drum', label: 'Mid Tom', color: '#ec4899' }, // Pink - using drum icon
  T: { icon: 'fas fa-drum', label: 'Tom', color: '#8b5cf6' }, // Purple (legacy) - using drum icon
  C: { icon: 'fas fa-circle', label: 'Crash', color: '#06b6d4' }, // Cyan
  Y: { icon: 'fas fa-circle', label: 'Ride', color: '#14b8a6' }, // Teal
};

export function PracticeVoicing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const patterns = useStore((state) => state.patterns);
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

    patterns.forEach((pattern) => {
      const repeat = pattern.repeat || 1;
      
      for (let r = 0; r < repeat; r++) {
        let notesInThisPattern: VoicingNote[] = [];

        if (pattern._advancedMode && pattern._perBeatVoicing && pattern._perBeatSubdivisions) {
          // Advanced mode: use per-beat voicing and subdivisions
          const timeSig = pattern.timeSignature || '4/4';
          const [beatsPerBar, beatValue] = timeSig.split('/').map(Number);
          const denominator = beatValue || 4;

          let noteIndex = 0;
          for (let beat = 0; beat < beatsPerBar; beat++) {
            const voicingPattern = pattern._perBeatVoicing[beat] || '';
            const voicingTokens = parseTokens(voicingPattern);
            const subdivision = pattern._perBeatSubdivisions[beat] || 16;
            const notesPerBeat = subdivision / denominator;

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
              });
              noteIndex++;
            }
          }
        } else {
          // Regular mode: use single voicing pattern
          const voicingPattern = pattern.drumPattern || '';
          const voicingTokens = parseTokens(voicingPattern);
          const notesPerBar = getNotesPerBarForPattern(pattern);
          
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

            notesInThisPattern.push({
              index: globalIndex + i,
              voicing: voicingArray,
              isAccent,
              isRest,
            });
          }
        }

        allNotes.push(...notesInThisPattern);
        globalIndex += notesInThisPattern.length;
      }
    });

    // Show all notes (no repetition detection)
    return allNotes;
  }, [patterns]);

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

  if (voicingNotes.length === 0) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: darkMode ? '#94a3b8' : '#64748b',
        }}
      >
        <p>No patterns to display. Add a pattern to see voicing notation.</p>
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
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
        minHeight: '400px',
        borderRadius: 'var(--dpgen-radius, 14px)',
      }}
    >
      {noteGroups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            gap: '0.5rem',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {group.map((note) => {
        // Check if this note is currently being played
        const isActive = playbackPosition === note.index && isPlaying;
        const isHighlighted = isActive;
        
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

        if (note.isRest) {
          return (
            <div
              key={note.index}
              data-note-index={note.index}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '80px',
                minHeight: '80px',
                padding: '0.75rem',
                borderRadius: 'var(--dpgen-radius, 14px)',
                backgroundColor: 'transparent',
                opacity: 0.3 * noteOpacity,
                border: `2px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
              }}
            >
              <span style={{ fontSize: '0.875rem', opacity: 0.5 }}>—</span>
            </div>
          );
        }

        // If multiple drums, show them stacked/grouped
        const hasMultipleDrums = note.voicing.length > 1;

        // Get the primary drum color (first drum in the voicing)
        const primaryDrumCode = note.voicing[0];
        const primaryDrumInfo = drumIconMap[primaryDrumCode] || {
          icon: 'fas fa-circle',
          label: primaryDrumCode,
          color: highlightColors.default,
        };
        let drumColor = primaryDrumInfo.color;
        
        // Override with timing color if practice mode is active
        if (timingColor && practiceViewVisualFeedback) {
          drumColor = timingColor;
        }

        return (
          <div
            key={note.index}
            data-note-index={note.index}
            style={{
              position: 'relative',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: hasMultipleDrums ? '100px' : '80px',
              minHeight: hasMultipleDrums ? '100px' : '80px',
              padding: '0.75rem',
              borderRadius: 'var(--dpgen-radius, 14px)',
              backgroundColor: isHighlighted
                ? drumColor
                : 'transparent',
              transition: 'all 0.2s ease',
              transform: isHighlighted ? 'scale(1.1)' : 'scale(1)',
              boxShadow: isHighlighted
                ? `0 0 20px ${drumColor}40`
                : 'none',
              border: note.isAccent
                ? `3px solid ${drumColor}`
                : isHighlighted
                ? `2px solid ${drumColor}`
                : `2px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
              opacity: noteOpacity,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: hasMultipleDrums ? 'column' : 'row',
                gap: '0.5rem',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {note.voicing.map((drumCode, idx) => {
                const drumInfo = drumIconMap[drumCode] || {
                  icon: 'fas fa-circle',
                  label: drumCode,
                  color: highlightColors.default,
                };
                // Use the drum's color, or white if highlighted
                const iconColor = isHighlighted ? '#ffffff' : drumInfo.color;
                const textColor = isHighlighted ? '#ffffff' : (darkMode ? '#cbd5e1' : '#1e293b');

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <i
                      className={drumInfo.icon}
                      style={{
                        fontSize: hasMultipleDrums ? '1.25rem' : '1.75rem',
                        color: iconColor,
                        filter: isHighlighted ? 'none' : 'none',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: textColor,
                        fontWeight: note.isAccent ? 'bold' : 'normal',
                        textAlign: 'center',
                      }}
                    >
                      {drumInfo.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {timingText && (
              <span style={{ 
                fontSize: '0.625rem', 
                marginTop: '0.25rem',
                color: timingColor || (darkMode ? '#cbd5e1' : '#64748b'),
                fontWeight: '500',
              }}>
                {timingText}
              </span>
            )}
          </div>
        );
          })}
        </div>
      ))}
    </div>
  );
}
