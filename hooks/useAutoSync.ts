/**
 * Auto-sync hook
 * Automatically syncs patterns to API when they change (if API sync is enabled)
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { isApiSyncEnabled, isAutoSyncEnabled, syncToApi } from '@/lib/utils/patternSync';
import { useToast } from '@/components/shared/Toast';
import { useSession } from 'next-auth/react';

interface UseAutoSyncOptions {
  enabled?: boolean; // Override auto-sync (default: checks isApiSyncEnabled)
  debounceMs?: number; // Debounce delay in milliseconds (default: 2000)
  silent?: boolean; // Don't show toast notifications (default: false)
}

export function useAutoSync(options: UseAutoSyncOptions = {}) {
  const { enabled: overrideEnabled, debounceMs = 2000, silent = false } = options;
  const { showToast } = useToast();
  const patterns = useStore((state) => state.patterns);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedPatternsRef = useRef<string>('');

  useEffect(() => {
    // Check if auto-sync is enabled
    const shouldSync = overrideEnabled !== undefined 
      ? overrideEnabled 
      : (typeof window !== 'undefined' && isApiSyncEnabled() && isAutoSyncEnabled());
    
    if (!shouldSync) {
      return;
    }

    const userId = getStoredUserId();
    if (!userId) {
      return; // No user ID, can't sync
    }

    // Create a hash of current patterns to detect changes
    const patternsHash = JSON.stringify(patterns.map(p => ({ id: p.id, timeSignature: p.timeSignature, phrase: p.phrase, drumPattern: p.drumPattern })));
    
    // Skip if patterns haven't changed
    if (patternsHash === lastSyncedPatternsRef.current) {
      return;
    }

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce the sync
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await syncToApi(patterns, userId);
        lastSyncedPatternsRef.current = patternsHash;
        
        if (!silent) {
          showToast('Patterns auto-synced to server', 'success');
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
        if (!silent) {
          showToast('Auto-sync failed. Check your connection.', 'error');
        }
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [patterns, overrideEnabled, debounceMs, silent, showToast]);

  // Manual sync function
  const syncNow = async () => {
    const shouldSync = overrideEnabled !== undefined 
      ? overrideEnabled 
      : (typeof window !== 'undefined' && isApiSyncEnabled() && isAutoSyncEnabled());
    
    if (!shouldSync) {
      throw new Error('Auto-sync is not enabled');
    }

    const userId = getStoredUserId();
    if (!userId) {
      throw new Error('User ID is not set');
    }

    try {
      await syncToApi(patterns, userId);
      const patternsHash = JSON.stringify(patterns.map(p => ({ id: p.id, timeSignature: p.timeSignature, phrase: p.phrase, drumPattern: p.drumPattern })));
      lastSyncedPatternsRef.current = patternsHash;
      
      if (!silent) {
        showToast('Patterns synced to server', 'success');
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      if (!silent) {
        showToast('Sync failed. Check your connection.', 'error');
      }
      throw error;
    }
  };

  return {
    syncNow,
  };
}

