/**
 * Audio Settings Modal
 * Configure audio-related playback settings - compact design
 */

'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { ClickSoundType } from '@/types/audio';
import { Modal, ModalSection, ModalRow, ModalToggle, ModalSlider, ModalButton } from '../shared/Modal';
import { Volume2 } from 'lucide-react';

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
  
  // Highlight colors
  const highlightColors = useStore((state) => state.highlightColors);
  const setHighlightColor = useStore((state) => state.setHighlightColor);

  const volumeKeys = ['snare', 'kick', 'hiHat', 'click'] as const;
  const volumeLabels: Record<string, string> = {
    snare: 'Snare',
    kick: 'Kick',
    hiHat: 'Hi-Hat',
    click: 'Click',
  };

  const clickModeOptions = [
    { value: 'beats', label: 'Beats', desc: '1, 2, 3, 4' },
    { value: 'subdivision', label: 'Subdivisions', desc: 'Every note' },
    { value: 'accents', label: 'Accents', desc: 'Accents only' },
    { value: 'none', label: 'None', desc: 'No clicks' },
  ];

  const clickSoundOptions = [
    { value: 'default', label: 'Default' },
    { value: 'woodblock', label: 'Woodblock' },
    { value: 'beep', label: 'Beep' },
    { value: 'tick', label: 'Tick' },
    { value: 'metronome', label: 'Metronome' },
  ];

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <ModalButton variant="primary" onClick={onClose}>Done</ModalButton>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Audio Settings"
      icon={<Volume2 size={20} strokeWidth={1.5} />}
      size="md"
      footer={footer}
    >
      {/* Volume Controls - Compact Grid */}
      <ModalSection title="Volume">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {volumeKeys.map((key) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <span>{volumeLabels[key]}</span>
                <span style={{ color: 'var(--dpgen-muted)' }}>{Math.round(volumes[key] * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volumes[key] * 100}
                onChange={(e) => setVolume(key, parseInt(e.target.value, 10) / 100)}
                style={{ width: '100%' }}
              />
            </div>
          ))}
        </div>
      </ModalSection>

      {/* Click Settings */}
      <ModalSection title="Click">
        <ModalRow label="Sound">
          <select
            value={clickSoundType}
            onChange={(e) => setClickSoundType(e.target.value as ClickSoundType)}
            style={{
              padding: '0.375rem 0.625rem',
              borderRadius: '6px',
              border: '1px solid var(--dpgen-border)',
              background: 'var(--dpgen-bg)',
              color: 'var(--dpgen-text)',
              fontSize: '0.8rem',
            }}
          >
            {clickSoundOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </ModalRow>

        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.5rem' }}>Mode</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.375rem' }}>
            {clickModeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setClickMode(opt.value as any)}
                style={{
                  padding: '0.5rem 0.25rem',
                  borderRadius: '6px',
                  border: clickMode === opt.value ? '2px solid var(--dpgen-primary)' : '1px solid var(--dpgen-border)',
                  background: clickMode === opt.value ? 'var(--dpgen-primary)' : 'var(--dpgen-bg)',
                  color: clickMode === opt.value ? 'white' : 'var(--dpgen-text)',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 500 }}>{opt.label}</div>
              </button>
            ))}
          </div>
        </div>
      </ModalSection>

      {/* Drum Sounds Toggle */}
      <ModalSection>
        <ModalRow label="Play Drum Sounds" description="Enable snare, kick, tom sounds">
          <ModalToggle checked={playDrumSounds} onChange={setPlayDrumSounds} />
        </ModalRow>
      </ModalSection>

      {/* Highlight Colors - Compact */}
      <ModalSection title="Highlight Colors">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { key: 'default', label: 'Both' },
            { key: 'right', label: 'Right' },
            { key: 'left', label: 'Left' },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <input
                type="color"
                value={highlightColors[key as keyof typeof highlightColors]}
                onChange={(e) => setHighlightColor(key as any, e.target.value)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '4px',
                  border: '1px solid var(--dpgen-border)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>{label}</span>
            </div>
          ))}
          <button
            onClick={() => {
              setHighlightColor('default', '#f97316');
              setHighlightColor('right', '#3b82f6');
              setHighlightColor('left', '#10b981');
            }}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.7rem',
              borderRadius: '4px',
              border: '1px solid var(--dpgen-border)',
              background: 'var(--dpgen-bg)',
              color: 'var(--dpgen-muted)',
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            Reset
          </button>
        </div>
      </ModalSection>

      {/* Polyrhythm Settings */}
      <ModalSection title="Polyrhythm">
        <ModalRow label="Display">
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {[
              { value: 'stacked', label: 'Stacked' },
              { value: 'two-staves', label: 'Two Staves' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setPolyrhythmDisplayMode(opt.value as any)}
                style={{
                  padding: '0.375rem 0.625rem',
                  borderRadius: '6px',
                  border: polyrhythmDisplayMode === opt.value ? '2px solid var(--dpgen-primary)' : '1px solid var(--dpgen-border)',
                  background: polyrhythmDisplayMode === opt.value ? 'var(--dpgen-primary)' : 'var(--dpgen-bg)',
                  color: polyrhythmDisplayMode === opt.value ? 'white' : 'var(--dpgen-text)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </ModalRow>

        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.5rem' }}>Click Mode</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.375rem' }}>
            {[
              { value: 'both', label: 'Both' },
              { value: 'right-only', label: 'Right' },
              { value: 'left-only', label: 'Left' },
              { value: 'metronome-only', label: 'Metro' },
              { value: 'none', label: 'None' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setPolyrhythmClickMode(opt.value as any)}
                style={{
                  padding: '0.375rem',
                  borderRadius: '6px',
                  border: polyrhythmClickMode === opt.value ? '2px solid var(--dpgen-primary)' : '1px solid var(--dpgen-border)',
                  background: polyrhythmClickMode === opt.value ? 'var(--dpgen-primary)' : 'var(--dpgen-bg)',
                  color: polyrhythmClickMode === opt.value ? 'white' : 'var(--dpgen-text)',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </ModalSection>
    </Modal>
  );
}
