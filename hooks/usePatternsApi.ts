/**
 * Hook for managing patterns via API
 * Provides functions to save, load, update, and delete patterns from the backend
 */

import { useState, useCallback } from 'react';
import { patternsApi } from '@/lib/utils/apiClient';
import { Pattern } from '@/types/pattern';

interface UsePatternsApiOptions {
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

export function usePatternsApi(options: UsePatternsApiOptions = {}) {
  const { onError, onSuccess } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: Error) => {
    setError(err);
    onError?.(err);
    console.error('[usePatternsApi]', err);
  }, [onError]);

  const handleSuccess = useCallback((message: string) => {
    setError(null);
    onSuccess?.(message);
  }, [onSuccess]);

  /**
   * Load all patterns from the API
   */
  const loadPatterns = useCallback(async (): Promise<Pattern[]> => {
    setLoading(true);
    setError(null);
    try {
      const patterns = await patternsApi.getAll();
      handleSuccess('Patterns loaded successfully');
      return patterns;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load patterns');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Load a single pattern by ID
   */
  const loadPattern = useCallback(async (id: number | string): Promise<Pattern> => {
    setLoading(true);
    setError(null);
    try {
      const pattern = await patternsApi.getById(id);
      handleSuccess('Pattern loaded successfully');
      return pattern;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load pattern');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Save a pattern to the API
   */
  const savePattern = useCallback(async (pattern: Pattern): Promise<Pattern> => {
    setLoading(true);
    setError(null);
    try {
      const saved = await patternsApi.save(pattern);
      handleSuccess('Pattern saved successfully');
      return saved;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save pattern');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Save multiple patterns to the API
   */
  const savePatterns = useCallback(async (patterns: Pattern[]): Promise<Pattern[]> => {
    setLoading(true);
    setError(null);
    try {
      const saved = await Promise.all(
        patterns.map(pattern => patternsApi.save(pattern))
      );
      handleSuccess(`${patterns.length} pattern(s) saved successfully`);
      return saved;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save patterns');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Update a pattern in the API
   */
  const updatePattern = useCallback(async (
    id: number | string,
    updates: Partial<Pattern>
  ): Promise<Pattern> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await patternsApi.update(id, updates);
      handleSuccess('Pattern updated successfully');
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update pattern');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Delete a pattern from the API
   */
  const deletePattern = useCallback(async (id: number | string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await patternsApi.delete(id);
      handleSuccess('Pattern deleted successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete pattern');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  return {
    loading,
    error,
    loadPatterns,
    loadPattern,
    savePattern,
    savePatterns,
    updatePattern,
    deletePattern,
  };
}

