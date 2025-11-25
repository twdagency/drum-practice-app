/**
 * Visual Metronome Component - Animated pendulum and beat indicators
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/store/useStore';

export function VisualMetronome() {
  const armRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  // Initialize position - start with default to avoid hydration mismatch
  // Default position will be calculated on client side to position to the right of notation
  const [position, setPosition] = useState({ x: 1200, y: 80 }); // Fallback for SSR
  
  // Create portal container on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.id = 'visual-metronome-portal';
      document.body.appendChild(container);
      setPortalContainer(container);
      
      return () => {
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      };
    }
  }, []);
  
  // Load position from localStorage on client side only (after mount)
  // If no saved position, calculate default position to the right of notation section
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('visualMetronomePosition');
        let useSavedPosition = false;
        
        if (saved) {
          const parsed = JSON.parse(saved);
          // Check if saved position is valid and not the old default (middle/left of page)
          // Old defaults were around x: 16 or x: 1200 (fallback)
          // If it's in the left half of the screen, recalculate
          if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            // If position is in the left 60% of screen, it's likely the old default - recalculate
            if (parsed.x < window.innerWidth * 0.6) {
              useSavedPosition = false;
            } else {
              useSavedPosition = true;
              setPosition(parsed);
            }
          }
        }
        
        // If we're not using saved position, calculate default position to the right of notation section
        if (!useSavedPosition) {
          const calculateDefaultPosition = () => {
            const staveColumn = document.querySelector('.dpgen-stave-column');
            if (staveColumn) {
              const rect = staveColumn.getBoundingClientRect();
              // Only use this if the element has a valid width (is rendered)
              if (rect.width > 0 && rect.right > 0) {
                // Position to the right of the stave column with a small margin
                const margin = 16;
                const defaultX = rect.right + margin;
                // Position vertically aligned with the top of the notation card (accounting for padding)
                const defaultY = rect.top + 80; // Offset from top of stave column
                return { x: defaultX, y: defaultY };
              }
            }
            
            // Fallback: if stave column not found or not rendered, use viewport-based calculation
            // On large screens, patterns take 1/3, stave takes 2/3
            // Position just to the right of the stave (which starts at ~33% and ends at ~100%)
            const containerPadding = 32; // Account for container padding
            // Calculate based on typical layout: container has padding, patterns ~33%, stave ~67%
            // Position at ~70% of viewport width to be to the right of stave
            const defaultX = window.innerWidth * 0.70;
            return { x: defaultX, y: 80 };
          };
          
          // Try multiple times to ensure layout is ready
          let attempts = 0;
          const maxAttempts = 10;
          
          const tryCalculate = () => {
            attempts++;
            const defaultPos = calculateDefaultPosition();
            
            // If we got a reasonable position (not fallback) or we've tried enough times
            if (defaultPos.x > window.innerWidth * 0.5 || attempts >= maxAttempts) {
              setPosition(defaultPos);
              // Save the default position so it persists
              localStorage.setItem('visualMetronomePosition', JSON.stringify(defaultPos));
            } else {
              // Try again after a short delay
              setTimeout(tryCalculate, 100);
            }
          };
          
          // Start trying after initial delay
          const timeoutId = setTimeout(tryCalculate, 200);
          
          return () => clearTimeout(timeoutId);
        }
      } catch (e) {
        // On error, calculate and use default position
        const defaultX = typeof window !== 'undefined' 
          ? window.innerWidth * 0.70
          : 1200;
        setPosition({ x: defaultX, y: 80 });
      }
    }
  }, []);

  // Only render after mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const showVisualMetronome = useStore((state) => state.showVisualMetronome);
  const isPlaying = useStore((state) => state.isPlaying);
  const bpm = useStore((state) => state.bpm);
  const currentBeat = useStore((state) => state.currentBeat);
  const patterns = useStore((state) => state.patterns);
  const setShowVisualMetronome = useStore((state) => state.setShowVisualMetronome);
  
  // Get time signature from first pattern (default to 4/4)
  const timeSignature = patterns.length > 0 ? patterns[0].timeSignature : '4/4';
  const [numerator] = timeSignature.split('/').map(Number);
  const beatsPerBar = numerator || 4;
  
  // Save position to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('visualMetronomePosition', JSON.stringify(position));
    }
  }, [position]);

  useEffect(() => {
    if (!armRef.current) return;
    
    if (isPlaying && showVisualMetronome) {
      // Calculate animation duration for one bar based on time signature
      const beatDuration = 60000 / bpm; // milliseconds per beat
      const barDuration = beatDuration * beatsPerBar; // beats per bar based on time signature
      
      // Start continuous smooth animation - one full cycle per bar
      armRef.current.style.animation = `metronomeSwing ${barDuration}ms ease-in-out infinite`;
    } else {
      // Stop animation
      if (armRef.current) {
        armRef.current.style.animation = 'none';
        armRef.current.style.transform = 'rotate(0deg)';
      }
    }
  }, [isPlaying, showVisualMetronome, bpm, beatsPerBar, mounted]);

  // Dragging is now handled via onMouseDown on the container div

  const handleClose = () => {
    setShowVisualMetronome(false);
  };

  // Don't render until mounted (prevents flash on page load)
  if (!mounted || !showVisualMetronome || !portalContainer) {
    return null;
  }

  const metronomeContent = (
    <div 
      ref={containerRef}
      className="dpgen-visual-metronome" 
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '1.5rem',
        background: '#f8fafc',
        borderRadius: '10px',
        border: '1px solid var(--dpgen-border)',
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000, // Above toolbar and other UI elements
        cursor: isDragging ? 'grabbing' : 'default',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        userSelect: 'none',
        pointerEvents: 'auto',
        willChange: isDragging ? 'transform' : 'auto',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'translateZ(0)'
      }}
      onMouseDown={(e) => {
        // Allow dragging from anywhere on the metronome, except buttons and interactive elements
        const target = e.target as HTMLElement;
        if (target.closest('.dpgen-metronome-close') || 
            target.closest('.dpgen-beat-dot') ||
            target.closest('button') ||
            target.tagName === 'BUTTON') {
          return;
        }
        
        // Allow dragging from anywhere on the container
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        let rafId: number | null = null;
        const handleMouseMove = (e: MouseEvent) => {
          e.preventDefault();
          if (rafId !== null) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            setPosition({ 
              x: Math.max(0, Math.min(maxX, newX)), 
              y: Math.max(0, Math.min(maxY, newY))
            });
            rafId = null;
          });
        };

        const handleMouseUp = () => {
          setIsDragging(false);
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }}
      onTouchStart={(e) => {
        // Allow dragging from anywhere on the metronome, except buttons
        const target = e.target as HTMLElement;
        if (target.closest('.dpgen-metronome-close') || 
            target.closest('.dpgen-beat-dot')) {
          return;
        }
        
        // Allow dragging from anywhere on the container
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const touch = e.touches[0];
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;

        const handleTouchMove = (e: TouchEvent) => {
          if (e.touches.length !== 1) return;
          const touch = e.touches[0];
          const newX = touch.clientX - offsetX;
          const newY = touch.clientY - offsetY;
          const maxX = window.innerWidth - rect.width;
          const maxY = window.innerHeight - rect.height;
          setPosition({ 
            x: Math.max(0, Math.min(maxX, newX)), 
            y: Math.max(0, Math.min(maxY, newY))
          });
        };

        const handleTouchEnd = () => {
          setIsDragging(false);
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
      }}
    >
      {/* Drag handle and close button */}
      <div 
        className="dpgen-metronome-drag-handle"
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          padding: '0.25rem',
          borderRadius: '4px',
          transition: isDragging ? 'none' : 'background 0.2s ease',
          pointerEvents: 'auto',
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            (e.currentTarget as HTMLElement).style.background = 'rgba(0, 0, 0, 0.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="dpgen-metronome-close"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--dpgen-muted)',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.1)';
            (e.currentTarget as HTMLElement).style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--dpgen-muted)';
          }}
          title="Close metronome"
        >
          <i className="fas fa-times" />
        </button>
        <div 
          style={{ 
            color: 'var(--dpgen-muted)', 
            fontSize: '0.75rem',
            pointerEvents: 'none'
          }}
          title="Drag to move"
        >
          <i className="fas fa-grip-vertical" />
        </div>
      </div>
      <div className="dpgen-metronome-pendulum" style={{
        width: '80px',
        height: '120px',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginTop: '1rem' // Add space for close button
      }}>
        {/* Visual click indicator - flashes on beat 1 */}
        {currentBeat === 1 && isPlaying && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(60, 109, 240, 0.2)',
              border: '2px solid var(--dpgen-primary)',
              animation: 'clickFlash 0.2s ease-out',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        )}
        <div 
          ref={armRef}
          className="dpgen-metronome-arm"
          style={{
            width: '4px',
            height: '80px',
            background: currentBeat === 1 && isPlaying 
              ? 'var(--dpgen-primary)' 
              : 'var(--dpgen-accent)',
            borderRadius: '2px',
            transformOrigin: 'top center',
            boxShadow: currentBeat === 1 && isPlaying
              ? '0 0 8px rgba(60, 109, 240, 0.6)'
              : '0 2px 4px rgba(0, 0, 0, 0.1)',
            willChange: 'transform',
            transition: 'background 0.15s ease, box-shadow 0.15s ease',
            zIndex: 2,
            position: 'relative'
          }}
        />
      </div>
      <div className="dpgen-metronome-beat-indicator" style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {Array.from({ length: beatsPerBar }, (_, i) => i + 1).map((beat) => (
          <div
            key={beat}
            className={`dpgen-beat-dot ${currentBeat === beat ? 'dpgen-beat-dot--active' : ''}`}
            data-beat={beat}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: currentBeat === beat 
                ? (beat === 1 ? 'var(--dpgen-primary)' : 'var(--dpgen-accent)')
                : 'var(--dpgen-border)',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              border: currentBeat === beat 
                ? `2px solid ${beat === 1 ? 'var(--dpgen-primary)' : 'var(--dpgen-accent)'}`
                : '2px solid transparent',
              transform: currentBeat === beat ? 'scale(1.4)' : 'scale(1)',
              boxShadow: currentBeat === beat 
                ? (beat === 1 
                    ? '0 0 12px rgba(60, 109, 240, 0.7), 0 0 6px rgba(60, 109, 240, 0.4)' 
                    : '0 0 10px rgba(249, 115, 22, 0.6), 0 0 5px rgba(249, 115, 22, 0.3)')
                : 'none',
              animation: currentBeat === beat ? 'beatPulse 0.3s ease-out' : 'none'
            }}
          />
        ))}
      </div>
      {/* BPM and time signature display */}
      <div style={{
        fontSize: '0.75rem',
        color: 'var(--dpgen-muted)',
        fontWeight: 500,
        marginTop: '-0.5rem'
      }}>
        {bpm} BPM • {timeSignature}
      </div>
    </div>
  );

  return createPortal(metronomeContent, portalContainer);
}

