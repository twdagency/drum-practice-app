/**
 * Stave component using VexFlow for musical notation rendering
 */

'use client';

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Pattern } from '@/types';
import { PolyrhythmPattern } from '@/types/polyrhythm';
import { parseNumberList, parseTokens, parseTimeSignature, formatList, calculateNotesPerBar, getNotesPerBarForPattern, calculateNotesPerBarFromPerBeatSubdivisions, calculateNotePositionsFromPerBeatSubdivisions } from '@/lib/utils/patternUtils';
import { randomSets } from '@/lib/utils/randomSets';
import { polyrhythmToCombinedPattern } from '@/lib/utils/polyrhythmUtils';
import { calculatePolyrhythmPositions } from '@/lib/utils/polyrhythmPositionCalculator';
import { calculatePolyrhythmDurations } from '@/lib/utils/polyrhythmDurationCalculator';

// VexFlow types (we'll need to install @types/vexflow or define our own)
declare global {
  interface Window {
    VF: any;
  }
}

// Key map for drum notation - standard VexFlow positions
// Standard drum notation positions on a 5-line staff (from bottom to top):
// - Kick: f/4 (space F - bottom)
// - Floor Tom: a/4 (space A - above kick)
// - Snare: c/5 (space C - 3rd space from bottom, middle space)
// - Mid Tom (Tom 2): e/5 (line E - 4th line from bottom, 2nd line from top)
// - High Tom (Tom 1): g/5 (space G - top space, above hi-hat line)
// - Hi-hat: g/5/x (space G with X note head - top, same space as high tom but X head distinguishes it)
// 
// Using distinct positions to ensure proper separation:
// - Snare on 3rd space (c/5)
// - Mid Tom on 4th line (e/5) 
// - High Tom on top space (g/5)
// - Hi-hat on top space with X (g/5/x)
// Map user pattern tokens to VexFlow note positions
// Use single-letter internal codes for better VexFlow percussion clef compatibility
// VexFlow percussion clef appears to have issues with two-letter token names
// VexFlow percussion clef note position map
// Note: Two-letter codes (Ht, Mt) are normalized to single letters (I, M) before lookup
// because VexFlow percussion clef has issues with two-letter token names
const keyMap: Record<string, string> = {
  S: 'c/5', // Snare (space C - 3rd space from bottom, middle)
  K: 'f/4', // Kick (space F below middle - standard position)
  F: 'a/4', // Floor Tom (space A below middle - standard position)
  H: 'g/5/x', // Hi-hat (space G with X note head - above top line)
  // Single-letter codes (Ht and Mt normalize to these)
  I: 'e/5', // High Tom (I = inner/high tom) - normalized from "Ht"
  M: 'd/5', // Mid Tom (M = mid tom) - normalized from "Mt"
  // Legacy support for T (mapped to High Tom)
  T: 'e/5', // Tom (maps to High Tom, same as I)
};

