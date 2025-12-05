/**
 * Shared Modal Component
 * Consistent modal design with proper icons and compact styling
 * Uses React Portal to render at document body level
 */

'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlay?: boolean;
  showCloseButton?: boolean;
}

const sizeStyles: Record<string, { maxWidth: string; width: string }> = {
  sm: { maxWidth: '360px', width: '90%' },
  md: { maxWidth: '480px', width: '90%' },
  lg: { maxWidth: '640px', width: '95%' },
  xl: { maxWidth: '800px', width: '95%' },
  full: { maxWidth: '95vw', width: '95%' },
};

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  size = 'md',
  children,
  footer,
  closeOnOverlay = true,
  showCloseButton = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen || !mounted) return null;

  const { maxWidth, width } = sizeStyles[size];

  const modalContent = (
    <div
      onClick={closeOnOverlay ? onClose : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--dpgen-card)',
          borderRadius: '12px',
          maxWidth,
          width,
          maxHeight: 'calc(100vh - 2rem)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--dpgen-border)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--dpgen-border)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {icon && (
              <span style={{ color: 'var(--dpgen-primary)', display: 'flex' }}>
                {icon}
              </span>
            )}
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--dpgen-text)' }}>
              {title}
            </h2>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--dpgen-muted)',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--dpgen-bg)';
                e.currentTarget.style.color = 'var(--dpgen-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--dpgen-muted)';
              }}
              aria-label="Close"
            >
              <X size={20} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '1.25rem',
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--dpgen-border)',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render at document body level to avoid z-index/positioning issues
  return createPortal(modalContent, document.body);
}

// Reusable modal sub-components for consistent internal styling

export function ModalSection({ 
  title, 
  children,
  collapsed = false,
}: { 
  title?: string; 
  children: React.ReactNode;
  collapsed?: boolean;
}) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {title && (
        <h3 style={{ 
          margin: '0 0 0.75rem', 
          fontSize: '0.875rem', 
          fontWeight: 600, 
          color: 'var(--dpgen-text)',
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
        }}>
          {title}
        </h3>
      )}
      {!collapsed && children}
    </div>
  );
}

export function ModalRow({ 
  label, 
  children,
  description,
}: { 
  label: string; 
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: '1rem',
      }}>
        <label style={{ 
          fontSize: '0.875rem', 
          color: 'var(--dpgen-text)',
          fontWeight: 500,
        }}>
          {label}
        </label>
        {children}
      </div>
      {description && (
        <p style={{ 
          fontSize: '0.75rem', 
          color: 'var(--dpgen-muted)', 
          margin: '0.25rem 0 0',
          lineHeight: 1.4,
        }}>
          {description}
        </p>
      )}
    </div>
  );
}

export function ModalToggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        border: 'none',
        background: checked ? 'var(--dpgen-primary)' : 'var(--dpgen-border)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '23px' : '3px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'white',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

export function ModalButton({
  children,
  onClick,
  variant = 'secondary',
  disabled = false,
  fullWidth = false,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) {
  const variantStyles = {
    primary: {
      background: 'var(--dpgen-primary)',
      color: 'white',
      border: 'none',
    },
    secondary: {
      background: 'var(--dpgen-bg)',
      color: 'var(--dpgen-text)',
      border: '1px solid var(--dpgen-border)',
    },
    danger: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
    },
  };

  const style = variantStyles[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...style,
        padding: '0.625rem 1.25rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s, transform 0.1s',
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {children}
    </button>
  );
}

export function ModalAlert({
  type = 'info',
  children,
}: {
  type?: 'info' | 'warning' | 'error' | 'success';
  children: React.ReactNode;
}) {
  const colors = {
    info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#3b82f6' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#f59e0b' },
    error: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#ef4444' },
    success: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', text: '#22c55e' },
  };

  const { bg, border, text } = colors[type];

  return (
    <div
      style={{
        padding: '0.875rem 1rem',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '8px',
        marginBottom: '1rem',
        color: text,
        fontSize: '0.875rem',
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

export function ModalSelect({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        padding: '0.5rem 0.75rem',
        borderRadius: '6px',
        border: '1px solid var(--dpgen-border)',
        background: 'var(--dpgen-bg)',
        color: 'var(--dpgen-text)',
        fontSize: '0.875rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        minWidth: '140px',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function ModalSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  showValue = true,
  valueFormatter = (v: number) => String(v),
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        style={{ 
          flex: 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      />
      {showValue && (
        <span style={{ 
          fontSize: '0.875rem', 
          color: 'var(--dpgen-muted)',
          minWidth: '50px',
          textAlign: 'right',
        }}>
          {valueFormatter(value)}
        </span>
      )}
    </div>
  );
}

export function ModalGrid({
  cols = 2,
  children,
}: {
  cols?: 2 | 3 | 4;
  children: React.ReactNode;
}) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '0.75rem',
    }}>
      {children}
    </div>
  );
}

export function ModalStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div style={{
      background: 'var(--dpgen-bg)',
      padding: '0.75rem',
      borderRadius: '8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: color || 'var(--dpgen-text)' }}>
        {value}
      </div>
    </div>
  );
}

