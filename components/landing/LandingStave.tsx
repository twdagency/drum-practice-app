'use client';

import { useEffect, useRef, useState } from 'react';
import { generateRandomPattern, parseTokens, parseTimeSignature, getNotesPerBarForPattern, calculateNotesPerBar } from '@/lib/utils/patternUtils';
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

    // Generate a simple, reliable pattern for landing page display
    // Use quarter notes only to avoid VexFlow tick issues
    useEffect(() => {
      // Create a simple 4-note pattern for landing page
      const simplePattern: Pattern = {
        id: Date.now(),
        timeSignature: '4/4',
        subdivision: 4, // Quarter notes only - simplest and most reliable
        phrase: '1 2 3 4',
        drumPattern: 'S K S K', // Simple 4-note pattern
        stickingPattern: 'R K L K',
        leftFoot: false,
        rightFoot: false,
        repeat: 1,
        _expanded: true,
        _presetAccents: [0],
      };
      
      setPattern(simplePattern);
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
        // Increase width for higher subdivisions (sextuplets, 32nd notes, etc.)
        const subdivision = pattern.subdivision || 16;
        const widthMultiplier = subdivision >= 24 ? 1.5 : subdivision >= 16 ? 1.3 : 1.0;
        const baseWidth = Math.max(500, containerWidth - 40); // Increased base width
        const staveWidth = Math.floor(baseWidth * widthMultiplier);
        const staveHeight = 200;

        // Create renderer with proper size
        const renderer = new VF.Renderer(staveRef.current!, VF.Renderer.Backends.SVG);
        renderer.resize(staveWidth, staveHeight);
        const context = renderer.getContext();
        
        // Set dark mode colors
        context.setFillStyle('#ffffff');
        context.setStrokeStyle('#ffffff');

        // Parse pattern data - landing page uses simple 4-note pattern
        const drumPatternTokens = parseTokens(pattern.drumPattern || 'S K S K').slice(0, 4).map((token) => token.toUpperCase());
        const stickingTokens = parseTokens(pattern.stickingPattern || 'R K L K').slice(0, 4);
        const timeSignature = parseTimeSignature(pattern.timeSignature || '4/4');
        const accentIndices = pattern._presetAccents || [];

        // Create stave with responsive width
        const leftMargin = 10;
        const availableWidth = staveWidth - leftMargin - 20;
        const stave = new VF.Stave(leftMargin, 40, availableWidth);
        stave.addClef('percussion');
        stave.addTimeSignature(`${timeSignature[0]}/${timeSignature[1]}`);
        stave.setContext(context).draw();

        // Build exactly 4 quarter notes for landing page
        const allNotes: any[] = [];
        noteGroupsRef.current = [];

        // Create exactly 4 quarter notes
        for (let i = 0; i < 4; i++) {
          const drumToken = drumPatternTokens[i] || 'S';
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
                if (position) {
                  keys.push(position);
                } else {
                  keys.push(keyMap.S);
                }
              }
            }
            if (keys.length === 0) {
              keys.push(keyMap.S);
            }
          }

          // Create quarter note
          const note = new VF.StaveNote({
            clef: 'percussion',
            keys,
            duration: isRest ? 'qr' : 'q',
            stem_direction: 1,
          });

          // Add accent if needed
          if (accentIndices.includes(i) && !isRest) {
            try {
              const accent = new VF.Articulation('a>');
              if (typeof accent.setYShift === 'function') {
                accent.setYShift(25);
              }
              if (typeof accent.setPosition === 'function') {
                accent.setPosition(4);
              }
              note.addModifier(accent, 0);
            } catch (e) {
              // Ignore accent errors
            }
          }

          // Add sticking annotation
          const stickingToken = stickingTokens[i] || '';
          if (stickingToken && stickingToken !== '-') {
            try {
              const annotation = new VF.Annotation(stickingToken);
              annotation.setFont('Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 16, '600');
              annotation.setJustification(1);
              annotation.setVerticalJustification(2);
              annotation.setYShift(140);
              annotation.setStyle({ fillStyle: '#ffffff', strokeStyle: '#ffffff' });
              note.addModifier(annotation, 0);
            } catch (e) {
              // Ignore annotation errors
            }
          }

          allNotes.push(note);
        }

        // Calculate format width before creating voice
        const formatWidth = Math.max(300, Math.floor((availableWidth - 120) * 1.0));
        
        // Create voice with exactly 4 beats
        const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
        voice.setStrict(false);
        
        try {
          voice.addTickables(allNotes);
        } catch (error) {
          console.error('[LandingStave] Error adding tickables, using single note fallback:', error);
          // Fallback: single note
          const singleNote = new VF.StaveNote({
            clef: 'percussion',
            keys: [keyMap.S],
            duration: 'q',
            stem_direction: 1,
          });
          const fallbackVoice = new VF.Voice({ num_beats: 4, beat_value: 4 });
          fallbackVoice.setStrict(false);
          fallbackVoice.addTickable(singleNote);
          
          try {
            const formatter = new VF.Formatter().joinVoices([fallbackVoice]).format([fallbackVoice], formatWidth);
            fallbackVoice.draw(context, stave);
          } catch (e) {
            console.error('[LandingStave] Complete rendering failure:', e);
          }
          return; // Exit early with fallback
        }

        // Format and draw - with comprehensive error handling
        try {
          const formatter = new VF.Formatter().joinVoices([voice]).format([voice], formatWidth);
          voice.draw(context, stave);
        } catch (error) {
          console.error('[LandingStave] Error formatting voice:', error);
          // If formatting fails, try drawing without formatting
          try {
            voice.draw(context, stave);
          } catch (drawError) {
            console.error('[LandingStave] Error drawing voice:', drawError);
            // Last resort: render a simple static message
            if (staveRef.current) {
              staveRef.current.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #ffffff;">
                  <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">Professional Drum Notation</p>
                  <p style="font-size: 0.875rem; color: #94a3b8;">VexFlow rendering unavailable</p>
                </div>
              `;
            }
            return;
          }
        }

        // No beams needed for quarter notes - skip beam drawing

        // Position sticking annotations immediately after drawing - synchronously to prevent visual jump
        const svgElement = staveRef.current!.querySelector('svg');
        if (svgElement) {
          const staveEl = svgElement.querySelector('.vf-stave') as SVGElement;
          if (staveEl) {
            try {
              const staveBBox = staveEl.getBBox();
              const absoluteY = staveBBox.y + staveBBox.height + 30; // 30px below stave
              
              // Position all annotations immediately
              const allNoteGroups = Array.from(svgElement.querySelectorAll('.vf-stavenote')) as SVGElement[];
              allNoteGroups.forEach((noteGroup) => {
                const annotationGroup = noteGroup.querySelector('.vf-annotation') as SVGGElement;
                const annotation = noteGroup.querySelector('.vf-annotation text, .vf-annotation tspan') as SVGTextElement;
                
                if (annotation) {
                  const noteBBox = noteGroup.getBBox();
                  let absoluteX = noteBBox.x + (noteBBox.width / 2);
                  
                  // Try to get notehead center for more accurate X positioning
                  const circles = noteGroup.querySelectorAll('circle, ellipse');
                  if (circles.length > 0) {
                    const notehead = circles[0] as SVGCircleElement | SVGEllipseElement;
                    try {
                      const cx = parseFloat(notehead.getAttribute('cx') || '0');
                      if (cx > 0) absoluteX = cx;
                    } catch (e) {}
                  }
                  
                  // Position immediately - set attributes synchronously
                  annotation.setAttribute('x', absoluteX.toString());
                  annotation.setAttribute('y', absoluteY.toString());
                  annotation.setAttribute('text-anchor', 'middle');
                  annotation.setAttribute('dominant-baseline', 'hanging');
                  
                  // Remove any transforms
                  if (annotationGroup) {
                    annotationGroup.removeAttribute('transform');
                    annotationGroup.style.transform = 'none';
                  }
                  annotation.removeAttribute('transform');
                  annotation.style.transform = 'none';
                }
              });
            } catch (e) {
              // If positioning fails, continue
            }
          }
        }

          // Get note groups for highlighting and apply dark mode styling
        // Use multiple retries to ensure rendering is complete
        let retryCount = 0;
        const maxRetries = 5;
        const applyStyling = () => {
          const svgElement = staveRef.current!.querySelector('svg');
          if (!svgElement) {
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(applyStyling, 100);
            }
            return;
          }

          // Check if notes are actually rendered
          const groups = Array.from(svgElement.querySelectorAll('.vf-stavenote')) as SVGElement[];
          if (groups.length === 0 && retryCount < maxRetries) {
            retryCount++;
            setTimeout(applyStyling, 150);
            return;
          }

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
          
          noteGroupsRef.current = groups;
          if (onNotesReady) {
            onNotesReady(groups);
          }
        };
        
        // Start styling with initial delay
        setTimeout(applyStyling, 100);
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
    let interval: NodeJS.Timeout | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    // Orange highlight color matching the main app
    const highlightColor = '#f97316'; // Orange
    const highlightGlow = 'rgba(249, 115, 22, 0.6)';

    const startAnimation = () => {
      // Refresh note groups in case they weren't ready
      const svgElement = staveRef.current?.querySelector('svg');
      if (svgElement) {
        const groups = Array.from(svgElement.querySelectorAll('.vf-stavenote')) as SVGElement[];
        noteGroupsRef.current = groups;
      }

      if (noteGroupsRef.current.length === 0) {
        // Retry after a short delay if notes aren't ready
        retryTimeout = setTimeout(startAnimation, 200);
        return;
      }

      // Filter out rest notes (they have 'b/4' key which shows as a rest symbol)
      const nonRestNotes = noteGroupsRef.current.filter((group) => {
        // Check if this is a rest note by looking for rest symbols
        const hasRestSymbol = group.querySelector('path[data-name="rest"]') !== null;
        return !hasRestSymbol;
      });

      if (nonRestNotes.length === 0) {
        retryTimeout = setTimeout(startAnimation, 200);
        return;
      }

      const totalNotes = nonRestNotes.length;
      let currentIndex = 0;

      const highlightNote = (index: number) => {
        // Reset all notes and annotations
        noteGroupsRef.current.forEach((group) => {
          // Reset note elements
          const elements = group.querySelectorAll('path, circle, ellipse, rect, line');
          elements.forEach((el) => {
            const svgEl = el as SVGElement;
            svgEl.style.transition = 'all 0.2s ease';
            svgEl.style.fill = '';
            svgEl.style.stroke = '';
            svgEl.style.filter = '';
            svgEl.style.transform = '';
          });

          // Reset annotation text
          const annotationText = group.querySelector('.vf-annotation text, .vf-annotation tspan') as SVGTextElement;
          if (annotationText) {
            annotationText.style.fill = '';
            annotationText.style.filter = '';
          }
        });

        // Highlight current note
        const targetGroup = nonRestNotes[index];
        if (targetGroup) {
          // Highlight note elements
          const elements = targetGroup.querySelectorAll('path, circle, ellipse, rect, line');
          elements.forEach((el) => {
            const svgEl = el as SVGElement;
            const isStem = el.tagName === 'line' || (el.tagName === 'path' && svgEl.getAttribute('fill') === 'none');
            
            if (isStem) {
              svgEl.style.stroke = highlightColor;
              svgEl.style.strokeWidth = '2.5';
            } else {
              svgEl.style.fill = highlightColor;
              svgEl.style.filter = `drop-shadow(0 0 6px ${highlightGlow})`;
            }
          });

          // Highlight annotation (sticking letter)
          const annotationText = targetGroup.querySelector('.vf-annotation text, .vf-annotation tspan') as SVGTextElement;
          if (annotationText) {
            annotationText.style.fill = highlightColor;
            annotationText.style.filter = `drop-shadow(0 0 4px ${highlightGlow})`;
          }
        }

        currentIndex = (currentIndex + 1) % totalNotes;
      };

      // Start animation
      highlightNote(0);
      interval = setInterval(() => {
        highlightNote(currentIndex);
        setActiveNoteIndex(currentIndex);
      }, 600); // 100 BPM (600ms per note at 16th note subdivision)
    };

    startAnimation();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [pattern]); // Restart when pattern changes

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

