/**
 * Stave component using VexFlow for musical notation rendering
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Pattern } from '@/types';
import { PolyrhythmPattern } from '@/types/polyrhythm';
import { parseNumberList, parseTokens, parseTimeSignature, formatList, calculateNotesPerBar } from '@/lib/utils/patternUtils';
import { randomSets } from '@/lib/utils/randomSets';
import { polyrhythmToCombinedPattern } from '@/lib/utils/polyrhythmUtils';

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

  useEffect(() => {
    if (!staveRef.current) {
      return;
    }

    // Wait for VexFlow to load
    let retryCount = 0;
    const maxRetries = 50;
    const checkVexFlow = () => {
      if (typeof window !== 'undefined') {
        // Try multiple ways VexFlow might be exposed
        let VF: any = null;
        if ((window as any).VF) {
          VF = (window as any).VF;
          // console.log('Found VF directly');
        } else if ((window as any).Vex && (window as any).Vex.Flow) {
          VF = (window as any).Vex.Flow;
          // console.log('Found Vex.Flow');
        } else if ((window as any).VexFlow) {
          VF = (window as any).VexFlow;
          // console.log('Found VexFlow');
        }
        
        if (VF && VF.Renderer && VF.Stave && VF.StaveNote) {
          // console.log('VexFlow found, rendering stave with', patterns.length, 'patterns and', polyrhythmPatterns.length, 'polyrhythm patterns');
          try {
            renderStave(VF);
          } catch (error) {
            console.error('Error rendering stave:', error);
          }
          return;
        } else {
          // console.log('VexFlow not ready yet. VF:', !!VF, 'Renderer:', !!(VF && VF.Renderer), 'Stave:', !!(VF && VF.Stave));
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

    const renderStave = (VF: any) => {
      if (!staveRef.current) {
        console.warn('staveRef.current is null');
        return;
      }
    
      // console.log('Rendering stave with', patterns.length, 'patterns and', polyrhythmPatterns.length, 'polyrhythm patterns');
      
      // Clear previous rendering
      if (staveRef.current) {
        staveRef.current.innerHTML = '';
      }

      // Build all bars from regular patterns (with repeats)
      const allBars: Pattern[] = [];
      patterns.forEach((pattern) => {
        const repeat = pattern.repeat || 1;
        for (let r = 0; r < repeat; r++) {
          allBars.push(pattern);
        }
      });

      // Build all bars from polyrhythm patterns
      // Each polyrhythm pattern can repeat, creating multiple bars
      const allPolyrhythmBars: PolyrhythmPattern[] = [];
      polyrhythmPatterns.forEach((pattern) => {
        const repeat = pattern.repeat || 1;
        for (let r = 0; r < repeat; r++) {
          allPolyrhythmBars.push(pattern);
        }
      });

      // If no patterns at all, return
      if (allBars.length === 0 && allPolyrhythmBars.length === 0) {
        // console.log('No patterns to render');
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
        const phrase = parseNumberList(pattern.phrase || '');
        const drumPatternTokens = parseTokens(pattern.drumPattern || '').map((token) => token.toUpperCase());
        const stickingTokens = parseTokens(pattern.stickingPattern || '');
        const timeSignature = parseTimeSignature(pattern.timeSignature || '4/4');
        const phraseSum = phrase.reduce((sum, val) => sum + val, 0);
        
        // Calculate expected notes per bar from time signature
        // Time signature determines bar length, subdivision determines how fine the grid is
        const expectedTotal = calculateNotesPerBar(pattern.timeSignature || '4/4', pattern.subdivision);
        const totalNotesInBar = phraseSum; // Phrase represents the entire bar
        
        // Validate phrase - must add up to expected notes per bar from time signature
        // The phrase represents the entire bar's accent groups
        if (phrase.length === 0 || phraseSum === 0) {
          console.warn(`Pattern ${barIndex + 1} has invalid phrase (empty), skipping`);
          return;
        }
        
        if (phraseSum !== expectedTotal) {
          console.warn(`Pattern ${barIndex + 1} has invalid phrase: sum is ${phraseSum}, expected ${expectedTotal} (from time signature ${pattern.timeSignature} with subdivision ${pattern.subdivision}), skipping`);
          return;
        }

        // Build notes for this bar
        const startNoteIndex = cumulativeNoteIndex;
        // Use accent indices from pattern (allow empty array for no accents)
        // Only fall back to phrase-based accents if _presetAccents is undefined
        const accentIndices = pattern._presetAccents !== undefined
          ? pattern._presetAccents 
          : buildAccentIndices(phrase);
        
        // Use global sticking index offset to allow patterns to span multiple bars
        // If this pattern's sticking pattern is different from the previous, reset the offset
        // Otherwise, continue accumulating the offset
        const { tickables, beams } = buildNotes({
          subdivision: pattern.subdivision,
          phrase,
          drumPatternTokens,
          stickingTokens,
          timeSignature,
          leftFoot: pattern.leftFoot,
          rightFoot: pattern.rightFoot,
          accentIndices,
          darkMode,
          practicePadMode,
          stickingIndexOffset: cumulativeStickingIndex, // Pass global sticking index offset
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
        const phrase = parseNumberList(combined.phrase || '');
        const timeSignature = parseTimeSignature(polyrhythmPattern.timeSignature || '4/4');
        const phraseSum = phrase.reduce((sum, val) => sum + val, 0);
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
        const uniqueAccents = [...new Set(accentIndices)].sort((a, b) => a - b).filter(a => a < phraseSum);
        
        const { tickables, beams, rightVoiceNotes, leftVoiceNotes } = buildPolyrhythmNotes({
          subdivision: combined.subdivision,
          phrase,
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
        // The right voice has 'numerator' notes evenly spaced across 'phraseSum' positions
        if (rightVoiceNotes && rightVoiceNotes.length > 0) {
          for (let pos = 0; pos < phraseSum; pos++) {
            const globalIndex = startNoteIndex + pos;
            
            // Calculate which right voice note this position corresponds to
            // Right voice has 'numerator' notes over 'phraseSum' positions
            const rightNoteIndex = Math.floor((pos / phraseSum) * polyrhythmPattern.ratio.numerator);
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
          phrase: combined.phrase,
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
          totalNotesInBar: phraseSum,
          isPolyrhythm: true,
          polyrhythmPattern,
        });

        cumulativeNoteIndex += phraseSum;
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
        // console.log('Renderer created successfully, context:', !!context);
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

          const staveY = lineIndex * lineSpacing + 36;
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
            const { rightVoiceNotes, leftVoiceNotes, needsTuplet, tupletConfig } = buildPolyrhythmNotes({
              subdivision: combined.subdivision,
              phrase: parseNumberList(combined.phrase || ''),
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
                rightVoiceNotes.unshift(timeSigNote);
              } catch (error) {
                console.warn('Could not create TimeSigNote for polyrhythm time signature change:', error);
                // Fallback: try adding as modifier to first note if TimeSigNote fails
                if (rightVoiceNotes.length > 0) {
                  try {
                    const firstNote = rightVoiceNotes[0];
                    if (firstNote && typeof firstNote.addModifier === 'function') {
                      const timeSig = new VF.TimeSignature(`${polyrhythmTimeSig[0]}/${polyrhythmTimeSig[1]}`);
                      firstNote.addModifier(timeSig, 0);
                    }
                  } catch (modifierError) {
                    console.warn('Could not add time signature modifier as fallback:', modifierError);
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
            
            // Apply tuplet to left voice if needed (when numerator != denominator)
            // This ensures the left notes are spaced correctly according to the ratio
            if (needsTuplet && tupletConfig && leftVoiceNotes.length > 0) {
              try {
                // Create tuplet: denominator notes in time of numerator notes
                // For 4:3, this means 3 notes in time of 2 quarter notes (or 4 notes total)
                const tuplet = new VF.Tuplet(leftVoiceNotes, tupletConfig);
                // Tuplet needs to be attached to the notes before adding to voice
                leftVoiceNotes.forEach((note, index) => {
                  if (index === 0) {
                    // Set tuplet on first note
                    note.setTuplet(tuplet);
                  }
                });
              } catch (e) {
                console.error('Failed to create tuplet:', e);
              }
            }
            
            leftVoice.addTickables(leftVoiceNotes);
            
            // Format and draw both voices together
            // joinVoices aligns the start and end of measures across voices
            // format ensures notes are spaced evenly according to their durations
            try {
              const formatter = new VF.Formatter();
              formatter.joinVoices([rightVoice, leftVoice]);
              const formatWidth = Math.max(200, actualStaveWidth - 120);
              
              // Format both voices together to ensure proper alignment and spacing
              // This will space right voice notes evenly (4 quarter notes)
              // and left voice notes evenly within their tuplet (3 notes in time of 2)
              formatter.format([rightVoice, leftVoice], formatWidth, { 
                align_rests: false,
                context: context 
              });
              
              // Draw voices in order (right on top, left below)
              rightVoice.draw(context, stave);
              leftVoice.draw(context, stave);
              
              // Update previous time signature for next bar (after processing this polyrhythm)
              previousBarTimeSig = polyrhythmTimeSig;
              
              // Add data attributes to distinguish left and right voice notes for highlighting
              // Note: After drawing, we need to find the notes in the SVG
              // Use a small timeout to ensure SVG is fully rendered
              setTimeout(() => {
                const svgEl = staveRef.current?.querySelector('svg');
                if (svgEl && rightVoiceNotes && leftVoiceNotes) {
                  // Find all stave notes in this line - VexFlow draws them in order
                  // For polyrhythms, notes may be stacked when they align
                  const allNotes = Array.from(svgEl.querySelectorAll('.vf-stavenote')) as SVGElement[];
                  
                  // Try to match notes by their annotations
                  // Right voice has 'numerator' notes, left voice has 'denominator' notes
                  let rightNoteCount = 0;
                  let leftNoteCount = 0;
                  
                  allNotes.forEach((noteEl) => {
                    const annotation = noteEl.querySelector('.vf-annotation text');
                    if (annotation) {
                      const text = annotation.textContent?.trim() || '';
                      const rightLimb = polyrhythmPattern.rightRhythm.limb.replace('-', ' ').toUpperCase().charAt(0);
                      const leftLimb = polyrhythmPattern.leftRhythm.limb.replace('-', ' ').toUpperCase().charAt(0);
                      
                      // Determine voice by annotation text or position
                      if (text === rightLimb && rightNoteCount < numerator) {
                        noteEl.setAttribute('data-voice', 'right');
                        noteEl.setAttribute('data-polyrhythm-note-index', rightNoteCount.toString());
                        rightNoteCount++;
                      } else if (text === leftLimb && leftNoteCount < denominator) {
                        noteEl.setAttribute('data-voice', 'left');
                        noteEl.setAttribute('data-polyrhythm-note-index', leftNoteCount.toString());
                        leftNoteCount++;
                      }
                    }
                  });
                }
              }, 100);
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
                console.warn('Could not create bar line before time signature change:', error);
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
                console.warn('Could not create TimeSigNote for time signature change:', error);
                // Fallback: try adding as modifier to first note if TimeSigNote fails
                if (barData.tickables.length > 0) {
                  try {
                    const firstNote = barData.tickables[0];
                    if (firstNote && typeof firstNote.addModifier === 'function') {
                      const timeSig = new VF.TimeSignature(`${currentTimeSig[0]}/${currentTimeSig[1]}`);
                      firstNote.addModifier(timeSig, 0);
                    }
                  } catch (modifierError) {
                    console.warn('Could not add time signature modifier as fallback:', modifierError);
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

    };

    checkVexFlow();

    // Cleanup function
    return () => {
      if (rendererRef.current) {
        rendererRef.current = null;
      }
    };
    }, [patterns, polyrhythmPatterns, polyrhythmDisplayMode, darkMode, showGridLines, showMeasureNumbers]);

  // Track previous playback position to detect when playback starts/stops
  const prevPlaybackPositionRef = useRef<number | null>(null);

  // Highlight active notes based on playback position
  useEffect(() => {
    const svgElement = staveRef.current?.querySelector('svg');
    if (!svgElement) return;

    // Detect when playback stops (playbackPosition goes from number to null)
    const playbackJustStopped = prevPlaybackPositionRef.current !== null && playbackPosition === null;
    // Detect when playback starts (playbackPosition goes from null to number)
    const playbackJustStarted = prevPlaybackPositionRef.current === null && playbackPosition !== null;

    // Update ref for next check
    prevPlaybackPositionRef.current = playbackPosition;

    // Clear all highlights when playback stops OR when a new playback starts
    if (playbackJustStopped || playbackJustStarted) {
      // Clear all previous highlights
      svgElement.querySelectorAll('.dpgen-note--active').forEach((el) => {
        el.classList.remove('dpgen-note--active');
        el.removeAttribute('data-accented');
        // Clear fill and stroke from note shapes (paths, circles, etc.)
        const noteShapes = el.querySelectorAll('path, circle, ellipse, rect');
        noteShapes.forEach((shape) => {
          const svgShape = shape as SVGElement;
          const fillAttr = svgShape.getAttribute('fill');
          const strokeAttr = svgShape.getAttribute('stroke');
          if (fillAttr === '#f97316' || fillAttr === '#3b82f6') {
            svgShape.removeAttribute('fill');
          }
          if (strokeAttr === '#f97316' || strokeAttr === '#3b82f6') {
            svgShape.removeAttribute('stroke');
          }
        });
      });
      // Clear annotation fill attributes from all text/tspan elements
      svgElement.querySelectorAll('text[fill="#f97316"], text[fill="#3b82f6"], tspan[fill="#f97316"], tspan[fill="#3b82f6"]').forEach((el) => {
        const elSvg = el as SVGElement;
        const fillAttr = elSvg.getAttribute('fill');
        if (fillAttr === '#f97316' || fillAttr === '#3b82f6') {
          elSvg.removeAttribute('fill');
        }
      });
      // Clear annotation classes
      svgElement.querySelectorAll('.dpgen-annotation--active').forEach((el) => {
        el.classList.remove('dpgen-annotation--active');
        el.classList.remove('dpgen-annotation--left');
        el.classList.remove('dpgen-annotation--right');
      });
    }

    // If not playing, don't highlight
    if (playbackPosition === null) {
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
        // Calculate actual notes per bar from time signature and subdivision
        const notesPerBar = calculateNotesPerBar(pattern.timeSignature || '4/4', pattern.subdivision);
        
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
        // Calculate actual notes per bar from time signature and subdivision
        const notesPerBar = calculateNotesPerBar(pattern.timeSignature || '4/4', pattern.subdivision);
        const totalNotes = notesPerBar * (pattern.repeat || 1);
        currentNoteIndex += totalNotes;
      });
      
      // Now check polyrhythm patterns (with repeats)
      polyrhythmPatterns.forEach((polyrhythmPattern) => {
        const combined = polyrhythmToCombinedPattern(polyrhythmPattern);
        const phrase = parseNumberList(combined.phrase || '');
        const totalNotesInBar = phrase.reduce((sum, val) => sum + val, 0);
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

    // Find all note groups in the SVG using VexFlow's classes
    // VexFlow uses .vf-stavenote class for all stave notes (quarter, eighth, sixteenth, etc.)
    // This is more reliable than heuristic detection, especially for quarter notes which aren't beamed
    // Get all note elements, excluding grace notes (flams count as ONE note position)
    // Grace notes are part of the main note and shouldn't be counted separately
    const allNoteEls = Array.from(svgElement.querySelectorAll('.vf-stavenote')) as SVGElement[];
    
    // Filter out grace notes and invisible spacer notes (same as WordPress plugin)
    // This ensures flams count as 1 note, not 2 (grace notes are modifiers, not separate notes)
    // VexFlow renders grace notes as separate stavenote elements - we need to identify them
    let noteGroups = allNoteEls.filter((noteEl) => {
      // Check if this is a grace note by looking at parent structure
      // Grace notes are typically children of grace note groups or have specific attributes
      // IMPORTANT: Grace notes are nested INSIDE the main note's .vf-stavenote element
      // So we need to check if this note is nested inside another .vf-stavenote
      const parent = noteEl.parentElement;
      let currentParent = parent;
      let isNestedInStaveNote = false;
      
      // Walk up the DOM tree to see if this note is nested inside another .vf-stavenote
      while (currentParent) {
        if (currentParent.classList && currentParent.classList.contains('vf-stavenote')) {
          isNestedInStaveNote = true;
          break;
        }
        currentParent = currentParent.parentElement;
      }
      
      const isGraceNote = 
        // Check if nested inside another stave note (grace notes are nested)
        isNestedInStaveNote ||
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

    // Calculate expected number of notes from pattern data (before filtering)
    const expectedNotes = allBars.reduce((sum, bar) => {
      // Calculate actual notes per bar from time signature and subdivision
      const notesPerBar = calculateNotesPerBar(bar.timeSignature || '4/4', bar.subdivision);
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
      
      // console.log(`Fallback found ${fallbackGroups.length} potential note groups`);
      
      // Combine both approaches, preferring .vf-stavenote but adding fallback if needed
      if (fallbackGroups.length > noteGroups.length) {
        // Use fallback if it found more notes
        noteGroups = fallbackGroups;
        // console.log(`Using fallback groups (${fallbackGroups.length} groups)`);
      }
    }

    // Count notes up to the target bar
    // Need to account for both regular patterns and polyrhythm patterns
    let notesBeforeTargetBar = 0;
    
    // Count notes from regular patterns first
    for (let i = 0; i < allBars.length && i < targetBarIndex; i++) {
      // Calculate actual notes per bar from time signature and subdivision
      const notesPerBar = calculateNotesPerBar(allBars[i].timeSignature || '4/4', allBars[i].subdivision);
      notesBeforeTargetBar += notesPerBar;
    }
    
    // Count notes from polyrhythm patterns if target bar is beyond regular patterns
    if (targetBarIndex >= allBars.length) {
      // First count all regular pattern notes
      for (let i = 0; i < allBars.length; i++) {
        // Calculate actual notes per bar from time signature and subdivision
        const notesPerBar = calculateNotesPerBar(allBars[i].timeSignature || '4/4', allBars[i].subdivision);
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
          const phrase = parseNumberList(combined.phrase || '');
          const phraseSum = phrase.reduce((sum, val) => sum + val, 0);
          notesBeforeTargetBar += phraseSum;
          countedBars++;
        }
        if (countedBars >= polyrhythmBarIndex) break;
      }
    }

    // Find the note group corresponding to the playback position
    const targetNoteIndex = notesBeforeTargetBar + noteIndexInBar;
    
    // console.log(`Highlighting note at position ${playbackPosition}: bar=${targetBarIndex}, noteInBar=${noteIndexInBar}, targetNoteIndex=${targetNoteIndex}, totalNoteGroups=${noteGroups.length}, expectedNotes=${expectedNotes}`);
    
    // Ensure last note is included - allow targetNoteIndex up to noteGroups.length - 1
    // Also check against expectedNotes to ensure we're not going beyond actual notes
    if (targetNoteIndex >= 0 && targetNoteIndex < noteGroups.length) {
      const targetGroup = noteGroups[targetNoteIndex];
      
      // Check if this note is accented by checking if it's in any pattern's accent indices
      let isAccented = false;
      let noteIndexInPattern = playbackPosition;
      
      // Find which pattern this note belongs to
      for (const pattern of patterns) {
        // Calculate actual notes per bar from time signature and subdivision
        const notesPerBar = calculateNotesPerBar(pattern.timeSignature || '4/4', pattern.subdivision);
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
      
      // Also set orange fill on the note shapes themselves (simple solution: just set the fill attribute)
      const noteShapes = targetGroup.querySelectorAll('path, circle, ellipse, rect');
      noteShapes.forEach((shape) => {
        const svgShape = shape as SVGElement;
        // Set orange fill on note shapes (stems, note heads, etc.)
        svgShape.setAttribute('fill', '#f97316');
        // Also set stroke to orange for better visibility
        svgShape.setAttribute('stroke', '#f97316');
      });
      
      // Find and highlight the annotation (sticking letter) separately
      // Annotations can be structured as: .vf-annotation > text > tspan (for multi-letter) or .vf-annotation > text
      // Match WordPress plugin: add class to annotation group AND text/tspan elements
      const annotationGroup = targetGroup.querySelector('.vf-annotation');
      if (annotationGroup) {
        // Check if this is a left or right voice note for polyrhythms
        const voice = targetGroup.getAttribute('data-voice');
        const isLeftVoice = voice === 'left';
        
        // Add class to annotation group (like WordPress plugin)
        annotationGroup.classList.add('dpgen-annotation--active');
        if (isLeftVoice) {
          annotationGroup.classList.add('dpgen-annotation--left');
        } else {
          annotationGroup.classList.add('dpgen-annotation--right');
        }
        
        // Also highlight text and tspan elements inside the annotation
        // Simple solution: just set the fill attribute directly on the text elements
        const fillColor = isLeftVoice ? '#3b82f6' : '#f97316'; // Blue for left, orange for right
        const textElements = annotationGroup.querySelectorAll('text, tspan');
        textElements.forEach((textEl) => {
          textEl.setAttribute('fill', fillColor);
          textEl.classList.add('dpgen-annotation--active');
          if (isLeftVoice) {
            textEl.classList.add('dpgen-annotation--left');
          } else {
            textEl.classList.add('dpgen-annotation--right');
          }
        });
      } else {
        console.warn(`No annotation group found for note ${targetNoteIndex} (targetNoteIndex=${targetNoteIndex}, totalGroups=${noteGroups.length})`);
      }
      
      // Match WordPress plugin: ONLY use CSS classes, NO inline styles
      // Add data-accented attribute for stronger glow on accented notes
      if (isAccented) {
        targetGroup.setAttribute('data-accented', 'true');
      } else {
        targetGroup.removeAttribute('data-accented');
      }
      
      // Scroll to current note if animation is enabled
      if (scrollAnimationEnabled) {
        scrollToCurrentNote(targetGroup);
      }
    } else {
      console.warn(`Could not find note group at index ${targetNoteIndex} (total: ${noteGroups.length})`);
    }
  }, [playbackPosition, patterns, polyrhythmPatterns, scrollAnimationEnabled]);

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
    console.log(`[Stave] Color calculation: timingError=${timingError.toFixed(1)}ms, toleranceWindow=${toleranceWindow}ms`);
    
    // Color logic:
    // Green: within tolerance (e.g., ±50ms)
    // Yellow: within 20% outside tolerance (e.g., ±60ms for 50ms tolerance)
    // Red: outside that (e.g., > ±60ms for 50ms tolerance)
    let color: string;
    if (timingError <= toleranceWindow) {
      color = '#10b981'; // Green - within tolerance
      console.log(`[Stave] Color: GREEN (${timingError.toFixed(1)} <= ${toleranceWindow})`);
    } else if (timingError <= toleranceWindow * 1.2) {
      color = '#f59e0b'; // Yellow - within 20% outside tolerance
      console.log(`[Stave] Color: YELLOW (${toleranceWindow} < ${timingError.toFixed(1)} <= ${(toleranceWindow * 1.2).toFixed(1)})`);
    } else {
      color = '#ef4444'; // Red - more than 20% outside tolerance
      console.log(`[Stave] Color: RED (${timingError.toFixed(1)} > ${(toleranceWindow * 1.2).toFixed(1)})`);
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
      
      console.log(`[Stave] Clear timeout: showTimingErrors=${midiPractice.showTimingErrors}, isStillLastHit=${isStillLastHit}, shouldKeepColors=${shouldKeepColors}`);
      
      if (!shouldKeepColors) {
        console.log('[Stave] Clearing colors for note (not last hit or timing not shown)');
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
        console.log('[Stave] Keeping colors for last note (timing measurements shown)');
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
        console.log(`[Stave] Note ${expectedNoteIndex} (${hit.note}) color: timingErrorForColor=${timingErrorForColor.toFixed(1)}ms, hit.timingError=${hit.timingError.toFixed(1)}ms, rawTimingError=${hit.rawTimingError.toFixed(1)}ms, absRaw=${absRawTimingError.toFixed(1)}ms, toleranceWindow=${toleranceWindow}ms, color=${color}`);
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
  phrase,
  drumPatternTokens,
  stickingTokens,
  timeSignature,
  leftFoot,
  rightFoot,
  accentIndices,
  darkMode,
  practicePadMode,
  stickingIndexOffset = 0, // Global sticking index offset for patterns spanning multiple bars
}: {
  subdivision: number;
  phrase: number[];
  drumPatternTokens: string[];
  stickingTokens: string[];
  timeSignature: [number, number];
  leftFoot: boolean;
  rightFoot: boolean;
  accentIndices: number[];
  darkMode: boolean;
  practicePadMode: boolean;
  stickingIndexOffset?: number;
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
  const noteDuration = subdivision === 4 ? 'q' : subdivision === 8 ? '8' : '16';
  // Phrase represents the entire bar's accent groups
  const totalNotes = phrase.reduce((sum, val) => sum + val, 0);
  const notesPerBeat = Math.max(1, subdivision / 4);

  const rawNotes: any[] = [];

  // Build notes - phrase represents the entire bar
  for (let i = 0; i < totalNotes; i++) {
    // Use note index to map to drum pattern (repeats based on note position, not phrase group)
    // This ensures drum patterns stay consistent regardless of accent positions
    const drumToken = drumPatternTokens[i % drumPatternTokens.length];
    const normalizedToken = drumToken.replace(/\+/g, ' ');
    let voicingTokens = normalizedToken.split(/\s+/).filter(Boolean);
    
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
    
    // Check for flam notation (lowercase letter followed by uppercase, e.g., "lR" or "rL")
    // Match patterns like "lR", "rL", "lK", "rK" (case-sensitive for first letter, uppercase for second)
    // WordPress plugin format: lowercase grace note letter + uppercase main note letter
    const flamMatch = sticking && typeof sticking === 'string' ? sticking.match(/^([lr])([RLK])$/) : null;
    let hasFlam = false;
    let graceNoteSticking = '';
    let mainNoteSticking = sticking;
    
    if (flamMatch) {
      hasFlam = true;
      graceNoteSticking = flamMatch[1].toUpperCase(); // Grace note letter (L or R)
      mainNoteSticking = flamMatch[2]; // Main note letter (R, L, or K)
      
      try {
        // Create grace note (small note before main note) for flam
        // Grace note uses same position as main note (typically snare)
        const graceNotePosition = keys.length > 0 ? keys[0] : keyMap.S;
        
        // Create grace note (small note before main note)
        // Grace notes in VexFlow use a slashed notehead for flams (acciaccatura)
        const graceNote = new VF.GraceNote({
          keys: [graceNotePosition],
          duration: '8', // Grace note duration (8th note)
          slash: true, // Slash through notehead for flam (acciaccatura)
          stem_direction: -1,
        });
        
        // Mark the grace note so we can identify it later (for filtering in collectNoteRefs)
        // This helps ensure flams are treated as single note positions
        if ((graceNote as any).setAttribute) {
          (graceNote as any).setAttribute('data-grace-note', 'true');
        }
        
        // Create a grace note group and associate it with the main note
        // The 'true' parameter adds a slur between grace note and main note
        const graceNoteGroup = new VF.GraceNoteGroup([graceNote], true);
        
        // Mark the grace note group as well
        if ((graceNoteGroup as any).setAttribute) {
          (graceNoteGroup as any).setAttribute('data-grace-note-group', 'true');
        }
        
        // Add the grace note group as a modifier to the main note
        staveNote.addModifier(graceNoteGroup, 0);
      } catch (e: any) {
        console.error('Failed to add flam grace note:', e, e?.stack);
        // Continue without grace note if it fails
      }
    }
    
    // Add sticking annotation (use base sticking for display)
    if (sticking && sticking !== '-' && !hasFlam) {
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
    } else if (hasFlam && mainNoteSticking) {
      // Add annotation showing full flam pattern (e.g., "lR" or "rL") for flam
      // Format: lowercase grace note letter + uppercase main note letter
      try {
        // Show the full flam pattern (e.g., "lR") so users can see both letters
        const flamAnnotation = new VF.Annotation(sticking); // Use original sticking pattern
        flamAnnotation.setFont('Inter', 16, 'bold');
        if (darkMode) {
          flamAnnotation.setStyle({ fillStyle: '#ffffff', strokeStyle: '#ffffff' });
        }
        flamAnnotation.setJustification(1); // CENTER
        flamAnnotation.setVerticalJustification(2); // BOTTOM
        flamAnnotation.setYShift(140); // Position annotation below the stave
        staveNote.addModifier(flamAnnotation, 0);
      } catch (e) {
        console.error('Failed to create flam annotation:', e);
      }
    }

    rawNotes.push(staveNote);
  }

  // Create beams
  const beams: any[] = [];
  if (subdivision !== 4) {
    const groupSize = subdivision === 12 ? 3 : subdivision === 24 ? 6 : subdivision === 32 ? 8 : subdivision / 4;
    for (let i = 0; i < rawNotes.length; i += groupSize) {
      const group = rawNotes.slice(i, i + groupSize).filter((note) => {
        if (typeof note.isRest === 'function' && note.isRest()) return false;
        return true;
      });
      if (group.length > 1) {
        beams.push(new VF.Beam(group));
      }
    }
  }

  return { tickables: rawNotes, beams };
}

/**
 * Build notes for polyrhythm pattern using VexFlow Voice/Tuplet system
 * This properly notates polyrhythms with each rhythm using its own subdivision
 * For example, 4:3 polyrhythm = 4 quarter notes vs 3 notes in a tuplet
 */
