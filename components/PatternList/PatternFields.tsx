/**
 * Pattern Fields component
 * Handles all pattern input fields and validation
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Pattern } from '@/types';
import { useStore } from '@/store/useStore';
import { parseNumberList, formatList, parseTimeSignature, parseTokens, randomizeAccents, calculateNotesPerBar, randomizePerBeatSubdivisions, getNotesPerBarForPattern, calculateNotesPerBarFromPerBeatSubdivisions, generateStickingForDrumPattern } from '@/lib/utils/patternUtils';
import { randomSets } from '@/lib/utils/randomSets';
import { commonStickingPatterns, type StickingPattern } from '@/lib/utils/commonStickingPatterns';
import { AccentEditor } from './AccentEditor';
import { PerBeatSubdivisionEditor } from './PerBeatSubdivisionEditor';
import { PerBeatVoicingEditor } from './PerBeatVoicingEditor';
import { PerBeatStickingEditor } from './PerBeatStickingEditor';
import { CollapsibleSection } from '@/components/shared/CollapsibleSection';
import { Tooltip } from '@/components/shared/Tooltip';
import { Settings, Music, Drum, SlidersHorizontal } from 'lucide-react';

interface PatternFieldsProps {
  pattern: Pattern;
}

export function PatternFields({ pattern }: PatternFieldsProps) {
  const updatePattern = useStore((state) => state.updatePattern);
  const saveToHistory = useStore((state) => state.saveToHistory);
  const practicePadMode = useStore((state) => state.practicePadMode);

  const [timeSignatureError, setTimeSignatureError] = useState<string>('');

  const handleRepeatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 16) {
      updatePattern(pattern.id, { repeat: value });
      saveToHistory();
    }
  }, [pattern.id, updatePattern, saveToHistory]);

  const handleTimeSignatureChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [pattern.id, pattern.subdivision, pattern._presetAccents, updatePattern, saveToHistory]);

  const handleTimeSignatureBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value.trim()) {
      setTimeSignatureError('Time signature is required');
    } else if (!/^\d+\s*\/\s*\d+$/.test(value)) {
      setTimeSignatureError('Time signature must be in format X/Y (e.g., 4/4)');
    }
  }, []);

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
  };

  const handleAdvancedModeToggle = () => {
    const enabled = !pattern._advancedMode;
    
    if (enabled) {
      // Initialize per-beat subdivisions from current subdivision
      // Number of beats = numerator of time signature
      const [numerator] = parseTimeSignature(pattern.timeSignature || '4/4');
      const perBeatSubdivisions = Array(numerator).fill(pattern.subdivision);
      
      // Initialize per-beat voicing and sticking from current patterns
      const drumPatternTokens = parseTokens(pattern.drumPattern);
      const stickingPatternTokens = parseTokens(pattern.stickingPattern);
      const { notesPerBeat } = calculateNotesPerBarFromPerBeatSubdivisions(pattern.timeSignature || '4/4', perBeatSubdivisions);
      
      const perBeatVoicing: string[] = [];
      const perBeatSticking: string[] = [];
      let voicingIndex = 0;
      let stickingIndex = 0;
      
      for (let i = 0; i < numerator; i++) {
        const notesInBeat = notesPerBeat[i] || 0;
        const beatVoicing: string[] = [];
        const beatSticking: string[] = [];
        
        for (let j = 0; j < notesInBeat; j++) {
          if (voicingIndex < drumPatternTokens.length) {
            beatVoicing.push(drumPatternTokens[voicingIndex]);
          }
          if (stickingIndex < stickingPatternTokens.length) {
            beatSticking.push(stickingPatternTokens[stickingIndex]);
          }
          voicingIndex++;
          stickingIndex++;
        }
        
        perBeatVoicing.push(formatList(beatVoicing));
        perBeatSticking.push(formatList(beatSticking));
      }
      
      updatePattern(pattern.id, {
        _advancedMode: true,
        _perBeatSubdivisions: perBeatSubdivisions,
        _perBeatVoicing: perBeatVoicing,
        _perBeatSticking: perBeatSticking,
        // Preserve foot settings
        leftFoot: pattern.leftFoot,
        rightFoot: pattern.rightFoot,
      });
    } else {
      // Disable advanced mode, combine per-beat patterns back into single patterns
      const combinedVoicing = pattern._perBeatVoicing ? pattern._perBeatVoicing.join(' ') : pattern.drumPattern;
      const combinedSticking = pattern._perBeatSticking ? pattern._perBeatSticking.join(' ') : pattern.stickingPattern;
      
      updatePattern(pattern.id, {
        _advancedMode: false,
        _perBeatSubdivisions: undefined,
        _perBeatVoicing: undefined,
        _perBeatSticking: undefined,
        drumPattern: combinedVoicing,
        stickingPattern: combinedSticking,
        // Preserve foot settings
        leftFoot: pattern.leftFoot,
        rightFoot: pattern.rightFoot,
      });
    }
    
    saveToHistory();
  };

  const handlePerBeatSubdivisionsChange = (subdivisions: number[]) => {
    // When subdivisions change, we may need to adjust voicing/sticking
    const [numerator] = parseTimeSignature(pattern.timeSignature || '4/4');
    const { notesPerBeat: newNotesPerBeat } = calculateNotesPerBarFromPerBeatSubdivisions(pattern.timeSignature || '4/4', subdivisions);
    
    // Get old notes per beat for comparison
    const oldNotesPerBeat = pattern._perBeatSubdivisions 
      ? calculateNotesPerBarFromPerBeatSubdivisions(pattern.timeSignature || '4/4', pattern._perBeatSubdivisions).notesPerBeat
      : null;
    
    // If per-beat voicing/sticking exist, adjust them to match new note counts
    let perBeatVoicing = pattern._perBeatVoicing ? [...pattern._perBeatVoicing] : [];
    let perBeatSticking = pattern._perBeatSticking ? [...pattern._perBeatSticking] : [];
    
    // Ensure arrays match number of beats
    if (perBeatVoicing.length !== numerator) {
      perBeatVoicing = Array(numerator).fill('S');
    }
    if (perBeatSticking.length !== numerator) {
      perBeatSticking = Array(numerator).fill('R L');
    }
    
    // Truncate voicing and sticking patterns if number of notes decreased
    for (let i = 0; i < numerator; i++) {
      const newNotesInBeat = newNotesPerBeat[i] || 0;
      const oldNotesInBeat = oldNotesPerBeat ? (oldNotesPerBeat[i] || 0) : null;
      
      // If we have old notes and new notes are fewer, truncate the patterns
      if (oldNotesInBeat !== null && newNotesInBeat < oldNotesInBeat) {
        // Truncate voicing pattern
        const voicingTokens = parseTokens(perBeatVoicing[i] || 'S');
        if (voicingTokens.length > newNotesInBeat) {
          perBeatVoicing[i] = formatList(voicingTokens.slice(0, newNotesInBeat));
        }
        
        // Truncate sticking pattern
        const stickingTokens = parseTokens(perBeatSticking[i] || 'R L');
        if (stickingTokens.length > newNotesInBeat) {
          perBeatSticking[i] = formatList(stickingTokens.slice(0, newNotesInBeat));
        }
      }
    }
    
    // Update combined patterns for backward compatibility
    const combinedVoicing = perBeatVoicing.join(' ');
    const combinedSticking = perBeatSticking.join(' ');
    
    updatePattern(pattern.id, {
      _perBeatSubdivisions: subdivisions,
      _perBeatVoicing: perBeatVoicing,
      _perBeatSticking: perBeatSticking,
      drumPattern: combinedVoicing,
      stickingPattern: combinedSticking,
    });
    saveToHistory();
  };

  const handlePerBeatVoicingChange = (voicing: string[]) => {
    // Sync rests and K to sticking pattern
    if (pattern._perBeatSticking && pattern._perBeatSticking.length === voicing.length) {
      const updatedSticking = [...pattern._perBeatSticking];
      for (let i = 0; i < voicing.length; i++) {
        const voicingTokens = parseTokens(voicing[i] || '');
        const stickingTokens = parseTokens(updatedSticking[i] || '');
        
        // Sync rests and K: if voicing has a rest or K at position j, sticking should match
        for (let j = 0; j < Math.max(voicingTokens.length, stickingTokens.length); j++) {
          const voicingToken = voicingTokens[j]?.toUpperCase() || '';
          const isRest = voicingToken === '' || voicingToken === '-' || voicingToken === 'R';
          const hasKick = voicingToken.includes('K');
          
          if (isRest && j < stickingTokens.length) {
            stickingTokens[j] = '-';
          } else if (hasKick && !practicePadMode && j < stickingTokens.length) {
            // If voicing has K, sticking should be K (only if not in practice pad mode)
            stickingTokens[j] = 'K';
          } else if (!isRest && !hasKick && j < voicingTokens.length && j < stickingTokens.length && stickingTokens[j] === '-') {
            // If voicing doesn't have rest but sticking does, replace with R or L
            stickingTokens[j] = Math.random() > 0.5 ? 'R' : 'L';
          } else if (!isRest && !hasKick && j < voicingTokens.length && j < stickingTokens.length && stickingTokens[j] === 'K' && practicePadMode) {
            // If voicing doesn't have K but sticking does (and practice pad mode), replace with R or L
            stickingTokens[j] = Math.random() > 0.5 ? 'R' : 'L';
          }
        }
        updatedSticking[i] = formatList(stickingTokens);
      }
      
      const combinedSticking = updatedSticking.join(' ');
      updatePattern(pattern.id, {
        _perBeatVoicing: voicing,
        _perBeatSticking: updatedSticking,
        drumPattern: voicing.join(' '),
        stickingPattern: combinedSticking,
      });
    } else {
      // Also update combined drumPattern for backward compatibility
      const combinedVoicing = voicing.join(' ');
      updatePattern(pattern.id, {
        _perBeatVoicing: voicing,
        drumPattern: combinedVoicing,
      });
    }
    saveToHistory();
  };

  const handlePerBeatStickingChange = (sticking: string[]) => {
    // Sync rests and K to voicing pattern
    if (pattern._perBeatVoicing && pattern._perBeatVoicing.length === sticking.length) {
      const updatedVoicing = [...pattern._perBeatVoicing];
      for (let i = 0; i < sticking.length; i++) {
        const stickingTokens = parseTokens(sticking[i] || '');
        const voicingTokens = parseTokens(updatedVoicing[i] || '');
        
        // Sync rests and K: if sticking has a rest or K at position j, voicing should match
        for (let j = 0; j < Math.max(stickingTokens.length, voicingTokens.length); j++) {
          const stickingToken = stickingTokens[j]?.toUpperCase() || '';
          const isRest = stickingToken === '' || stickingToken === '-';
          const hasKick = stickingToken === 'K';
          
          if (isRest && j < voicingTokens.length) {
            voicingTokens[j] = '-';
          } else if (hasKick && !practicePadMode && j < voicingTokens.length) {
            // If sticking has K, voicing should have K (only if not in practice pad mode)
            const currentVoicing = voicingTokens[j]?.toUpperCase() || '';
            if (!currentVoicing.includes('K')) {
              // Add K to voicing - if it's empty or just a single drum, add K
              if (currentVoicing === '' || currentVoicing === 'S' || currentVoicing === 'H' || currentVoicing === 'T' || currentVoicing === 'F') {
                voicingTokens[j] = 'K';
              } else if (!currentVoicing.includes('K')) {
                // If it's a compound like "S+H", add K to it
                voicingTokens[j] = currentVoicing + '+K';
              }
            }
          } else if (!isRest && !hasKick && j < stickingTokens.length && j < voicingTokens.length && voicingTokens[j] === '-') {
            // If sticking doesn't have rest but voicing does, replace with S
            voicingTokens[j] = 'S';
          } else if (!isRest && !hasKick && j < stickingTokens.length && j < voicingTokens.length && voicingTokens[j]?.toUpperCase().includes('K')) {
            // If sticking doesn't have K but voicing does, remove K from voicing
            const currentVoicing = voicingTokens[j]?.toUpperCase() || '';
            if (currentVoicing === 'K') {
              voicingTokens[j] = 'S';
            } else if (currentVoicing.includes('+K')) {
              voicingTokens[j] = currentVoicing.replace(/\+?K/gi, '').trim() || 'S';
            }
          }
        }
        updatedVoicing[i] = formatList(voicingTokens);
      }
      
      const combinedVoicing = updatedVoicing.join(' ');
      const combinedSticking = sticking.join(' ');
      updatePattern(pattern.id, {
        _perBeatVoicing: updatedVoicing,
        _perBeatSticking: sticking,
        drumPattern: combinedVoicing,
        stickingPattern: combinedSticking,
      });
    } else {
      // Also update combined stickingPattern for backward compatibility
      const combinedSticking = sticking.join(' ');
      updatePattern(pattern.id, {
        _perBeatSticking: sticking,
        stickingPattern: combinedSticking,
      });
    }
    saveToHistory();
  };


  // Sync sticking pattern to match K's and rests in voicing pattern
  // In Practice Pad mode, never add K to sticking
  // Generate a shorter sticking pattern (2-4 notes) that matches the voicing pattern
  const syncStickingToVoicing = (newDrumPattern: string) => {
    // Use generateStickingForDrumPattern which automatically generates a shorter pattern
    // that matches the voicing pattern length (not the full bar)
    const drumPatternTokens = parseTokens(newDrumPattern);
    const voicingLength = drumPatternTokens.length;
    
    // Use voicing length as the target (it's already one beat in standard mode)
    // generateStickingForDrumPattern will generate 2-4 notes matching the voicing
    return generateStickingForDrumPattern(newDrumPattern, voicingLength, practicePadMode);
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
    
    // Sync rests and K to voicing pattern
    const stickingTokens = parseTokens(newSticking);
    const voicingTokens = parseTokens(pattern.drumPattern || '');
    const updatedVoicing: string[] = [];
    
    for (let i = 0; i < Math.max(stickingTokens.length, voicingTokens.length); i++) {
      const stickingToken = stickingTokens[i]?.toUpperCase() || '';
      const isRest = stickingToken === '' || stickingToken === '-';
      const hasKick = stickingToken === 'K';
      
      if (isRest && i < voicingTokens.length) {
        // If sticking has rest, voicing should too
        updatedVoicing.push('-');
      } else if (hasKick && !practicePadMode && i < voicingTokens.length) {
        // If sticking has K, voicing should have K
        const currentVoicing = voicingTokens[i]?.toUpperCase() || '';
        if (!currentVoicing.includes('K')) {
          // Add K to voicing - if it's empty or just a single drum, add K
          if (currentVoicing === '' || currentVoicing === 'S' || currentVoicing === 'H' || currentVoicing === 'T' || currentVoicing === 'F') {
            updatedVoicing.push('K');
          } else if (!currentVoicing.includes('K')) {
            // If it's a compound like "S+H", add K to it
            updatedVoicing.push(voicingTokens[i] + '+K');
          } else {
            updatedVoicing.push(voicingTokens[i]);
          }
        } else {
          updatedVoicing.push(voicingTokens[i]);
        }
      } else if (!isRest && !hasKick && i < stickingTokens.length) {
        // If sticking doesn't have rest or K, keep existing voicing or use S
        const currentVoicing = voicingTokens[i]?.toUpperCase() || '';
        if (currentVoicing === '-') {
          updatedVoicing.push('S');
        } else if (currentVoicing.includes('K') && !hasKick) {
          // If voicing has K but sticking doesn't, remove K from voicing
          if (currentVoicing === 'K') {
            updatedVoicing.push('S');
          } else {
            updatedVoicing.push(currentVoicing.replace(/\+?K/gi, '').trim() || 'S');
          }
        } else {
          updatedVoicing.push(voicingTokens[i] || 'S');
        }
      } else {
        updatedVoicing.push(voicingTokens[i] || 'S');
      }
    }
    
    const newVoicing = formatList(updatedVoicing);
    
    updatePattern(pattern.id, { 
      stickingPattern: newSticking,
      drumPattern: newVoicing,
    });
    saveToHistory();
  };

  const handleLeftFootChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePattern(pattern.id, { leftFoot: e.target.checked });
    saveToHistory();
  };

  const handleRightFootChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePattern(pattern.id, { rightFoot: e.target.checked });
    saveToHistory();
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
    if (pattern._advancedMode && pattern._perBeatSubdivisions) {
      // Randomize per-beat voicing
      const [numerator] = parseTimeSignature(pattern.timeSignature || '4/4');
      const { notesPerBeat } = calculateNotesPerBarFromPerBeatSubdivisions(pattern.timeSignature || '4/4', pattern._perBeatSubdivisions);
      const perBeatVoicing: string[] = [];
      
      for (let i = 0; i < numerator; i++) {
        const notesInBeat = notesPerBeat[i] || 1;
        if (practicePadMode) {
          // Practice Pad mode: mostly "S" with some rests
          const beatTokens: string[] = [];
          for (let j = 0; j < notesInBeat; j++) {
            beatTokens.push(Math.random() < 0.8 ? 'S' : '-');
          }
          perBeatVoicing.push(formatList(beatTokens));
        } else {
          // Random drum pattern for this beat
          const randomPattern = randomSets.drumPatterns[Math.floor(Math.random() * randomSets.drumPatterns.length)];
          const beatTokens: string[] = [];
          for (let j = 0; j < notesInBeat; j++) {
            beatTokens.push(randomPattern[j % randomPattern.length]);
          }
          perBeatVoicing.push(formatList(beatTokens));
        }
      }
      
      // Generate per-beat sticking
      const perBeatSticking: string[] = [];
      for (let i = 0; i < numerator; i++) {
        const notesInBeat = notesPerBeat[i] || 1;
        const voicing = perBeatVoicing[i] || 'S';
        const sticking = generateStickingForDrumPattern(voicing, notesInBeat, practicePadMode);
        perBeatSticking.push(sticking);
      }
      
      const combinedVoicing = perBeatVoicing.join(' ');
      const combinedSticking = perBeatSticking.join(' ');
      
      updatePattern(pattern.id, {
        _perBeatVoicing: perBeatVoicing,
        _perBeatSticking: perBeatSticking,
        drumPattern: combinedVoicing,
        stickingPattern: combinedSticking,
      });
    } else {
      // Standard mode - generate voicing pattern for one beat
      const [numerator, denominator] = parseTimeSignature(pattern.timeSignature || '4/4');
      const beatValue = denominator; // Typically 4 for quarter notes
      const notesPerBeat = pattern.subdivision / beatValue;
      
      let newPattern: string;
      if (practicePadMode) {
        // Generate pattern for one beat with mostly "S" but allow some rests
        const patternTokens: string[] = [];
        for (let i = 0; i < notesPerBeat; i++) {
          // 80% chance of S, 20% chance of rest
          patternTokens.push(Math.random() < 0.8 ? 'S' : '-');
        }
        newPattern = formatList(patternTokens);
      } else {
        // Generate voicing pattern for one beat (not full bar)
        const random = randomSets.drumPatterns[Math.floor(Math.random() * randomSets.drumPatterns.length)];
        const beatTokens: string[] = [];
        for (let i = 0; i < notesPerBeat; i++) {
          beatTokens.push(random[i % random.length]);
        }
        newPattern = formatList(beatTokens);
      }
      const newSticking = syncStickingToVoicing(newPattern);
      updatePattern(pattern.id, { 
        drumPattern: newPattern,
        stickingPattern: newSticking 
      });
    }
    saveToHistory();
  };

  const randomizeStickingPattern = () => {
    if (pattern._advancedMode && pattern._perBeatSubdivisions && pattern._perBeatVoicing) {
      // Randomize per-beat sticking
      const [numerator] = parseTimeSignature(pattern.timeSignature || '4/4');
      const { notesPerBeat } = calculateNotesPerBarFromPerBeatSubdivisions(pattern.timeSignature || '4/4', pattern._perBeatSubdivisions);
      const perBeatSticking: string[] = [];
      
      for (let i = 0; i < numerator; i++) {
        const notesInBeat = notesPerBeat[i] || 1;
        const voicing = pattern._perBeatVoicing[i] || 'S';
        const sticking = generateStickingForDrumPattern(voicing, notesInBeat, practicePadMode);
        perBeatSticking.push(sticking);
      }
      
      const combinedSticking = perBeatSticking.join(' ');
      
      updatePattern(pattern.id, {
        _perBeatSticking: perBeatSticking,
        stickingPattern: combinedSticking,
      });
    } else {
      // Standard mode - generate sticking pattern 2-4 notes long
      const drumPatternTokens = parseTokens(pattern.drumPattern);
      // Check if subdivision is a triplet
      const isTriplet = pattern.subdivision === 12 || pattern.subdivision === 24;
      
      // Determine pattern length (2-4)
      const minLength = isTriplet ? 3 : 2;
      const maxLength = 4;
      const patternLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
      
      const options = ['R', 'L'];
      
      // Generate base pattern (2-4 notes)
      // In Practice Pad mode, never add K to sticking
      const baseSticking: string[] = [];
      for (let i = 0; i < patternLength; i++) {
        const drum = drumPatternTokens[i % Math.max(1, drumPatternTokens.length)]?.toUpperCase() || '';
        if (drum === 'K' && !practicePadMode) {
          baseSticking.push('K');
        } else if (drum === 'R' || drum === '-') {
          // Rest = keep rest in sticking pattern
          baseSticking.push('-');
        } else {
          baseSticking.push(options[Math.floor(Math.random() * options.length)]);
        }
      }
      
      // Return just the base pattern (2-4 notes) - it will repeat automatically
      updatePattern(pattern.id, { stickingPattern: formatList(baseSticking) });
    }
    saveToHistory();
  };

  return (
    <div className="dpgen-pattern-fields" style={{ padding: '0.5rem' }}>
      {/* Basic Settings */}
      <CollapsibleSection title="Basic Settings" icon={<Settings size={16} />} defaultExpanded={true}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
              <Tooltip content="Randomise time signature (Ctrl/Cmd + R for all patterns)">
                <button
                  type="button"
                  className="dpgen-icon-button dpgen-pattern-randomize-timeSignature"
                  onClick={randomizeTimeSignature}
                  aria-label="Randomise time signature"
                >
                  <i className="fas fa-dice" />
                </button>
              </Tooltip>
            </div>
            {timeSignatureError && (
              <div className="dpgen-error-message">
                <i className="fas fa-exclamation-circle" /> {timeSignatureError}
              </div>
            )}
          </div>
        </div>

        {/* Subdivision */}
        <div className="dpgen-field" style={{ marginTop: '1rem' }}>
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
            <Tooltip content="Randomise subdivision">
              <button
                type="button"
                className="dpgen-icon-button dpgen-pattern-randomize-subdivision"
                onClick={randomizeSubdivision}
                aria-label="Randomise subdivision"
              >
                <i className="fas fa-dice" />
              </button>
            </Tooltip>
          </div>
        ) : (
          <PerBeatSubdivisionEditor
            timeSignature={pattern.timeSignature || '4/4'}
            perBeatSubdivisions={pattern._perBeatSubdivisions || [pattern.subdivision]}
            onSubdivisionsChange={handlePerBeatSubdivisionsChange}
          />
        )}
        </div>
      </CollapsibleSection>

      {/* Rhythm */}
      <CollapsibleSection title="Rhythm & Accents" icon={<Music size={16} />} defaultExpanded={true}>
        <div className="dpgen-field">
          <label className="dpgen-label">Accents</label>
          <AccentEditor pattern={pattern} />
          <p className="dpgen-hint">Click notes to toggle accents. The phrase is automatically derived from accents. You can have any number of accents (including none).</p>
        </div>
      </CollapsibleSection>

      {/* Voicing & Sticking */}
      <CollapsibleSection title="Voicing & Sticking" icon={<Drum size={16} />} defaultExpanded={true}>
        {/* Voicing Pattern */}
        <div className="dpgen-field">
        <label className="dpgen-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Voicing Pattern
          <Tooltip content="S = Snare, K = Kick, Ht = High Tom, Mt = Mid Tom, F = Floor, H = Hi-hat, C = Crash, Y = Ride, - = Rest. Use + for simultaneous notes (e.g., 'S+K' for snare+kick together). Use parentheses for ghost notes (e.g., '(S)' for ghost snare). Examples: 'S K S K' or 'S+K H+K S+K H+K' or 'Ht Mt S K' or 'S (S) S (S)' or 'S K S C'">
            <i className="fas fa-info-circle" style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', cursor: 'help' }} />
          </Tooltip>
        </label>
        {!pattern._advancedMode ? (
          <>
            <div className="dpgen-input-group">
              <input
                type="text"
                className="dpgen-pattern-drumPattern"
                value={pattern.drumPattern}
                onChange={handleDrumPatternChange}
              />
              <Tooltip content={practicePadMode ? "Voicing pattern is locked to 'S' in Practice Pad mode" : "Randomise voicing pattern"}>
                <button
                  type="button"
                  className="dpgen-icon-button dpgen-pattern-randomize-drumPattern"
                  onClick={randomizeDrumPattern}
                  aria-label="Randomise voicing pattern"
                  disabled={practicePadMode}
                  style={{ opacity: practicePadMode ? 0.5 : 1, cursor: practicePadMode ? 'not-allowed' : 'pointer' }}
                >
                  <i className="fas fa-dice" />
                </button>
              </Tooltip>
            </div>
          </>
        ) : (
          <PerBeatVoicingEditor
            timeSignature={pattern.timeSignature || '4/4'}
            perBeatSubdivisions={pattern._perBeatSubdivisions || [pattern.subdivision]}
            perBeatVoicing={pattern._perBeatVoicing || []}
            onVoicingChange={handlePerBeatVoicingChange}
            practicePadMode={practicePadMode}
          />
        )}
      </div>

      {/* Sticking Pattern */}
      <div className="dpgen-field">
        <label className="dpgen-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Sticking Pattern
          <Tooltip content="R = Right hand, L = Left hand, K = Kick (only when voicing has K), - = Rest. lR = Left flam (left grace note, right main), rL = Right flam (right grace note, left main). llR = Left drag (two left grace notes, right main), rrL = Right drag (two right grace notes, left main). lllR = Left ruff (three left grace notes, right main), rrrL = Right ruff (three right grace notes, left main). Patterns can span multiple bars and will continue across bars.">
            <i className="fas fa-info-circle" style={{ fontSize: '0.875rem', color: 'var(--dpgen-muted)', cursor: 'help' }} />
          </Tooltip>
        </label>
        {!pattern._advancedMode ? (
          <>
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
              <Tooltip content="Randomise sticking pattern (2-4 notes, respects voicing K's and rests)">
                <button
                  type="button"
                  className="dpgen-icon-button dpgen-pattern-randomize-stickingPattern"
                  onClick={randomizeStickingPattern}
                  aria-label="Randomise sticking pattern"
                >
                  <i className="fas fa-dice" />
                </button>
              </Tooltip>
            </div>
          </>
        ) : (
          <PerBeatStickingEditor
            timeSignature={pattern.timeSignature || '4/4'}
            perBeatSubdivisions={pattern._perBeatSubdivisions || [pattern.subdivision]}
            perBeatVoicing={pattern._perBeatVoicing || []}
            perBeatSticking={pattern._perBeatSticking || []}
            onStickingChange={handlePerBeatStickingChange}
            practicePadMode={practicePadMode}
          />
        )}
        </div>
      </CollapsibleSection>

      {/* Advanced Options */}
      <CollapsibleSection title="Advanced Options" icon={<SlidersHorizontal size={16} />} defaultExpanded={false}>
        {/* Left/Right Foot */}
        <div className="dpgen-field" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label 
            className="dpgen-toggle-switch" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', cursor: 'pointer', width: '100%' }}
          >
            <span style={{ flex: 1, minWidth: '100px' }}>
              <span style={{ display: 'block', fontWeight: 500 }}>Left Foot</span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>(Pedal Hi-Hat)</span>
            </span>
            <input 
              type="checkbox" 
              checked={pattern.leftFoot || false} 
              onChange={(e) => {
                e.stopPropagation();
                updatePattern(pattern.id, { leftFoot: e.target.checked });
                saveToHistory();
              }}
            />
            <span className="dpgen-toggle-slider" />
          </label>
          <label 
            className="dpgen-toggle-switch" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', cursor: 'pointer', width: '100%' }}
          >
            <span style={{ flex: 1, minWidth: '100px' }}>
              <span style={{ display: 'block', fontWeight: 500 }}>Right Foot</span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>(Kick)</span>
            </span>
            <input 
              type="checkbox" 
              checked={pattern.rightFoot || false} 
              onChange={(e) => {
                e.stopPropagation();
                updatePattern(pattern.id, { rightFoot: e.target.checked });
                saveToHistory();
              }}
            />
            <span className="dpgen-toggle-slider" />
          </label>
        </div>
      </CollapsibleSection>
    </div>
  );
}

