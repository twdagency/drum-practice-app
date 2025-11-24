/**
 * API Retry Utilities
 * Provides retry logic with exponential backoff for API calls
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: number[]; // HTTP status codes to retry
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [408, 429, 500, 502, 503, 504], // Timeout, rate limit, server errors
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, retryableErrors: number[]): boolean {
  if (error?.response?.status) {
    return retryableErrors.includes(error.response.status);
  }
  // Network errors are retryable
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return true;
  }
  return false;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        throw error; // Don't retry non-retryable errors
      }

      // Wait before retrying
      await sleep(delay);
      
      // Exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Check API health/connectivity
 */
export async function checkApiHealth(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('/api/patterns', {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return { healthy: true, latency };
    } else {
      return { healthy: false, latency, error: `HTTP ${response.status}` };
    }
  } catch (error: any) {
    const latency = Date.now() - startTime;
    return {
      healthy: false,
      latency,
      error: error.message || 'Connection failed',
    };
  }
}

