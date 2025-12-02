/**
 * Quick Control Panel Component
 * Floating control panel for quick access to audio/playback settings
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { ClickSoundType } from '@/types/audio';

interface QuickControlPanelProps {
  onOpenAudioSettings?: () => void;
  onOpenPlaybackSettings?: () => void;
}

export function QuickControlPanel({ 
  onOpenAudioSettings, 
  onOpenPlaybackSettings 
}: QuickControlPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Load persisted state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dpgen_quick_panel_state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCollapsed(parsed.collapsed !== false); // Default to collapsed
          if (parsed.position) {
            setPosition(parsed.position);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Save state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dpgen_quick_panel_state', JSON.stringify({
        collapsed,
        position,
      }));
    }
  }, [collapsed, position]);

  // Store state
  const playDrumSounds = useStore((state) => state.playDrumSounds);
  const clickSoundType = useStore((state) => state.clickSoundType);
  const countInEnabled = useStore((state) => state.countInEnabled);
  const loopCount = useStore((state) => state.loopCount);
  const infiniteLoop = useStore((state) => state.infiniteLoop);
  const metronomeOnlyMode = useStore((state) => state.metronomeOnlyMode);
  const volumes = useStore((state) => state.volumes);
  const tempoRamping = useStore((state) => state.tempoRamping);
  const tempoRampStart = useStore((state) => state.tempoRampStart);
  const tempoRampEnd = useStore((state) => state.tempoRampEnd);
  const tempoRampSteps = useStore((state) => state.tempoRampSteps);
  const patterns = useStore((state) => state.patterns);

  // Store actions
  const setPlayDrumSounds = useStore((state) => state.setPlayDrumSounds);
  const setClickSoundType = useStore((state) => state.setClickSoundType);
  const setCountInEnabled = useStore((state) => state.setCountInEnabled);
  const setLoopCount = useStore((state) => state.setLoopCount);
  const setInfiniteLoop = useStore((state) => state.setInfiniteLoop);
  const setVolume = useStore((state) => state.setVolume);
  const setTempoRamping = useStore((state) => state.setTempoRamping);
  const setTempoRampStart = useStore((state) => state.setTempoRampStart);
  const setTempoRampEnd = useStore((state) => state.setTempoRampEnd);
  const setTempoRampSteps = useStore((state) => state.setTempoRampSteps);
  const updateAllPatterns = useStore((state) => state.updateAllPatterns);
  const saveToHistory = useStore((state) => state.saveToHistory);

  const masterVolume = Math.max(volumes.snare || 0, volumes.kick || 0, volumes.hiHat || 0, volumes.click || 0) || 1.0;

  // Check if any patterns have left/right foot enabled
  const hasLeftFoot = patterns.some((p) => p.leftFoot);
  const hasRightFoot = patterns.some((p) => p.rightFoot);
  
  // Check if all patterns have left/right foot enabled
  const allLeftFoot = patterns.length > 0 && patterns.every((p) => p.leftFoot);
  const allRightFoot = patterns.length > 0 && patterns.every((p) => p.rightFoot);

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleMasterVolumeChange = (value: number) => {
    const newMasterVolume = value / 100;
    const currentMax = Math.max(volumes.snare || 0, volumes.kick || 0, volumes.hiHat || 0, volumes.click || 0);
    
    // If all volumes are zero, set all to the new master volume
    if (currentMax === 0) {
      setVolume('snare', newMasterVolume);
      setVolume('kick', newMasterVolume);
      setVolume('hiHat', newMasterVolume);
      setVolume('click', newMasterVolume);
    } else {
      // Scale all volumes proportionally to maintain relative levels
      const ratio = newMasterVolume / currentMax;
      setVolume('snare', Math.min(1, (volumes.snare || 0) * ratio));
      setVolume('kick', Math.min(1, (volumes.kick || 0) * ratio));
      setVolume('hiHat', Math.min(1, (volumes.hiHat || 0) * ratio));
      setVolume('click', Math.min(1, (volumes.click || 0) * ratio));
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.quick-panel-drag-handle')) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleDrag = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 300);
      const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 200);
      
      setPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY)),
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging]);

  // Default position (bottom-right) if not set
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: position.y || 20,
    right: position.x || 20,
    zIndex: 9999,
    transition: isDragging ? 'none' : 'all 0.3s ease',
  };

  if (collapsed) {
    return (
      <div
        ref={panelRef}
        style={panelStyle}
        className="quick-control-panel"
      >
        <button
          onClick={handleToggle}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--dpgen-primary)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            boxShadow: 'var(--dpgen-shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Open quick controls"
          title="Quick Controls"
        >
          <i className="fas fa-sliders-h" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      style={panelStyle}
      className="quick-control-panel"
      onMouseDown={handleDragStart}
    >
      <div
        style={{
          background: 'var(--dpgen-card)',
          borderRadius: 'var(--dpgen-radius)',
          padding: '1rem',
          boxShadow: 'var(--dpgen-shadow)',
          border: '1px solid var(--dpgen-border)',
          minWidth: '280px',
          maxWidth: '320px',
        }}
      >
        {/* Header */}
        <div
          className="quick-panel-drag-handle"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            cursor: 'move',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--dpgen-border)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--dpgen-text)' }}>
            <i className="fas fa-sliders-h" style={{ marginRight: '0.5rem' }} />
            Quick Controls
          </h3>
          <button
            onClick={handleToggle}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--dpgen-muted)',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.25rem',
            }}
            aria-label="Collapse panel"
          >
            <i className="fas fa-chevron-down" />
          </button>
        </div>

        {/* Master Volume */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dpgen-text)' }}>
              <i className="fas fa-volume-up" style={{ marginRight: '0.5rem' }} />
              Master
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume * 100}
            onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
            style={{ width: '100%' }}
            className="dpgen-slider"
          />
        </div>

        {/* Drum Sounds Toggle */}
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dpgen-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-drum" />
            Drum Sounds
          </label>
          <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={playDrumSounds}
              onChange={(e) => {
                console.log('[QuickControlPanel] Toggle clicked, new value:', e.target.checked);
                setPlayDrumSounds(e.target.checked);
              }}
            />
            <span className="dpgen-toggle-slider" />
          </label>
        </div>

        {/* Click Sound Type */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dpgen-text)', display: 'block', marginBottom: '0.5rem' }}>
            <i className="fas fa-music" style={{ marginRight: '0.5rem' }} />
            Click Sound
          </label>
          <select
            value={clickSoundType}
            onChange={(e) => setClickSoundType(e.target.value as ClickSoundType)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--dpgen-border)',
              background: 'var(--dpgen-bg)',
              color: 'var(--dpgen-text)',
              fontSize: '0.75rem',
            }}
            className="dpgen-select"
          >
            <option value="default">Default</option>
            <option value="woodblock">Woodblock</option>
            <option value="beep">Beep</option>
            <option value="tick">Tick</option>
            <option value="metronome">Metronome</option>
          </select>
        </div>

        {/* Quick Toggles */}
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dpgen-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-redo" />
              Count-in
            </label>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={countInEnabled}
                onChange={(e) => setCountInEnabled(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dpgen-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-infinity" />
              Infinite Loop
            </label>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={infiniteLoop}
                onChange={(e) => setInfiniteLoop(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
          </div>
          {!infiniteLoop && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dpgen-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-sync" />
                Loop ({loopCount}x)
              </label>
              <input
                type="number"
                value={loopCount}
                onChange={(e) => setLoopCount(parseInt(e.target.value, 10) || 1)}
                min="1"
                max="100"
                style={{
                  width: '60px',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--dpgen-border)',
                  background: 'var(--dpgen-bg)',
                  color: 'var(--dpgen-text)',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                }}
                className="dpgen-input"
              />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dpgen-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-chart-line" />
              Tempo Ramping
            </label>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={tempoRamping}
                onChange={(e) => setTempoRamping(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
          </div>
          {tempoRamping && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '6px', border: '1px solid var(--dpgen-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)' }}>Start: {tempoRampStart} BPM</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)' }}>End: {tempoRampEnd} BPM</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="range"
                    min="40"
                    max="260"
                    value={tempoRampStart}
                    onChange={(e) => setTempoRampStart(parseInt(e.target.value, 10))}
                    style={{ flex: 1, width: '100%' }}
                  />
                  <input
                    type="range"
                    min="40"
                    max="260"
                    value={tempoRampEnd}
                    onChange={(e) => setTempoRampEnd(parseInt(e.target.value, 10))}
                    style={{ flex: 1, width: '100%' }}
                  />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)' }}>Steps: {tempoRampSteps}</span>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dpgen-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-stopwatch" />
              Metronome Only
            </label>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={metronomeOnlyMode}
                onChange={(e) => useStore.getState().setMetronomeOnlyMode(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
          </div>
        </div>

        {/* Foot Pulse Controls */}
        {patterns.length > 0 && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--dpgen-border)' }}>
            <div style={{ marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--dpgen-text)' }}>
              <i className="fas fa-drum" style={{ marginRight: '0.5rem' }} />
              Foot Pulse (All Patterns)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dpgen-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-shoe-prints" style={{ transform: 'scaleX(-1)' }} />
                  Left Foot
                  <span style={{ fontSize: '0.65rem', color: 'var(--dpgen-muted)', marginLeft: '0.25rem' }}>(Hi-Hat)</span>
                </label>
                <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={allLeftFoot}
                    onChange={(e) => {
                      updateAllPatterns({ leftFoot: e.target.checked });
                      saveToHistory();
                    }}
                  />
                  <span className="dpgen-toggle-slider" />
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--dpgen-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-shoe-prints" />
                  Right Foot
                  <span style={{ fontSize: '0.65rem', color: 'var(--dpgen-muted)', marginLeft: '0.25rem' }}>(Kick)</span>
                </label>
                <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={allRightFoot}
                    onChange={(e) => {
                      updateAllPatterns({ rightFoot: e.target.checked });
                      saveToHistory();
                    }}
                  />
                  <span className="dpgen-toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* More Settings Links */}
        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--dpgen-border)' }}>
          {onOpenAudioSettings && (
            <button
              onClick={onOpenAudioSettings}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--dpgen-border)',
                background: 'var(--dpgen-bg)',
                color: 'var(--dpgen-text)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
              }}
            >
              <i className="fas fa-volume-up" />
              Audio
            </button>
          )}
          {onOpenPlaybackSettings && (
            <button
              onClick={onOpenPlaybackSettings}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--dpgen-border)',
                background: 'var(--dpgen-bg)',
                color: 'var(--dpgen-text)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
              }}
            >
              <i className="fas fa-sliders-h" />
              Playback
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

