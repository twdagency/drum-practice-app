/**
 * API Sync Settings Modal
 * Configure API sync settings and manage pattern synchronization
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { 
  isApiSyncEnabled, 
  setApiSyncEnabled, 
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  syncFromApi,
  syncToApi,
  syncBidirectional,
} from '@/lib/utils/patternSync';
import { usePatternsApi } from '@/hooks/usePatternsApi';
import { useApiHealth } from '@/hooks/useApiHealth';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { useToast } from '../shared/Toast';
import { useSession } from 'next-auth/react';

interface ApiSyncSettingsModalProps {
  onClose: () => void;
}

export function ApiSyncSettingsModal({ onClose }: ApiSyncSettingsModalProps) {
  // Get toast - should be available since modal is rendered from Toolbar which is in ToastProvider
  const { showToast } = useToast();
  const { data: session } = useSession();
  const patterns = useStore((state) => state.patterns);
  const setPatterns = useStore((state) => state.setPatterns);
  
  const [enabled, setEnabled] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Get user ID from session (automatically authenticated)
  const userId = session?.user?.id || '';
  
  const { loading: apiLoading, error: apiError } = usePatternsApi({
    onError: (error) => {
      showToast(`API Error: ${error.message}`, 'error');
    },
  });

  // API health check
  const apiHealth = useApiHealth({
    enabled: enabled && !!userId,
    interval: 30000, // Check every 30 seconds
  });

  // Sync queue status
  const syncQueue = useSyncQueue({ enabled: enabled && !!userId });

  useEffect(() => {
    setEnabled(isApiSyncEnabled());
    setAutoSync(isAutoSyncEnabled());
  }, []);

  const handleToggleEnabled = async () => {
    const newEnabled = !enabled;
    setApiSyncEnabled(newEnabled);
    setEnabled(newEnabled);
    
    // Disable auto-sync if API sync is disabled
    if (!newEnabled) {
      setAutoSyncEnabled(false);
      setAutoSync(false);
    }
    
    if (newEnabled && userId) {
      // Auto-sync when enabling
      try {
        await handleSync('both');
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }
    
    showToast(
      newEnabled ? 'API sync enabled' : 'API sync disabled',
      'success'
    );
  };

  const handleToggleAutoSync = () => {
    const newAutoSync = !autoSync;
    setAutoSyncEnabled(newAutoSync);
    setAutoSync(newAutoSync);
    
    showToast(
      newAutoSync ? 'Auto-sync enabled' : 'Auto-sync disabled',
      'success'
    );
  };

  const handleSync = async (direction: 'from' | 'to' | 'both' = 'both') => {
    if (!enabled || !userId) {
      if (!userId) {
        showToast('Please sign in to use API sync', 'warning');
      } else {
        showToast('Please enable API sync', 'warning');
      }
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
      className="dpgen-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        className="dpgen-modal-content"
        style={{
          background: 'var(--dpgen-bg)',
          borderRadius: '10px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            Cloud Sync Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--dpgen-text)',
              padding: '0.25rem 0.5rem',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Enable/Disable Toggle */}
          <div>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <span style={{ flex: 1 }}>Enable API Sync</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={handleToggleEnabled}
                style={{ cursor: 'pointer' }}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.5rem' }}>
              Sync your patterns with the server for backup and access from multiple devices
            </div>
          </div>

          {/* Auto-Sync Toggle */}
          {enabled && (
            <div>
              <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <span style={{ flex: 1 }}>Auto-Sync on Changes</span>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={handleToggleAutoSync}
                  style={{ cursor: 'pointer' }}
                />
                <span className="dpgen-toggle-slider" />
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.5rem' }}>
                Automatically sync patterns to the server when they change (2 second delay)
              </div>
            </div>
          )}

          {/* Authentication Status */}
          {enabled && (
            <div>
              {userId ? (
                <div style={{
                  padding: '0.75rem',
                  background: 'var(--dpgen-success-bg, rgba(16, 185, 129, 0.1))',
                  border: '1px solid var(--dpgen-success, #10b981)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <i className="fas fa-check-circle" style={{ color: 'var(--dpgen-success, #10b981)' }} />
                    <strong>Signed in as:</strong> {session?.user?.email || userId}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: '0.8', marginTop: '0.25rem' }}>
                    Your patterns will be synced to your account automatically.
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '0.75rem',
                  background: 'var(--dpgen-warning-bg, rgba(245, 158, 11, 0.1))',
                  border: '1px solid var(--dpgen-warning, #f59e0b)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: 'var(--dpgen-warning-text, #f59e0b)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fas fa-exclamation-triangle" />
                    <strong>Please sign in to use API sync</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: '0.8', marginTop: '0.25rem' }}>
                    Use the Sign In button in the toolbar to authenticate.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sync Buttons */}
          {enabled && userId && (
            <div>
              <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
                Sync Patterns
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleSync('from')}
                  disabled={syncing || apiLoading}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '0.75rem 1rem',
                    background: 'var(--dpgen-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: syncing || apiLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    opacity: syncing || apiLoading ? 0.6 : 1,
                  }}
                >
                  {syncing ? 'Syncing...' : 'Download from API'}
                </button>
                <button
                  onClick={() => handleSync('to')}
                  disabled={syncing || apiLoading}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '0.75rem 1rem',
                    background: 'var(--dpgen-accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: syncing || apiLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    opacity: syncing || apiLoading ? 0.6 : 1,
                  }}
                >
                  {syncing ? 'Syncing...' : 'Upload to API'}
                </button>
                <button
                  onClick={() => handleSync('both')}
                  disabled={syncing || apiLoading}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '0.75rem 1rem',
                    background: 'var(--dpgen-success, #10b981)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: syncing || apiLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    opacity: syncing || apiLoading ? 0.6 : 1,
                  }}
                >
                  {syncing ? 'Syncing...' : 'Bidirectional Sync'}
                </button>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.5rem' }}>
                <strong>Download:</strong> Replace local patterns with server patterns<br />
                <strong>Upload:</strong> Save local patterns to server<br />
                <strong>Bidirectional:</strong> Merge local and server patterns (recommended)
              </div>
            </div>
          )}

          {/* Sync Queue Status */}
          {enabled && userId && syncQueue.status.size > 0 && (
            <div
              style={{
                padding: '0.75rem',
                background: 'var(--dpgen-info-bg, rgba(59, 130, 246, 0.1))',
                border: '1px solid var(--dpgen-info, #3b82f6)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: 'var(--dpgen-info-text, #3b82f6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <i className="fas fa-clock" />
                <strong>
                  {syncQueue.status.size} operation(s) queued for sync
                </strong>
              </div>
              {syncQueue.status.oldestOperation && (
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                  Oldest: {new Date(syncQueue.status.oldestOperation).toLocaleString()}
                </div>
              )}
              <button
                onClick={async () => {
                  const result = await syncQueue.processQueue();
                  if (result.processed > 0) {
                    showToast(`Processed ${result.processed} queued operations`, 'success');
                  }
                  if (result.failed > 0) {
                    showToast(`${result.failed} operations failed`, 'error');
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--dpgen-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Process Queue Now
              </button>
            </div>
          )}

          {/* API Health Status */}
          {enabled && userId && (
            <div
              style={{
                padding: '0.75rem',
                background: apiHealth.healthy
                  ? 'var(--dpgen-success-bg, rgba(16, 185, 129, 0.1))'
                  : 'var(--dpgen-warning-bg, rgba(245, 158, 11, 0.1))',
                border: `1px solid ${apiHealth.healthy
                  ? 'var(--dpgen-success, #10b981)'
                  : 'var(--dpgen-warning, #f59e0b)'}`,
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: apiHealth.healthy
                  ? 'var(--dpgen-success-text, #10b981)'
                  : 'var(--dpgen-warning-text, #f59e0b)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <i className={`fas fa-${apiHealth.healthy ? 'check-circle' : 'exclamation-triangle'}`} />
                <strong>
                  API Status: {apiHealth.healthy ? 'Connected' : 'Disconnected'}
                </strong>
              </div>
              {apiHealth.healthy && apiHealth.latency && (
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  Latency: {apiHealth.latency}ms
                </div>
              )}
              {!apiHealth.healthy && apiHealth.error && (
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  {apiHealth.error}
                </div>
              )}
              {apiHealth.lastChecked > 0 && (
                <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>
                  Last checked: {new Date(apiHealth.lastChecked).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

          {/* Error Status */}
          {apiError && (
            <div
              style={{
                padding: '0.75rem',
                background: 'var(--dpgen-error-bg, #fee)',
                color: 'var(--dpgen-error-text, #c00)',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            >
              <strong>Error:</strong> {apiError.message}
            </div>
          )}

          {/* Info Box */}
          <div
            style={{
              padding: '1rem',
              background: 'var(--dpgen-card-bg, rgba(0,0,0,0.05))',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: 'var(--dpgen-text-secondary)',
            }}
          >
            <strong>Note:</strong> API sync stores your patterns on the server. Currently using in-memory storage 
            (data resets on server restart). Database integration coming soon.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button
            type="button"
            className="dpgen-button dpgen-button-primary"
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

