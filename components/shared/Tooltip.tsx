/**
 * Tooltip Component
 * Provides consistent tooltip styling throughout the app
 * Uses fixed positioning to prevent clipping by parent containers
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

function TooltipComponent({ content, children, position = 'top', delay = 300 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
    opacity: 0,
  });
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!wrapperRef.current) return;
    
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    
    // Get tooltip dimensions - use actual if available, otherwise estimate
    let tooltipRect: DOMRect;
    if (tooltipRef.current) {
      tooltipRect = tooltipRef.current.getBoundingClientRect();
    // If tooltip has no dimensions yet, use estimated dimensions
    if (tooltipRect.width === 0 && tooltipRect.height === 0) {
      // For long content, estimate based on max-width and wrapping
      const isLongContent = content.length > 100;
      const estimatedWidth = isLongContent ? 300 : Math.min(content.length * 7 + 24, 300);
      // Estimate height based on content length (rough: ~40px per 100 chars when wrapped)
      const estimatedHeight = isLongContent ? Math.max(60, Math.ceil(content.length / 100) * 40) : 32;
      tooltipRect = new DOMRect(0, 0, estimatedWidth, estimatedHeight);
    }
    } else {
      // Estimate based on content length (rough approximation)
      const estimatedWidth = Math.max(content.length * 7 + 24, 80);
      const estimatedHeight = 32;
      tooltipRect = new DOMRect(0, 0, estimatedWidth, estimatedHeight);
    }
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spacing = 8; // Space between trigger and tooltip
    const margin = 10; // Margin from viewport edges

    let top = 0;
    let left = 0;
    let finalPosition = position;
    let arrowTop = 0;
    let arrowLeft = 0;

    // Calculate initial position based on preferred position
    switch (position) {
      case 'top':
        top = wrapperRect.top - tooltipRect.height - spacing;
        left = wrapperRect.left + wrapperRect.width / 2 - tooltipRect.width / 2;
        arrowTop = tooltipRect.height;
        arrowLeft = tooltipRect.width / 2;
        break;
      case 'bottom':
        top = wrapperRect.bottom + spacing;
        left = wrapperRect.left + wrapperRect.width / 2 - tooltipRect.width / 2;
        arrowTop = -6;
        arrowLeft = tooltipRect.width / 2;
        break;
      case 'left':
        top = wrapperRect.top + wrapperRect.height / 2 - tooltipRect.height / 2;
        left = wrapperRect.left - tooltipRect.width - spacing;
        arrowTop = tooltipRect.height / 2;
        arrowLeft = tooltipRect.width;
        break;
      case 'right':
        top = wrapperRect.top + wrapperRect.height / 2 - tooltipRect.height / 2;
        left = wrapperRect.right + spacing;
        arrowTop = tooltipRect.height / 2;
        arrowLeft = -6;
        break;
    }

    // Adjust if tooltip would be clipped on the right
    if (left + tooltipRect.width > viewportWidth - margin) {
      const overflow = (left + tooltipRect.width) - (viewportWidth - margin);
      left = Math.max(margin, left - overflow);
      // If we're on the right edge and preferred was right, try left side
      if (finalPosition === 'right' && left < wrapperRect.left - tooltipRect.width - spacing) {
        finalPosition = 'left';
        left = wrapperRect.left - tooltipRect.width - spacing;
        arrowLeft = tooltipRect.width;
      }
    }

    // Adjust if tooltip would be clipped on the left
    if (left < margin) {
      const overflow = margin - left;
      left = margin;
      // If we're on the left edge and preferred was left, try right side
      if (finalPosition === 'left' && wrapperRect.right + spacing + tooltipRect.width < viewportWidth - margin) {
        finalPosition = 'right';
        left = wrapperRect.right + spacing;
        arrowLeft = -6;
      }
    }

    // Adjust if tooltip would be clipped on the top
    if (top < margin) {
      const overflow = margin - top;
      top = margin;
      // If we're on the top edge and preferred was top, try bottom
      if (finalPosition === 'top' && wrapperRect.bottom + spacing + tooltipRect.height < viewportHeight - margin) {
        finalPosition = 'bottom';
        top = wrapperRect.bottom + spacing;
        arrowTop = -6;
        arrowLeft = tooltipRect.width / 2;
      }
    }

    // Adjust if tooltip would be clipped on the bottom
    if (top + tooltipRect.height > viewportHeight - margin) {
      const overflow = (top + tooltipRect.height) - (viewportHeight - margin);
      top = Math.max(margin, top - overflow);
      // If we're on the bottom edge and preferred was bottom, try top
      if (finalPosition === 'bottom' && wrapperRect.top - spacing - tooltipRect.height > margin) {
        finalPosition = 'top';
        top = wrapperRect.top - tooltipRect.height - spacing;
        arrowTop = tooltipRect.height;
        arrowLeft = tooltipRect.width / 2;
      }
    }

    setTooltipStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 10000,
      // Ensure tooltip is always visible
      display: 'block',
    });

    setArrowStyle({
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
      ...(finalPosition === 'top' && {
        top: `${arrowTop}px`,
        left: `${arrowLeft}px`,
        transform: 'translateX(-50%)',
        borderWidth: '6px 6px 0 6px',
        borderColor: 'var(--dpgen-text) transparent transparent transparent',
      }),
      ...(finalPosition === 'bottom' && {
        top: `${arrowTop}px`,
        left: `${arrowLeft}px`,
        transform: 'translateX(-50%)',
        borderWidth: '0 6px 6px 6px',
        borderColor: 'transparent transparent var(--dpgen-text) transparent',
      }),
      ...(finalPosition === 'left' && {
        top: `${arrowTop}px`,
        left: `${arrowLeft}px`,
        transform: 'translateY(-50%)',
        borderWidth: '6px 0 6px 6px',
        borderColor: 'transparent transparent transparent var(--dpgen-text)',
      }),
      ...(finalPosition === 'right' && {
        top: `${arrowTop}px`,
        left: `${arrowLeft}px`,
        transform: 'translateY(-50%)',
        borderWidth: '6px 6px 6px 0',
        borderColor: 'transparent var(--dpgen-text) transparent transparent',
      }),
    });

    setActualPosition(finalPosition);
    setIsPositioned(true);
  }, [position]);

  const handleMouseEnter = useCallback(() => {
    const id = setTimeout(() => {
      setIsVisible(true);
      // Set a basic fallback position immediately
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setTooltipStyle({
          position: 'fixed',
          top: `${rect.top - 40}px`,
          left: `${rect.left + rect.width / 2}px`,
          zIndex: 10000,
          display: 'block',
          transform: 'translateX(-50%)',
        });
        setIsPositioned(true);
      }
      // Then try to calculate proper position
      setTimeout(() => {
        if (wrapperRef.current && tooltipRef.current) {
          calculatePosition();
        }
      }, 0);
    }, delay);
    timeoutId.current = id;
  }, [delay, calculatePosition]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    setIsVisible(false);
    setIsPositioned(false);
  }, []);

  // Recalculate position when tooltip becomes visible or window resizes
  useEffect(() => {
    if (isVisible && tooltipRef.current && wrapperRef.current) {
      // Use multiple strategies to ensure tooltip is rendered and measured
      const timer1 = setTimeout(() => {
        calculatePosition();
      }, 0);
      
      const timer2 = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          calculatePosition();
        });
      });
      
      return () => {
        clearTimeout(timer1);
        cancelAnimationFrame(timer2);
      };
    }
  }, [isVisible, calculatePosition]);

  // Recalculate on window resize
  useEffect(() => {
    if (!isVisible) return;
    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isVisible, calculatePosition]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tooltipContent = isVisible ? (
    <div
      ref={tooltipRef}
      className="tooltip"
          style={{
            ...tooltipStyle,
            padding: '0.5rem 0.75rem',
            background: 'var(--dpgen-text)',
            color: 'var(--dpgen-card)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            whiteSpace: content.length > 100 ? 'normal' : 'nowrap', // Wrap long content
            maxWidth: '300px', // Limit width for long tooltips
            wordWrap: 'break-word', // Break long words if needed
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            opacity: isPositioned ? 1 : 0.5, // Show at reduced opacity if not positioned yet (for debugging)
            transition: 'opacity 0.15s ease-out',
            // Ensure tooltip is always on top
            zIndex: 10000,
          }}
    >
      {content}
      {/* Arrow */}
      <div style={arrowStyle} />
    </div>
  ) : null;

  return (
    <>
      <div
        ref={wrapperRef}
        className="tooltip-wrapper"
        style={{ position: 'relative', display: 'inline-block' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {mounted && tooltipContent && typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
    </>
  );
}

// Memoize to prevent unnecessary re-renders
export const Tooltip = React.memo(TooltipComponent);

