/**
 * Save Pattern Modal - Allows users to save custom patterns as presets
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Pattern } from '@/types/pattern';
import { saveCustomPreset, patternToPreset, generateDefaultPresetName } from '@/lib/utils/presetStorage';
import { usePresets } from '@/hooks/usePresets';

interface SavePatternModalProps {
  onClose: () => void;
  patternIndex?: number; // If provided, save only this pattern. Otherwise, save all patterns.
}

export const SavePatternModal: React.FC<SavePatternModalProps> = ({ onClose, patternIndex }) => {
  const patterns = useStore((state) => state.patterns);
  const { refreshPresets, categories, subcategories } = usePresets();
  
  // Determine which pattern(s) to save
  const patternsToSave: Pattern[] = patternIndex !== undefined 
    ? [patterns[patternIndex]].filter(Boolean)
    : patterns;
  
  // State for form inputs (one set per pattern)
  const [formData, setFormData] = useState<Array<{
    name: string;
    category: string;
    subcategory: string;
    tags: string;
    description: string;
    difficulty: number;
    bpm: number;
  }>>([]);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form data when patterns change
  useEffect(() => {
    if (patternsToSave.length === 0) {
      onClose();
      return;
    }

    setFormData(
      patternsToSave.map((pattern, index) => ({
        name: generateDefaultPresetName(pattern, index),
        category: 'custom',
        subcategory: 'user-created',
        tags: '',
        description: '',
        difficulty: 5,
        bpm: 60,
      }))
    );
  }, [patternsToSave.length, onClose]);

  const handleInputChange = (
    index: number,
    field: keyof typeof formData[0],
    value: string | number
  ) => {
    setFormData(prev => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [field]: value };
      return newData;
    });
  };

  const handleSave = async () => {
    if (patternsToSave.length === 0) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate all forms
      for (let i = 0; i < formData.length; i++) {
        const data = formData[i];
        if (!data.name.trim()) {
          throw new Error(`Pattern ${i + 1}: Name is required`);
        }
        if (!data.category.trim()) {
          throw new Error(`Pattern ${i + 1}: Category is required`);
        }
        if (data.difficulty < 1 || data.difficulty > 10) {
          throw new Error(`Pattern ${i + 1}: Difficulty must be between 1 and 10`);
        }
      }

      // Save all patterns
      for (let i = 0; i < patternsToSave.length; i++) {
        const pattern = patternsToSave[i];
        const data = formData[i];
        
        const tags = data.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);

        const preset = patternToPreset(pattern, {
          name: data.name.trim(),
          category: data.category.trim(),
          subcategory: data.subcategory.trim(),
          tags,
          description: data.description.trim(),
          difficulty: data.difficulty,
          bpm: data.bpm,
        });

        saveCustomPreset(preset);
      }

      // Refresh presets to include the new ones
      refreshPresets();
      
      setSuccess(true);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset');
    } finally {
      setSaving(false);
    }
  };

  if (patternsToSave.length === 0) {
    return null;
  }

  return (
    <div
      className="dpgen-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="dpgen-modal-content"
        style={{
          background: 'var(--dpgen-bg)',
          borderRadius: '10px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            Save {patternsToSave.length === 1 ? 'Pattern' : `${patternsToSave.length} Patterns`} as Preset
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--dpgen-text)',
              padding: '0.25rem 0.5rem',
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              background: 'var(--dpgen-error-bg, #fee)',
              color: 'var(--dpgen-error-text, #c00)',
              borderRadius: '5px',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '0.75rem',
              background: 'var(--dpgen-success-bg, #efe)',
              color: 'var(--dpgen-success-text, #060)',
              borderRadius: '5px',
              marginBottom: '1rem',
            }}
          >
            Preset{patternsToSave.length > 1 ? 's' : ''} saved successfully!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {patternsToSave.map((pattern, index) => {
            const data = formData[index];
            if (!data) return null;

            return (
              <div
                key={pattern.id}
                style={{
                  border: '1px solid var(--dpgen-border)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                }}
              >
                {patternsToSave.length > 1 && (
                  <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>
                    Pattern {index + 1}: {pattern.timeSignature} {pattern.subdivision}
                  </h3>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Name <span style={{ color: 'var(--dpgen-error-text, #c00)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="dpgen-input"
                      value={data.name}
                      onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                      style={{ width: '100%' }}
                      placeholder="Enter preset name"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Category <span style={{ color: 'var(--dpgen-error-text, #c00)' }}>*</span>
                      </label>
                      <select
                        className="dpgen-select"
                        value={data.category}
                        onChange={(e) => handleInputChange(index, 'category', e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="custom">Custom</option>
                        {categories.filter(cat => cat !== 'custom').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Subcategory
                      </label>
                      <input
                        type="text"
                        className="dpgen-input"
                        value={data.subcategory}
                        onChange={(e) => handleInputChange(index, 'subcategory', e.target.value)}
                        style={{ width: '100%' }}
                        placeholder="e.g., user-created"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      className="dpgen-input"
                      value={data.tags}
                      onChange={(e) => handleInputChange(index, 'tags', e.target.value)}
                      style={{ width: '100%' }}
                      placeholder="e.g., custom, practice, favorite"
                    />
                  </div>

                  <div>
                    <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Description
                    </label>
                    <textarea
                      className="dpgen-input"
                      value={data.description}
                      onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                      style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                      placeholder="Optional description"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Difficulty (1-10) <span style={{ color: 'var(--dpgen-error-text, #c00)' }}>*</span>
                      </label>
                      <input
                        type="number"
                        className="dpgen-input"
                        value={data.difficulty}
                        onChange={(e) => handleInputChange(index, 'difficulty', parseInt(e.target.value, 10) || 5)}
                        min={1}
                        max={10}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label className="dpgen-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                        BPM
                      </label>
                      <input
                        type="number"
                        className="dpgen-input"
                        value={data.bpm}
                        onChange={(e) => handleInputChange(index, 'bpm', parseInt(e.target.value, 10) || 60)}
                        min={40}
                        max={200}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'var(--dpgen-card-bg, rgba(0,0,0,0.05))', 
                    borderRadius: '5px',
                    fontSize: '0.875rem',
                    color: 'var(--dpgen-text-secondary)',
                  }}>
                    <strong>Pattern:</strong> {pattern.drumPattern} | <strong>Sticking:</strong> {pattern.stickingPattern} | <strong>Phrase:</strong> {pattern.phrase}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <button
            type="button"
            className="dpgen-button dpgen-button-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="dpgen-button dpgen-button-primary"
            onClick={handleSave}
            disabled={saving || success}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }} />
                Saving...
              </>
            ) : success ? (
              <>
                <i className="fas fa-check" style={{ marginRight: '0.5rem' }} />
                Saved!
              </>
            ) : (
              <>
                <i className="fas fa-save" style={{ marginRight: '0.5rem' }} />
                Save Preset{patternsToSave.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

