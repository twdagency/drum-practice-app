'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { PatternList } from '@/components/PatternList/PatternList';
import { PolyrhythmList } from '@/components/PolyrhythmList/PolyrhythmList';
import { Stave } from '@/components/Stave/Stave';
import { VisualMetronome } from '@/components/VisualMetronome/VisualMetronome';
import { PolyrhythmShapes } from '@/components/PolyrhythmShapes/PolyrhythmShapes';
import { PracticeSticking } from '@/components/shared/PracticeSticking/PracticeSticking';
import { PracticeVoicing } from '@/components/shared/PracticeVoicing/PracticeVoicing';
import { useAudioLoader } from '@/hooks/useAudioLoader';
import { usePlayback } from '@/hooks/usePlayback';
import { useMIDIPractice } from '@/hooks/useMIDIPractice';
import { useMicrophonePractice } from '@/hooks/useMicrophonePractice';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePracticeStats } from '@/hooks/usePracticeStats';
import { PlaybackProgress } from '@/components/shared/PlaybackProgress';
import { useStore } from '@/store/useStore';
import { buildAccentIndices, parseNumberList } from '@/lib/utils/patternUtils';

// Import store directly to access getState outside of components
const getStoreState = () => useStore.getState();
import { PracticeStats } from '@/components/PracticeMode/PracticeStats';
import { PatternLibrary } from '@/components/PracticeMode/PatternLibrary';
import { AutoSyncWrapper } from '@/components/shared/AutoSyncWrapper';
import { ProgressTrackingWrapper } from '@/components/shared/ProgressTrackingWrapper';
import { QuickControlPanel } from '@/components/shared/QuickControlPanel';
import { AuthButton } from '@/components/auth/AuthButton';

