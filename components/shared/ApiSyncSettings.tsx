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
  getStoredUserId, 
  setStoredUserId,
  syncFromApi,
  syncToApi,
  syncBidirectional,
} from '@/lib/utils/patternSync';
import { usePatternsApi } from '@/hooks/usePatternsApi';
import { useToast } from './Toast';

export function ApiSyncSettings() {
  const { showToast } = useToast();
  const patterns = useStore((state) => state.patterns);
  const setPatterns = useStore((state) => state.setPatterns);
  
  const [enabled, setEnabled] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  
  const { loading: apiLoading, error: apiError } = usePatternsApi({
    userId: userId || undefined,
    onError: (error) => {
      showToast(`API Error: ${error.message}`, 'error');
    },
  });

  useEffect(() => {
    setEnabled(isApiSyncEnabled());
    setUserId(getStoredUserId() || '');
  }, []);

  const handleToggleEnabled = async () => {
    const newEnabled = !enabled;
    setApiSyncEnabled(newEnabled);
    setEnabled(newEnabled);
    
    if (newEnabled && userId) {
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

  const handleUserIdChange = (newUserId: string) => {
    setUserId(newUserId);
    setStoredUserId(newUserId || null);
    if (newUserId) {
      showToast('User ID updated', 'success');
    }
  };

  const handleSync = async (direction: 'from' | 'to' | 'both' = 'both') => {
    if (!enabled || !userId) {
      showToast('Please enable API sync and set a user ID', 'warning');
      return;
    }

    setSyncing(true);
    try {
      let syncedPatterns: any[] = [];
      
      if (direction === 'from') {
        syncedPatterns = await syncFromApi(userId);
        setPatterns(syncedPatterns);
        showToast('Synced from API', 'success');
      } else if (direction === 'to') {
        await syncToApi(patterns, userId);
        showToast('Synced to API', 'success');
      } else {
        syncedPatterns = await syncBidirectional(patterns, userId);
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

        {/* User ID Input */}
        {enabled && (
          <div>
            <label
              htmlFor="api-user-id"
              style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}
            >
              User ID (for API sync)
            </label>
            <input
              id="api-user-id"
              type="text"
              value={userId}
              onChange={(e) => handleUserIdChange(e.target.value)}
              placeholder="Enter user ID (e.g., user123)"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--dpgen-border)',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
              This will be replaced with authentication in the future
            </div>
          </div>
        )}

        {/* Sync Buttons */}
        {enabled && userId && (
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

