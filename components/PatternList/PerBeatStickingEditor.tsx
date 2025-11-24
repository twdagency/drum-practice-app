/**
 * Per-Beat Sticking Editor Component
 * Allows users to set sticking pattern for each beat in a bar
 */

'use client';

import React from 'react';
import { parseTimeSignature, calculateNotesPerBarFromPerBeatSubdivisions, generateStickingForDrumPattern } from '@/lib/utils/patternUtils';

interface PerBeatStickingEditorProps {
  timeSignature: string;
  perBeatSubdivisions: number[];
  perBeatVoicing: string[];
  perBeatSticking: string[];
  onStickingChange: (sticking: string[]) => void;
  practicePadMode: boolean;
}

export function PerBeatStickingEditor({
  timeSignature,
  perBeatSubdivisions,
  perBeatVoicing,
  perBeatSticking,
  onStickingChange,
  practicePadMode,
}: PerBeatStickingEditorProps) {
  const [numerator] = parseTimeSignature(timeSignature);
  const { notesPerBeat } = calculateNotesPerBarFromPerBeatSubdivisions(timeSignature, perBeatSubdivisions);
  const hasCorrectBeats = perBeatSticking.length === numerator;

  const handleStickingChange = (index: number, newSticking: string) => {
    const newStickingArray = [...perBeatSticking];
    newStickingArray[index] = newSticking;
    onStickingChange(newStickingArray);
  };

  const handleRandomizeBeat = (index: number) => {
    const notesInBeat = notesPerBeat[index] || 1;
    const voicing = perBeatVoicing[index] || 'S';
    const randomSticking = generateStickingForDrumPattern(voicing, notesInBeat, practicePadMode);
    handleStickingChange(index, randomSticking);
  };

  const handleRandomizeAll = () => {
    const newSticking: string[] = [];
    for (let i = 0; i < numerator; i++) {
      const notesInBeat = notesPerBeat[i] || 1;
      const voicing = perBeatVoicing[i] || 'S';
      newSticking.push(generateStickingForDrumPattern(voicing, notesInBeat, practicePadMode));
    }
    onStickingChange(newSticking);
  };

  return (
    <div className="per-beat-sticking-editor bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
            Per-Beat Sticking
          </label>
          <div className="flex items-center gap-2">
            {hasCorrectBeats ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {numerator} beats
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {perBeatSticking.length} of {numerator} beats
              </span>
            )}
            <button
              onClick={handleRandomizeAll}
              className="px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              title="Randomize all beats"
            >
              <i className="fas fa-dice" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Set sticking pattern for each beat (e.g., "R L R L" or "K R L R")
        </p>
      </div>
      
      <div className="space-y-2.5">
        {perBeatSticking.map((sticking, index) => {
          const notesInBeat = notesPerBeat[index] || 0;
          return (
            <div 
              key={index} 
              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold text-sm">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <input
                  type="text"
                  value={sticking}
                  onChange={(e) => handleStickingChange(index, e.target.value)}
                  placeholder={`Beat ${index + 1} (${notesInBeat} notes)`}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2 min-w-[60px]">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {notesInBeat} note{notesInBeat !== 1 ? 's' : ''}
                </span>
              </div>
              
              <button
                onClick={() => handleRandomizeBeat(index)}
                className="flex items-center justify-center w-8 h-8 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 transition-colors"
                title="Randomize this beat"
              >
                <i className="fas fa-dice text-xs" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

