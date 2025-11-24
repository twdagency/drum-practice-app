/**
 * Collapsible Section Component
 * Provides a collapsible container for organizing UI elements
 */

'use client';

import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  icon?: string;
  className?: string;
}

export function CollapsibleSection({ 
  title, 
  defaultExpanded = true, 
  children,
  icon,
  className = ''
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`collapsible-section ${className}`} style={{
      border: '1px solid var(--dpgen-border)',
      borderRadius: 'var(--dpgen-radius)',
      marginBottom: '1rem',
      overflow: 'hidden',
      transition: 'all var(--dpgen-transition)',
    }}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="collapsible-section-header"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          background: 'var(--dpgen-bg)',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color var(--dpgen-transition)',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--dpgen-card)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--dpgen-bg)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon && <i className={icon} style={{ color: 'var(--dpgen-primary)' }} />}
          <span style={{ 
            fontWeight: 600, 
            fontSize: '0.9375rem',
            color: 'var(--dpgen-text)',
          }}>
            {title}
          </span>
        </div>
        <i 
          className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}
          style={{ 
            color: 'var(--dpgen-muted)',
            fontSize: '0.75rem',
            transition: 'transform var(--dpgen-transition)',
          }}
        />
      </button>
      {isExpanded && (
        <div className="collapsible-section-content" style={{
          padding: '1rem',
          background: 'var(--dpgen-card)',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

