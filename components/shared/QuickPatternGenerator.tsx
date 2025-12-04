/**
 * Quick Pattern Generator - Simple interface to create a basic 1-bar pattern
 */

'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { 
  calculateNotesPerBar,
  generateStickingForDrumPattern,
  randomizeAccents,
  buildPhraseFromAccents,
  formatList,
  parseTimeSignature,
  getRandomItem,
} from '@/lib/utils/patternUtils';
import { Pattern } from '@/types/pattern';
import { randomSets } from '@/lib/utils/randomSets';

export function QuickPatternGenerator() {
  const darkMode = useStore((state) => state.darkMode);
  const practicePadMode = useStore((state) => state.practicePadMode);
  const setPatterns = useStore((state) => state.setPatterns);

  const [timeSignature, setTimeSignature] = useState('4/4');
  const [subdivision, setSubdivision] = useState(16);

  const handleGeneratePattern = () => {
    // Calculate notes per bar based on selected time signature and subdivision
    const notesPerBar = calculateNotesPerBar(timeSignature, subdivision);
    
    // Generate random accents
    const accents = randomizeAccents(notesPerBar);
    const phraseArray = buildPhraseFromAccents(accents, notesPerBar);
    const phrase = formatList(phraseArray);
    
    // Calculate notes per beat for pattern generation
    const [numerator, denominator] = parseTimeSignature(timeSignature);
    const notesPerBeat = subdivision / denominator;
    
    // Generate drum pattern (voicing)
    let drumPattern: string;
    if (practicePadMode) {
      const beatTokens: string[] = [];
      for (let i = 0; i < notesPerBeat; i++) {
        beatTokens.push(Math.random() < 0.8 ? 'S' : '-');
      }
      drumPattern = formatList(beatTokens);
    } else {
      // Pick a random drum pattern set
      const drumPatternArray = getRandomItem([...randomSets.drumPatterns]) as readonly string[];
      const beatTokens: string[] = [];
      for (let i = 0; i < notesPerBeat; i++) {
        beatTokens.push(drumPatternArray[i % drumPatternArray.length]);
      }
      drumPattern = formatList(beatTokens);
    }
    
    // Generate sticking pattern
    const stickingPattern = generateStickingForDrumPattern(drumPattern, notesPerBeat, practicePadMode);
    
    // Create the pattern with selected settings
    const pattern: Pattern = {
      id: Date.now() + Math.random(),
      timeSignature,
      subdivision,
      phrase,
      drumPattern,
      stickingPattern,
      leftFoot: false,
      rightFoot: false,
      repeat: 1, // Single bar as requested
      _expanded: true,
      _presetAccents: accents,
    };

    // Clear existing patterns and add the new one
    setPatterns([pattern]);
  };

  return (
    <div
      style={{
        padding: '1rem',
        marginBottom: '1rem',
        backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
        border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <label
        style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: darkMode ? '#cbd5e1' : '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        Time Signature:
        <select
          value={timeSignature}
          onChange={(e) => setTimeSignature(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
            color: darkMode ? '#f1f5f9' : '#1e293b',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <option value="4/4">4/4</option>
          <option value="3/4">3/4</option>
          <option value="2/4">2/4</option>
          <option value="5/4">5/4</option>
          <option value="7/8">7/8</option>
          <option value="6/8">6/8</option>
        </select>
      </label>

      <label
        style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: darkMode ? '#cbd5e1' : '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        Subdivision:
        <select
          value={subdivision}
          onChange={(e) => setSubdivision(Number(e.target.value))}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
            color: darkMode ? '#f1f5f9' : '#1e293b',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <option value="4">Quarter notes</option>
          <option value="8">Eighth notes</option>
          <option value="12">Eighth triplets</option>
          <option value="16">Sixteenth notes</option>
          <option value="24">Sixteenth triplets</option>
          <option value="32">Thirty-second notes</option>
        </select>
      </label>

      <button
        onClick={handleGeneratePattern}
        style={{
          padding: '0.625rem 1.25rem',
          borderRadius: '6px',
          backgroundColor: darkMode ? '#3b82f6' : '#2563eb',
          color: '#ffffff',
          fontSize: '0.875rem',
          fontWeight: '600',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = darkMode ? '#2563eb' : '#1d4ed8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = darkMode ? '#3b82f6' : '#2563eb';
        }}
      >
        Generate Pattern
      </button>

      <div
        style={{
          fontSize: '0.75rem',
          color: darkMode ? '#94a3b8' : '#64748b',
          marginLeft: 'auto',
        }}
      >
        Creates a random 1-bar pattern
      </div>
    </div>
  );
}
