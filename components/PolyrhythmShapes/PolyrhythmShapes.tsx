/**
 * Polyrhythm Shapes Component - Concentric Polygon Visualization
 * 
 * Visualizes polyrhythms using concentric polygons with orbiting dots.
 * Each polygon represents a rhythm (3-gon for 3 beats, 4-gon for 4 beats, etc.)
 * Dots orbit around each polygon at the rhythm's rate.
 * When dots align (at the top), it shows where the rhythms coincide.
 * 
 * Example: 3:4 polyrhythm = triangle inside square, with two dots orbiting
 * at different speeds, aligning at position 0 (top).
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { X, GripVertical, Play, Pause, RotateCcw } from 'lucide-react';

// Calculate GCD for LCM calculation
function gcd(a: number, b: number): number {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

// Calculate LCM - when the pattern repeats
function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

// Shape colors
const COLORS = {
  outer: '#3b82f6', // Blue for outer (usually larger number)
  inner: '#f97316', // Orange for inner (usually smaller number)
  dot: '#ffffff',
  dotGlow: 'rgba(255, 255, 255, 0.6)',
  alignmentFlash: '#22c55e', // Green flash when dots align
  background: 'rgba(15, 23, 42, 0.95)', // Dark slate
  text: '#e2e8f0',
  muted: '#94a3b8',
};

interface PolyrhythmShapesProps {
  // Optional standalone mode for testing
  standalone?: boolean;
  numerator?: number;
  denominator?: number;
}

export function PolyrhythmShapes({ standalone, numerator: propNumerator, denominator: propDenominator }: PolyrhythmShapesProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAligned, setIsAligned] = useState(false);
  const [localPlaying, setLocalPlaying] = useState(false);
  
  // Store state
  const showPolyrhythmShapes = useStore((state) => state.showPolyrhythmShapes);
  const isPlaying = useStore((state) => state.isPlaying);
  const bpm = useStore((state) => state.bpm);
  const polyrhythms = useStore((state) => state.polyrhythmPatterns);
  const setShowPolyrhythmShapes = useStore((state) => state.setShowPolyrhythmShapes);
  const darkMode = useStore((state) => state.darkMode);
  
  // Theme-aware colors
  const theme = {
    background: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
    canvasBg: darkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.8)',
    text: darkMode ? '#e2e8f0' : '#1e293b',
    muted: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.4)',
    guideLines: darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.15)',
    centerDot: darkMode ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.4)',
    dotFill: darkMode ? '#ffffff' : '#1e293b',
  };

  // Get polyrhythm ratio
  const activePolyrhythm = polyrhythms?.[0];
  const numerator = propNumerator ?? activePolyrhythm?.ratio?.numerator ?? 4;
  const denominator = propDenominator ?? activePolyrhythm?.ratio?.denominator ?? 3;
  
  // Ensure outer is the larger number for better visualization
  const outerSides = Math.max(numerator, denominator);
  const innerSides = Math.min(numerator, denominator);
  const cycleLength = lcm(outerSides, innerSides);

  // Load position from localStorage with bounds checking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('polyrhythmShapesPosition');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Validate and clamp position to screen bounds
          const maxX = window.innerWidth - 320; // minWidth of component
          const maxY = window.innerHeight - 400; // approximate height
          setPosition({
            x: Math.max(0, Math.min(maxX, parsed.x || 16)),
            y: Math.max(0, Math.min(maxY, parsed.y || 200)),
          });
        }
      } catch (e) {
        // Ignore parse errors, use default position
      }
    }
    setMounted(true);
  }, []);

  // Save position to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      localStorage.setItem('polyrhythmShapesPosition', JSON.stringify(position));
    }
  }, [position, mounted]);

  // Calculate polygon vertices
  const getPolygonVertices = useCallback((sides: number, radius: number, centerX: number, centerY: number) => {
    const vertices: { x: number; y: number }[] = [];
    for (let i = 0; i < sides; i++) {
      // Start from top (-90 degrees) and go clockwise
      const angle = (i / sides) * 2 * Math.PI - Math.PI / 2;
      vertices.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
    return vertices;
  }, []);

  // Get position on polygon perimeter for a given progress (0-1)
  const getPositionOnPolygon = useCallback((progress: number, vertices: { x: number; y: number }[]) => {
    const sides = vertices.length;
    const totalProgress = progress * sides;
    const currentSide = Math.floor(totalProgress) % sides;
    const sideProgress = totalProgress - Math.floor(totalProgress);
    
    const startVertex = vertices[currentSide];
    const endVertex = vertices[(currentSide + 1) % sides];
    
    return {
      x: startVertex.x + (endVertex.x - startVertex.x) * sideProgress,
      y: startVertex.y + (endVertex.y - startVertex.y) * sideProgress,
    };
  }, []);

  // Draw the visualization
  const draw = useCallback((ctx: CanvasRenderingContext2D, progress: number) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Responsive sizing
    const maxRadius = Math.min(width, height) * 0.4;
    const outerRadius = maxRadius;
    const innerRadius = maxRadius * 0.6;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get vertices
    const outerVertices = getPolygonVertices(outerSides, outerRadius, centerX, centerY);
    const innerVertices = getPolygonVertices(innerSides, innerRadius, centerX, centerY);
    
    // Draw connecting lines (subtle guide lines from center to outer vertices)
    ctx.strokeStyle = theme.guideLines;
    ctx.lineWidth = 1;
    for (const vertex of outerVertices) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(vertex.x, vertex.y);
      ctx.stroke();
    }
    
    // Draw outer polygon
    ctx.strokeStyle = COLORS.outer;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(outerVertices[0].x, outerVertices[0].y);
    for (let i = 1; i < outerVertices.length; i++) {
      ctx.lineTo(outerVertices[i].x, outerVertices[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Draw outer vertices (beat markers)
    for (let i = 0; i < outerVertices.length; i++) {
      const v = outerVertices[i];
      ctx.fillStyle = i === 0 ? '#22c55e' : COLORS.outer;
      ctx.beginPath();
      ctx.arc(v.x, v.y, i === 0 ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Draw inner polygon
    ctx.strokeStyle = COLORS.inner;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(innerVertices[0].x, innerVertices[0].y);
    for (let i = 1; i < innerVertices.length; i++) {
      ctx.lineTo(innerVertices[i].x, innerVertices[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Draw inner vertices (beat markers)
    for (let i = 0; i < innerVertices.length; i++) {
      const v = innerVertices[i];
      ctx.fillStyle = i === 0 ? '#22c55e' : COLORS.inner;
      ctx.beginPath();
      ctx.arc(v.x, v.y, i === 0 ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Calculate dot positions
    // Outer dot: completes outerSides beats per cycle
    // Inner dot: completes innerSides beats per cycle
    // Both should complete at the same time (full cycle)
    const outerProgress = (progress * outerSides) % 1;
    const innerProgress = (progress * innerSides) % 1;
    
    const outerDotPos = getPositionOnPolygon(outerProgress, outerVertices);
    const innerDotPos = getPositionOnPolygon(innerProgress, innerVertices);
    
    // Check if dots are aligned (both at position 0, i.e., top)
    const alignmentThreshold = 0.02;
    const outerAtTop = outerProgress < alignmentThreshold || outerProgress > (1 - alignmentThreshold);
    const innerAtTop = innerProgress < alignmentThreshold || innerProgress > (1 - alignmentThreshold);
    const dotsAligned = outerAtTop && innerAtTop;
    
    // Draw alignment indicator
    if (dotsAligned) {
      // Flash effect at top
      const topX = centerX;
      const topY = centerY - outerRadius - 20;
      
      ctx.fillStyle = COLORS.alignmentFlash;
      ctx.beginPath();
      ctx.arc(topX, topY, 12, 0, 2 * Math.PI);
      ctx.fill();
      
      // Glow
      const gradient = ctx.createRadialGradient(topX, topY, 0, topX, topY, 25);
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.6)');
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(topX, topY, 25, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Draw orbiting dots with glow effect
    // Outer dot
    const outerGlow = ctx.createRadialGradient(outerDotPos.x, outerDotPos.y, 0, outerDotPos.x, outerDotPos.y, 20);
    outerGlow.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    outerGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(outerDotPos.x, outerDotPos.y, 20, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = theme.dotFill;
    ctx.strokeStyle = COLORS.outer;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(outerDotPos.x, outerDotPos.y, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Inner dot
    const innerGlow = ctx.createRadialGradient(innerDotPos.x, innerDotPos.y, 0, innerDotPos.x, innerDotPos.y, 20);
    innerGlow.addColorStop(0, 'rgba(249, 115, 22, 0.8)');
    innerGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(innerDotPos.x, innerDotPos.y, 20, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = theme.dotFill;
    ctx.strokeStyle = COLORS.inner;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(innerDotPos.x, innerDotPos.y, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Draw center point
    ctx.fillStyle = theme.centerDot;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    return dotsAligned;
  }, [outerSides, innerSides, getPolygonVertices, getPositionOnPolygon, theme]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mounted) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const shouldAnimate = standalone ? localPlaying : (isPlaying && showPolyrhythmShapes);
    
    if (!shouldAnimate) {
      // Draw static state at progress 0
      draw(ctx, 0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    startTimeRef.current = performance.now();
    
    let wasAligned = false;
    
    const animate = () => {
      const elapsed = performance.now() - startTimeRef.current;
      
      // Calculate progress through the cycle
      // One full cycle = cycleLength beats at current BPM
      const msPerBeat = 60000 / bpm;
      const cycleMs = msPerBeat * cycleLength;
      const progress = (elapsed % cycleMs) / cycleMs;
      
      const aligned = draw(ctx, progress);
      
      // Only update state if alignment status changed (prevents unnecessary re-renders)
      if (aligned !== wasAligned) {
        wasAligned = aligned;
        setIsAligned(aligned);
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
  }, [mounted, isPlaying, showPolyrhythmShapes, bpm, cycleLength, draw, standalone, localPlaying]);

  // Handle dragging - only when clicking the drag handle
  const dragHandleRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (standalone || !showPolyrhythmShapes || !containerRef.current || !dragHandleRef.current) return;
    
    const container = containerRef.current;
    const dragHandle = dragHandleRef.current;
    let isDraggingFlag = false;
    let offsetX = 0;
    let offsetY = 0;
    
    const handleMouseDown = (e: MouseEvent) => {
      // Only start dragging if clicking on the drag handle itself
      const target = e.target as HTMLElement;
      if (!target.closest('[data-drag-handle="true"]')) return;
      
      e.preventDefault();
      e.stopPropagation();
      isDraggingFlag = true;
      setIsDragging(true);
      const rect = container.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingFlag) return;
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      const maxX = window.innerWidth - container.offsetWidth;
      const maxY = window.innerHeight - container.offsetHeight;
      setPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY)),
      });
    };
    
    const handleMouseUp = () => {
      isDraggingFlag = false;
      setIsDragging(false);
    };
    
    dragHandle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      dragHandle.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [showPolyrhythmShapes, standalone]);

  const handleClose = () => {
    setShowPolyrhythmShapes(false);
  };
  
  const handleReset = () => {
    startTimeRef.current = performance.now();
  };
  
  const toggleLocalPlay = () => {
    setLocalPlaying(!localPlaying);
    if (!localPlaying) {
      startTimeRef.current = performance.now();
    }
  };

  // Don't render if not mounted or not shown (unless standalone)
  if (!mounted) return null;
  if (!standalone && (!showPolyrhythmShapes || !polyrhythms || polyrhythms.length === 0)) return null;

  const containerStyle: React.CSSProperties = standalone ? {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1.5rem',
    background: theme.background,
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1.5rem',
    background: theme.background,
    borderRadius: '16px',
    border: `1px solid ${theme.border}`,
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 1000,
    cursor: 'default',
    boxShadow: darkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    userSelect: 'none',
    minWidth: '320px',
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* Header */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <div>
          <div style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            color: theme.text,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span>Polyrhythm Visualizer</span>
            {isAligned && (
              <span style={{
                fontSize: '0.625rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
                fontWeight: 600,
              }}>
                ALIGNED
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: theme.muted }}>
            {outerSides}:{innerSides} • Cycle: {cycleLength} beats • {bpm} BPM
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {standalone && (
            <button
              onClick={toggleLocalPlay}
              style={{
                background: localPlaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.4rem',
                cursor: 'pointer',
                color: localPlaying ? '#ef4444' : '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={localPlaying ? 'Pause' : 'Play'}
            >
              {localPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
          )}
          <button
            onClick={handleReset}
            style={{
              background: 'rgba(148, 163, 184, 0.1)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.4rem',
              cursor: 'pointer',
              color: theme.muted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>
          {!standalone && (
            <>
              <div 
                ref={dragHandleRef}
                data-drag-handle="true"
                style={{ 
                  color: theme.muted, 
                  cursor: isDragging ? 'grabbing' : 'grab',
                  padding: '0.25rem',
                  borderRadius: '4px',
                }} 
                title="Drag to move"
              >
                <GripVertical size={16} />
              </div>
              <button
                onClick={handleClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  color: theme.muted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = theme.muted;
                }}
                title="Close"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={280}
        height={280}
        style={{
          borderRadius: '12px',
          background: theme.canvasBg,
        }}
      />
      
      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1.5rem',
        marginTop: '1rem',
        fontSize: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            background: COLORS.outer,
          }} />
          <span style={{ color: theme.text }}>{outerSides} beats</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            background: COLORS.inner,
          }} />
          <span style={{ color: theme.text }}>{innerSides} beats</span>
        </div>
      </div>
      
      {/* Info */}
      <div style={{
        marginTop: '0.75rem',
        fontSize: '0.6875rem',
        color: theme.muted,
        textAlign: 'center',
        lineHeight: 1.4,
      }}>
        Dots orbit at different speeds. Green flash = alignment point.
        <br />
        Both dots return to start after {cycleLength} beats.
      </div>
    </div>
  );
}
