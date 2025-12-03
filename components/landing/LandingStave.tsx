'use client';

import { useEffect, useRef, useState } from 'react';
import { generateRandomPattern } from '@/lib/utils/patternUtils';
import { parseTokens, parseTimeSignature, getNotesPerBarForPattern } from '@/lib/utils/patternUtils';
import { Pattern } from '@/types';

// VexFlow key map for drum notation
const keyMap: Record<string, string> = {
  S: 'c/5', // Snare
  K: 'f/4', // Kick
  F: 'a/4', // Floor Tom
  H: 'g/5/x', // Hi-hat
  O: 'g/5/x',
  I: 'e/5', // High Tom
  M: 'e/5', // Mid Tom
};

interface LandingStaveProps {
  className?: string;
  onNotesReady?: (noteGroups: SVGElement[]) => void;
}

export function LandingStave({ className = '', onNotesReady }: LandingStaveProps) {
  const staveRef = useRef<HTMLDivElement>(null);
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const noteGroupsRef = useRef<SVGElement[]>([]);
  const animationRef = useRef<number | null>(null);

  // Generate random pattern on mount
  useEffect(() => {
    const randomPattern = generateRandomPattern(false, false);
    // Set repeat to 2 bars for the landing page
    randomPattern.repeat = 2;
    setPattern(randomPattern);
  }, []);

  // Render VexFlow stave
  useEffect(() => {
    if (!pattern || !staveRef.current || typeof window === 'undefined') return;

    // Wait for VexFlow to load (it's loaded by VexFlowLoader in root layout)
    let VF: any = null;
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait

    const checkVexFlow = () => {
      attempts++;
      
      // Try multiple ways VexFlow might be exposed
      if ((window as any).VF) {
        VF = (window as any).VF;
      } else if ((window as any).Vex && (window as any).Vex.Flow) {
        VF = (window as any).Vex.Flow;
      } else if ((window as any).VexFlow) {
        VF = (window as any).VexFlow;
      }

      if (VF && VF.Renderer && VF.Stave) {
        renderStave(VF);
      } else if (attempts < maxAttempts) {
        setTimeout(checkVexFlow, 100);
      } else {
        console.error('VexFlow failed to load after 5 seconds');
      }
    };

    // Also listen for the vexflow-loaded event
    const handleVexFlowLoaded = () => {
      if ((window as any).VF) {
        VF = (window as any).VF;
        if (VF && VF.Renderer && VF.Stave) {
          renderStave(VF);
        }
      }
    };

    window.addEventListener('vexflow-loaded', handleVexFlowLoaded);

    const renderStave = (VF: any) => {
      try {
        if (!VF || !VF.Renderer) {
          console.error('VexFlow not available');
          return;
        }

        // Clear previous rendering
        staveRef.current!.innerHTML = '';

        // Get container width for responsive sizing
        const containerWidth = staveRef.current!.parentElement?.clientWidth || 800;
        const staveWidth = Math.max(400, containerWidth - 40); // Leave 20px margin on each side
        const staveHeight = 200;

        // Create renderer with proper size
        const renderer = new VF.Renderer(staveRef.current!, VF.Renderer.Backends.SVG);
        renderer.resize(staveWidth, staveHeight);
        const context = renderer.getContext();
        
        // Set dark mode colors
        context.setFillStyle('#ffffff');
        context.setStrokeStyle('#ffffff');

        // Parse pattern data
        const drumPatternTokens = parseTokens(pattern.drumPattern || '').map((token) => token.toUpperCase());
        const stickingTokens = parseTokens(pattern.stickingPattern || '');
        const timeSignature = parseTimeSignature(pattern.timeSignature || '4/4');
        const notesPerBar = getNotesPerBarForPattern(pattern);
        const accentIndices = pattern._presetAccents || [];

        // Debug logging
        console.log('[LandingStave] Pattern data:', {
          drumPattern: pattern.drumPattern,
          drumPatternTokens,
          stickingTokens,
          timeSignature,
          notesPerBar,
          subdivision: pattern.subdivision,
        });

        // Create stave with responsive width
        const leftMargin = 10;
        const availableWidth = staveWidth - leftMargin - 20; // Leave right margin
        const stave = new VF.Stave(leftMargin, 40, availableWidth);
        stave.addClef('percussion');
        stave.addTimeSignature(`${timeSignature[0]}/${timeSignature[1]}`);
        stave.setContext(context).draw();

        // Build notes for 2 bars
        const allNotes: any[] = [];
        const allBeams: any[] = [];
        noteGroupsRef.current = [];

        for (let barIndex = 0; barIndex < 2; barIndex++) {
          const barNotes: any[] = [];
          const barBeams: any[] = [];
          const noteDuration = pattern.subdivision === 4 ? 'q' : pattern.subdivision === 8 ? '8' : '16';

          for (let i = 0; i < notesPerBar; i++) {
            const globalIndex = barIndex * notesPerBar + i;
            const drumToken = drumPatternTokens[i % drumPatternTokens.length];
            const normalizedToken = drumToken.replace(/\+/g, ' ').toUpperCase();
            const voicingTokens = normalizedToken.split(/\s+/).filter(Boolean);
            const isRest = voicingTokens.length === 0 || voicingTokens.every((token) => token === '-' || token === 'R');

            const keys: string[] = [];
            if (isRest) {
              keys.push('b/4');
            } else {
              for (const token of voicingTokens) {
                if (token !== '-' && token !== 'R') {
                  let normalizedToken = token.toUpperCase();
                  if (normalizedToken === 'HT') normalizedToken = 'I';
                  else if (normalizedToken === 'MT') normalizedToken = 'M';
                  const position = keyMap[normalizedToken];
                  if (position) keys.push(position);
                }
              }
              if (keys.length === 0) keys.push(keyMap.S);
            }

            // Create note
            const note = new VF.StaveNote({
              clef: 'percussion',
              keys,
              duration: isRest ? `${noteDuration}r` : noteDuration,
              stem_direction: 1, // Upward stems
            });

            // Add accent if needed
            if (accentIndices.includes(i)) {
              try {
                const accent = new VF.Articulation('a>');
                if (typeof accent.setYShift === 'function') {
                  accent.setYShift(25); // Position below note
                }
                if (typeof accent.setPosition === 'function') {
                  accent.setPosition(4); // Position 4 = below note
                }
                note.addModifier(accent, 0);
              } catch (e) {
                console.error('Failed to add accent:', e);
              }
            }

            // Add sticking annotation
            const stickingToken = stickingTokens[i % stickingTokens.length];
            if (stickingToken && stickingToken !== '-' && stickingToken !== 'K') {
              try {
                const annotation = new VF.Annotation(stickingToken);
                annotation.setFont('Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 16, '600');
                annotation.setJustification(1); // CENTER
                annotation.setVerticalJustification(2); // BOTTOM
                annotation.setYShift(140); // Position below stave
                annotation.setStyle({ fillStyle: '#ffffff', strokeStyle: '#ffffff' });
                note.addModifier(annotation, 0);
              } catch (e) {
                console.error('Failed to add annotation:', e);
              }
            }

            barNotes.push(note);
          }

          // Create beams for the bar
          if (pattern.subdivision >= 8) {
            const beamGroups: any[] = [];
            let currentGroup: any[] = [];

            barNotes.forEach((note, index) => {
              // Check if note is a rest by checking duration string
              const duration = note.getDuration ? note.getDuration() : note.duration || '';
              const isRest = duration.includes('r') || duration.includes('R');
              
              if (!isRest) {
                currentGroup.push(note);
              } else {
                if (currentGroup.length > 1) {
                  beamGroups.push(currentGroup);
                }
                currentGroup = [];
              }
            });

            if (currentGroup.length > 1) {
              beamGroups.push(currentGroup);
            }

            beamGroups.forEach((group) => {
              const beam = new VF.Beam(group);
              barBeams.push(beam);
            });
          }

          allNotes.push(...barNotes);
          allBeams.push(...barBeams);
        }

        console.log('[LandingStave] Created notes:', {
          totalNotes: allNotes.length,
          totalBeams: allBeams.length,
          notesPerBar,
        });

        // Create voice and format
        if (allNotes.length === 0) {
          console.error('No notes created for pattern:', pattern);
          return;
        }

        const voice = new VF.Voice({ num_beats: 2 * timeSignature[0], beat_value: timeSignature[1] });
        voice.addTickables(allNotes);
        voice.setStrict(false);

        // Format with available width (leave space for clef and time signature)
        const formatWidth = Math.max(200, availableWidth - 120);
        try {
          const formatter = new VF.Formatter().joinVoices([voice]).format([voice], formatWidth);
          voice.draw(context, stave);
        } catch (error) {
          console.error('Error formatting or drawing voice:', error);
          // Try drawing without formatting
          voice.draw(context, stave);
        }

        // Draw beams
        allBeams.forEach((beam) => {
          beam.setContext(context).draw();
        });

        // Get note groups for highlighting and apply dark mode styling
        const svgElement = staveRef.current!.querySelector('svg');
        if (svgElement) {
          // Apply dark mode styling to SVG
          svgElement.style.backgroundColor = 'transparent';
          
          // Set all paths, lines, and text to white for dark mode
          const allElements = svgElement.querySelectorAll('path, line, text, tspan, circle, ellipse, rect');
          allElements.forEach((el) => {
            const svgEl = el as SVGElement;
            const currentFill = svgEl.getAttribute('fill');
            const currentStroke = svgEl.getAttribute('stroke');
            
            // Only change black/dark colors to white, preserve other colors
            if (currentFill === '#000000' || currentFill === 'black' || currentFill === '#000') {
              svgEl.setAttribute('fill', '#ffffff');
            }
            if (currentStroke === '#000000' || currentStroke === 'black' || currentStroke === '#000') {
              svgEl.setAttribute('stroke', '#ffffff');
            }
          });
          
          const groups = Array.from(svgElement.querySelectorAll('.vf-stavenote')) as SVGElement[];
          noteGroupsRef.current = groups;
          if (onNotesReady) {
            onNotesReady(groups);
          }

          // Align sticking annotations
          setTimeout(() => {
            const staveBBox = svgElement.querySelector('.vf-stave')?.getBBox();
            if (staveBBox) {
              const baseY = staveBBox.y + staveBBox.height + 30;
              groups.forEach((noteGroup) => {
                const annotation = noteGroup.querySelector('.vf-annotation text, .vf-annotation tspan') as SVGTextElement;
                if (annotation) {
                  const noteBBox = noteGroup.getBBox();
                  const circles = noteGroup.querySelectorAll('circle, ellipse');
                  let noteX = noteBBox.x + (noteBBox.width / 2);
                  
                  if (circles.length > 0) {
                    const notehead = circles[0] as SVGCircleElement | SVGEllipseElement;
                    try {
                      const cx = parseFloat(notehead.getAttribute('cx') || '0');
                      if (cx > 0) {
                        noteX = cx;
                      }
                    } catch (e) {}
                  }
                  
                  annotation.setAttribute('x', noteX.toString());
                  annotation.setAttribute('y', baseY.toString());
                  annotation.setAttribute('text-anchor', 'middle');
                  annotation.setAttribute('dominant-baseline', 'hanging');
                  annotation.removeAttribute('transform');
                }
              });
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error rendering VexFlow stave:', error);
      }
    };

    checkVexFlow();

    return () => {
      window.removeEventListener('vexflow-loaded', handleVexFlowLoaded);
    };
  }, [pattern, onNotesReady]);

  // Animate note highlighting
  useEffect(() => {
    if (noteGroupsRef.current.length === 0) return;

    // Filter out rest notes (they have 'b/4' key which shows as a rest symbol)
    const nonRestNotes = noteGroupsRef.current.filter((group) => {
      // Check if this is a rest note by looking for rest symbols
      const hasRestSymbol = group.querySelector('path[data-name="rest"]') !== null;
      return !hasRestSymbol;
    });

    if (nonRestNotes.length === 0) return;

    const totalNotes = nonRestNotes.length;
    let currentIndex = 0;

    const highlightNote = (index: number) => {
      // Reset all notes
      noteGroupsRef.current.forEach((group) => {
        const elements = group.querySelectorAll('path, circle, ellipse, rect, line');
        elements.forEach((el) => {
          const svgEl = el as SVGElement;
          svgEl.style.transition = 'all 0.2s ease';
          svgEl.style.fill = '';
          svgEl.style.stroke = '';
          svgEl.style.filter = '';
          svgEl.style.transform = '';
        });
      });

      // Highlight current note
      const targetGroup = nonRestNotes[index];
      if (targetGroup) {
        const elements = targetGroup.querySelectorAll('path, circle, ellipse, rect, line');
        elements.forEach((el) => {
          const svgEl = el as SVGElement;
          const isStem = el.tagName === 'line' || (el.tagName === 'path' && svgEl.getAttribute('fill') === 'none');
          
          if (isStem) {
            svgEl.style.stroke = '#8b5cf6';
            svgEl.style.strokeWidth = '2.5';
          } else {
            svgEl.style.fill = '#8b5cf6';
            svgEl.style.filter = 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.8))';
          }
        });
      }

      currentIndex = (currentIndex + 1) % totalNotes;
    };

    // Start animation
    highlightNote(0);
    const interval = setInterval(() => {
      highlightNote(currentIndex);
      setActiveNoteIndex(currentIndex);
    }, 600); // 100 BPM (600ms per note at 16th note subdivision)

    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [noteGroupsRef.current.length]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={staveRef} 
        className="dpgen-stave dpgen-dark-mode" 
        style={{ 
          minHeight: '200px',
          backgroundColor: 'transparent',
        }} 
      />
    </div>
  );
}

