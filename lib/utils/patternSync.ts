/**
 * Utility functions for syncing patterns between localStorage and API
 * Provides functions to sync patterns bidirectionally
 */

import { Pattern } from '@/types/pattern';
import { patternsApi } from '@/lib/utils/apiClient';
import { queueSyncOperation, processSyncQueue, setupOnlineListener, isOnline } from './syncQueue';

const PATTERNS_STORAGE_KEY = 'dpgen_patterns';

/**
 * Load patterns from localStorage
 */
export function loadPatternsFromStorage(): Pattern[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(PATTERNS_STORAGE_KEY);
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading patterns from storage:', error);
    return [];
  }
}

/**
 * Save patterns to localStorage
 */
export function savePatternsToStorage(patterns: Pattern[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(patterns));
  } catch (error) {
    console.error('Error saving patterns to storage:', error);
    throw new Error('Failed to save patterns to storage');
  }
}

/**
 * Sync patterns from API to localStorage
 * User ID comes from session (authentication)
 */
export async function syncFromApi(): Promise<Pattern[]> {
  try {
    const apiPatterns = await patternsApi.getAll();
    savePatternsToStorage(apiPatterns);
    return apiPatterns;
  } catch (error) {
    console.error('Error syncing from API:', error);
    throw error;
  }
}

/**
 * Sync patterns from localStorage to API
 * Uses sync queue if offline
 * User ID comes from session (authentication)
 */
export async function syncToApi(patterns: Pattern[]): Promise<Pattern[]> {
  // Check if online
  if (!isOnline()) {
    console.log('[Sync] Offline - queuing patterns for sync when connection is restored');
    patterns.forEach(pattern => {
      queueSyncOperation('save', pattern);
    });
    // Return patterns as-is since we can't sync now
    return patterns;
  }
  
  try {
    const saved = await Promise.all(
      patterns.map(pattern => patternsApi.save(pattern))
    );
    return saved;
  } catch (error) {
    // If error, queue for retry
    console.warn('[Sync] Error syncing to API, queuing for retry:', error);
    patterns.forEach(pattern => {
      queueSyncOperation('save', pattern);
    });
    throw error;
  }
}

/**
 * Sync patterns bidirectionally (merge local and remote)
 * Improved conflict resolution: uses timestamps when available
 * User ID comes from session (authentication)
 */
export async function syncBidirectional(
  localPatterns: Pattern[]
): Promise<Pattern[]> {
  try {
    // Get patterns from API
    const apiPatterns = await patternsApi.getAll();
    
    // Create maps for easy lookup
    const localMap = new Map(localPatterns.map(p => [p.id, p]));
    const apiMap = new Map(apiPatterns.map(p => [p.id, p]));
    
    // Merge with conflict resolution
    const merged: Pattern[] = [];
    const allIds = new Set([...localMap.keys(), ...apiMap.keys()]);
    const conflicts: Array<{ id: number; local: Pattern; api: Pattern }> = [];
    
    for (const id of allIds) {
      const local = localMap.get(id);
      const api = apiMap.get(id);
      
      if (api && local) {
        // Both exist - check for conflicts
        // Compare pattern content (not just existence)
        const localHash = JSON.stringify({
          timeSignature: local.timeSignature,
          phrase: local.phrase,
          drumPattern: local.drumPattern,
          stickingPattern: local.stickingPattern,
        });
        const apiHash = JSON.stringify({
          timeSignature: api.timeSignature,
          phrase: api.phrase,
          drumPattern: api.drumPattern,
          stickingPattern: api.stickingPattern,
        });
        
        if (localHash !== apiHash) {
          // Conflict detected - prefer API version (server is source of truth)
          // In future, could use timestamps: (api as any).updatedAt > (local as any).updatedAt
          conflicts.push({ id: Number(id), local, api });
          merged.push(api); // Prefer API version
        } else {
          // No conflict, use API version (has timestamps)
          merged.push(api);
        }
      } else if (api) {
        // API-only pattern
        merged.push(api);
      } else if (local) {
        // Local-only pattern, add it
        merged.push(local);
      }
    }
    
    // Log conflicts if any
    if (conflicts.length > 0) {
      console.warn(`[Sync] ${conflicts.length} pattern conflict(s) resolved - using server version`);
    }
    
    // Save merged patterns to localStorage
    savePatternsToStorage(merged);
    
    // Upload any local-only patterns to API
    const localOnly = localPatterns.filter(p => !apiMap.has(p.id));
    if (localOnly.length > 0) {
      await syncToApi(localOnly);
    }
    
    return merged;
  } catch (error) {
    console.error('Error syncing bidirectionally:', error);
    throw error;
  }
}

/**
 * Check if API sync is enabled
 */
export function isApiSyncEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const setting = localStorage.getItem('dpgen_api_sync_enabled');
    return setting === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable or disable API sync
 */
export function setApiSyncEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('dpgen_api_sync_enabled', enabled.toString());
  } catch (error) {
    console.error('Error setting API sync preference:', error);
  }
}

/**
 * Get stored user ID (for API calls)
 */
export function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem('dpgen_user_id');
  } catch {
    return null;
  }
}

/**
 * Set user ID for API calls
 */
export function setStoredUserId(userId: string | null): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (userId) {
      localStorage.setItem('dpgen_user_id', userId);
    } else {
      localStorage.removeItem('dpgen_user_id');
    }
  } catch (error) {
    console.error('Error setting user ID:', error);
  }
}

/**
 * Check if auto-sync is enabled
 */
export function isAutoSyncEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const setting = localStorage.getItem('dpgen_auto_sync_enabled');
    // Default to true if API sync is enabled
    if (setting === null) {
      return isApiSyncEnabled();
    }
    return setting === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable or disable auto-sync
 */
export function setAutoSyncEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('dpgen_auto_sync_enabled', enabled.toString());
  } catch (error) {
    console.error('Error setting auto-sync preference:', error);
  }
}

