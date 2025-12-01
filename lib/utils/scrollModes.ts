/**
 * Scroll mode utilities for music notation playback
 * Provides calculation functions for different scroll animation modes
 */

import { ScrollSpeed } from '@/store/slices/uiSlice';

/**
 * Get scroll speed multiplier for transition duration
 */
export function getScrollSpeedMultiplier(speed: ScrollSpeed): number {
  switch (speed) {
    case 'slow':
      return 800; // ms
    case 'medium':
      return 400; // ms
    case 'fast':
      return 200; // ms
    default:
      return 400;
  }
}

/**
 * Calculate horizontal scroll position with look-ahead buffer
 */
export function calculateHorizontalScrollPosition(
  noteElement: SVGElement,
  container: HTMLElement,
  lookAheadDistance: number,
  measureWidth?: number
): { scrollLeft: number; shouldScroll: boolean } {
  if (!noteElement || !container) {
    return { scrollLeft: 0, shouldScroll: false };
  }

  const noteRect = noteElement.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  // Calculate note's center position relative to container
  const noteCenterX = noteRect.left - containerRect.left + noteRect.width / 2;
  const containerCenterX = containerRect.width / 2;
  
  // Calculate look-ahead offset
  const lookAheadOffset = measureWidth ? measureWidth * lookAheadDistance : 200 * lookAheadDistance;
  const targetPosition = noteCenterX + lookAheadOffset;
  
  // Calculate scroll offset to center the look-ahead position
  const scrollOffset = targetPosition - containerCenterX;
  const margin = 50; // Minimum margin from edges
  
  // Only scroll if note is outside the visible area (with some margin)
  const shouldScroll = Math.abs(scrollOffset) > margin;
  
  return {
    scrollLeft: container.scrollLeft + scrollOffset,
    shouldScroll,
  };
}

/**
 * Calculate vertical scroll position for line-based scrolling
 */
export function calculateVerticalScrollPosition(
  noteElement: SVGElement,
  container: HTMLElement,
  lineIndex: number,
  lineSpacing: number,
  currentScrollTop: number
): { scrollTop: number; shouldScroll: boolean } {
  if (!noteElement || !container) {
    return { scrollTop: 0, shouldScroll: false };
  }

  const noteRect = noteElement.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  // Calculate line position
  const lineY = lineIndex * lineSpacing;
  const containerHeight = containerRect.height;
  const viewportCenter = containerHeight / 2;
  
  // Target: center the line in the viewport
  const targetScrollTop = lineY - viewportCenter + (lineSpacing / 2);
  
  // Only scroll if line is significantly outside viewport
  const margin = 100; // Minimum margin
  const shouldScroll = Math.abs(targetScrollTop - currentScrollTop) > margin;
  
  return {
    scrollTop: Math.max(0, targetScrollTop),
    shouldScroll,
  };
}

/**
 * Calculate position for fixed playhead mode
 * Returns horizontal scroll to keep note aligned with fixed playhead
 */
export function calculateFixedPlayheadPosition(
  noteElement: SVGElement,
  container: HTMLElement,
  playheadX: number // Fixed X position of playhead in viewport
): { scrollLeft: number; shouldScroll: boolean } {
  if (!noteElement || !container) {
    return { scrollLeft: 0, shouldScroll: false };
  }

  const noteRect = noteElement.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  // Calculate note's left edge relative to container
  const noteLeft = noteRect.left - containerRect.left + container.scrollLeft;
  
  // Calculate scroll to align note with playhead
  const scrollOffset = noteLeft - playheadX;
  const margin = 20; // Small margin to prevent jitter
  
  const shouldScroll = Math.abs(scrollOffset) > margin;
  
  return {
    scrollLeft: container.scrollLeft + scrollOffset,
    shouldScroll,
  };
}

/**
 * Determine if page turn should be triggered
 */
export function shouldTriggerPageTurn(
  currentLineIndex: number,
  totalLines: number,
  pageSize: number,
  threshold: number = 0.9 // Trigger at 90% through page
): { shouldTurn: boolean; currentPage: number; nextPage: number } {
  const currentPage = Math.floor(currentLineIndex / pageSize);
  const positionInPage = (currentLineIndex % pageSize) / pageSize;
  const shouldTurn = positionInPage >= threshold && currentPage < Math.floor((totalLines - 1) / pageSize);
  
  return {
    shouldTurn,
    currentPage,
    nextPage: currentPage + 1,
  };
}

/**
 * Calculate page turn scroll position
 */
export function calculatePageTurnPosition(
  pageNumber: number,
  pageSize: number,
  lineSpacing: number
): number {
  return pageNumber * pageSize * lineSpacing;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get smooth scroll behavior based on user preferences
 */
export function getScrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}


