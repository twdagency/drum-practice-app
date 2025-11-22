'use client';

/**
 * Store Testing Page
 * This page tests the Zustand store functionality
 */

import { useStore } from '@/store/useStore';

export default function TestStorePage() {
  // Test Pattern Slice
  const patterns = useStore((state) => state.patterns);
  const addPattern = useStore((state) => state.addPattern);
  const removePattern = useStore((state) => state.removePattern);
  const updatePattern = useStore((state) => state.updatePattern);
  const clearPatterns = useStore((state) => state.clearPatterns);
  const duplicatePattern = useStore((state) => state.duplicatePattern);
  const saveToHistory = useStore((state) => state.saveToHistory);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const historyIndex = useStore((state) => state.historyIndex);
  const history = useStore((state) => state.history);

  // Test Playback Slice
  const bpm = useStore((state) => state.bpm);
  const isPlaying = useStore((state) => state.isPlaying);
  const setBPM = useStore((state) => state.setBPM);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const volumes = useStore((state) => state.volumes);
  const setVolume = useStore((state) => state.setVolume);

  // Test UI Slice
  const darkMode = useStore((state) => state.darkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const showGridLines = useStore((state) => state.showGridLines);
  const setShowGridLines = useStore((state) => state.setShowGridLines);

  // Test Practice Slice
  const midiPractice = useStore((state) => state.midiPractice);
  const setMIDIPracticeEnabled = useStore((state) => state.setMIDIPracticeEnabled);
  const microphonePractice = useStore((state) => state.microphonePractice);
  const setMicrophoneSensitivity = useStore((state) => state.setMicrophoneSensitivity);

  const handleAddPattern = () => {
    addPattern({
      id: Date.now(),
      timeSignature: '4/4',
      subdivision: 16,
      phrase: '4 4 4 4',
      drumPattern: 'S S K S',
      stickingPattern: 'R L R L',
      leftFoot: false,
      rightFoot: false,
      repeat: 1,
      _expanded: true,
    });
    saveToHistory();
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Zustand Store Test Page</h1>

      {/* Pattern Slice Tests */}
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Pattern Slice</h2>
        <div className="space-y-4">
          <div>
            <p className="font-medium">Patterns Count: {patterns.length}</p>
            <p className="text-sm text-gray-600">History Index: {historyIndex} / {history.length - 1}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleAddPattern}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Pattern
            </button>
            <button
              onClick={() => {
                if (patterns.length > 0) {
                  removePattern(patterns[0].id);
                  saveToHistory();
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={patterns.length === 0}
            >
              Remove First Pattern
            </button>
            <button
              onClick={() => {
                if (patterns.length > 0) {
                  duplicatePattern(patterns[0].id);
                  saveToHistory();
                }
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={patterns.length === 0}
            >
              Duplicate First Pattern
            </button>
            <button
              onClick={() => {
                if (patterns.length > 0) {
                  updatePattern(patterns[0].id, { repeat: patterns[0].repeat + 1 });
                  saveToHistory();
                }
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              disabled={patterns.length === 0}
            >
              Update First Pattern (Repeat +1)
            </button>
            <button
              onClick={() => {
                clearPatterns();
                saveToHistory();
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear All
            </button>
            <button
              onClick={undo}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              disabled={historyIndex <= 0}
            >
              Undo
            </button>
            <button
              onClick={redo}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              disabled={historyIndex >= history.length - 1}
            >
              Redo
            </button>
          </div>
          <div className="mt-4">
            <h3 className="font-medium mb-2">Patterns:</h3>
            <div className="space-y-2">
              {patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="p-2 bg-gray-100 rounded text-sm"
                >
                  <p>
                    ID: {pattern.id} | {pattern.timeSignature} | {pattern.drumPattern} | Repeat: {pattern.repeat}
                  </p>
                </div>
              ))}
              {patterns.length === 0 && (
                <p className="text-gray-500 italic">No patterns yet. Click "Add Pattern" to create one.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Playback Slice Tests */}
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Playback Slice</h2>
        <div className="space-y-4">
          <div>
            <p className="font-medium">BPM: {bpm}</p>
            <p className="font-medium">Is Playing: {isPlaying ? 'Yes' : 'No'}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setBPM(bpm + 5)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              BPM +5
            </button>
            <button
              onClick={() => setBPM(bpm - 5)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              BPM -5
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Toggle Play
            </button>
          </div>
          <div className="mt-4">
            <h3 className="font-medium mb-2">Volumes:</h3>
            <div className="space-y-2">
              {Object.entries(volumes).map(([key, value]) => (
                <div key={key} className="flex items-center gap-4">
                  <span className="w-24 capitalize">{key}:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={value}
                    onChange={(e) => setVolume(key as keyof typeof volumes, parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{(value * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* UI Slice Tests */}
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">UI Slice</h2>
        <div className="space-y-4">
          <div>
            <p className="font-medium">Dark Mode: {darkMode ? 'Enabled' : 'Disabled'}</p>
            <p className="font-medium">Show Grid Lines: {showGridLines ? 'Yes' : 'No'}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={toggleDarkMode}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
            >
              Toggle Dark Mode
            </button>
            <button
              onClick={() => setShowGridLines(!showGridLines)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Toggle Grid Lines
            </button>
          </div>
        </div>
      </section>

      {/* Practice Slice Tests */}
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Practice Slice</h2>
        <div className="space-y-4">
          <div>
            <p className="font-medium">MIDI Practice Enabled: {midiPractice.enabled ? 'Yes' : 'No'}</p>
            <p className="font-medium">MIDI Accuracy Window: {midiPractice.accuracyWindow}ms</p>
            <p className="font-medium">MIDI Latency Adjustment: {midiPractice.latencyAdjustment}ms</p>
          </div>
          <div>
            <p className="font-medium">Microphone Practice Enabled: {microphonePractice.enabled ? 'Yes' : 'No'}</p>
            <p className="font-medium">Microphone Sensitivity: {microphonePractice.sensitivity}</p>
            <p className="font-medium">Microphone Threshold: {microphonePractice.threshold.toFixed(2)}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setMIDIPracticeEnabled(!midiPractice.enabled)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Toggle MIDI Practice
            </button>
            <button
              onClick={() => setMicrophoneSensitivity(microphonePractice.sensitivity + 10)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Mic Sensitivity +10
            </button>
            <button
              onClick={() => setMicrophoneSensitivity(microphonePractice.sensitivity - 10)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Mic Sensitivity -10
            </button>
          </div>
        </div>
      </section>

      {/* Store State Summary */}
      <section className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-2xl font-semibold mb-4">Store State Summary</h2>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Patterns:</strong> {patterns.length} | <strong>History:</strong> {history.length} entries |{' '}
            <strong>Index:</strong> {historyIndex}
          </p>
          <p>
            <strong>BPM:</strong> {bpm} | <strong>Playing:</strong> {isPlaying ? 'Yes' : 'No'} |{' '}
            <strong>Dark Mode:</strong> {darkMode ? 'On' : 'Off'}
          </p>
          <p>
            <strong>MIDI Practice:</strong> {midiPractice.enabled ? 'Enabled' : 'Disabled'} |{' '}
            <strong>Mic Practice:</strong> {microphonePractice.enabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </section>
    </div>
  );
}

