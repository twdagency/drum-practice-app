/**
 * Hook for managing microphone/audio input device access
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

export interface MicrophoneDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export function useMicrophoneDevices() {
  const [devices, setDevices] = useState<MicrophoneDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Check if getUserMedia is supported
  useEffect(() => {
    setIsSupported(!!navigator.mediaDevices?.getUserMedia);
  }, []);

  // Request microphone access and list devices
  const requestAccess = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone access is not supported in this browser.');
      return null;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get available audio input devices
      await updateDeviceList();
      
      setError(null);
      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone.';
      setError(errorMessage);
      return null;
    }
  }, []);

  // Update device list
  const updateDeviceList = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = deviceList
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
          groupId: device.groupId,
        }));
      
      setDevices(audioInputs);
    } catch (err) {
      console.error('Failed to enumerate audio devices:', err);
    }
  }, []);

  // Refresh device list
  const refreshDevices = useCallback(async () => {
    await updateDeviceList();
  }, [updateDeviceList]);

  // Initial device enumeration
  useEffect(() => {
    if (isSupported) {
      updateDeviceList();
    }
  }, [isSupported, updateDeviceList]);

  return {
    devices,
    error,
    isSupported,
    requestAccess,
    refreshDevices,
  };
}