export function Stave() {
  const staveRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const noteElementsRef = useRef<Map<number, SVGElement[]>>(new Map());
  const prevIsPlayingRef = useRef<boolean>(false);
  const patterns = useStore((state) => state.patterns);
  const polyrhythmPatterns = useStore((state) => state.polyrhythmPatterns);
  const polyrhythmDisplayMode = useStore((state) => state.polyrhythmDisplayMode);
  const polyrhythmClickMode = useStore((state) => state.polyrhythmClickMode);
  const practicePadMode = useStore((state) => state.practicePadMode);
  const darkMode = useStore((state) => state.darkMode);
  const showGridLines = useStore((state) => state.showGridLines);
  const showMeasureNumbers = useStore((state) => state.showMeasureNumbers);
  const playbackPosition = useStore((state) => state.playbackPosition);
  const showVisualMetronome = useStore((state) => state.showVisualMetronome);
  const scrollAnimationEnabled = useStore((state) => state.scrollAnimationEnabled);
  const midiPractice = useStore((state) => state.midiPractice);
  const microphonePractice = useStore((state) => state.microphonePractice);
  const isPlaying = useStore((state) => state.isPlaying);

  // Memoize pattern data to avoid unnecessary recalculations
  const processedPatterns = useMemo(() => {
    const allBars: Pattern[] = [];
    patterns.forEach((pattern) => {
      const repeat = pattern.repeat || 1;
      for (let r = 0; r < repeat; r++) {
        allBars.push(pattern);
      }
    });
    return allBars;
  }, [patterns]);

  const processedPolyrhythmPatterns = useMemo(() => {
    const allPolyrhythmBars: PolyrhythmPattern[] = [];
    polyrhythmPatterns.forEach((pattern) => {
      const repeat = pattern.repeat || 1;
      for (let r = 0; r < repeat; r++) {
        allPolyrhythmBars.push(pattern);
      }
    });
    return allPolyrhythmBars;
  }, [polyrhythmPatterns]);

  // Memoize render key to detect when full re-render is needed
  const renderKey = useMemo(() => {
    return JSON.stringify({
      patterns: patterns.map(p => ({
        id: p.id,
        timeSignature: p.timeSignature,
        subdivision: p.subdivision,
        phrase: p.phrase,
        drumPattern: p.drumPattern,
        stickingPattern: p.stickingPattern,
        repeat: p.repeat,
        _advancedMode: p._advancedMode,
        _perBeatSubdivisions: p._perBeatSubdivisions,
        _perBeatVoicing: p._perBeatVoicing,
        _perBeatSticking: p._perBeatSticking,
        _presetAccents: p._presetAccents,
      })),
      polyrhythmPatterns: polyrhythmPatterns.map(p => ({
        id: p.id,
        timeSignature: p.timeSignature,
        ratio: p.ratio,
        repeat: p.repeat,
      })),
      polyrhythmDisplayMode,
      darkMode,
      showGridLines,
      showMeasureNumbers,
    });
  }, [patterns, polyrhythmPatterns, polyrhythmDisplayMode, darkMode, showGridLines, showMeasureNumbers]);

  const prevRenderKeyRef = useRef<string>('');

  // Debounce rendering for rapid changes
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!staveRef.current) {
      return;
    }

    // Skip if render key hasn't changed
    if (renderKey === prevRenderKeyRef.current) {
      return;
    }

    // Clear any pending render
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    // Debounce rapid changes (e.g., when typing in pattern fields)
    renderTimeoutRef.current = setTimeout(() => {
      prevRenderKeyRef.current = renderKey;
      
      // Define renderStave function inside the timeout to access processed patterns
      const renderStave = (VF: any) => {
        if (!staveRef.current) {
          return;
        }
        
        // Clear previous rendering
        if (staveRef.current) {
          staveRef.current.innerHTML = '';
        }

        // Use memoized processed patterns
        const allBars = processedPatterns;
        const allPolyrhythmBars = processedPolyrhythmPatterns;

      // If no patterns at all, show empty state
      if (allBars.length === 0 && allPolyrhythmBars.length === 0) {
        if (staveRef.current) {
          staveRef.current.innerHTML = `
            <div style="padding: 3rem 2rem; text-align: center; color: var(--dpgen-muted);">
              <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">
                <i class="fas fa-music"></i>
              </div>
              <p style="font-size: 1rem; font-weight: 500; margin-bottom: 0.5rem;">
                No patterns to display
              </p>
              <p style="font-size: 0.875rem; opacity: 0.8;">
                Add a pattern to see the musical notation
              </p>
            </div>
          `;
        }
        return;
      }

      // Calculate stave dimensions - make responsive to container width
      const containerElement = staveRef.current?.parentElement;
      const rawContainerWidth = containerElement?.clientWidth || window.innerWidth;
      const containerPadding = 64; // Total padding (left + right margins)
      const availableWidth = Math.max(400, rawContainerWidth - containerPadding); // Minimum 400px
      const lineSpacing = 280;
      
      // Helper function to get bars per line based on subdivision
      const getBarsPerLine = (subdivision: number): number => {
        switch (subdivision) {
          case 4: return 4;   // Quarter notes: 4 bars
          case 8: return 3;   // Eighth notes: 3 bars
          case 12: return 3;  // Triplets (eighth note triplets): 3 bars
          case 16: return 2;  // Sixteenth notes: 2 bars
          case 24: return 2;  // Sextuplets (sixteenth note sextuplets): 2 bars
          case 32: return 1;  // Thirty-second notes: 1 bar
          default: return 2;  // Default to 2 bars for unknown subdivisions
        }
      };
      
      // Use available width for stave - this ensures it fits within container
      const staveWidth = availableWidth;

      // Build notes for all bars
      const allBarData: any[] = [];
      let cumulativeNoteIndex = 0;
      let cumulativeStickingIndex = 0; // Track global sticking index across all bars for patterns spanning multiple bars
      const noteIndexMap = new Map<number, any>(); // Map global note index to note objects

      allBars.forEach((pattern, barIndex) => {
        const drumPatternTokens = parseTokens(pattern.drumPattern || '').map((token) => token.toUpperCase());
        const stickingTokens = parseTokens(pattern.stickingPattern || '');
        const timeSignature = parseTimeSignature(pattern.timeSignature || '4/4');
        
        // Calculate expected notes per bar from time signature
        // Time signature determines bar length, subdivision determines how fine the grid is
        // Use helper function that handles both normal and advanced (per-beat) modes
        const expectedTotal = getNotesPerBarForPattern(pattern);
        const totalNotesInBar = expectedTotal;

        // Build notes for this bar
        const startNoteIndex = cumulativeNoteIndex;
        // Use accent indices from pattern (allow empty array for no accents)
        // Always use _presetAccents - phrases are no longer used
        const accentIndices = pattern._presetAccents !== undefined
          ? pattern._presetAccents.filter(acc => acc >= 0 && acc < totalNotesInBar)
          : [];
        
        // Use global sticking index offset to allow patterns to span multiple bars
        // If this pattern's sticking pattern is different from the previous, reset the offset
        // Otherwise, continue accumulating the offset
        const { tickables, beams, ghostNoteIndices, ghostNoteDurations } = buildNotes({
          subdivision: pattern.subdivision,
          notesPerBar: totalNotesInBar,
          drumPatternTokens,
          stickingTokens,
          timeSignature,
          leftFoot: pattern.leftFoot,
          rightFoot: pattern.rightFoot,
          accentIndices,
          darkMode,
          practicePadMode,
          stickingIndexOffset: cumulativeStickingIndex, // Pass global sticking index offset
          perBeatSubdivisions: pattern._advancedMode ? pattern._perBeatSubdivisions : undefined,
        });
        
        // Store note index mapping for highlighting
        tickables.forEach((tickable: any, localIndex: number) => {
          const globalIndex = startNoteIndex + localIndex;
          noteIndexMap.set(globalIndex, tickable);
        });

        allBarData.push({
          barIndex,
          tickables,
          beams,
          pattern,
          timeSignature,
          totalNotesInBar,
          isPolyrhythm: false,
          ghostNoteIndices: ghostNoteIndices || [], // Store ghost note indices for this bar
          ghostNoteDurations: ghostNoteDurations || {}, // Store ghost note durations for this bar
        });

        cumulativeNoteIndex += totalNotesInBar;
        // Update cumulative sticking index across all bars (allows patterns to span multiple bars)
        // Continue accumulating the offset so sticking patterns can span multiple bars
        if (stickingTokens.length > 0) {
          cumulativeStickingIndex += totalNotesInBar;
        }
      });

      // Process polyrhythm patterns - convert to combined patterns
      allPolyrhythmBars.forEach((polyrhythmPattern, barIndex) => {
        const combined = polyrhythmToCombinedPattern(polyrhythmPattern);
        const drumPatternTokens = parseTokens(combined.drumPattern || '').map((token) => token.toUpperCase());
        const stickingTokens = parseTokens(combined.stickingPattern || '');
        const timeSignature = parseTimeSignature(polyrhythmPattern.timeSignature || '4/4');
        const notesPerBar = combined.notesPerBar;
        const cycleLength = polyrhythmPattern.cycleLength;
        
        // Build notes for polyrhythm pattern
        const startNoteIndex = cumulativeNoteIndex;
        // For polyrhythms, we can derive accents from the individual rhythms
        const accentIndices: number[] = [];
        // Combine accents from both rhythms
        if (polyrhythmPattern.rightRhythm.accents) {
          accentIndices.push(...polyrhythmPattern.rightRhythm.accents);
        }
        if (polyrhythmPattern.leftRhythm.accents) {
          accentIndices.push(...polyrhythmPattern.leftRhythm.accents.map(i => i + polyrhythmPattern.cycleLength));
        }
        // Remove duplicates and sort
        const uniqueAccents = [...new Set(accentIndices)].sort((a, b) => a - b).filter(a => a < notesPerBar);
        
        const { tickables, beams, rightVoiceNotes, leftVoiceNotes } = buildPolyrhythmNotes({
          subdivision: combined.subdivision,
          notesPerBar,
          drumPatternTokens,
          stickingTokens,
          timeSignature,
          accentIndices: uniqueAccents,
          darkMode,
          polyrhythmPattern,
          displayMode: polyrhythmDisplayMode,
        });
        
        // Store note index mapping for highlighting
        // For polyrhythms with Voice/Tuplet system, we have two separate voices
        // Map each position in the measure to the right voice note for highlighting
        // The right voice has 'numerator' notes evenly spaced across 'notesPerBar' positions
        if (rightVoiceNotes && rightVoiceNotes.length > 0) {
          for (let pos = 0; pos < notesPerBar; pos++) {
            const globalIndex = startNoteIndex + pos;
            
            // Calculate which right voice note this position corresponds to
            // Right voice has 'numerator' notes over 'notesPerBar' positions
            const rightNoteIndex = Math.floor((pos / notesPerBar) * polyrhythmPattern.ratio.numerator);
            if (rightNoteIndex < rightVoiceNotes.length && rightVoiceNotes[rightNoteIndex]) {
              noteIndexMap.set(globalIndex, rightVoiceNotes[rightNoteIndex]);
            }
          }
        }

        // Create a pseudo-pattern object for compatibility
        const pseudoPattern: Pattern = {
          id: polyrhythmPattern.id,
          timeSignature: polyrhythmPattern.timeSignature,
          subdivision: combined.subdivision,
          phrase: '', // Phrases are no longer used, kept for backward compatibility
          drumPattern: combined.drumPattern,
          stickingPattern: combined.stickingPattern,
          leftFoot: false,
          rightFoot: false,
          repeat: polyrhythmPattern.repeat,
        };

        allBarData.push({
          barIndex: allBars.length + barIndex,
          tickables,
          beams,
          pattern: pseudoPattern,
          timeSignature,
          totalNotesInBar: notesPerBar,
          isPolyrhythm: true,
          polyrhythmPattern,
        });

        cumulativeNoteIndex += notesPerBar;
      });

      // Group bars into lines based on subdivision
      // Bars with the same subdivision go on the same line (up to their max capacity)
      const lines: Array<typeof allBarData> = [];
      let currentLine: typeof allBarData = [];
      let currentSubdivision: number | null = null;
      
      allBarData.forEach((barData) => {
        const barSubdivision = barData.pattern.subdivision;
        const barsPerLineForSubdivision = getBarsPerLine(barSubdivision);
        
        // If this bar has a different subdivision, start a new line
        if (currentSubdivision !== null && currentSubdivision !== barSubdivision) {
          lines.push(currentLine);
          currentLine = [];
          currentSubdivision = null;
        }
        
        // If line is full, start a new line
        if (currentLine.length >= barsPerLineForSubdivision) {
          lines.push(currentLine);
          currentLine = [];
          currentSubdivision = null;
        }
        
        // Add bar to current line
        currentLine.push(barData);
        if (currentSubdivision === null) {
          currentSubdivision = barSubdivision;
        }
      });
      
      // Add the last line if it has bars
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      
      const numLines = lines.length;
      const totalHeight = numLines * lineSpacing;

      // console.log('Creating renderer with', allBarData.length, 'bars,', numLines, 'lines');

      // Create renderer
      let context: any;
      try {
        if (!VF.Renderer) {
          console.error('VF.Renderer is not available');
          return;
        }
        if (!VF.Renderer.Backends) {
          console.error('VF.Renderer.Backends is not available');
          return;
        }
        if (!VF.Renderer.Backends.SVG) {
          console.error('VF.Renderer.Backends.SVG is not available');
          return;
        }
        
        rendererRef.current = new VF.Renderer(staveRef.current, VF.Renderer.Backends.SVG);
        if (!rendererRef.current) {
          console.error('Failed to create renderer');
          return;
        }
        
        // Ensure renderer width matches container width exactly
        // This prevents overflow - the renderer should be the same width as the container
        const rendererWidth = rawContainerWidth;
        rendererRef.current.resize(rendererWidth, totalHeight);
        context = rendererRef.current.getContext();
        if (!context) {
          console.error('Failed to get context from renderer');
          return;
        }
        context.setFont('Inter', 13, '');
      } catch (error) {
        console.error('Error creating renderer:', error);
        return;
      }

      // Set text color for dark mode
      if (darkMode) {
        context.setFillStyle('#ffffff');
        context.setStrokeStyle('#ffffff');
      }

      // Store note elements for highlighting (after rendering)
      noteElementsRef.current.clear();

      // Collect measure numbers info to draw after all lines are rendered
      const allMeasureNumbers: Array<{ stave: any; timeSig: [number, number]; startMeasure: number; bars: number }> = [];

      // Track previous time signature across all bars to detect changes
      let previousBarTimeSig: [number, number] | null = null;

      // Render each line - group bars into lines (4 bars per line)

      for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
        try {
          const lineBars = lines[lineIndex];
          if (!lineBars || lineBars.length === 0) continue;

          // For polyrhythms, we need extra space for two staves
          const hasPolyrhythmsInLine = lineBars.some(bar => bar.isPolyrhythm);
          const extraSpacing = hasPolyrhythmsInLine ? 100 : 0; // Extra space for second stave
          const staveY = lineIndex * (lineSpacing + extraSpacing) + 36;
        // Use full available width for each stave line
        const leftMargin = 16; // Left padding for stave
        const rightMargin = 16; // Right padding
        const actualStaveWidth = staveWidth - leftMargin - rightMargin; // Full width minus margins
        const stave = new VF.Stave(leftMargin, staveY, actualStaveWidth);

        // Get first bar's time signature for this line
        const firstBarInLine = lineBars[0];
        const firstBarTimeSig = firstBarInLine.timeSignature;

        // Set initial time signature on first stave only
        if (lineIndex === 0 && previousBarTimeSig === null) {
          stave.addClef('percussion').addTimeSignature(`${firstBarTimeSig[0]}/${firstBarTimeSig[1]}`);
          previousBarTimeSig = firstBarTimeSig;
        } else {
          // Check if first bar in this line has different time signature than previous
          if (previousBarTimeSig && 
              (firstBarTimeSig[0] !== previousBarTimeSig[0] || firstBarTimeSig[1] !== previousBarTimeSig[1])) {
            // Add time signature change to the stave (shown at the start of the line)
            stave.addClef('percussion').addTimeSignature(`${firstBarTimeSig[0]}/${firstBarTimeSig[1]}`);
            previousBarTimeSig = firstBarTimeSig;
          } else {
            stave.addClef('percussion');
            // Update previousBarTimeSig even if no change (for consistency)
            if (previousBarTimeSig === null) {
              previousBarTimeSig = firstBarTimeSig;
            }
          }
        }

        stave.setContext(context).draw();

        // Check if this line contains polyrhythms
        const hasPolyrhythms = lineBars.some(bar => bar.isPolyrhythm);
        
        if (hasPolyrhythms) {
          // Handle polyrhythms with separate voices
          // Handle all polyrhythm bars in this line
          const polyrhythmBars = lineBars.filter(bar => bar.isPolyrhythm);
          
          for (let polyrhythmBarIndex = 0; polyrhythmBarIndex < polyrhythmBars.length; polyrhythmBarIndex++) {
            const polyrhythmBar = polyrhythmBars[polyrhythmBarIndex];
            if (!polyrhythmBar || !polyrhythmBar.polyrhythmPattern) continue;
            
            const polyrhythmPattern = polyrhythmBar.polyrhythmPattern;
            const polyrhythmTimeSig = parseTimeSignature(polyrhythmPattern.timeSignature || '4/4');
            const { numerator, denominator } = polyrhythmPattern.ratio;
            const [beatsPerBar, beatValue] = polyrhythmTimeSig;
            
            // Check if polyrhythm has different time signature than previous bar
            const timeSigChanged = previousBarTimeSig && 
              (polyrhythmTimeSig[0] !== previousBarTimeSig[0] || polyrhythmTimeSig[1] !== previousBarTimeSig[1]);
            
            // Build notes using proper voice/tuplet system
            const combined = polyrhythmToCombinedPattern(polyrhythmPattern);
            const { rightVoiceNotes, leftVoiceNotes, needsTuplet, tupletConfig, tupletVoice, durations } = buildPolyrhythmNotes({
              subdivision: combined.subdivision,
              notesPerBar: combined.notesPerBar,
              drumPatternTokens: parseTokens(combined.drumPattern || '').map((token) => token.toUpperCase()),
              stickingTokens: parseTokens(combined.stickingPattern || ''),
              timeSignature: polyrhythmTimeSig,
              accentIndices: [],
              darkMode,
              polyrhythmPattern,
              displayMode: polyrhythmDisplayMode,
            });
            
            // Create two voices - one for each rhythm
            // Right voice: numerator notes evenly spaced across the measure
            const rightVoice = new VF.Voice({
              num_beats: beatsPerBar,
              beat_value: beatValue,
              resolution: VF.RESOLUTION,
            });
            rightVoice.setStrict(false);
            
            // Add TimeSigNote for time signature changes in polyrhythms (mid-stave changes)
            if (timeSigChanged && rightVoiceNotes) {
              try {
                // Create a TimeSigNote for the new time signature
                const timeSigNote = new VF.TimeSigNote(`${polyrhythmTimeSig[0]}/${polyrhythmTimeSig[1]}`);
                // Insert the TimeSigNote at the start of the right voice (first voice)
                (rightVoiceNotes as any[]).unshift(timeSigNote);
              } catch (error) {
                console.error('[Stave] Could not create TimeSigNote for polyrhythm time signature change:', error);
                // Fallback: try adding as modifier to first note if TimeSigNote fails
                if (rightVoiceNotes.length > 0) {
                  try {
                    const firstNote = rightVoiceNotes[0];
                    if (firstNote && typeof firstNote.addModifier === 'function') {
                      const timeSig = new VF.TimeSignature(`${polyrhythmTimeSig[0]}/${polyrhythmTimeSig[1]}`);
                      firstNote.addModifier(timeSig, 0);
                    }
                  } catch (modifierError) {
                    console.error('[Stave] Could not add time signature modifier as fallback:', modifierError);
                  }
                }
              }
            }
            
            rightVoice.addTickables(rightVoiceNotes);
            
            // Left voice: denominator notes evenly spaced (with tuplet if needed)
            const leftVoice = new VF.Voice({
              num_beats: beatsPerBar,
              beat_value: beatValue,
              resolution: VF.RESOLUTION,
            });
            leftVoice.setStrict(false);
            
            // Apply tuplet to the appropriate voice if needed
            // The tuplet config tells us which voice needs it and what the configuration is
            if (needsTuplet && tupletConfig && tupletVoice) {
              try {
                const notesToTuplet = tupletVoice === 'left' ? leftVoiceNotes : rightVoiceNotes;
                
                if (notesToTuplet.length > 0) {
                  // Create tuplet with correct configuration
                  // For 4:3: left voice needs tuplet "3 notes in time of 4"
                  // For 5:4: right voice needs tuplet "5 notes in time of 4"
                  const tuplet = new VF.Tuplet(notesToTuplet, {
                    num_notes: tupletConfig.num_notes,
                    notes_occupied: tupletConfig.notes_occupied,
                  });
                  
                  // Apply tuplet to ALL notes in the group (not just the first)
                  // VexFlow requires all notes in a tuplet to have the tuplet set
                  notesToTuplet.forEach((note) => {
                    if (note && typeof note.setTuplet === 'function') {
                    note.setTuplet(tuplet);
                  }
                });
                }
              } catch (e) {
                console.error('Failed to create tuplet:', e);
              }
            }
            
            leftVoice.addTickables(leftVoiceNotes);
            
            // Calculate positions for mapping (needed for attribute setting in all modes)
            const positions = calculatePolyrhythmPositions(numerator, denominator, beatsPerBar);
            
            // Render based on display mode
            try {
              if (polyrhythmDisplayMode === 'two-staves') {
                // Render in separate staves
                const staveSpacing = 100; // Space between staves
                
                // Create separate staves for right and left voices
                const rightStave = new VF.Stave(leftMargin, staveY, actualStaveWidth);
                rightStave.addClef('percussion').addTimeSignature(`${polyrhythmTimeSig[0]}/${polyrhythmTimeSig[1]}`);
                rightStave.setContext(context).draw();
                
                const leftStave = new VF.Stave(leftMargin, staveY + staveSpacing, actualStaveWidth);
                leftStave.addClef('percussion').addTimeSignature(`${polyrhythmTimeSig[0]}/${polyrhythmTimeSig[1]}`);
                leftStave.setContext(context).draw();
                
                // Format and draw right voice on its own stave
              const formatter = new VF.Formatter();
                formatter.joinVoices([rightVoice]);
              const formatWidth = Math.max(200, actualStaveWidth - 120);
                formatter.format([rightVoice], formatWidth, { align_rests: false });
                rightVoice.draw(context, rightStave);
                
                // Format and draw left voice on its own stave
                const leftFormatter = new VF.Formatter();
                leftFormatter.joinVoices([leftVoice]);
                leftFormatter.format([leftVoice], formatWidth, { align_rests: false });
                leftVoice.draw(context, leftStave);
                
                // Add labels to identify which stave is which
                context.setFont('Inter', 12, 'bold');
                context.setFillStyle(darkMode ? '#ffffff' : '#000000');
                context.fillText(`Right Hand (${numerator} notes)`, leftMargin + actualStaveWidth - 150, staveY - 5);
                context.fillText(`Left Hand (${denominator} notes)`, leftMargin + actualStaveWidth - 150, staveY + staveSpacing - 5);
              
              // Add data attributes to distinguish left and right voice notes for highlighting
                // Use the same scheduled index mapping approach as other modes
                // positions is already calculated above
                
              setTimeout(() => {
                const svgEl = staveRef.current?.querySelector('svg');
                if (svgEl && rightVoiceNotes && leftVoiceNotes && positions) {
                    // First, clear all existing polyrhythm attributes to avoid conflicts
                  const allNotes = Array.from(svgEl.querySelectorAll('.vf-stavenote')) as SVGElement[];
                    allNotes.forEach((noteEl) => {
                      noteEl.removeAttribute('data-voice');
                      noteEl.removeAttribute('data-polyrhythm-note-index');
                    });
                    
                    const rightLimb = polyrhythmPattern.rightRhythm.limb.replace('-', ' ').toUpperCase().charAt(0);
                    const leftLimb = polyrhythmPattern.leftRhythm.limb.replace('-', ' ').toUpperCase().charAt(0);
                    const combinedSticking = `${rightLimb}/${leftLimb}`;
                    
                    // Create a map from beat position to scheduled note index
                    // Combine all note events and sort by beat position to get scheduled indices
                    const allNoteEvents: Array<{ beatPos: number; hand: 'left' | 'right' | 'both'; rightIndex?: number; leftIndex?: number }> = [];
                    
                    // Add right hand notes
                    for (let i = 0; i < positions.rightPositions.length; i++) {
                      const beatPos = positions.rightPositions[i];
                      const alignment = positions.alignments.find(a => a.rightIndex === i);
                      if (alignment) {
                        allNoteEvents.push({ beatPos, hand: 'both', rightIndex: i, leftIndex: alignment.leftIndex });
                      } else {
                        allNoteEvents.push({ beatPos, hand: 'right', rightIndex: i });
                      }
                    }
                    
                    // Add left hand notes that don't align
                    for (let j = 0; j < positions.leftPositions.length; j++) {
                      const alignment = positions.alignments.find(a => a.leftIndex === j);
                      if (!alignment) {
                        const beatPos = positions.leftPositions[j];
                        allNoteEvents.push({ beatPos, hand: 'left', leftIndex: j });
                      }
                    }
                    
                    // Sort by beat position
                    allNoteEvents.sort((a, b) => a.beatPos - b.beatPos);
                    
                    // Map each scheduled event to its index
                    const beatPosToScheduledIndex = new Map<number, number>();
                    const scheduledIndexToHand = new Map<number, 'left' | 'right' | 'both'>();
                    allNoteEvents.forEach((event, idx) => {
                      beatPosToScheduledIndex.set(event.beatPos, idx);
                      scheduledIndexToHand.set(idx, event.hand);
                    });
                    
                    // Now map rendered notes to scheduled indices
                    // For two-staves mode, notes are rendered on separate staves
                    // Right-hand notes are on the first stave, left-hand notes are on the second stave
                    // We need to process them separately and handle aligned notes correctly
                    
                    // First, find all right-hand notes (should be the first N notes, where N = rightVoiceNotes.length)
                    let rightNoteIndex = 0;
                    for (let i = 0; i < rightVoiceNotes.length && rightNoteIndex < allNotes.length; i++) {
                      const rightPos = positions.rightPositions[i];
                      const scheduledIndex = beatPosToScheduledIndex.get(rightPos);
                      const alignment = positions.alignments.find(a => a.rightIndex === i);
                      
                      if (scheduledIndex !== undefined) {
                        const hand = scheduledIndexToHand.get(scheduledIndex) || 'right';
                        
                        // Find the corresponding SVG element (right-hand notes are first)
                        while (rightNoteIndex < allNotes.length) {
                          const noteEl = allNotes[rightNoteIndex];
                          const annotation = noteEl.querySelector('.vf-annotation text');
                          const text = annotation?.textContent?.trim() || '';
                          
                          // Skip if already has attributes
                          if (noteEl.getAttribute('data-polyrhythm-note-index') !== null) {
                            rightNoteIndex++;
                            continue;
                          }
                          
                          // Match by annotation - right-hand notes should have rightLimb annotation
                          if (text === rightLimb || (alignment && (text === combinedSticking || text.includes('/')))) {
                            // For aligned notes, set voice='both', otherwise use the hand
                            const voice = alignment ? 'both' : hand;
                            noteEl.setAttribute('data-voice', voice);
                            noteEl.setAttribute('data-polyrhythm-note-index', scheduledIndex.toString());
                            rightNoteIndex++;
                            break;
                          }
                          rightNoteIndex++;
                        }
                      }
                    }
                    
                    // Then, find all left-hand notes (should be after the right-hand notes)
                    // In two-staves mode, left-hand notes are on the second stave
                    let leftNoteIndex = rightVoiceNotes.length; // Start after right-hand notes
                    for (let j = 0; j < leftVoiceNotes.length && leftNoteIndex < allNotes.length; j++) {
                      const alignment = positions.alignments.find(a => a.leftIndex === j);
                      const leftPos = positions.leftPositions[j];
                      const scheduledIndex = beatPosToScheduledIndex.get(leftPos);
                      
                      if (scheduledIndex !== undefined) {
                        const hand = scheduledIndexToHand.get(scheduledIndex) || 'left';
                        
                        // Find the corresponding SVG element (left-hand notes come after right-hand notes)
                        while (leftNoteIndex < allNotes.length) {
                          const noteEl = allNotes[leftNoteIndex];
                          const annotation = noteEl.querySelector('.vf-annotation text');
                          const text = annotation?.textContent?.trim() || '';
                          
                          // Skip if already has attributes
                          if (noteEl.getAttribute('data-polyrhythm-note-index') !== null) {
                            leftNoteIndex++;
                            continue;
                          }
                          
                          // Match by annotation - left-hand notes should have leftLimb annotation
                          if (text === leftLimb || (alignment && (text === combinedSticking || text.includes('/')))) {
                            // For aligned notes, set voice='both', otherwise use the hand
                            const voice = alignment ? 'both' : hand;
                            noteEl.setAttribute('data-voice', voice);
                            noteEl.setAttribute('data-polyrhythm-note-index', scheduledIndex.toString());
                            leftNoteIndex++;
                            break;
                          }
                          leftNoteIndex++;
                        }
                      }
                    }
                  }
                }, 100);
              } else {
                // Stacked mode: combine voices into single stave
                // Note: stave already has clef/time signature from earlier setup
                // Only add time signature if it changed
                if (timeSigChanged) {
                  // Time signature was already added to the stave earlier, but we might need to update it
                  // For now, the stave is already drawn with the correct time signature
                }
                
                // In stacked mode, we need to merge the voices into a single voice
                // because combined notes (with multiple keys) should stack vertically
                // VexFlow will stack keys vertically when they're in the same note
                const formatter = new VF.Formatter();
                
                // For stacked mode, format separately to get correct spacing, then draw both voices
                // After drawing, rearrange SVG elements to be in chronological order (not sequential by voice)
                if (polyrhythmDisplayMode === 'stacked') {
                  // Format each voice separately (like two-staves mode) to get correct spacing
                  const rightFormatter = new VF.Formatter();
                  rightFormatter.joinVoices([rightVoice]);
                  const formatWidth = Math.max(200, actualStaveWidth - 120);
                  rightFormatter.format([rightVoice], formatWidth, { align_rests: false });
                  
                  const leftFormatter = new VF.Formatter();
                  leftFormatter.joinVoices([leftVoice]);
                  leftFormatter.format([leftVoice], formatWidth, { align_rests: false });
                  
                  // Draw both voices on the same stave - VexFlow will stack aligned notes
                  rightVoice.draw(context, stave);
                  leftVoice.draw(context, stave);
                  
                  // After drawing, rearrange SVG note groups to be in chronological order
                  // Then set data attributes based on beat positions
                  // This ensures playback and highlighting work correctly
                  setTimeout(() => {
                    const svgEl = staveRef.current?.querySelector('svg');
                    if (svgEl && rightVoiceNotes && leftVoiceNotes && positions) {
                      // Get all note groups (both right and left voice notes)
                      const allNoteGroups = Array.from(svgEl.querySelectorAll('.vf-stavenote')) as SVGElement[];
                      
                      if (allNoteGroups.length > 0) {
                        // Get the parent group that contains all notes (usually the voice group)
                        const parentGroup = allNoteGroups[0].parentElement;
                        if (parentGroup) {
                          // Sort notes by their x position (which corresponds to time/beat position)
                          const notesWithPositions = allNoteGroups.map((noteEl) => {
                            const svgNoteEl = noteEl as SVGGElement;
                            const bbox = svgNoteEl.getBBox();
                            return { element: noteEl, x: bbox.x };
                          });
                          
                          notesWithPositions.sort((a, b) => a.x - b.x);
                          
                          // Reorder elements in the DOM to match chronological order
                          notesWithPositions.forEach(({ element }) => {
                            parentGroup.appendChild(element);
                          });
                          
                          
                          // Now set data attributes based on beat positions (after rearrangement)
                          // First, clear all existing polyrhythm attributes
                          allNoteGroups.forEach((noteEl) => {
                            noteEl.removeAttribute('data-voice');
                            noteEl.removeAttribute('data-polyrhythm-note-index');
                          });
                          
                          const rightLimb = polyrhythmPattern.rightRhythm.limb.replace('-', ' ').toUpperCase().charAt(0);
                          const leftLimb = polyrhythmPattern.leftRhythm.limb.replace('-', ' ').toUpperCase().charAt(0);
                          const combinedSticking = `${rightLimb}/${leftLimb}`;
                          
                          // Create a map from beat position to scheduled note index
                          const allNoteEvents: Array<{ beatPos: number; hand: 'left' | 'right' | 'both'; rightIndex?: number; leftIndex?: number }> = [];
                          
                          // Add right hand notes
                          for (let i = 0; i < positions.rightPositions.length; i++) {
                            const beatPos = positions.rightPositions[i];
                            const alignment = positions.alignments.find(a => a.rightIndex === i);
                            if (alignment) {
                              allNoteEvents.push({ beatPos, hand: 'both', rightIndex: i, leftIndex: alignment.leftIndex });
                            } else {
                              allNoteEvents.push({ beatPos, hand: 'right', rightIndex: i });
                            }
                          }
                          
                          // Add left hand notes that don't align
                          for (let j = 0; j < positions.leftPositions.length; j++) {
                            const alignment = positions.alignments.find(a => a.leftIndex === j);
                            if (!alignment) {
                              const beatPos = positions.leftPositions[j];
                              allNoteEvents.push({ beatPos, hand: 'left', leftIndex: j });
                            }
                          }
                          
                          // Sort by beat position
                          allNoteEvents.sort((a, b) => a.beatPos - b.beatPos);
                          
                          // Map each scheduled event to its index
                          const beatPosToScheduledIndex = new Map<number, number>();
                          const scheduledIndexToHand = new Map<number, 'left' | 'right' | 'both'>();
                          allNoteEvents.forEach((event, idx) => {
                            beatPosToScheduledIndex.set(event.beatPos, idx);
                            scheduledIndexToHand.set(idx, event.hand);
                          });
                          
                          // Map notes by their chronological order (after rearrangement)
                          // Notes are now in chronological order, so we can match them directly to scheduled notes
                          // But we verify annotations match to ensure correctness
                          for (let i = 0; i < notesWithPositions.length && i < allNoteEvents.length; i++) {
                            const { element: noteEl, x } = notesWithPositions[i];
                            const event = allNoteEvents[i];
                            
                            // Skip if already has attributes
                            if (noteEl.getAttribute('data-polyrhythm-note-index') !== null) {
                              continue;
                            }
                            
                            const annotation = noteEl.querySelector('.vf-annotation text');
                            const text = annotation?.textContent?.trim() || '';
                            
                            // Verify annotation matches expected (for debugging)
                            const expectedAnnotation = event.hand === 'both' ? combinedSticking :
                                                      event.hand === 'right' ? rightLimb : leftLimb;
                            const annotationMatches = text === expectedAnnotation || 
                                                      (event.hand === 'both' && (text.includes('/') || text === combinedSticking)) ||
                                                      (text === '' && event.hand !== 'both'); // Allow empty for rests
                            
                            if (!annotationMatches && text !== '') {
                              console.warn(`[Rendering] Annotation mismatch at index ${i}: expected "${expectedAnnotation}" (hand=${event.hand}), got "${text}"`);
                            }
                            
                            // Set attributes based on the scheduled event
                            const scheduledIndex = beatPosToScheduledIndex.get(event.beatPos);
                            if (scheduledIndex !== undefined) {
                              noteEl.setAttribute('data-voice', event.hand);
                              noteEl.setAttribute('data-polyrhythm-note-index', scheduledIndex.toString());
                            }
                          }
                        }
                      }
                    }
                  }, 100);
                } else {
                  // Not stacked mode: use separate voices
                  formatter.joinVoices([rightVoice, leftVoice]);
                  const formatWidth = Math.max(200, actualStaveWidth - 120);
                  formatter.format([rightVoice, leftVoice], formatWidth, { align_rests: false });
                  rightVoice.draw(context, stave);
                  leftVoice.draw(context, stave);
                  
                  // Add data attributes to distinguish left and right voice notes for highlighting (only for non-stacked mode)
                  // Use the same scheduled index mapping approach as stacked mode
                  setTimeout(() => {
                    const svgEl = staveRef.current?.querySelector('svg');
                    if (svgEl && rightVoiceNotes && leftVoiceNotes && positions) {
                      // First, clear all existing polyrhythm attributes to avoid conflicts
                      const allNotes = Array.from(svgEl.querySelectorAll('.vf-stavenote')) as SVGElement[];
                      allNotes.forEach((noteEl) => {
                        noteEl.removeAttribute('data-voice');
                        noteEl.removeAttribute('data-polyrhythm-note-index');
                      });
                      
                      const rightLimb = polyrhythmPattern.rightRhythm.limb.replace('-', ' ').toUpperCase().charAt(0);
                      const leftLimb = polyrhythmPattern.leftRhythm.limb.replace('-', ' ').toUpperCase().charAt(0);
                      const combinedSticking = `${rightLimb}/${leftLimb}`;
                      
                      // Create a map from beat position to scheduled note index
                      // Combine all note events and sort by beat position to get scheduled indices
                      const allNoteEvents: Array<{ beatPos: number; hand: 'left' | 'right' | 'both'; rightIndex?: number; leftIndex?: number }> = [];
                      
                      // Add right hand notes
                      for (let i = 0; i < positions.rightPositions.length; i++) {
                        const beatPos = positions.rightPositions[i];
                        const alignment = positions.alignments.find(a => a.rightIndex === i);
                        if (alignment) {
                          allNoteEvents.push({ beatPos, hand: 'both', rightIndex: i, leftIndex: alignment.leftIndex });
                        } else {
                          allNoteEvents.push({ beatPos, hand: 'right', rightIndex: i });
                        }
                      }
                      
                      // Add left hand notes that don't align
                      for (let j = 0; j < positions.leftPositions.length; j++) {
                        const alignment = positions.alignments.find(a => a.leftIndex === j);
                        if (!alignment) {
                          const beatPos = positions.leftPositions[j];
                          allNoteEvents.push({ beatPos, hand: 'left', leftIndex: j });
                        }
                      }
                      
                      // Sort by beat position
                      allNoteEvents.sort((a, b) => a.beatPos - b.beatPos);
                      
                      // Map each scheduled event to its index
                      const beatPosToScheduledIndex = new Map<number, number>();
                      const scheduledIndexToHand = new Map<number, 'left' | 'right' | 'both'>();
                      allNoteEvents.forEach((event, idx) => {
                        beatPosToScheduledIndex.set(event.beatPos, idx);
                        scheduledIndexToHand.set(idx, event.hand);
                      });
                      
                      // Now map rendered notes to scheduled indices
                      // For non-stacked mode, notes are rendered separately, so we need to match by position
                      let renderedIndex = 0;
                      for (let i = 0; i < rightVoiceNotes.length && renderedIndex < allNotes.length; i++) {
                        const rightPos = positions.rightPositions[i];
                        const scheduledIndex = beatPosToScheduledIndex.get(rightPos);
                        const alignment = positions.alignments.find(a => a.rightIndex === i);
                        
                        if (scheduledIndex !== undefined) {
                          const hand = scheduledIndexToHand.get(scheduledIndex) || 'right';
                          
                          // Find the corresponding SVG element
                          while (renderedIndex < allNotes.length) {
                            const noteEl = allNotes[renderedIndex];
                            const annotation = noteEl.querySelector('.vf-annotation text');
                            const text = annotation?.textContent?.trim() || '';
                            
                            // Skip if already has attributes
                            if (noteEl.getAttribute('data-polyrhythm-note-index') !== null) {
                              renderedIndex++;
                              continue;
                            }
                            
                            // Match by annotation
                            if (alignment && (text === combinedSticking || text.includes('/'))) {
                              noteEl.setAttribute('data-voice', 'both');
                              noteEl.setAttribute('data-polyrhythm-note-index', scheduledIndex.toString());
                              renderedIndex++;
                              break;
                            } else if (!alignment && text === rightLimb) {
                              noteEl.setAttribute('data-voice', hand);
                              noteEl.setAttribute('data-polyrhythm-note-index', scheduledIndex.toString());
                              renderedIndex++;
                              break;
                            }
                            renderedIndex++;
                          }
                        }
                      }
                      
                      // Map left hand notes that don't align
                      for (let j = 0; j < leftVoiceNotes.length; j++) {
                        const alignment = positions.alignments.find(a => a.leftIndex === j);
                        if (!alignment) {
                          const leftPos = positions.leftPositions[j];
                          const scheduledIndex = beatPosToScheduledIndex.get(leftPos);
                          
                          if (scheduledIndex !== undefined) {
                            const hand = scheduledIndexToHand.get(scheduledIndex) || 'left';
                            
                            // Find the corresponding SVG element
                            while (renderedIndex < allNotes.length) {
                              const noteEl = allNotes[renderedIndex];
                              const annotation = noteEl.querySelector('.vf-annotation text');
                              const text = annotation?.textContent?.trim() || '';
                              
                              // Skip if already has attributes
                              if (noteEl.getAttribute('data-polyrhythm-note-index') !== null) {
                                renderedIndex++;
                                continue;
                              }
                              
                              // Match by annotation
                              if (text === leftLimb) {
                                noteEl.setAttribute('data-voice', hand);
                                noteEl.setAttribute('data-polyrhythm-note-index', scheduledIndex.toString());
                                renderedIndex++;
                                break;
                              }
                              renderedIndex++;
                            }
                          }
                        }
                      }
                }
              }, 100);
                }
              }
              
              // Update previous time signature for next bar
              previousBarTimeSig = polyrhythmTimeSig;
            } catch (error) {
              console.error('Error formatting/drawing polyrhythm voices:', error);
            }
            
            // Add bar line between polyrhythm bars (except after last bar)
            if (polyrhythmBarIndex < polyrhythmBars.length - 1 || (polyrhythmBarIndex === polyrhythmBars.length - 1 && lineBars.some(bar => !bar.isPolyrhythm))) {
              try {
                // Draw a bar line between this polyrhythm bar and the next
                const barNote = new VF.BarNote();
                // We'll need to handle this differently since we're using voices
                // For now, skip bar lines between polyrhythm bars
              } catch (error) {
                // Ignore bar line errors
              }
            }
          }
          
          // Draw grid lines if enabled (after all polyrhythm bars are drawn)
          if (showGridLines && staveRef.current) {
            const totalNotesInLine = lineBars.reduce((sum, bar) => sum + bar.totalNotesInBar, 0);
            // Use cycleLength as the subdivision for polyrhythms
            if (polyrhythmBars.length > 0 && polyrhythmBars[0].polyrhythmPattern) {
              drawGridLines(staveRef.current, stave, polyrhythmBars[0].polyrhythmPattern.cycleLength, firstBarTimeSig, totalNotesInLine);
            }
          }
        } else {
          // Regular patterns - single voice
          // Combine all tickables for this line
          const lineTickables: any[] = [];
          const lineBeams: any[] = [];

          lineBars.forEach((barData, barIndexInLine) => {
            const currentTimeSig = barData.timeSignature;
            
            // Check if time signature changed from the previous bar (across all lines)
            const timeSigChanged = previousBarTimeSig && 
              (currentTimeSig[0] !== previousBarTimeSig[0] || currentTimeSig[1] !== previousBarTimeSig[1]);
            
            // If time signature changed and this is not the first bar in the line,
            // add bar line BEFORE the time signature change
            if (timeSigChanged && barIndexInLine > 0) {
              try {
                // Check if we already have a bar note at the end (shouldn't happen, but be safe)
                const lastTickable = lineTickables[lineTickables.length - 1];
                if (!lastTickable || !(lastTickable instanceof VF.BarNote)) {
                  lineTickables.push(new VF.BarNote());
                }
              } catch (error) {
                console.error('[Stave] Could not create bar line before time signature change:', error);
              }
            }
            
            // Add TimeSigNote for time signature changes (mid-stave changes)
            // Use TimeSigNote instead of modifier - this is the proper VexFlow way
            if (timeSigChanged) {
              try {
                // Create a TimeSigNote for the new time signature
                // TimeSigNote is a special "note" that renders as a time signature glyph
                const timeSigNote = new VF.TimeSigNote(`${currentTimeSig[0]}/${currentTimeSig[1]}`);
                // Insert the TimeSigNote at the start of this bar (after bar line if present)
                lineTickables.push(timeSigNote);
              } catch (error) {
                console.error('[Stave] Could not create TimeSigNote for time signature change:', error);
                // Fallback: try adding as modifier to first note if TimeSigNote fails
                if (barData.tickables.length > 0) {
                  try {
                    const firstNote = barData.tickables[0];
                    if (firstNote && typeof firstNote.addModifier === 'function') {
                      const timeSig = new VF.TimeSignature(`${currentTimeSig[0]}/${currentTimeSig[1]}`);
                      firstNote.addModifier(timeSig, 0);
                    }
                  } catch (modifierError) {
                    console.error('[Stave] Could not add time signature modifier as fallback:', modifierError);
                  }
                }
              }
            }

            lineTickables.push(...barData.tickables);
            lineBeams.push(...barData.beams);
            
            // Update previous time signature for next bar
            previousBarTimeSig = currentTimeSig;

            // Add bar line between bars (except after last bar in line)
            // Only add if we haven't already added one for a time signature change
            if (barIndexInLine < lineBars.length - 1 && !timeSigChanged) {
              try {
                lineTickables.push(new VF.BarNote());
              } catch (error) {
                console.warn('Could not create BarNote:', error);
                // Continue without bar line
              }
            }
          });

          // Calculate total beats for the voice based on all time signatures
          const totalBeats = lineBars.reduce((sum, bar) => {
            const [beats, beatValue] = bar.timeSignature;
            return sum + beats;
          }, 0);
          
          // Use the first bar's beat value for the voice (typically 4)
          const [, beatValue] = firstBarTimeSig;
          
          // Create voice for this line
          const voice = new VF.Voice({
            num_beats: totalBeats,
            beat_value: beatValue,
            resolution: VF.RESOLUTION,
          });
          voice.setStrict(false);
          voice.addTickables(lineTickables);

          // Format and draw
          try {
            const formatter = new VF.Formatter();
            formatter.joinVoices([voice]);
            // Format to fit within the stave width, leaving space for clef and time signature
            const formatWidth = Math.max(200, actualStaveWidth - 120); // Minimum 200px for formatting
            formatter.format([voice], formatWidth, { align_rests: false });
            voice.draw(context, stave);
            lineBeams.forEach((beam: any) => {
              try {
                beam.setContext(context).draw();
              } catch (error) {
                console.warn('Error drawing beam:', error);
              }
            });
            
            // Mark ghost notes in the DOM after rendering and add parentheses as SVG text
            if (staveRef.current) {
              const svgElement = staveRef.current.querySelector('svg');
              if (svgElement) {
                // Find all note groups and mark ghost notes, then add parentheses
                const noteGroups = Array.from(svgElement.querySelectorAll('.vf-stavenote')) as SVGElement[];
                let noteIndexInLine = 0;
                lineBars.forEach((barData) => {
                  const ghostIndices = (barData as any).ghostNoteIndices || [];
                  const ghostDurations = (barData as any).ghostNoteDurations || {};
                  for (let i = 0; i < barData.tickables.length && noteIndexInLine < noteGroups.length; i++) {
                    if (ghostIndices.includes(i)) {
                      const noteGroup = noteGroups[noteIndexInLine];
                      if (noteGroup) {
                        noteGroup.setAttribute('data-ghost-note', 'true');
                        
                        // Add parentheses as SVG text elements directly
                        try {
                          // Get the notehead position for X coordinate
                          const notehead = noteGroup.querySelector('path[data-name="notehead"]') || 
                                         noteGroup.querySelector('circle') ||
                                         noteGroup.querySelector('ellipse') ||
                                         noteGroup.querySelector('path');
                          
                          if (notehead) {
                            const bbox = (notehead as SVGGElement).getBBox();
                            const x = bbox.x;
                            
                            // Calculate Y position - keep fixed at 96 for all notes
                            const y = 96;
                            
                            // Check if this is a quarter note - they need more X spacing
                            const noteDuration = ghostDurations[i] || '';
                            const isQuarterNote = noteDuration === 'q' || noteDuration === 'qr';
                            
                            // Calculate spacing based on notehead size
                            // Quarter notes have larger noteheads, so use notehead width to calculate spacing
                            const noteheadWidth = bbox.width;
                            // For quarter notes, use much more aggressive spacing to properly wrap around the larger notehead
                            const leftXOffset = isQuarterNote ? -(noteheadWidth * 0.85 + 12) : -8;  // A bit more space for quarter notes
                            const rightXOffset = isQuarterNote ? (noteheadWidth * 0.65 + 10) : 2;  // A bit more space for quarter notes
                            
                            // Create left parenthesis
                            const leftParenText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                            leftParenText.textContent = '(';
                            leftParenText.setAttribute('x', (x + leftXOffset).toString());
                            leftParenText.setAttribute('y', y.toString());
                            leftParenText.setAttribute('font-family', 'Arial');
                            leftParenText.setAttribute('font-size', '20');
                            leftParenText.setAttribute('font-weight', 'bold');
                            leftParenText.setAttribute('fill', darkMode ? '#ffffff' : '#000000');
                            leftParenText.setAttribute('class', 'dpgen-ghost-note-paren');
                            noteGroup.appendChild(leftParenText);
                            
                            // Create right parenthesis
                            const rightParenText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                            rightParenText.textContent = ')';
                            rightParenText.setAttribute('x', (x + bbox.width + rightXOffset).toString());
                            rightParenText.setAttribute('y', y.toString());
                            rightParenText.setAttribute('font-family', 'Arial');
                            rightParenText.setAttribute('font-size', '20');
                            rightParenText.setAttribute('font-weight', 'bold');
                            rightParenText.setAttribute('fill', darkMode ? '#ffffff' : '#000000');
                            rightParenText.setAttribute('class', 'dpgen-ghost-note-paren');
                            noteGroup.appendChild(rightParenText);
                          }
                        } catch (e) {
                          console.error('[Ghost Note] Failed to add SVG text parentheses:', e);
                        }
                      }
                    }
                    noteIndexInLine++;
                  }
                });
              }
            }
          } catch (error) {
            console.error('Error formatting/drawing voice:', error);
          }
          
          // Draw grid lines if enabled (after notes are drawn so they appear behind)
          if (showGridLines && staveRef.current) {
            const totalNotesInLine = lineBars.reduce((sum, bar) => sum + bar.totalNotesInBar, 0);
            drawGridLines(staveRef.current, stave, firstBarInLine.pattern.subdivision, firstBarTimeSig, totalNotesInLine);
          }
        }

        // Collect measure numbers info for this line (applies to both regular and polyrhythm patterns)
        if (showMeasureNumbers) {
          // Calculate starting measure number for this line based on previous lines
          let measureNumber = 1;
          for (let i = 0; i < lineIndex; i++) {
            const previousLine = lines[i];
            if (previousLine) {
              measureNumber += previousLine.length;
            }
          }
          allMeasureNumbers.push({
            stave,
            timeSig: firstBarTimeSig,
            startMeasure: measureNumber,
            bars: lineBars.length,
          });
        }

        // Store note elements for highlighting (applies to both regular and polyrhythm patterns)
        // Find all note elements in the SVG and map them to note indices
        const svgElement = staveRef.current?.querySelector('svg');
        if (svgElement) {
          const noteGroups = Array.from(svgElement.querySelectorAll('g'));
          // Note: VexFlow renders notes as groups, but we need to map them to our note indices
          // This is approximate - we'll use the order of notes in the tickables array
          let noteIndex = 0;
          for (let i = 0; i < lineBars.length; i++) {
            const barData = lineBars[i];
            for (let j = 0; j < barData.tickables.length; j++) {
              // Calculate global note index (this is approximate)
              let globalNoteIndex = 0;
              for (let k = 0; k < i; k++) {
                globalNoteIndex += lineBars[k].totalNotesInBar;
              }
              globalNoteIndex += j;
              
              // Try to find the corresponding SVG group
              // This is a heuristic approach - we use the order
              if (!noteElementsRef.current.has(globalNoteIndex)) {
                noteElementsRef.current.set(globalNoteIndex, []);
              }
              // We'll update this after all rendering is complete
            }
          }
        }
        
        // console.log(`Line ${lineIndex + 1} rendered successfully`);
        } catch (error) {
          console.error(`Error rendering line ${lineIndex + 1}:`, error);
        }
      }

      // Draw all measure numbers at once (after all lines are rendered)
      if (showMeasureNumbers && staveRef.current && allMeasureNumbers.length > 0) {
        // Remove all existing measure numbers first
        const svgElement = staveRef.current.querySelector('svg');
        if (svgElement) {
          const existingMeasures = svgElement.querySelectorAll('.dpgen-measure-numbers');
          existingMeasures.forEach((el) => el.remove());
        }

        // Draw measure numbers for each line
        const container = staveRef.current;
        if (container) {
          allMeasureNumbers.forEach(({ stave, timeSig, startMeasure, bars }) => {
            drawMeasureNumbers(container, stave, timeSig, startMeasure, bars);
          });
        }
      }

      }; // End of renderStave function

      // Wait for VexFlow to load
      let retryCount = 0;
      const maxRetries = 50;
      const checkVexFlow = () => {
        if (typeof window !== 'undefined') {
          // Try multiple ways VexFlow might be exposed
          let VF: any = null;
          if ((window as any).VF) {
            VF = (window as any).VF;
          } else if ((window as any).Vex && (window as any).Vex.Flow) {
            VF = (window as any).Vex.Flow;
          } else if ((window as any).VexFlow) {
            VF = (window as any).VexFlow;
          }
          
          if (VF && VF.Renderer && VF.Stave && VF.StaveNote) {
            try {
              renderStave(VF);
            } catch (error) {
              console.error('[Stave] Error rendering stave:', error);
              // Show user-friendly error message
              if (staveRef.current) {
                staveRef.current.innerHTML = `
                  <div style="padding: 2rem; text-align: center; color: var(--dpgen-muted);">
                    <p style="margin-bottom: 0.5rem; font-weight: 600;">Unable to render notation</p>
                    <p style="font-size: 0.875rem;">Please refresh the page to try again.</p>
                  </div>
                `;
              }
            }
            return;
          }
        }
        // Retry after a short delay (max 50 retries = 5 seconds)
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(checkVexFlow, 100);
        } else {
          console.error('VexFlow failed to load after 5 seconds. Available:', {
            Vex: (window as any).Vex,
            VexFlow: (window as any).VexFlow,
            VF: (window as any).VF,
            windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('vex') || k.toLowerCase().includes('flow')),
          });
        }
      };

      checkVexFlow();
    }, 150); // 150ms debounce

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current = null;
      }
    };
  }, [renderKey, processedPatterns, processedPolyrhythmPatterns, polyrhythmDisplayMode, darkMode, showGridLines, showMeasureNumbers]);

  // Track previous playback position to detect when playback starts/stops
  const prevPlaybackPositionRef = useRef<number | null>(null);
  const prevIsPlayingRefHighlight = useRef<boolean>(false);
  
  // Cache note groups to avoid re-querying DOM on every playback position change
  const noteGroupsCacheRef = useRef<SVGElement[] | null>(null);
  const noteGroupsCacheKeyRef = useRef<string>('');

  // Highlight active notes based on playback position
  useEffect(() => {
    const svgElement = staveRef.current?.querySelector('svg');
    if (!svgElement) return;

    // Detect when playback stops (playbackPosition goes from number to null)
    const playbackJustStopped = prevPlaybackPositionRef.current !== null && playbackPosition === null;
    // Detect when playback starts (playbackPosition goes from null to number)
    const playbackJustStarted = prevPlaybackPositionRef.current === null && playbackPosition !== null;
    // Detect when playback restarts (isPlaying goes from false to true)
    const playbackRestarted = !prevIsPlayingRefHighlight.current && isPlaying;

    // Update refs for next check
    prevPlaybackPositionRef.current = playbackPosition;
    prevIsPlayingRefHighlight.current = isPlaying;

    // Clear all highlights when playback stops OR when a new playback starts OR when playback restarts
    if (playbackJustStopped || playbackJustStarted || playbackRestarted) {
      // Clear all previous highlights
      svgElement.querySelectorAll('.dpgen-note--active').forEach((el) => {
        el.classList.remove('dpgen-note--active');
        el.removeAttribute('data-accented');
        
        // Clear filter style (glow effect) from the note group
        const groupEl = el as unknown as HTMLElement;
        if (groupEl && groupEl.style.filter) {
          groupEl.style.filter = '';
        }
        
        // Clear fill and stroke from note shapes (paths, circles, etc.)
        // Remove ALL fill/stroke attributes to return notes to default black color
        const noteShapes = el.querySelectorAll('path, circle, ellipse, rect');
        noteShapes.forEach((shape) => {
          const svgShape = shape as SVGElement;
          // Remove all fill and stroke attributes to return to default black
            svgShape.removeAttribute('fill');
            svgShape.removeAttribute('stroke');
        });
      });
      // Clear annotation fill attributes from all text/tspan elements
      // Remove ALL fill attributes to return annotations to default black color
      svgElement.querySelectorAll('text, tspan').forEach((el) => {
        const elSvg = el as SVGElement;
        // Remove fill attribute and inline style to return to default black
          elSvg.removeAttribute('fill');
        if ((elSvg as any).style) {
          (elSvg as any).style.fill = '';
          (elSvg as any).style.removeProperty('fill');
        }
      });
      // Clear annotation classes
      svgElement.querySelectorAll('.dpgen-annotation--active').forEach((el) => {
        el.classList.remove('dpgen-annotation--active');
        el.classList.remove('dpgen-annotation--left');
        el.classList.remove('dpgen-annotation--right');
        el.classList.remove('dpgen-annotation--both');
      });
    }

    // If not playing, don't highlight (but don't clear - that's handled above)
    if (playbackPosition === null || !isPlaying) {
      return;
    }

    // During playback: DON'T clear previous highlights, just add the current one

    // Calculate cumulative note indices for each pattern
    let currentNoteIndex = 0;
    const allBars: Pattern[] = [];
    patterns.forEach((pattern) => {
      const repeat = pattern.repeat || 1;
      for (let r = 0; r < repeat; r++) {
        allBars.push(pattern);
      }
    });

    // Find which bar contains the current playback position
    // Need to check both regular patterns and polyrhythm patterns
    let targetBarIndex = -1;
    let noteIndexInBar = -1;
    let isPolyrhythmBar = false;
    
      // Check regular patterns first
      for (let barIndex = 0; barIndex < allBars.length; barIndex++) {
        const pattern = allBars[barIndex];
        // Calculate actual notes per bar (handles both normal and advanced modes)
        const notesPerBar = getNotesPerBarForPattern(pattern);
        
        // Check if playbackPosition is in this bar
        // Use <= for the upper bound to ensure last note is included
        if (playbackPosition >= currentNoteIndex && playbackPosition <= currentNoteIndex + notesPerBar - 1) {
          targetBarIndex = barIndex;
          noteIndexInBar = playbackPosition - currentNoteIndex;
          isPolyrhythmBar = false;
          break;
        }
        
        currentNoteIndex += notesPerBar;
      }
    
    // If not found in regular patterns, check polyrhythm patterns
    if (targetBarIndex === -1) {
      currentNoteIndex = 0; // Reset for polyrhythms
      
      // Calculate cumulative note index for regular patterns
      patterns.forEach((pattern) => {
        // Calculate actual notes per bar (handles both normal and advanced modes)
        const notesPerBar = getNotesPerBarForPattern(pattern);
        const totalNotes = notesPerBar * (pattern.repeat || 1);
        currentNoteIndex += totalNotes;
      });
      
      // Now check polyrhythm patterns (with repeats)
      polyrhythmPatterns.forEach((polyrhythmPattern) => {
        const combined = polyrhythmToCombinedPattern(polyrhythmPattern);
        const totalNotesInBar = combined.notesPerBar;
        const repeat = polyrhythmPattern.repeat || 1;
        
        // Check each repeat of this polyrhythm pattern
        for (let r = 0; r < repeat; r++) {
          if (playbackPosition >= currentNoteIndex && playbackPosition < currentNoteIndex + totalNotesInBar) {
            // Calculate the actual bar index including all previous polyrhythm repeats
            let polyrhythmBarIndex = 0;
            for (let i = 0; i < polyrhythmPatterns.length; i++) {
              const prevPattern = polyrhythmPatterns[i];
              if (prevPattern.id === polyrhythmPattern.id && i < polyrhythmPatterns.indexOf(polyrhythmPattern)) {
                polyrhythmBarIndex += prevPattern.repeat || 1;
              }
            }
            polyrhythmBarIndex += r;
            
            targetBarIndex = allBars.length + polyrhythmBarIndex;
            noteIndexInBar = playbackPosition - currentNoteIndex;
            isPolyrhythmBar = true;
            break;
          }
          
          if (targetBarIndex === -1) {
            currentNoteIndex += totalNotesInBar;
          }
        }
      });
    }

    if (targetBarIndex === -1) {
      console.warn(`Could not find bar for playbackPosition ${playbackPosition}`);
      return;
    }

    // Check if we need to refresh note groups cache
    // Use a simpler cache key that doesn't depend on renderKey (which changes frequently)
    const currentCacheKey = `${patterns.length}-${polyrhythmPatterns.length}`;
    let noteGroups: SVGElement[];
    
    if (noteGroupsCacheKeyRef.current !== currentCacheKey || !noteGroupsCacheRef.current) {
      // Cache is stale or missing, rebuild it
      
      // Find all note groups in the SVG using VexFlow's classes
      // VexFlow uses .vf-stavenote class for all stave notes (quarter, eighth, sixteenth, etc.)
      // This is more reliable than heuristic detection, especially for quarter notes which aren't beamed
      // Get all note elements, excluding grace notes (flams count as ONE note position)
      // Grace notes are part of the main note and shouldn't be counted separately
      const allNoteEls = Array.from(svgElement.querySelectorAll('.vf-stavenote')) as SVGElement[];
      
      // Filter out grace notes and invisible spacer notes (same as WordPress plugin)
      // This ensures flams count as 1 note, not 2 (grace notes are modifiers, not separate notes)
      // VexFlow renders grace notes as separate stavenote elements - we need to identify them
      // Also filter out nested .vf-stavenote elements to avoid counting duplicates
      noteGroups = allNoteEls.filter((noteEl) => {
      // Check if this is a grace note by looking at parent structure
      // Grace notes are typically children of grace note groups or have specific attributes
      // IMPORTANT: Grace notes are nested INSIDE the main note's .vf-stavenote element
      // So we need to check if this note is nested inside another .vf-stavenote
      const parent = noteEl.parentElement;
      let currentParent = parent;
      let isNestedInStaveNote = false;
      let nestedDepth = 0;
      
      // Walk up the DOM tree to see if this note is nested inside another .vf-stavenote
      while (currentParent) {
        if (currentParent.classList && currentParent.classList.contains('vf-stavenote')) {
          isNestedInStaveNote = true;
          nestedDepth++;
        }
        currentParent = currentParent.parentElement;
      }
      
      // If nested inside another .vf-stavenote, it's likely a duplicate or grace note
      // Only count the top-level note, not nested ones
      if (isNestedInStaveNote) {
        return false;
      }
      
      const isGraceNote = 
        // Check for grace note containers (various possible class names)
        (parent && (
          parent.classList.contains('vf-gracenotegroup') ||
          parent.classList.contains('vf-gracenote-group') ||
          parent.classList.contains('gracenotegroup') ||
          (parent.tagName === 'g' && parent.querySelector('use[href*="gracenote"]') !== null)
        )) ||
        // Check if note itself has grace note indicators
        noteEl.classList.contains('vf-gracenote') ||
        noteEl.getAttribute('data-grace-note') === 'true' ||
        // Check class name string for grace indicators
        (noteEl.getAttribute('class') || '').toLowerCase().includes('grace');
      
      if (isGraceNote) {
        return false; // Exclude grace notes - they're part of the main note timing
      }
      
      // Check for invisible spacer notes
      // Spacer notes are used to position elements but shouldn't be highlighted
      const isInvisibleSpacer = noteEl.getAttribute('data-invisible-spacer') === 'true' ||
                                noteEl.querySelector('[data-invisible-spacer="true"]') !== null;
      
      if (isInvisibleSpacer) {
        return false;
      }
      
      // Also check opacity - completely transparent notes are likely spacers or hidden elements
      const style = window.getComputedStyle(noteEl);
      const opacity = parseFloat(style.opacity);
      // Use a small threshold to account for floating point precision
      if (opacity <= 0.01) {
        return false; // Exclude invisible notes
      }
      
      return true;
    });
    
    // Additional deduplication: filter out notes that are at the same x position
    // This handles cases where VexFlow might create duplicate elements (e.g., stem and notehead)
    const seenPositions = new Map<number, SVGElement>();
    noteGroups = noteGroups.filter((noteEl) => {
      try {
        const bbox = (noteEl as SVGGElement).getBBox();
        const xPos = Math.round(bbox.x * 100) / 100; // Round to 2 decimal places for comparison
        const yPos = Math.round(bbox.y * 100) / 100; // Also check y position
        const positionKey = `${xPos}_${yPos}`;
        
        // Check if we've already seen a note at this exact position
        const existingNote = seenPositions.get(xPos);
        if (existingNote && existingNote !== noteEl) {
          // Check if they're at the same y position too (same note)
          const existingBbox = (existingNote as SVGGElement).getBBox();
          const existingYPos = Math.round(existingBbox.y * 100) / 100;
          
          if (Math.abs(yPos - existingYPos) < 1) {
            // Same position - likely duplicates
            // Prefer the one with more visual content (main note vs stem)
            const thisContent = noteEl.querySelectorAll('path, circle, ellipse, rect').length;
            const existingContent = existingNote.querySelectorAll('path, circle, ellipse, rect').length;
            
            if (thisContent <= existingContent) {
              return false; // This one has less content, it's likely a duplicate
            } else {
              // Replace the existing one with this one (has more content)
              seenPositions.set(xPos, noteEl);
              return true;
            }
          }
        }
        
        if (!existingNote) {
          seenPositions.set(xPos, noteEl);
        }
        return true;
      } catch (e) {
        // If getBBox fails, include the note anyway (better to have it than miss it)
        return true;
      }
    });

    // Calculate expected number of notes from pattern data (before filtering)
    const expectedNotes = allBars.reduce((sum, bar) => {
      // Calculate actual notes per bar (handles both normal and advanced modes)
      const notesPerBar = getNotesPerBarForPattern(bar);
      return sum + notesPerBar;
    }, 0);
    
    // Debug: Log how many grace notes were filtered out
    const graceNotesFiltered = allNoteEls.length - noteGroups.length;
    
    // If we found more notes than expected, it means grace notes are still being counted
    // In this case, take only the first expectedNotes (main notes come first in DOM order)
    // OR: If filtering worked, noteGroups.length should equal expectedNotes
    if (noteGroups.length > expectedNotes && expectedNotes > 0) {
      // Grace notes are typically smaller and positioned differently, but main notes come first
      // Simply take the first expectedNotes groups (main notes)
      noteGroups = noteGroups.slice(0, expectedNotes);
    }
    
    // Fallback: if we didn't find enough notes with VexFlow classes, try heuristic approach
    
    if (noteGroups.length < expectedNotes && expectedNotes > 0) {
      console.warn(`Found ${noteGroups.length} notes but expected ${expectedNotes}, trying fallback detection...`);
      
      // Fallback: look for groups with note-like content
      const allGroups = Array.from(svgElement.querySelectorAll('g'));
      const fallbackGroups = allGroups.filter((group) => {
        const groupId = group.getAttribute('id') || '';
        const className = group.getAttribute('class') || '';
        
        // Skip obvious non-notes
        if (
          groupId.includes('stave') ||
          groupId.includes('clef') ||
          groupId.includes('timesig') ||
          className.includes('stave') ||
          className.includes('clef') ||
          className.includes('timesig') ||
          className.includes('vf-gracenotegroup') ||
          className.includes('vf-annotation') ||
          className.includes('vf-stavenote') // Already processed
        ) {
          return false;
        }
        
        // Must have visual content (paths, circles, ellipses)
        const hasContent = 
          group.querySelectorAll('path').length > 0 ||
          group.querySelectorAll('circle').length > 0 ||
          group.querySelectorAll('ellipse').length > 0;
        
        return hasContent;
      });
      
      
      // Combine both approaches, preferring .vf-stavenote but adding fallback if needed
      if (fallbackGroups.length > noteGroups.length) {
        // Use fallback if it found more notes
        noteGroups = fallbackGroups;
      }
      
      // Cache the note groups
      noteGroupsCacheRef.current = noteGroups;
      noteGroupsCacheKeyRef.current = currentCacheKey;
      }
    } else {
      // Use cached note groups
      noteGroups = noteGroupsCacheRef.current || [];
    }

    // Count notes up to the target bar
    // Need to account for both regular patterns and polyrhythm patterns
    let notesBeforeTargetBar = 0;
    
    // Count notes from regular patterns first
    for (let i = 0; i < allBars.length && i < targetBarIndex; i++) {
      // Calculate actual notes per bar (handles both normal and advanced modes)
      const notesPerBar = getNotesPerBarForPattern(allBars[i]);
      notesBeforeTargetBar += notesPerBar;
    }
    
    // Count notes from polyrhythm patterns if target bar is beyond regular patterns
    if (targetBarIndex >= allBars.length) {
      // First count all regular pattern notes
      for (let i = 0; i < allBars.length; i++) {
        // Calculate actual notes per bar (handles both normal and advanced modes)
        const notesPerBar = getNotesPerBarForPattern(allBars[i]);
        notesBeforeTargetBar += notesPerBar;
      }
      
      // Then count polyrhythm pattern notes up to the target
      // Rebuild the polyrhythm bars array with repeats to match what was rendered
      const polyrhythmBarIndex = targetBarIndex - allBars.length;
      let countedBars = 0;
      
      for (const polyrhythmPattern of polyrhythmPatterns) {
        const repeat = polyrhythmPattern.repeat || 1;
        for (let r = 0; r < repeat && countedBars < polyrhythmBarIndex; r++) {
          const combined = polyrhythmToCombinedPattern(polyrhythmPattern);
          notesBeforeTargetBar += combined.notesPerBar;
          countedBars++;
        }
        if (countedBars >= polyrhythmBarIndex) break;
      }
    }

    // Find the note group corresponding to the playback position
    // For polyrhythms, we need to use the data attributes to find the correct note
    let targetGroup: SVGElement | null = null;
    let alreadyHighlighted = false; // Track if we've already highlighted notes (for polyrhythms)
    
    if (isPolyrhythmBar) {
      // For polyrhythms, we need to find the note differently
      // The playbackPosition is a global note index, but for polyrhythms in stacked mode,
      // aligned notes are combined into one visual note
      // We need to find which polyrhythm pattern this belongs to and map correctly
      
      // Find which polyrhythm pattern this note belongs to
      let polyrhythmPattern: PolyrhythmPattern | null = null;
      let noteIndexInPolyrhythm = playbackPosition;
      
      // Subtract regular pattern notes
      for (const pattern of patterns) {
        const notesPerBar = getNotesPerBarForPattern(pattern);
        const totalNotes = notesPerBar * (pattern.repeat || 1);
        if (noteIndexInPolyrhythm < totalNotes) {
          // This is still in regular patterns
          break;
        }
        noteIndexInPolyrhythm -= totalNotes;
      }
      
      // Find which polyrhythm pattern
      for (const polyPattern of polyrhythmPatterns) {
        const combined = polyrhythmToCombinedPattern(polyPattern);
        const totalNotes = combined.notesPerBar * (polyPattern.repeat || 1);
        if (noteIndexInPolyrhythm < totalNotes) {
          polyrhythmPattern = polyPattern;
          break;
        }
        noteIndexInPolyrhythm -= totalNotes;
      }
      
      if (polyrhythmPattern) {
        // For polyrhythms, the playbackPosition (noteIndexInBar) is the scheduled note index
        // In stacked mode, this directly maps to the visual note index via data-polyrhythm-note-index
        // The scheduled notes are: 0=both, 1=right, 2=left, 3=right (for 3:2)
        const scheduledNoteIndex = noteIndexInBar;
        
        // Try to find note by data-polyrhythm-note-index attribute (which should match scheduled note index)
        const matchingNotes: Array<{ group: SVGElement; polyIndex: string; voice: string | null }> = [];
        const allPolyIndices: Array<{ group: SVGElement; polyIndex: string | null; voice: string | null }> = [];
        for (const group of noteGroups) {
          const polyIndex = group.getAttribute('data-polyrhythm-note-index');
          const voice = group.getAttribute('data-voice');
          allPolyIndices.push({ group, polyIndex, voice });
          if (polyIndex !== null) {
            const polyIdx = parseInt(polyIndex, 10);
            if (polyIdx === scheduledNoteIndex) {
              matchingNotes.push({ group, polyIndex, voice });
            }
          }
        }
        // If multiple notes match, prefer the one with the correct voice based on scheduled note
        // Use the data-voice attribute from the notes to determine which hand(s) should be highlighted
        // Filter based on polyrhythmClickMode to only highlight the selected hand(s)
        if (matchingNotes.length > 0) {
          // Filter notes based on polyrhythmClickMode
          // Only highlight notes that match the selected hand(s)
          const notesToHighlight = matchingNotes.filter((note) => {
            if (polyrhythmClickMode === 'both') {
              // Highlight all notes
              return true;
            } else if (polyrhythmClickMode === 'right-only') {
              // Only highlight right-hand notes (voice='right' only, not 'both')
              return note.voice === 'right';
            } else if (polyrhythmClickMode === 'left-only') {
              // Only highlight left-hand notes (voice='left' only, not 'both')
              return note.voice === 'left';
            } else {
              // 'metronome-only' or 'none': don't highlight polyrhythm notes (only metronome clicks)
              return false;
            }
          });
          
          // If we have notes to highlight (after filtering)
          if (notesToHighlight.length > 0) {
            // Highlight all filtered notes
            notesToHighlight.forEach((note) => {
                // Apply highlighting to this note
                note.group.classList.add('dpgen-note--active');
                const voice = note.group.getAttribute('data-voice') || note.voice;
                const isPolyrhythmNote = voice === 'left' || voice === 'right' || voice === 'both';
                
                // Determine color from voice
                let highlightColor = '#f97316'; // Default orange
                if (voice === 'right') {
                  highlightColor = '#3b82f6'; // Blue for right hand
                } else if (voice === 'left') {
                  highlightColor = '#10b981'; // Green for left hand
                } else if (voice === 'both') {
                  highlightColor = '#f97316'; // Orange for both
                }
                
                // Set color on note shapes
                const noteShapes = note.group.querySelectorAll('path, circle, ellipse, rect');
                noteShapes.forEach((shape) => {
                  const svgShape = shape as SVGElement;
                  svgShape.setAttribute('fill', highlightColor);
                  svgShape.setAttribute('stroke', highlightColor);
                });
                
                // Set filter color
                const groupEl = note.group as unknown as HTMLElement;
                if (groupEl && isPolyrhythmNote) {
                  const hex = highlightColor.replace('#', '');
                  const r = parseInt(hex.substr(0, 2), 16);
                  const g = parseInt(hex.substr(2, 2), 16);
                  const b = parseInt(hex.substr(4, 2), 16);
                  groupEl.style.filter = `drop-shadow(0 0 6px rgba(${r}, ${g}, ${b}, 0.6))`;
                }
                
                // Highlight annotation using the same highlightColor as the notes
                const annotationGroup = note.group.querySelector('.vf-annotation');
                if (annotationGroup) {
                  // Use the same highlightColor as the notes (determined from voice attribute)
                  const noteVoice = voice;
                  const isLeftVoice = noteVoice === 'left';
                  const isRightVoice = noteVoice === 'right';
                  const isBothVoice = noteVoice === 'both';
                  
                  // Use the same color as the notes
                  const annotationColor = highlightColor;
                  
                  annotationGroup.classList.add('dpgen-annotation--active');
                  if (isLeftVoice) {
                    annotationGroup.classList.add('dpgen-annotation--left');
                  } else if (isRightVoice) {
                    annotationGroup.classList.add('dpgen-annotation--right');
                  } else if (isBothVoice) {
                    annotationGroup.classList.add('dpgen-annotation--both');
                  }
                  
                  const textElements = annotationGroup.querySelectorAll('text, tspan');
                  textElements.forEach((textEl) => {
                    const svgText = textEl as SVGTextElement | SVGTSpanElement;
                    // Clear any previous fill attribute and style first
                    svgText.removeAttribute('fill');
                    (svgText as any).style.fill = '';
                    // Then set the new color (same as note color)
                    svgText.setAttribute('fill', annotationColor);
                    (svgText as any).style.fill = annotationColor; // Also set inline style to override CSS
                    textEl.classList.add('dpgen-annotation--active');
                    if (isLeftVoice) {
                      textEl.classList.add('dpgen-annotation--left');
                    } else if (isRightVoice) {
                      textEl.classList.add('dpgen-annotation--right');
                    } else if (isBothVoice) {
                      textEl.classList.add('dpgen-annotation--both');
                    }
                  });
                }
            });
            
            // Use the first note for scrolling (if enabled), but skip single-note highlighting below
            // since we've already highlighted all notes above
            targetGroup = notesToHighlight[0].group;
            alreadyHighlighted = true;
            
            // Skip the single-note highlighting code below since we've already highlighted all notes
            // We'll still use targetGroup for scrolling if enabled
          } else {
            // No notes match the filter - don't highlight anything
          }
        }
        
        // Fallback: use array index, but only if it matches the expected voice
        if (!targetGroup && notesBeforeTargetBar + noteIndexInBar >= 0 && notesBeforeTargetBar + noteIndexInBar < noteGroups.length) {
          const fallbackGroup = noteGroups[notesBeforeTargetBar + noteIndexInBar];
          const fallbackVoice = fallbackGroup.getAttribute('data-voice');
          
          // Only use fallback if voice matches or if no voice filter is applied
          // For left-only, only use fallback if voice is 'left' or 'both'
          // For right-only, only use fallback if voice is 'right' or 'both'
          // For both, use any voice
          let shouldUseFallback = true;
          if (polyrhythmClickMode === 'left-only') {
            shouldUseFallback = fallbackVoice === 'left' || fallbackVoice === 'both';
          } else if (polyrhythmClickMode === 'right-only') {
            shouldUseFallback = fallbackVoice === 'right' || fallbackVoice === 'both';
          }
          
          if (shouldUseFallback) {
            targetGroup = fallbackGroup;
          }
        }
      }
    } else {
      // Regular pattern: use array index
      const targetNoteIndex = notesBeforeTargetBar + noteIndexInBar;
      
      if (targetNoteIndex >= 0 && targetNoteIndex < noteGroups.length) {
        targetGroup = noteGroups[targetNoteIndex];
      }
    }
    
    if (targetGroup && !alreadyHighlighted) {
      
      // Check if this note is accented by checking if it's in any pattern's accent indices
      let isAccented = false;
      let noteIndexInPattern = playbackPosition;
      
      // Find which pattern this note belongs to
      for (const pattern of patterns) {
        // Calculate actual notes per bar (handles both normal and advanced modes)
        const notesPerBar = getNotesPerBarForPattern(pattern);
        const totalNotes = notesPerBar * (pattern.repeat || 1);
        
        if (noteIndexInPattern < totalNotes) {
          // Check if this note index is in the pattern's accent indices
          const localNoteIndex = noteIndexInPattern % notesPerBar;
          const accentIndices = pattern._presetAccents !== undefined && pattern._presetAccents.length >= 0
            ? pattern._presetAccents
            : []; // No accents if not explicitly set
          
          isAccented = accentIndices.includes(localNoteIndex);
          break;
        }
        
        noteIndexInPattern -= totalNotes;
      }
      
      // Add highlight class to the note group (for subtle glow)
      // Use CSS classes only, matching WordPress plugin approach
      targetGroup.classList.add('dpgen-note--active');
      if (isAccented) {
        targetGroup.setAttribute('data-accented', 'true');
      } else {
        targetGroup.removeAttribute('data-accented');
      }
      
      // Check if this is a polyrhythm note and determine voice
      const voice = targetGroup.getAttribute('data-voice');
      const isPolyrhythmNote = voice === 'left' || voice === 'right' || voice === 'both';
      
      // Use different colors for polyrhythm notes: blue for right, green for left, orange for both
      let highlightColor = '#f97316'; // Default orange
      if (isPolyrhythmNote) {
        if (voice === 'right') {
          highlightColor = '#3b82f6'; // Blue for right hand
        } else if (voice === 'left') {
          highlightColor = '#10b981'; // Green for left hand
        } else if (voice === 'both') {
          highlightColor = '#f97316'; // Orange for both (aligned notes)
        }
      }
      
      // Set color on note shapes
      const noteShapes = targetGroup.querySelectorAll('path, circle, ellipse, rect');
      noteShapes.forEach((shape) => {
        const svgShape = shape as SVGElement;
        svgShape.setAttribute('fill', highlightColor);
        svgShape.setAttribute('stroke', highlightColor);
      });
      
      // Set filter color to match highlight color (override CSS orange glow)
      const groupEl = targetGroup as unknown as HTMLElement;
      if (groupEl && isPolyrhythmNote) {
        // Convert hex to rgba for filter
        const hex = highlightColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        groupEl.style.filter = `drop-shadow(0 0 6px rgba(${r}, ${g}, ${b}, 0.6))`;
      } else if (groupEl) {
        // Default orange for regular notes
        groupEl.style.filter = 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))';
      }
      
      // Find and highlight the annotation (sticking letter) separately
      // Use the same highlightColor as the notes (determined from voice attribute)
      const annotationGroup = targetGroup.querySelector('.vf-annotation');
      if (annotationGroup) {
        // Debug: Log what we're using for annotation color
        
        const isLeftVoice = voice === 'left';
        const isRightVoice = voice === 'right';
        const isBothVoice = voice === 'both';
        
        // Add class to annotation group
        annotationGroup.classList.add('dpgen-annotation--active');
        if (isLeftVoice) {
          annotationGroup.classList.add('dpgen-annotation--left');
        } else if (isRightVoice) {
          annotationGroup.classList.add('dpgen-annotation--right');
        } else if (isBothVoice) {
          annotationGroup.classList.add('dpgen-annotation--both');
        }
        
        // Also highlight text and tspan elements inside the annotation
        // Use the same highlightColor as the notes (determined from voice attribute)
        // Set both attribute and style to ensure color is applied (CSS might override attribute)
        // IMPORTANT: Clear any previous fill styles first to prevent color persistence
        const textElements = annotationGroup.querySelectorAll('text, tspan');
        textElements.forEach((textEl) => {
          const svgText = textEl as SVGTextElement | SVGTSpanElement;
          // Clear any previous fill attribute and style first
          svgText.removeAttribute('fill');
          (svgText as any).style.fill = '';
          // Then set the new color (same as note color)
          svgText.setAttribute('fill', highlightColor);
          (svgText as any).style.fill = highlightColor; // Also set inline style to override CSS
          // Force override any CSS that might be interfering
          (svgText as any).style.setProperty('fill', highlightColor, 'important');
          textEl.classList.add('dpgen-annotation--active');
          if (isLeftVoice) {
            textEl.classList.add('dpgen-annotation--left');
          } else if (isRightVoice) {
            textEl.classList.add('dpgen-annotation--right');
          } else if (isBothVoice) {
            textEl.classList.add('dpgen-annotation--both');
          }
        });
      } else {
        console.warn(`No annotation group found for note (playbackPosition=${playbackPosition}, noteIndexInBar=${noteIndexInBar}, totalGroups=${noteGroups.length})`);
      }
      
      // Scroll to current note if animation is enabled
      if (scrollAnimationEnabled) {
        scrollToCurrentNote(targetGroup);
      }
    } else if (targetGroup && alreadyHighlighted) {
      // Already highlighted all notes above, just scroll if needed
      if (scrollAnimationEnabled) {
        scrollToCurrentNote(targetGroup);
      }
    } else {
      console.warn(`[Highlighting] Could not find note group for playbackPosition ${playbackPosition} (isPolyrhythmBar=${isPolyrhythmBar}, noteIndexInBar=${noteIndexInBar}, notesBeforeTargetBar=${notesBeforeTargetBar}, totalNoteGroups=${noteGroups.length})`);
    }
  }, [playbackPosition, patterns, polyrhythmPatterns, scrollAnimationEnabled, isPlaying]);

  // Clear practice visual feedback when playback starts (MIDI and Microphone)
  // This should clear all colors from the previous session, including the last note
  useEffect(() => {
    if (!staveRef.current || (!midiPractice.enabled && !microphonePractice.enabled)) {
      prevIsPlayingRef.current = isPlaying;
      return;
    }

    // Detect when playback STARTS (transitions from false to true)
    const playbackJustStarted = !prevIsPlayingRef.current && isPlaying;
    
    // Update ref for next check
    prevIsPlayingRef.current = isPlaying;

    // Only clear when playback just started
    if (!playbackJustStarted) {
      return;
    }

    const svgElement = staveRef.current.querySelector('svg');
    if (!svgElement) return;

    // Clear all visual feedback from previous practice attempts (both MIDI and Microphone)
    // This includes the last note's persisted colors
    // IMPORTANT: Don't clear playback highlighting (filter styles from dpgen-note--active)
    // Playback highlighting is managed separately and should persist
    // Get all note elements, excluding grace notes (flams count as ONE note position)
    const allNoteEls = Array.from(svgElement.querySelectorAll('.vf-stavenote')) as SVGElement[];
    
    // Filter out grace notes - they're modifiers of the main note
    const noteGroups = allNoteEls.filter((noteEl) => {
      const parent = noteEl.parentElement;
      const isGraceNote = 
        (parent && (
          parent.classList.contains('vf-gracenotegroup') ||
          parent.classList.contains('vf-gracenote-group') ||
          parent.classList.contains('gracenotegroup') ||
          (parent.tagName === 'g' && parent.querySelector('use[href*="gracenote"]') !== null)
        )) ||
        noteEl.classList.contains('vf-gracenote') ||
        noteEl.getAttribute('data-grace-note') === 'true';
      return !isGraceNote;
    });
    
    noteGroups.forEach((group) => {
      // Clear note element styles (heads, stems, etc.)
      // ONLY clear practice-specific feedback styles
      // DO NOT clear filter - it's used for playback highlighting
      const noteEls = group.querySelectorAll('path, circle, ellipse, rect');
      noteEls.forEach((el) => {
        const svgEl = el as SVGElement;
        // Only clear practice feedback styles
        svgEl.style.fill = ''; // Clear practice fill colors (green/red for hits/misses)
        svgEl.style.stroke = ''; // Clear practice stroke colors
        svgEl.style.strokeWidth = ''; // Clear practice stroke width
        svgEl.style.animation = ''; // Clear practice animations (pulses, etc.)
        // DO NOT clear:
        // - filter: used by playback highlighting (orange glow)
        // - transition: used by playback highlighting
        // - opacity: might be used by playback highlighting
      });

      // Clear annotation styles (sticking letters) - practice feedback only
      // DO NOT clear playback highlighting fill colors (#f97316 orange)
      const annotationGroup = group.querySelector('.vf-annotation');
      if (annotationGroup) {
        const textElements = annotationGroup.querySelectorAll('text, tspan');
        textElements.forEach((textEl) => {
          const svgText = textEl as SVGTextElement | SVGTSpanElement;
          const currentFill = (svgText as any).style?.fill || svgText.getAttribute('fill') || '';
          
          // Only clear fill if it's a practice color (green/red), not playback highlighting (orange/blue)
          // Playback highlighting uses #f97316 (orange) or #3b82f6 (blue)
          const isPracticeColor = currentFill === '#10b981' || currentFill === '#ef4444' || 
                                  currentFill === 'rgb(16, 185, 129)' || currentFill === 'rgb(239, 68, 68)';
          const isPlaybackColor = currentFill === '#f97316' || currentFill === '#3b82f6' ||
                                  currentFill === 'rgb(249, 115, 22)' || currentFill === 'rgb(59, 130, 246)' ||
                                  currentFill.includes('249, 115, 22') || currentFill.includes('59, 130, 246');
          
          // Only clear if it's a practice color, NOT if it's a playback color
          if (isPracticeColor) {
            svgText.style.fill = ''; // Clear practice colors
            svgText.removeAttribute('fill'); // Clear practice fill attribute
          }
          // DO NOT clear playback colors - they should persist
          // Clear practice animations
          svgText.style.animation = '';
          // DO NOT clear transition - it's used by playback highlighting
        });
      }

      // Clear missed note styles (practice feedback)
      // DO NOT clear filter - it's managed by playback highlighting
      const groupEl = group as unknown as HTMLElement;
      // Only clear practice-specific opacity, not filter
      // Filter is managed by playback highlighting code (orange glow)
    });

    // Also clear any timing error text elements from the previous session
    const timingErrors = svgElement.querySelectorAll('.dpgen-timing-error');
    timingErrors.forEach((el) => el.remove());

      // console.log('Cleared practice visual feedback for', noteGroups.length, 'notes (new playback session)');
  }, [isPlaying, midiPractice.enabled, microphonePractice.enabled]);

  // MIDI Practice Hit Highlighting (only if visual feedback is enabled)
  useEffect(() => {
    if (!staveRef.current || !midiPractice.enabled || !midiPractice.visualFeedback) {
      return;
    }

    const svgElement = staveRef.current.querySelector('svg');
    if (!svgElement) return;

    // Get the last hit (most recent)
    const hits = midiPractice.actualHits;
    if (hits.length === 0) return;

    const lastHit = hits[hits.length - 1];
    
    // Find the expected note index for this hit
    // Try to match by expectedTime, allowing for small timing differences
    let expectedNoteIndex = -1;
    let minTimeDiff = Infinity;
    
    midiPractice.expectedNotes.forEach((note, index) => {
      const timeDiff = Math.abs(note.time - lastHit.expectedTime);
      if (timeDiff < minTimeDiff && timeDiff < 100) { // Within 100ms
        minTimeDiff = timeDiff;
        expectedNoteIndex = index;
      }
    });

    if (expectedNoteIndex === -1) return;

    // Find all note groups (same logic as playback highlighting)
    // Filter out grace notes - flams count as ONE note position
    const allNoteEls = Array.from(svgElement.querySelectorAll('.vf-stavenote')) as SVGElement[];
    const noteGroups = allNoteEls.filter((noteEl) => {
      const parent = noteEl.parentElement;
      const isGraceNote = 
        (parent && (
          parent.classList.contains('vf-gracenotegroup') ||
          parent.classList.contains('vf-gracenote-group') ||
          parent.classList.contains('gracenotegroup') ||
          (parent.tagName === 'g' && parent.querySelector('use[href*="gracenote"]') !== null)
        )) ||
        noteEl.classList.contains('vf-gracenote') ||
        noteEl.getAttribute('data-grace-note') === 'true';
      return !isGraceNote;
    });
    if (expectedNoteIndex >= noteGroups.length) return;

    const targetGroup = noteGroups[expectedNoteIndex];
    if (!targetGroup) return;

    // Determine color based on timing error and tolerance window
    // Use the tolerance window (accuracyWindow) to determine color consistently
    const timingError = Math.abs(lastHit.timingError);
    const toleranceWindow = midiPractice.accuracyWindow;
    
    // Debug logging
    
    // Color logic:
    // Green: within tolerance (e.g., ±50ms)
    // Yellow: within 20% outside tolerance (e.g., ±60ms for 50ms tolerance)
    // Red: outside that (e.g., > ±60ms for 50ms tolerance)
    let color: string;
    if (timingError <= toleranceWindow) {
      color = '#10b981'; // Green - within tolerance
    } else if (timingError <= toleranceWindow * 1.2) {
      color = '#f59e0b'; // Yellow - within 20% outside tolerance
    } else {
      color = '#ef4444'; // Red - more than 20% outside tolerance
    }
    
    // Also determine if perfect for animation (use a stricter threshold)
    const isPerfect = timingError <= Math.min(10, toleranceWindow / 5); // 10ms or 1/5 of tolerance, whichever is smaller
    const isEarly = lastHit.early;

    // Highlight the note (including stems)
    // VexFlow uses 'path' elements for note heads and stems
    // Stems are typically paths that are vertical lines or have fill='none'
    const noteEls = targetGroup.querySelectorAll('path, circle, ellipse, rect');
    noteEls.forEach((el) => {
      const svgEl = el as SVGElement;
      const pathEl = el as SVGPathElement;
      const pathData = pathEl.getAttribute ? pathEl.getAttribute('d') : null;
      const originalFill = el.getAttribute('fill');
      
      // Check if this is likely a stem (vertical line path or has fill='none')
      const isLikelyStem = el.tagName === 'path' && pathData && (
        // Vertical line pattern: M x y L x y2 (same x coordinate = vertical)
        (pathData.match(/M\s+([\d.]+)\s+([\d.]+)\s+L\s+\1\s+([\d.]+)/)) ||
        // Or check if fill is explicitly none (stems don't have fill)
        originalFill === 'none' ||
        // Or if it's a very simple path (likely a stem)
        (pathData.match(/^M\s+[\d.]+\s+[\d.]+\s+L\s+[\d.]+\s+[\d.]+$/) && originalFill !== 'black')
      );
      
      svgEl.style.transition = 'all 0.2s ease';
      
      if (isLikelyStem) {
        // For stems, only color the stroke (not fill)
        svgEl.style.stroke = color;
        svgEl.style.strokeWidth = '2';
        svgEl.style.fill = 'none';
      } else {
        // For note heads, color both fill and stroke
        svgEl.style.fill = color;
        svgEl.style.stroke = color;
        svgEl.style.strokeWidth = '2';
      }
      
      // Add pulse animation for perfect hits
      if (isPerfect) {
        svgEl.style.animation = 'pulse 0.3s ease';
      }
    });

    // Highlight the annotation (sticking letter)
    const annotationGroup = targetGroup.querySelector('.vf-annotation');
    if (annotationGroup) {
      const textElements = annotationGroup.querySelectorAll('text, tspan');
      textElements.forEach((textEl) => {
        const svgText = textEl as SVGTextElement | SVGTSpanElement;
        svgText.style.transition = 'all 0.2s ease';
        svgText.style.fill = color;
        
        if (isPerfect) {
          svgText.style.animation = 'pulse 0.3s ease';
        }
      });
    }

    // Show timing error under annotation if enabled
    if (midiPractice.showTimingErrors && annotationGroup) {
      // Remove any existing timing text for this note
      const existingTiming = svgElement.querySelector(`.dpgen-timing-error[data-note-index="${expectedNoteIndex}"]`);
      if (existingTiming) {
        existingTiming.remove();
      }

      // Format timing error (show signed value: + for late, - for early)
      const rawTimingError = lastHit.rawTimingError;
      const sign = rawTimingError >= 0 ? '+' : '';
      const timingText = `${sign}${Math.round(rawTimingError)}ms`;
      
      // Determine color for timing measurement based on tolerance window (same logic as note color)
      const absTimingError = Math.abs(lastHit.timingError);
      const toleranceWindow = midiPractice.accuracyWindow;
      let timingColor: string;
      // Green: within tolerance (e.g., ±50ms)
      // Yellow: within 20% outside tolerance (e.g., ±60ms for 50ms tolerance)
      // Red: outside that (e.g., > ±60ms for 50ms tolerance)
      if (absTimingError <= toleranceWindow) {
        timingColor = '#10b981'; // Green - within tolerance
      } else if (absTimingError <= toleranceWindow * 1.2) {
        timingColor = '#f59e0b'; // Yellow - within 20% outside tolerance
      } else {
        timingColor = '#ef4444'; // Red - more than 20% outside tolerance
      }
      
      // Find the annotation text element to position relative to it
      const textElements = annotationGroup.querySelectorAll('text');
      if (textElements.length > 0) {
        // Use the first text element as reference for positioning
        const refText = textElements[0] as SVGTextElement;
        
        // Get position from SVG text element (uses SVG coordinate space)
        let x = 0;
        let y = 0;
        
        // Try to get position from text element attributes or bounding box
        const xAttr = refText.getAttribute('x');
        const yAttr = refText.getAttribute('y');
        
        if (xAttr && yAttr) {
          // Use attribute values directly (SVG coordinates)
          x = parseFloat(xAttr);
          y = parseFloat(yAttr);
          
          // Position below the text (adjust for font size and spacing)
          // Annotations are typically at yShift 140, so timing should be below that
          y += 25; // Approximate spacing below annotation
        } else {
          // Fallback: use bounding box (convert from screen to SVG coordinates)
          const svgGroup = annotationGroup as unknown as SVGGElement;
          if (svgGroup && typeof svgGroup.getBBox === 'function') {
            const annotationBBox = svgGroup.getBBox();
            x = annotationBBox.x + (annotationBBox.width / 2);
            y = annotationBBox.y + annotationBBox.height + 12;
          } else {
            // Last resort: use text element's bounding box
            const textBBox = refText.getBBox();
            x = textBBox.x + (textBBox.width / 2);
            y = textBBox.y + textBBox.height + 12;
          }
        }
        
        // Create timing text element
        const timingElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        timingElement.setAttribute('class', 'dpgen-timing-error');
        timingElement.setAttribute('data-note-index', expectedNoteIndex.toString());
        timingElement.setAttribute('x', x.toString());
        timingElement.setAttribute('y', y.toString());
        timingElement.setAttribute('font-size', '10px');
        timingElement.setAttribute('fill', timingColor); // Use tolerance-based color
        timingElement.setAttribute('text-anchor', 'middle');
        timingElement.setAttribute('font-weight', '500');
        timingElement.setAttribute('font-family', 'Inter, sans-serif');
        timingElement.setAttribute('dominant-baseline', 'hanging'); // Align from top
        timingElement.textContent = timingText;
        
        // Add to SVG (insert into annotation group so it moves with the annotation)
        annotationGroup.appendChild(timingElement);
        
        // Timing measurements persist (don't clear after 500ms)
        // They'll only be cleared when playback starts (reset effect) or when a new hit occurs for the same note
      }
    }

    // Clear color highlighting after 500ms (but keep timing measurements and last note color if timing is shown)
    const timeoutId = setTimeout(() => {
      // Get current hits to check if this is still the last hit
      const currentHits = midiPractice.actualHits;
      const currentLastHit = currentHits.length > 0 ? currentHits[currentHits.length - 1] : null;
      
      // Only clear colors if timing measurements are NOT shown, or if this is no longer the last hit
      // If timing measurements are shown, keep the colors so they match the timing text
      // Check if this is the last hit by comparing expectedTime and note (more reliable than object reference)
      const isStillLastHit = currentLastHit && 
                             Math.abs(currentLastHit.expectedTime - lastHit.expectedTime) < 1 && 
                             currentLastHit.note === lastHit.note;
      
      // Keep colors if timing measurements are shown AND this is still the last hit
      // OR if timing measurements are not shown but we still want to keep the last note color
      // Keep colors if timing measurements are shown AND this is still the last hit
      // This ensures the last note's color persists when timing measurements are visible
      const shouldKeepColors = midiPractice.showTimingErrors && isStillLastHit;
      
      
      if (!shouldKeepColors) {
        noteEls.forEach((el) => {
          const svgEl = el as SVGElement;
          const pathEl = el as SVGPathElement;
          const pathData = pathEl.getAttribute ? pathEl.getAttribute('d') : '';
          const isLikelyStem = pathEl.tagName === 'path' && pathData && (
            pathData.match(/M\s+([\d.]+)\s+([\d.]+)\s+L\s+\1\s+([\d.]+)/) ||
            (el.getAttribute('fill') === 'none' && el.getAttribute('stroke'))
          );
          
          if (isLikelyStem) {
            // Clear only stroke for stems
            svgEl.style.stroke = '';
            svgEl.style.strokeWidth = '';
            svgEl.style.animation = '';
          } else {
            // Clear both fill and stroke for note heads
            svgEl.style.fill = '';
            svgEl.style.stroke = '';
            svgEl.style.strokeWidth = '';
            svgEl.style.animation = '';
          }
        });
      } else {
      }

      if (annotationGroup) {
        const textElements = annotationGroup.querySelectorAll('text, tspan');
        textElements.forEach((textEl) => {
          const svgText = textEl as SVGTextElement | SVGTSpanElement;
          // Only clear fill if it's not a timing measurement text AND if we're not keeping colors
          // If we're keeping colors (last note with timing shown), preserve the annotation color
          if (!shouldKeepColors) {
            if (!textEl.classList.contains('dpgen-timing-error')) {
              svgText.style.fill = '';
            }
            svgText.style.animation = '';
          }
          // If shouldKeepColors is true, don't clear anything - keep the annotation color
        });
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      // Don't clear timing text on cleanup - let it persist
    };
  }, [midiPractice.actualHits.length, midiPractice.enabled, midiPractice.visualFeedback, midiPractice.showTimingErrors, midiPractice.expectedNotes, midiPractice.accuracyWindow]);

  // Highlight missed notes (if enabled)
  useEffect(() => {
    if (!staveRef.current || !midiPractice.enabled || !midiPractice.showMissedNotes || !isPlaying) {
      return;
    }

    const svgElement = staveRef.current.querySelector('svg');
    if (!svgElement) return;

    // Get current playback time
    if (!midiPractice.startTime) return;
    const currentTime = performance.now() - midiPractice.startTime;
    const gracePeriod = 200; // Don't mark as missed until 200ms after expected time

    // Find all note groups
    const noteGroups = Array.from(svgElement.querySelectorAll('.vf-stavenote')) as SVGElement[];

    // Check each expected note
    midiPractice.expectedNotes.forEach((note, index) => {
      if (index >= noteGroups.length) return;
      
      const noteGroup = noteGroups[index];
      if (!noteGroup) return;

      // Check if note should be highlighted as missed
      const timeSinceExpected = currentTime - note.time;
      const isMissed = !note.matched && timeSinceExpected > gracePeriod && timeSinceExpected < gracePeriod + 500;

      if (isMissed) {
        // Fade out the note to indicate it was missed
        const noteEl = noteGroup as unknown as HTMLElement;
        noteEl.style.opacity = '0.4';
        noteEl.style.filter = 'grayscale(80%)';
        
        // Also fade annotations
        const annotationGroup = noteGroup.querySelector('.vf-annotation');
        if (annotationGroup) {
          const annEl = annotationGroup as unknown as HTMLElement;
          annEl.style.opacity = '0.4';
        }
      }
    });

    return () => {
      // Reset all note opacity when effect cleans up
      noteGroups.forEach((group) => {
        const groupEl = group as unknown as HTMLElement;
        groupEl.style.opacity = '';
        groupEl.style.filter = '';
        const annotationGroup = group.querySelector('.vf-annotation');
        if (annotationGroup) {
          const annEl = annotationGroup as unknown as HTMLElement;
          annEl.style.opacity = '';
        }
      });
    };
  }, [midiPractice.enabled, midiPractice.showMissedNotes, midiPractice.expectedNotes, midiPractice.startTime, isPlaying, playbackPosition]);

  // Microphone Practice Hit Highlighting (only if visual feedback is enabled)
  // This is essentially the same as MIDI practice, but uses microphonePractice state
  useEffect(() => {
    if (!staveRef.current || !microphonePractice.enabled || !microphonePractice.visualFeedback) {
      return;
    }

    const svgElement = staveRef.current.querySelector('svg');
    if (!svgElement) return;
    
    // Clear all timing measurements when hits array is cleared (playback restarted)
    const timingErrors = svgElement.querySelectorAll('.dpgen-timing-error');
    timingErrors.forEach((el) => el.remove());

    // Get all hits (not just the last one)
    const hits = microphonePractice.actualHits;
    if (hits.length === 0) return;

    // Find all note groups
    const noteGroups = Array.from(svgElement.querySelectorAll('.vf-stavenote')) as SVGElement[];
    if (noteGroups.length === 0) return;

    const toleranceWindow = microphonePractice.accuracyWindow;

    // Track which notes already have timing measurements to prevent overwriting
    const notesWithTiming = new Set<number>();

    // Process each hit and color the corresponding note
    // Filter to only process matched hits (hits that actually matched an expected note)
    // Unmatched hits have note: '?', expectedTime: 0, timingError: Infinity
    const matchedHits = hits.filter(hit => {
      // Skip unmatched hits - they have note: '?' or timingError: Infinity
      if (hit.note === '?' || !isFinite(hit.timingError) || hit.timingError === Infinity) {
        return false;
      }
      return true; // Process all matched hits (including Note 0 which may have expectedTime: 0)
    });
    
    matchedHits.forEach((hit) => {
      
      // Find the expected note index for this hit by matching expectedTime
      // hit.expectedTime should match one of the expected notes' time values
      let expectedNoteIndex = -1;
      let minTimeDiff = Infinity;
      
      microphonePractice.expectedNotes.forEach((note, index) => {
        const timeDiff = Math.abs(note.time - hit.expectedTime);
        // Use a reasonable window (100ms) to match hits to their expected notes
        if (timeDiff < minTimeDiff && timeDiff < 100) {
          minTimeDiff = timeDiff;
          expectedNoteIndex = index;
        }
      });

      if (expectedNoteIndex === -1 || expectedNoteIndex >= noteGroups.length) {
        return; // Skip if no matching note found
      }
      
      // Skip if this note already has a timing measurement (only show first hit per note)
      const hasTiming = notesWithTiming.has(expectedNoteIndex);

      const targetGroup = noteGroups[expectedNoteIndex];
      if (!targetGroup) return;

      // Determine color based on timing error and tolerance window
      // Use the timingError from the hit object (already absolute) for consistency
      // But verify it matches rawTimingError
      const absRawTimingError = Math.abs(hit.rawTimingError);
      const timingError = hit.timingError; // This is already absolute from useMicrophonePractice
      
      // Use the absolute value of rawTimingError for color to match what's displayed
      const timingErrorForColor = absRawTimingError;
      
      let color: string;
      if (timingErrorForColor <= toleranceWindow) {
        color = '#10b981'; // Green - within tolerance
      } else if (timingErrorForColor <= toleranceWindow * 1.2) {
        color = '#f59e0b'; // Yellow - within 20% outside tolerance
      } else {
        color = '#ef4444'; // Red - more than 20% outside tolerance
      }
      
      // Debug logging for all notes to diagnose color issue
      if (expectedNoteIndex === 0 || timingErrorForColor > toleranceWindow) {
      }
      
      const isPerfect = timingError <= Math.min(10, toleranceWindow / 5);

      // Highlight the note (including stems)
      const noteEls = targetGroup.querySelectorAll('path, circle, ellipse, rect');
      noteEls.forEach((el) => {
        const svgEl = el as SVGElement;
        const pathEl = el as SVGPathElement;
        const pathData = pathEl.getAttribute ? pathEl.getAttribute('d') : null;
        const originalFill = el.getAttribute('fill');
        
        const isLikelyStem = el.tagName === 'path' && pathData && (
          (pathData.match(/M\s+([\d.]+)\s+([\d.]+)\s+L\s+\1\s+([\d.]+)/)) ||
          originalFill === 'none' ||
          (pathData.match(/^M\s+[\d.]+\s+[\d.]+\s+L\s+[\d.]+\s+[\d.]+$/) && originalFill !== 'black')
        );
        
        svgEl.style.transition = 'all 0.2s ease';
        
        if (isLikelyStem) {
          svgEl.style.stroke = color;
          svgEl.style.strokeWidth = '2';
          svgEl.style.fill = 'none';
        } else {
          svgEl.style.fill = color;
          svgEl.style.stroke = color;
          svgEl.style.strokeWidth = '2';
        }
        
        if (isPerfect) {
          svgEl.style.animation = 'pulse 0.3s ease';
        }
      });

      // Highlight the annotation (sticking letter)
      const annotationGroup = targetGroup.querySelector('.vf-annotation');
      if (annotationGroup) {
        const textElements = annotationGroup.querySelectorAll('text, tspan');
        textElements.forEach((textEl) => {
          const svgText = textEl as SVGTextElement | SVGTSpanElement;
          svgText.style.transition = 'all 0.2s ease';
          svgText.style.fill = color;
          
          if (isPerfect) {
            svgText.style.animation = 'pulse 0.3s ease';
          }
        });
      }

      // Show timing error under annotation if enabled (only for first hit per note)
      if (microphonePractice.showTimingErrors && annotationGroup && !hasTiming) {
        const existingTiming = svgElement.querySelector(`.dpgen-timing-error[data-note-index="${expectedNoteIndex}"]`);
        if (existingTiming) {
          existingTiming.remove();
        }

        const rawTimingError = hit.rawTimingError;
        const sign = rawTimingError >= 0 ? '+' : '';
        const timingText = `${sign}${Math.round(rawTimingError)}ms`;
        
        // Use rawTimingError for color calculation to match the note color logic
        const absTimingError = Math.abs(rawTimingError);
        let timingColor: string;
        if (absTimingError <= toleranceWindow) {
          timingColor = '#10b981';
        } else if (absTimingError <= toleranceWindow * 1.2) {
          timingColor = '#f59e0b';
        } else {
          timingColor = '#ef4444';
        }
        
        const textElements = annotationGroup.querySelectorAll('text');
        if (textElements.length > 0) {
          const refText = textElements[0] as SVGTextElement;
          
          let x = 0;
          let y = 0;
          
          const xAttr = refText.getAttribute('x');
          const yAttr = refText.getAttribute('y');
          
          if (xAttr && yAttr) {
            x = parseFloat(xAttr);
            y = parseFloat(yAttr);
            y += 25;
          } else {
            const svgGroup = annotationGroup as unknown as SVGGElement;
            if (svgGroup && typeof svgGroup.getBBox === 'function') {
              const annotationBBox = svgGroup.getBBox();
              x = annotationBBox.x + (annotationBBox.width / 2);
              y = annotationBBox.y + annotationBBox.height + 12;
            } else {
              const textBBox = refText.getBBox();
              x = textBBox.x + (textBBox.width / 2);
              y = textBBox.y + textBBox.height + 12;
            }
          }
          
          const timingElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          timingElement.setAttribute('class', 'dpgen-timing-error');
          timingElement.setAttribute('data-note-index', expectedNoteIndex.toString());
          timingElement.setAttribute('x', x.toString());
          timingElement.setAttribute('y', y.toString());
          timingElement.setAttribute('font-size', '10px');
          timingElement.setAttribute('fill', timingColor);
          timingElement.setAttribute('text-anchor', 'middle');
          timingElement.setAttribute('font-weight', '500');
          timingElement.setAttribute('font-family', 'Inter, sans-serif');
          timingElement.setAttribute('dominant-baseline', 'hanging');
          timingElement.textContent = timingText;
          
          annotationGroup.appendChild(timingElement);
          
          // Mark this note as having a timing measurement
          notesWithTiming.add(expectedNoteIndex);
        }
      }
    });

    // Keep colors for last hit if showTimingErrors is enabled
    const lastHit = hits[hits.length - 1];

    // Clear color highlighting after 500ms (but keep timing measurements and last note color if timing is shown)
    // Only clear colors if showTimingErrors is disabled - otherwise keep them visible
    if (!microphonePractice.showTimingErrors) {
      const timeoutId = setTimeout(() => {
        const currentHits = microphonePractice.actualHits;
        const currentLastHit = currentHits.length > 0 ? currentHits[currentHits.length - 1] : null;
        
        const isStillLastHit = currentLastHit && 
                               Math.abs(currentLastHit.expectedTime - lastHit.expectedTime) < 1 && 
                               currentLastHit.note === lastHit.note;
        
        if (!isStillLastHit) {
          // Clear all colors from all note groups (not just the last one)
          noteGroups.forEach((group) => {
            const noteEls = group.querySelectorAll('path, circle, ellipse, rect');
            noteEls.forEach((el) => {
              const svgEl = el as SVGElement;
              const pathEl = el as SVGPathElement;
              const pathData = pathEl.getAttribute ? pathEl.getAttribute('d') : '';
              const isLikelyStem = pathEl.tagName === 'path' && pathData && (
                pathData.match(/M\s+([\d.]+)\s+([\d.]+)\s+L\s+\1\s+([\d.]+)/) ||
                (el.getAttribute('fill') === 'none' && el.getAttribute('stroke'))
              );
              
              if (isLikelyStem) {
                svgEl.style.stroke = '';
                svgEl.style.strokeWidth = '';
                svgEl.style.animation = '';
              } else {
                svgEl.style.fill = '';
                svgEl.style.stroke = '';
                svgEl.style.strokeWidth = '';
                svgEl.style.animation = '';
              }
            });

            const annotationGroup = group.querySelector('.vf-annotation');
            if (annotationGroup) {
              const textElements = annotationGroup.querySelectorAll('text, tspan');
              textElements.forEach((textEl) => {
                const svgText = textEl as SVGTextElement | SVGTSpanElement;
                if (!textEl.classList.contains('dpgen-timing-error')) {
                  svgText.style.fill = '';
                }
                svgText.style.animation = '';
              });
            }
          });
        }
      }, 500);

      return () => {
        clearTimeout(timeoutId);
      };
    }
    // Clear all timing measurements if hits array is empty (playback just started)
    if (hits.length === 0) {
      const timingErrors = svgElement.querySelectorAll('.dpgen-timing-error');
      timingErrors.forEach((el) => el.remove());
      return; // Don't process anything if there are no hits yet
    }
    
    // Process hits and add timing measurements...
  }, [microphonePractice.actualHits.length, microphonePractice.enabled, microphonePractice.visualFeedback, microphonePractice.showTimingErrors, microphonePractice.expectedNotes, microphonePractice.accuracyWindow]);
  
  /**
   * Scroll to the current note during playback
   * Based on WordPress plugin's scrollToCurrentNote function
   */
  function scrollToCurrentNote(noteElement: SVGElement) {
    if (!staveRef.current || !scrollAnimationEnabled) return;
    
    // Find the scrollable container - could be stave surface or its wrapper
    // Try to find scrollable parent (wrapper) or use stave itself
    let scrollContainer: HTMLElement | null = staveRef.current.parentElement;
    if (!scrollContainer) {
      scrollContainer = staveRef.current;
    }
    
    // Check if wrapper is scrollable, otherwise check stave surface
    const isWrapperScrollable = scrollContainer.scrollWidth > scrollContainer.clientWidth;
    if (!isWrapperScrollable) {
      scrollContainer = staveRef.current; // Try stave surface itself
      if (scrollContainer.scrollWidth <= scrollContainer.clientWidth) {
        return; // Nothing to scroll
      }
    }
    
    // Get the note element's position relative to the SVG
    const svgElement = scrollContainer.querySelector('svg');
    if (!svgElement) return;
    
    const noteRect = noteElement.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    
    // Calculate the note's center position relative to the container
    const noteCenterX = noteRect.left - containerRect.left + noteRect.width / 2;
    const containerCenterX = containerRect.width / 2;
    
    // Calculate scroll offset to center the note in the visible area
    const margin = 50; // Minimum margin from edges
    const scrollOffset = noteCenterX - containerCenterX;
    
    // Only scroll if note is outside the visible area (with some margin)
    if (Math.abs(scrollOffset) > margin) {
      // Smooth scroll
      scrollContainer.scrollBy({
        left: scrollOffset,
        behavior: 'smooth'
      });
    }
  }

  return (
    <div className="dpgen-stave" style={{ width: '100%', overflow: 'hidden' }}>
      <div ref={staveRef} className="dpgen-stave__surface" style={{ width: '100%', overflow: 'hidden', maxWidth: '100%' }} />
    </div>
  );
}

/**
 * Build notes for a pattern
 */
function buildNotes({
  subdivision,
  notesPerBar,
  drumPatternTokens,
  stickingTokens,
  timeSignature,
  leftFoot,
  rightFoot,
  accentIndices,
  darkMode,
  practicePadMode,
  stickingIndexOffset = 0, // Global sticking index offset for patterns spanning multiple bars
  perBeatSubdivisions, // Optional per-beat subdivisions for advanced mode
}: {
  subdivision: number;
  notesPerBar: number;
  drumPatternTokens: string[];
  stickingTokens: string[];
  timeSignature: [number, number];
  leftFoot: boolean;
  rightFoot: boolean;
  accentIndices: number[];
  darkMode: boolean;
  practicePadMode: boolean;
  stickingIndexOffset?: number;
  perBeatSubdivisions?: number[];
}) {
  if (typeof window === 'undefined') {
    return { tickables: [], beams: [] };
  }
  // Try multiple ways VexFlow might be exposed
  let VF: any = null;
  if ((window as any).VF) {
    VF = (window as any).VF;
  } else if ((window as any).Vex && (window as any).Vex.Flow) {
    VF = (window as any).Vex.Flow;
  } else if ((window as any).VexFlow) {
    VF = (window as any).VexFlow;
  }
  if (!VF) {
    console.error('VexFlow not available in buildNotes');
    return { tickables: [], beams: [] };
  }
  // Calculate note positions and durations if using per-beat subdivisions
  let notePositions: number[] | undefined;
  let notesPerBeatArray: number[] | undefined;
  let beatSubdivisions: number[] | undefined;
  
  if (perBeatSubdivisions) {
    const timeSignatureStr = `${timeSignature[0]}/${timeSignature[1]}`;
    notePositions = calculateNotePositionsFromPerBeatSubdivisions(timeSignatureStr, perBeatSubdivisions);
    const result = calculateNotesPerBarFromPerBeatSubdivisions(timeSignatureStr, perBeatSubdivisions);
    notesPerBeatArray = result.notesPerBeat;
    beatSubdivisions = perBeatSubdivisions;
  }
  
  // Default note duration (used when not in advanced mode)
  const defaultNoteDuration = subdivision === 4 ? 'q' : subdivision === 8 ? '8' : '16';
  const defaultNotesPerBeat = Math.max(1, subdivision / 4);

  const rawNotes: any[] = [];
  const noteDurations: string[] = []; // Track duration for each note for beaming
  const noteBeats: number[] = []; // Track which beat each note belongs to for beaming
  const ghostNoteIndices: Set<number> = new Set(); // Track which note indices are ghost notes
  const ghostNoteDurations: Map<number, string> = new Map(); // Track duration for each ghost note

  // Build notes - notesPerBar represents the entire bar
  for (let i = 0; i < notesPerBar; i++) {
    // Determine which beat this note belongs to and its duration
    let noteDuration: string;
    let notesPerBeat: number;
    let currentBeat: number;
    
    if (perBeatSubdivisions && notesPerBeatArray && beatSubdivisions && notePositions) {
      // Use note position to determine which beat this note belongs to
      const notePosition = notePositions[i];
      currentBeat = Math.floor(notePosition);
      
      // Get subdivision for this beat
      const beatSubdivision = beatSubdivisions[currentBeat];
      noteDuration = beatSubdivision === 4 ? 'q' : beatSubdivision === 8 ? '8' : beatSubdivision === 12 ? '8' : beatSubdivision === 16 ? '16' : beatSubdivision === 24 ? '16' : '32';
      notesPerBeat = notesPerBeatArray[currentBeat];
    } else {
      // Normal mode - use default values
      noteDuration = defaultNoteDuration;
      notesPerBeat = defaultNotesPerBeat;
      currentBeat = Math.floor(i / notesPerBeat);
    }
    // Use note index to map to drum pattern (repeats based on note position, not phrase group)
    // This ensures drum patterns stay consistent regardless of accent positions
    const drumToken = drumPatternTokens[i % drumPatternTokens.length];
    const normalizedToken = drumToken.replace(/\+/g, ' ');
    let voicingTokens = normalizedToken.split(/\s+/).filter(Boolean);
    
    // Detect ghost notes (parentheses notation, e.g., "(S)", "(K)")
    // Check if the token or any part of it is in parentheses
    // Note: drumPatternTokens are already uppercase, so we check for "(S)", "(K)", etc.
    let isGhostNote = false;
    const processedTokens: string[] = [];
    
    // Check the original drumToken (before splitting) for parentheses
    // This handles cases like "(S)" as a single token
    if (drumToken.includes('(') && drumToken.includes(')')) {
      isGhostNote = true;
    }
    
    for (const token of voicingTokens) {
      // Check if token is wrapped in parentheses (ghost note)
      const ghostMatch = token.match(/^\((.*?)\)$/);
      if (ghostMatch) {
        isGhostNote = true;
        processedTokens.push(ghostMatch[1].toUpperCase()); // Extract the note without parentheses, ensure uppercase
      } else {
        processedTokens.push(token);
        // Also check if token contains parentheses (e.g., "(S)+K")
        if (token.includes('(') || token.includes(')')) {
          isGhostNote = true;
          // Extract non-parenthesized parts
          const cleaned = token.replace(/\([^)]*\)/g, '').trim();
          if (cleaned) {
            processedTokens[processedTokens.length - 1] = cleaned.toUpperCase();
          }
        }
      }
    }
    
    voicingTokens = processedTokens;
    
    // Practice Pad Mode: override voicing to always show "S" (snare) regardless of actual pattern
    if (practicePadMode && voicingTokens.length > 0) {
      // Keep non-rest tokens but replace them with "S"
      const hasNonRest = voicingTokens.some((token) => token !== '-' && token !== 'R');
      if (hasNonRest) {
        // Replace all non-rest tokens with "S"
        voicingTokens = voicingTokens.map((token) => token === '-' || token === 'R' ? token : 'S');
      }
    }
    
    // Rest is now "-" to match sticking pattern code
    const isRest = voicingTokens.length === 0 || voicingTokens.every((token) => token === '-' || token === 'R');

    if (isRest) {
      const restNote = new VF.StaveNote({
        clef: 'percussion',
        keys: ['b/4'],
        duration: `${noteDuration}r`,
      });
      rawNotes.push(restNote);
      noteDurations.push(noteDuration); // Store duration for rest notes too
      noteBeats.push(currentBeat); // Store beat number for rest notes too
      continue;
    }

    const keys: string[] = [];
    for (const token of voicingTokens) {
      // Ignore rest tokens (both "-" and legacy "R")
      if (token !== '-' && token !== 'R') {
        // Normalize two-letter codes to single letters for VexFlow compatibility
        // VexFlow percussion clef appears to have issues with two-letter token names
        // Since M and I work when used directly, always normalize Ht/Mt to I/M
        let normalizedToken = token.toUpperCase();
        if (normalizedToken === 'HT') normalizedToken = 'I'; // High tom -> I (inner/high)
        else if (normalizedToken === 'MT') normalizedToken = 'M'; // Mid tom -> M (mid)
        // For single-letter tokens, keep them as-is (already uppercase from toUpperCase())
        // For other tokens, convert to uppercase for lookup
        else if (token.length === 1) normalizedToken = token.toUpperCase();
        else normalizedToken = token.toUpperCase();
        
        // Look up in keyMap using the normalized token
        // M and I are confirmed to work with VexFlow percussion clef
        const position = keyMap[normalizedToken];
        if (position) {
          keys.push(position);
        }
      }
    }

    if (keys.length === 0) {
      keys.push(keyMap.S);
    }

    const isQuarterPosition = i % notesPerBeat === 0;

    if (leftFoot && isQuarterPosition) {
      keys.push('d/4/x');
    }

    const hasKick = drumToken.toUpperCase().includes('K');
    if (rightFoot && isQuarterPosition && !hasKick) {
      keys.push(keyMap.K);
    }

    const staveNote = new VF.StaveNote({
      clef: 'percussion',
      keys,
      duration: noteDuration,
      stem_direction: -1,
    });

    // Apply ghost note styling if detected
    // Track ghost note indices - parentheses will be added as SVG text after rendering
    if (isGhostNote) {
      (staveNote as any).isGhostNote = true;
      const noteIndex = rawNotes.length;
      ghostNoteIndices.add(noteIndex); // Track this note index as a ghost note
      ghostNoteDurations.set(noteIndex, noteDuration); // Store duration for this ghost note
    }

    // For percussion clef, VexFlow may not respect key positions for vertical placement
    // Instead, we'll try using note properties to force different positions
    // Check if the note has methods to set position manually
    if (keys.length > 0) {
      // Try to manually set Y position if method exists
      if (typeof (staveNote as any).setStaveY === 'function') {
        const key = keys[0];
        // Map each key to a Y position offset from the stave center
        const yPositionMap: Record<string, number> = {
          'g/5': -40,     // Top space - Hi-hat (above stave)
          'e/6': -30,     // High Tom (octave 6 - above staff)
          'b/5': -15,     // Mid Tom (octave 5 - above snare)
          'f/5': -30,     // Top line - High Tom (alternative)
          'e/5': -20,     // 2nd line from top - High Tom (alternative)
          'd/5': -10,     // 2nd space from top - Mid Tom
          'c/5': 0,       // Middle space - Snare (center)
          'b/4': 10,      // Below middle - Rest
          'a/4': 20,      // Below middle - Floor Tom
          'f/4': 30,      // Bottom space - Kick
        };
        
        const yPos = yPositionMap[key] || 0; // Default to center
        (staveNote as any).setStaveY(yPos);
      }
      
      // Alternative: Try setting Y position via note properties
      if (typeof (staveNote as any).setYShift === 'function') {
        const key = keys[0];
        const yShiftMap: Record<string, number> = {
          'g/5': -40,     // Top space - Hi-hat
          'e/6': -30,     // High Tom (octave 6 - above staff)
          'b/5': -15,     // Mid Tom (octave 5 - above snare)
          'f/5': -30,     // Top line - High Tom (alternative)
          'e/5': -20,     // 2nd line from top
          'd/5': -10,     // 2nd space from top - Mid Tom
          'c/5': 0,       // Middle space - Snare
          'b/4': 10,      // Below middle
          'a/4': 20,      // Below middle - Floor Tom
          'f/4': 30,      // Bottom space - Kick
        };
        
        const yShift = yShiftMap[key] || 0;
        (staveNote as any).setYShift(yShift);
      }
    }

    // Add accent if needed
    if (accentIndices.includes(i)) {
      try {
        const accent = new VF.Articulation('a>');
        // Don't set position - let VexFlow use default
        // The error suggests setPosition is causing issues with the draw method
        // Set Y shift if method exists
        if (typeof accent.setYShift === 'function') {
          accent.setYShift(-8);
        }
        staveNote.addModifier(accent, 0);
      } catch (e) {
        console.error('Failed to add accent:', e);
        // If accent fails, continue without it - better than crashing
      }
    }

    // Add sticking annotation - use global sticking index offset to allow patterns to span multiple bars
    // Note: Flam tokens (Rl, Lr) count as ONE note position, not two - they are single tokens in the array
    const globalStickingIndex = stickingIndexOffset + i;
    const sticking = stickingTokens.length > 0 ? stickingTokens[globalStickingIndex % stickingTokens.length] : '';
    
    // Check for flam, drag, or ruff notation
    // Flam: "lR" or "rL" (one lowercase grace note + uppercase main note)
    // Drag: "llR" or "rrL" (two lowercase grace notes + uppercase main note)
    // Ruff: "lllR" or "rrrL" (three lowercase grace notes + uppercase main note)
    // Match patterns like "lR", "rL", "llR", "rrL", "lllR", "rrrL", etc.
    const ornamentMatch = sticking && typeof sticking === 'string' ? sticking.match(/^([lr]+)([RLK])$/) : null;
    let hasOrnament = false;
    let graceNoteStickings: string[] = [];
    let mainNoteSticking = sticking;
    let ornamentType: 'flam' | 'drag' | 'ruff' | null = null;
    
    if (ornamentMatch) {
      const graceNotes = ornamentMatch[1]; // e.g., "l", "ll", "lll"
      const mainNote = ornamentMatch[2]; // e.g., "R", "L", "K"
      
      if (graceNotes.length === 1) {
        ornamentType = 'flam';
      } else if (graceNotes.length === 2) {
        ornamentType = 'drag';
      } else if (graceNotes.length >= 3) {
        ornamentType = 'ruff';
      }
      
      hasOrnament = true;
      graceNoteStickings = graceNotes.split('').map(g => g.toUpperCase()); // Convert to array of uppercase letters
      mainNoteSticking = mainNote;
      
      try {
        // Create grace notes (small notes before main note) for flam/drag/ruff
        // Grace notes use same position as main note (typically snare)
        const graceNotePosition = keys.length > 0 ? keys[0] : keyMap.S;
        
        // Create multiple grace notes for drags/ruffs, single for flams
        const graceNotesArray: any[] = [];
        for (let j = 0; j < graceNotes.length; j++) {
          const graceNote = new VF.GraceNote({
            keys: [graceNotePosition],
            duration: '16', // Use 16th note duration for grace notes (shorter for drags/ruffs)
            slash: true, // Slash through notehead for all ornaments
            stem_direction: -1,
          });
          
          // Mark the grace note so we can identify it later (for filtering in collectNoteRefs)
          if ((graceNote as any).setAttribute) {
            (graceNote as any).setAttribute('data-grace-note', 'true');
            (graceNote as any).setAttribute('data-ornament-type', ornamentType || 'flam');
          }
          
          graceNotesArray.push(graceNote);
        }
        
        // Create a grace note group and associate it with the main note
        // The 'true' parameter adds a slur between grace notes and main note
        const graceNoteGroup = new VF.GraceNoteGroup(graceNotesArray, true);
        
        // Mark the grace note group as well
        if ((graceNoteGroup as any).setAttribute) {
          (graceNoteGroup as any).setAttribute('data-grace-note-group', 'true');
          (graceNoteGroup as any).setAttribute('data-ornament-type', ornamentType || 'flam');
        }
        
        // Add the grace note group as a modifier to the main note
        staveNote.addModifier(graceNoteGroup, 0);
      } catch (e: any) {
        console.error(`Failed to add ${ornamentType} grace notes:`, e, e?.stack);
        // Continue without grace notes if it fails
      }
    }
    
    // Add sticking annotation (use base sticking for display)
    if (sticking && sticking !== '-' && !hasOrnament) {
      try {
        // Display the sticking notation (R, L, K, etc.)
        const annotation = new VF.Annotation(sticking);
        annotation.setFont('Inter', 16, 'bold');
        if (darkMode) {
          annotation.setStyle({ fillStyle: '#ffffff', strokeStyle: '#ffffff' });
        }
        annotation.setJustification(1); // CENTER
        annotation.setVerticalJustification(2); // BOTTOM
        // Position annotation below the stave - increase Y shift significantly
        annotation.setYShift(140); // Increased to position well below stave
        staveNote.addModifier(annotation, 0);
      } catch (e) {
        console.error('Failed to create annotation:', e);
      }
    } else if (hasOrnament && mainNoteSticking) {
      // Add annotation showing full ornament pattern (e.g., "lR", "llR", "lllR") for flam/drag/ruff
      // Format: lowercase grace note letter(s) + uppercase main note letter
      try {
        // Show the full ornament pattern (e.g., "lR", "llR", "lllR") so users can see all letters
        const ornamentAnnotation = new VF.Annotation(sticking); // Use original sticking pattern
        ornamentAnnotation.setFont('Inter', 16, 'bold');
        if (darkMode) {
          ornamentAnnotation.setStyle({ fillStyle: '#ffffff', strokeStyle: '#ffffff' });
        }
        ornamentAnnotation.setJustification(1); // CENTER
        ornamentAnnotation.setVerticalJustification(2); // BOTTOM
        ornamentAnnotation.setYShift(140); // Position annotation below the stave
        staveNote.addModifier(ornamentAnnotation, 0);
      } catch (e) {
        console.error('Failed to create flam annotation:', e);
      }
    }

    rawNotes.push(staveNote);
    noteDurations.push(noteDuration); // Store duration for beaming
    noteBeats.push(currentBeat); // Store beat number for beaming
  }

  // Create beams
  // Only beam notes shorter than quarter notes (8th, 16th, 32nd, etc.)
  // With per-beat subdivisions, we need to check each note's duration individually
  const beams: any[] = [];
  
  if (perBeatSubdivisions) {
    // Advanced mode: group notes by their actual duration AND beat
    // Only beam consecutive notes with the same duration that are in the SAME BEAT and shorter than quarter notes
    // Rests should be included in beam groups if they're within the same beat and duration
    let currentBeamGroup: any[] = [];
    let currentBeamDuration: string | null = null;
    let currentBeamBeat: number | null = null;
    
    for (let i = 0; i < rawNotes.length; i++) {
      const note = rawNotes[i];
      const isRest = typeof note.isRest === 'function' ? note.isRest() : false;
      const noteDuration = noteDurations[i]; // Get duration from our stored array
      const noteBeat = noteBeats[i]; // Get beat number from our stored array
      
      // Only beam notes shorter than quarter note (8, 16, 32, etc.)
      // Quarter note duration is 'q'
      const canBeam = noteDuration && noteDuration !== 'q' && noteDuration !== 'qr';
      
      if (canBeam && currentBeamBeat === noteBeat && currentBeamDuration === noteDuration) {
        // Same beat and duration - add to current group (including rests)
        currentBeamGroup.push(note);
      } else if (canBeam) {
        // Different beat or duration - finish current group and start new one
        if (currentBeamGroup.length > 1) {
          try {
            beams.push(new VF.Beam(currentBeamGroup));
          } catch (e) {
            console.warn('Failed to create beam:', e);
          }
        }
        // Start new group (even if it's a rest, we'll add notes to it)
        currentBeamGroup = [note];
        currentBeamDuration = noteDuration;
        currentBeamBeat = noteBeat;
      } else {
        // Can't beam this note (quarter note) - finish current group
        if (currentBeamGroup.length > 1) {
          try {
            beams.push(new VF.Beam(currentBeamGroup));
          } catch (e) {
            console.warn('Failed to create beam:', e);
          }
        }
        currentBeamGroup = [];
        currentBeamDuration = null;
        currentBeamBeat = null;
      }
    }
    
    // Finish any remaining beam group
    if (currentBeamGroup.length > 1) {
      try {
        beams.push(new VF.Beam(currentBeamGroup));
      } catch (e) {
        console.warn('Failed to create beam:', e);
      }
    }
  } else {
    // Normal mode: use single subdivision
    if (subdivision !== 4) {
      const groupSize = subdivision === 12 ? 3 : subdivision === 24 ? 6 : subdivision === 32 ? 8 : subdivision / 4;
      for (let i = 0; i < rawNotes.length; i += groupSize) {
        const group = rawNotes.slice(i, i + groupSize).filter((note) => {
          if (typeof note.isRest === 'function' && note.isRest()) return false;
          // Only beam notes shorter than quarter note
          const noteDuration = noteDurations[i];
          return noteDuration && noteDuration !== 'q' && noteDuration !== 'qr';
        });
        if (group.length > 1) {
          try {
            beams.push(new VF.Beam(group));
          } catch (e) {
            console.warn('Failed to create beam:', e);
          }
        }
      }
    }
  }

  return { 
    tickables: rawNotes, 
    beams, 
    ghostNoteIndices: Array.from(ghostNoteIndices),
    ghostNoteDurations: Object.fromEntries(ghostNoteDurations) // Convert Map to object for easier access
  };
}

