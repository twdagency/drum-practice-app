/**
 * AutoSync Wrapper Component
 * Wraps auto-sync hook so it can use ToastProvider context
 */

'use client';

import { useAutoSync } from '@/hooks/useAutoSync';
import { useSyncQueue } from '@/hooks/useSyncQueue';

export function AutoSyncWrapper() {
  // Initialize auto-sync (silent mode - only shows errors)
  // This component must be inside ToastProvider
  useAutoSync({ silent: true });
  
  // Initialize sync queue for offline support
  useSyncQueue({ enabled: true, autoProcess: true });
  
  return null; // This component doesn't render anything
}

