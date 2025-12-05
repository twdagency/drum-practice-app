'use client';

/**
 * Tempo Trainer Component
 * Gradually increases tempo as user maintains accuracy threshold
 */

import React, { useState, useEffect } from 'react';
import { useTempoTrainer, TempoTrainerConfig } from '@/hooks/useTempoTrainer';
import { useStore } from '@/store/useStore';

interface TempoTrainerProps {
  onClose?: () => void;
}

export function TempoTrainer({ onClose }: TempoTrainerProps) {
  const { config, state, start, stop, reset, updateConfig, isPracticeMode } = useTempoTrainer();
  const isPlaying = useStore((state) => state.isPlaying);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const patterns = useStore((state) => state.patterns);
  const darkMode = useStore((state) => state.darkMode);
  const midiPractice = useStore((state) => state.midiPractice);
  const microphonePractice = useStore((state) => state.microphonePractice);
  
  // Local form state
  const [formConfig, setFormConfig] = useState<TempoTrainerConfig>(config);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  
  // Check prerequisites
  const hasPatterns = patterns.length > 0;
  const hasPracticeMode = midiPractice.enabled || microphonePractice.enabled;
  const canStart = hasPatterns; // Allow starting even without practice mode for demo
  
  // Show setup guide if prerequisites aren't met
  useEffect(() => {
    if (!hasPatterns || !hasPracticeMode) {
      setShowSetupGuide(true);
    }
  }, [hasPatterns, hasPracticeMode]);
  
  const handleStart = () => {
    if (!canStart) return;
    
    updateConfig(formConfig);
    start(formConfig);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };
  
  const handleStop = () => {
    stop();
    setIsPlaying(false);
  };
  
  const handleReset = () => {
    reset();
  };
  
  const progressColor = state.status === 'complete' 
    ? 'var(--dpgen-success, #22c55e)' 
    : state.status === 'failed' 
      ? 'var(--dpgen-error, #ef4444)' 
      : 'var(--dpgen-primary, #3b82f6)';
  
  const statusText = {
    waiting: 'Ready to start',
    progressing: `${state.currentBPM} BPM → ${state.targetBPM} BPM`,
    complete: '🎉 Target reached!',
    failed: 'Keep practicing!',
  };
  
  // Theme-aware styles
  const cardBg = darkMode ? '#262626' : '#ffffff';
  const cardBorder = darkMode ? '#404040' : '#e5e5e5';
  const textPrimary = darkMode ? '#ffffff' : '#171717';
  const textSecondary = darkMode ? '#a3a3a3' : '#737373';
  const textMuted = darkMode ? '#737373' : '#a3a3a3';
  const inputBg = darkMode ? '#404040' : '#f5f5f5';
  const inputBorder = darkMode ? '#525252' : '#d4d4d4';
  const statBg = darkMode ? '#404040' : '#f5f5f5';
  
  return (
    <div 
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '12px',
        padding: '20px',
        color: textPrimary,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🎯</span>
          Tempo Trainer
        </h3>
        {onClose && (
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: textSecondary,
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px',
            }}
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Setup Guide */}
      {showSetupGuide && !state.isActive && (
        <div 
          style={{
            background: darkMode ? '#1e3a5f' : '#dbeafe',
            border: `1px solid ${darkMode ? '#3b82f6' : '#93c5fd'}`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '8px', color: darkMode ? '#93c5fd' : '#1e40af' }}>
            📋 Setup Checklist
          </div>
          <div style={{ fontSize: '14px', color: darkMode ? '#bfdbfe' : '#1e3a8a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>{hasPatterns ? '✅' : '❌'}</span>
              <span>Load a pattern to practice</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>{hasPracticeMode ? '✅' : '⚠️'}</span>
              <span>Enable MIDI or Microphone practice (optional)</span>
            </div>
          </div>
          {hasPatterns && (
            <button
              onClick={() => setShowSetupGuide(false)}
              style={{
                marginTop: '8px',
                padding: '4px 12px',
                background: darkMode ? '#3b82f6' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Got it, continue →
            </button>
          )}
        </div>
      )}
      
      {/* Current Pattern Info */}
      {hasPatterns && !state.isActive && (
        <div 
          style={{
            background: statBg,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          <div style={{ color: textSecondary, marginBottom: '4px' }}>Current Pattern:</div>
          <div style={{ fontWeight: 600 }}>
            {patterns[0]._presetName || `Pattern ${patterns[0].id}`}
          </div>
          <div style={{ color: textMuted, fontSize: '12px' }}>
            {patterns[0].timeSignature} • Subdivision: {patterns[0].subdivision}
          </div>
        </div>
      )}
      
      {/* Progress Display - When Active */}
      {state.isActive && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: textSecondary, marginBottom: '8px' }}>
            <span>Progress: {state.progress.toFixed(0)}%</span>
            <span>{statusText[state.status]}</span>
          </div>
          
          {/* Progress Bar */}
          <div style={{ 
            height: '12px', 
            background: inputBg, 
            borderRadius: '6px', 
            overflow: 'hidden',
            marginBottom: '16px',
          }}>
            <div 
              style={{ 
                height: '100%', 
                background: progressColor,
                width: `${state.progress}%`,
                transition: 'width 0.5s ease-out',
              }}
            />
          </div>
          
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: statBg, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700 }}>{state.currentBPM}</div>
              <div style={{ fontSize: '11px', color: textMuted }}>Current BPM</div>
            </div>
            <div style={{ background: statBg, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 700,
                color: state.currentAccuracy >= formConfig.accuracyThreshold 
                  ? 'var(--dpgen-success, #22c55e)' 
                  : state.currentAccuracy > 0 
                    ? 'var(--dpgen-warning, #f59e0b)'
                    : 'inherit'
              }}>
                {state.currentAccuracy.toFixed(0)}%
              </div>
              <div style={{ fontSize: '11px', color: textMuted }}>Accuracy</div>
            </div>
            <div style={{ background: statBg, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700 }}>
                {state.barsAtCurrentTempo}/{state.barsRequired}
              </div>
              <div style={{ fontSize: '11px', color: textMuted }}>Bars</div>
            </div>
          </div>
          
          {/* Instructions during practice */}
          <div style={{ 
            background: darkMode ? '#064e3b' : '#d1fae5',
            border: `1px solid ${darkMode ? '#10b981' : '#6ee7b7'}`,
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            color: darkMode ? '#a7f3d0' : '#065f46',
          }}>
            {hasPracticeMode ? (
              <>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>🥁 Play along!</div>
                <div>Hit {formConfig.accuracyThreshold}%+ accuracy for {formConfig.barsRequired} bars to level up</div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>⏱️ Tempo will increase automatically</div>
                <div>Enable MIDI/Mic practice for accuracy-based progression</div>
              </>
            )}
          </div>
          
          {/* Best BPM */}
          <div style={{ textAlign: 'center', fontSize: '14px', color: textSecondary, marginTop: '12px' }}>
            Best tempo reached: <span style={{ color: 'var(--dpgen-success, #22c55e)', fontWeight: 600 }}>{state.bestBPMReached} BPM</span>
          </div>
        </div>
      )}
      
      {/* Configuration Form - When Not Active */}
      {!state.isActive && !showSetupGuide && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: textSecondary, marginBottom: '4px' }}>Start BPM</label>
              <input
                type="number"
                min={40}
                max={260}
                value={formConfig.startBPM}
                onChange={(e) => setFormConfig(prev => ({ 
                  ...prev, 
                  startBPM: Math.max(40, Math.min(260, parseInt(e.target.value) || 60)) 
                }))}
                style={{
                  width: '100%',
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: textPrimary,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontSize: '16px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: textSecondary, marginBottom: '4px' }}>Target BPM</label>
              <input
                type="number"
                min={40}
                max={300}
                value={formConfig.targetBPM}
                onChange={(e) => setFormConfig(prev => ({ 
                  ...prev, 
                  targetBPM: Math.max(40, Math.min(300, parseInt(e.target.value) || 120)) 
                }))}
                style={{
                  width: '100%',
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: textPrimary,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontSize: '16px',
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: textSecondary, marginBottom: '4px' }}>Increment</label>
              <input
                type="number"
                min={1}
                max={20}
                value={formConfig.incrementBPM}
                onChange={(e) => setFormConfig(prev => ({ 
                  ...prev, 
                  incrementBPM: Math.max(1, Math.min(20, parseInt(e.target.value) || 5)) 
                }))}
                style={{
                  width: '100%',
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: textPrimary,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontSize: '16px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: textSecondary, marginBottom: '4px' }}>Accuracy %</label>
              <input
                type="number"
                min={50}
                max={100}
                value={formConfig.accuracyThreshold}
                onChange={(e) => setFormConfig(prev => ({ 
                  ...prev, 
                  accuracyThreshold: Math.max(50, Math.min(100, parseInt(e.target.value) || 85)) 
                }))}
                style={{
                  width: '100%',
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: textPrimary,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontSize: '16px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: textSecondary, marginBottom: '4px' }}>Bars Req.</label>
              <input
                type="number"
                min={1}
                max={16}
                value={formConfig.barsRequired}
                onChange={(e) => setFormConfig(prev => ({ 
                  ...prev, 
                  barsRequired: Math.max(1, Math.min(16, parseInt(e.target.value) || 4)) 
                }))}
                style={{
                  width: '100%',
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: textPrimary,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontSize: '16px',
                }}
              />
            </div>
          </div>
          
          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFormConfig({
                startBPM: 60,
                targetBPM: 100,
                incrementBPM: 5,
                accuracyThreshold: 80,
                barsRequired: 4,
              })}
              style={{
                flex: 1,
                padding: '8px',
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                color: textSecondary,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              🐢 Beginner
            </button>
            <button
              onClick={() => setFormConfig({
                startBPM: 80,
                targetBPM: 140,
                incrementBPM: 5,
                accuracyThreshold: 85,
                barsRequired: 4,
              })}
              style={{
                flex: 1,
                padding: '8px',
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                color: textSecondary,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              🏃 Intermediate
            </button>
            <button
              onClick={() => setFormConfig({
                startBPM: 120,
                targetBPM: 200,
                incrementBPM: 10,
                accuracyThreshold: 90,
                barsRequired: 2,
              })}
              style={{
                flex: 1,
                padding: '8px',
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                color: textSecondary,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              🚀 Advanced
            </button>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {!state.isActive ? (
          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{
              flex: 1,
              padding: '12px',
              background: canStart ? 'var(--dpgen-success, #22c55e)' : inputBg,
              color: canStart ? 'white' : textMuted,
              border: 'none',
              borderRadius: '8px',
              cursor: canStart ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            ▶ Start Training
          </button>
        ) : (
          <>
            <button
              onClick={handleStop}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--dpgen-error, #ef4444)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              ⏹ Stop
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: '12px 16px',
                background: inputBg,
                color: textPrimary,
                border: `1px solid ${inputBorder}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ↺
            </button>
          </>
        )}
      </div>
      
      {/* Footer Instructions */}
      {!state.isActive && !showSetupGuide && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: textMuted, lineHeight: 1.5 }}>
          <p style={{ margin: 0 }}>• Hit accuracy threshold for consecutive bars to increase tempo</p>
          <p style={{ margin: 0 }}>• Missing resets bar count (but not tempo)</p>
          <p style={{ margin: 0 }}>• Best tempo is saved to your progress</p>
        </div>
      )}
    </div>
  );
}

export default TempoTrainer;
