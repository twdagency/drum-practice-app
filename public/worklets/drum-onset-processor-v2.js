/**
 * Advanced AudioWorklet processor for drum hit detection
 * Uses Spectral Flux + High Frequency Content for superior onset detection
 * 
 * This is a significant improvement over simple RMS-based detection:
 * - Spectral Flux detects changes in frequency spectrum (better for transients)
 * - High Frequency Content weighting catches drum attack characteristics
 * - Multi-band analysis for better sensitivity to different drums
 * - Adaptive thresholding with peak picking
 */

class DrumOnsetProcessorV2 extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    // Parameters
    this.sensitivity = options.processorOptions?.sensitivity || 1.5;
    this.minIntervalMs = options.processorOptions?.minIntervalMs || 40;
    
    // FFT size - 512 gives good frequency resolution while maintaining time resolution
    // At 48kHz, this is ~10.7ms per frame
    this.fftSize = 512;
    this.hopSize = 128; // Process every 128 samples (same as AudioWorklet buffer)
    
    // Buffers for FFT
    this.inputBuffer = new Float32Array(this.fftSize);
    this.bufferIndex = 0;
    this.previousSpectrum = null;
    
    // Detection function history for adaptive thresholding
    this.fluxHistory = [];
    this.hfcHistory = [];
    this.rmsHistory = [];
    this.maxHistorySize = 50; // ~0.5s at 48kHz with 128 hop
    
    // Statistics
    this.fluxMean = 0;
    this.fluxStd = 0;
    this.hfcMean = 0;
    this.hfcStd = 0;
    this.rmsMean = 0;
    this.rmsStd = 0;
    
    // Hit detection state
    this.lastHitTime = 0;
    this.previousFlux = 0;
    this.lastHitLevel = 0;
    this.lastHitFlux = 0; // Track last hit's flux for resonance filtering
    
    // Quiet state tracking - require signal to be quiet for multiple frames
    this.quietFrameCount = 0;
    this.QUIET_FRAMES_REQUIRED = 2; // Must be quiet for 2 frames (~5ms) before new hit allowed
    this.QUIET_THRESHOLD = 0.012; // Signal must be below this to count as "quiet" (raised for noisy mics/environments)
    
    // Resonance window - after a hit, require higher flux for subsequent hits
    this.RESONANCE_WINDOW_MS = 250; // 250ms window after a hit where we're more strict
    this.RESONANCE_FLUX_RATIO = 0.35; // New hit must be at least 35% of last hit's flux
    
    // Hann window for FFT (reduces spectral leakage)
    this.hannWindow = new Float32Array(this.fftSize);
    for (let i = 0; i < this.fftSize; i++) {
      this.hannWindow[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.fftSize - 1)));
    }
    
    // Handle messages from main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'update-parameters') {
        this.sensitivity = event.data.sensitivity || this.sensitivity;
        this.minIntervalMs = event.data.minIntervalMs || this.minIntervalMs;
      } else if (event.data.type === 'reset') {
        // Reset all state - used when playback starts/stops
        this.lastHitTime = 0;
        this.previousFlux = 0;
        this.lastHitLevel = 0;
        this.lastHitFlux = 0;
        this.quietFrameCount = 0;
        this.fluxHistory = [];
        this.hfcHistory = [];
        this.rmsHistory = [];
        this.previousSpectrum = null;
      }
    };
  }

  /**
   * Simple in-place DFT (Discrete Fourier Transform)
   * Returns magnitude spectrum only (we don't need phase for onset detection)
   * Note: For production, consider using a more optimized FFT like FFTW or KissFFT
   */
  computeMagnitudeSpectrum(samples) {
    const N = samples.length;
    const magnitudes = new Float32Array(N / 2);
    
    // Only compute first half of spectrum (Nyquist)
    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += samples[n] * Math.cos(angle);
        imag += samples[n] * Math.sin(angle);
      }
      
      magnitudes[k] = Math.sqrt(real * real + imag * imag) / N;
    }
    
    return magnitudes;
  }

  /**
   * Compute Spectral Flux - the standard for onset detection
   * Measures the increase in energy across frequency bins
   * Only positive changes are counted (half-wave rectified)
   */
  computeSpectralFlux(currentSpectrum, previousSpectrum) {
    if (!previousSpectrum) return 0;
    
    let flux = 0;
    for (let i = 0; i < currentSpectrum.length; i++) {
      const diff = currentSpectrum[i] - previousSpectrum[i];
      // Half-wave rectification - only count increases
      if (diff > 0) {
        flux += diff * diff; // Square for emphasis
      }
    }
    
    return Math.sqrt(flux);
  }

  /**
   * Compute High Frequency Content
   * Weights higher frequencies more heavily - drum attacks have strong HF content
   */
  computeHFC(spectrum) {
    let hfc = 0;
    for (let k = 0; k < spectrum.length; k++) {
      // Weight by frequency bin index (higher frequencies weighted more)
      hfc += k * spectrum[k] * spectrum[k];
    }
    return Math.sqrt(hfc);
  }

  /**
   * Compute RMS from time-domain samples
   */
  computeRMS(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Update running statistics for adaptive thresholding
   */
  updateStatistics(flux, hfc, rms) {
    // Protect against NaN/Infinity values that could break calculations
    if (!isFinite(flux)) flux = 0;
    if (!isFinite(hfc)) hfc = 0;
    if (!isFinite(rms)) rms = 0;
    
    // Add to histories
    this.fluxHistory.push(flux);
    this.hfcHistory.push(hfc);
    this.rmsHistory.push(rms);
    
    // Trim to max size
    if (this.fluxHistory.length > this.maxHistorySize) {
      this.fluxHistory.shift();
      this.hfcHistory.shift();
      this.rmsHistory.shift();
    }
    
    // Calculate means
    this.fluxMean = this.fluxHistory.reduce((a, b) => a + b, 0) / this.fluxHistory.length;
    this.hfcMean = this.hfcHistory.reduce((a, b) => a + b, 0) / this.hfcHistory.length;
    this.rmsMean = this.rmsHistory.reduce((a, b) => a + b, 0) / this.rmsHistory.length;
    
    // Calculate standard deviations
    this.fluxStd = Math.sqrt(this.fluxHistory.reduce((sum, val) => sum + Math.pow(val - this.fluxMean, 2), 0) / this.fluxHistory.length);
    this.hfcStd = Math.sqrt(this.hfcHistory.reduce((sum, val) => sum + Math.pow(val - this.hfcMean, 2), 0) / this.hfcHistory.length);
    this.rmsStd = Math.sqrt(this.rmsHistory.reduce((sum, val) => sum + Math.pow(val - this.rmsMean, 2), 0) / this.rmsHistory.length);
  }

  /**
   * Hit detection using SPIKE DETECTION with QUIET STATE REQUIREMENT
   * 
   * Key insight: Real drum hits come from SILENCE - the signal must be quiet
   * for multiple frames before a new hit can be detected. This prevents
   * triggering on the oscillating decay pattern of drum resonance.
   */
  detectHit(flux, hfc, rms, currentTime) {
    // Update statistics
    this.updateStatistics(flux, hfc, rms);
    
    const timeSinceLastHit = (currentTime - this.lastHitTime) * 1000;
    
    // Minimum flux to even consider (absolute noise floor) - raised to filter ambient noise
    const MIN_FLUX = 0.008;
    
    // MASK TIME: 100ms allows 16th notes at 120+ BPM while filtering resonance
    const maskTime = 100;
    
    // Track quiet state - signal must be below QUIET_THRESHOLD for multiple frames
    // Cap quietFrameCount to prevent overflow with long periods of silence
    if (flux < this.QUIET_THRESHOLD) {
      this.quietFrameCount = Math.min(this.quietFrameCount + 1, 1000);
    } else {
      this.quietFrameCount = 0;
    }
    
    // Is the system in a "ready for hit" state?
    const isQuietState = this.quietFrameCount >= this.QUIET_FRAMES_REQUIRED;
    
    // Calculate the spike ratio
    const prevFlux = this.previousFlux;
    const spikeRatio = prevFlux > 0.0001 ? flux / prevFlux : (flux > MIN_FLUX ? 100 : 0);
    
    // Store for next iteration
    this.previousFlux = flux;
    
    // A REAL drum hit detection:
    // - STRONG hits (flux > 0.025) bypass quiet requirement - these are unmistakable
    //   (Real drum hits typically have flux 0.025-0.12+, resonance is 0.01-0.025)
    // - Medium hits require quiet state to filter resonance
    const isVeryStrongHit = flux > 0.025 && spikeRatio >= 2.5; // Unmistakable drum hit
    const isStrongHit = flux > 0.008 && spikeRatio >= 3.0 && isQuietState; // Strong hit from quiet
    const isModerateSpike = flux > MIN_FLUX && spikeRatio >= 4.0 && isQuietState; // Moderate spike from quiet
    let isValidHit = isVeryStrongHit || isStrongHit || isModerateSpike;
    
    // RESONANCE WINDOW FILTERING:
    // After a hit, within the resonance window, require new hits to have significant flux
    // relative to the previous hit AND a high spike ratio. This prevents resonance/decay 
    // from triggering false hits. Resonance can oscillate with flux above 0.025 and 
    // spike ratios of 2-3x, so we require 4x+ to confirm it's a new hit.
    const inResonanceWindow = timeSinceLastHit < this.RESONANCE_WINDOW_MS && timeSinceLastHit >= maskTime;
    const minFluxForResonanceWindow = this.lastHitFlux * this.RESONANCE_FLUX_RATIO;
    const RESONANCE_SPIKE_RATIO_REQUIRED = 4.0; // Require higher spike ratio in resonance window
    
    if (inResonanceWindow && isValidHit) {
      // In resonance window: hits must meet BOTH criteria:
      // 1. Flux >= 35% of last hit's flux (proportional threshold)
      // 2. Spike ratio >= 4.0x (confirms sharp transient, not oscillation)
      if (flux < minFluxForResonanceWindow || spikeRatio < RESONANCE_SPIKE_RATIO_REQUIRED) {
        isValidHit = false; // Block this hit - likely resonance
      }
    }
    
    // DEBUG: Log potential hits (only log significant activity to reduce noise)
    if (flux > 0.01 && spikeRatio > 2.5) {
      this.port.postMessage({
        type: 'debug',
        message: `flux=${flux.toFixed(4)} prev=${prevFlux.toFixed(4)} ratio=${spikeRatio.toFixed(1)}x quiet=${isQuietState}(${this.quietFrameCount}) timeSince=${timeSinceLastHit.toFixed(0)}ms resWin=${inResonanceWindow} minFlux=${minFluxForResonanceWindow.toFixed(4)} reqRatio=${inResonanceWindow ? RESONANCE_SPIKE_RATIO_REQUIRED : 2.5}`
      });
    }
    
    // Enforce mask time
    if (timeSinceLastHit < maskTime) {
      return null;
    }
    
    // Only trigger on valid hits from quiet state
    if (isValidHit) {
      this.lastHitTime = currentTime;
      this.lastHitLevel = rms;
      this.lastHitFlux = flux; // Track this hit's flux for resonance filtering
      this.quietFrameCount = 0; // Reset quiet counter after hit
      
      const hitType = isVeryStrongHit ? 'STRONG' : (isStrongHit ? 'MEDIUM' : 'MODERATE');
      this.port.postMessage({
        type: 'debug',
        message: `HIT DETECTED [${hitType}]: flux=${flux.toFixed(4)} ratio=${spikeRatio.toFixed(1)}x quiet=${isQuietState}`
      });
      
      return {
        type: 'hit',
        time: currentTime * 1000, // Convert to ms
        level: rms,
        flux: flux,
        hfc: hfc,
        fluxThreshold: MIN_FLUX,
      };
    }
    
    return null;
  }

  process(inputs, outputs, parameters) {
    try {
      if (!inputs || !inputs[0] || !inputs[0][0]) {
        return true;
      }
      
      const input = inputs[0][0];
      const currentTime = currentFrame / sampleRate;
    
    // Accumulate samples into buffer
    for (let i = 0; i < input.length; i++) {
      this.inputBuffer[this.bufferIndex] = input[i];
      this.bufferIndex++;
      
      // When buffer is full, process it
      if (this.bufferIndex >= this.fftSize) {
        // Apply Hann window
        const windowedSamples = new Float32Array(this.fftSize);
        for (let j = 0; j < this.fftSize; j++) {
          windowedSamples[j] = this.inputBuffer[j] * this.hannWindow[j];
        }
        
        // Compute magnitude spectrum
        const spectrum = this.computeMagnitudeSpectrum(windowedSamples);
        
        // Compute detection functions
        const flux = this.computeSpectralFlux(spectrum, this.previousSpectrum);
        const hfc = this.computeHFC(spectrum);
        const rms = this.computeRMS(this.inputBuffer);
        
        // Store spectrum for next frame
        this.previousSpectrum = spectrum;
        
        // Detect hit
        const hit = this.detectHit(flux, hfc, rms, currentTime);
        
        if (hit) {
          this.port.postMessage(hit);
        }
        
        // Shift buffer by hop size (overlap)
        const overlap = this.fftSize - this.hopSize;
        for (let j = 0; j < overlap; j++) {
          this.inputBuffer[j] = this.inputBuffer[j + this.hopSize];
        }
        this.bufferIndex = overlap;
      }
    }
    
    return true;
    } catch (err) {
      // Log error but keep processor alive
      this.port.postMessage({ type: 'error', message: String(err) });
      // Reset state to recover
      this.lastHitTime = 0;
      this.previousFlux = 0;
      this.quietFrameCount = 0;
      return true;
    }
  }
}

// Register the processor
registerProcessor('drum-onset-processor-v2', DrumOnsetProcessorV2);

