'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { PatternList } from '@/components/PatternList/PatternList';
import { PolyrhythmList } from '@/components/PolyrhythmList/PolyrhythmList';
import { Stave } from '@/components/Stave/Stave';
import { VisualMetronome } from '@/components/VisualMetronome/VisualMetronome';
import { PolyrhythmShapes } from '@/components/PolyrhythmShapes/PolyrhythmShapes';
import { useAudioLoader } from '@/hooks/useAudioLoader';
import { usePlayback } from '@/hooks/usePlayback';
import { useMIDIPractice } from '@/hooks/useMIDIPractice';
import { useMicrophonePractice } from '@/hooks/useMicrophonePractice';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { PlaybackProgress } from '@/components/shared/PlaybackProgress';
import { useStore } from '@/store/useStore';
import { PracticeStats } from '@/components/PracticeMode/PracticeStats';
import { PatternLibrary } from '@/components/PracticeMode/PatternLibrary';
import { AutoSyncWrapper } from '@/components/shared/AutoSyncWrapper';
import { ProgressTrackingWrapper } from '@/components/shared/ProgressTrackingWrapper';

export default function Home() {
  const darkMode = useStore((state) => state.darkMode);
  const setShowVisualMetronome = useStore((state) => state.setShowVisualMetronome);
  const setShowPolyrhythmShapes = useStore((state) => state.setShowPolyrhythmShapes);
  const setShowGridLines = useStore((state) => state.setShowGridLines);
  const setShowMeasureNumbers = useStore((state) => state.setShowMeasureNumbers);
  const setScrollAnimationEnabled = useStore((state) => state.setScrollAnimationEnabled);
  const setStaveZoom = useStore((state) => state.setStaveZoom);
  const setDarkMode = useStore((state) => state.setDarkMode);
  const setIsFullscreen = useStore((state) => state.setIsFullscreen);
  const setPracticePadMode = useStore((state) => state.setPracticePadMode);
  const setPlayDrumSounds = useStore((state) => state.setPlayDrumSounds);
  const setClickSoundType = useStore((state) => state.setClickSoundType);
  const setClickMode = useStore((state) => state.setClickMode);
  const setVolumes = useStore((state) => state.setVolumes);
  const setCountInEnabled = useStore((state) => state.setCountInEnabled);
  const setMetronomeOnlyMode = useStore((state) => state.setMetronomeOnlyMode);
  const setSilentPracticeMode = useStore((state) => state.setSilentPracticeMode);
  const setSlowMotionEnabled = useStore((state) => state.setSlowMotionEnabled);
  const setSlowMotionSpeed = useStore((state) => state.setSlowMotionSpeed);
  const setPlayBackwards = useStore((state) => state.setPlayBackwards);
  const setLoopCount = useStore((state) => state.setLoopCount);
  const setTempoRamping = useStore((state) => state.setTempoRamping);
  const setTempoRampStart = useStore((state) => state.setTempoRampStart);
  const setTempoRampEnd = useStore((state) => state.setTempoRampEnd);
  const setTempoRampSteps = useStore((state) => state.setTempoRampSteps);
  const setProgressiveMode = useStore((state) => state.setProgressiveMode);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load persisted UI settings synchronously on mount (client-side only)
  // Check localStorage immediately if on client
  useEffect(() => {
    if (typeof window === 'undefined') {
      setSettingsLoaded(true);
      return;
    }

    try {
      const settings = window.localStorage.getItem('dpgen_ui_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        // Apply all persisted settings immediately
        if (parsed.showVisualMetronome !== undefined) {
          setShowVisualMetronome(parsed.showVisualMetronome);
        }
        if (parsed.showPolyrhythmShapes !== undefined) {
          setShowPolyrhythmShapes(parsed.showPolyrhythmShapes);
        }
        if (parsed.showGridLines !== undefined) {
          setShowGridLines(parsed.showGridLines);
        }
        if (parsed.showMeasureNumbers !== undefined) {
          setShowMeasureNumbers(parsed.showMeasureNumbers);
        }
        if (parsed.scrollAnimationEnabled !== undefined) {
          setScrollAnimationEnabled(parsed.scrollAnimationEnabled);
        }
        if (parsed.staveZoom !== undefined) {
          setStaveZoom(parsed.staveZoom);
        }
        if (parsed.darkMode !== undefined) {
          setDarkMode(parsed.darkMode);
        }
        if (parsed.isFullscreen !== undefined) {
          setIsFullscreen(parsed.isFullscreen);
        }
        if (parsed.practicePadMode !== undefined) {
          setPracticePadMode(parsed.practicePadMode);
        }
      }

      // Load persisted audio/playback settings
      const playbackSettings = window.localStorage.getItem('dpgen_playback_settings');
      if (playbackSettings) {
        const parsed = JSON.parse(playbackSettings);
        if (parsed.playDrumSounds !== undefined) {
          setPlayDrumSounds(parsed.playDrumSounds);
        }
        if (parsed.clickSoundType !== undefined) {
          setClickSoundType(parsed.clickSoundType);
        }
        if (parsed.clickMode !== undefined) {
          setClickMode(parsed.clickMode);
        }
        if (parsed.volumes !== undefined) {
          setVolumes(parsed.volumes);
        }
        if (parsed.countInEnabled !== undefined) {
          setCountInEnabled(parsed.countInEnabled);
        }
        if (parsed.metronomeOnlyMode !== undefined) {
          setMetronomeOnlyMode(parsed.metronomeOnlyMode);
        }
        if (parsed.silentPracticeMode !== undefined) {
          setSilentPracticeMode(parsed.silentPracticeMode);
        }
        if (parsed.slowMotionEnabled !== undefined) {
          setSlowMotionEnabled(parsed.slowMotionEnabled);
        }
        if (parsed.slowMotionSpeed !== undefined) {
          setSlowMotionSpeed(parsed.slowMotionSpeed);
        }
        if (parsed.playBackwards !== undefined) {
          setPlayBackwards(parsed.playBackwards);
        }
        if (parsed.loopCount !== undefined) {
          setLoopCount(parsed.loopCount);
        }
        if (parsed.tempoRamping !== undefined) {
          setTempoRamping(parsed.tempoRamping);
        }
        if (parsed.tempoRampStart !== undefined) {
          setTempoRampStart(parsed.tempoRampStart);
        }
        if (parsed.tempoRampEnd !== undefined) {
          setTempoRampEnd(parsed.tempoRampEnd);
        }
        if (parsed.tempoRampSteps !== undefined) {
          setTempoRampSteps(parsed.tempoRampSteps);
        }
        if (parsed.progressiveMode !== undefined) {
          setProgressiveMode(parsed.progressiveMode);
        }
      }
    } catch (e) {
      console.error('Failed to load persisted settings:', e);
    } finally {
      setSettingsLoaded(true);
    }
  }, [setShowVisualMetronome, setShowPolyrhythmShapes, setShowGridLines, setShowMeasureNumbers, setScrollAnimationEnabled, setStaveZoom, setDarkMode, setIsFullscreen, setPlayDrumSounds, setClickSoundType, setClickMode, setVolumes, setCountInEnabled, setMetronomeOnlyMode, setSilentPracticeMode, setSlowMotionEnabled, setSlowMotionSpeed, setPlayBackwards, setLoopCount, setTempoRamping, setTempoRampStart, setTempoRampEnd, setTempoRampSteps, setProgressiveMode]);

  // Apply dark mode class when it changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dpgen-dark-mode');
      } else {
        document.documentElement.classList.remove('dpgen-dark-mode');
      }
    }
  }, [darkMode]);

  // Load audio buffers on mount
  useAudioLoader();
  
  // Initialize playback hook
  usePlayback();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();
  
  // Initialize MIDI practice hook (must be in a component that stays mounted)
  useMIDIPractice();
  
  // Initialize microphone practice hook (must be in a component that stays mounted)
  useMicrophonePractice();
  
  // Initialize progress tracking (ToastProvider is now in root layout)

  return (
    <>
      <AutoSyncWrapper />
      <ProgressTrackingWrapper />
      <main className="min-h-screen">
        <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-4">Drum Practice Generator</h1>
        <p className="text-lg text-gray-600 mb-6">
          Generate and practice drumming patterns with real-time feedback
        </p>
        
        {/* Toolbar Component */}
        <Toolbar />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 dpgen-main-grid" style={{ width: '100%', boxSizing: 'border-box' }}>
          {/* Pattern List Component */}
          <div className="lg:col-span-1 dpgen-patterns-column" style={{ minWidth: 0, overflow: 'hidden', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="dpgen-card" style={{ padding: '1.5rem', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
              <h2 className="text-2xl font-semibold mb-4">Patterns</h2>
              <PatternList />
            </div>
            
            {/* Practice Statistics */}
            <PracticeStats />
            
            {/* Pattern Library */}
            <PatternLibrary />
            
            {/* Polyrhythm List Component */}
            <div className="dpgen-card" style={{ padding: '1.5rem', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
              <h2 className="text-2xl font-semibold mb-4">Polyrhythms</h2>
              <PolyrhythmList />
            </div>
          </div>
          
          {/* Stave Component */}
          <div className="lg:col-span-2 dpgen-stave-column" style={{ minWidth: 0, overflow: 'hidden', width: '100%', position: 'relative' }}>
            <div className="dpgen-card" style={{ padding: '1.5rem', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
              <h2 className="text-2xl font-semibold mb-4">Music Notation</h2>
              <Stave />
              {settingsLoaded && <VisualMetronome />}
              {settingsLoaded && <PolyrhythmShapes />}
            </div>
          </div>
        </div>
        
      </div>
    </main>
    </>
  )
}