/**
 * Build notes for polyrhythm pattern using VexFlow Voice/Tuplet system
 * This properly notates polyrhythms with each rhythm using its own subdivision
 * For example, 4:3 polyrhythm = 4 quarter notes vs 3 notes in a tuplet
 */
function buildPolyrhythmNotes({
  subdivision,
  notesPerBar,
  drumPatternTokens,
  stickingTokens,
  timeSignature,
  accentIndices,
  darkMode,
  polyrhythmPattern,
  displayMode,
}: {
  subdivision: number;
  notesPerBar: number;
  drumPatternTokens: string[];
  stickingTokens: string[];
  timeSignature: [number, number];
  accentIndices: number[];
  darkMode: boolean;
  polyrhythmPattern: PolyrhythmPattern;
  displayMode: 'stacked' | 'two-staves';
}) {
  if (typeof window === 'undefined') {
    return { tickables: [], beams: [], rightVoiceNotes: [], leftVoiceNotes: [], needsTuplet: false, tupletConfig: null };
  }
  
  let VF: any = null;
  if ((window as any).VF) {
    VF = (window as any).VF;
  } else if ((window as any).Vex && (window as any).Vex.Flow) {
    VF = (window as any).Vex.Flow;
  } else if ((window as any).VexFlow) {
    VF = (window as any).VexFlow;
  }
  
  if (!VF) {
    console.error('VexFlow not available in buildPolyrhythmNotes');
    return { tickables: [], beams: [], rightVoiceNotes: [], leftVoiceNotes: [], needsTuplet: false, tupletConfig: null };
  }

  const [beatsPerBar, beatValue] = timeSignature;
  const { numerator, denominator } = polyrhythmPattern.ratio;
  
  // Calculate positions using the new beat-based calculator
  const positions = calculatePolyrhythmPositions(numerator, denominator, beatsPerBar);
  
  // Calculate durations and tuplet configurations
  const durations = calculatePolyrhythmDurations(numerator, denominator, beatsPerBar, beatValue);
  
  // Voice to key map
  const voiceToKey: Record<string, string> = {
    snare: 'c/5',  // S
    kick: 'f/4',   // K
    'hi-hat': 'g/5/x', // H (X note head)
    tom: 'e/5',    // T
    floor: 'a/4',  // F
  };
  
  const rightVoiceKey = voiceToKey[polyrhythmPattern.rightRhythm.voice] || keyMap.S;
  const leftVoiceKey = voiceToKey[polyrhythmPattern.leftRhythm.voice] || keyMap.K;

  // Limb to sticking annotation
  const limbToSticking: Record<string, string> = {
    'right-hand': 'R',
    'left-hand': 'L',
    'right-foot': 'RF',
    'left-foot': 'LF',
  };
  
  const rightSticking = limbToSticking[polyrhythmPattern.rightRhythm.limb] || 'R';
  const leftSticking = limbToSticking[polyrhythmPattern.leftRhythm.limb] || 'L';

  // Build right rhythm voice (numerator notes)
  const rightNotes: any[] = [];
  const alignedLeftIndices = new Set<number>();
  
  // Check if we're using 'stacked' mode (single stave with combined notes)
  const useStackedMode = displayMode === 'stacked';
  
  // Get accent indices for each hand
  const rightAccents = polyrhythmPattern.rightRhythm.accents || [];
  const leftAccents = polyrhythmPattern.leftRhythm.accents || [];
  
  // Create notes for right voice using calculated positions and durations
  for (let i = 0; i < numerator; i++) {
    const rightPos = positions.rightPositions[i];
    
    // Check if this right note aligns with any left note
    const alignment = positions.alignments.find(a => a.rightIndex === i);
    
    // Check if this note has an accent (right hand accent)
    const hasRightAccent = rightAccents.includes(i);
    // Check if aligned left note has an accent
    const hasLeftAccent = alignment && leftAccents.includes(alignment.leftIndex);
    const hasAccent = hasRightAccent || hasLeftAccent;
    
    if (useStackedMode && alignment) {
      // Stacked mode: create combined note with both keys when notes align
      // This will stack vertically as a chord when drawn on the same stave
      alignedLeftIndices.add(alignment.leftIndex);
      
      const note = new VF.StaveNote({
        clef: 'percussion',
        keys: [rightVoiceKey, leftVoiceKey],
        duration: durations.rightDuration,
        stem_direction: -1,
      });
      
      // Add accent if either hand has one
      if (hasAccent) {
        try {
          const accent = new VF.Articulation('a>');
          if (typeof accent.setYShift === 'function') {
            accent.setYShift(-8);
          }
          note.addModifier(accent, 0);
        } catch (e) {
          console.error('Failed to add accent to combined note:', e);
        }
      }
      
      // Add combined sticking annotation
      const combinedSticking = `${rightSticking.charAt(0)}/${leftSticking.charAt(0)}`;
      try {
        const annotation = new VF.Annotation(combinedSticking);
        annotation.setFont('Inter', 14, 'bold');
        if (darkMode) {
          annotation.setStyle({ fillStyle: '#ffffff', strokeStyle: '#ffffff' });
        }
        annotation.setJustification(1);
        annotation.setVerticalJustification(2);
        annotation.setYShift(140);
        note.addModifier(annotation, 0);
      } catch (e) {
        console.error('Failed to add combined sticking annotation:', e);
      }
      
      rightNotes.push(note);
    } else {
      // Separate staves or no alignment: create separate note for right hand only
      const note = new VF.StaveNote({
        clef: 'percussion',
        keys: [rightVoiceKey],
        duration: durations.rightDuration,
        stem_direction: -1,
      });
      
      // Add accent if right hand has one
      if (hasRightAccent) {
        try {
          const accent = new VF.Articulation('a>');
          if (typeof accent.setYShift === 'function') {
            accent.setYShift(-8);
          }
          note.addModifier(accent, 0);
        } catch (e) {
          console.error('Failed to add accent to right note:', e);
        }
      }
      
      // Add right sticking annotation
        try {
        const annotation = new VF.Annotation(rightSticking.charAt(0));
          annotation.setFont('Inter', 14, 'bold');
          if (darkMode) {
            annotation.setStyle({ fillStyle: '#ffffff', strokeStyle: '#ffffff' });
          }
          annotation.setJustification(1);
          annotation.setVerticalJustification(2);
        annotation.setYShift(140);
          note.addModifier(annotation, 0);
        } catch (e) {
          console.error('Failed to add right sticking annotation:', e);
      }
      
      rightNotes.push(note);
    }
  }
  
  // Build left rhythm voice (denominator notes)
  const leftNotes: any[] = [];
  
  for (let j = 0; j < denominator; j++) {
    // Check if this left note has an accent
    const hasLeftAccent = leftAccents.includes(j);
    
    if (useStackedMode && alignedLeftIndices.has(j)) {
      // Stacked mode: use a rest in left voice when it aligns with right (combined note is in right voice)
      // Use the same duration as the right voice note to ensure proper alignment and spacing
      // Accent is already added to the combined note in the right voice
      const rest = new VF.StaveNote({
        clef: 'percussion',
        keys: ['b/4'],
        duration: `${durations.rightDuration}r`, // Match right duration for alignment
      });
      // No annotation on rests
      leftNotes.push(rest);
    } else {
      // Separate staves or no alignment: create separate note for left hand
    const note = new VF.StaveNote({
      clef: 'percussion',
      keys: [leftVoiceKey],
        duration: durations.leftDuration,
      stem_direction: -1,
    });
      
      // Add accent if left hand has one
      if (hasLeftAccent) {
        try {
          const accent = new VF.Articulation('a>');
          if (typeof accent.setYShift === 'function') {
            accent.setYShift(-8);
          }
          note.addModifier(accent, 0);
        } catch (e) {
          console.error('Failed to add accent to left note:', e);
        }
      }
    
    // Add left sticking annotation
      try {
        const annotation = new VF.Annotation(leftSticking.charAt(0));
        annotation.setFont('Inter', 14, 'bold');
        if (darkMode) {
          annotation.setStyle({ fillStyle: '#ffffff', strokeStyle: '#ffffff' });
        }
        annotation.setJustification(1);
        annotation.setVerticalJustification(2);
        annotation.setYShift(140);
        note.addModifier(annotation, 0);
      } catch (e) {
        console.error('Failed to add left sticking annotation:', e);
    }
    
    leftNotes.push(note);
    }
  }
  
  // Determine which tuplet config to return (for rendering)
  // Tuplets are applied during rendering, not here
  // The rendering code will create the tuplet and apply it to the voice
  const needsTuplet = durations.rightNeedsTuplet || durations.leftNeedsTuplet;
  
  // Return the tuplet config for the voice that needs it
  // For 4:3, left needs tuplet "3 in time of 4"
  // For 5:4, right needs tuplet "5 in time of 4"
  const tupletConfig = durations.leftNeedsTuplet && durations.leftTupletConfig
    ? durations.leftTupletConfig
    : durations.rightNeedsTuplet && durations.rightTupletConfig
    ? durations.rightTupletConfig
    : null;
  
  // Also return which voice needs the tuplet
  const tupletVoice = durations.leftNeedsTuplet ? 'left' : durations.rightNeedsTuplet ? 'right' : null;
  
  return {
    tickables: rightNotes, // Primary voice for now
    beams: [],
    rightVoiceNotes: rightNotes,
    leftVoiceNotes: leftNotes,
    needsTuplet,
    tupletConfig,
    tupletVoice, // Which voice needs the tuplet ('left' or 'right')
    durations, // Return durations for debugging
  };
}