function buildPolyrhythmNotes({
  subdivision,
  phrase,
  drumPatternTokens,
  stickingTokens,
  timeSignature,
  accentIndices,
  darkMode,
  polyrhythmPattern,
  displayMode,
}: {
  subdivision: number;
  phrase: number[];
  drumPatternTokens: string[];
  stickingTokens: string[];
  timeSignature: [number, number];
  accentIndices: number[];
  darkMode: boolean;
  polyrhythmPattern: PolyrhythmPattern;
  displayMode: 'separate-positions' | 'stacked' | 'two-staves';
}) {
  if (typeof window === 'undefined') {
    return { tickables: [], beams: [] };
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
    return { tickables: [], beams: [] };
  }

  const [beatsPerBar, beatValue] = timeSignature;
  const { numerator, denominator } = polyrhythmPattern.ratio;
  const cycleLength = polyrhythmPattern.cycleLength;
  
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

  // Determine note durations based on time signature
  // For 4/4: quarter note = 'q', eighth = '8', sixteenth = '16'
  // Calculate what duration each rhythm should use
  // The ratio tells us how many notes each rhythm plays in the measure
  // We need to figure out the appropriate note value for each
  
  // For the rhythm with more notes, use smaller note values
  // For the rhythm with fewer notes, use larger note values
  // Both should fill the same measure duration
  
  // Calculate measure duration in beats (from time signature)
  const measureDurationInBeats = beatsPerBar;
  
  // Calculate note duration for each rhythm
  // Rhythm 1 (numerator): plays 'numerator' notes across 'measureDurationInBeats' beats
  // Rhythm 2 (denominator): plays 'denominator' notes across 'measureDurationInBeats' beats
  // We need to find the right note durations that make sense
  
  // For 4:3 in 4/4:
  // - 4 notes: each note = 1 beat (quarter notes) = 'q'
  // - 3 notes: 3 notes in time of 2 beats (triplet quarters) = tuplet
  
  // Build right rhythm notes (numerator notes)
  const rightNotes: any[] = [];
  const rightNoteDuration = beatsPerBar / numerator; // Duration of each note in beats
  let rightDurationStr = 'q'; // Default to quarter notes
  
  if (rightNoteDuration <= 1/4) {
    rightDurationStr = '16'; // Sixteenth notes
  } else if (rightNoteDuration <= 1/2) {
    rightDurationStr = '8'; // Eighth notes
  } else if (rightNoteDuration <= 1) {
    rightDurationStr = 'q'; // Quarter notes
  } else {
    rightDurationStr = 'w'; // Whole notes
  }
  
  // Build left rhythm notes (denominator notes)
  const leftNotes: any[] = [];
  const leftNoteDuration = beatsPerBar / denominator; // Duration of each note in beats
  let leftDurationStr = 'q'; // Default to quarter notes
  
  if (leftNoteDuration <= 1/4) {
    leftDurationStr = '16';
  } else if (leftNoteDuration <= 1/2) {
    leftDurationStr = '8';
  } else if (leftNoteDuration <= 1) {
    leftDurationStr = 'q';
  } else {
    leftDurationStr = 'w';
  }

  // Calculate note positions in time to detect when they align
  // For a 4:3 polyrhythm: right notes at positions 0, 0.25, 0.5, 0.75; left notes at 0, 0.333, 0.666
  // We need to detect when positions are close enough to be considered aligned
  const rightNotePositions: number[] = [];
  const leftNotePositions: number[] = [];
  
  for (let i = 0; i < numerator; i++) {
    rightNotePositions.push(i / numerator);
  }
  for (let i = 0; i < denominator; i++) {
    leftNotePositions.push(i / denominator);
  }
  
  // Helper function to check if two note positions align exactly
  // For polyrhythms, notes should only be combined if they start at EXACTLY the same time
  // Using a very small tolerance (0.001) to account for floating point precision
  const positionsAlign = (pos1: number, pos2: number, tolerance: number = 0.001): boolean => {
    return Math.abs(pos1 - pos2) < tolerance;
  };

  // Build notes for both rhythms, combining aligned notes into single notes with both keys
  // For aligned notes: create one note with both keys and "R/L" annotation
  // For non-aligned notes: keep them separate in their respective voices
  
  // Track which left note indices are aligned with right notes
  const alignedLeftIndices = new Set<number>();
  
  // Build right rhythm voice (numerator notes)
  // Check each right note position to see if it aligns with any left note
  for (let i = 0; i < numerator; i++) {
    const rightPos = rightNotePositions[i];
    
    // Find if any left note aligns with this right note
    let alignedLeftIndex = -1;
    for (let j = 0; j < leftNotePositions.length; j++) {
      if (positionsAlign(rightPos, leftNotePositions[j])) {
        alignedLeftIndex = j;
        break;
      }
    }
    
    if (alignedLeftIndex >= 0) {
      // Notes align - create a combined note with both keys
      alignedLeftIndices.add(alignedLeftIndex);
      
      const note = new VF.StaveNote({
        clef: 'percussion',
        keys: [rightVoiceKey, leftVoiceKey], // Both keys in one note
        duration: rightDurationStr,
        stem_direction: -1,
      });
      
      // Add combined "R/L" annotation
      const rightLimb = polyrhythmPattern.rightRhythm.limb.replace('-', ' ').toUpperCase().charAt(0);
      const leftLimb = polyrhythmPattern.leftRhythm.limb.replace('-', ' ').toUpperCase().charAt(0);
      const combinedSticking = `${rightLimb}/${leftLimb}`;
      
      try {
        const annotation = new VF.Annotation(combinedSticking);
        annotation.setFont('Inter', 14, 'bold');
        if (darkMode) {
          annotation.setStyle({ fillStyle: '#ffffff', strokeStyle: '#ffffff' });
        }
        annotation.setJustification(1);
        annotation.setVerticalJustification(2);
        annotation.setYShift(140); // Default position
        note.addModifier(annotation, 0);
      } catch (e) {
        console.error('Failed to add combined sticking annotation:', e);
      }
      
      rightNotes.push(note);
    } else {
      // No alignment - create separate note for right rhythm only
      const note = new VF.StaveNote({
        clef: 'percussion',
        keys: [rightVoiceKey],
        duration: rightDurationStr,
        stem_direction: -1,
      });
      
      // Add right sticking annotation
      const rightLimb = polyrhythmPattern.rightRhythm.limb.replace('-', ' ').toUpperCase();
      const sticking = rightLimb.charAt(0);
      if (sticking) {
        try {
          const annotation = new VF.Annotation(sticking);
          annotation.setFont('Inter', 14, 'bold');
          if (darkMode) {
            annotation.setStyle({ fillStyle: '#ffffff', strokeStyle: '#ffffff' });
          }
          annotation.setJustification(1);
          annotation.setVerticalJustification(2);
          annotation.setYShift(140); // Default position
          note.addModifier(annotation, 0);
        } catch (e) {
          console.error('Failed to add right sticking annotation:', e);
        }
      }
      
      rightNotes.push(note);
    }
  }
  
  // Build left rhythm voice (denominator notes) - only for non-aligned notes
  // For aligned notes, we use a rest in the left voice to maintain timing
  for (let i = 0; i < denominator; i++) {
    // Check if this left note was already handled (aligned with a right note)
    if (alignedLeftIndices.has(i)) {
      // This left note aligns with a right note - use a rest in left voice to maintain timing
      const rest = new VF.StaveNote({
        clef: 'percussion',
        keys: ['b/4'],
        duration: `${leftDurationStr}r`, // Rest
      });
      leftNotes.push(rest);
      continue;
    }
    
    // This left note doesn't align - create a separate note for left rhythm only
    const note = new VF.StaveNote({
      clef: 'percussion',
      keys: [leftVoiceKey],
      duration: leftDurationStr,
      stem_direction: -1,
    });
    
    // Add left sticking annotation
    const leftLimb = polyrhythmPattern.leftRhythm.limb.replace('-', ' ').toUpperCase();
    const sticking = leftLimb.charAt(0);
    if (sticking) {
      try {
        const annotation = new VF.Annotation(sticking);
        annotation.setFont('Inter', 14, 'bold');
        if (darkMode) {
          annotation.setStyle({ fillStyle: '#ffffff', strokeStyle: '#ffffff' });
        }
        annotation.setJustification(1);
        annotation.setVerticalJustification(2);
        annotation.setYShift(140); // Default position
        note.addModifier(annotation, 0);
      } catch (e) {
        console.error('Failed to add left sticking annotation:', e);
      }
    }
    
    leftNotes.push(note);
  }
  
  // Tuplet configuration is returned in tupletConfig and applied during rendering
  // For 4:3 polyrhythm: 3 notes (denominator) occupy time of 4 quarter notes (numerator)
  // This ensures the 3 notes are evenly spaced across the entire measure
  
  // Combine notes from both voices based on display mode
  // For now, we'll use separate voices and let VexFlow handle the formatting
  // The Formatter will align them properly
  const allNotes: any[] = [];
  
  // For separate-positions mode, we need to combine the voices
  // VexFlow will handle alignment when we use Formatter with multiple voices
  // For now, return notes from both voices - we'll need to handle this differently
  // Actually, we need to return structured data that indicates which notes belong to which voice
  
  // For simplicity, let's combine them sequentially for now
  // In a proper implementation, we'd return both voices separately
  // and use VexFlow's Formatter.joinVoices() to align them
  
  // Combine notes based on when they occur in time
  // This is a simplified approach - proper polyrhythm notation needs proper voice alignment
  const combinedNotes: any[] = [];
  
  // For now, just return right notes (we'll need to properly combine voices later)
  // This needs a more sophisticated approach to properly align the two voices
  
  // Return structured data for proper voice handling
  // The rendering code will handle creating two voices and joining them
  return {
    tickables: rightNotes, // For now, return right notes - we'll handle voices separately
    beams: [],
    rightVoiceNotes: rightNotes,
    leftVoiceNotes: leftNotes,
    needsTuplet: numerator !== denominator,
    tupletConfig: numerator !== denominator ? {
      // For proper polyrhythm notation, denominator notes should occupy time of numerator notes
      // This ensures each rhythm is evenly spaced across the entire measure
      // For 4:3 polyrhythm: 3 notes occupy time of 4 quarter notes (entire measure)
      // This makes the 3 notes evenly spaced at positions 0, 4/9, 8/9 of the measure
      num_notes: denominator,
      notes_occupied: numerator, // denominator notes occupy time of numerator notes
    } : null,
  };
}

/**
 * Build accent indices from phrase (first note of each group)
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

