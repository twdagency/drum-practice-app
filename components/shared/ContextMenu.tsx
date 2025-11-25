/**
 * Context Menu Component
 * Right-click context menu for patterns
 */

'use client';

import React, { useEffect, useRef } from 'react';

interface ContextMenuItem {
  label: string;
  icon: string;
  action: () => void;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Add listeners after a short delay to avoid immediate close
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would go off screen
  const adjustedPosition = useRef({ x: position.x, y: position.y });
  
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }
      if (x < 0) x = 10;
      if (y < 0) y = 10;

      adjustedPosition.current = { x, y };
      menuRef.current.style.left = `${x}px`;
      menuRef.current.style.top = `${y}px`;
    }
  }, [position]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: adjustedPosition.current.x,
        top: adjustedPosition.current.y,
        background: 'var(--dpgen-card)',
        border: '1px solid var(--dpgen-border)',
        borderRadius: 'var(--dpgen-radius)',
        boxShadow: 'var(--dpgen-shadow)',
        padding: '0.5rem 0',
        minWidth: '180px',
        zIndex: 10000,
        animation: 'modalEnter 0.15s ease-out',
        transformOrigin: 'top left',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <div
              key={`divider-${index}`}
              style={{
                height: '1px',
                background: 'var(--dpgen-border)',
                margin: '0.5rem 0',
              }}
            />
          );
        }

        return (
          <button
            key={index}
            onClick={() => {
              if (!item.disabled) {
                item.action();
                onClose();
              }
            }}
            disabled={item.disabled}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.875rem',
              color: item.disabled ? 'var(--dpgen-muted)' : 'var(--dpgen-text)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.background = 'var(--dpgen-bg)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <i className={item.icon} style={{ width: '20px', textAlign: 'center' }} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}


