/**
 * Collapsible Section Component
 * Provides a collapsible container for organizing UI elements
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode; // Now accepts React nodes (lucide-react icons)
  badge?: string; // Optional badge text
  className?: string;
}

export function CollapsibleSection({ 
  title, 
  defaultExpanded = true, 
  children,
  icon,
  badge,
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
          {icon && (
            <span style={{ color: 'var(--dpgen-primary)', display: 'flex', alignItems: 'center' }}>
              {icon}
            </span>
          )}
          <span style={{ 
            fontWeight: 600, 
            fontSize: '0.9375rem',
            color: 'var(--dpgen-text)',
          }}>
            {title}
          </span>
          {badge && (
            <span style={{
              fontSize: '0.65rem',
              padding: '0.125rem 0.375rem',
              borderRadius: '4px',
              background: 'var(--dpgen-primary)',
              color: 'white',
              fontWeight: 500,
            }}>
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp size={16} style={{ color: 'var(--dpgen-muted)' }} />
        ) : (
          <ChevronDown size={16} style={{ color: 'var(--dpgen-muted)' }} />
        )}
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
