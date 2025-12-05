/**
 * Achievements Modal - View all badges and progress
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useAchievements } from '@/hooks/useAchievements';
import { Modal, ModalSection } from '@/components/shared/Modal';
import { BadgeCategory, RARITY_COLORS, LEVEL_THRESHOLDS } from '@/types/achievements';
import { getBadgeIcon } from '@/components/shared/BadgeNotification';
import {
  Trophy,
  Star,
  Lock,
  CheckCircle2,
  Flame,
  Clock,
  Target,
  Zap,
  Route,
  Award,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface AchievementsModalProps {
  onClose: () => void;
}

const CATEGORY_CONFIG: Record<BadgeCategory, { label: string; icon: React.ReactNode; color: string }> = {
  learning: { label: 'Learning', icon: <Route size={16} />, color: '#3b82f6' },
  practice: { label: 'Practice', icon: <Target size={16} />, color: '#10b981' },
  streak: { label: 'Streaks', icon: <Flame size={16} />, color: '#f97316' },
  mastery: { label: 'Mastery', icon: <Award size={16} />, color: '#a855f7' },
  speed: { label: 'Speed', icon: <Zap size={16} />, color: '#eab308' },
  special: { label: 'Special', icon: <Sparkles size={16} />, color: '#ec4899' },
};

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const { state, getAllBadges, getRecentBadges } = useAchievements();
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);

  const allBadges = useMemo(() => getAllBadges(), [getAllBadges]);
  const recentBadges = useMemo(() => getRecentBadges(5), [getRecentBadges]);

  const filteredBadges = useMemo(() => {
    let badges = allBadges;
    if (selectedCategory !== 'all') {
      badges = badges.filter(b => b.category === selectedCategory);
    }
    if (showEarnedOnly) {
      badges = badges.filter(b => b.earned);
    }
    return badges;
  }, [allBadges, selectedCategory, showEarnedOnly]);

  const earnedCount = allBadges.filter(b => b.earned).length;
  const totalBadges = allBadges.length;

  // Calculate level progress
  const currentLevelThreshold = LEVEL_THRESHOLDS[state.level - 1] || 0;
  const nextLevelThreshold = LEVEL_THRESHOLDS[state.level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const levelProgress = ((state.totalPoints - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Achievements"
      icon={<Trophy size={20} />}
      size="xl"
    >
      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid rgba(251, 191, 36, 0.3)',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
            {state.level}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginBottom: '0.5rem' }}>Level</div>
          <div style={{
            height: '4px',
            background: 'var(--dpgen-border)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(100, levelProgress)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            }} />
          </div>
        </div>

        <div style={{
          padding: '1rem',
          background: 'var(--dpgen-bg)',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid var(--dpgen-border)',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            {state.totalPoints}
            <Star size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>Total Points</div>
        </div>

        <div style={{
          padding: '1rem',
          background: 'var(--dpgen-bg)',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid var(--dpgen-border)',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
            {earnedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>Badges Earned</div>
        </div>

        <div style={{
          padding: '1rem',
          background: 'var(--dpgen-bg)',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid var(--dpgen-border)',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>
            {Math.round((earnedCount / totalBadges) * 100)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>Completion</div>
        </div>
      </div>

      {/* Recent Badges */}
      {recentBadges.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} style={{ color: '#f59e0b' }} />
            Recently Earned
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {recentBadges.map(badge => (
              <div
                key={badge.id}
                style={{
                  padding: '0.75rem',
                  background: `linear-gradient(135deg, ${RARITY_COLORS[badge.rarity]}20, ${RARITY_COLORS[badge.rarity]}10)`,
                  border: `1px solid ${RARITY_COLORS[badge.rarity]}40`,
                  borderRadius: '10px',
                  minWidth: '120px',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: RARITY_COLORS[badge.rarity], marginBottom: '0.5rem' }}>
                  {getBadgeIcon(badge.icon, 24)}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{badge.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            border: 'none',
            background: selectedCategory === 'all' ? 'var(--dpgen-accent)' : 'var(--dpgen-bg)',
            color: selectedCategory === 'all' ? 'white' : 'var(--dpgen-text)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 500,
          }}
        >
          All ({totalBadges})
        </button>
        {(Object.keys(CATEGORY_CONFIG) as BadgeCategory[]).map(cat => {
          const config = CATEGORY_CONFIG[cat];
          const count = allBadges.filter(b => b.category === cat).length;
          const earned = allBadges.filter(b => b.category === cat && b.earned).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: selectedCategory === cat ? config.color : 'var(--dpgen-bg)',
                color: selectedCategory === cat ? 'white' : 'var(--dpgen-text)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              {config.icon}
              {config.label} ({earned}/{count})
            </button>
          );
        })}
      </div>

      {/* Show earned only toggle */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
          <input
            type="checkbox"
            checked={showEarnedOnly}
            onChange={(e) => setShowEarnedOnly(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Show earned badges only
        </label>
      </div>

      {/* Badges Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '0.75rem',
        maxHeight: '400px',
        overflowY: 'auto',
        paddingRight: '0.5rem',
      }}>
        {filteredBadges.map(badge => {
          const rarityColor = RARITY_COLORS[badge.rarity];
          const progress = badge.progress;
          
          return (
            <div
              key={badge.id}
              style={{
                padding: '1rem',
                background: badge.earned 
                  ? `linear-gradient(135deg, ${rarityColor}15, ${rarityColor}08)`
                  : 'var(--dpgen-bg)',
                border: `1px solid ${badge.earned ? `${rarityColor}40` : 'var(--dpgen-border)'}`,
                borderRadius: '10px',
                opacity: badge.earned ? 1 : 0.7,
                position: 'relative',
              }}
            >
              {/* Earned indicator */}
              {badge.earned && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                </div>
              )}

              {/* Icon */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: badge.earned ? `${rarityColor}20` : 'var(--dpgen-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: badge.earned ? rarityColor : 'var(--dpgen-muted)',
                marginBottom: '0.75rem',
              }}>
                {badge.earned ? getBadgeIcon(badge.icon, 24) : <Lock size={20} />}
              </div>

              {/* Name and description */}
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                {badge.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                {badge.description}
              </div>

              {/* Progress bar (for unearned badges) */}
              {!badge.earned && progress && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.25rem' }}>
                    <span>{progress.current} / {progress.target}</span>
                    <span>{Math.round(progress.percentage)}%</span>
                  </div>
                  <div style={{
                    height: '4px',
                    background: 'var(--dpgen-border)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${progress.percentage}%`,
                      height: '100%',
                      background: rarityColor,
                    }} />
                  </div>
                </div>
              )}

              {/* Rarity and points */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--dpgen-border)',
              }}>
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: rarityColor,
                }}>
                  {badge.rarity}
                </span>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.7rem',
                  color: '#f59e0b',
                  fontWeight: 600,
                }}>
                  +{badge.points}
                  <Star size={10} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dpgen-muted)' }}>
          <Lock size={40} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
          <p>No badges match your filter</p>
        </div>
      )}
    </Modal>
  );
};

