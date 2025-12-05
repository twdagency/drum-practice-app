/**
 * Practice Coach Component
 * Displays AI-generated coaching insights based on practice data
 */

'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { CollapsibleSection } from '@/components/shared/CollapsibleSection';
import { generateCoachingInsights, CoachInsight, getPostSessionFeedback } from '@/lib/utils/practiceCoach';
import { Sparkles, ChevronRight, Target, Clock, Zap, TrendingUp, Award, Brain, X } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  timing: '#3b82f6',
  accuracy: '#22c55e',
  tempo: '#f97316',
  practice: '#8b5cf6',
  technique: '#ec4899',
  motivation: '#fbbf24',
};

const PRIORITY_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  urgent: { bg: '#ef444420', text: '#ef4444', label: 'Important' },
  high: { bg: '#f59e0b20', text: '#f59e0b', label: 'Recommended' },
  celebration: { bg: '#22c55e20', text: '#22c55e', label: '🎉' },
  medium: { bg: '#3b82f620', text: '#3b82f6', label: '' },
  low: { bg: '#6b728020', text: '#6b7280', label: '' },
};

function InsightCard({ insight, onDismiss }: { insight: CoachInsight; onDismiss?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const categoryColor = CATEGORY_COLORS[insight.category] || '#6b7280';
  const priorityBadge = PRIORITY_BADGES[insight.priority];
  
  return (
    <div
      style={{
        background: 'var(--dpgen-bg)',
        borderRadius: '10px',
        borderLeft: `3px solid ${categoryColor}`,
        padding: '0.875rem',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{
          fontSize: '1.25rem',
          lineHeight: 1,
          flexShrink: 0,
        }}>
          {insight.icon}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>
              {insight.title}
            </h4>
            {priorityBadge.label && (
              <span style={{
                fontSize: '0.6rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '4px',
                background: priorityBadge.bg,
                color: priorityBadge.text,
                fontWeight: 600,
              }}>
                {priorityBadge.label}
              </span>
            )}
          </div>
          
          <p style={{ 
            margin: 0, 
            fontSize: '0.8rem', 
            color: 'var(--dpgen-text)', 
            lineHeight: 1.4,
          }}>
            {insight.message}
          </p>
          
          {/* Metric if present */}
          {insight.metric && (
            <div style={{
              marginTop: '0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.5rem',
              background: 'var(--dpgen-card)',
              borderRadius: '4px',
              fontSize: '0.75rem',
            }}>
              <span style={{ color: 'var(--dpgen-muted)' }}>{insight.metric.label}:</span>
              <span style={{ 
                fontWeight: 600,
                color: insight.metric.trend === 'up' ? '#22c55e' : insight.metric.trend === 'down' ? '#ef4444' : 'inherit',
              }}>
                {insight.metric.value}
              </span>
              {insight.metric.trend && (
                <TrendingUp 
                  size={12} 
                  style={{ 
                    transform: insight.metric.trend === 'down' ? 'rotate(180deg)' : 'none',
                    color: insight.metric.trend === 'up' ? '#22c55e' : '#ef4444',
                  }} 
                />
              )}
            </div>
          )}
          
          {/* Expandable details */}
          {(insight.details || insight.actionableExercise) && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'none',
                border: 'none',
                color: categoryColor,
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: '0.25rem 0',
                marginTop: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              {expanded ? 'Less' : 'More'} 
              <ChevronRight 
                size={12} 
                style={{ 
                  transform: expanded ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s',
                }} 
              />
            </button>
          )}
          
          {/* Expanded content */}
          {expanded && (
            <div style={{ marginTop: '0.5rem' }}>
              {insight.details && (
                <p style={{ 
                  margin: '0 0 0.5rem', 
                  fontSize: '0.75rem', 
                  color: 'var(--dpgen-muted)',
                  lineHeight: 1.4,
                  fontStyle: 'italic',
                }}>
                  {insight.details}
                </p>
              )}
              
              {insight.actionableExercise && (
                <div style={{
                  padding: '0.625rem',
                  background: `${categoryColor}10`,
                  borderRadius: '6px',
                  border: `1px solid ${categoryColor}30`,
                }}>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 600, 
                    color: categoryColor,
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}>
                    <Target size={12} />
                    Try This:
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.75rem',
                    lineHeight: 1.4,
                  }}>
                    {insight.actionableExercise.description}
                  </p>
                  {(insight.actionableExercise.suggestedBpm || insight.actionableExercise.duration) && (
                    <div style={{
                      marginTop: '0.375rem',
                      display: 'flex',
                      gap: '0.75rem',
                      fontSize: '0.7rem',
                      color: 'var(--dpgen-muted)',
                    }}>
                      {insight.actionableExercise.suggestedBpm && (
                        <span><Zap size={10} style={{ marginRight: '0.125rem' }} />{insight.actionableExercise.suggestedBpm} BPM</span>
                      )}
                      {insight.actionableExercise.duration && (
                        <span><Clock size={10} style={{ marginRight: '0.125rem' }} />{insight.actionableExercise.duration} min</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Dismiss button for non-urgent */}
        {onDismiss && insight.priority !== 'urgent' && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--dpgen-muted)',
              cursor: 'pointer',
              padding: '0.125rem',
              opacity: 0.5,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export function PracticeCoach() {
  const practiceStats = useStore((state) => state.practiceStats);
  const bpm = useStore((state) => state.bpm);
  const patterns = useStore((state) => state.patterns);
  
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  
  const insights = useMemo(() => {
    // Calculate context
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    const recentSessions = practiceStats.sessions.filter(s => s.startTime > sevenDaysAgo);
    const todaySessions = practiceStats.sessions.filter(s => 
      new Date(s.startTime).toISOString().split('T')[0] === today
    );
    const todayPracticeTime = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    
    const lastSession = practiceStats.sessions[practiceStats.sessions.length - 1];
    const daysSinceLastPractice = lastSession 
      ? Math.floor((now - lastSession.endTime) / (24 * 60 * 60 * 1000))
      : 999;
    
    const presetScores = Object.values(practiceStats.presetBestScores || {});
    
    return generateCoachingInsights({
      stats: practiceStats,
      recentSessions,
      presetScores,
      currentBpm: bpm,
      patterns,
      daysSinceLastPractice,
      todayPracticeTime,
    });
  }, [practiceStats, bpm, patterns]);
  
  // Filter out dismissed insights
  const visibleInsights = insights.filter(i => !dismissedIds.has(i.id));
  
  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };
  
  if (visibleInsights.length === 0) {
    return null;
  }
  
  // Group insights
  const urgentInsights = visibleInsights.filter(i => i.priority === 'urgent' || i.priority === 'high');
  const celebrationInsights = visibleInsights.filter(i => i.priority === 'celebration');
  const otherInsights = visibleInsights.filter(i => i.priority === 'medium' || i.priority === 'low');
  
  return (
    <div className="dpgen-card" style={{ marginTop: '1rem' }}>
      <CollapsibleSection
        title="Practice Coach"
        icon={<Brain size={16} />}
        defaultExpanded={urgentInsights.length > 0 || celebrationInsights.length > 0}
        badge={urgentInsights.length > 0 ? `${urgentInsights.length} tips` : undefined}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: 'linear-gradient(135deg, #8b5cf620 0%, #3b82f620 100%)',
            borderRadius: '8px',
            fontSize: '0.8rem',
          }}>
            <Brain size={16} style={{ color: '#8b5cf6' }} />
            <span>Personalized insights based on your practice data</span>
          </div>
          
          {/* Urgent/Important insights first */}
          {urgentInsights.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {urgentInsights.map(insight => (
                <InsightCard 
                  key={insight.id} 
                  insight={insight} 
                  onDismiss={() => handleDismiss(insight.id)}
                />
              ))}
            </div>
          )}
          
          {/* Celebrations */}
          {celebrationInsights.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {celebrationInsights.slice(0, 2).map(insight => (
                <InsightCard 
                  key={insight.id} 
                  insight={insight}
                  onDismiss={() => handleDismiss(insight.id)}
                />
              ))}
            </div>
          )}
          
          {/* Other insights */}
          {otherInsights.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {otherInsights.slice(0, 3).map(insight => (
                <InsightCard 
                  key={insight.id} 
                  insight={insight}
                  onDismiss={() => handleDismiss(insight.id)}
                />
              ))}
            </div>
          )}
          
          {/* Show more link if there are many insights */}
          {visibleInsights.length > 6 && (
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>
              + {visibleInsights.length - 6} more insights available
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}

/**
 * Post-session feedback component - shows after a practice session
 */
export function PostSessionFeedback({ session, onClose }: { session: any; onClose: () => void }) {
  const practiceStats = useStore((state) => state.practiceStats);
  
  const feedback = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentSessions = practiceStats.sessions.filter(s => s.startTime > sevenDaysAgo);
    const presetScores = Object.values(practiceStats.presetBestScores || {});
    
    return getPostSessionFeedback(session, {
      stats: practiceStats,
      recentSessions,
      presetScores,
      daysSinceLastPractice: 0,
      todayPracticeTime: session.duration,
    });
  }, [session, practiceStats]);
  
  if (feedback.length === 0) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      maxWidth: '320px',
      background: 'var(--dpgen-card)',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      border: '1px solid var(--dpgen-border)',
      padding: '1rem',
      zIndex: 1000,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} style={{ color: '#fbbf24' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Coach's Feedback</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--dpgen-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {feedback.slice(0, 2).map(insight => (
          <div key={insight.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1rem' }}>{insight.icon}</span>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{insight.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>{insight.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

