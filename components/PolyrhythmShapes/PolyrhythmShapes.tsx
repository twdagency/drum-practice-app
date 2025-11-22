/**
 * Polyrhythm Shapes Component - Animated geometric shapes visualization
 * 
 * Shows rotating geometric shapes (triangle, square, pentagon, etc.) where each shape
 * represents a rhythm, and the shapes rotate to show how rhythms align over time.
 * 
 * The LCM of the number of sides determines when the shapes realign (full cycle).
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';

// Calculate LCM (Least Common Multiple) of two numbers
function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

// Calculate GCD (Greatest Common Divisor) using Euclidean algorithm
function gcd(a: number, b: number): number {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

// Generate SVG path for a regular polygon with n sides
function generatePolygonPath(n: number, radius: number, centerX: number, centerY: number): string {
  const points: string[] = [];
  const angleStep = (2 * Math.PI) / n;
  
  for (let i = 0; i < n; i++) {
    const angle = (i * angleStep) - Math.PI / 2; // Start from top
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  
  return `M ${points.join(' L ')} Z`;
}

interface ShapeProps {
  sides: number;
  color: string;
  label: string;
  rotation: number;
  size: number;
}

function RotatingShape({ sides, color, label, rotation, size }: ShapeProps) {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  
  const path = generatePolygonPath(sides, radius, centerX, centerY);
  
  // Map number of sides to shape name
  const shapeNames: Record<number, string> = {
    3: 'Triangle',
    4: 'Square',
    5: 'Pentagon',
    6: 'Hexagon',
    7: 'Heptagon',
    8: 'Octagon',
  };
  
  const shapeName = shapeNames[sides] || `${sides}-gon`;
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <svg
        width={size}
        height={size}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.1s linear',
        }}
      >
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Draw vertices as dots */}
        {Array.from({ length: sides }).map((_, i) => {
          const angle = (i * (2 * Math.PI) / sides) - Math.PI / 2 + (rotation * Math.PI / 180);
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill={color}
            />
          );
        })}
      </svg>
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: '500',
          color: color,
          textAlign: 'center',
        }}
      >
        {label}
        <div style={{ fontSize: '0.625rem', opacity: 0.7 }}>
          {shapeName}
        </div>
      </div>
    </div>
  );
}

