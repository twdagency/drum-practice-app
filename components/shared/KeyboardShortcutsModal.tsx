/**
 * Keyboard Shortcuts Modal
 * Displays available keyboard shortcuts
 */

'use client';

import React from 'react';
import { Modal } from './Modal';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const shortcuts = [
    { keys: ['Space'], description: 'Play/Pause' },
    { keys: ['Esc'], description: 'Stop playback' },
    { keys: ['Ctrl', 'N'], description: 'Add pattern' },
    { keys: ['Ctrl', 'Shift', 'N'], description: 'Random pattern' },
    { keys: ['Ctrl', 'R'], description: 'Randomize all' },
    { keys: ['?'], description: 'Show shortcuts' },
  ];

  const formatKeys = (keys: string[]) => {
    return keys.map((key, index) => (
      <React.Fragment key={index}>
        {index > 0 && <span style={{ margin: '0 0.125rem', color: 'var(--dpgen-muted)', fontSize: '0.7rem' }}>+</span>}
        <kbd
          style={{
            padding: '0.25rem 0.5rem',
            background: 'var(--dpgen-card)',
            border: '1px solid var(--dpgen-border)',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontFamily: 'monospace',
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          {key}
        </kbd>
      </React.Fragment>
    ));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      icon={<Keyboard size={20} strokeWidth={1.5} />}
      size="sm"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {shortcuts.map((shortcut, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.625rem 0.75rem',
              background: 'var(--dpgen-bg)',
              borderRadius: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {formatKeys(shortcut.keys)}
            </div>
            <span style={{ color: 'var(--dpgen-text)', fontSize: '0.8rem' }}>{shortcut.description}</span>
          </div>
        ))}
      </div>
      <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--dpgen-muted)', textAlign: 'center' }}>
        Shortcuts disabled when typing in input fields
      </p>
    </Modal>
  );
}