/**
 * Build accent indices from phrase (first note of each group)
 * @deprecated Phrases are no longer used. Accents are set directly via _presetAccents.
 * This function is kept for backward compatibility only.
 */
function buildAccentIndices(phrase: number[]): number[] {
  const accents: number[] = [];
  let currentIndex = 0;

  phrase.forEach((groupLength) => {
    accents.push(currentIndex);
    currentIndex += groupLength;
  });

  return accents;
}

/**
 * Draw grid lines on the stave (vertical lines at beat and subdivision boundaries)
 */
function drawGridLines(container: HTMLElement, stave: any, subdivision: number, timeSignature: [number, number], totalNotes: number) {
  const svgElement = container.querySelector('svg');
  if (!svgElement) return;
  
  // Remove existing grid lines
  const existingGrid = svgElement.querySelector('.dpgen-grid-lines');
  if (existingGrid) {
    existingGrid.remove();
  }
  
  const staveX = stave.getX();
  const staveY = stave.getY();
  const staveWidth = stave.getWidth();
  const staveHeight = 80; // Approximate stave height
  
  const [beatsPerBar, beatValue] = timeSignature;
  const notesPerBeat = subdivision / beatValue;
  const totalBeats = totalNotes / notesPerBeat;
  
  // Create a group for grid lines (behind everything)
  const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gridGroup.setAttribute('class', 'dpgen-grid-lines');
  gridGroup.setAttribute('style', 'pointer-events: none;');
  
  // Draw vertical lines at each beat boundary
  const beatSpacing = staveWidth / totalBeats;
  for (let beat = 0; beat <= totalBeats; beat++) {
    const x = staveX + (beat * beatSpacing);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(x));
    line.setAttribute('y1', String(staveY - 10));
    line.setAttribute('x2', String(x));
    line.setAttribute('y2', String(staveY + staveHeight));
    line.setAttribute('stroke', '#e2e8f0');
    line.setAttribute('stroke-width', '0.5');
    line.setAttribute('opacity', '0.6');
    gridGroup.appendChild(line);
  }
  
  // Draw lighter lines at subdivision boundaries (if subdivision > beatValue)
  if (subdivision > beatValue) {
    const subdivisionSpacing = staveWidth / totalNotes;
    for (let note = 0; note <= totalNotes; note++) {
      const x = staveX + (note * subdivisionSpacing);
      // Skip if this is already a beat line
      if (note % notesPerBeat !== 0) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(x));
        line.setAttribute('y1', String(staveY - 5));
        line.setAttribute('x2', String(x));
        line.setAttribute('y2', String(staveY + staveHeight));
        line.setAttribute('stroke', '#f1f5f9');
        line.setAttribute('stroke-width', '0.3');
        line.setAttribute('opacity', '0.4');
        gridGroup.appendChild(line);
      }
    }
  }
  
  // Insert grid group at the beginning (behind everything)
  const firstChild = svgElement.firstChild;
  if (firstChild) {
    svgElement.insertBefore(gridGroup, firstChild);
  } else {
    svgElement.appendChild(gridGroup);
  }
}

