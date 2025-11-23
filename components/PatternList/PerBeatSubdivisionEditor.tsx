/**
 * Per-Beat Subdivision Editor Component
 * Allows users to set subdivision for each beat in a bar
 */

'use client';

import React from 'react';
import { getSubdivisionText } from '@/lib/utils/subdivisionUtils';
import { calculateNotesPerBarFromPerBeatSubdivisions, parseTimeSignature } from '@/lib/utils/patternUtils';

interface PerBeatSubdivisionEditorProps {
  timeSignature: string;
  perBeatSubdivisions: number[];
  onSubdivisionsChange: (subdivisions: number[]) => void;
}

const AVAILABLE_SUBDIVISIONS = [4, 8, 12, 16, 24, 32];

export function PerBeatSubdivisionEditor({
  timeSignature,
  perBeatSubdivisions,
  onSubdivisionsChange,
}: PerBeatSubdivisionEditorProps) {
  const [numerator] = parseTimeSignature(timeSignature);
  const { notesPerBar, notesPerBeat } = calculateNotesPerBarFromPerBeatSubdivisions(timeSignature, perBeatSubdivisions);
  const hasCorrectBeats = perBeatSubdivisions.length === numerator;

  const handleSubdivisionChange = (index: number, newSubdivision: number) => {
    const newSubdivisions = [...perBeatSubdivisions];
    newSubdivisions[index] = newSubdivision;
    onSubdivisionsChange(newSubdivisions);
  };

  const handleAddBeat = () => {
    // Add a new beat with the same subdivision as the last beat, or default to 16
    const lastSubdivision = perBeatSubdivisions[perBeatSubdivisions.length - 1] || 16;
    onSubdivisionsChange([...perBeatSubdivisions, lastSubdivision]);
  };

  const handleRemoveBeat = (index: number) => {
    if (perBeatSubdivisions.length > 1) {
      const newSubdivisions = perBeatSubdivisions.filter((_, i) => i !== index);
      onSubdivisionsChange(newSubdivisions);
    }
  };

  return (
    <div className="per-beat-subdivision-editor bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
            Per-Beat Subdivisions
          </label>
          {hasCorrectBeats ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {numerator} beats • {notesPerBar} notes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {perBeatSubdivisions.length} of {numerator} beats
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Set different subdivisions for each beat in the bar
        </p>
      </div>
      
      <div className="space-y-2.5">
        {perBeatSubdivisions.map((subdivision, index) => {
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
                <select
                  value={subdivision}
                  onChange={(e) => handleSubdivisionChange(index, parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {AVAILABLE_SUBDIVISIONS.map((sub) => (
                    <option key={sub} value={sub}>
                      {getSubdivisionText(sub)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2 min-w-[80px]">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {notesInBeat} note{notesInBeat !== 1 ? 's' : ''}
                </span>
              </div>
              
              {perBeatSubdivisions.length > 1 && (
                <button
                  onClick={() => handleRemoveBeat(index)}
                  className="flex items-center justify-center w-8 h-8 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove beat"
                  aria-label={`Remove beat ${index + 1}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {perBeatSubdivisions.length < numerator && (
        <button
          onClick={handleAddBeat}
          className="mt-3 w-full px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Beat
        </button>
      )}
    </div>
  );
}

