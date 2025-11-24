/**
 * Keyboard Shortcuts Modal
 * Displays available keyboard shortcuts
 */

'use client';

import React from 'react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Space'], description: 'Play/Pause playback' },
    { keys: ['Esc'], description: 'Stop playback' },
    { keys: ['Ctrl', 'N'], description: 'Add new pattern' },
    { keys: ['Ctrl', 'Shift', 'N'], description: 'Generate random pattern' },
    { keys: ['Ctrl', 'R'], description: 'Randomize all patterns' },
  ];

  const formatKeys = (keys: string[]) => {
    return keys.map((key, index) => (
      <React.Fragment key={index}>
        {index > 0 && <span style={{ margin: '0 0.25rem', color: 'var(--dpgen-muted)' }}>+</span>}
        <kbd
          style={{
            padding: '0.25rem 0.5rem',
            background: 'var(--dpgen-bg)',
            border: '1px solid var(--dpgen-border)',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            fontWeight: 600,
          }}
        >
          {key}
        </kbd>
      </React.Fragment>
    ));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--dpgen-card)',
          borderRadius: 'var(--dpgen-radius)',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          boxShadow: 'var(--dpgen-shadow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dpgen-text)' }}>Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--dpgen-muted)',
              padding: '0.25rem',
            }}
            aria-label="Close"
          >
            <i className="fas fa-times" />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: 'var(--dpgen-bg)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {formatKeys(shortcut.keys)}
              </div>
              <span style={{ color: 'var(--dpgen-text)', fontSize: '0.875rem' }}>{shortcut.description}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--dpgen-muted)', textAlign: 'center' }}>
          Note: Shortcuts are disabled when typing in input fields
        </p>
      </div>
    </div>
  );
}

