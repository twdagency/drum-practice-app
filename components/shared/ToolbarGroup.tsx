/**
 * Toolbar group container component
 */

import React from 'react';

interface ToolbarGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ToolbarGroup({ children, className = '' }: ToolbarGroupProps) {
  return <div className={`dpgen-toolbar__group ${className}`}>{children}</div>;
}

