'use client';

import { useEffect, useRef, useState } from 'react';
import { generateRandomPattern, parseTokens, parseTimeSignature, calculateNotesPerBar } from '@/lib/utils/patternUtils';
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
  pattern?: Pattern | null; // Optional external pattern
}

export function LandingStave({ className = '', onNotesReady, pattern: externalPattern }: LandingStaveProps) {
  const staveRef = useRef<HTMLDivElement>(null);
  const [internalPattern, setInternalPattern] = useState<Pattern | null>(null);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const noteGroupsRef = useRef<SVGElement[]>([]);
  const animationRef = useRef<number | null>(null);

  // Use external pattern if provided and not null, otherwise use internal pattern
  const pattern = (externalPattern !== undefined && externalPattern !== null) ? externalPattern : internalPattern;

    // Generate a simple, reliable pattern for landing page display
    // Use quarter notes only to avoid VexFlow tick issues
    useEffect(() => {
      // Only set internal pattern if no external pattern is provided or external pattern is null
      if (externalPattern !== undefined && externalPattern !== null) return;
      
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
      
      setInternalPattern(simplePattern);
    }, [externalPattern]);

  // Render VexFlow stave
  useEffect(() => {
    if (!pattern || !staveRef.current || typeof window === 'undefined') return;

    // Wait for VexFlow to load (it's loaded by VexFlowLoader in root layout)
    let VF: any = null;
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    let renderTimeout: NodeJS.Timeout | null = null;

    // Define renderStave function FIRST before any functions that use it
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
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
        const isMobile = viewportWidth < 768;
        const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
        
        // Calculate width based on number of notes to fit the full bar
        const patternSubdivision = pattern.subdivision || 8;
        const notesPerBar = calculateNotesPerBar(pattern.timeSignature || '4/4', patternSubdivision);
        
        // Responsive note width calculation - smaller on mobile
        let noteWidth: number;
        if (isMobile) {
          // Mobile: more compact spacing
          noteWidth = patternSubdivision === 4 ? 40 : patternSubdivision === 8 ? 30 : 25;
        } else if (isTablet) {
          // Tablet: medium spacing
          noteWidth = patternSubdivision === 4 ? 50 : patternSubdivision === 8 ? 38 : 32;
        } else {
          // Desktop: full spacing
          noteWidth = patternSubdivision === 4 ? 60 : patternSubdivision === 8 ? 45 : 40;
        }
        
        // Calculate minimum width needed for the bar
        const clefAndTimeSigWidth = 80; // Space for clef and time signature
        const padding = isMobile ? 20 : 40;
        const minRequiredWidth = notesPerBar * noteWidth + clefAndTimeSigWidth + padding;
        
        // On mobile, allow horizontal scrolling if needed (use minimum width)
        // On larger screens, fit to container
        let staveWidth: number;
        if (isMobile) {
          // Mobile: use minimum required width, allow scrolling
          staveWidth = Math.max(minRequiredWidth, Math.min(containerWidth - padding, minRequiredWidth));
        } else {
          // Desktop/Tablet: fit to container with max constraint
          const maxWidth = isTablet ? containerWidth - padding : Math.min(containerWidth - padding, 900);
          staveWidth = Math.max(minRequiredWidth, Math.min(maxWidth, minRequiredWidth));
        }
        
        const staveHeight = isMobile ? 180 : 200;

        // Create renderer with proper size
        const renderer = new VF.Renderer(staveRef.current!, VF.Renderer.Backends.SVG);
        renderer.resize(staveWidth, staveHeight);
        const context = renderer.getContext();
        
        // Set dark mode colors
        context.setFillStyle('#ffffff');
        context.setStrokeStyle('#ffffff');

        // Parse pattern data - render full bar
        const timeSignature = parseTimeSignature(pattern.timeSignature || '4/4');
        const [numerator, denominator] = timeSignature;
        
        // Get full pattern tokens for the bar
        const drumPatternTokens = parseTokens(pattern.drumPattern || 'S K S K').slice(0, notesPerBar).map((token) => token.toUpperCase());
        const stickingTokens = parseTokens(pattern.stickingPattern || 'R K L K').slice(0, notesPerBar);
        const accentIndices = pattern._presetAccents || [];
        
        // Determine note duration based on subdivision
        let noteDuration: string;
        
        if (patternSubdivision === 4) {
          noteDuration = 'q'; // Quarter notes
        } else {
          noteDuration = '8'; // Eighth notes (default)
        }

        // Create stave with responsive width
        const leftMargin = isMobile ? 8 : 10;
        const rightMargin = isMobile ? 12 : 20;
        const availableWidth = staveWidth - leftMargin - rightMargin;
        const stave = new VF.Stave(leftMargin, 40, availableWidth);
        stave.addClef('percussion');
        stave.addTimeSignature(`${timeSignature[0]}/${timeSignature[1]}`);
        stave.setContext(context).draw();

        // Build notes for full bar
        const allNotes: any[] = [];
        const isRestNote: boolean[] = []; // Track which notes are rests
        noteGroupsRef.current = [];
        const notesPerBeat = patternSubdivision / denominator;

        // Create notes for the full bar
        for (let i = 0; i < notesPerBar; i++) {
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

          // Create note with appropriate duration
          const restDuration = noteDuration === 'q' ? 'qr' : noteDuration === '8' ? '8r' : '16r';
          const note = new VF.StaveNote({
            clef: 'percussion',
            keys,
            duration: isRest ? restDuration : noteDuration,
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
          isRestNote.push(isRest); // Track if this note is a rest
        }

        // Calculate format width to fit all notes in the bar (responsive)
        const formatPadding = isMobile ? 80 : 140;
        const formatWidth = Math.max(200, availableWidth - formatPadding); // Leave space for clef, time sig, padding
        
        // Create voice with proper time signature
        const voice = new VF.Voice({ num_beats: numerator, beat_value: denominator });
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
          const fallbackVoice = new VF.Voice({ num_beats: numerator, beat_value: denominator });
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

        // Create beams - only for non-rest notes, grouped properly
        const beams: any[] = [];
        
        if (patternSubdivision === 8) {
          // Eighth notes: group by 2 per beat, but skip groups with rests
          for (let i = 0; i < allNotes.length; i += 2) {
            if (i + 1 < allNotes.length) {
              // Check if either note in the pair is a rest
              if (!isRestNote[i] && !isRestNote[i + 1]) {
                // Both notes are not rests - create beam
                try {
                  const beam = new VF.Beam([allNotes[i], allNotes[i + 1]]);
                  if (typeof beam.setStemDirection === 'function') {
                    beam.setStemDirection(1); // Upward stems
                  }
                  beams.push(beam);
                } catch (e) {
                  // Continue if beam creation fails
                }
              }
            }
          }
        }

        // Format and draw - with comprehensive error handling
        try {
          const formatter = new VF.Formatter().joinVoices([voice]).format([voice], formatWidth);
          voice.draw(context, stave);
          
          // Draw beams after notes
          beams.forEach((beam) => {
            try {
              beam.setContext(context).draw();
            } catch (e) {
              // Continue if beam drawing fails
            }
          });
        } catch (error) {
          console.error('[LandingStave] Error formatting voice:', error);
          // If formatting fails, try drawing without formatting
          try {
            voice.draw(context, stave);
            beams.forEach((beam) => {
              try {
                beam.setContext(context).draw();
              } catch (e) {}
            });
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

    // Now define functions that use renderStave (after renderStave is defined)
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

    // Debounced render function for resize handling
    const debouncedRender = () => {
      if (renderTimeout) clearTimeout(renderTimeout);
      renderTimeout = setTimeout(() => {
        if (VF && VF.Renderer && VF.Stave) {
          renderStave(VF);
        }
      }, 150);
    };

    // Listen for the vexflow-loaded event
    const handleVexFlowLoaded = () => {
      if ((window as any).VF) {
        VF = (window as any).VF;
        if (VF && VF.Renderer && VF.Stave) {
          renderStave(VF);
        }
      }
    };

    // Set up event listeners
    window.addEventListener('vexflow-loaded', handleVexFlowLoaded);
    
    // Handle window resize for responsive updates
    window.addEventListener('resize', debouncedRender);
    
    // ResizeObserver for container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (staveRef.current?.parentElement && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(debouncedRender);
      resizeObserver.observe(staveRef.current.parentElement);
    }

    // Start checking for VexFlow
    checkVexFlow();

    // Cleanup
    return () => {
      window.removeEventListener('vexflow-loaded', handleVexFlowLoaded);
      window.removeEventListener('resize', debouncedRender);
      if (renderTimeout) clearTimeout(renderTimeout);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [pattern, onNotesReady]);

  // Animate note highlighting
  useEffect(() => {
    if (!pattern) return; // Don't animate if no pattern
    
    let interval: NodeJS.Timeout | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    
    // Clear any existing intervals first
    if (interval) clearInterval(interval);
    if (retryTimeout) clearTimeout(retryTimeout);

    // Orange highlight color matching the main app
    const highlightColor = '#f97316'; // Orange
    const highlightGlow = 'rgba(249, 115, 22, 0.6)';

    const startAnimation = () => {
      // Reset all notes first to clear previous highlighting
      if (noteGroupsRef.current.length > 0) {
        noteGroupsRef.current.forEach((group) => {
          const elements = group.querySelectorAll('path, circle, ellipse, rect, line');
          elements.forEach((el) => {
            const svgEl = el as SVGElement;
            svgEl.style.fill = '';
            svgEl.style.stroke = '';
            svgEl.style.filter = '';
          });
          const annotationText = group.querySelector('.vf-annotation text, .vf-annotation tspan') as SVGTextElement;
          if (annotationText) {
            annotationText.style.fill = '';
            annotationText.style.filter = '';
          }
        });
      }

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

      // Calculate timing based on pattern subdivision
      // At 100 BPM: quarter note = 600ms, eighth note = 300ms
      const bpm = 100;
      const quarterNoteMs = (60 / bpm) * 1000; // 600ms at 100 BPM
      const subdivision = pattern?.subdivision || 8;
      const noteDurationMs = subdivision === 4 ? quarterNoteMs : quarterNoteMs / 2; // Eighth notes are half duration

      // Start animation
      highlightNote(0);
      interval = setInterval(() => {
        highlightNote(currentIndex);
        setActiveNoteIndex(currentIndex);
      }, noteDurationMs);
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
  }, [pattern, pattern?.id]); // Restart when pattern changes or pattern ID changes

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={staveRef} 
        className="dpgen-stave dpgen-dark-mode" 
        style={{ 
          minHeight: '200px',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          backgroundColor: 'transparent',
        }} 
      />
    </div>
  );
}

