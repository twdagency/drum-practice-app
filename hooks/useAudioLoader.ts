/**
 * Hook to load audio buffers on mount, when playDrumSounds is enabled, or when drum kit changes
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { getAudioContext, loadAllAudioBuffers } from '@/lib/audio/audioLoader';

/**
 * Hook to load audio buffers when component mounts, playDrumSounds is enabled, or drum kit changes
 */
export function useAudioLoader() {
  const setAudioBuffers = useStore((state) => state.setAudioBuffers);
  const setAudioBuffersLoaded = useStore((state) => state.setAudioBuffersLoaded);
  const audioBuffersLoaded = useStore((state) => state.audioBuffersLoaded);
  const playDrumSounds = useStore((state) => state.playDrumSounds);
  const drumKit = useStore((state) => state.drumKit);
  
  // Track the currently loaded kit to detect changes
  const loadedKitRef = useRef<string | null>(null);

  useEffect(() => {
    // Load if not loaded yet, or if drum kit changed
    const kitChanged = loadedKitRef.current !== null && loadedKitRef.current !== drumKit;
    
    if (audioBuffersLoaded && !kitChanged) {
      return;
    }

    // Load buffers on mount or when playDrumSounds is enabled or kit changes
    let isMounted = true;

    async function loadAudio() {
      try {
        // Create or get AudioContext
        const audioContext = getAudioContext();
        
        // Load all audio buffers for the selected kit
        console.log(`[useAudioLoader] Loading kit: ${drumKit}`);
        const buffers = await loadAllAudioBuffers(audioContext, drumKit);
        
        // Only update if component is still mounted
        if (isMounted) {
          setAudioBuffers(buffers);
          setAudioBuffersLoaded(true);
          loadedKitRef.current = drumKit;
          console.log(`[useAudioLoader] Kit "${drumKit}" loaded successfully:`, Object.keys(buffers));
          // Log detailed buffer status
          console.log('[useAudioLoader] Buffer status:', {
            snare: buffers.snare ? `loaded (${buffers.snare.duration.toFixed(2)}s)` : 'null',
            kick: buffers.kick ? `loaded (${buffers.kick.duration.toFixed(2)}s)` : 'null',
            floor: buffers.floor ? `loaded (${buffers.floor.duration.toFixed(2)}s)` : 'null',
            highTom: buffers.highTom ? `loaded (${buffers.highTom.duration.toFixed(2)}s)` : 'null',
            midTom: buffers.midTom ? `loaded (${buffers.midTom.duration.toFixed(2)}s)` : 'null',
            hiHat: buffers.hiHat ? `loaded (${buffers.hiHat.duration.toFixed(2)}s)` : 'null',
            crash: buffers.crash ? `loaded (${buffers.crash.duration.toFixed(2)}s)` : 'null',
            ride: buffers.ride ? `loaded (${buffers.ride.duration.toFixed(2)}s)` : 'null',
          });
        }
      } catch (error) {
        console.error('[useAudioLoader] Failed to load audio buffers:', error);
        if (isMounted) {
          setAudioBuffersLoaded(false);
        }
      }
    }

    loadAudio();

    return () => {
      isMounted = false;
    };
  }, [audioBuffersLoaded, playDrumSounds, drumKit, setAudioBuffers, setAudioBuffersLoaded]);
}
