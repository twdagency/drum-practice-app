/**
 * Landing Pattern Generator - Interactive pattern generator for the landing page
 * Creates patterns and updates the LandingStave display
 */

'use client';

import React, { useState, useEffect } from 'react';
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

interface LandingPatternGeneratorProps {
  onPatternChange: (pattern: Pattern) => void;
}

export function LandingPatternGenerator({ onPatternChange }: LandingPatternGeneratorProps) {
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [subdivision, setSubdivision] = useState(8);

  const handleGeneratePattern = () => {
    // Calculate notes per bar based on selected time signature and subdivision
    const notesPerBar = calculateNotesPerBar(timeSignature, subdivision);
    
    // Generate random accents
    const accents = randomizeAccents(notesPerBar);
    const phraseArray = buildPhraseFromAccents(accents, notesPerBar);
    const phrase = formatList(phraseArray);
    
    // Generate full bar pattern with variation
    const [numerator, denominator] = parseTimeSignature(timeSignature);
    const notesPerBeat = subdivision / denominator;
    
    // Generate drum pattern (voicing) for the full bar
    const fullBarVoicing: string[] = [];
    for (let i = 0; i < notesPerBar; i++) {
      // Pick random drum pattern set for variety
      const drumPatternArray = getRandomItem([...randomSets.drumPatterns]) as readonly string[];
      const tokenIndex = i % drumPatternArray.length;
      fullBarVoicing.push(drumPatternArray[tokenIndex]);
    }
    const drumPattern = formatList(fullBarVoicing);
    
    // Generate sticking pattern for the full bar
    const stickingPattern = generateStickingForDrumPattern(drumPattern, notesPerBar, false);
    
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

    // Notify parent component of pattern change
    onPatternChange(pattern);
  };

  // Generate initial pattern on mount
  useEffect(() => {
    handleGeneratePattern();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        padding: '1rem',
        marginBottom: '1.5rem',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(71, 85, 105, 0.3)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        backdropFilter: 'blur(8px)',
      }}
    >
      <label
        style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#cbd5e1',
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
            border: '1px solid rgba(71, 85, 105, 0.5)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            color: '#f1f5f9',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <option value="4/4">4/4</option>
          <option value="3/4">3/4</option>
          <option value="5/4">5/4</option>
        </select>
      </label>

      <label
        style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#cbd5e1',
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
            border: '1px solid rgba(71, 85, 105, 0.5)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            color: '#f1f5f9',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <option value="4">Quarter notes</option>
          <option value="8">Eighth notes</option>
        </select>
      </label>

      <button
        onClick={handleGeneratePattern}
        style={{
          padding: '0.625rem 1.25rem',
          borderRadius: '6px',
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          fontSize: '0.875rem',
          fontWeight: '600',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#3b82f6';
        }}
      >
        Generate Pattern
      </button>

      <div
        style={{
          fontSize: '0.75rem',
          color: '#94a3b8',
          marginLeft: 'auto',
        }}
      >
        Creates a random 1-bar pattern
      </div>
    </div>
  );
}
