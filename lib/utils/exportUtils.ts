/**
 * Export utilities for patterns
 * Converted from WordPress plugin export functions
 */

import { Pattern } from '@/types';
import { parseNumberList, parseTokens, buildAccentIndices } from './patternUtils';

// Toast notification helper - will be set by the app
let toastCallback: ((message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) | null = null;

export function setExportToastCallback(callback: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) {
  toastCallback = callback;
}

function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  if (toastCallback) {
    toastCallback(message, type);
  } else {
    // Fallback to alert if toast not available
    alert(message);
  }
}

/**
 * Export SVG from stave element
 */
export function exportSVG(staveElement: HTMLElement | null): void {
  if (!staveElement) {
    showToast('No pattern to export. Please generate a pattern first.', 'warning');
    return;
  }

  const svg = staveElement.querySelector('svg');
  if (!svg) {
    showToast('No pattern to export. Please generate a pattern first.', 'warning');
    return;
  }

  try {
    // Clone SVG to avoid modifying original
    const clonedSvg = svg.cloneNode(true) as SVGElement;
    
    // Get SVG as string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    
    // Create blob and download
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drum-pattern-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('SVG export error:', error);
    showToast('Failed to export SVG: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
  }
}

/**
 * Export PDF from stave element
 * Uses browser's print functionality for PDF generation
 */
export function exportPDF(staveElement: HTMLElement | null): void {
  if (!staveElement) {
    showToast('No pattern to export. Please generate a pattern first.', 'warning');
    return;
  }

  const svg = staveElement.querySelector('svg');
  if (!svg) {
    showToast('No pattern to export. Please generate a pattern first.', 'warning');
    return;
  }

  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to export PDF', 'warning');
      return;
    }

    // Clone SVG and prepare for printing
    const clonedSvg = svg.cloneNode(true) as SVGElement;
    const bbox = svg.getBBox();
    const width = bbox.width + 80;
    const height = bbox.height + 80;

    // Set SVG attributes for print
    clonedSvg.setAttribute('width', width.toString());
    clonedSvg.setAttribute('height', height.toString());
    clonedSvg.setAttribute('viewBox', `${bbox.x - 40} ${bbox.y - 40} ${width} ${height}`);

    // Create print-friendly HTML
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Drum Pattern</title>
          <style>
            @media print {
              @page {
                margin: 20mm;
                size: A4 landscape;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              background: white;
            }
            svg {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${clonedSvg.outerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        showToast('PDF export ready. Use your browser\'s print dialog to save as PDF.', 'info');
      }, 250);
    };
  } catch (error) {
    console.error('PDF export error:', error);
    showToast('Failed to export PDF: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
  }
}

/**
 * Export PNG from stave element
 */
