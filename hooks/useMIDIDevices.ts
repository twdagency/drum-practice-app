/**
 * Hook for managing MIDI device access and listing
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
}

export function useMIDIDevices() {
  const [devices, setDevices] = useState<MIDIDevice[]>([]);
  const [access, setAccess] = useState<MIDIAccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Check if MIDI is supported
  useEffect(() => {
    setIsSupported(!!navigator.requestMIDIAccess);
  }, []);

  // Request MIDI access and list devices
  const requestAccess = useCallback(async () => {
    if (!navigator.requestMIDIAccess) {
      setError('MIDI is not supported in this browser.');
      return null;
    }

    try {
      const midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      setAccess(midiAccess);
      setError(null);
      
      // List initial devices
      updateDeviceList(midiAccess);
      
      // Listen for device changes
      midiAccess.addEventListener('statechange', () => {
        updateDeviceList(midiAccess);
      });
      
      return midiAccess;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access MIDI devices.';
      setError(errorMessage);
      console.error('Failed to access MIDI:', err);
      return null;
    }
  }, []);

  // Update device list
  const updateDeviceList = useCallback((midiAccess: MIDIAccess) => {
    const deviceList: MIDIDevice[] = [];
    
    midiAccess.inputs.forEach((input, id) => {
      deviceList.push({
        id,
        name: input.name || 'Unnamed Device',
        manufacturer: input.manufacturer || '',
        state: input.state === 'open' ? 'connected' : 'disconnected',
      });
    });
    
    setDevices(deviceList);
  }, []);

  // Refresh device list
  const refreshDevices = useCallback(() => {
    if (access) {
      updateDeviceList(access);
    } else {
      requestAccess();
    }
  }, [access, requestAccess, updateDeviceList]);

  // Initialize on mount
  useEffect(() => {
    if (isSupported) {
      requestAccess();
    }
  }, [isSupported, requestAccess]);

  return {
    devices,
    access,
    error,
    isSupported,
    requestAccess,
    refreshDevices,
  };
}

