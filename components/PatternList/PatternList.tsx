/**
 * Pattern List component
 * Displays all patterns with drag-and-drop support
 */

'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { PatternItem } from './PatternItem';
import { Pattern } from '@/types';

export function PatternList() {
  const patterns = useStore((state) => state.patterns);
  const patternViewMode = useStore((state) => state.patternViewMode);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number } | null>(null);

  // Virtualization: only render visible patterns when there are many (>20) and in list view
  const shouldVirtualize = patterns.length > 20 && patternViewMode === 'list';
  
  useEffect(() => {
    if (!shouldVirtualize || !containerRef.current) {
      setVisibleRange(null);
      return;
    }

    const container = containerRef.current;
    const itemHeight = 80; // Approximate height of each pattern item
    const buffer = 5; // Number of items to render outside viewport
    
    const updateVisibleRange = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
      const end = Math.min(
        filteredPatterns.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
      );
      
      setVisibleRange({ start, end });
    };

    updateVisibleRange();
    container.addEventListener('scroll', updateVisibleRange);
    window.addEventListener('resize', updateVisibleRange);

    return () => {
      container.removeEventListener('scroll', updateVisibleRange);
      window.removeEventListener('resize', updateVisibleRange);
    };
  }, [shouldVirtualize, patterns.length]);

  // Get visible patterns for virtualization
  const visiblePatterns = useMemo(() => {
    if (!shouldVirtualize || !visibleRange) {
      return patterns;
    }
    return patterns.slice(visibleRange.start, visibleRange.end + 1);
  }, [patterns, shouldVirtualize, visibleRange]);

  if (patterns.length === 0) {
    return (
      <div className="dpgen-patterns-list">
        <div className="dpgen-empty-state" style={{ 
          padding: '3rem 2rem', 
          textAlign: 'center', 
          color: 'var(--dpgen-muted)',
          background: 'var(--dpgen-bg)',
          borderRadius: 'var(--dpgen-radius)',
          border: '2px dashed var(--dpgen-border)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>
            <i className="fas fa-music" />
          </div>
          <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            No patterns yet
          </p>
          <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            Click "Add Pattern" to create your first pattern
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dpgen-patterns-list">
      {/* Pattern Items */}
        <div
          ref={containerRef}
          style={{
            maxHeight: shouldVirtualize ? '600px' : 'none',
            overflowY: shouldVirtualize ? 'auto' : 'visible',
            position: 'relative',
            display: patternViewMode === 'grid' || patternViewMode === 'compact' ? 'grid' : 'block',
            gridTemplateColumns: patternViewMode === 'grid' 
              ? 'repeat(auto-fill, minmax(280px, 1fr))' 
              : patternViewMode === 'compact'
              ? 'repeat(auto-fill, minmax(200px, 1fr))'
              : 'none',
            gap: patternViewMode === 'grid' || patternViewMode === 'compact' ? '0.75rem' : '0',
            transition: 'all 0.3s ease',
          }}
        >
          {shouldVirtualize && visibleRange && patternViewMode === 'list' && (
            <div style={{ height: `${visibleRange.start * 80}px` }} />
          )}
          {visiblePatterns.map((pattern, localIndex) => {
            const globalIndex = shouldVirtualize && visibleRange 
              ? visibleRange.start + localIndex 
              : localIndex;
            return (
              <PatternItem 
                key={pattern.id} 
                pattern={pattern} 
                index={globalIndex}
                viewMode={patternViewMode}
              />
            );
          })}
          {shouldVirtualize && visibleRange && patternViewMode === 'list' && (
            <div style={{ height: `${(patterns.length - visibleRange.end - 1) * 80}px` }} />
          )}
        </div>
    </div>
  );
}

