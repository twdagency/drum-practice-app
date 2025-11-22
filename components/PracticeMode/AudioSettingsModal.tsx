/**
 * Audio Settings Modal
 * Configure audio-related playback settings
 */

'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { ClickSoundType } from '@/types/audio';

interface AudioSettingsModalProps {
  onClose: () => void;
}

export function AudioSettingsModal({ onClose }: AudioSettingsModalProps) {
  const playDrumSounds = useStore((state) => state.playDrumSounds);
  const volumes = useStore((state) => state.volumes);
  const clickSoundType = useStore((state) => state.clickSoundType);
  const clickMode = useStore((state) => state.clickMode);

  const setPlayDrumSounds = useStore((state) => state.setPlayDrumSounds);
  const setVolume = useStore((state) => state.setVolume);
  const setClickSoundType = useStore((state) => state.setClickSoundType);
  const setClickMode = useStore((state) => state.setClickMode);

  const handleVolumeChange = (key: keyof typeof volumes, value: number) => {
    setVolume(key, value / 100);
  };

  return (
    <div
      className="dpgen-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        className="dpgen-modal"
        style={{
          background: 'var(--dpgen-card)',
          borderRadius: 'var(--dpgen-radius)',
          padding: '0',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 'var(--dpgen-shadow)',
          border: '1px solid var(--dpgen-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dpgen-modal__header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--dpgen-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="dpgen-modal__title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Audio Settings</h2>
          <button
            type="button"
            className="dpgen-modal__close"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--dpgen-text)' }}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="dpgen-modal__body" style={{ padding: '1.5rem' }}>
          {/* Volumes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.75rem', display: 'block', fontWeight: 600 }}>
              Volume Levels
            </label>
            
            {(['snare', 'kick', 'hiHat', 'click'] as const).map((key) => (
              <div key={key} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>{key === 'hiHat' ? 'Hi-Hat' : key}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)' }}>
                    {Math.round(volumes[key] * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volumes[key] * 100}
                  onChange={(e) => handleVolumeChange(key, parseInt(e.target.value, 10))}
                  style={{ width: '100%' }}
                />
              </div>
            ))}
          </div>

          {/* Click Sound Type */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>
              Click Sound Type
            </label>
            <select
              value={clickSoundType}
              onChange={(e) => setClickSoundType(e.target.value as ClickSoundType)}
              className="dpgen-select"
              style={{ width: '100%' }}
            >
              <option value="default">Default</option>
              <option value="woodblock">Woodblock</option>
              <option value="beep">Beep</option>
              <option value="tick">Tick</option>
              <option value="metronome">Metronome</option>
            </select>
          </div>

          {/* Click Mode - Mutually Exclusive */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.75rem', display: 'block', fontWeight: 600 }}>
              Click Mode
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="clickMode"
                  value="beats"
                  checked={clickMode === 'beats'}
                  onChange={(e) => setClickMode('beats')}
                />
                <span style={{ fontSize: '0.875rem' }}>Beats 1, 2, 3, 4</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginLeft: 'auto' }}>Click on beats only</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="clickMode"
                  value="subdivision"
                  checked={clickMode === 'subdivision'}
                  onChange={(e) => setClickMode('subdivision')}
                />
                <span style={{ fontSize: '0.875rem' }}>Subdivision Clicks</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginLeft: 'auto' }}>Click on every note (except rests)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="clickMode"
                  value="accents"
                  checked={clickMode === 'accents'}
                  onChange={(e) => setClickMode('accents')}
                />
                <span style={{ fontSize: '0.875rem' }}>Accent Beat</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginLeft: 'auto' }}>Click on accents only</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="clickMode"
                  value="none"
                  checked={clickMode === 'none'}
                  onChange={(e) => setClickMode('none')}
                />
                <span style={{ fontSize: '0.875rem' }}>None</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginLeft: 'auto' }}>No clicks</span>
              </label>
            </div>
          </div>

          {/* Play Drum Sounds */}
          <div style={{ marginBottom: '1.5rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--dpgen-border)' }}>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <span style={{ flex: 1 }}>Play Drum Sounds</span>
              <input
                type="checkbox"
                checked={playDrumSounds}
                onChange={(e) => setPlayDrumSounds(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
              Enable drum sound playback (snare, kick, tom, floor)
            </p>
          </div>
        </div>

        <div className="dpgen-modal__footer" style={{ padding: '1.5rem', borderTop: '1px solid var(--dpgen-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="dpgen-button dpgen-button--primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

