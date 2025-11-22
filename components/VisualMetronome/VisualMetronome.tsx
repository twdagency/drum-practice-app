/**
 * Visual Metronome Component - Animated pendulum and beat indicators
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';

export function VisualMetronome() {
  const armRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Initialize position - start with default to avoid hydration mismatch
  const [position, setPosition] = useState({ x: 16, y: 80 });
  
  // Load position from localStorage on client side only (after mount)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('visualMetronomePosition');
        if (saved) {
          const parsed = JSON.parse(saved);
          setPosition(parsed);
        }
      } catch (e) {
        // Ignore parse errors
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
  const setShowVisualMetronome = useStore((state) => state.setShowVisualMetronome);
  
  // Save position to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('visualMetronomePosition', JSON.stringify(position));
    }
  }, [position]);

  useEffect(() => {
    if (!armRef.current) return;
    
    if (isPlaying && showVisualMetronome) {
      // Calculate animation duration for one bar (4 beats)
      const beatDuration = 60000 / bpm; // milliseconds per beat
      const barDuration = beatDuration * 4; // 4 beats per bar
      
      // Start continuous smooth animation - one full cycle per bar (4 beats)
      armRef.current.style.animation = `metronomeSwing ${barDuration}ms ease-in-out infinite`;
    } else {
      // Stop animation
      if (armRef.current) {
        armRef.current.style.animation = 'none';
        armRef.current.style.transform = 'rotate(0deg)';
      }
    }
  }, [isPlaying, showVisualMetronome, bpm, mounted]);

  // Dragging is now handled via onMouseDown on the container div

  const handleClose = () => {
    setShowVisualMetronome(false);
  };

  // Don't render until mounted (prevents flash on page load)
  if (!mounted || !showVisualMetronome) {
    return null;
  }

  return (
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
        cursor: isDragging ? 'grabbing' : 'move',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        userSelect: 'none'
      }}
      onMouseDown={(e) => {
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
        
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const handleMouseMove = (e: MouseEvent) => {
          const newX = e.clientX - offsetX;
          const newY = e.clientY - offsetY;
          const maxX = window.innerWidth - rect.width;
          const maxY = window.innerHeight - rect.height;
          setPosition({ 
            x: Math.max(0, Math.min(maxX, newX)), 
            y: Math.max(0, Math.min(maxY, newY))
          });
        };

        const handleMouseUp = () => {
          setIsDragging(false);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
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
          transition: 'background 0.2s ease'
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
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
        <div 
          ref={armRef}
          className="dpgen-metronome-arm"
          style={{
            width: '4px',
            height: '80px',
            background: 'var(--dpgen-primary)',
            borderRadius: '2px',
            transformOrigin: 'top center',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            willChange: 'transform'
          }}
        />
      </div>
      <div className="dpgen-metronome-beat-indicator" style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center'
      }}>
        {[1, 2, 3, 4].map((beat) => (
          <div
            key={beat}
            className={`dpgen-beat-dot ${currentBeat === beat ? 'dpgen-beat-dot--active' : ''}`}
            data-beat={beat}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: currentBeat === beat 
                ? (beat === 1 ? 'var(--dpgen-primary)' : 'var(--dpgen-accent)')
                : 'var(--dpgen-border)',
              transition: 'all 0.2s ease',
              border: '2px solid transparent',
              transform: currentBeat === beat ? 'scale(1.3)' : 'scale(1)',
              boxShadow: currentBeat === beat 
                ? (beat === 1 
                    ? '0 0 10px rgba(60, 109, 240, 0.6)' 
                    : '0 0 8px rgba(249, 115, 22, 0.5)')
                : 'none'
            }}
          />
        ))}
      </div>
    </div>
  );
}

