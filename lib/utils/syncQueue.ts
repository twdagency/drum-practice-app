/**
 * Sync Queue for Offline Support
 * Queues sync operations when offline and processes them when connection is restored
 */

import { patternsApi } from './apiClient';
import { Pattern } from '@/types/pattern';

interface QueuedSyncOperation {
  id: string;
  type: 'save' | 'update' | 'delete';
  pattern: Pattern | Partial<Pattern>;
  patternId?: number | string;
  timestamp: number;
  retries: number;
}

const SYNC_QUEUE_KEY = 'dpgen_sync_queue';
const MAX_RETRIES = 5;
const MAX_QUEUE_SIZE = 100;

/**
 * Get sync queue from localStorage
 */
function getSyncQueue(): QueuedSyncOperation[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save sync queue to localStorage
 */
function saveSyncQueue(queue: QueuedSyncOperation[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Limit queue size
    const limited = queue.slice(-MAX_QUEUE_SIZE);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Failed to save sync queue:', error);
  }
}

/**
 * Add operation to sync queue
 * User ID will come from session when processing
 */
export function queueSyncOperation(
  type: 'save' | 'update' | 'delete',
  pattern: Pattern | Partial<Pattern>,
  patternId?: number | string
): void {
  const queue = getSyncQueue();
  
  const operation: QueuedSyncOperation = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    pattern,
    patternId,
    timestamp: Date.now(),
    retries: 0,
  };
  
  queue.push(operation);
  saveSyncQueue(queue);
  
  console.log(`[SyncQueue] Queued ${type} operation (queue size: ${queue.length})`);
}

/**
 * Process sync queue
 * Attempts to process all queued operations
 */
export async function processSyncQueue(userId?: string): Promise<{
  processed: number;
  failed: number;
  errors: Array<{ operation: QueuedSyncOperation; error: Error }>;
}> {
  const queue = getSyncQueue();
  if (queue.length === 0) {
    return { processed: 0, failed: 0, errors: [] };
  }
  
  const errors: Array<{ operation: QueuedSyncOperation; error: Error }> = [];
  const remaining: QueuedSyncOperation[] = [];
  
  console.log(`[SyncQueue] Processing ${queue.length} queued operations`);
  
  for (const operation of queue) {
    try {
      if (operation.type === 'save') {
        await patternsApi.save(operation.pattern as Pattern);
      } else if (operation.type === 'update' && operation.patternId) {
        await patternsApi.update(operation.patternId, operation.pattern);
      } else if (operation.type === 'delete' && operation.patternId) {
        await patternsApi.delete(operation.patternId);
      }
      
      console.log(`[SyncQueue] Successfully processed ${operation.type} operation ${operation.id}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      // Increment retry count
      operation.retries += 1;
      
      if (operation.retries < MAX_RETRIES) {
        // Keep in queue for retry
        remaining.push(operation);
        console.warn(`[SyncQueue] Failed to process ${operation.type} operation ${operation.id}, will retry (attempt ${operation.retries}/${MAX_RETRIES})`);
      } else {
        // Max retries exceeded, remove from queue
        errors.push({ operation, error: err });
        console.error(`[SyncQueue] Max retries exceeded for ${operation.type} operation ${operation.id}, removing from queue`);
      }
    }
  }
  
  // Save remaining queue
  saveSyncQueue(remaining);
  
  const processed = queue.length - remaining.length - errors.length;
  
  return {
    processed,
    failed: errors.length,
    errors,
  };
}

/**
 * Clear sync queue
 */
export function clearSyncQueue(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SYNC_QUEUE_KEY);
  }
}

/**
 * Get sync queue status
 */
export function getSyncQueueStatus(): {
  size: number;
  oldestOperation: number | null;
  newestOperation: number | null;
} {
  const queue = getSyncQueue();
  
  if (queue.length === 0) {
    return {
      size: 0,
      oldestOperation: null,
      newestOperation: null,
    };
  }
  
  const timestamps = queue.map(op => op.timestamp);
  
  return {
    size: queue.length,
    oldestOperation: Math.min(...timestamps),
    newestOperation: Math.max(...timestamps),
  };
}

/**
 * Check if online (simple check)
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.onLine;
}

/**
 * Listen for online/offline events and process queue when online
 */
export function setupOnlineListener(userId?: string): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  const handleOnline = async () => {
    console.log('[SyncQueue] Connection restored, processing queue...');
    const result = await processSyncQueue(userId);
    if (result.processed > 0) {
      console.log(`[SyncQueue] Processed ${result.processed} operations`);
    }
    if (result.failed > 0) {
      console.warn(`[SyncQueue] ${result.failed} operations failed after max retries`);
    }
  };
  
  window.addEventListener('online', handleOnline);
  
  // Also try to process immediately if already online
  if (isOnline()) {
    handleOnline();
  }
  
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