/**
 * Draw measure numbers above the stave
 */
function drawMeasureNumbers(container: HTMLElement, stave: any, timeSignature: [number, number], startMeasureNumber: number, barsInStave: number = 1) {
  const svgElement = container.querySelector('svg');
  if (!svgElement) return;
  
  // Don't remove existing measure numbers here - they're removed before drawing all at once
  
  const staveX = stave.getX();
  const staveY = stave.getY();
  const staveWidth = stave.getWidth();
  
  const [beatsPerBar, beatValue] = timeSignature;
  
  // Calculate measure width
  const measureWidth = staveWidth / barsInStave;
  
  // Create a group for measure numbers (on top)
  const measureGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  measureGroup.setAttribute('class', 'dpgen-measure-numbers');
  measureGroup.setAttribute('style', 'pointer-events: none;');
  
  for (let i = 0; i < barsInStave; i++) {
    const measureNumber = startMeasureNumber + i;
    const measureX = staveX + (i * measureWidth) + (measureWidth / 2);
    
    // Create text element
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(measureX));
    text.setAttribute('y', String(staveY - 15));
    text.setAttribute('fill', '#64748b');
    text.setAttribute('font-family', 'Inter, sans-serif');
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'bottom');
    text.textContent = String(measureNumber);
    measureGroup.appendChild(text);
  }
  
  // Append measure group to SVG (on top)
  svgElement.appendChild(measureGroup);
}

