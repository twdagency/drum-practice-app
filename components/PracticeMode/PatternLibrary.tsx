'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Pattern } from '@/types';
import { exportPatternCollection, sharePatternURL, importPatternCollection } from '@/lib/utils/exportUtils';
import { useToast } from '@/components/shared/Toast';
import { CollapsibleSection } from '@/components/shared/CollapsibleSection';
import { calculateDifficultyRating, getDifficultyColor, getDifficultyLabel } from '@/lib/utils/difficultyUtils';

interface LibraryPattern {
  id: string;
  name: string;
  description?: string;
  pattern: Pattern;
  difficulty: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  createdAt: number;
  tags?: string[];
  isTemplate?: boolean; // Mark as template/snippet for quick access
  category?: string; // Template category
}

export function PatternLibrary() {
  const { showToast } = useToast();
  const patterns = useStore((state) => state.patterns);
  const bpm = useStore((state) => state.bpm);
  const addPattern = useStore((state) => state.addPattern);
  const clearPatterns = useStore((state) => state.clearPatterns);
  const setBPM = useStore((state) => state.setBPM);
  
  const [library, setLibrary] = useState<LibraryPattern[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dpgen_pattern_library');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showTemplatesOnly, setShowTemplatesOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Save library to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dpgen_pattern_library', JSON.stringify(library));
    }
  }, [library]);
  
  const filteredLibrary = useMemo(() => {
    let filtered = library;
    
    if (showTemplatesOnly) {
      filtered = filtered.filter(item => item.isTemplate === true);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        item.category?.toLowerCase().includes(query)
      );
    }
    
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(item => item.level === selectedDifficulty);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [library, searchQuery, selectedDifficulty, showTemplatesOnly, selectedCategory]);
  
  const categories = useMemo(() => {
    const cats = new Set<string>();
    library.forEach(item => {
      if (item.category) {
        cats.add(item.category);
      }
    });
    return Array.from(cats).sort();
  }, [library]);
  
  const handleSaveToLibrary = (pattern: Pattern, name: string, description?: string, isTemplate?: boolean, category?: string) => {
    const difficulty = calculateDifficultyRating(pattern);
    const libraryItem: LibraryPattern = {
      id: `lib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      pattern: {
        ...pattern,
        _expanded: false, // Remove UI state
      },
      difficulty: difficulty.score,
      level: difficulty.level,
      createdAt: Date.now(),
      tags: [],
      isTemplate: isTemplate ?? false,
      category: category,
    };
    
    setLibrary(prev => [...prev, libraryItem]);
    showToast(`Pattern "${name}" saved to library`, 'success');
  };
  
  const handleSaveAsTemplate = (pattern: Pattern) => {
    const name = prompt('Enter a name for this template:');
    if (!name) return;
    
    const description = prompt('Enter a description (optional):') || undefined;
    const category = prompt('Enter a category (e.g., "Groove", "Fill", "Rudiment") (optional):') || undefined;
    
    handleSaveToLibrary(pattern, name, description, true, category);
  };
  
  const handleToggleTemplate = (id: string) => {
    setLibrary(prev => prev.map(item => 
      item.id === id ? { ...item, isTemplate: !item.isTemplate } : item
    ));
  };
  
  const handleLoadFromLibrary = (libraryItem: LibraryPattern) => {
    const newPattern = {
      ...libraryItem.pattern,
      id: Date.now() + Math.random(), // Generate new ID
    };
    addPattern(newPattern);
    showToast(`Pattern "${libraryItem.name}" loaded`, 'success');
  };
  
  const handleDeleteFromLibrary = (id: string) => {
    if (confirm('Are you sure you want to delete this pattern from your library?')) {
      setLibrary(prev => prev.filter(item => item.id !== id));
      showToast('Pattern removed from library', 'success');
    }
  };
  
  const handleShareLibraryItem = (libraryItem: LibraryPattern) => {
    sharePatternURL([libraryItem.pattern], bpm);
  };
  
  const handleExportLibrary = () => {
    if (library.length === 0) {
      showToast('Library is empty', 'warning');
      return;
    }
    
    const libraryPatterns = library.map(item => item.pattern);
    exportPatternCollection(libraryPatterns, bpm);
  };
  
  const handleImportToLibrary = (file: File) => {
    importPatternCollection(file, (importedPatterns, importedBpm) => {
      importedPatterns.forEach((pattern, index) => {
        const difficulty = calculateDifficultyRating(pattern);
        const libraryItem: LibraryPattern = {
          id: `lib_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          name: pattern._presetName || `Imported Pattern ${index + 1}`,
          description: pattern._presetDescription,
          pattern: {
            ...pattern,
            _expanded: false,
          },
          difficulty: difficulty.score,
          level: difficulty.level,
          createdAt: Date.now(),
          tags: [],
        };
        setLibrary(prev => [...prev, libraryItem]);
      });
      showToast(`Imported ${importedPatterns.length} pattern${importedPatterns.length !== 1 ? 's' : ''} to library`, 'success');
    });
  };
  
  return (
    <div className="dpgen-card" style={{ marginTop: '1rem' }}>
      <CollapsibleSection
        title="Pattern Library"
        icon="fas fa-book"
        defaultExpanded={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Save Current Patterns */}
          {patterns.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>
                Save Current Patterns
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    const name = prompt('Enter a name for this pattern collection:');
                    if (name) {
                      patterns.forEach((pattern, index) => {
                        handleSaveToLibrary(
                          pattern,
                          `${name} - Pattern ${index + 1}`,
                          pattern._presetDescription
                        );
                      });
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--dpgen-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  <i className="fas fa-save" style={{ marginRight: '0.5rem' }} />
                  Save All to Library
                </button>
                {patterns.length === 1 && (
                  <button
                    onClick={() => handleSaveAsTemplate(patterns[0])}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--dpgen-accent)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                    title="Save as template for quick access"
                  >
                    <i className="fas fa-bookmark" style={{ marginRight: '0.5rem' }} />
                    Save as Template
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Search and Filter */}
          {library.length > 0 && (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '0.5rem',
                    border: '1px solid var(--dpgen-border)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--dpgen-border)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
                {categories.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid var(--dpgen-border)',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => setShowTemplatesOnly(!showTemplatesOnly)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: showTemplatesOnly ? 'var(--dpgen-accent)' : 'var(--dpgen-bg)',
                    color: showTemplatesOnly ? 'white' : 'var(--dpgen-text)',
                    border: '1px solid var(--dpgen-border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: showTemplatesOnly ? 600 : 400,
                  }}
                  title="Show only templates"
                >
                  <i className="fas fa-bookmark" style={{ marginRight: '0.5rem' }} />
                  Templates Only
                </button>
              </div>
            </div>
          )}
          
          {/* Library Items */}
          {filteredLibrary.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredLibrary.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.75rem',
                    background: 'var(--dpgen-bg)',
                    borderRadius: '8px',
                    border: `2px solid ${getDifficultyColor(item.level)}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {item.name}
                      </div>
                      {item.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>
                          {item.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                        {item.isTemplate && (
                          <span
                            style={{
                              padding: '0.125rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'var(--dpgen-accent)',
                              color: 'white',
                            }}
                            title="Template/Snippet"
                          >
                            <i className="fas fa-bookmark" style={{ marginRight: '0.25rem' }} />
                            Template
                          </span>
                        )}
                        {item.category && (
                          <span
                            style={{
                              padding: '0.125rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              background: 'var(--dpgen-border)',
                              color: 'var(--dpgen-text)',
                            }}
                          >
                            {item.category}
                          </span>
                        )}
                        <span
                          style={{
                            padding: '0.125rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: getDifficultyColor(item.level),
                            color: 'white',
                          }}
                        >
                          {getDifficultyLabel(item.level)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>
                          {item.difficulty}/100
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', flexDirection: 'column' }}>
                      <button
                        onClick={() => handleLoadFromLibrary(item)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: 'var(--dpgen-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                        }}
                        title="Load pattern"
                      >
                        <i className="fas fa-download" />
                      </button>
                      <button
                        onClick={() => handleShareLibraryItem(item)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: 'var(--dpgen-accent)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                        }}
                        title="Share pattern"
                      >
                        <i className="fas fa-share-alt" />
                      </button>
                      <button
                        onClick={() => handleToggleTemplate(item.id)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: item.isTemplate ? 'var(--dpgen-accent)' : 'var(--dpgen-bg)',
                          color: item.isTemplate ? 'white' : 'var(--dpgen-text)',
                          border: '1px solid var(--dpgen-border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.isTemplate ? 'Remove template mark' : 'Mark as template'}
                      >
                        <i className="fas fa-bookmark" />
                      </button>
                      <button
                        onClick={() => handleDeleteFromLibrary(item.id)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                        }}
                        title="Delete from library"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dpgen-muted)' }}>
              <i className="fas fa-book" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
              <div>Your pattern library is empty</div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Save patterns to build your personal library
              </div>
            </div>
          )}
          
          {/* Library Actions */}
          {library.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--dpgen-border)' }}>
              <button
                onClick={handleExportLibrary}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--dpgen-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                <i className="fas fa-download" style={{ marginRight: '0.5rem' }} />
                Export Library
              </button>
              <label
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--dpgen-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'inline-block',
                }}
              >
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportToLibrary(file);
                    }
                    e.target.value = '';
                  }}
                />
                <i className="fas fa-upload" style={{ marginRight: '0.5rem' }} />
                Import to Library
              </label>
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}