export function exportPNG(staveElement: HTMLElement | null): void {
  if (!staveElement) {
    showToast('No pattern to export. Please generate a pattern first.', 'warning');
    return;
  }

  const svg = staveElement.querySelector('svg');
  if (!svg) {
    showToast('No pattern to export. Please generate a pattern first.', 'warning');
    return;
  }

  try {
    // Clone SVG
    const clonedSvg = svg.cloneNode(true) as SVGElement;
    
    // Get SVG dimensions
    const bbox = svg.getBBox();
    const width = bbox.width + 40; // Add padding
    const height = bbox.height + 40;
    
    // Set SVG attributes for export
    clonedSvg.setAttribute('width', width.toString());
    clonedSvg.setAttribute('height', height.toString());
    clonedSvg.setAttribute('viewBox', `${bbox.x - 20} ${bbox.y - 20} ${width} ${height}`);
    
    // Convert SVG to data URL
    const svgString = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    // Create image and convert to canvas
    const img = new Image();
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        
        // Download PNG
        canvas.toBlob(function(blob) {
          if (!blob) {
            showToast('Failed to create PNG blob', 'error');
            return;
          }
          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `drum-pattern-${Date.now()}.png`;
          link.click();
          URL.revokeObjectURL(pngUrl);
          URL.revokeObjectURL(url);
        }, 'image/png');
      } catch (error) {
        console.error('PNG export error:', error);
        alert('Failed to export PNG: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };
    img.onerror = function() {
      showToast('Failed to load SVG for PNG export', 'error');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  } catch (error) {
    console.error('PNG export error:', error);
    showToast('Failed to export PNG: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
  }
}

/**
 * Standard General MIDI drum map
 */
const MIDI_DRUM_MAP: Record<string, number> = {
  'K': 36,  // Kick (C2)
  'S': 38,  // Snare (D2)
  'T': 48,  // High Tom (C3)
  'F': 41,  // Floor Tom (F2)
  'H': 42,  // Hi-Hat Closed (F#2)
  'O': 46   // Hi-Hat Open (B2)
};

/**
 * Export MIDI file from patterns
 */
export function exportMIDI(patterns: Pattern[], bpm: number): void {
  if (patterns.length === 0) {
    showToast('No patterns to export. Please add a pattern first.', 'warning');
    return;
  }

  try {
    const timeSignature = patterns[0]?.timeSignature || '4/4';
    const [beatsPerMeasure, beatUnit] = timeSignature.split('/').map(Number);
    
    // Calculate ticks per quarter note (standard MIDI resolution)
    const TICKS_PER_QUARTER = 480;
    const ticksPerBeat = TICKS_PER_QUARTER * (4 / beatUnit);
    
    // Build MIDI track
    const tracks: Array<{
      tick: number;
      type: 'noteOn' | 'noteOff';
      channel: number;
      note: number;
      velocity: number;
    }> = [];
    let currentTick = 0;
    
    patterns.forEach((pattern) => {
      const repeat = pattern.repeat || 1;
      const subdivision = pattern.subdivision || 16;
      const phrase = parseNumberList(pattern.phrase || '');
      const drumPattern = parseTokens(pattern.drumPattern || '');
      
      // Get accent indices for this pattern
      const patternAccentIndices = buildAccentIndices(phrase);
      
      // Calculate ticks per note
      const notesPerBeat = subdivision / 4;
      const ticksPerNote = ticksPerBeat / notesPerBeat;
      
      for (let repeatIndex = 0; repeatIndex < repeat; repeatIndex++) {
        let noteIndex = 0;
        
        for (let phraseGroupIndex = 0; phraseGroupIndex < phrase.length; phraseGroupIndex++) {
          const groupLength = phrase[phraseGroupIndex];
          
          for (let i = 0; i < groupLength; i++) {
            const drumToken = drumPattern[noteIndex % drumPattern.length];
            const noteTick = currentTick;
            
            // Handle multiple voicings (e.g., "S T")
            const voicingTokens = drumToken.split(/\s+/).filter(Boolean);
            
            voicingTokens.forEach(token => {
              const upperToken = token.toUpperCase();
              if (upperToken !== 'R' && MIDI_DRUM_MAP[upperToken]) {
                const midiNote = MIDI_DRUM_MAP[upperToken];
                const isAccent = patternAccentIndices.includes(noteIndex);
                const velocity = isAccent ? 100 : 80;
                
                tracks.push({
                  tick: noteTick,
                  type: 'noteOn',
                  channel: 9, // Channel 10 (0-indexed) for drums
                  note: midiNote,
                  velocity: velocity
                });
                
                // Note off after note duration
                tracks.push({
                  tick: noteTick + Math.floor(ticksPerNote * 0.9),
                  type: 'noteOff',
                  channel: 9,
                  note: midiNote,
                  velocity: 0
                });
              }
            });
            
            currentTick += Math.floor(ticksPerNote);
            noteIndex++;
          }
        }
      }
    });
    
    // Sort tracks by tick
    tracks.sort((a, b) => a.tick - b.tick);
    
    // Create MIDI file
    const midiData = createMIDIFile(bpm, TICKS_PER_QUARTER, tracks);
    
    // Download - create a new ArrayBuffer to ensure correct type for Blob
    const buffer = new ArrayBuffer(midiData.length);
    const view = new Uint8Array(buffer);
    view.set(midiData);
    const blob = new Blob([buffer], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drum-pattern-${Date.now()}.mid`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('MIDI export error:', error);
    showToast('Failed to export MIDI file: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
  }
}

/**
 * Create MIDI file from events
 */
function createMIDIFile(bpm: number, ticksPerQuarter: number, events: Array<{
  tick: number;
  type: 'noteOn' | 'noteOff';
  channel: number;
  note: number;
  velocity: number;
}>): Uint8Array {
  const headerChunk = createMIDIHeader(0, 1, ticksPerQuarter); // Format 0 (single track), 1 track, ticks per quarter
  const trackChunk = createMIDITrack(bpm, ticksPerQuarter, events);
  
  // Combine arrays and create Uint8Array with explicit ArrayBuffer
  // Convert Uint8Arrays to regular arrays first to avoid type inference issues
  const headerArray = Array.from(headerChunk);
  const trackArray = Array.from(trackChunk);
  const combined = [...headerArray, ...trackArray];
  const buffer = new ArrayBuffer(combined.length);
  const result = new Uint8Array(buffer);
  result.set(combined);
  return result;
}

/**
 * Create MIDI header chunk
 */
function createMIDIHeader(format: number, numTracks: number, ticksPerQuarter: number): Uint8Array {
  const header = new Uint8Array(14);
  let offset = 0;
  
  // "MThd" signature
  header[offset++] = 0x4D; header[offset++] = 0x54; header[offset++] = 0x68; header[offset++] = 0x64;
  // Header length (always 6)
  header[offset++] = 0x00; header[offset++] = 0x00; header[offset++] = 0x00; header[offset++] = 0x06;
  // Format (0 or 1)
  header[offset++] = (format >> 8) & 0xFF; header[offset++] = format & 0xFF;
  // Number of tracks
  header[offset++] = (numTracks >> 8) & 0xFF; header[offset++] = numTracks & 0xFF;
  // Ticks per quarter note
  header[offset++] = (ticksPerQuarter >> 8) & 0xFF; header[offset++] = ticksPerQuarter & 0xFF;
  
  return header;
}

/**
 * Create MIDI track chunk
 */
function createMIDITrack(bpm: number, ticksPerQuarter: number, events: Array<{
  tick: number;
  type: 'noteOn' | 'noteOff';
  channel: number;
  note: number;
  velocity: number;
}>): Uint8Array {
  // Calculate tempo (microseconds per quarter note)
  const tempo = Math.floor(60000000 / bpm);
  
  // Build track events
  const trackEvents: Array<{
    deltaTime: number;
    type: number;
    metaType?: number;
    note?: number;
    velocity?: number;
    data?: number[];
  }> = [];
  let lastTick = 0;
  
  // Set tempo event
  trackEvents.push({
    deltaTime: 0,
    type: 0xFF,
    metaType: 0x51,
    data: [
      (tempo >> 16) & 0xFF,
      (tempo >> 8) & 0xFF,
      tempo & 0xFF
    ]
  });
  
  // Add note events
  events.forEach(event => {
    const deltaTime = event.tick - lastTick;
    lastTick = event.tick;
    
    if (event.type === 'noteOn') {
      trackEvents.push({
        deltaTime: deltaTime,
        type: 0x99, // Note On on channel 9 (drums)
        note: event.note,
        velocity: event.velocity
      });
    } else if (event.type === 'noteOff') {
      trackEvents.push({
        deltaTime: deltaTime,
        type: 0x89, // Note Off on channel 9
        note: event.note,
        velocity: 0
      });
    }
  });
  
  // End of track
  trackEvents.push({
    deltaTime: 0,
    type: 0xFF,
    metaType: 0x2F,
    data: []
  });
  
  // Convert events to MIDI bytes
  const trackData: number[] = [];
  lastTick = 0;
  
  trackEvents.forEach(event => {
    // Write variable-length delta time
    const deltaTime = event.deltaTime;
    if (deltaTime < 128) {
      trackData.push(deltaTime);
    } else if (deltaTime < 16384) {
      trackData.push((deltaTime >> 7) | 0x80);
      trackData.push(deltaTime & 0x7F);
    } else {
      trackData.push((deltaTime >> 14) | 0x80);
      trackData.push(((deltaTime >> 7) & 0x7F) | 0x80);
      trackData.push(deltaTime & 0x7F);
    }
    
    // Write event
    if (event.type === 0xFF) {
      // Meta event
      trackData.push(0xFF);
      trackData.push(event.metaType!);
      trackData.push(event.data!.length);
      trackData.push(...event.data!);
    } else {
      // MIDI event
      trackData.push(event.type);
      trackData.push(event.note!);
      trackData.push(event.velocity!);
    }
  });
  
  // Create track chunk
  const trackLength = trackData.length;
  const trackChunk = new Uint8Array(8 + trackLength);
  let offset = 0;
  
  // "MTrk" signature
  trackChunk[offset++] = 0x4D; trackChunk[offset++] = 0x54; trackChunk[offset++] = 0x72; trackChunk[offset++] = 0x6B;
  // Track length
  trackChunk[offset++] = (trackLength >> 24) & 0xFF;
  trackChunk[offset++] = (trackLength >> 16) & 0xFF;
  trackChunk[offset++] = (trackLength >> 8) & 0xFF;
  trackChunk[offset++] = trackLength & 0xFF;
  // Track data
  trackData.forEach(byte => {
    trackChunk[offset++] = byte;
  });
  
  return trackChunk;
}

/**
 * Export pattern collection to JSON file
 */
export function exportPatternCollection(patterns: Pattern[], bpm: number): void {
  if (patterns.length === 0) {
    showToast('No patterns to export. Please add a pattern first.', 'warning');
    return;
  }

  try {
    const collection = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      bpm,
      patterns: patterns.map(p => {
        // Remove UI-only properties for export
        const { _expanded, ...exportPattern } = p;
        return exportPattern;
      }),
    };

    const jsonString = JSON.stringify(collection, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drum-patterns-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${patterns.length} pattern${patterns.length !== 1 ? 's' : ''} to JSON file`, 'success');
  } catch (error) {
    console.error('Pattern collection export error:', error);
    showToast('Failed to export pattern collection: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
  }
}

/**
 * Import pattern collection from JSON file
 */
export function importPatternCollection(
  file: File,
  onImport: (patterns: Pattern[], bpm: number) => void
): void {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      const collection = JSON.parse(text);
      
      // Validate structure
      if (!collection.patterns || !Array.isArray(collection.patterns)) {
        showToast('Invalid pattern collection file format', 'error');
        return;
      }

      // Validate and clean patterns
      const importedPatterns: Pattern[] = collection.patterns.map((p: any, index: number) => {
        // Ensure required fields
        const pattern: Pattern = {
          id: Date.now() + index, // Generate new IDs
          timeSignature: p.timeSignature || '4/4',
          subdivision: p.subdivision || 16,
          phrase: p.phrase || '',
          drumPattern: p.drumPattern || '',
          stickingPattern: p.stickingPattern || '',
          leftFoot: p.leftFoot || false,
          rightFoot: p.rightFoot || false,
          repeat: p.repeat || 1,
          _presetName: p._presetName,
          _presetDescription: p._presetDescription,
          _presetAccents: p._presetAccents,
          _polyrhythmRightNotes: p._polyrhythmRightNotes,
          _polyrhythmLeftNotes: p._polyrhythmLeftNotes,
          _advancedMode: p._advancedMode,
          _perBeatSubdivisions: p._perBeatSubdivisions,
          _perBeatVoicing: p._perBeatVoicing,
          _perBeatSticking: p._perBeatSticking,
        };
        return pattern;
      });

      const importedBpm = collection.bpm || 120;
      
      onImport(importedPatterns, importedBpm);
      showToast(`Imported ${importedPatterns.length} pattern${importedPatterns.length !== 1 ? 's' : ''} from file`, 'success');
    } catch (error) {
      console.error('Pattern collection import error:', error);
      showToast('Failed to import pattern collection: ' + (error instanceof Error ? error.message : 'Invalid file format'), 'error');
    }
  };

  reader.onerror = () => {
    showToast('Failed to read file', 'error');
  };

  reader.readAsText(file);
}

/**
 * Share pattern URL
 */
export function sharePatternURL(patterns: Pattern[], bpm: number): void {
  if (patterns.length === 0) {
    showToast('No patterns to share. Please add a pattern first.', 'warning');
    return;
  }
  
  // Encode patterns and settings into URL with compression
  const shareData = {
    patterns: patterns.map(p => ({
      ts: p.timeSignature,
      sub: p.subdivision,
      phr: p.phrase,
      drum: p.drumPattern,
      stick: p.stickingPattern,
      lf: p.leftFoot,
      rf: p.rightFoot,
      rep: p.repeat
    })),
    bpm: bpm,
    highlight: 'accent' // Default highlight mode
  };
  
  // Minify JSON by removing all whitespace
  const minifiedJson = JSON.stringify(shareData).replace(/\s+/g, '');
  
  // Use URL-safe base64 encoding (replace + with -, / with _, remove padding)
  const encoded = btoa(minifiedJson)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const shareUrl = `${window.location.origin}${window.location.pathname}#pattern=${encoded}`;
  
  navigator.clipboard.writeText(shareUrl).then(() => {
    showToast('Shareable URL copied to clipboard!', 'success');
  }).catch(() => {
    // Fallback: show URL in prompt
    const copied = prompt('Copy this URL to share:', shareUrl);
    if (copied) {
      showToast('URL ready to share', 'info');
    }
  });
}

