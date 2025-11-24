'use client';

import { useState, useMemo } from 'react';
import { usePresets } from '@/hooks/usePresets';
import { Preset } from '@/types/preset';
import { useStore } from '@/store/useStore';
import { parseTimeSignature, buildAccentIndices, parseNumberList, parseTokens, formatList, calculateNotesPerBar } from '@/lib/utils/patternUtils';
import { getSubdivisionTextWithSuffix } from '@/lib/utils/subdivisionUtils';

interface PresetsBrowserProps {
  onClose: () => void;
}

export const PresetsBrowser: React.FC<PresetsBrowserProps> = ({ onClose }) => {
  const { presets, loading, error, categories, subcategories, tags, searchPresets, filterByCategory, filterBySubcategory, filterByTag, filterByDifficulty } = usePresets();
  const addPattern = useStore((state) => state.addPattern);
  const practicePadMode = useStore((state) => state.practicePadMode);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [minDifficulty, setMinDifficulty] = useState(1);
  const [maxDifficulty, setMaxDifficulty] = useState(10);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

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

  const handleLoadPreset = (preset: Preset) => {
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
    onClose(); // Close modal after loading preset
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedTag('');
    setMinDifficulty(1);
    setMaxDifficulty(10);
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
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '60%', height: '24px', background: 'var(--dpgen-border)', borderRadius: '4px', animation: 'skeleton-loading 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }} />
              <div style={{ width: '40%', height: '20px', background: 'var(--dpgen-border)', borderRadius: '4px', animation: 'skeleton-loading 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--dpgen-card)', borderRadius: '8px', border: '1px solid var(--dpgen-border)' }}>
                  <div style={{ width: '80px', height: '80px', background: 'var(--dpgen-border)', borderRadius: '8px', animation: 'skeleton-loading 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ width: '70%', height: '20px', background: 'var(--dpgen-border)', borderRadius: '4px', animation: 'skeleton-loading 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }} />
                    <div style={{ width: '50%', height: '16px', background: 'var(--dpgen-border)', borderRadius: '4px', animation: 'skeleton-loading 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }} />
                    <div style={{ width: '60%', height: '16px', background: 'var(--dpgen-border)', borderRadius: '4px', animation: 'skeleton-loading 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }} />
                  </div>
                </div>
              ))}
            </div>
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
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            <i className="fas fa-book" style={{ marginRight: '0.5rem' }} />
            Browse Presets
          </h2>
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
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
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
                  <option key={sub} value={sub}>{sub.charAt(0).toUpperCase() + sub.slice(1)}</option>
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
                {tags.slice(0, 20).map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty Range */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              Difficulty: {minDifficulty} - {maxDifficulty}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={minDifficulty}
              onChange={(e) => setMinDifficulty(Number(e.target.value))}
              style={{ flex: 1, maxWidth: '150px' }}
            />
            <input
              type="range"
              min="1"
              max="10"
              value={maxDifficulty}
              onChange={(e) => setMaxDifficulty(Number(e.target.value))}
              style={{ flex: 1, maxWidth: '150px' }}
            />
          </div>

          {/* Clear Filters */}
          <button
            onClick={handleClearFilters}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--dpgen-bg)',
              border: '1px solid var(--dpgen-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            <i className="fas fa-times-circle" style={{ marginRight: '0.5rem' }} />
            Clear Filters
          </button>

          {/* Results count */}
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--dpgen-muted)' }}>
            Showing {filteredPresets.length} of {presets.length} presets
          </div>
        </div>

        {/* Presets List */}
        <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--dpgen-border)', borderRadius: '6px', padding: '1rem' }}>
          {filteredPresets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dpgen-muted)' }}>
              <i className="fas fa-search" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
              <p>No presets found matching your filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {filteredPresets.map((preset) => (
                <div
                  key={preset.id}
                  style={{
                    border: '1px solid var(--dpgen-border)',
                    borderRadius: '8px',
                    padding: '1rem',
                    background: selectedPreset?.id === preset.id ? 'var(--dpgen-accent-light)' : 'var(--dpgen-bg)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSelectedPreset(preset)}
                  onDoubleClick={() => handleLoadPreset(preset)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                      {preset.name}
                    </h3>
                    <div style={{
                      background: preset.difficulty <= 3 ? '#10b981' : preset.difficulty <= 6 ? '#f59e0b' : '#ef4444',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {preset.difficulty}/10
                    </div>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--dpgen-muted)', lineHeight: 1.4 }}>
                    {preset.description}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginBottom: '0.5rem' }}>
                    <div>
                      <strong>{preset.timeSignature}</strong> • {getSubdivisionTextWithSuffix(preset.subdivision)}
                    </div>
                    <div>
                      {preset.category} • {preset.subcategory}
                    </div>
                    <div style={{ marginTop: '0.25rem' }}>
                      {preset.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{
                          display: 'inline-block',
                          background: 'var(--dpgen-accent-light)',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          marginRight: '0.25rem',
                          marginTop: '0.25rem',
                          fontSize: '0.7rem',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadPreset(preset);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'var(--dpgen-accent)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginTop: '0.5rem',
                    }}
                  >
                    <i className="fas fa-plus" style={{ marginRight: '0.25rem' }} />
                    Load Preset
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

