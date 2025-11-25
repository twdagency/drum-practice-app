/**
 * Toolbar dropdown menu component
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ToolbarDropdownProps {
  buttonIcon: string;
  buttonTitle: string;
  children: React.ReactNode;
  controlledOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ToolbarDropdown({ buttonIcon, buttonTitle, children, controlledOpen, onOpenChange }: ToolbarDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div className="dpgen-toolbar__dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="dpgen-toolbar__button"
        title={buttonTitle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className={buttonIcon} />
      </button>
      {isOpen && (
        <div 
          className="dpgen-toolbar__menu" 
          style={{ 
            display: 'block',
            animation: 'modalEnter 0.2s ease-out',
            transformOrigin: 'top center',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

