/**
 * Playback Settings Modal
 * Configure playback behavior settings - compact design
 */

'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Modal, ModalSection, ModalRow, ModalToggle, ModalSlider, ModalButton } from '../shared/Modal';
import { Play, Repeat, Clock, Gauge } from 'lucide-react';

interface PlaybackSettingsModalProps {
  onClose: () => void;
}

export function PlaybackSettingsModal({ onClose }: PlaybackSettingsModalProps) {
  const countInEnabled = useStore((state) => state.countInEnabled);
  const metronomeOnlyMode = useStore((state) => state.metronomeOnlyMode);
  const silentPracticeMode = useStore((state) => state.silentPracticeMode);
  const slowMotionEnabled = useStore((state) => state.slowMotionEnabled);
  const slowMotionSpeed = useStore((state) => state.slowMotionSpeed);
  const playBackwards = useStore((state) => state.playBackwards);
  const loopCount = useStore((state) => state.loopCount);
  const infiniteLoop = useStore((state) => state.infiniteLoop);
  const loopMeasures = useStore((state) => state.loopMeasures);
  const tempoRamping = useStore((state) => state.tempoRamping);
  const tempoRampStart = useStore((state) => state.tempoRampStart);
  const tempoRampEnd = useStore((state) => state.tempoRampEnd);
  const tempoRampSteps = useStore((state) => state.tempoRampSteps);
  const progressiveMode = useStore((state) => state.progressiveMode);

  const setCountInEnabled = useStore((state) => state.setCountInEnabled);
  const setMetronomeOnlyMode = useStore((state) => state.setMetronomeOnlyMode);
  const setSilentPracticeMode = useStore((state) => state.setSilentPracticeMode);
  const setSlowMotionEnabled = useStore((state) => state.setSlowMotionEnabled);
  const setSlowMotionSpeed = useStore((state) => state.setSlowMotionSpeed);
  const setPlayBackwards = useStore((state) => state.setPlayBackwards);
  const setLoopCount = useStore((state) => state.setLoopCount);
  const setInfiniteLoop = useStore((state) => state.setInfiniteLoop);
  const setLoopMeasures = useStore((state) => state.setLoopMeasures);
  const setTempoRamping = useStore((state) => state.setTempoRamping);
  const setTempoRampStart = useStore((state) => state.setTempoRampStart);
  const setTempoRampEnd = useStore((state) => state.setTempoRampEnd);
  const setTempoRampSteps = useStore((state) => state.setTempoRampSteps);
  const setProgressiveMode = useStore((state) => state.setProgressiveMode);

  const handleLoopMeasuresChange = (field: 'start' | 'end', value: number) => {
    setLoopMeasures(
      loopMeasures
        ? { ...loopMeasures, [field]: value }
        : { start: 1, end: 1 }
    );
  };

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <ModalButton variant="primary" onClick={onClose}>Done</ModalButton>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Playback Settings"
      icon={<Play size={20} strokeWidth={1.5} />}
      size="md"
      footer={footer}
    >
      {/* Basic Settings */}
      <ModalSection title="Basic">
        <ModalRow label="Count-In (4 beats)" description="Play 4 clicks before starting">
          <ModalToggle checked={countInEnabled} onChange={setCountInEnabled} />
        </ModalRow>
        <ModalRow label="Metronome Only" description="Only metronome, no drums">
          <ModalToggle checked={metronomeOnlyMode} onChange={setMetronomeOnlyMode} />
        </ModalRow>
        <ModalRow label="Silent Practice" description="Mute all audio">
          <ModalToggle checked={silentPracticeMode} onChange={setSilentPracticeMode} />
        </ModalRow>
        <ModalRow label="Play Backwards" description="Reverse pattern order">
          <ModalToggle checked={playBackwards} onChange={setPlayBackwards} />
        </ModalRow>
      </ModalSection>

      {/* Loop Settings */}
      <ModalSection title="Looping">
        <ModalRow label="Infinite Loop" description="Loop until stopped">
          <ModalToggle checked={infiniteLoop} onChange={setInfiniteLoop} />
        </ModalRow>
        
        {!infiniteLoop && (
          <ModalRow label="Loop Count">
            <input
              type="number"
              min="1"
              max="100"
              value={loopCount}
              onChange={(e) => setLoopCount(parseInt(e.target.value, 10) || 1)}
              style={{
                width: '70px',
                padding: '0.375rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--dpgen-border)',
                background: 'var(--dpgen-bg)',
                color: 'var(--dpgen-text)',
                fontSize: '0.875rem',
                textAlign: 'center',
              }}
            />
          </ModalRow>
        )}

        <ModalRow label="Loop Measures" description="Loop specific measures only">
          {loopMeasures ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <input
                type="number"
                min="1"
                value={loopMeasures.start}
                onChange={(e) => handleLoopMeasuresChange('start', parseInt(e.target.value, 10) || 1)}
                style={{
                  width: '50px',
                  padding: '0.375rem',
                  borderRadius: '6px',
                  border: '1px solid var(--dpgen-border)',
                  background: 'var(--dpgen-bg)',
                  color: 'var(--dpgen-text)',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--dpgen-muted)' }}>to</span>
              <input
                type="number"
                min="1"
                value={loopMeasures.end}
                onChange={(e) => handleLoopMeasuresChange('end', parseInt(e.target.value, 10) || 1)}
                style={{
                  width: '50px',
                  padding: '0.375rem',
                  borderRadius: '6px',
                  border: '1px solid var(--dpgen-border)',
                  background: 'var(--dpgen-bg)',
                  color: 'var(--dpgen-text)',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                }}
              />
              <button
                onClick={() => setLoopMeasures(null)}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: 'transparent',
                  border: '1px solid var(--dpgen-border)',
                  borderRadius: '4px',
                  color: 'var(--dpgen-muted)',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                }}
              >
                Clear
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoopMeasures({ start: 1, end: 1 })}
              style={{
                padding: '0.375rem 0.75rem',
                background: 'var(--dpgen-bg)',
                border: '1px solid var(--dpgen-border)',
                borderRadius: '6px',
                color: 'var(--dpgen-text)',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              Set Range
            </button>
          )}
        </ModalRow>
      </ModalSection>

      {/* Speed Settings */}
      <ModalSection title="Speed">
        <ModalRow label="Slow Motion">
          <ModalToggle checked={slowMotionEnabled} onChange={setSlowMotionEnabled} />
        </ModalRow>
        
        {slowMotionEnabled && (
          <ModalRow label={`Speed: ${Math.round(slowMotionSpeed * 100)}%`}>
            <ModalSlider
              value={slowMotionSpeed * 100}
              onChange={(v) => setSlowMotionSpeed(v / 100)}
              min={10}
              max={100}
              showValue={false}
            />
          </ModalRow>
        )}

        <ModalRow label="Tempo Ramping" description="Gradually increase tempo">
          <ModalToggle checked={tempoRamping} onChange={setTempoRamping} />
        </ModalRow>

        {tempoRamping && (
          <>
            <ModalRow label={`Start: ${tempoRampStart} BPM`}>
              <ModalSlider
                value={tempoRampStart}
                onChange={setTempoRampStart}
                min={40}
                max={260}
                showValue={false}
              />
            </ModalRow>
            <ModalRow label={`End: ${tempoRampEnd} BPM`}>
              <ModalSlider
                value={tempoRampEnd}
                onChange={setTempoRampEnd}
                min={40}
                max={260}
                showValue={false}
              />
            </ModalRow>
            <ModalRow label={`Steps: ${tempoRampSteps}`}>
              <ModalSlider
                value={tempoRampSteps}
                onChange={setTempoRampSteps}
                min={2}
                max={20}
                showValue={false}
              />
            </ModalRow>
          </>
        )}
      </ModalSection>

      {/* Advanced */}
      <ModalSection title="Advanced">
        <ModalRow label="Progressive Mode" description="Increase difficulty over time">
          <ModalToggle checked={progressiveMode} onChange={setProgressiveMode} />
        </ModalRow>
      </ModalSection>
    </Modal>
  );
}
