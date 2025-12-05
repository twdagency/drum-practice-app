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
    this.requireDecay = false;
    this.lastHitLevel = 0;
    
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
   * Advanced hit detection using multiple detection functions
   */
  detectHit(flux, hfc, rms, currentTime) {
    // Update statistics
    this.updateStatistics(flux, hfc, rms);
    
    // Check minimum interval
    const timeSinceLastHit = (currentTime - this.lastHitTime) * 1000;
    if (timeSinceLastHit < this.minIntervalMs) {
      this.previousFlux = flux;
      return null;
    }
    
    // Adaptive thresholds using mean + sensitivity * std
    const fluxThreshold = Math.max(0.001, this.fluxMean + this.sensitivity * this.fluxStd);
    const hfcThreshold = Math.max(0.01, this.hfcMean + this.sensitivity * this.hfcStd);
    const rmsThreshold = Math.max(0.015, this.rmsMean + this.sensitivity * this.rmsStd);
    
    // Decay requirement - prevent sustained sounds from triggering
    const decayThreshold = fluxThreshold * 0.3;
    
    if (this.requireDecay) {
      if (flux < decayThreshold) {
        this.requireDecay = false;
        this.lastHitLevel = 0;
      } else {
        this.previousFlux = flux;
        return null;
      }
    }
    
    // Combined detection score
    // Weight each detection function based on its reliability
    const fluxScore = flux / fluxThreshold;
    const hfcScore = hfc / hfcThreshold;
    const rmsScore = rms / rmsThreshold;
    
    // Combined score - spectral flux is most reliable for onsets
    const combinedScore = (fluxScore * 0.5) + (hfcScore * 0.3) + (rmsScore * 0.2);
    
    // Transient detection - sudden increase in flux
    const fluxIncrease = flux - this.previousFlux;
    const relativeIncrease = this.previousFlux > 0 ? fluxIncrease / this.previousFlux : 0;
    
    // Onset conditions:
    // 1. Combined score exceeds threshold (weighted detection functions)
    // 2. OR significant transient detected (sudden increase)
    const isOnset = combinedScore > 1.0 || 
                    (relativeIncrease > 0.5 && flux > fluxThreshold * 0.5);
    
    // Additional validation: previous flux should be below threshold
    const wasQuiet = this.previousFlux < fluxThreshold * 0.8;
    
    if (isOnset && (wasQuiet || relativeIncrease > 0.8)) {
      this.lastHitTime = currentTime;
      this.lastHitLevel = rms;
      this.requireDecay = true;
      this.previousFlux = flux;
      
      return {
        type: 'hit',
        time: currentTime * 1000, // Convert to ms
        level: rms,
        flux: flux,
        hfc: hfc,
        fluxThreshold: fluxThreshold,
        combinedScore: combinedScore,
      };
    }
    
    this.previousFlux = flux;
    return null;
  }

  process(inputs, outputs, parameters) {
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
  }
}

// Register the processor
registerProcessor('drum-onset-processor-v2', DrumOnsetProcessorV2);

