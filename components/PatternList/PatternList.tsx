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
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number } | null>(null);
  
  // Filter patterns based on search query
  const filteredPatterns = useMemo(() => {
    if (!searchQuery.trim()) {
      return patterns;
    }
    
    const query = searchQuery.toLowerCase();
    return patterns.filter((pattern: Pattern) => {
      // Search in pattern name, voicing, sticking, time signature
      const name = pattern._presetName?.toLowerCase() || '';
      const voicing = pattern.drumPattern?.toLowerCase() || '';
      const sticking = pattern.stickingPattern?.toLowerCase() || '';
      const timeSig = pattern.timeSignature?.toLowerCase() || '';
      const description = pattern._presetDescription?.toLowerCase() || '';
      
      return (
        name.includes(query) ||
        voicing.includes(query) ||
        sticking.includes(query) ||
        timeSig.includes(query) ||
        description.includes(query)
      );
    });
  }, [patterns, searchQuery]);

  // Virtualization: only render visible patterns when there are many (>20)
  const shouldVirtualize = filteredPatterns.length > 20;
  
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
  }, [shouldVirtualize, filteredPatterns.length]);

  // Get visible patterns for virtualization
  const visiblePatterns = useMemo(() => {
    if (!shouldVirtualize || !visibleRange) {
      return filteredPatterns;
    }
    return filteredPatterns.slice(visibleRange.start, visibleRange.end + 1);
  }, [filteredPatterns, shouldVirtualize, visibleRange]);

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
      {/* Search/Filter Bar */}
      {patterns.length > 0 && (
        <div style={{ 
          marginBottom: '1rem',
          position: 'sticky',
          top: '0',
          zIndex: 10,
          background: 'var(--dpgen-card)',
          padding: '0.75rem',
          borderRadius: 'var(--dpgen-radius)',
          border: '1px solid var(--dpgen-border)',
        }}>
          <div style={{ position: 'relative' }}>
            <i 
              className="fas fa-search" 
              style={{ 
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--dpgen-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                border: '1px solid var(--dpgen-border)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                background: 'var(--dpgen-bg)',
                color: 'var(--dpgen-text)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--dpgen-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Clear search"
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.75rem', 
              color: 'var(--dpgen-muted)',
            }}>
              {filteredPatterns.length} of {patterns.length} pattern{patterns.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
      
      {/* Pattern Items */}
      {filteredPatterns.length === 0 && searchQuery ? (
        <div className="dpgen-empty-state" style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          color: 'var(--dpgen-muted)',
        }}>
          <i className="fas fa-search" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
          <p>No patterns match "{searchQuery}"</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          style={{
            maxHeight: shouldVirtualize ? '600px' : 'none',
            overflowY: shouldVirtualize ? 'auto' : 'visible',
            position: 'relative',
          }}
        >
          {shouldVirtualize && visibleRange && (
            <div style={{ height: `${visibleRange.start * 80}px` }} />
          )}
          {visiblePatterns.map((pattern, localIndex) => {
            const globalIndex = shouldVirtualize && visibleRange 
              ? visibleRange.start + localIndex 
              : localIndex;
            return (
              <PatternItem key={pattern.id} pattern={pattern} index={globalIndex} />
            );
          })}
          {shouldVirtualize && visibleRange && (
            <div style={{ height: `${(filteredPatterns.length - visibleRange.end - 1) * 80}px` }} />
          )}
        </div>
      )}
    </div>
  );
}

