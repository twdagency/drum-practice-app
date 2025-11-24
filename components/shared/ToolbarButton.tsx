/**
 * Reusable toolbar button component
 */

import React from 'react';

interface ToolbarButtonProps {
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  title?: string;
  icon?: string;
  variant?: 'default' | 'primary' | 'small';
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
  const baseClasses = 'dpgen-toolbar__button';
  const variantClasses = {
    default: '',
    primary: 'dpgen-toolbar__button--primary',
    small: 'dpgen-toolbar__button--small',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={onKeyDown}
      title={title}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {icon && <i className={icon} />}
      {children}
    </button>
  );
}

// Memoize to prevent unnecessary re-renders
export const ToolbarButton = React.memo(ToolbarButtonComponent);

