/**
 * Pattern Fields component
 * Handles all pattern input fields and validation
 */

'use client';

import React, { useState } from 'react';
import { Pattern } from '@/types';
import { useStore } from '@/store/useStore';
import { parseNumberList, formatList, parseTimeSignature, parseTokens, randomizeAccents, calculateNotesPerBar, randomizePerBeatSubdivisions, getNotesPerBarForPattern } from '@/lib/utils/patternUtils';
import { randomSets } from '@/lib/utils/randomSets';
import { commonStickingPatterns, type StickingPattern } from '@/lib/utils/commonStickingPatterns';
import { AccentEditor } from './AccentEditor';
import { PerBeatSubdivisionEditor } from './PerBeatSubdivisionEditor';

interface PatternFieldsProps {
  pattern: Pattern;
}

export function PatternFields({ pattern }: PatternFieldsProps) {
  const updatePattern = useStore((state) => state.updatePattern);
  const saveToHistory = useStore((state) => state.saveToHistory);
  const practicePadMode = useStore((state) => state.practicePadMode);

  const [timeSignatureError, setTimeSignatureError] = useState<string>('');

  const handleRepeatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 16) {
      updatePattern(pattern.id, { repeat: value });
      saveToHistory();
      // TODO: Generate pattern
    }
  };

  const handleTimeSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const isValid = /^\d+\s*\/\s*\d+$/.test(value);
    
    if (isValid) {
      setTimeSignatureError('');
      
      // Calculate new notes per bar from time signature
      const newNotesPerBar = calculateNotesPerBar(value, pattern.subdivision);
      
      // Adjust existing accents to fit new bar length (remove accents beyond new length, keep others)
      const currentAccents = pattern._presetAccents || [];
      const adjustedAccents = currentAccents.filter(acc => acc < newNotesPerBar);
      
      // Update pattern with new time signature and adjusted accents
      // Phrase will be automatically derived from accents by AccentEditor
      updatePattern(pattern.id, { 
        timeSignature: value,
        _presetAccents: adjustedAccents.length > 0 ? adjustedAccents : [], // Keep empty array if all accents removed
      });
      saveToHistory();
    } else if (value.trim() === '') {
      setTimeSignatureError('Time signature is required');
    } else {
      setTimeSignatureError('Time signature must be in format X/Y (e.g., 4/4)');
    }
  };

  const handleTimeSignatureBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value.trim()) {
      setTimeSignatureError('Time signature is required');
    } else if (!/^\d+\s*\/\s*\d+$/.test(value)) {
      setTimeSignatureError('Time signature must be in format X/Y (e.g., 4/4)');
    }
  };

  const handleSubdivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubdivision = parseInt(e.target.value, 10);
    
    // Calculate actual notes per bar from time signature and new subdivision
    const newNotesPerBar = calculateNotesPerBar(pattern.timeSignature || '4/4', newSubdivision);
    
    // Adjust existing accents to fit new bar length
    const currentAccents = pattern._presetAccents || [];
    const adjustedAccents = currentAccents.filter(acc => acc < newNotesPerBar);
    
    updatePattern(pattern.id, { 
      subdivision: newSubdivision,
      _presetAccents: adjustedAccents.length > 0 ? adjustedAccents : [], // Keep empty array if all accents removed
    });
    // Phrase will be automatically derived from accents by AccentEditor

    saveToHistory();
    // TODO: Generate pattern
  };

  const handleAdvancedModeToggle = () => {
    const enabled = !pattern._advancedMode;
    
    if (enabled) {
      // Initialize per-beat subdivisions from current subdivision
      // Number of beats = numerator of time signature
      const [numerator] = parseTimeSignature(pattern.timeSignature || '4/4');
      const perBeatSubdivisions = Array(numerator).fill(pattern.subdivision);
      
      updatePattern(pattern.id, {
        _advancedMode: true,
        _perBeatSubdivisions: perBeatSubdivisions,
      });
    } else {
      // Disable advanced mode, keep current subdivision
      updatePattern(pattern.id, {
        _advancedMode: false,
        _perBeatSubdivisions: undefined,
      });
    }
    
    saveToHistory();
  };

  const handlePerBeatSubdivisionsChange = (subdivisions: number[]) => {
    updatePattern(pattern.id, {
      _perBeatSubdivisions: subdivisions,
    });
    saveToHistory();
  };


  // Sync sticking pattern to match K's in voicing pattern
  // In Practice Pad mode, never add K to sticking
  const syncStickingToVoicing = (newDrumPattern: string) => {
    // Calculate actual notes per bar (handles both normal and advanced modes)
    const notesPerBar = getNotesPerBarForPattern(pattern);
    const drumPatternTokens = parseTokens(newDrumPattern);
    const currentSticking = parseTokens(pattern.stickingPattern || '');
    
    // Build new sticking pattern that matches K's in voicing pattern
    const newSticking: string[] = [];
    for (let i = 0; i < notesPerBar; i++) {
      const drumToken = drumPatternTokens[i % drumPatternTokens.length];
      const normalizedToken = drumToken.replace(/\+/g, ' ').toUpperCase();
      const hasKick = normalizedToken.includes('K');
      
      // In Practice Pad mode, never add K to sticking
      if (hasKick && !practicePadMode) {
        // If voicing has K, sticking should be K (only if not in practice pad mode)
        newSticking.push('K');
      } else {
        // Otherwise, keep existing sticking or use current position's value
        const existingSticking = currentSticking[i % currentSticking.length] || '';
        if (existingSticking === 'K') {
          // If existing was K but voicing doesn't have K (or practice pad mode), use R or L randomly
          newSticking.push(Math.random() > 0.5 ? 'R' : 'L');
        } else if (existingSticking === '' || existingSticking === '-') {
          // Empty or rest, use R or L randomly
          newSticking.push(Math.random() > 0.5 ? 'R' : 'L');
        } else {
          // Keep existing R or L
          newSticking.push(existingSticking);
        }
      }
    }
    
    return formatList(newSticking);
  };

  const handleDrumPatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newDrumPattern = e.target.value;
    
    // In Practice Pad mode, force all voicing to "S"
    if (practicePadMode) {
      const notesPerBar = getNotesPerBarForPattern(pattern);
      const tokens = parseTokens(newDrumPattern);
      // Replace all non-rest tokens with "S"
      const practicePadPattern = tokens.map((token, i) => {
        if (i >= notesPerBar) return token; // Keep extra tokens as-is
        const upperToken = token.toUpperCase();
        return (upperToken === '-' || upperToken === 'R') ? token : 'S';
      });
      newDrumPattern = formatList(practicePadPattern);
    }
    
    const newSticking = syncStickingToVoicing(newDrumPattern);
    updatePattern(pattern.id, { 
      drumPattern: newDrumPattern,
      stickingPattern: newSticking 
    });
    saveToHistory();
    // TODO: Generate pattern
  };

  const handleStickingPatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newSticking = e.target.value;
    
    // In Practice Pad mode, remove all "K" from sticking pattern
    if (practicePadMode) {
      const tokens = parseTokens(newSticking);
      const filteredTokens = tokens.map(token => {
        const upperToken = token.toUpperCase();
        if (upperToken === 'K') {
          // Replace K with R or L randomly
          return Math.random() > 0.5 ? 'R' : 'L';
        }
        return token;
      });
      newSticking = formatList(filteredTokens);
    }
    
    updatePattern(pattern.id, { stickingPattern: newSticking });
    saveToHistory();
    // TODO: Generate pattern
  };

  const handleLeftFootChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePattern(pattern.id, { leftFoot: e.target.checked });
    saveToHistory();
    // TODO: Generate pattern
  };

  const handleRightFootChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePattern(pattern.id, { rightFoot: e.target.checked });
    saveToHistory();
    // TODO: Generate pattern
  };

  const randomizeTimeSignature = () => {
    const random = randomSets.timeSignatures[Math.floor(Math.random() * randomSets.timeSignatures.length)];
    updatePattern(pattern.id, { timeSignature: random });
    setTimeSignatureError('');
    saveToHistory();
  };

  const randomizeSubdivision = () => {
    if (pattern._advancedMode) {
      // Randomize per-beat subdivisions
      const newPerBeatSubdivisions = randomizePerBeatSubdivisions(pattern.timeSignature || '4/4');
      updatePattern(pattern.id, {
        _perBeatSubdivisions: newPerBeatSubdivisions,
      });
      saveToHistory();
    } else {
      // Randomize single subdivision
      const random = randomSets.subdivisions[Math.floor(Math.random() * randomSets.subdivisions.length)];
      handleSubdivisionChange({
        target: { value: random.toString() },
      } as React.ChangeEvent<HTMLSelectElement>);
    }
  };


  const randomizeDrumPattern = () => {
    // In Practice Pad mode, use "S" for voicing but allow rests
    let newPattern: string;
    if (practicePadMode) {
      // Calculate notes per bar
      const notesPerBar = calculateNotesPerBar(pattern.timeSignature || '4/4', pattern.subdivision);
      // Generate pattern with mostly "S" but allow some rests randomly
      const patternTokens: string[] = [];
      for (let i = 0; i < notesPerBar; i++) {
        // 80% chance of S, 20% chance of rest
        patternTokens.push(Math.random() < 0.8 ? 'S' : '-');
      }
      newPattern = formatList(patternTokens);
    } else {
      const random = randomSets.drumPatterns[Math.floor(Math.random() * randomSets.drumPatterns.length)];
      newPattern = formatList([...random]); // Spread to convert readonly array to mutable
    }
    const newSticking = syncStickingToVoicing(newPattern);
    updatePattern(pattern.id, { 
      drumPattern: newPattern,
      stickingPattern: newSticking 
    });
    saveToHistory();
    // TODO: Generate pattern
  };

  const randomizeStickingPattern = () => {
    // Calculate actual notes per bar (handles both normal and advanced modes)
    const notesPerBar = getNotesPerBarForPattern(pattern);
    const drumPatternTokens = parseTokens(pattern.drumPattern);
    // Check if any subdivision is a triplet (for advanced mode) or if default subdivision is triplet
    const isTriplet = pattern._advancedMode && pattern._perBeatSubdivisions
      ? pattern._perBeatSubdivisions.some(sub => sub === 12 || sub === 24)
      : (pattern.subdivision === 12 || pattern.subdivision === 24);
    
    // Determine pattern length (2-4, with preference for divisors of notesPerBar)
    const minLength = isTriplet ? 3 : 2;
    const maxLength = 4;
    const validLengths: number[] = [];
    
    for (let i = minLength; i <= Math.min(maxLength, notesPerBar); i++) {
      if (notesPerBar % i === 0) {
        validLengths.push(i);
      }
    }
    
    const patternLength = validLengths.length > 0 
      ? validLengths[Math.floor(Math.random() * validLengths.length)]
      : minLength;
    
    const sticking: string[] = [];
    const options = ['R', 'L'];
    
    // Generate base pattern
    // In Practice Pad mode, never add K to sticking
    const baseSticking: string[] = [];
    for (let i = 0; i < patternLength; i++) {
      const drum = drumPatternTokens[i % Math.max(1, drumPatternTokens.length)]?.toUpperCase() || '';
      if (drum === 'K' && !practicePadMode) {
        baseSticking.push('K');
      } else if (drum === 'R') {
        baseSticking.push('-');
      } else {
        baseSticking.push(options[Math.floor(Math.random() * options.length)]);
      }
    }
    
    // Repeat base pattern to match notesPerBar
    for (let i = 0; i < notesPerBar; i++) {
      sticking.push(baseSticking[i % baseSticking.length]);
    }
    
    updatePattern(pattern.id, { stickingPattern: formatList(sticking) });
    saveToHistory();
  };

  return (
    <div className="dpgen-pattern-fields">
      {/* Repeat */}
      <div className="dpgen-field">
        <label className="dpgen-label">Repeat (bars)</label>
        <input
          type="number"
          className="dpgen-pattern-repeat"
          value={pattern.repeat || 1}
          min={1}
          max={16}
          onChange={handleRepeatChange}
        />
      </div>

      {/* Time Signature */}
      <div className="dpgen-field">
        <label className="dpgen-label">Time Signature</label>
        <div className="dpgen-input-group">
          <input
            type="text"
            className={`dpgen-pattern-timeSignature ${timeSignatureError ? 'dpgen-input-error' : ''}`}
            value={pattern.timeSignature}
            onChange={handleTimeSignatureChange}
            onBlur={handleTimeSignatureBlur}
          />
          <button
            type="button"
            className="dpgen-icon-button dpgen-pattern-randomize-timeSignature"
            onClick={randomizeTimeSignature}
            aria-label="Randomise time signature"
          >
            <i className="fas fa-dice" />
          </button>
        </div>
        {timeSignatureError && (
          <div className="dpgen-error-message">
            <i className="fas fa-exclamation-circle" /> {timeSignatureError}
          </div>
        )}
      </div>

      {/* Subdivision */}
      <div className="dpgen-field">
        <label className="dpgen-label">Subdivision</label>
        
        <div className="mb-3 flex items-center justify-between w-full">
          <span className="text-sm text-gray-600 dark:text-gray-400">Per-beat subdivisions</span>
          <button
            type="button"
            onClick={handleAdvancedModeToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              pattern._advancedMode
                ? 'bg-blue-600 focus:ring-blue-500'
                : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-500'
            }`}
            role="switch"
            aria-checked={pattern._advancedMode || false}
            aria-label="Toggle per-beat subdivisions"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                pattern._advancedMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        {!pattern._advancedMode ? (
          <div className="dpgen-input-group">
            <select className="dpgen-pattern-subdivision" value={pattern.subdivision} onChange={handleSubdivisionChange}>
              <option value={4}>Quarter Notes</option>
              <option value={8}>Eighth Notes</option>
              <option value={12}>Triplets</option>
              <option value={16}>Sixteenth Notes</option>
              <option value={24}>Sextuplets</option>
              <option value={32}>32nd Notes</option>
            </select>
            <button
              type="button"
              className="dpgen-icon-button dpgen-pattern-randomize-subdivision"
              onClick={randomizeSubdivision}
              aria-label="Randomise subdivision"
            >
              <i className="fas fa-dice" />
            </button>
          </div>
        ) : (
          <PerBeatSubdivisionEditor
            timeSignature={pattern.timeSignature || '4/4'}
            perBeatSubdivisions={pattern._perBeatSubdivisions || [pattern.subdivision]}
            onSubdivisionsChange={handlePerBeatSubdivisionsChange}
          />
        )}
      </div>

      {/* Accents */}
      <div className="dpgen-field">
        <label className="dpgen-label">Accents</label>
        <AccentEditor pattern={pattern} />
        <p className="dpgen-hint">Click notes to toggle accents. The phrase is automatically derived from accents. You can have any number of accents (including none).</p>
      </div>

      {/* Voicing Pattern */}
      <div className="dpgen-field">
        <label className="dpgen-label">Voicing Pattern</label>
        <div className="dpgen-input-group">
          <input
            type="text"
            className="dpgen-pattern-drumPattern"
            value={pattern.drumPattern}
            onChange={handleDrumPatternChange}
          />
          <button
            type="button"
            className="dpgen-icon-button dpgen-pattern-randomize-drumPattern"
            onClick={randomizeDrumPattern}
            aria-label="Randomise voicing pattern"
            disabled={practicePadMode}
            title={practicePadMode ? "Voicing pattern is locked to 'S' in Practice Pad mode" : "Randomise voicing pattern"}
            style={{ opacity: practicePadMode ? 0.5 : 1, cursor: practicePadMode ? 'not-allowed' : 'pointer' }}
          >
            <i className="fas fa-dice" />
          </button>
        </div>
        <p className="dpgen-hint">
          S = Snare, K = Kick, Ht = High Tom, Mt = Mid Tom, F = Floor, H = Hi-hat, - = Rest. Use + for simultaneous notes (e.g., "S+K" for snare+kick together). Examples: "S K S K" or "S+K H+K S+K H+K" or "Ht Mt S K"
        </p>
      </div>

      {/* Sticking Pattern */}
      <div className="dpgen-field">
        <label className="dpgen-label">Sticking Pattern</label>
        <div style={{ marginBottom: '0.5rem' }}>
          <select
            value=""
            onChange={(e) => {
              const selectedPattern = commonStickingPatterns.find(p => p.name === e.target.value);
              if (selectedPattern) {
                // Calculate notes per bar to repeat the pattern
                // Note: Each token (including flams like Rl, Lr) counts as one note position
                const notesPerBar = getNotesPerBarForPattern(pattern);
                const patternTokens = parseTokens(selectedPattern.pattern);
                const repeatedPattern: string[] = [];
                for (let i = 0; i < notesPerBar; i++) {
                  // Use modulo to repeat pattern - flams (Rl, Lr) are single tokens and count as one note
                  repeatedPattern.push(patternTokens[i % patternTokens.length]);
                }
                const newSticking = formatList(repeatedPattern);
                updatePattern(pattern.id, { stickingPattern: newSticking });
                saveToHistory();
              }
              // Reset dropdown to show placeholder
              e.target.value = '';
            }}
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
            <option value="">Select Pattern...</option>
            {commonStickingPatterns.map((stickingPattern) => (
              <option key={stickingPattern.name} value={stickingPattern.name}>
                {stickingPattern.name} {stickingPattern.description ? `(${stickingPattern.description})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="dpgen-input-group">
          <input
            type="text"
            className="dpgen-pattern-stickingPattern"
            value={pattern.stickingPattern}
            onChange={handleStickingPatternChange}
            placeholder="Or enter manually (e.g., R L R L)"
          />
          <button
            type="button"
            className="dpgen-icon-button dpgen-pattern-randomize-stickingPattern"
            onClick={randomizeStickingPattern}
            aria-label="Randomise sticking pattern"
          >
            <i className="fas fa-dice" />
          </button>
        </div>
        <p className="dpgen-hint">
          R = Right hand, L = Left hand, K = Kick (only when voicing has K), - = Rest. lR = Left flam (left grace note, right main), rL = Right flam (right grace note, left main). Patterns can span multiple bars and will continue across bars.
        </p>
      </div>

      {/* Left/Right Foot */}
      <div className="dpgen-field" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer', width: '100%' }}>
          <span style={{ flex: '1', minWidth: '100px' }}>
            <span style={{ display: 'block', fontWeight: 500 }}>Left Foot</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>(Pedal Hi-Hat)</span>
          </span>
          <input type="checkbox" checked={pattern.leftFoot} onChange={handleLeftFootChange} style={{ order: 2 }} />
          <span className="dpgen-toggle-slider" style={{ order: 2, flexShrink: 0 }} />
        </label>
        <label className="dpgen-toggle-switch" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer', width: '100%' }}>
          <span style={{ flex: '1', minWidth: '100px' }}>
            <span style={{ display: 'block', fontWeight: 500 }}>Right Foot</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>(Kick)</span>
          </span>
          <input type="checkbox" checked={pattern.rightFoot} onChange={handleRightFootChange} style={{ order: 2 }} />
          <span className="dpgen-toggle-slider" style={{ order: 2, flexShrink: 0 }} />
        </label>
      </div>
    </div>
  );
}

