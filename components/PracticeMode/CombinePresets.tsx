'use client';

import { useState, useMemo } from 'react';
import { usePresets } from '@/hooks/usePresets';
import { Preset } from '@/types/preset';
import { useStore } from '@/store/useStore';
import { parseTimeSignature, buildAccentIndices, parseNumberList, parseTokens, formatList, calculateNotesPerBar } from '@/lib/utils/patternUtils';
import { getSubdivisionTextWithSuffix } from '@/lib/utils/subdivisionUtils';

interface CombinePresetsProps {
  onClose: () => void;
}

export const CombinePresets: React.FC<CombinePresetsProps> = ({ onClose }) => {
  const { presets, loading, error, categories, subcategories, tags, searchPresets } = usePresets();
  const addPattern = useStore((state) => state.addPattern);
  const practicePadMode = useStore((state) => state.practicePadMode);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [minDifficulty, setMinDifficulty] = useState(1);
  const [maxDifficulty, setMaxDifficulty] = useState(10);
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(new Set());

  // Filter presets based on all selected filters
  const filteredPresets = useMemo(() => {
    let filtered = presets;

    // Apply search query
    if (searchQuery.trim()) {
      filtered = searchPresets(searchQuery);
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Apply subcategory filter
    if (selectedSubcategory) {
      filtered = filtered.filter(p => p.subcategory === selectedSubcategory);
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(p => p.tags.includes(selectedTag));
    }

    // Apply difficulty filter
    filtered = filtered.filter(p => p.difficulty >= minDifficulty && p.difficulty <= maxDifficulty);

    // Sort by difficulty, then by name
    return filtered.sort((a, b) => {
      if (a.difficulty !== b.difficulty) {
        return a.difficulty - b.difficulty;
      }
      return a.name.localeCompare(b.name);
    });
  }, [presets, searchQuery, selectedCategory, selectedSubcategory, selectedTag, minDifficulty, maxDifficulty, searchPresets]);

  const handleTogglePreset = (presetId: string) => {
    const newSelected = new Set(selectedPresetIds);
    if (newSelected.has(presetId)) {
      newSelected.delete(presetId);
    } else {
      newSelected.add(presetId);
    }
    setSelectedPresetIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPresetIds.size === filteredPresets.length) {
      setSelectedPresetIds(new Set());
    } else {
      setSelectedPresetIds(new Set(filteredPresets.map(p => p.id)));
    }
  };

  const handleCombinePresets = () => {
    const selectedPresets = presets.filter(p => selectedPresetIds.has(p.id));
    
    selectedPresets.forEach(preset => {
      const [beats, beatType] = parseTimeSignature(preset.timeSignature);
      
      // Parse phrase and calculate accent indices (first note of each group)
      const phraseValues = parseNumberList(preset.phrase);
      const accentIndices = buildAccentIndices(phraseValues);

      // In Practice Pad mode, convert voicing to "S" and remove "K" from sticking
      let drumPattern = preset.drumPattern;
      let stickingPattern = preset.stickingPattern;
      
      if (practicePadMode) {
        // Calculate notes per bar to generate all "S" pattern
        const notesPerBar = calculateNotesPerBar(preset.timeSignature, preset.subdivision);
        drumPattern = Array(notesPerBar).fill('S').join(' ');
        
        // Remove all "K" from sticking pattern
        const stickingTokens = parseTokens(stickingPattern);
        const filteredSticking = stickingTokens.map(token => {
          const upperToken = token.toUpperCase();
          if (upperToken === 'K') {
            return Math.random() > 0.5 ? 'R' : 'L';
          }
          return token;
        });
        stickingPattern = formatList(filteredSticking);
      }

      // Create pattern from preset
      const pattern = {
        id: 0, // Will be replaced by addPattern
        timeSignature: preset.timeSignature,
        beats,
        beatType,
        subdivision: preset.subdivision,
        phrase: preset.phrase,
        drumPattern, // Use converted drumPattern (all "S" if practice pad mode)
        stickingPattern, // Use converted stickingPattern (no "K" if practice pad mode)
        repeat: preset.repeat,
        accentIndices,
        leftFoot: false,
        rightFoot: false,
        _presetName: preset.name,
        _presetDescription: preset.description,
        _presetAccents: accentIndices,
      };

      addPattern(pattern);
    });

    onClose(); // Close modal after combining presets
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedTag('');
    setMinDifficulty(1);
    setMaxDifficulty(10);
    setSelectedPresetIds(new Set());
  };

  if (loading) {
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
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
            <p>Loading presets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
            <p>Error loading presets: {error}</p>
            <button
              onClick={onClose}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'var(--dpgen-bg)',
                border: '1px solid var(--dpgen-border)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
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
          maxWidth: '1000px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
              <i className="fas fa-layer-group" style={{ marginRight: '0.5rem' }} />
              Combine Presets
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--dpgen-muted)' }}>
              Select multiple presets to add them all to your pattern list
              {selectedPresetIds.size > 0 && (
                <span style={{ marginLeft: '0.5rem', fontWeight: 600, color: 'var(--dpgen-text)' }}>
                  ({selectedPresetIds.size} selected)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--dpgen-muted)',
              padding: '0.25rem 0.5rem',
            }}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {/* Search */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                <i className="fas fa-search" style={{ marginRight: '0.25rem' }} />
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search presets..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--dpgen-border)',
                  background: 'var(--dpgen-bg)',
                  color: 'var(--dpgen-text)',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--dpgen-border)',
                  background: 'var(--dpgen-bg)',
                  color: 'var(--dpgen-text)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Subcategory
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--dpgen-border)',
                  background: 'var(--dpgen-bg)',
                  color: 'var(--dpgen-text)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">All Subcategories</option>
                {subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Tag */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Tag
              </label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--dpgen-border)',
                  background: 'var(--dpgen-bg)',
                  color: 'var(--dpgen-text)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">All Tags</option>
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty Range */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Min Difficulty: {minDifficulty}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={minDifficulty}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value, 10);
                  setMinDifficulty(newMin);
                  if (newMin > maxDifficulty) {
                    setMaxDifficulty(newMin);
                  }
                }}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Max Difficulty: {maxDifficulty}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={maxDifficulty}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value, 10);
                  setMaxDifficulty(newMax);
                  if (newMax < minDifficulty) {
                    setMinDifficulty(newMax);
                  }
                }}
                style={{ width: '100%' }}
              />
            </div>
            <button
              onClick={handleClearFilters}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid var(--dpgen-border)',
                borderRadius: '6px',
                color: 'var(--dpgen-text)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                alignSelf: 'flex-end',
              }}
            >
              <i className="fas fa-times" style={{ marginRight: '0.25rem' }} />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Presets Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            border: '1px solid var(--dpgen-border)',
            borderRadius: '6px',
            padding: '1rem',
            background: 'var(--dpgen-bg-secondary)',
          }}
        >
          {filteredPresets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dpgen-muted)' }}>
              <i className="fas fa-inbox" style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
              <p>No presets match your filters</p>
            </div>
          ) : (
            <>
              {/* Select All Button */}
              <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--dpgen-border)' }}>
                <button
                  onClick={handleSelectAll}
                  style={{
                    padding: '0.5rem 1rem',
                    background: selectedPresetIds.size === filteredPresets.length ? 'var(--dpgen-primary)' : 'transparent',
                    border: '1px solid var(--dpgen-border)',
                    borderRadius: '6px',
                    color: selectedPresetIds.size === filteredPresets.length ? 'white' : 'var(--dpgen-text)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  <i className={`fas ${selectedPresetIds.size === filteredPresets.length ? 'fa-check-square' : 'fa-square'}`} style={{ marginRight: '0.5rem' }} />
                  {selectedPresetIds.size === filteredPresets.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {filteredPresets.map(preset => {
                  const isSelected = selectedPresetIds.has(preset.id);
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleTogglePreset(preset.id)}
                      style={{
                        padding: '1rem',
                        borderRadius: '6px',
                        border: `2px solid ${isSelected ? 'var(--dpgen-primary)' : 'var(--dpgen-border)'}`,
                        background: isSelected ? 'var(--dpgen-primary)' : 'var(--dpgen-bg)',
                        color: isSelected ? 'white' : 'var(--dpgen-text)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--dpgen-primary)';
                          e.currentTarget.style.opacity = '0.8';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--dpgen-border)';
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                        <i className={`fas ${isSelected ? 'fa-check-circle' : 'fa-circle'}`} style={{ fontSize: '1.25rem' }} />
                      </div>

                      {/* Preset Info */}
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>
                        {preset.name}
                      </h3>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', opacity: 0.8 }}>
                        {preset.category} • {preset.subcategory}
                      </p>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', lineHeight: '1.4' }}>
                        {preset.description}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {preset.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'var(--dpgen-bg-secondary)',
                              fontSize: '0.75rem',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        <span>
                          {preset.timeSignature} • {getSubdivisionTextWithSuffix(preset.subdivision)}
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          Difficulty: {preset.difficulty}/10
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--dpgen-border)', flexShrink: 0 }}>
          <div style={{ color: 'var(--dpgen-muted)', fontSize: '0.875rem' }}>
            {filteredPresets.length} preset{filteredPresets.length !== 1 ? 's' : ''} found
            {selectedPresetIds.size > 0 && (
              <span style={{ marginLeft: '0.5rem', color: 'var(--dpgen-text)', fontWeight: 600 }}>
                • {selectedPresetIds.size} selected
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                border: '1px solid var(--dpgen-border)',
                borderRadius: '6px',
                color: 'var(--dpgen-text)',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCombinePresets}
              disabled={selectedPresetIds.size === 0}
              style={{
                padding: '0.75rem 1.5rem',
                background: selectedPresetIds.size > 0 ? 'var(--dpgen-primary)' : 'var(--dpgen-bg-secondary)',
                border: 'none',
                borderRadius: '6px',
                color: selectedPresetIds.size > 0 ? 'white' : 'var(--dpgen-muted)',
                cursor: selectedPresetIds.size > 0 ? 'pointer' : 'not-allowed',
                fontSize: '0.875rem',
                fontWeight: 600,
                opacity: selectedPresetIds.size > 0 ? 1 : 0.5,
              }}
            >
              <i className="fas fa-layer-group" style={{ marginRight: '0.5rem' }} />
              Combine {selectedPresetIds.size > 0 ? `(${selectedPresetIds.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

