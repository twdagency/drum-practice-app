/**
 * Playback Settings Modal
 * Configure playback behavior settings
 */

'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

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

  const handleClearLoopMeasures = () => {
    setLoopMeasures(null);
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
          <h2 className="dpgen-modal__title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Playback Settings</h2>
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
          {/* Count-In */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <span style={{ flex: 1 }}>Count-In</span>
              <input
                type="checkbox"
                checked={countInEnabled}
                onChange={(e) => setCountInEnabled(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
              Play 4 beats before starting playback
            </p>
          </div>

          {/* Metronome Only Mode */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <span style={{ flex: 1 }}>Metronome Only Mode</span>
              <input
                type="checkbox"
                checked={metronomeOnlyMode}
                onChange={(e) => setMetronomeOnlyMode(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
              Play only metronome clicks, no drum sounds
            </p>
          </div>

          {/* Silent Practice Mode */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <span style={{ flex: 1 }}>Silent Practice Mode</span>
              <input
                type="checkbox"
                checked={silentPracticeMode}
                onChange={(e) => setSilentPracticeMode(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
              Mute all audio for silent practice
            </p>
          </div>

          {/* Slow Motion */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
              <span style={{ flex: 1 }}>Slow Motion</span>
              <input
                type="checkbox"
                checked={slowMotionEnabled}
                onChange={(e) => setSlowMotionEnabled(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            {slowMotionEnabled && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem' }}>Speed</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)' }}>
                    {Math.round(slowMotionSpeed * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={slowMotionSpeed * 100}
                  onChange={(e) => setSlowMotionSpeed(parseInt(e.target.value, 10) / 100)}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

          {/* Play Backwards */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <span style={{ flex: 1 }}>Play Backwards</span>
              <input
                type="checkbox"
                checked={playBackwards}
                onChange={(e) => setPlayBackwards(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
              Play patterns in reverse order
            </p>
          </div>

          {/* Infinite Loop */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <span style={{ flex: 1 }}>Infinite Loop</span>
              <input
                type="checkbox"
                checked={infiniteLoop}
                onChange={(e) => setInfiniteLoop(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
              Continuously loop the pattern until stopped manually
            </p>
          </div>

          {/* Loop Count */}
          {!infiniteLoop && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>
                Loop Count
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={loopCount}
                onChange={(e) => setLoopCount(parseInt(e.target.value, 10) || 1)}
                className="dpgen-input"
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
                Number of times to repeat the pattern
              </p>
            </div>
          )}

          {/* Loop Measures */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-label" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>
              Loop Specific Measures
            </label>
            {loopMeasures ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  value={loopMeasures.start}
                  onChange={(e) => handleLoopMeasuresChange('start', parseInt(e.target.value, 10) || 1)}
                  className="dpgen-input"
                  style={{ width: '80px' }}
                />
                <span>to</span>
                <input
                  type="number"
                  min="1"
                  value={loopMeasures.end}
                  onChange={(e) => handleLoopMeasuresChange('end', parseInt(e.target.value, 10) || 1)}
                  className="dpgen-input"
                  style={{ width: '80px' }}
                />
                <button
                  type="button"
                  className="dpgen-button dpgen-button--small"
                  onClick={handleClearLoopMeasures}
                >
                  Clear
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="dpgen-button dpgen-button--small"
                onClick={() => setLoopMeasures({ start: 1, end: 1 })}
              >
                Set Loop Range
              </button>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
              Loop only specific measures (leave unset to loop entire pattern)
            </p>
          </div>

          {/* Tempo Ramping */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
              <span style={{ flex: 1 }}>Tempo Ramping</span>
              <input
                type="checkbox"
                checked={tempoRamping}
                onChange={(e) => setTempoRamping(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginBottom: '0.75rem' }}>
              Gradually increase tempo over time
            </p>
            {tempoRamping && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem' }}>Start BPM</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)' }}>
                      {tempoRampStart} BPM
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="260"
                    value={tempoRampStart}
                    onChange={(e) => setTempoRampStart(parseInt(e.target.value, 10))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem' }}>End BPM</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)' }}>
                      {tempoRampEnd} BPM
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="260"
                    value={tempoRampEnd}
                    onChange={(e) => setTempoRampEnd(parseInt(e.target.value, 10))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem' }}>Steps</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)' }}>
                      {tempoRampSteps} steps
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={tempoRampSteps}
                    onChange={(e) => setTempoRampSteps(parseInt(e.target.value, 10))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Progressive Mode */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <span style={{ flex: 1 }}>Progressive Mode</span>
              <input
                type="checkbox"
                checked={progressiveMode}
                onChange={(e) => setProgressiveMode(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
              Gradually increase difficulty over time
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

