/**
 * MIDI Input Mapping Editor
 * Allows users to customize which MIDI note numbers map to which drum sounds
 */

'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { MIDINoteMap } from '@/types';

interface MIDIMappingEditorProps {
  onClose: () => void;
}

const DRUM_LABELS: Record<string, string> = {
  K: 'Kick',
  S: 'Snare',
  H: 'Hi-hat (Closed)',
  O: 'Hi-hat (Open)',
  F: 'Floor Tom',
  I: 'High Tom',
  M: 'Mid Tom',
  T: 'Tom (Legacy)',
  R: 'Rest',
};

const DEFAULT_MAP: MIDINoteMap = {
  K: 36,  // Kick (C2)
  S: 38,  // Snare (D2)
  H: 42,  // Hi-hat Closed (F#2)
  O: 46,  // Hi-hat Open (B2)
  F: 41,  // Floor Tom (F2)
  I: 48,  // High Tom (C3)
  M: 47,  // Mid Tom (B2) - also supports 45
  T: 48,  // Tom (Legacy - maps to High Tom)
  R: 0,   // Rest
};

export function MIDIMappingEditor({ onClose }: MIDIMappingEditorProps) {
  const noteMap = useStore((state) => state.midiPractice.noteMap);
  const setMIDINoteMap = useStore((state) => state.setMIDINoteMap);
  const resetMIDINoteMap = useStore((state) => state.resetMIDINoteMap);
  
  // Migrate old note map codes to new ones
  const migrateNoteMap = (map: MIDINoteMap): MIDINoteMap => {
    const migrated: MIDINoteMap = { ...map };
    // Migrate old codes to new ones
    if (migrated['H+'] !== undefined && migrated.O === undefined) {
      migrated.O = migrated['H+'];
      delete migrated['H+'];
    }
    if (migrated.Ht !== undefined && migrated.I === undefined) {
      migrated.I = migrated.Ht;
      delete migrated.Ht;
    }
    if (migrated.Mt !== undefined && migrated.M === undefined) {
      migrated.M = migrated.Mt;
      delete migrated.Mt;
    }
    // Ensure all required codes exist
    if (!migrated.K) migrated.K = DEFAULT_MAP.K;
    if (!migrated.S) migrated.S = DEFAULT_MAP.S;
    if (!migrated.H) migrated.H = DEFAULT_MAP.H;
    if (!migrated.O) migrated.O = DEFAULT_MAP.O;
    if (!migrated.F) migrated.F = DEFAULT_MAP.F;
    if (!migrated.I) migrated.I = DEFAULT_MAP.I;
    if (!migrated.M) migrated.M = DEFAULT_MAP.M;
    return migrated;
  };
  
  const [localMap, setLocalMap] = useState<MIDINoteMap>(migrateNoteMap(noteMap));
  const [listeningTo, setListeningTo] = useState<string | null>(null);
  const [midiInput, setMidiInput] = useState<any>(null);

  const handleNoteChange = (drumToken: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 127) {
      setLocalMap({ ...localMap, [drumToken]: numValue });
    }
  };

  const handleSave = () => {
    setMIDINoteMap(localMap);
    onClose();
  };

  const handleReset = () => {
    setLocalMap({ ...DEFAULT_MAP });
    resetMIDINoteMap();
  };

  const handleListen = (drumToken: string) => {
    if (listeningTo === drumToken) {
      setListeningTo(null);
      return;
    }

    setListeningTo(drumToken);
    
    // Listen for MIDI input
    const handleMIDI = (event: Event) => {
      const midiEvent = event as any;
      if (midiEvent.data) {
        const [status, note] = midiEvent.data;
        if (status >= 144 && status <= 159) {
          setLocalMap({ ...localMap, [drumToken]: note });
          setListeningTo(null);
          // Remove listener
          if (midiInput) {
            midiInput.onmidimessage = null;
            setMidiInput(null);
          }
        }
      }
    };

    // Get MIDI access and listen
    if (typeof navigator !== 'undefined' && (navigator as any).requestMIDIAccess) {
      (navigator as any).requestMIDIAccess({ sysex: false }).then((access: any) => {
        const inputs = Array.from(access.inputs.values());
        if (inputs.length > 0) {
          const input = inputs[0] as any;
          setMidiInput(input);
          input.onmidimessage = handleMIDI;
          // Auto-cancel after 10 seconds
          setTimeout(() => {
            if (input.onmidimessage === handleMIDI) {
              input.onmidimessage = null;
            }
            setMidiInput(null);
            setListeningTo(null);
          }, 10000);
        } else {
          alert('No MIDI devices found. Please connect a MIDI device and try again.');
          setListeningTo(null);
        }
      }).catch((err: Error) => {
        console.error('Failed to access MIDI:', err);
        alert('Failed to access MIDI devices. Please check browser permissions.');
        setListeningTo(null);
      });
    } else {
      alert('MIDI is not supported in this browser.');
      setListeningTo(null);
    }
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
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="dpgen-modal-content"
        style={{
          background: 'var(--dpgen-bg)',
          borderRadius: '10px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>MIDI Input Mapping</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
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

        <p style={{ marginBottom: '1.5rem', color: 'var(--dpgen-muted)', fontSize: '0.875rem' }}>
          Customize which MIDI note numbers map to each drum sound. Click "Listen" and play a note on your MIDI device to automatically map it.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {Object.entries(DRUM_LABELS).map(([token, label]) => (
            <div
              key={token}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'var(--dpgen-card)',
                borderRadius: '8px',
                border: '1px solid var(--dpgen-border)',
              }}
            >
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>
                  {label}
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>
                  Token: <code>{token}</code>
                </div>
              </div>
              <input
                type="number"
                min="0"
                max="127"
                value={localMap[token] ?? 0}
                onChange={(e) => handleNoteChange(token, e.target.value)}
                style={{
                  width: '80px',
                  padding: '0.5rem',
                  border: '1px solid var(--dpgen-border)',
                  borderRadius: '6px',
                  background: 'var(--dpgen-bg)',
                  color: 'var(--dpgen-text)',
                  fontSize: '1rem',
                  textAlign: 'center',
                }}
              />
              <button
                onClick={() => handleListen(token)}
                disabled={listeningTo === token}
                style={{
                  padding: '0.5rem 1rem',
                  background: listeningTo === token ? 'var(--dpgen-accent)' : 'var(--dpgen-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: listeningTo === token ? 'default' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {listeningTo === token ? 'Listening...' : 'Listen'}
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: '1px solid var(--dpgen-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--dpgen-text)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--dpgen-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Save Mapping
          </button>
        </div>
      </div>
    </div>
  );
}

