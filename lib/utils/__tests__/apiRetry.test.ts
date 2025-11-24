/**
 * Unit tests for API retry utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { withRetry, checkApiHealth } from '../apiRetry';

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should return result on first successful attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ response: { status: 500 } }) // First attempt fails
      .mockRejectedValueOnce({ response: { status: 500 } }) // Second attempt fails
      .mockResolvedValue('success'); // Third attempt succeeds
    
    const promise = withRetry(fn, { maxRetries: 3, initialDelay: 100 });
    
    // Fast-forward through delays
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    
    const result = await promise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue({ response: { status: 400 } }); // 400 is not retryable
    
    await expect(withRetry(fn)).rejects.toEqual({ response: { status: 400 } });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValue('success');
    
    const promise = withRetry(fn, { 
      maxRetries: 3, 
      initialDelay: 100, 
      backoffMultiplier: 2 
    });
    
    // First retry after 100ms
    await vi.advanceTimersByTimeAsync(100);
    // Second retry after 200ms (100 * 2)
    await vi.advanceTimersByTimeAsync(200);
    
    await promise;
    
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect maxDelay', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValue('success');
    
    const promise = withRetry(fn, { 
      maxRetries: 1, 
      initialDelay: 1000, 
      maxDelay: 500,
      backoffMultiplier: 10 
    });
    
    // Should only wait maxDelay (500ms), not 10000ms
    await vi.advanceTimersByTimeAsync(500);
    
    await promise;
    
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry network errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ message: 'fetch failed' })
      .mockResolvedValue('success');
    
    const promise = withRetry(fn, { initialDelay: 100 });
    
    await vi.advanceTimersByTimeAsync(100);
    
    const result = await promise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    const error = { response: { status: 500 } };
    const fn = vi.fn().mockRejectedValue(error);
    
    const promise = withRetry(fn, { maxRetries: 2, initialDelay: 100 });
    
    // Fast-forward through all retries
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(400);
    
    await expect(promise).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should use custom retryable errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValue('success');
    
    const promise = withRetry(fn, { 
      retryableErrors: [401, 403], // Custom retryable errors
      initialDelay: 100 
    });
    
    await vi.advanceTimersByTimeAsync(100);
    
    const result = await promise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('checkApiHealth', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should return healthy when API responds successfully', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
    });
    
    const result = await checkApiHealth();
    
    expect(result.healthy).toBe(true);
    expect(result.latency).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeUndefined();
  });

  it('should return unhealthy when API responds with error', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    });
    
    const result = await checkApiHealth();
    
    expect(result.healthy).toBe(false);
    expect(result.error).toBe('HTTP 500');
  });

  it('should return unhealthy when fetch fails', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    
    const result = await checkApiHealth();
    
    expect(result.healthy).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should measure latency', async () => {
    (global.fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
    );
    
    const startTime = Date.now();
    const result = await checkApiHealth();
    const endTime = Date.now();
    
    expect(result.latency).toBeGreaterThanOrEqual(0);
    expect(result.latency).toBeLessThanOrEqual(endTime - startTime);
  });
});

