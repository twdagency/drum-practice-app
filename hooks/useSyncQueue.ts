/**
 * Sync Queue Hook
 * Manages sync queue and processes it when online
 */

import { useEffect } from 'react';
import { setupOnlineListener, processSyncQueue, getSyncQueueStatus } from '@/lib/utils/syncQueue';

interface UseSyncQueueOptions {
  enabled?: boolean;
  autoProcess?: boolean; // Automatically process queue when online (default: true)
}

export function useSyncQueue(options: UseSyncQueueOptions = {}) {
  const { enabled = true, autoProcess = true } = options;
  
  useEffect(() => {
    if (!enabled || !autoProcess) return;
    
    const cleanup = setupOnlineListener();
    
    return cleanup;
  }, [enabled, autoProcess]);
  
  const processQueue = async () => {
    return processSyncQueue();
  };
  
  const status = getSyncQueueStatus();
  
  return {
    status,
    processQueue,
  };
}