export function PolyrhythmShapes() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 200 });
  const rotationRefs = useRef<{ [key: number]: number }>({});
  const animationFrameRef = useRef<number | null>(null);
  
  // Load position from localStorage on client side only (after mount)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('polyrhythmShapesPosition');
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

  const showPolyrhythmShapes = useStore((state) => state.showPolyrhythmShapes);
  const isPlaying = useStore((state) => state.isPlaying);
  const bpm = useStore((state) => state.bpm);
  const polyrhythms = useStore((state) => state.polyrhythmPatterns);
  const setShowPolyrhythmShapes = useStore((state) => state.setShowPolyrhythmShapes);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('polyrhythmShapesPosition', JSON.stringify(position));
    }
  }, [position]);

  // Animate shapes rotation when playing
  useEffect(() => {
    if (!isPlaying || !showPolyrhythmShapes || !polyrhythms || polyrhythms.length === 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const beatDuration = 60000 / bpm; // milliseconds per beat
    const startTime = Date.now();
    
    // Get the first active polyrhythm (or use default 4:3 for demonstration)
    const activePolyrhythm = polyrhythms[0];
    if (!activePolyrhythm) return;

    const numerator = activePolyrhythm.ratio.numerator;
    const denominator = activePolyrhythm.ratio.denominator;
    const cycleLength = lcm(numerator, denominator);
    
    // Calculate rotation speeds:
    // Each shape rotates 360 degrees per cycle
    // The cycle length is the LCM of both rhythms
    // For 4:3, cycle length is 12, so each shape rotates 360/12 = 30 degrees per beat
    
    const animate = () => {
      if (!isPlaying) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      const elapsed = Date.now() - startTime;
      const beatsElapsed = elapsed / beatDuration;
      
      // Rotate each shape: 360 degrees per cycle
      // Numerator shape rotates at 360 / (cycleLength / numerator) degrees per beat
      // Denominator shape rotates at 360 / (cycleLength / denominator) degrees per beat
      const numeratorRotationPerBeat = 360 / (cycleLength / numerator);
      const denominatorRotationPerBeat = 360 / (cycleLength / denominator);
      
      rotationRefs.current[numerator] = (beatsElapsed * numeratorRotationPerBeat) % 360;
      rotationRefs.current[denominator] = (beatsElapsed * denominatorRotationPerBeat) % 360;
      
      // Trigger re-render by updating state (or use a ref callback)
      if (containerRef.current) {
        const numeratorShape = containerRef.current.querySelector(`[data-shape="${numerator}"]`) as HTMLElement;
        const denominatorShape = containerRef.current.querySelector(`[data-shape="${denominator}"]`) as HTMLElement;
        
        if (numeratorShape) {
          numeratorShape.style.transform = `rotate(${rotationRefs.current[numerator]}deg)`;
        }
        if (denominatorShape) {
          denominatorShape.style.transform = `rotate(${rotationRefs.current[denominator]}deg)`;
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, showPolyrhythmShapes, bpm, polyrhythms]);

  // Handle dragging - re-run when shapes are shown/hidden
  useEffect(() => {
    if (!showPolyrhythmShapes) return;
    if (!containerRef.current || !dragHandleRef.current) return;

    const container = containerRef.current;
    const dragHandle = dragHandleRef.current;
    let isDraggingFlag = false;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.dpgen-shapes-close') || 
          target.closest('.dpgen-shape-svg')) {
        return;
      }
      
      if (!target.closest('.dpgen-shapes-drag-handle')) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      isDraggingFlag = true;
      setIsDragging(true);
      const rect = container.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingFlag) return;
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
        isDraggingFlag = false;
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    dragHandle.addEventListener('mousedown', handleMouseDown);

    return () => {
      dragHandle.removeEventListener('mousedown', handleMouseDown);
      isDraggingFlag = false;
      setIsDragging(false);
    };
  }, [showPolyrhythmShapes]);

  const handleClose = () => {
    setShowPolyrhythmShapes(false);
  };

  // Don't render until mounted (prevents flash on page load)
  if (!mounted || !showPolyrhythmShapes || !polyrhythms || polyrhythms.length === 0) {
    return null;
  }

  const activePolyrhythm = polyrhythms[0];
  if (!activePolyrhythm) return null;

  const numerator = activePolyrhythm.ratio.numerator;
  const denominator = activePolyrhythm.ratio.denominator;
  const cycleLength = lcm(numerator, denominator);
  
  // Colors for each shape
  const numeratorColor = '#f97316'; // Orange (right hand)
  const denominatorColor = '#3b82f6'; // Blue (left hand)

  const numeratorRotation = rotationRefs.current[numerator] || 0;
  const denominatorRotation = rotationRefs.current[denominator] || 0;

  return (
    <div 
      ref={containerRef}
      className="dpgen-polyrhythm-shapes" 
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
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'default',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        userSelect: 'none',
        minWidth: '280px',
      }}
    >
      {/* Drag handle and close button */}
      <div 
        ref={dragHandleRef}
        className="dpgen-shapes-drag-handle"
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
          className="dpgen-shapes-close"
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
          title="Close shapes"
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
      
      {/* Title */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
          Polyrhythm Shapes
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>
          {numerator}:{denominator} (Cycle: {cycleLength})
        </div>
      </div>
      
      {/* Shapes */}
      <div 
        style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div data-shape={numerator}>
          <RotatingShape
            sides={numerator}
            color={numeratorColor}
            label={`${numerator} beats`}
            rotation={numeratorRotation}
            size={100}
          />
        </div>
        <div style={{ fontSize: '1.5rem', color: 'var(--dpgen-muted)' }}>×</div>
        <div data-shape={denominator}>
          <RotatingShape
            sides={denominator}
            color={denominatorColor}
            label={`${denominator} beats`}
            rotation={denominatorRotation}
            size={100}
          />
        </div>
      </div>
      
      {/* Info */}
      <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', textAlign: 'center', maxWidth: '240px' }}>
        Shapes align when vertices overlap. Full cycle: {cycleLength} beats
      </div>
    </div>
  );
}

