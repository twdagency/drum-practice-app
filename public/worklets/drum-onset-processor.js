/**
 * AudioWorklet processor for real-time drum hit detection
 * Processes audio buffers and detects percussive onsets
 */

class DrumOnsetProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    // Parameters
    this.sensitivity = options.processorOptions?.sensitivity || 1.5;
    this.minIntervalMs = options.processorOptions?.minIntervalMs || 40;
    
    // Running statistics for adaptive thresholding
    this.rmsHistory = [];
    this.maxHistorySize = 100; // Keep last 100 RMS values
    this.mean = 0;
    this.std = 0;
    
    // Hit detection state
    this.lastHitTime = 0;
    this.previousRms = 0;
    this.lastHitRms = 0; // Track RMS at last hit to detect decay
    this.requireDecay = false; // Require RMS to drop after a hit before detecting next
    
    // Port for communication with main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'update-parameters') {
        this.sensitivity = event.data.sensitivity || this.sensitivity;
        this.minIntervalMs = event.data.minIntervalMs || this.minIntervalMs;
      }
    };
  }

  /**
   * Calculate RMS (Root Mean Square) from audio samples
   */
  calculateRMS(inputs) {
    if (!inputs || !inputs[0] || !inputs[0][0]) {
      return 0;
    }
    
    const channelData = inputs[0][0]; // Use first channel
    let sum = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    
    return Math.sqrt(sum / channelData.length);
  }

  /**
   * Update running statistics (mean and standard deviation)
   */
  updateStatistics(rms) {
    // Add to history
    this.rmsHistory.push(rms);
    
    // Keep history size manageable
    if (this.rmsHistory.length > this.maxHistorySize) {
      this.rmsHistory.shift();
    }
    
    // Calculate mean
    const sum = this.rmsHistory.reduce((a, b) => a + b, 0);
    this.mean = sum / this.rmsHistory.length;
    
    // Calculate standard deviation
    const variance = this.rmsHistory.reduce((sum, val) => {
      return sum + Math.pow(val - this.mean, 2);
    }, 0) / this.rmsHistory.length;
    this.std = Math.sqrt(variance);
  }

  /**
   * Detect if a hit occurred based on RMS and threshold
   * Only detects distinct percussive attacks, not continuous sound
   */
  detectHit(rms, currentTime) {
    // Update statistics
    this.updateStatistics(rms);
    
    // Calculate dynamic threshold: mean + (sensitivity * std)
    // Add minimum threshold to prevent false positives from very quiet background noise
    const minThreshold = 0.015; // Increased minimum RMS threshold (1.5% of full scale)
    const dynamicThreshold = this.mean + (this.sensitivity * this.std);
    const threshold = Math.max(minThreshold, dynamicThreshold);
    
    // Check minimum interval between hits
    const timeSinceLastHit = (currentTime - this.lastHitTime) * 1000; // Convert to ms
    if (timeSinceLastHit < this.minIntervalMs) {
      this.previousRms = rms;
      return null;
    }
    
    // Require minimum RMS level to avoid detecting very quiet noise
    if (rms < minThreshold) {
      this.previousRms = rms;
      // Reset decay requirement if RMS drops very low
      if (rms < minThreshold * 0.5) {
        this.requireDecay = false;
        this.lastHitRms = 0;
      }
      return null;
    }
    
    // CRITICAL: Require RMS to drop significantly below threshold before detecting a new hit
    // This prevents continuous sound (like humming) from triggering multiple hits
    // After a hit, RMS must drop to at least 50% of threshold (was 70%) before a new hit can be detected
    // This ensures we only detect distinct percussive attacks, not sustained sound
    const decayThreshold = threshold * 0.5;
    
    if (this.requireDecay) {
      // We're waiting for RMS to decay after the last hit
      if (rms < decayThreshold) {
        // RMS has dropped below decay threshold, allow new hit detection
        this.requireDecay = false;
        this.lastHitRms = 0;
      } else {
        // Still above decay threshold, ignore (continuous sound)
        this.previousRms = rms;
        return null;
      }
    }
    
    // Additional check: If RMS has been consistently high (above threshold) for a while,
    // it's likely continuous sound, not a percussive attack
    // Check if RMS has been above threshold for multiple consecutive samples
    if (this.previousRms >= threshold && rms >= threshold) {
      // RMS has been above threshold for consecutive samples - likely continuous sound
      // Only allow a hit if there's a very significant increase (new attack on top of sustained sound)
      const relativeIncrease = this.previousRms > 0 ? (rms - this.previousRms) / this.previousRms : 0;
      
      // Require a very large increase (100%+) to detect a new attack on sustained sound
      if (relativeIncrease < 1.0) {
        this.previousRms = rms;
        return null; // Continuous sound, not a new attack
      }
    }
    
    // Detect onset: previous RMS was below threshold, current RMS is above
    // This is the key - we only detect when crossing FROM BELOW
    // Also require that previous RMS was below decay threshold to ensure we had a proper decay
    const wasBelowDecay = this.previousRms < decayThreshold;
    const crossedThreshold = wasBelowDecay && this.previousRms < threshold && rms >= threshold;
    
    // Also detect significant volume increase (transient detection)
    // But require a much larger increase to distinguish from continuous sound fluctuations
    const volumeIncrease = rms - this.previousRms;
    const relativeIncrease = this.previousRms > 0 ? volumeIncrease / this.previousRms : 0;
    
    // Require a very clear transient:
    // - At least 50% relative increase
    // - AND RMS must be significantly above threshold (80%)
    // - AND previous RMS must have been below decay threshold (ensures proper decay occurred)
    const hasTransient = relativeIncrease > 0.5 && 
                         rms > threshold * 0.8 && 
                         wasBelowDecay;
    
    // Only register hit if:
    // 1. RMS crossed threshold from below (clear attack), OR
    // 2. There's a very clear transient (50%+ increase) from below threshold
    // AND the absolute RMS is above minimum threshold
    if ((crossedThreshold || hasTransient) && rms >= minThreshold) {
      // Update last hit time and RMS
      this.lastHitTime = currentTime;
      this.lastHitRms = rms;
      this.requireDecay = true; // Require decay before next hit
      
      // Return hit data
      return {
        type: 'hit',
        time: currentTime * 1000, // Convert to milliseconds
        level: rms,
        mean: this.mean,
        std: this.std,
        threshold: threshold,
      };
    }
    
    // Update previous RMS for next iteration
    this.previousRms = rms;
    
    return null;
  }

  process(inputs, outputs, parameters) {
    // Get current time in seconds
    const currentTime = currentFrame / sampleRate;
    
    // Calculate RMS from input
    const rms = this.calculateRMS(inputs);
    
    // Detect hit
    const hit = this.detectHit(rms, currentTime);
    
    // Send hit to main thread if detected
    if (hit) {
      this.port.postMessage(hit);
    }
    
    // Return true to keep processor alive
    return true;
  }
}

// Register the processor
registerProcessor('drum-onset-processor', DrumOnsetProcessor);

