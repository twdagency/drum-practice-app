/**
 * Hook for managing practice progress via API
 * Provides functions to save and load practice progress
 */

import { useState, useCallback } from 'react';
import { progressApi, PracticeProgress } from '@/lib/utils/apiClient';

interface UseProgressApiOptions {
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

export function useProgressApi(options: UseProgressApiOptions = {}) {
  const { onError, onSuccess } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: Error) => {
    setError(err);
    onError?.(err);
    console.error('[useProgressApi]', err);
  }, [onError]);

  const handleSuccess = useCallback((message: string) => {
    setError(null);
    onSuccess?.(message);
  }, [onSuccess]);

  /**
   * Load progress for the user (user ID comes from session)
   */
  const loadProgress = useCallback(async (options?: {
    patternId?: number;
    practiceType?: 'midi' | 'microphone' | 'recording';
  }): Promise<PracticeProgress[]> => {
    setLoading(true);
    setError(null);
    try {
      const progress = await progressApi.get(options);
      handleSuccess('Progress loaded successfully');
      return progress;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load progress');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Save practice progress (user ID comes from session)
   */
  const saveProgress = useCallback(async (data: {
    patternId: number;
    practiceType: 'midi' | 'microphone' | 'recording';
    accuracy?: number;
    timing?: number;
    notes?: Array<{
      noteIndex: number;
      accuracy: number;
      timing: number;
      attempts: number;
    }>;
    totalTime?: number;
  }): Promise<PracticeProgress> => {
    setLoading(true);
    setError(null);
    try {
      const progress = await progressApi.save(data);
      handleSuccess('Progress saved successfully');
      return progress;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save progress');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Get progress for a specific pattern (user ID comes from session)
   */
  const getPatternProgress = useCallback(async (
    patternId: number,
    practiceType?: 'midi' | 'microphone' | 'recording'
  ): Promise<PracticeProgress | null> => {
    setLoading(true);
    setError(null);
    try {
      const progress = await progressApi.get({ patternId, practiceType });
      return progress[0] || null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load pattern progress');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    loading,
    error,
    loadProgress,
    saveProgress,
    getPatternProgress,
  };
}

