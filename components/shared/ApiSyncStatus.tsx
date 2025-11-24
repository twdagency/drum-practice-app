/**
 * API Sync Status Indicator
 * Shows current API sync status in a compact format
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { isApiSyncEnabled, isAutoSyncEnabled } from '@/lib/utils/patternSync';

interface ApiSyncStatusProps {
  compact?: boolean; // Show compact version
  onClick?: () => void; // Click handler to open settings
}

export function ApiSyncStatus({ compact = false, onClick }: ApiSyncStatusProps) {
  const { data: session } = useSession();
  const [enabled, setEnabled] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const hasUserId = !!session?.user;

  useEffect(() => {
    const updateStatus = () => {
      setEnabled(isApiSyncEnabled());
      setAutoSync(isAutoSyncEnabled());
    };

    updateStatus();
    
    // Update on storage changes
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', updateStatus);
      // Also check periodically for same-tab updates
      const interval = setInterval(updateStatus, 1000);
      return () => {
        window.removeEventListener('storage', updateStatus);
        clearInterval(interval);
      };
    }
  }, [session]);

  if (!enabled) {
    return null; // Don't show anything if sync is disabled
  }

  if (compact) {
    return (
      <span
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.75rem',
          color: hasUserId ? 'var(--dpgen-success, #10b981)' : 'var(--dpgen-warning, #f59e0b)',
          cursor: onClick ? 'pointer' : 'default',
        }}
        title={hasUserId 
          ? (autoSync ? 'API Sync: Enabled (Auto-sync on)' : 'API Sync: Enabled')
          : 'API Sync: Enabled (Sign in required)'}
      >
        <i className={`fas fa-cloud${autoSync ? '-check' : ''}`} />
        {autoSync && <span>Auto</span>}
      </span>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: hasUserId 
          ? 'var(--dpgen-success-bg, rgba(16, 185, 129, 0.1))' 
          : 'var(--dpgen-warning-bg, rgba(245, 158, 11, 0.1))',
        border: `1px solid ${hasUserId 
          ? 'var(--dpgen-success, #10b981)' 
          : 'var(--dpgen-warning, #f59e0b)'}`,
        borderRadius: '6px',
        fontSize: '0.875rem',
        color: hasUserId 
          ? 'var(--dpgen-success-text, #10b981)' 
          : 'var(--dpgen-warning-text, #f59e0b)',
        cursor: onClick ? 'pointer' : 'default',
      }}
      title={hasUserId 
        ? (autoSync ? 'API Sync: Enabled (Auto-sync on)' : 'API Sync: Enabled')
        : 'API Sync: Enabled (User ID required)'}
    >
      <i className={`fas fa-cloud${autoSync ? '-check' : ''}`} />
      <span>
        {hasUserId ? (
          autoSync ? 'Auto-sync enabled' : 'API sync enabled'
        ) : (
          'Sign in required'
        )}
      </span>
    </div>
  );
}

