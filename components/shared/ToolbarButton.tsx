/**
 * Reusable toolbar button component with enhanced animations
 */

'use client';

import React, { useState, useRef } from 'react';

interface ToolbarButtonProps {
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  title?: string;
  icon?: string;
  variant?: 'default' | 'primary' | 'small' | 'danger';
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

function ToolbarButtonComponent({
  onClick,
  onKeyDown,
  title,
  icon,
  variant = 'default',
  disabled = false,
  children,
  className = '',
}: ToolbarButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const baseClasses = 'dpgen-toolbar__button';
  const variantClasses = {
    default: '',
    primary: 'dpgen-toolbar__button--primary',
    small: 'dpgen-toolbar__button--small',
    danger: 'dpgen-toolbar__button--danger',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !onClick) return;

    // Create ripple effect
    if (buttonRef.current && typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newRipple = { id: rippleIdRef.current++, x, y };
        setRipples(prev => [...prev, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 600);
      }
    }

    // Press animation
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    onClick();
  };

  const handleMouseDown = () => {
    if (!disabled) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      onKeyDown={onKeyDown}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      title={title}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        transform: isPressed && !prefersReducedMotion ? 'scale(0.95)' : 'scale(1)',
        transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease, background-color 0.2s ease, color 0.2s ease',
      }}
    >
      {!prefersReducedMotion && ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            position: 'absolute',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
            width: '20px',
            height: '20px',
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            animation: 'ripple 0.6s ease-out',
          }}
        />
      ))}
      {icon && <i className={icon} />}
      {children}
    </button>
  );
}

// Memoize to prevent unnecessary re-renders
export const ToolbarButton = React.memo(ToolbarButtonComponent);
