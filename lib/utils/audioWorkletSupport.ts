/**
 * Utility functions for AudioWorklet browser support detection
 */

/**
 * Check if AudioWorklet is supported in the current browser
 */
export function isAudioWorkletSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return 'audioWorklet' in audioContext;
  } catch (error) {
    return false;
  }
}

/**
 * Get detailed AudioWorklet support information
 */
export function getAudioWorkletSupportInfo() {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      isFirefoxAndroid: false,
      needsFallback: true,
      reason: 'Server-side rendering',
    };
  }
  
  const userAgent = navigator.userAgent;
  const isFirefoxAndroid = /Firefox\/\d+\.\d+.*Mobile/.test(userAgent);
  const supported = isAudioWorkletSupported();
  
  return {
    supported,
    isFirefoxAndroid,
    needsFallback: isFirefoxAndroid || !supported,
    reason: isFirefoxAndroid 
      ? 'Firefox Android does not support AudioWorklet'
      : !supported
      ? 'Browser does not support AudioWorklet'
      : 'Supported',
  };
}

