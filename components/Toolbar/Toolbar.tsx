/**
 * Main Toolbar component
 * Converted from WordPress plugin toolbar
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { ToolbarButton } from '../shared/ToolbarButton';
import { ToolbarGroup } from '../shared/ToolbarGroup';
import { ToolbarDivider } from '../shared/ToolbarDivider';
import { ToolbarDropdown } from '../shared/ToolbarDropdown';
import { Tooltip } from '../shared/Tooltip';
import { KeyboardShortcutsModal } from '../shared/KeyboardShortcutsModal';
import { useToast } from '../shared/Toast';
import { createDefaultPattern, generateRandomPattern, randomizePattern } from '@/lib/utils/patternUtils';
import { MIDIPractice } from '../PracticeMode/MIDIPractice';
import { MicrophonePractice } from '../PracticeMode/MicrophonePractice';
import { PresetsBrowser } from '../PracticeMode/PresetsBrowser';
import { CombinePresets } from '../PracticeMode/CombinePresets';
import { SavePatternModal } from '../PracticeMode/SavePatternModal';
import { LearningPathModal } from '../PracticeMode/LearningPathModal';
import { PolyrhythmBuilder } from '../PracticeMode/PolyrhythmBuilder';
import { AudioSettingsModal } from '../PracticeMode/AudioSettingsModal';
import { PlaybackSettingsModal } from '../PracticeMode/PlaybackSettingsModal';
import { ApiSyncSettingsModal } from '../PracticeMode/ApiSyncSettingsModal';
import { MIDIRecording } from '../PracticeMode/MIDIRecording';
import { MIDIMappingEditor } from '../PracticeMode/MIDIMappingEditor';
import { AuthButton } from '../auth/AuthButton';
import { usePresets } from '@/hooks/usePresets';
import { parseTimeSignature, buildAccentIndices, parseNumberList } from '@/lib/utils/patternUtils';
import { exportPDF, exportPNG, exportSVG, exportMIDI, exportPatternCollection, importPatternCollection, sharePatternURL } from '@/lib/utils/exportUtils';
import { useMIDIRecording } from '@/hooks/useMIDIRecording';
import { useMIDIDevices } from '@/hooks/useMIDIDevices';
import { convertMIDIRecordingToPattern } from '@/lib/utils/midiRecordingUtils';
import { startCountIn, stopCountIn, startMetronome, stopMetronome } from '@/lib/utils/midiRecordingManager';
import { isApiSyncEnabled } from '@/lib/utils/patternSync';

export function Toolbar() {
  const { showToast } = useToast();
  const [midiPracticeOpen, setMidiPracticeOpen] = useState(false);
  const [microphonePracticeOpen, setMicrophonePracticeOpen] = useState(false);
  const [showPresetsBrowser, setShowPresetsBrowser] = useState(false);
  const [showCombinePresets, setShowCombinePresets] = useState(false);
  const [showSavePattern, setShowSavePattern] = useState(false);
  const [showLearningPaths, setShowLearningPaths] = useState(false);
  const [showPolyrhythmBuilder, setShowPolyrhythmBuilder] = useState(false);
  const [presetsDropdownOpen, setPresetsDropdownOpen] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showPlaybackSettings, setShowPlaybackSettings] = useState(false);
  const [showApiSyncSettings, setShowApiSyncSettings] = useState(false);
  const [showMIDIMapping, setShowMIDIMapping] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [midiRecordingOpen, setMidiRecordingOpen] = useState(false);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [tapTempoMessage, setTapTempoMessage] = useState<string | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [apiSyncEnabled, setApiSyncEnabled] = useState(false);
  
  // Load presets for the dropdown
  const { presets, loading: presetsLoading } = usePresets();
  
  // Check API sync status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiSyncEnabled(isApiSyncEnabled());
      // Listen for storage changes
      const handleStorageChange = () => {
        setApiSyncEnabled(isApiSyncEnabled());
      };
      window.addEventListener('storage', handleStorageChange);
      // Also check periodically (for same-tab updates)
      const interval = setInterval(() => {
        setApiSyncEnabled(isApiSyncEnabled());
      }, 1000);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, []);
  
  // MIDI Recording
  const { devices: midiDevices, access: midiAccess } = useMIDIDevices();
  const { startRecording: startMIDIRecordingHook, stopRecording: stopMIDIRecordingHook } = useMIDIRecording();
  
  // Close settings dropdown when modals open
  useEffect(() => {
    if (showAudioSettings || showPlaybackSettings || showApiSyncSettings || showMIDIMapping) {
      setSettingsDropdownOpen(false);
    }
  }, [showAudioSettings, showPlaybackSettings, showApiSyncSettings, showMIDIMapping]);
  
  // Store state and actions
  const bpm = useStore((state) => state.bpm);
  const isPlaying = useStore((state) => state.isPlaying);
  const patterns = useStore((state) => state.patterns);
  const darkMode = useStore((state) => state.darkMode);
  const showGridLines = useStore((state) => state.showGridLines);
  const showMeasureNumbers = useStore((state) => state.showMeasureNumbers);
  const showVisualMetronome = useStore((state) => state.showVisualMetronome);
  const showPolyrhythmShapes = useStore((state) => state.showPolyrhythmShapes);
  const polyrhythmDisplayMode = useStore((state) => state.polyrhythmDisplayMode);
  const practicePadMode = useStore((state) => state.practicePadMode);
  const midiPractice = useStore((state) => state.midiPractice);
  const midiPracticeEnabled = useStore((state) => state.midiPractice.enabled);
  const microphonePractice = useStore((state) => state.microphonePractice);
  const microphonePracticeEnabled = useStore((state) => state.microphonePractice.enabled);
  const midiRecording = useStore((state) => state.midiRecording);
  
  const setBPM = useStore((state) => state.setBPM);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const addPattern = useStore((state) => state.addPattern);
  const updatePattern = useStore((state) => state.updatePattern);
  const clearPatterns = useStore((state) => state.clearPatterns);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const setShowGridLines = useStore((state) => state.setShowGridLines);
  const setShowMeasureNumbers = useStore((state) => state.setShowMeasureNumbers);
  const setShowVisualMetronome = useStore((state) => state.setShowVisualMetronome);
  const setShowPolyrhythmShapes = useStore((state) => state.setShowPolyrhythmShapes);
  const setPolyrhythmDisplayMode = useStore((state) => state.setPolyrhythmDisplayMode);
  const setPracticePadMode = useStore((state) => state.setPracticePadMode);
  const saveToHistory = useStore((state) => state.saveToHistory);
  const setMIDIPracticeEnabled = useStore((state) => state.setMIDIPracticeEnabled);
  const setMicrophonePracticeEnabled = useStore((state) => state.setMicrophonePracticeEnabled);
  const setMIDIRecordingEnabled = useStore((state) => state.setMIDIRecordingEnabled);
  const setMIDIRecordingStartTime = useStore((state) => state.setMIDIRecordingStartTime);
  const clearMIDIRecordingNotes = useStore((state) => state.clearMIDIRecordingNotes);
  const addMIDIRecordingNote = useStore((state) => state.addMIDIRecordingNote);
  const setMIDIRecordingTimeSignature = useStore((state) => state.setMIDIRecordingTimeSignature);
  const setMIDIRecordingSubdivision = useStore((state) => state.setMIDIRecordingSubdivision);
  const setMIDIRecordingCountInEnabled = useStore((state) => state.setMIDIRecordingCountInEnabled);
  const setMIDIRecordingCountInBeats = useStore((state) => state.setMIDIRecordingCountInBeats);
  const setMIDIRecordingInput = useStore((state) => state.setMIDIRecordingInput);

  // Close presets dropdown when modals open
  useEffect(() => {
    if (showPresetsBrowser || showCombinePresets || showSavePattern || showLearningPaths || showPolyrhythmBuilder) {
      setPresetsDropdownOpen(false);
    }
  }, [showPresetsBrowser, showCombinePresets, showSavePattern, showLearningPaths, showPolyrhythmBuilder]);

  // Handlers
  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const handleBPMIncrease = () => {
    setBPM(bpm + 5);
  };

  const handleBPMDecrease = () => {
    setBPM(bpm - 5);
  };

  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBPM = parseInt(e.target.value, 10);
    if (!isNaN(newBPM)) {
      setBPM(newBPM);
    }
  };

  const handleTapTempo = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now];
    
    // Keep only last 4 taps
    const trimmedTapTimes = newTapTimes.length > 4 
      ? newTapTimes.slice(-4) 
      : newTapTimes;
    
    setTapTimes(trimmedTapTimes);
    
    // Need at least 2 taps to calculate tempo
    if (trimmedTapTimes.length < 2) {
      setTapTempoMessage('Keep tapping...');
      setTimeout(() => setTapTempoMessage(null), 1500);
      return;
    }
    
    // Calculate average interval between taps
    const intervals: number[] = [];
    for (let i = 1; i < trimmedTapTimes.length; i++) {
      intervals.push(trimmedTapTimes[i] - trimmedTapTimes[i - 1]);
    }
    
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const calculatedBPM = Math.round(60000 / avgInterval);
    
    // Clamp to valid range (40-260 BPM)
    const clampedBPM = Math.max(40, Math.min(260, calculatedBPM));
    
    // Update BPM
    setBPM(clampedBPM);
    
    // Show feedback
    setTapTempoMessage(`Tempo set to ${clampedBPM} BPM`);
    setTimeout(() => setTapTempoMessage(null), 2000);
    
    // Reset tap times after a delay if no new taps
    setTimeout(() => {
      setTapTimes((current) => {
        if (current.length > 0 && Date.now() - current[current.length - 1] > 2000) {
          return [];
        }
        return current;
      });
    }, 2000);
  };

  // Handle keyboard support for tap tempo (spacebar when button is focused)
  const handleTapTempoKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleTapTempo();
    }
  };

  const handleAddPattern = () => {
    const pattern = createDefaultPattern();
    addPattern(pattern);
    saveToHistory();
  };

  const handleClearPatterns = useCallback(() => {
    if (confirm('Are you sure you want to clear all patterns? This action cannot be undone.')) {
      clearPatterns();
      saveToHistory();
      showToast('All patterns cleared', 'info');
    }
  }, [clearPatterns, saveToHistory, showToast]);

  const handleGenerate = () => {
    // Randomly enable advanced mode (10% chance)
    const useAdvancedMode = Math.random() < 0.1;
    const newPattern = generateRandomPattern(practicePadMode, useAdvancedMode);
    addPattern(newPattern);
    saveToHistory();
  };

  const handleRandomize = useCallback(() => {
    if (patterns.length === 0) {
      showToast('No patterns to randomize. Add a pattern first.', 'warning');
      return;
    }
    
    if (confirm('This will randomize all patterns. Continue?')) {
      patterns.forEach((pattern) => {
        const randomized = randomizePattern(pattern, practicePadMode);
        updatePattern(pattern.id, {
          timeSignature: randomized.timeSignature,
          subdivision: randomized.subdivision,
          phrase: randomized.phrase,
          drumPattern: randomized.drumPattern,
          stickingPattern: randomized.stickingPattern,
          repeat: randomized.repeat,
          _presetAccents: randomized._presetAccents,
          _advancedMode: randomized._advancedMode,
          _perBeatSubdivisions: randomized._perBeatSubdivisions,
          _perBeatVoicing: randomized._perBeatVoicing,
          _perBeatSticking: randomized._perBeatSticking,
        });
      });
      saveToHistory();
      showToast('All patterns randomized', 'success');
    }
  }, [patterns, practicePadMode, updatePattern, saveToHistory, showToast]);

  // MIDI Recording handlers
  const handleStartMIDIRecording = async () => {
    if (!midiRecording.input) {
      // Try to get device from settings
      if (typeof window !== 'undefined') {
        try {
          const saved = window.localStorage.getItem('dpgen_midi_recording_settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.deviceId && midiAccess) {
              const input = midiAccess.inputs.get(parsed.deviceId);
              if (input) {
                setMIDIRecordingInput(input);
                // Load settings
                setMIDIRecordingTimeSignature(parsed.timeSignature || '4/4');
                setMIDIRecordingSubdivision(parsed.subdivision || 16);
                setMIDIRecordingCountInEnabled(parsed.countInEnabled !== false);
                setMIDIRecordingCountInBeats(parsed.countInBeats || 4);
              }
            }
          }
        } catch (e) {
          console.error('Failed to load MIDI recording settings:', e);
        }
      }
      
      if (!midiRecording.input) {
        showToast('Please configure MIDI recording settings first. Click the microphone icon to open settings.', 'warning');
        setMidiRecordingOpen(true);
        return;
      }
    }
    
    // Get settings for count-in
    const countInEnabled = midiRecording.countInEnabled !== false;
    const countInBeats = midiRecording.countInBeats || 4;
    const metronomeEnabled = midiRecording.metronomeEnabled !== false;
    
    // Start recording with count-in if enabled
    if (countInEnabled) {
      startCountIn(
        bpm,
        countInBeats,
        () => {
          // Count-in complete, start actual recording
          if (metronomeEnabled) {
            startMetronome(bpm);
          }
          startMIDIRecordingHook(midiRecording.input!);
        },
        undefined // No beat change callback for toolbar
      );
    } else {
      if (metronomeEnabled) {
        startMetronome(bpm);
      }
      await startMIDIRecordingHook(midiRecording.input);
    }
  };

  const handleStopMIDIRecording = () => {
    // Stop count-in and metronome
    stopCountIn();
    stopMetronome();
    
    const recordedNotes = stopMIDIRecordingHook();
    
    if (recordedNotes && recordedNotes.length > 0) {
      // Get settings for conversion
      const timeSignature = midiRecording.timeSignature || '4/4';
      const subdivision = midiRecording.subdivision || 16;
      
      const patterns = convertMIDIRecordingToPattern(recordedNotes, timeSignature, subdivision, bpm);
      
      if (patterns.length > 0) {
        // Replace all patterns with new ones
        clearPatterns();
        patterns.forEach(pattern => {
          addPattern(pattern);
        });
        saveToHistory();
        
        alert(`${patterns.length} pattern${patterns.length > 1 ? 's' : ''} created from ${recordedNotes.length} MIDI notes!`);
      } else {
        alert('No patterns could be created from the recording.');
      }
    } else {
      alert('No notes recorded.');
    }
  };

  // Keyboard shortcuts for MIDI recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+R to stop recording
      if (e.ctrlKey && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault();
        if (midiRecording.enabled) {
          handleStopMIDIRecording();
        }
      } 
      // Ctrl+R to start recording (only if not already recording and not playing)
      else if (e.ctrlKey && !e.shiftKey && (e.key === 'R' || e.key === 'r') && !e.altKey) {
        // Don't prevent default if in an input field
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        
        e.preventDefault();
        if (!midiRecording.enabled && !isPlaying && midiRecording.input) {
          handleStartMIDIRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [midiRecording.enabled, midiRecording.input, isPlaying, bpm]);

  const handleLoadPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    const [beats, beatType] = parseTimeSignature(preset.timeSignature);
    
    // Parse phrase and calculate accent indices (first note of each group)
    const phraseValues = parseNumberList(preset.phrase);
    const accentIndices = buildAccentIndices(phraseValues);

    // Create pattern from preset
    const pattern = {
      id: 0, // Will be replaced by addPattern
      timeSignature: preset.timeSignature,
      beats,
      beatType,
      subdivision: preset.subdivision,
      phrase: preset.phrase,
      drumPattern: preset.drumPattern,
      stickingPattern: preset.stickingPattern,
      repeat: preset.repeat,
      accentIndices,
      leftFoot: false,
      rightFoot: false,
      _presetName: preset.name,
      _presetDescription: preset.description,
      _presetAccents: accentIndices,
    };

    addPattern(pattern);
    saveToHistory();
  };

  return (
    <div className="dpgen-toolbar">
      {/* Playback Controls */}
      <ToolbarGroup>
        {!isPlaying ? (
          <Tooltip content="Play pattern (Spacebar)">
            <ToolbarButton
              onClick={handlePlay}
              title="Play pattern (Spacebar)"
              icon="fas fa-play"
              variant="primary"
            />
          </Tooltip>
        ) : (
          <Tooltip content="Stop playback (Escape)">
            <ToolbarButton
              onClick={handleStop}
              title="Stop playback (Escape)"
              icon="fas fa-stop"
              variant="primary"
            />
          </Tooltip>
        )}
        <div className="dpgen-toolbar__bpm">
          <ToolbarButton
            onClick={handleBPMDecrease}
            title="Decrease tempo by 5"
            icon="fas fa-minus"
            variant="small"
          />
          <input
            type="number"
            value={bpm}
            min={40}
            max={260}
            onChange={handleBPMChange}
            className="dpgen-toolbar__bpm-input"
            title="Tempo in BPM"
          />
          <span className="dpgen-toolbar__bpm-label">BPM</span>
          <ToolbarButton
            onClick={handleBPMIncrease}
            title="Increase tempo by 5"
            icon="fas fa-plus"
            variant="small"
          />
          <ToolbarButton
            onClick={handleTapTempo}
            onKeyDown={handleTapTempoKeyDown}
            title="Tap tempo - Click repeatedly to set BPM"
            icon="fas fa-hand-pointer"
            variant="small"
          />
          {tapTempoMessage && (
            <span className="dpgen-tap-tempo-message" style={{ 
              marginLeft: '8px', 
              fontSize: '12px', 
              color: darkMode ? '#4CAF50' : '#2E7D32',
              fontWeight: '500'
            }}>
              {tapTempoMessage}
            </span>
          )}
        </div>
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Pattern Actions */}
      <ToolbarGroup>
        <Tooltip content="Generate random pattern (Ctrl/Cmd + Shift + N)">
          <ToolbarButton
            onClick={handleGenerate}
            title="Generate Pattern"
            icon="fas fa-magic"
          />
        </Tooltip>
        <Tooltip content="Add new pattern (Ctrl/Cmd + N)">
          <ToolbarButton
            onClick={handleAddPattern}
            title="Add Pattern"
            icon="fas fa-plus"
          />
        </Tooltip>
        <Tooltip content="Randomize all patterns (Ctrl/Cmd + R)">
          <ToolbarButton
            onClick={handleRandomize}
            title="Randomize All"
            icon="fas fa-dice"
          />
        </Tooltip>
        <Tooltip content="Clear all patterns">
          <ToolbarButton
            onClick={handleClearPatterns}
            title="Clear All Patterns"
            icon="fas fa-trash"
          />
        </Tooltip>
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Export */}
      <ToolbarGroup>
        <ToolbarDropdown buttonIcon="fas fa-download" buttonTitle="Export Options">
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item" 
            onClick={() => {
              const staveElement = document.querySelector('.dpgen-stave__surface') as HTMLElement;
              exportPDF(staveElement);
            }}
          >
            <i className="fas fa-file-pdf" /> Export PDF
          </button>
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item" 
            onClick={() => {
              const staveElement = document.querySelector('.dpgen-stave__surface') as HTMLElement;
              exportPNG(staveElement);
            }}
          >
            <i className="fas fa-image" /> Export PNG
          </button>
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item" 
            onClick={() => {
              const staveElement = document.querySelector('.dpgen-stave__surface') as HTMLElement;
              exportSVG(staveElement);
            }}
          >
            <i className="fas fa-file-code" /> Export SVG
          </button>
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item" 
            onClick={() => {
              exportMIDI(patterns, bpm);
            }}
          >
            <i className="fas fa-music" /> Export MIDI
          </button>
          <div className="dpgen-toolbar__menu-divider" />
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item" 
            onClick={() => {
              sharePatternURL(patterns, bpm);
            }}
          >
            <i className="fas fa-share-alt" /> Share Pattern
          </button>
          <div className="dpgen-toolbar__menu-divider" />
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item" 
            onClick={() => {
              exportPatternCollection(patterns, bpm);
            }}
          >
            <i className="fas fa-download" /> Export Collection
          </button>
          <label className="dpgen-toolbar__menu-item" style={{ cursor: 'pointer', margin: 0 }}>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  importPatternCollection(file, (importedPatterns, importedBpm) => {
                    // Clear existing patterns and add imported ones
                    clearPatterns();
                    importedPatterns.forEach(pattern => {
                      addPattern(pattern);
                    });
                    setBPM(importedBpm);
                    saveToHistory();
                  });
                }
                // Reset input so same file can be selected again
                e.target.value = '';
              }}
            />
            <i className="fas fa-upload" /> Import Collection
          </label>
        </ToolbarDropdown>
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Presets & Library */}
      <ToolbarGroup>
        <ToolbarDropdown 
          buttonIcon="fas fa-book" 
          buttonTitle="Presets & Library"
          controlledOpen={presetsDropdownOpen}
          onOpenChange={setPresetsDropdownOpen}
        >
          <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--dpgen-border)' }}>
            <label className="dpgen-label" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block' }}>
              Practice Presets
            </label>
            <select 
              className="dpgen-select" 
              style={{ width: '100%', fontSize: '0.875rem' }}
              disabled={presetsLoading}
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleLoadPreset(e.target.value);
                  // Reset select to show placeholder
                  e.target.value = '';
                }
              }}
            >
              <option value="">-- Select a preset --</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} {preset.category ? `(${preset.category})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item"
            onClick={() => {
              setPresetsDropdownOpen(false);
              setShowPresetsBrowser(true);
            }}
          >
            <i className="fas fa-th" /> Browse Presets
          </button>
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item"
            onClick={() => {
              setPresetsDropdownOpen(false);
              setShowCombinePresets(true);
            }}
          >
            <i className="fas fa-layer-group" /> Combine Presets
          </button>
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item"
            onClick={() => {
              setPresetsDropdownOpen(false);
              setShowLearningPaths(true);
            }}
          >
            <i className="fas fa-route" /> Learning Paths
          </button>
          <div className="dpgen-toolbar__menu-divider" />
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item"
            onClick={() => {
              setPresetsDropdownOpen(false);
              setShowPolyrhythmBuilder(true);
            }}
          >
            <i className="fas fa-layer-group" /> Polyrhythm Builder
          </button>
          <div className="dpgen-toolbar__menu-divider" />
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item"
            onClick={() => {
              setPresetsDropdownOpen(false);
              setShowSavePattern(true);
            }}
          >
            <i className="fas fa-save" /> Save Pattern
          </button>
          <button type="button" className="dpgen-toolbar__menu-item">
            <i className="fas fa-folder-open" /> Load Pattern
          </button>
          <button type="button" className="dpgen-toolbar__menu-item">
            <i className="fas fa-folder" /> Collections
          </button>
          <div className="dpgen-toolbar__menu-divider" />
          <button type="button" className="dpgen-toolbar__menu-item">
            <i className="fas fa-trophy" /> Daily Challenges
          </button>
        </ToolbarDropdown>
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Practice Modes */}
      <ToolbarGroup>
        <div className="dpgen-toggle-switch" title="MIDI Practice Mode">
          <i 
            className="fas fa-drum" 
            style={{ cursor: 'pointer', marginRight: '0.5rem', color: midiPracticeEnabled ? 'var(--dpgen-primary)' : 'inherit' }} 
            onClick={() => {
              // Icon click always opens modal
              setMidiPracticeOpen(true);
            }}
          />
          <label style={{ margin: 0, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={midiPracticeEnabled}
              onChange={() => {
                // Toggle click enables/disables practice mode directly
                if (midiPracticeEnabled) {
                  setMIDIPracticeEnabled(false);
                } else {
                  // Check if settings are saved
                  const hasSettings = typeof window !== 'undefined' && window.localStorage.getItem('dpgen_midi_practice_settings');
                  if (hasSettings && midiPractice.input) {
                    // Settings exist and device is connected, enable directly
                    setMIDIPracticeEnabled(true);
                  } else {
                    // No settings or device not connected, open modal
                    setMidiPracticeOpen(true);
                  }
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="dpgen-toggle-slider" />
          </label>
        </div>
        <div className="dpgen-toggle-switch" title="Microphone Practice Mode">
          <i 
            className="fas fa-microphone-alt" 
            style={{ cursor: 'pointer', marginRight: '0.5rem', color: microphonePracticeEnabled ? 'var(--dpgen-primary)' : 'inherit' }} 
            onClick={() => {
              // Icon click always opens modal
              setMicrophonePracticeOpen(true);
            }}
          />
          <label style={{ margin: 0, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={microphonePracticeEnabled}
              onChange={() => {
                // Toggle click enables/disables practice mode directly
                if (microphonePracticeEnabled) {
                  setMicrophonePracticeEnabled(false);
                } else {
                  // Check if settings are saved
                  const hasSettings = typeof window !== 'undefined' && window.localStorage.getItem('dpgen_microphone_practice_settings');
                  if (hasSettings && microphonePractice.stream && microphonePractice.analyser) {
                    setMicrophonePracticeEnabled(true);
                  } else {
                    // No settings or microphone not connected, open modal
                    setMicrophonePracticeOpen(true);
                  }
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (microphonePracticeEnabled) {
                  setMicrophonePracticeEnabled(false);
                } else {
                  const hasSettings = typeof window !== 'undefined' && window.localStorage.getItem('dpgen_microphone_practice_settings');
                  if (hasSettings && microphonePractice.stream && microphonePractice.analyser) {
                    setMicrophonePracticeEnabled(true);
                  } else {
                    setMicrophonePracticeOpen(true);
                  }
                }
              }}
            />
            <span className="dpgen-toggle-slider" />
          </label>
        </div>
        <ToolbarButton
          onClick={() => setMidiRecordingOpen(true)}
          title="Create Pattern from MIDI (Open Settings)"
          icon="fas fa-microphone"
        />
        {midiRecording.enabled ? (
          <ToolbarButton
            onClick={handleStopMIDIRecording}
            title="Stop MIDI Recording (Ctrl+Shift+R)"
            icon="fas fa-stop"
            variant="danger"
          />
        ) : (
          <ToolbarButton
            onClick={handleStartMIDIRecording}
            title="Start MIDI Recording (Ctrl+R)"
            icon="fas fa-circle"
            variant="primary"
            disabled={!midiRecording.input}
          />
        )}
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Settings */}
      <ToolbarGroup>
        <ToolbarDropdown 
          buttonIcon="fas fa-cog" 
          buttonTitle="Settings"
          controlledOpen={settingsDropdownOpen}
          onOpenChange={setSettingsDropdownOpen}
        >
          <div style={{ padding: '0.75rem 1rem' }}>
            <label className="dpgen-label" style={{ fontSize: '0.75rem', marginBottom: '0.75rem', display: 'block', fontWeight: 600 }}>
              Display Options
            </label>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span style={{ flex: 1 }}>Show Measure Numbers</span>
              <input 
                type="checkbox" 
                checked={showMeasureNumbers}
                onChange={(e) => setShowMeasureNumbers(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span style={{ flex: 1 }}>Show Visual Metronome</span>
              <input 
                type="checkbox" 
                checked={showVisualMetronome}
                onChange={(e) => setShowVisualMetronome(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span style={{ flex: 1 }}>Show Polyrhythm Shapes</span>
              <input 
                type="checkbox" 
                checked={showPolyrhythmShapes}
                onChange={(e) => setShowPolyrhythmShapes(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span style={{ flex: 1 }}>Practice Pad Mode</span>
              <input 
                type="checkbox" 
                checked={practicePadMode}
                onChange={(e) => setPracticePadMode(e.target.checked)}
              />
              <span className="dpgen-toggle-slider" />
            </label>
            <div style={{ marginTop: '0.75rem' }}>
              <label className="dpgen-label" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>
                Polyrhythm Display
              </label>
              <select
                value={polyrhythmDisplayMode}
                onChange={(e) => setPolyrhythmDisplayMode(e.target.value as 'stacked' | 'two-staves')}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.875rem',
                  borderRadius: '4px',
                  border: '1px solid var(--dpgen-border)',
                  backgroundColor: 'var(--dpgen-bg)',
                  color: 'var(--dpgen-text)',
                  cursor: 'pointer'
                }}
              >
                <option value="stacked">Stacked</option>
                <option value="two-staves">Two Staves</option>
              </select>
            </div>
          </div>
          <div className="dpgen-toolbar__menu-divider" />
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item"
            onClick={() => {
              setSettingsDropdownOpen(false);
              setShowAudioSettings(true);
            }}
          >
            <i className="fas fa-volume-up" /> Audio Settings
          </button>
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item"
            onClick={() => {
              setSettingsDropdownOpen(false);
              setShowPlaybackSettings(true);
            }}
          >
            <i className="fas fa-sliders-h" /> Playback Settings
          </button>
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item"
            onClick={() => {
              setSettingsDropdownOpen(false);
              setShowApiSyncSettings(true);
            }}
            style={apiSyncEnabled ? { color: 'var(--dpgen-primary)' } : {}}
          >
            <i className={`fas fa-cloud${apiSyncEnabled ? '-check' : ''}`} /> 
            Cloud Sync
            {apiSyncEnabled && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
                (Enabled)
              </span>
            )}
          </button>
          <button 
            type="button" 
            className="dpgen-toolbar__menu-item"
            onClick={() => {
              setSettingsDropdownOpen(false);
              setShowMIDIMapping(true);
            }}
          >
            <i className="fas fa-keyboard" /> MIDI Note Mapping
          </button>
        </ToolbarDropdown>
      </ToolbarGroup>

      {/* Practice Stats */}
      {midiPracticeEnabled && (
        <ToolbarGroup>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            padding: '0 0.5rem',
            fontSize: '0.875rem',
            color: 'var(--dpgen-text)'
          }}>
            {/* Calculate stats */}
            {(() => {
              const hits = midiPractice.actualHits || [];
              const expected = midiPractice.expectedNotes?.length || 0;
              const matched = midiPractice.expectedNotes?.filter((n) => n.matched).length || 0;
              const accuracy = expected > 0 ? Math.round((matched / expected) * 100) : 0;
              const matchedHits = hits.filter(h => h.matched);
              const timingErrors = matchedHits.length > 0 ? matchedHits.map((h) => Math.abs(h.timingError)) : [];
              const avgTimingError = timingErrors.length > 0
                ? timingErrors.reduce((sum, err) => sum + err, 0) / timingErrors.length
                : 0;
              
              return (
                <>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    color: expected > 0 ? (accuracy >= 90 ? '#10b981' : accuracy >= 70 ? '#f59e0b' : '#ef4444') : undefined
                  }}>
                    <i className="fas fa-bullseye" />
                    <span style={{ fontWeight: 600 }}>{accuracy}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <i className="fas fa-drum" />
                    <span>{matched} / {expected || '--'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <i className="fas fa-clock" />
                    <span>{avgTimingError > 0 ? `±${Math.round(avgTimingError)}ms` : '--'}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </ToolbarGroup>
      )}

      {/* Microphone Practice Stats */}
      {microphonePracticeEnabled && (
        <ToolbarGroup>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            padding: '0 0.5rem',
            fontSize: '0.875rem',
            color: 'var(--dpgen-text)'
          }}>
            {/* Calculate stats */}
            {(() => {
              const hits = microphonePractice.actualHits || [];
              const expected = microphonePractice.expectedNotes?.length || 0;
              const matched = microphonePractice.expectedNotes?.filter((n) => n.matched).length || 0;
              const accuracy = expected > 0 ? Math.round((matched / expected) * 100) : 0;
              const matchedHits = hits.filter(h => h.matched);
              const timingErrors = matchedHits.length > 0 ? matchedHits.map((h) => Math.abs(h.timingError)) : [];
              const avgTimingError = timingErrors.length > 0
                ? timingErrors.reduce((sum, err) => sum + err, 0) / timingErrors.length
                : 0;
              
              return (
                <>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    color: expected > 0 ? (accuracy >= 90 ? '#10b981' : accuracy >= 70 ? '#f59e0b' : '#ef4444') : undefined
                  }}>
                    <i className="fas fa-bullseye" />
                    <span style={{ fontWeight: 600 }}>{accuracy}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <i className="fas fa-microphone-alt" />
                    <span>{matched} / {expected || '--'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <i className="fas fa-clock" />
                    <span>{avgTimingError > 0 ? `±${Math.round(avgTimingError)}ms` : '--'}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </ToolbarGroup>
      )}

      {/* View Options */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={toggleDarkMode}
          title="Toggle dark mode"
          icon={darkMode ? 'fas fa-sun' : 'fas fa-moon'}
        />
        <Tooltip content="Keyboard shortcuts (?)">
          <ToolbarButton
            onClick={() => setShowKeyboardShortcuts(true)}
            title="Keyboard Shortcuts"
            icon="fas fa-keyboard"
          />
        </Tooltip>
      </ToolbarGroup>

      {/* Authentication */}
      <ToolbarGroup>
        <AuthButton />
      </ToolbarGroup>
      
      {/* MIDI Practice Modal */}
      {midiPracticeOpen && (
        <MIDIPractice onClose={() => setMidiPracticeOpen(false)} />
      )}

      {/* Microphone Practice Modal */}
      {microphonePracticeOpen && (
        <MicrophonePractice 
          onClose={() => setMicrophonePracticeOpen(false)} 
          isOpen={microphonePracticeOpen}
        />
      )}

      {/* Presets Browser Modal */}
      {showPresetsBrowser && (
        <PresetsBrowser onClose={() => setShowPresetsBrowser(false)} />
      )}

      {/* Combine Presets Modal */}
      {showCombinePresets && (
        <CombinePresets onClose={() => setShowCombinePresets(false)} />
      )}

      {/* Save Pattern Modal */}
      {showSavePattern && (
        <SavePatternModal onClose={() => setShowSavePattern(false)} />
      )}

      {/* Learning Paths Modal */}
      {showLearningPaths && (
        <LearningPathModal onClose={() => setShowLearningPaths(false)} />
      )}

      {/* Polyrhythm Builder Modal */}
      {showPolyrhythmBuilder && (
        <PolyrhythmBuilder onClose={() => setShowPolyrhythmBuilder(false)} />
      )}

      {/* Audio Settings Modal */}
      {showAudioSettings && (
        <AudioSettingsModal onClose={() => setShowAudioSettings(false)} />
      )}

      {/* Playback Settings Modal */}
      {showPlaybackSettings && (
        <PlaybackSettingsModal onClose={() => setShowPlaybackSettings(false)} />
      )}
      {/* API Sync Settings Modal */}
      {showApiSyncSettings && (
        <ApiSyncSettingsModal onClose={() => setShowApiSyncSettings(false)} />
      )}

      {/* MIDI Mapping Editor Modal */}
      {showMIDIMapping && (
        <MIDIMappingEditor onClose={() => setShowMIDIMapping(false)} />
      )}

      {/* MIDI Recording Modal */}
      {midiRecordingOpen && (
        <MIDIRecording onClose={() => setMidiRecordingOpen(false)} />
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />
    </div>
  );
}

