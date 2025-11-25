/**
 * Help Modal Component
 * Displays user guide and instructions
 */

'use client';

import React, { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState<string>('getting-started');

  if (!isOpen) return null;

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'creating-patterns', title: 'Creating Patterns', icon: '🎵' },
    { id: 'advanced-features', title: 'Advanced Features', icon: '⚡' },
    { id: 'practice-modes', title: 'Practice Modes', icon: '🥁' },
    { id: 'keyboard-shortcuts', title: 'Keyboard Shortcuts', icon: '⌨️' },
    { id: 'exporting-sharing', title: 'Exporting & Sharing', icon: '📤' },
    { id: 'tips', title: 'Tips & Best Practices', icon: '💡' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div>
            <h3>First Steps</h3>
            <ol style={{ lineHeight: '1.8' }}>
              <li><strong>Add a Pattern</strong>: Click the "Add Pattern" button to create your first drum pattern</li>
              <li><strong>Set Time Signature</strong>: Choose your time signature (e.g., 4/4, 3/4, 7/8)</li>
              <li><strong>Choose Subdivision</strong>: Select the note subdivision (4=quarter notes, 8=eighth notes, 16=sixteenth notes, etc.)</li>
              <li><strong>Enter Voicing Pattern</strong>: Type your drum pattern using drum notation</li>
              <li><strong>Enter Sticking Pattern</strong>: Type your sticking pattern (R=Right, L=Left, K=Kick)</li>
            </ol>

            <h3 style={{ marginTop: '2rem' }}>Basic Pattern Notation</h3>
            
            <h4>Drum Voices</h4>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>S</strong> - Snare drum</li>
              <li><strong>K</strong> - Kick drum</li>
              <li><strong>H</strong> - Hi-hat</li>
              <li><strong>F</strong> - Floor tom</li>
              <li><strong>Ht</strong> or <strong>I</strong> - High tom</li>
              <li><strong>Mt</strong> or <strong>M</strong> - Mid tom</li>
              <li><strong>T</strong> - Tom (maps to high tom)</li>
            </ul>

            <h4 style={{ marginTop: '1.5rem' }}>Simultaneous Hits</h4>
            <p>Use <code style={{ background: 'var(--dpgen-bg)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>+</code> to indicate simultaneous hits:</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><code>S+K</code> - Snare and kick together</li>
              <li><code>H+K</code> - Hi-hat and kick together</li>
            </ul>

            <h4 style={{ marginTop: '1.5rem' }}>Rests</h4>
            <p>Use <code style={{ background: 'var(--dpgen-bg)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>-</code> to indicate a rest (no hit):</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><code>S - S -</code> - Snare on beats 1 and 3, rest on beats 2 and 4</li>
            </ul>

            <h4 style={{ marginTop: '1.5rem' }}>Ghost Notes</h4>
            <p>Wrap a note in parentheses for ghost notes (softer hits):</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><code>(S)</code> - Ghost snare</li>
              <li><code>S (S) S (S)</code> - Alternating regular and ghost snare hits</li>
            </ul>
          </div>
        );

      case 'creating-patterns':
        return (
          <div>
            <h3>Standard Patterns</h3>
            <ol style={{ lineHeight: '1.8' }}>
              <li>Enter your voicing pattern in the "Voicing Pattern" field</li>
              <li>Enter your sticking pattern in the "Sticking Pattern" field</li>
              <li>Adjust the subdivision to change note density</li>
              <li>Set accents using the accent editor</li>
              <li>Adjust the repeat count to play the pattern multiple times</li>
            </ol>

            <h3 style={{ marginTop: '2rem' }}>Advanced Per-Beat Subdivisions</h3>
            <p>Enable "Advanced Mode" to set different subdivisions for each beat:</p>
            <ol style={{ lineHeight: '1.8' }}>
              <li>Toggle "Advanced Mode" under the Subdivision section</li>
              <li>Set subdivisions for each beat (e.g., Beat 1: 16th notes, Beat 2: 8th notes)</li>
              <li>Enter voicing and sticking patterns for each beat</li>
              <li>Use the randomize buttons to generate random per-beat patterns</li>
            </ol>

            <h3 style={{ marginTop: '2rem' }}>Pattern Presets</h3>
            <p>Browse and load from 175+ preset patterns:</p>
            <ol style={{ lineHeight: '1.8' }}>
              <li>Click "Browse Presets" in the toolbar</li>
              <li>Filter by category (Beginner, Intermediate, Advanced, etc.)</li>
              <li>Search for specific patterns</li>
              <li>Click "Load" to add a pattern to your list</li>
            </ol>
          </div>
        );

      case 'advanced-features':
        return (
          <div>
            <h3>Ornaments</h3>
            
            <h4>Flams</h4>
            <p>Use lowercase <code>l</code> or <code>r</code> before a note for a flam:</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><code>lR</code> - Left-hand flam on right-hand note</li>
              <li><code>rL</code> - Right-hand flam on left-hand note</li>
            </ul>

            <h4 style={{ marginTop: '1.5rem' }}>Drags</h4>
            <p>Use two lowercase letters for a drag (ruff):</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><code>llR</code> - Drag on right-hand note</li>
              <li><code>rrL</code> - Drag on left-hand note</li>
            </ul>

            <h4 style={{ marginTop: '1.5rem' }}>Ruffs</h4>
            <p>Use three lowercase letters for a ruff:</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><code>lllR</code> - Ruff on right-hand note</li>
              <li><code>rrrL</code> - Ruff on left-hand note</li>
            </ul>

            <h3 style={{ marginTop: '2rem' }}>Polyrhythms</h3>
            <p>Create polyrhythms where each hand plays a different rhythm:</p>
            <ol style={{ lineHeight: '1.8' }}>
              <li>Click "Add Polyrhythm" in the toolbar</li>
              <li>Set the ratio (e.g., 4:3 means right hand plays 4 notes while left plays 3)</li>
              <li>Choose display mode (Stacked or Two Staves)</li>
              <li>Set click mode (Both Hands, Right Hand Only, Left Hand Only)</li>
            </ol>
          </div>
        );

      case 'practice-modes':
        return (
          <div>
            <h3>MIDI Practice</h3>
            <p>Practice with a MIDI drum pad or keyboard:</p>
            <ol style={{ lineHeight: '1.8' }}>
              <li>Click "MIDI Practice" in the toolbar</li>
              <li>Connect your MIDI device</li>
              <li>Calibrate your device (optional)</li>
              <li>Start playback and play along</li>
              <li>View real-time accuracy and timing feedback</li>
            </ol>

            <h3 style={{ marginTop: '2rem' }}>Microphone Practice</h3>
            <p>Practice with audio input from a microphone:</p>
            <ol style={{ lineHeight: '1.8' }}>
              <li>Click "Microphone Practice" in the toolbar</li>
              <li>Select your microphone device</li>
              <li>Calibrate sensitivity (optional)</li>
              <li>Start playback and play along</li>
              <li>View real-time accuracy feedback</li>
            </ol>

            <h3 style={{ marginTop: '2rem' }}>Practice Statistics</h3>
            <p>Track your practice progress:</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Total practice time</li>
              <li>Number of sessions</li>
              <li>Current streak</li>
              <li>Average accuracy</li>
              <li>Average timing</li>
              <li>Daily practice charts</li>
              <li>Goal tracking</li>
            </ul>
          </div>
        );

      case 'keyboard-shortcuts':
        return (
          <div>
            <h3>Keyboard Shortcuts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px', fontFamily: 'monospace' }}>Space</kbd>
                <span>Play/Pause</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px', fontFamily: 'monospace' }}>Esc</kbd>
                <span>Stop playback</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                <span>
                  <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px', fontFamily: 'monospace' }}>Ctrl</kbd>
                  <span style={{ margin: '0 0.25rem' }}>+</span>
                  <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px', fontFamily: 'monospace' }}>N</kbd>
                </span>
                <span>Add new pattern</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                <span>
                  <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px', fontFamily: 'monospace' }}>Ctrl</kbd>
                  <span style={{ margin: '0 0.25rem' }}>+</span>
                  <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px', fontFamily: 'monospace' }}>Shift</kbd>
                  <span style={{ margin: '0 0.25rem' }}>+</span>
                  <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px', fontFamily: 'monospace' }}>N</kbd>
                </span>
                <span>Generate random pattern</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                <span>
                  <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px', fontFamily: 'monospace' }}>Ctrl</kbd>
                  <span style={{ margin: '0 0.25rem' }}>+</span>
                  <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px', fontFamily: 'monospace' }}>R</kbd>
                </span>
                <span>Randomize all patterns</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                <kbd style={{ padding: '0.25rem 0.5rem', background: 'var(--dpgen-card)', border: '1px solid var(--dpgen-border)', borderRadius: '4px', fontFamily: 'monospace' }}>?</kbd>
                <span>Show keyboard shortcuts</span>
              </div>
            </div>
          </div>
        );

      case 'exporting-sharing':
        return (
          <div>
            <h3>Export Options</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>MIDI Export</strong> - Export patterns as MIDI files</li>
              <li><strong>SVG Export</strong> - Export notation as SVG images</li>
              <li><strong>PNG Export</strong> - Export notation as PNG images</li>
              <li><strong>PDF Export</strong> - Export notation as PDF (print-friendly)</li>
              <li><strong>Shareable URL</strong> - Generate a URL to share patterns</li>
              <li><strong>Export Collection</strong> - Export all patterns as JSON</li>
              <li><strong>Import Collection</strong> - Import patterns from JSON</li>
            </ul>

            <h3 style={{ marginTop: '2rem' }}>Pattern Library</h3>
            <p>Save patterns to your personal library:</p>
            <ol style={{ lineHeight: '1.8' }}>
              <li>Click "Pattern Library" in the toolbar</li>
              <li>Click "Save Current Patterns" to save all patterns</li>
              <li>Search and filter saved patterns</li>
              <li>Load patterns from your library</li>
              <li>Share patterns with others</li>
            </ol>
          </div>
        );

      case 'tips':
        return (
          <div>
            <h3>Pattern Creation</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Start simple and gradually increase complexity</li>
              <li>Use ghost notes to add dynamics and groove</li>
              <li>Experiment with different subdivisions</li>
              <li>Try per-beat subdivisions for complex patterns</li>
              <li>Use accents to emphasize important beats</li>
            </ul>

            <h3 style={{ marginTop: '2rem' }}>Practice Tips</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Start slow and gradually increase tempo</li>
              <li>Use the visual metronome to maintain steady timing</li>
              <li>Practice with both MIDI and microphone modes</li>
              <li>Track your progress with practice statistics</li>
              <li>Set practice goals to stay motivated</li>
            </ul>

            <h3 style={{ marginTop: '2rem' }}>Performance</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Patterns with many repeats may take longer to render</li>
              <li>Use the search feature to quickly find patterns</li>
              <li>Collapse pattern sections you're not editing</li>
              <li>Export patterns you want to keep</li>
            </ul>

            <h3 style={{ marginTop: '2rem' }}>Accessibility</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li>All interactive elements support keyboard navigation</li>
              <li>Use arrow keys to navigate between patterns</li>
              <li>Screen reader support is available for all features</li>
              <li>High contrast mode available in dark mode</li>
            </ul>
          </div>
        );

      case 'troubleshooting':
        return (
          <div>
            <h3>Playback Issues</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Ensure your audio is not muted</li>
              <li>Check browser audio permissions</li>
              <li>Try refreshing the page if playback stops</li>
            </ul>

            <h3 style={{ marginTop: '2rem' }}>MIDI Issues</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Ensure your MIDI device is connected</li>
              <li>Check browser MIDI permissions</li>
              <li>Try recalibrating your device</li>
            </ul>

            <h3 style={{ marginTop: '2rem' }}>Rendering Issues</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Large patterns may take time to render</li>
              <li>Try reducing the number of repeats</li>
              <li>Clear browser cache if notation doesn't display</li>
            </ul>

            <h3 style={{ marginTop: '2rem' }}>Performance Issues</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Close other browser tabs</li>
              <li>Reduce the number of patterns</li>
              <li>Disable visual effects if needed</li>
            </ul>
          </div>
        );

      default:
        return null;
    }
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
          padding: '0',
          maxWidth: '900px',
          width: '90%',
          maxHeight: '90vh',
          boxShadow: 'var(--dpgen-shadow)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--dpgen-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dpgen-text)', margin: 0 }}>
            <i className="fas fa-question-circle" style={{ marginRight: '0.5rem', color: 'var(--dpgen-primary)' }} />
            Help & Instructions
          </h2>
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

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div
            style={{
              width: '250px',
              borderRight: '1px solid var(--dpgen-border)',
              padding: '1rem',
              overflowY: 'auto',
              background: 'var(--dpgen-bg)',
            }}
          >
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    background: activeSection === section.id ? 'var(--dpgen-primary)' : 'transparent',
                    color: activeSection === section.id ? 'white' : 'var(--dpgen-text)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: activeSection === section.id ? 600 : 400,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = 'var(--dpgen-bg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ marginRight: '0.5rem' }}>{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div
            style={{
              flex: 1,
              padding: '2rem',
              overflowY: 'auto',
              color: 'var(--dpgen-text)',
            }}
          >
            <div
              style={{
                maxWidth: '600px',
                lineHeight: '1.6',
              }}
            >
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


