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
  
  // Polyrhythm settings
  const polyrhythmClickMode = useStore((state) => state.polyrhythmClickMode);
  const polyrhythmDisplayMode = useStore((state) => state.polyrhythmDisplayMode);
  const setPolyrhythmClickMode = useStore((state) => state.setPolyrhythmClickMode);
  const setPolyrhythmDisplayMode = useStore((state) => state.setPolyrhythmDisplayMode);

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

          {/* Polyrhythm Settings */}
          <div style={{ marginBottom: '1.5rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--dpgen-border)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Polyrhythm Settings</h3>
            
            {/* Polyrhythm Display Mode */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.75rem', display: 'block', fontWeight: 600 }}>
                Display Mode
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="polyrhythmDisplayMode"
                    value="stacked"
                    checked={polyrhythmDisplayMode === 'stacked'}
                    onChange={(e) => setPolyrhythmDisplayMode('stacked')}
                  />
                  <span style={{ fontSize: '0.875rem' }}>Stacked (Single Stave)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginLeft: 'auto' }}>Both hands on one stave</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="polyrhythmDisplayMode"
                    value="two-staves"
                    checked={polyrhythmDisplayMode === 'two-staves'}
                    onChange={(e) => setPolyrhythmDisplayMode('two-staves')}
                  />
                  <span style={{ fontSize: '0.875rem' }}>Two Staves</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginLeft: 'auto' }}>Separate stave for each hand</span>
                </label>
              </div>
            </div>

            {/* Polyrhythm Click Mode */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.75rem', display: 'block', fontWeight: 600 }}>
                Polyrhythm Click Mode
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="polyrhythmClickMode"
                    value="both"
                    checked={polyrhythmClickMode === 'both'}
                    onChange={(e) => setPolyrhythmClickMode('both')}
                  />
                  <span style={{ fontSize: '0.875rem' }}>Both Hands</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginLeft: 'auto' }}>Clicks for all notes</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="polyrhythmClickMode"
                    value="right-only"
                    checked={polyrhythmClickMode === 'right-only'}
                    onChange={(e) => setPolyrhythmClickMode('right-only')}
                  />
                  <span style={{ fontSize: '0.875rem' }}>Right Hand Only</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginLeft: 'auto' }}>Clicks only on right hand notes</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="polyrhythmClickMode"
                    value="left-only"
                    checked={polyrhythmClickMode === 'left-only'}
                    onChange={(e) => setPolyrhythmClickMode('left-only')}
                  />
                  <span style={{ fontSize: '0.875rem' }}>Left Hand Only</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginLeft: 'auto' }}>Clicks only on left hand notes</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="polyrhythmClickMode"
                    value="metronome-only"
                    checked={polyrhythmClickMode === 'metronome-only'}
                    onChange={(e) => setPolyrhythmClickMode('metronome-only')}
                  />
                  <span style={{ fontSize: '0.875rem' }}>Metronome Only</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginLeft: 'auto' }}>Metronome on beats 1, 2, 3, 4</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="polyrhythmClickMode"
                    value="none"
                    checked={polyrhythmClickMode === 'none'}
                    onChange={(e) => setPolyrhythmClickMode('none')}
                  />
                  <span style={{ fontSize: '0.875rem' }}>No Sound</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginLeft: 'auto' }}>No clicks at all</span>
                </label>
              </div>
            </div>
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

