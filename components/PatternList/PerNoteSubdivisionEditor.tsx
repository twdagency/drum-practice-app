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
    <div className="per-beat-subdivision-editor">
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">
          Per-Beat Subdivisions
          {!hasCorrectBeats && (
            <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
              ({perBeatSubdivisions.length} beats, need {numerator} beats)
            </span>
          )}
          {hasCorrectBeats && (
            <span className="ml-2 text-xs text-green-600 dark:text-green-400">
              ✓ {numerator} beats ({notesPerBar} total notes)
            </span>
          )}
        </label>
      </div>
      
      <div className="space-y-2">
        {perBeatSubdivisions.map((subdivision, index) => {
          const notesInBeat = notesPerBeat[index] || 0;
          return (
            <div key={index} className="flex items-center gap-2 p-2 border rounded dark:border-gray-700">
              <span className="text-sm font-medium w-12">Beat {index + 1}</span>
              
              <select
                value={subdivision}
                onChange={(e) => handleSubdivisionChange(index, parseInt(e.target.value, 10))}
                className="flex-1 px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700"
              >
                {AVAILABLE_SUBDIVISIONS.map((sub) => (
                  <option key={sub} value={sub}>
                    {getSubdivisionText(sub)}
                  </option>
                ))}
              </select>
              
              <span className="text-xs text-gray-500 dark:text-gray-400 w-20">
                {notesInBeat} note{notesInBeat !== 1 ? 's' : ''}
              </span>
              
              {perBeatSubdivisions.length > 1 && (
                <button
                  onClick={() => handleRemoveBeat(index)}
                  className="px-2 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  title="Remove beat"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {perBeatSubdivisions.length < numerator && (
        <button
          onClick={handleAddBeat}
          className="mt-2 px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700"
        >
          + Add Beat
        </button>
      )}
    </div>
  );
}

