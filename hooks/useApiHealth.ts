/**
 * API Health Check Hook
 * Monitors API connectivity and health status
 */

import { useState, useEffect, useCallback } from 'react';
import { checkApiHealth } from '@/lib/utils/apiRetry';

interface ApiHealthStatus {
  healthy: boolean;
  latency?: number;
  error?: string;
  lastChecked: number;
}

export function useApiHealth(options: {
  interval?: number; // Check interval in ms (default: 30000 = 30 seconds)
  enabled?: boolean; // Enable health checks (default: true)
} = {}) {
  const { interval = 30000, enabled = true } = options;
  const [status, setStatus] = useState<ApiHealthStatus>({
    healthy: false,
    lastChecked: 0,
  });
  const [checking, setChecking] = useState(false);

  const performCheck = useCallback(async () => {
    if (checking) return;
    
    setChecking(true);
    try {
      const result = await checkApiHealth();
      setStatus({
        ...result,
        lastChecked: Date.now(),
      });
    } catch (error: any) {
      setStatus({
        healthy: false,
        error: error.message || 'Health check failed',
        lastChecked: Date.now(),
      });
    } finally {
      setChecking(false);
    }
  }, [checking]);

  useEffect(() => {
    if (!enabled) return;

    // Perform initial check
    performCheck();

    // Set up interval
    const intervalId = setInterval(performCheck, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, interval, performCheck]);

  return {
    ...status,
    checking,
    checkNow: performCheck,
  };
}

