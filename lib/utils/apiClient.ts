/**
 * API Client utilities for making requests to backend API routes
 */

import { Pattern } from '@/types/pattern';
import { withRetry } from './apiRetry';
import { preparePatternForApi } from './patternValidation';

const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

/**
 * Patterns API
 */
export const patternsApi = {
  /**
   * Get all patterns (user ID comes from session)
   */
  async getAll(): Promise<Pattern[]> {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE}/patterns`);
      const result: ApiResponse<Pattern[]> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch patterns');
      }
      
      return result.data;
    });
  },

  /**
   * Get a single pattern by ID
   */
  async getById(id: number | string): Promise<Pattern> {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE}/patterns/${id}`);
      const result: ApiResponse<Pattern> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch pattern');
      }
      
      return result.data;
    });
  },

  /**
   * Save a pattern (user ID comes from session)
   */
  async save(pattern: Pattern): Promise<Pattern> {
    // Validate and sanitize pattern
    const { pattern: sanitized, validation } = preparePatternForApi(pattern);
    
    if (!validation.valid) {
      throw new Error(`Pattern validation failed: ${validation.errors.join(', ')}`);
    }
    
    return withRetry(async () => {
      const response = await fetch(`${API_BASE}/patterns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pattern: sanitized }),
      });
      
      const result: ApiResponse<Pattern> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to save pattern');
      }
      
      return result.data;
    });
  },

  /**
   * Update a pattern (user ID comes from session)
   */
  async update(id: number | string, pattern: Partial<Pattern>): Promise<Pattern> {
    // Validate pattern if it's a complete pattern
    if (pattern.id && pattern.timeSignature && pattern.phrase && pattern.drumPattern) {
      const { pattern: sanitized, validation } = preparePatternForApi(pattern as Pattern);
      
      if (!validation.valid) {
        throw new Error(`Pattern validation failed: ${validation.errors.join(', ')}`);
      }
      
      pattern = sanitized;
    }
    
    return withRetry(async () => {
      const response = await fetch(`${API_BASE}/patterns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pattern }),
      });
      
      const result: ApiResponse<Pattern> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update pattern');
      }
      
      return result.data;
    });
  },

  /**
   * Delete a pattern (user ID comes from session)
   */
  async delete(id: number | string): Promise<void> {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE}/patterns/${id}`, {
        method: 'DELETE',
      });
      
      const result: ApiResponse<void> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete pattern');
      }
    });
  },
};

/**
 * Collections API
 */
export interface Collection {
  id: string;
  name: string;
  description?: string;
  patternIds: number[];
  userId?: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export const collectionsApi = {
  /**
   * Get all collections (user ID comes from session)
   */
  async getAll(): Promise<Collection[]> {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE}/collections`);
      const result: ApiResponse<Collection[]> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch collections');
      }
      
      return result.data;
    });
  },

  /**
   * Get a single collection by ID
   */
  async getById(id: string): Promise<Collection> {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE}/collections/${id}`);
      const result: ApiResponse<Collection> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch collection');
      }
      
      return result.data;
    });
  },

  /**
   * Create a collection (user ID comes from session)
   */
  async create(data: {
    name: string;
    description?: string;
    patternIds: number[];
    tags?: string[];
  }): Promise<Collection> {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result: ApiResponse<Collection> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create collection');
      }
      
      return result.data;
    });
  },

  /**
   * Update a collection (user ID comes from session)
   */
  async update(id: string, data: {
    name?: string;
    description?: string;
    patternIds?: number[];
    tags?: string[];
  }): Promise<Collection> {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE}/collections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result: ApiResponse<Collection> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update collection');
      }
      
      return result.data;
    });
  },

  /**
   * Delete a collection (user ID comes from session)
   */
  async delete(id: string): Promise<void> {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE}/collections/${id}`, {
        method: 'DELETE',
      });
      
      const result: ApiResponse<void> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete collection');
      }
    });
  },
};

/**
 * Progress API
 */
export interface PracticeProgress {
  userId: string;
  patternId: number;
  practiceType: 'midi' | 'microphone' | 'recording';
  accuracy: number;
  timing: number;
  attempts: number;
  bestAccuracy: number;
  bestTiming: number;
  lastPracticed: number;
  totalTime: number;
  notes?: Array<{
    noteIndex: number;
    accuracy: number;
    timing: number;
    attempts: number;
  }>;
}

export const progressApi = {
  /**
   * Get user progress (user ID comes from session)
   */
  async get(options?: {
    patternId?: number;
    practiceType?: 'midi' | 'microphone' | 'recording';
  }): Promise<PracticeProgress[]> {
    return withRetry(async () => {
      const params = new URLSearchParams();
      if (options?.patternId) params.set('patternId', String(options.patternId));
      if (options?.practiceType) params.set('practiceType', options.practiceType);
      
      const queryString = params.toString();
      const url = queryString ? `${API_BASE}/progress?${queryString}` : `${API_BASE}/progress`;
      const response = await fetch(url);
      const result: ApiResponse<{ progress: PracticeProgress[] }> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch progress');
      }
      
      return result.data.progress;
    });
  },

  /**
   * Save/update progress (user ID comes from session)
   */
  async save(data: {
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
  }): Promise<PracticeProgress> {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result: ApiResponse<PracticeProgress> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to save progress');
      }
      
      return result.data;
    });
  },
};

