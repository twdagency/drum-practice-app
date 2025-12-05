/**
 * Help Modal Component
 * Displays user guide and instructions - compact tabbed design
 */

'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { 
  HelpCircle, 
  Rocket, 
  Music, 
  Zap, 
  Target, 
  Keyboard, 
  Download, 
  Lightbulb, 
  Wrench 
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Section = 'start' | 'patterns' | 'advanced' | 'practice' | 'shortcuts' | 'export' | 'tips' | 'troubleshoot';

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState<Section>('start');

  const sections: { id: Section; title: string; icon: React.ReactNode }[] = [
    { id: 'start', title: 'Getting Started', icon: <Rocket size={14} /> },
    { id: 'patterns', title: 'Patterns', icon: <Music size={14} /> },
    { id: 'advanced', title: 'Advanced', icon: <Zap size={14} /> },
    { id: 'practice', title: 'Practice', icon: <Target size={14} /> },
    { id: 'shortcuts', title: 'Shortcuts', icon: <Keyboard size={14} /> },
    { id: 'export', title: 'Export', icon: <Download size={14} /> },
    { id: 'tips', title: 'Tips', icon: <Lightbulb size={14} /> },
    { id: 'troubleshoot', title: 'Help', icon: <Wrench size={14} /> },
  ];

  const content: Record<Section, React.ReactNode> = {
    start: (
      <>
        <h4 style={{ marginTop: 0 }}>First Steps</h4>
        <ol style={{ lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
          <li><strong>Add Pattern</strong> - Click "Add Pattern" to create</li>
          <li><strong>Time Signature</strong> - Choose 4/4, 3/4, 7/8, etc.</li>
          <li><strong>Subdivision</strong> - 4=quarter, 8=eighth, 16=sixteenth</li>
          <li><strong>Voicing</strong> - Enter drum tokens (S, K, H, etc.)</li>
          <li><strong>Sticking</strong> - Enter R/L/K pattern</li>
        </ol>

        <h4>Drum Notation</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.8rem' }}>
          <div><code>S</code> - Snare</div>
          <div><code>K</code> - Kick</div>
          <div><code>H</code> - Hi-hat</div>
          <div><code>F</code> - Floor tom</div>
          <div><code>T</code> - High tom</div>
          <div><code>M</code> - Mid tom</div>
          <div><code>C</code> - Crash</div>
          <div><code>Y</code> - Ride</div>
        </div>

        <h4>Special Notation</h4>
        <ul style={{ lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
          <li><code>S+K</code> - Simultaneous hits</li>
          <li><code>-</code> - Rest (no hit)</li>
          <li><code>(S)</code> - Ghost note (soft)</li>
        </ul>
      </>
    ),
    patterns: (
      <>
        <h4 style={{ marginTop: 0 }}>Creating Patterns</h4>
        <ol style={{ lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
          <li>Enter voicing in "Voicing Pattern" field</li>
          <li>Enter sticking in "Sticking Pattern" field</li>
          <li>Adjust subdivision for note density</li>
          <li>Set accents using accent editor</li>
          <li>Set repeat count for loops</li>
        </ol>

        <h4>Per-Beat Subdivisions</h4>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', lineHeight: 1.5 }}>
          Enable "Advanced Mode" to set different subdivisions per beat.
          Great for complex patterns mixing 16ths and 8ths.
        </p>

        <h4>Presets</h4>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', lineHeight: 1.5 }}>
          Browse 175+ preset patterns: click "Browse Presets", filter by category,
          and click "Load" to add.
        </p>
      </>
    ),
    advanced: (
      <>
        <h4 style={{ marginTop: 0 }}>Ornaments</h4>
        <ul style={{ lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
          <li><code>lR</code> / <code>rL</code> - Flam</li>
          <li><code>llR</code> / <code>rrL</code> - Drag</li>
          <li><code>lllR</code> / <code>rrrL</code> - Ruff</li>
        </ul>

        <h4>Polyrhythms</h4>
        <ol style={{ lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
          <li>Click "Add Polyrhythm"</li>
          <li>Set ratio (4:3 = R plays 4, L plays 3)</li>
          <li>Choose display (Stacked/Two Staves)</li>
          <li>Set click mode (Both/Right/Left)</li>
        </ol>

        <h4>Accents</h4>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', lineHeight: 1.5 }}>
          Use the accent editor to mark specific beats louder.
          Pattern: <code>&gt;</code> for accent, <code>-</code> for normal.
        </p>
      </>
    ),
    practice: (
      <>
        <h4 style={{ marginTop: 0 }}>MIDI Practice</h4>
        <ol style={{ lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
          <li>Click "MIDI Practice" in toolbar</li>
          <li>Connect MIDI device</li>
          <li>Calibrate (optional)</li>
          <li>Start playback and play along</li>
        </ol>

        <h4>Microphone Practice</h4>
        <ol style={{ lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
          <li>Click "Microphone Practice"</li>
          <li>Select microphone</li>
          <li>Calibrate sensitivity</li>
          <li>Start playback and play along</li>
        </ol>

        <h4>Tempo Trainer</h4>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', lineHeight: 1.5 }}>
          Gradually increases tempo as you maintain accuracy.
          Set start/target BPM and accuracy threshold.
        </p>
      </>
    ),
    shortcuts: (
      <>
        <h4 style={{ marginTop: 0 }}>Keyboard Shortcuts</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {[
            { keys: 'Space', desc: 'Play/Pause' },
            { keys: 'Esc', desc: 'Stop' },
            { keys: 'Ctrl+N', desc: 'Add pattern' },
            { keys: 'Ctrl+Shift+N', desc: 'Random pattern' },
            { keys: 'Ctrl+R', desc: 'Randomize all' },
            { keys: '?', desc: 'Show shortcuts' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--dpgen-bg)', borderRadius: '4px' }}>
              <kbd style={{ fontSize: '0.75rem', fontFamily: 'monospace', padding: '0.125rem 0.375rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '3px' }}>{s.keys}</kbd>
              <span style={{ fontSize: '0.8rem' }}>{s.desc}</span>
            </div>
          ))}
        </div>
      </>
    ),
    export: (
      <>
        <h4 style={{ marginTop: 0 }}>Export Options</h4>
        <ul style={{ lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
          <li><strong>MIDI</strong> - Export as .mid file</li>
          <li><strong>SVG</strong> - Vector notation image</li>
          <li><strong>PNG</strong> - Raster notation image</li>
          <li><strong>PDF</strong> - Print-ready document</li>
          <li><strong>URL</strong> - Shareable link</li>
          <li><strong>JSON</strong> - Full pattern data</li>
        </ul>

        <h4>Pattern Library</h4>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', lineHeight: 1.5 }}>
          Save patterns to your library for later use.
          Sign in to sync across devices.
        </p>
      </>
    ),
    tips: (
      <>
        <h4 style={{ marginTop: 0 }}>Pattern Creation</h4>
        <ul style={{ lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
          <li>Start simple, increase complexity</li>
          <li>Use ghost notes for groove</li>
          <li>Try per-beat subdivisions</li>
          <li>Add accents for dynamics</li>
        </ul>

        <h4>Practice Tips</h4>
        <ul style={{ lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
          <li>Start slow, increase gradually</li>
          <li>Use visual metronome</li>
          <li>Track progress with stats</li>
          <li>Set practice goals</li>
        </ul>
      </>
    ),
    troubleshoot: (
      <>
        <h4 style={{ marginTop: 0 }}>Playback Issues</h4>
        <ul style={{ lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
          <li>Check audio is not muted</li>
          <li>Allow audio permissions</li>
          <li>Refresh page if stuck</li>
        </ul>

        <h4>MIDI Issues</h4>
        <ul style={{ lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
          <li>Ensure device is connected</li>
          <li>Check browser MIDI permissions</li>
          <li>Try recalibrating</li>
        </ul>

        <h4>Performance</h4>
        <ul style={{ lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
          <li>Close other tabs</li>
          <li>Reduce pattern count</li>
          <li>Lower repeat count</li>
        </ul>
      </>
    ),
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Help & Guide"
      icon={<HelpCircle size={20} strokeWidth={1.5} />}
      size="lg"
    >
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '0.375rem', 
        marginBottom: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--dpgen-border)',
      }}>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.375rem 0.625rem',
              background: activeSection === section.id ? 'var(--dpgen-primary)' : 'var(--dpgen-bg)',
              color: activeSection === section.id ? 'white' : 'var(--dpgen-text)',
              border: activeSection === section.id ? 'none' : '1px solid var(--dpgen-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            {section.icon}
            {section.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ 
        fontSize: '0.875rem', 
        lineHeight: 1.6,
        color: 'var(--dpgen-text)',
      }}>
        <style>{`
          .help-content h4 {
            margin: 1rem 0 0.5rem;
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--dpgen-text);
          }
          .help-content code {
            background: var(--dpgen-bg);
            padding: 0.125rem 0.375rem;
            border-radius: 3px;
            font-size: 0.8rem;
            font-family: monospace;
          }
        `}</style>
        <div className="help-content">
          {content[activeSection]}
        </div>
      </div>
    </Modal>
  );
}
