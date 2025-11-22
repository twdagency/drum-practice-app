/**
 * Hook to load audio buffers on mount
 */

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { getAudioContext, loadAllAudioBuffers } from '@/lib/audio/audioLoader';

/**
 * Hook to load audio buffers when component mounts
 */
export function useAudioLoader() {
  const setAudioBuffers = useStore((state) => state.setAudioBuffers);
  const setAudioBuffersLoaded = useStore((state) => state.setAudioBuffersLoaded);
  const audioBuffersLoaded = useStore((state) => state.audioBuffersLoaded);

  useEffect(() => {
    // Skip if already loaded
    if (audioBuffersLoaded) {
      return;
    }

    let isMounted = true;

    async function loadAudio() {
      try {
        // Create or get AudioContext
        const audioContext = getAudioContext();
        
        // Load all audio buffers
        const buffers = await loadAllAudioBuffers(audioContext);
        
        // Only update if component is still mounted
        if (isMounted) {
          setAudioBuffers(buffers);
          setAudioBuffersLoaded(true);
          console.log('Audio buffers loaded successfully:', Object.keys(buffers));
        }
      } catch (error) {
        console.error('Failed to load audio buffers:', error);
        if (isMounted) {
          setAudioBuffersLoaded(false);
        }
      }
    }

    loadAudio();

    return () => {
      isMounted = false;
    };
  }, [audioBuffersLoaded, setAudioBuffers, setAudioBuffersLoaded]);
}
