/**
 * Hook for managing collections via API
 * Provides functions to create, load, update, and delete collections
 */

import { useState, useCallback } from 'react';
import { collectionsApi, Collection } from '@/lib/utils/apiClient';

interface UseCollectionsApiOptions {
  userId?: string;
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

export function useCollectionsApi(options: UseCollectionsApiOptions = {}) {
  const { userId, onError, onSuccess } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: Error) => {
    setError(err);
    onError?.(err);
    console.error('[useCollectionsApi]', err);
  }, [onError]);

  const handleSuccess = useCallback((message: string) => {
    setError(null);
    onSuccess?.(message);
  }, [onSuccess]);

  /**
   * Load all collections from the API
   */
  const loadCollections = useCallback(async (): Promise<Collection[]> => {
    setLoading(true);
    setError(null);
    try {
      const collections = await collectionsApi.getAll(userId);
      handleSuccess('Collections loaded successfully');
      return collections;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load collections');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, handleError, handleSuccess]);

  /**
   * Load a single collection by ID
   */
  const loadCollection = useCallback(async (id: string): Promise<Collection> => {
    setLoading(true);
    setError(null);
    try {
      const collection = await collectionsApi.getById(id);
      handleSuccess('Collection loaded successfully');
      return collection;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load collection');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Create a new collection
   */
  const createCollection = useCallback(async (data: {
    name: string;
    description?: string;
    patternIds: number[];
    tags?: string[];
  }): Promise<Collection> => {
    setLoading(true);
    setError(null);
    try {
      const collection = await collectionsApi.create({
        ...data,
        userId,
      });
      handleSuccess('Collection created successfully');
      return collection;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create collection');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, handleError, handleSuccess]);

  /**
   * Update a collection
   */
  const updateCollection = useCallback(async (
    id: string,
    updates: {
      name?: string;
      description?: string;
      patternIds?: number[];
      tags?: string[];
    }
  ): Promise<Collection> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await collectionsApi.update(id, {
        ...updates,
        userId,
      });
      handleSuccess('Collection updated successfully');
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update collection');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, handleError, handleSuccess]);

  /**
   * Delete a collection
   */
  const deleteCollection = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await collectionsApi.delete(id, userId);
      handleSuccess('Collection deleted successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete collection');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, handleError, handleSuccess]);

  return {
    loading,
    error,
    loadCollections,
    loadCollection,
    createCollection,
    updateCollection,
    deleteCollection,
  };
}

