/**
 * General Settings Modal
 * User preferences and account settings
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ModalSection, ModalRow, ModalToggle, ModalButton } from '../shared/Modal';
import { Settings, User, Bell, Eye } from 'lucide-react';

interface GeneralSettingsModalProps {
  onClose: () => void;
}

export function GeneralSettingsModal({ onClose }: GeneralSettingsModalProps) {
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hideWelcome = localStorage.getItem('hideWelcomeScreen');
      setShowWelcomeScreen(!hideWelcome);
      setLoaded(true);
    }
  }, []);

  // Save settings to localStorage
  const handleWelcomeScreenToggle = (enabled: boolean) => {
    setShowWelcomeScreen(enabled);
    if (typeof window !== 'undefined') {
      if (enabled) {
        localStorage.removeItem('hideWelcomeScreen');
        // Also clear the "last shown" so it shows next time
        localStorage.removeItem('welcomeLastShown');
      } else {
        localStorage.setItem('hideWelcomeScreen', 'true');
      }
    }
  };

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <ModalButton variant="primary" onClick={onClose}>Done</ModalButton>
    </div>
  );

  if (!loaded) {
    return null;
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="General Settings"
      icon={<Settings size={20} />}
      size="md"
      footer={footer}
    >
      <ModalSection title="Welcome Screen" icon={<User size={16} />}>
        <ModalRow label="Show welcome screen on login">
          <ModalToggle
            checked={showWelcomeScreen}
            onChange={handleWelcomeScreenToggle}
          />
        </ModalRow>
        <p style={{ 
          fontSize: '0.75rem', 
          color: 'var(--dpgen-muted)', 
          marginTop: '0.5rem',
          lineHeight: 1.4 
        }}>
          The welcome screen shows when you log in and helps you quickly start 
          creating patterns, browsing presets, or continuing your learning path.
        </p>
      </ModalSection>

      {/* Add more general settings sections here as needed */}
    </Modal>
  );
}

