'use client';

import { useState, useMemo } from 'react';
import { usePresets } from '@/hooks/usePresets';
import { Preset } from '@/types/preset';
import { useStore } from '@/store/useStore';
import { parseTimeSignature, buildAccentIndices, parseNumberList, parseTokens, formatList, calculateNotesPerBar } from '@/lib/utils/patternUtils';
import { getSubdivisionTextWithSuffix } from '@/lib/utils/subdivisionUtils';
import { PresetBestScore } from '@/types/practice';
import { 
  Search, 
  X, 
  BookOpen, 
  Sparkles, 
  Star, 
  Target, 
  TrendingUp, 
  Clock, 
  Trophy, 
  AlertCircle,
  ChevronRight,
  Zap,
  Filter,
  Plus,
  Music,
  Check
} from 'lucide-react';

interface PresetsBrowserProps {
  onClose: () => void;
}

type QuickFilter = 'all' | 'new' | 'practiced' | 'struggling' | 'mastered';
type TabType = 'browse' | 'recommended';

// Mastery level colors and labels
const MASTERY_CONFIG: Record<string, { color: string; bgColor: string; label: string; icon: React.ReactNode }> = {
  'master': { color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.15)', label: 'Mastered', icon: <Trophy size={12} /> },
  'proficient': { color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)', label: 'Proficient', icon: <Star size={12} /> },
  'intermediate': { color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', label: 'Intermediate', icon: <TrendingUp size={12} /> },
  'learning': { color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', label: 'Learning', icon: <Target size={12} /> },
  'beginner': { color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.15)', label: 'Beginner', icon: <Clock size={12} /> },
};

export const PresetsBrowser: React.FC<PresetsBrowserProps> = ({ onClose }) => {
  const { presets, loading, error, categories, subcategories, tags, searchPresets, filterByCategory, filterBySubcategory, filterByTag, filterByDifficulty } = usePresets();
  const addPattern = useStore((state) => state.addPattern);
  const setBPM = useStore((state) => state.setBPM);
  const practicePadMode = useStore((state) => state.practicePadMode);
  const practiceStats = useStore((state) => state.practiceStats);
  
  // Tabs and filters
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  
  // Search and category filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [minDifficulty, setMinDifficulty] = useState(1);
  const [maxDifficulty, setMaxDifficulty] = useState(10);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

  // Get user's score for a preset
  const getPresetScore = (presetId: string): PresetBestScore | null => {
    return practiceStats.presetBestScores[presetId] || null;
  };

  // Calculate user's average difficulty level from practiced patterns
  const userSkillLevel = useMemo(() => {
    const scores = Object.values(practiceStats.presetBestScores);
    if (scores.length === 0) return 3; // Default to beginner-intermediate
    
    // Weight by mastery level
    const masteryWeights: Record<string, number> = {
      'master': 5,
      'proficient': 4,
      'intermediate': 3,
      'learning': 2,
      'beginner': 1,
    };
    
    let totalWeight = 0;
    let weightedDifficulty = 0;
    
    scores.forEach(score => {
      const preset = presets.find(p => p.id === score.presetId);
      if (preset) {
        const weight = masteryWeights[score.mastery] || 1;
        weightedDifficulty += preset.difficulty * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? Math.round(weightedDifficulty / totalWeight) : 3;
  }, [practiceStats.presetBestScores, presets]);

  // Get practiced categories for recommendations
  const practicedCategories = useMemo(() => {
    const cats = new Set<string>();
    Object.values(practiceStats.presetBestScores).forEach(score => {
      const preset = presets.find(p => p.id === score.presetId);
      if (preset) cats.add(preset.category);
    });
    return cats;
  }, [practiceStats.presetBestScores, presets]);

  // Generate recommendations
  const recommendations = useMemo(() => {
    const scores = practiceStats.presetBestScores;
    const practicedIds = new Set(Object.keys(scores));
    
    // Different recommendation categories
    const atYourLevel: Preset[] = [];
    const readyToChallenge: Preset[] = [];
    const newCategories: Preset[] = [];
    const similarToMastered: Preset[] = [];
    
    // Get mastered patterns for similarity matching
    const masteredPatterns = Object.values(scores)
      .filter(s => s.mastery === 'master' || s.mastery === 'proficient')
      .map(s => presets.find(p => p.id === s.presetId))
      .filter(Boolean) as Preset[];
    
    const masteredTags = new Set<string>();
    const masteredSubcategories = new Set<string>();
    masteredPatterns.forEach(p => {
      p.tags.forEach(t => masteredTags.add(t));
      masteredSubcategories.add(p.subcategory);
    });
    
    presets.forEach(preset => {
      // Skip if already practiced
      if (practicedIds.has(preset.id)) return;
      
      // At your level (±2 difficulty)
      if (Math.abs(preset.difficulty - userSkillLevel) <= 2) {
        atYourLevel.push(preset);
      }
      
      // Ready to challenge (slightly harder)
      if (preset.difficulty === userSkillLevel + 1 || preset.difficulty === userSkillLevel + 2) {
        readyToChallenge.push(preset);
      }
      
      // New categories (unpracticed categories)
      if (!practicedCategories.has(preset.category)) {
        newCategories.push(preset);
      }
      
      // Similar to mastered (same tags or subcategory)
      const hasSimilarTags = preset.tags.some(t => masteredTags.has(t));
      const hasSimilarSubcategory = masteredSubcategories.has(preset.subcategory);
      if (hasSimilarTags || hasSimilarSubcategory) {
        similarToMastered.push(preset);
      }
    });
    
    return {
      atYourLevel: atYourLevel.slice(0, 6),
      readyToChallenge: readyToChallenge.slice(0, 6),
      newCategories: newCategories.slice(0, 6),
      similarToMastered: similarToMastered.slice(0, 6),
    };
  }, [presets, practiceStats.presetBestScores, userSkillLevel, practicedCategories]);

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

    // Apply quick filters
    if (quickFilter !== 'all') {
      const scores = practiceStats.presetBestScores;
      
      if (quickFilter === 'new') {
        // Not yet practiced
        filtered = filtered.filter(p => !scores[p.id]);
      } else if (quickFilter === 'practiced') {
        // Has been practiced
        filtered = filtered.filter(p => !!scores[p.id]);
      } else if (quickFilter === 'struggling') {
        // Low accuracy (< 70%) with 3+ attempts
        filtered = filtered.filter(p => {
          const score = scores[p.id];
          return score && score.attempts >= 3 && score.bestAccuracy < 70;
        });
      } else if (quickFilter === 'mastered') {
        // High mastery level
        filtered = filtered.filter(p => {
          const score = scores[p.id];
          return score && (score.mastery === 'master' || score.mastery === 'proficient');
        });
      }
    }

    // Sort by difficulty, then by name
    return filtered.sort((a, b) => {
      if (a.difficulty !== b.difficulty) {
        return a.difficulty - b.difficulty;
      }
      return a.name.localeCompare(b.name);
    });
  }, [presets, searchQuery, selectedCategory, selectedSubcategory, selectedTag, minDifficulty, maxDifficulty, quickFilter, searchPresets, practiceStats.presetBestScores]);

  const handleLoadPreset = (preset: Preset) => {
    const [beats, beatType] = parseTimeSignature(preset.timeSignature);
    
    // Check if this is a combined preset that should be split into individual patterns
    const isCombinedPreset = preset.id === '16th-note-grid-all-combinations-combined' || 
                             (preset.tags && preset.tags.includes('combined'));
    
    if (isCombinedPreset && preset.id === '16th-note-grid-all-combinations-combined') {
      // Split the combined preset into 14 individual patterns
      const drumTokens = parseTokens(preset.drumPattern);
      const stickingTokens = parseTokens(preset.stickingPattern);
      const phraseValues = parseNumberList(preset.phrase);
      
      const patternsPerCombination = 14;
      const positionsPerPatternInCombined = 64;
      const basePatternLength = 4;
      
      const individualPatternNames = [
        'S S S S', '- S S S', 'S - S S', 'S S - S', 'S S S -',
        'S S - -', 'S - S -', 'S - - S', '- S - S', '- - S S',
        'S - - -', '- S - -', '- - S -', '- - - S'
      ];
      
      for (let i = 0; i < patternsPerCombination; i++) {
        const startPos = i * positionsPerPatternInCombined;
        const patternDrumTokens = drumTokens.slice(startPos, startPos + basePatternLength);
        const patternStickingTokens = stickingTokens.slice(startPos, startPos + basePatternLength);
        const patternPhraseValues = [4, 4, 4, 4];
        
        let patternDrumPattern = formatList(patternDrumTokens);
        let patternStickingPattern = formatList(patternStickingTokens);
        
        if (practicePadMode) {
          const convertedDrumPattern = patternDrumTokens.map(token => {
            if (token === '-' || token === 'R') {
              return token;
            }
            return 'S';
          });
          patternDrumPattern = formatList(convertedDrumPattern);
          
          const filteredSticking = patternStickingTokens.map(token => {
            const upperToken = token.toUpperCase();
            if (upperToken === 'K') {
              return Math.random() > 0.5 ? 'R' : 'L';
            }
            return token;
          });
          patternStickingPattern = formatList(filteredSticking);
        }
        
        const patternPhrase = formatList(patternPhraseValues);
        const patternAccentIndices = buildAccentIndices(patternPhraseValues);
        
        const pattern = {
          id: 0,
          timeSignature: preset.timeSignature,
          beats,
          beatType,
          subdivision: preset.subdivision,
          phrase: patternPhrase,
          drumPattern: patternDrumPattern,
          stickingPattern: patternStickingPattern,
          repeat: 4,
          accentIndices: patternAccentIndices,
          leftFoot: false,
          rightFoot: false,
          _presetName: `16th Note Grid: ${individualPatternNames[i]}`,
          _presetDescription: `From combined preset: ${individualPatternNames[i]}`,
          _presetAccents: patternAccentIndices,
        };
        
        addPattern(pattern);
      }
      
      if (preset.bpm && typeof preset.bpm === 'number' && preset.bpm > 0) {
        setBPM(preset.bpm);
      }
      
      onClose();
      return;
    }

    // Parse preset data
    const accentIndices = preset.accents && Array.isArray(preset.accents)
      ? preset.accents
      : buildAccentIndices(parseNumberList(preset.phrase));

    let drumPattern = preset.drumPattern;
    let stickingPattern = preset.stickingPattern;
    
    // Practice pad mode conversion
    if (practicePadMode) {
      const drumTokens = parseTokens(drumPattern);
      const convertedDrumPattern = drumTokens.map(token => {
        if (token === '-' || token === 'R') {
          return token;
        }
        return 'S';
      });
      drumPattern = formatList(convertedDrumPattern);
      
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

    const pattern = {
      id: 0,
      timeSignature: preset.timeSignature,
      beats,
      beatType,
      subdivision: preset.subdivision,
      phrase: preset.phrase,
      drumPattern,
      stickingPattern,
      repeat: preset.repeat || 1,
      accentIndices,
      leftFoot: false,
      rightFoot: false,
      _presetName: preset.name,
      _presetDescription: preset.description,
      _presetAccents: accentIndices,
      _presetId: preset.id,
    };

    addPattern(pattern);
    
    if (preset.bpm && typeof preset.bpm === 'number' && preset.bpm > 0) {
      setBPM(preset.bpm);
    }
    
    onClose();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedTag('');
    setMinDifficulty(1);
    setMaxDifficulty(10);
    setQuickFilter('all');
  };

  // Render a preset card with stats
  const renderPresetCard = (preset: Preset, showLoadButton: boolean = true) => {
    const score = getPresetScore(preset.id);
    const mastery = score ? MASTERY_CONFIG[score.mastery] : null;
    
    return (
      <div
        key={preset.id}
        style={{
          border: '1px solid var(--dpgen-border)',
          borderRadius: '10px',
          padding: '1rem',
          background: selectedPreset?.id === preset.id ? 'var(--dpgen-accent-light)' : 'var(--dpgen-card)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
        }}
        onClick={() => setSelectedPreset(preset)}
        onDoubleClick={() => handleLoadPreset(preset)}
      >
        {/* Mastery Badge */}
        {mastery && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: mastery.bgColor,
            color: mastery.color,
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: 600,
            border: `1px solid ${mastery.color}30`,
          }}>
            {mastery.icon}
            {mastery.label}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, flex: 1, paddingRight: '0.5rem' }}>
            {preset.name}
          </h3>
          <div style={{
            background: preset.difficulty <= 3 ? '#10b981' : preset.difficulty <= 6 ? '#f59e0b' : '#ef4444',
            color: 'white',
            padding: '0.2rem 0.4rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {preset.difficulty}/10
          </div>
        </div>
        
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--dpgen-muted)', lineHeight: 1.4 }}>
          {preset.description.length > 80 ? preset.description.slice(0, 80) + '...' : preset.description}
        </p>

        {/* User Stats Section */}
        {score && (
          <div style={{
            background: 'var(--dpgen-bg)',
            borderRadius: '6px',
            padding: '0.5rem',
            marginBottom: '0.5rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0.5rem',
            fontSize: '0.7rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--dpgen-muted)' }}>Best</div>
              <div style={{ 
                fontWeight: 600, 
                color: score.bestAccuracy >= 80 ? '#10b981' : score.bestAccuracy >= 60 ? '#f59e0b' : '#ef4444' 
              }}>
                {score.bestAccuracy.toFixed(0)}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--dpgen-muted)' }}>Max BPM</div>
              <div style={{ fontWeight: 600 }}>{score.bestBpm || '-'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--dpgen-muted)' }}>Sessions</div>
              <div style={{ fontWeight: 600 }}>{score.attempts}</div>
            </div>
          </div>
        )}

        {/* Pattern Info */}
        <div style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)', marginBottom: '0.5rem' }}>
          <div>
            <strong>{preset.timeSignature}</strong> • {getSubdivisionTextWithSuffix(preset.subdivision)}
          </div>
          <div style={{ marginTop: '0.25rem' }}>
            {preset.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                display: 'inline-block',
                background: 'var(--dpgen-accent-light)',
                padding: '0.1rem 0.3rem',
                borderRadius: '4px',
                marginRight: '0.25rem',
                fontSize: '0.65rem',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        {showLoadButton && (
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
              fontSize: '0.8rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
            }}
          >
            <Plus size={14} />
            Load Pattern
          </button>
        )}
      </div>
    );
  };

  // Render recommendation section
  const renderRecommendationSection = (
    title: string, 
    icon: React.ReactNode, 
    patterns: Preset[], 
    description: string
  ) => {
    if (patterns.length === 0) return null;
    
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ 
            background: 'var(--dpgen-accent-light)', 
            padding: '0.4rem', 
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {icon}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>{description}</p>
          </div>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '0.75rem' 
        }}>
          {patterns.map(preset => renderPresetCard(preset))}
        </div>
      </div>
    );
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
            <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
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

  // Calculate filter counts
  const newCount = presets.filter(p => !practiceStats.presetBestScores[p.id]).length;
  const practicedCount = Object.keys(practiceStats.presetBestScores).length;
  const strugglingCount = Object.values(practiceStats.presetBestScores)
    .filter(s => s.attempts >= 3 && s.bestAccuracy < 70).length;
  const masteredCount = Object.values(practiceStats.presetBestScores)
    .filter(s => s.mastery === 'master' || s.mastery === 'proficient').length;

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
          borderRadius: '12px',
          padding: '0',
          maxWidth: '1100px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '1px solid var(--dpgen-border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                background: 'var(--dpgen-accent-light)', 
                padding: '0.5rem', 
                borderRadius: '8px',
                display: 'flex',
              }}>
                <BookOpen size={22} style={{ color: 'var(--dpgen-accent)' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                  Pattern Library
                </h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--dpgen-muted)' }}>
                  {presets.length} patterns • Your level: {userSkillLevel}/10
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--dpgen-muted)',
                padding: '0.5rem',
                borderRadius: '6px',
                display: 'flex',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginTop: '1rem',
            borderBottom: '1px solid var(--dpgen-border)',
            marginLeft: '-1.5rem',
            marginRight: '-1.5rem',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
          }}>
            <button
              onClick={() => setActiveTab('recommended')}
              style={{
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: activeTab === 'recommended' ? 600 : 400,
                color: activeTab === 'recommended' ? 'var(--dpgen-accent)' : 'var(--dpgen-muted)',
                borderBottom: activeTab === 'recommended' ? '2px solid var(--dpgen-accent)' : '2px solid transparent',
                marginBottom: '-1px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Sparkles size={16} />
              For You
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              style={{
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: activeTab === 'browse' ? 600 : 400,
                color: activeTab === 'browse' ? 'var(--dpgen-accent)' : 'var(--dpgen-muted)',
                borderBottom: activeTab === 'browse' ? '2px solid var(--dpgen-accent)' : '2px solid transparent',
                marginBottom: '-1px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Search size={16} />
              Browse All
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {activeTab === 'recommended' ? (
            /* Recommended Tab */
            <div>
              {/* Quick summary */}
              <div style={{
                background: 'var(--dpgen-card)',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: '1 1 120px', textAlign: 'center', padding: '0.5rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dpgen-accent)' }}>
                    {practicedCount}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>Practiced</div>
                </div>
                <div style={{ flex: '1 1 120px', textAlign: 'center', padding: '0.5rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>
                    {masteredCount}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>Mastered</div>
                </div>
                <div style={{ flex: '1 1 120px', textAlign: 'center', padding: '0.5rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                    {strugglingCount}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>Need Work</div>
                </div>
                <div style={{ flex: '1 1 120px', textAlign: 'center', padding: '0.5rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
                    {newCount}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>New to Try</div>
                </div>
              </div>

              {/* Recommendation sections */}
              {renderRecommendationSection(
                'At Your Level',
                <Target size={18} style={{ color: 'var(--dpgen-accent)' }} />,
                recommendations.atYourLevel,
                `Difficulty ${userSkillLevel - 2} to ${userSkillLevel + 2} • Perfect for your current skill`
              )}

              {renderRecommendationSection(
                'Ready to Challenge',
                <Zap size={18} style={{ color: '#f59e0b' }} />,
                recommendations.readyToChallenge,
                'Slightly harder patterns to push your limits'
              )}

              {renderRecommendationSection(
                'Similar to What You\'ve Mastered',
                <Star size={18} style={{ color: '#22c55e' }} />,
                recommendations.similarToMastered,
                'Build on your strengths with related patterns'
              )}

              {renderRecommendationSection(
                'Explore New Categories',
                <Music size={18} style={{ color: '#8b5cf6' }} />,
                recommendations.newCategories,
                'Try something different to broaden your skills'
              )}

              {/* Empty state */}
              {recommendations.atYourLevel.length === 0 && 
               recommendations.readyToChallenge.length === 0 && 
               recommendations.similarToMastered.length === 0 && 
               recommendations.newCategories.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dpgen-muted)' }}>
                  <Sparkles size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Start practicing to get personalized recommendations!</p>
                  <p style={{ fontSize: '0.875rem' }}>Switch to "Browse All" to explore patterns.</p>
                </div>
              )}
            </div>
          ) : (
            /* Browse Tab */
            <div>
              {/* Search and Filters */}
              <div style={{ marginBottom: '1rem' }}>
                {/* Quick Filters */}
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                }}>
                  {[
                    { key: 'all', label: 'All', count: presets.length, icon: <Filter size={14} /> },
                    { key: 'new', label: 'New', count: newCount, icon: <Sparkles size={14} /> },
                    { key: 'practiced', label: 'Practiced', count: practicedCount, icon: <Check size={14} /> },
                    { key: 'struggling', label: 'Needs Work', count: strugglingCount, icon: <AlertCircle size={14} /> },
                    { key: 'mastered', label: 'Mastered', count: masteredCount, icon: <Trophy size={14} /> },
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => setQuickFilter(filter.key as QuickFilter)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: quickFilter === filter.key ? 'var(--dpgen-accent)' : 'var(--dpgen-card)',
                        color: quickFilter === filter.key ? 'white' : 'var(--dpgen-text)',
                        border: '1px solid',
                        borderColor: quickFilter === filter.key ? 'var(--dpgen-accent)' : 'var(--dpgen-border)',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.15s',
                      }}
                    >
                      {filter.icon}
                      {filter.label}
                      <span style={{ 
                        opacity: 0.7, 
                        fontSize: '0.7rem',
                        background: quickFilter === filter.key ? 'rgba(255,255,255,0.2)' : 'var(--dpgen-bg)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '10px',
                      }}>
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search and Advanced Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {/* Search */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ 
                        position: 'absolute', 
                        left: '0.75rem', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        color: 'var(--dpgen-muted)',
                      }} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search patterns..."
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                          borderRadius: '8px',
                          border: '1px solid var(--dpgen-border)',
                          background: 'var(--dpgen-bg)',
                          color: 'var(--dpgen-text)',
                          fontSize: '0.875rem',
                        }}
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
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

                  {/* Subcategory */}
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
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

                  {/* Difficulty Range */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--dpgen-muted)', whiteSpace: 'nowrap' }}>
                      Diff: {minDifficulty}-{maxDifficulty}
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={minDifficulty}
                      onChange={(e) => setMinDifficulty(Number(e.target.value))}
                      style={{ flex: 1, minWidth: '50px' }}
                    />
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={maxDifficulty}
                      onChange={(e) => setMaxDifficulty(Number(e.target.value))}
                      style={{ flex: 1, minWidth: '50px' }}
                    />
                  </div>
                </div>

                {/* Active filters indicator */}
                {(searchQuery || selectedCategory || selectedSubcategory || selectedTag || 
                  minDifficulty > 1 || maxDifficulty < 10 || quickFilter !== 'all') && (
                  <div style={{ 
                    marginTop: '0.75rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                  }}>
                    <span style={{ color: 'var(--dpgen-muted)' }}>
                      Showing {filteredPresets.length} of {presets.length} patterns
                    </span>
                    <button
                      onClick={handleClearFilters}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'transparent',
                        border: '1px solid var(--dpgen-border)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: 'var(--dpgen-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <X size={12} />
                      Clear filters
                    </button>
                  </div>
                )}
              </div>

              {/* Presets Grid */}
              {filteredPresets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dpgen-muted)' }}>
                  <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>No presets found matching your filters.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {filteredPresets.map((preset) => renderPresetCard(preset))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