export default function App() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const darkMode = useStore((state) => state.darkMode);
  const polyrhythmPatterns = useStore((state) => state.polyrhythmPatterns);
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
  const addPattern = useStore((state) => state.addPattern);
  const setPatterns = useStore((state) => state.setPatterns);
  const setBPM = useStore((state) => state.setBPM);
  const notationViewMode = useStore((state) => state.notationViewMode);
  const setNotationViewMode = useStore((state) => state.setNotationViewMode);
  const practiceViewNotesAhead = useStore((state) => state.practiceViewNotesAhead);
  const setPracticeViewNotesAhead = useStore((state) => state.setPracticeViewNotesAhead);
  const practiceViewVisualFeedback = useStore((state) => state.practiceViewVisualFeedback);
  const setPracticeViewVisualFeedback = useStore((state) => state.setPracticeViewVisualFeedback);
  const practiceViewShowTimingErrors = useStore((state) => state.practiceViewShowTimingErrors);
  const setPracticeViewShowTimingErrors = useStore((state) => state.setPracticeViewShowTimingErrors);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load persisted UI settings synchronously on mount (client-side only)
  // Check localStorage immediately if on client
  // IMPORTANT: All hooks must be called before any conditional returns
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
  
  // Track practice statistics
  usePracticeStats();

  // Load patterns from URL hash on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const hash = window.location.hash;
    if (hash && hash.startsWith('#pattern=')) {
      try {
        const encoded = hash.substring(9); // Remove '#pattern='
        // Restore URL-safe base64 (replace - with +, _ with /, add padding if needed)
        const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(padded);
        const shareData = JSON.parse(decoded);
        
        if (shareData.patterns && Array.isArray(shareData.patterns)) {
          // Import patterns - batch them to avoid multiple re-renders
          const patternsToAdd = shareData.patterns.map((p: any, index: number) => {
            // Calculate accent indices from phrase (needed for stave rendering)
            const phraseValues = parseNumberList(p.phr || '');
            const accentIndices = buildAccentIndices(phraseValues);
            
            return {
              id: Date.now() + index,
              timeSignature: p.ts || '4/4',
              subdivision: p.sub || 16,
              phrase: p.phr || '',
              drumPattern: p.drum || '',
              stickingPattern: p.stick || '',
              leftFoot: p.lf || false,
              rightFoot: p.rf || false,
              repeat: p.rep || 1,
              _presetAccents: accentIndices, // Required for stave rendering
            };
          });
          
          // Get current patterns and add new ones all at once
          // This ensures the stave component gets all patterns in one update
          const currentPatterns = getStoreState().patterns;
          setPatterns([...currentPatterns, ...patternsToAdd]);
          
          // Set BPM if provided
          if (shareData.bpm) {
            setBPM(shareData.bpm);
          }
          
          // Clear the hash to prevent re-importing on refresh
          window.history.replaceState(null, '', window.location.pathname);
          
          // Force a resize event after a delay to ensure stave container is properly sized
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 300);
        }
      } catch (error) {
        console.error('Failed to import patterns from URL:', error);
      }
    }
  }, [addPattern, setBPM, setPatterns]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    if (status === 'unauthenticated' || !session) {
      router.push('/login?callbackUrl=/app');
    }
  }, [status, session, router]);

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render app if not authenticated (redirect will happen)
  if (!session) {
    return null;
  }

  // Initialize progress tracking (ToastProvider is now in root layout)

  return (
    <>
      <AutoSyncWrapper />
      <ProgressTrackingWrapper />
      {/* Auth Button - Top Right */}
      {/* Temporarily hidden - Sign in/Sign up buttons */}
      {/* <div
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
        }}
      >
        <AuthButton />
      </div> */}
      <main className="min-h-screen">
        <div className="container mx-auto p-4">
        {/* Toolbar Component */}
        <Toolbar />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 dpgen-main-grid" style={{ width: '100%', boxSizing: 'border-box' }}>
          {/* Pattern List Component */}
          <div className="lg:col-span-1 dpgen-patterns-column" style={{ minWidth: 0, overflow: 'hidden', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="dpgen-card" style={{ padding: '1.5rem', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
              <h2 className="text-2xl font-semibold mb-4">Patterns</h2>
              <PatternList />
            </div>
            
            {/* Polyrhythm List Component - Only show if there are polyrhythm patterns */}
            {polyrhythmPatterns && polyrhythmPatterns.length > 0 && (
              <div className="dpgen-card" style={{ padding: '1.5rem', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                <h2 className="text-2xl font-semibold mb-4">Polyrhythms</h2>
                <PolyrhythmList />
              </div>
            )}
            
            {/* Practice Statistics */}
            <PracticeStats />
            
            {/* Pattern Library */}
            <PatternLibrary />
          </div>
          
          {/* Stave Component */}
          <div className="lg:col-span-2 dpgen-stave-column" style={{ minWidth: 0, overflow: 'hidden', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div className="dpgen-card" style={{ padding: '1.5rem', width: '100%', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, borderRadius: 'var(--dpgen-radius, 14px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 className="text-2xl font-semibold">Music Notation</h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '0.875rem', color: darkMode ? '#cbd5e1' : '#64748b', marginRight: '0.5rem' }}>
                    View:
                  </label>
                  <select
                    value={notationViewMode}
                    onChange={(e) => setNotationViewMode(e.target.value as 'notation' | 'sticking' | 'voicing')}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      color: darkMode ? '#f1f5f9' : '#1e293b',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="notation">Notation</option>
                    <option value="sticking">Practice Sticking</option>
                    <option value="voicing">Practice Voicing</option>
                  </select>
                  {(notationViewMode === 'sticking' || notationViewMode === 'voicing') && (
                    <>
                      <label style={{ fontSize: '0.875rem', color: darkMode ? '#cbd5e1' : '#64748b', marginLeft: '0.5rem', marginRight: '0.5rem' }}>
                        Notes Ahead:
                      </label>
                      <select
                        value={practiceViewNotesAhead}
                        onChange={(e) => setPracticeViewNotesAhead(Number(e.target.value))}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
                          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                          color: darkMode ? '#f1f5f9' : '#1e293b',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="0">All</option>
                        <option value="8">8 notes</option>
                        <option value="12">12 notes</option>
                        <option value="16">16 notes</option>
                        <option value="24">24 notes</option>
                        <option value="32">32 notes</option>
                      </select>
                      <label style={{ fontSize: '0.875rem', color: darkMode ? '#cbd5e1' : '#64748b', marginLeft: '1rem', marginRight: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={practiceViewVisualFeedback}
                          onChange={(e) => setPracticeViewVisualFeedback(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        Accuracy Colors
                      </label>
                      <label style={{ fontSize: '0.875rem', color: darkMode ? '#cbd5e1' : '#64748b', marginLeft: '0.5rem', marginRight: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={practiceViewShowTimingErrors}
                          onChange={(e) => setPracticeViewShowTimingErrors(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        Timing (ms)
                      </label>
                    </>
                  )}
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                {notationViewMode === 'notation' && <Stave />}
                {notationViewMode === 'sticking' && <PracticeSticking />}
                {notationViewMode === 'voicing' && <PracticeVoicing />}
                {settingsLoaded && <VisualMetronome />}
                {settingsLoaded && <PolyrhythmShapes />}
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </main>
    </>
  )
}
