/**
 * API Sync Settings Component
 * Allows users to enable/disable API sync and manage sync preferences
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { 
  isApiSyncEnabled, 
  setApiSyncEnabled, 
  syncFromApi,
  syncToApi,
  syncBidirectional,
} from '@/lib/utils/patternSync';
import { usePatternsApi } from '@/hooks/usePatternsApi';
import { useToast } from './Toast';
import { useSession } from 'next-auth/react';

export function ApiSyncSettings() {
  const { showToast } = useToast();
  const { data: session } = useSession();
  const patterns = useStore((state) => state.patterns);
  const setPatterns = useStore((state) => state.setPatterns);
  
  const [enabled, setEnabled] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const { loading: apiLoading, error: apiError } = usePatternsApi({
    onError: (error) => {
      showToast(`API Error: ${error.message}`, 'error');
    },
  });

  useEffect(() => {
    setEnabled(isApiSyncEnabled());
  }, []);

  const handleToggleEnabled = async () => {
    const newEnabled = !enabled;
    setApiSyncEnabled(newEnabled);
    setEnabled(newEnabled);
    
    if (newEnabled && session?.user) {
      // Auto-sync when enabling
      try {
        await handleSync();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }
    
    showToast(
      newEnabled ? 'API sync enabled' : 'API sync disabled',
      'success'
    );
  };

  const handleSync = async (direction: 'from' | 'to' | 'both' = 'both') => {
    if (!enabled) {
      showToast('Please enable API sync', 'warning');
      return;
    }

    setSyncing(true);
    try {
      let syncedPatterns: any[] = [];
      
      if (direction === 'from') {
        syncedPatterns = await syncFromApi();
        setPatterns(syncedPatterns);
        showToast('Synced from API', 'success');
      } else if (direction === 'to') {
        await syncToApi(patterns);
        showToast('Synced to API', 'success');
      } else {
        syncedPatterns = await syncBidirectional(patterns);
        setPatterns(syncedPatterns);
        showToast('Bidirectional sync complete', 'success');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      showToast(`Sync failed: ${message}`, 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      style={{
        padding: '1rem',
        background: 'var(--dpgen-card-bg, rgba(0,0,0,0.05))',
        borderRadius: '8px',
        border: '1px solid var(--dpgen-border)',
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>
        API Sync Settings
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Enable/Disable Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="api-sync-enabled"
            checked={enabled}
            onChange={handleToggleEnabled}
            style={{ cursor: 'pointer' }}
          />
          <label
            htmlFor="api-sync-enabled"
            style={{ cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Enable API Sync
          </label>
        </div>

        {/* Authentication Status */}
        {enabled && (
          <div>
            {session?.user ? (
              <div style={{
                padding: '0.75rem',
                background: 'var(--dpgen-success-bg, rgba(16, 185, 129, 0.1))',
                color: 'var(--dpgen-success-text, #10b981)',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}>
                ✓ Signed in as {session.user.email || session.user.name || 'User'}
              </div>
            ) : (
              <div style={{
                padding: '0.75rem',
                background: 'var(--dpgen-warning-bg, rgba(245, 158, 11, 0.1))',
                color: 'var(--dpgen-warning-text, #f59e0b)',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}>
                ⚠️ Please sign in to use API sync
              </div>
            )}
          </div>
        )}

        {/* Sync Buttons */}
        {enabled && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleSync('from')}
              disabled={syncing || apiLoading}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--dpgen-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: syncing || apiLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                opacity: syncing || apiLoading ? 0.6 : 1,
              }}
            >
              {syncing ? 'Syncing...' : 'Sync From API'}
            </button>
            <button
              onClick={() => handleSync('to')}
              disabled={syncing || apiLoading}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--dpgen-accent)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: syncing || apiLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                opacity: syncing || apiLoading ? 0.6 : 1,
              }}
            >
              {syncing ? 'Syncing...' : 'Sync To API'}
            </button>
            <button
              onClick={() => handleSync('both')}
              disabled={syncing || apiLoading}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--dpgen-success, #10b981)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: syncing || apiLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                opacity: syncing || apiLoading ? 0.6 : 1,
              }}
            >
              {syncing ? 'Syncing...' : 'Bidirectional Sync'}
            </button>
          </div>
        )}

        {/* Status */}
        {apiError && (
          <div
            style={{
              padding: '0.75rem',
              background: 'var(--dpgen-error-bg, #fee)',
              color: 'var(--dpgen-error-text, #c00)',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          >
            API Error: {apiError.message}
          </div>
        )}

        {enabled && (
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--dpgen-muted)',
              padding: '0.5rem',
              background: 'var(--dpgen-bg)',
              borderRadius: '4px',
            }}
          >
            <strong>Note:</strong> API sync stores your patterns on the server. 
            Currently using in-memory storage (data resets on server restart). 
            Database integration coming soon.
          </div>
        )}
      </div>
    </div>
  );
}

