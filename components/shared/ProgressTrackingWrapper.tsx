/**
 * Progress Tracking Wrapper Component
 * Wraps progress tracking hook so it can use ToastProvider context
 */

'use client';

import { useProgressTracking } from '@/hooks/useProgressTracking';

export function ProgressTrackingWrapper() {
  // Initialize progress tracking (silent mode - only logs errors)
  // This component must be inside ToastProvider
  useProgressTracking({ silent: true });
  
  return null; // This component doesn't render anything
}

