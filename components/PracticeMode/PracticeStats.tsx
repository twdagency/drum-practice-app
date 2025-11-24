'use client';

import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { CollapsibleSection } from '@/components/shared/CollapsibleSection';
import { calculateDifficultyRating, generatePracticeRecommendations, getDifficultyColor, getDifficultyLabel, type DifficultyRating, type PracticeRecommendation } from '@/lib/utils/difficultyUtils';
import { Pattern } from '@/types';
import { PracticeSession } from '@/types/practice';

interface PracticeTimeChartProps {
  sessions: PracticeSession[];
}

function PracticeTimeChart({ sessions }: PracticeTimeChartProps) {
  // Group sessions by day
  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};
    const today = new Date();
    
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      days[key] = 0;
    }
    
    // Sum up session durations by day
    sessions.forEach(session => {
      const date = new Date(session.startTime);
      const key = date.toISOString().split('T')[0];
      if (days[key] !== undefined) {
        days[key] += session.duration;
      }
    });
    
    return Object.entries(days).map(([date, duration]) => ({
      date,
      duration,
      label: new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
    }));
  }, [sessions]);

  const maxDuration = Math.max(...dailyData.map(d => d.duration), 1);
  const chartHeight = 120;
  const chartWidth = 100;
  const barWidth = 12;
  const barGap = 4;

  return (
    <div style={{ 
      padding: '1rem', 
      background: 'var(--dpgen-bg)', 
      borderRadius: '8px',
      overflowX: 'auto',
    }}>
      <svg 
        width="100%" 
        height={chartHeight + 40}
        viewBox={`0 0 ${dailyData.length * (barWidth + barGap) + barGap} ${chartHeight + 40}`}
        style={{ minWidth: '300px' }}
      >
        {/* Bars */}
        {dailyData.map((day, index) => {
          const barHeight = maxDuration > 0 ? (day.duration / maxDuration) * chartHeight : 0;
          const x = index * (barWidth + barGap) + barGap;
          const y = chartHeight - barHeight;
          
          return (
            <g key={day.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="var(--dpgen-primary)"
                rx="2"
                opacity={day.duration > 0 ? 1 : 0.3}
              />
              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 20}
                textAnchor="middle"
                fontSize="10"
                fill="var(--dpgen-muted)"
                style={{ userSelect: 'none' }}
              >
                {day.label}
              </text>
              {/* Value on hover */}
              {day.duration > 0 && (
                <title>{formatDuration(day.duration)}</title>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export function PracticeStats() {
  const practiceStats = useStore((state) => state.practiceStats);
  const practiceGoals = useStore((state) => state.practiceGoals);
  const patterns = useStore((state) => state.patterns);

  const stats = useMemo(() => {
    const totalSessions = practiceStats.sessions.length;
    const totalMinutes = Math.floor(practiceStats.totalPracticeTime / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    // Calculate average accuracy
    const sessionsWithAccuracy = practiceStats.sessions.filter(s => s.accuracy !== undefined);
    const avgAccuracy = sessionsWithAccuracy.length > 0
      ? sessionsWithAccuracy.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessionsWithAccuracy.length
      : 0;

    // Calculate average timing error
    const sessionsWithTiming = practiceStats.sessions.filter(s => s.timingAvg !== undefined);
    const avgTiming = sessionsWithTiming.length > 0
      ? sessionsWithTiming.reduce((sum, s) => sum + (s.timingAvg || 0), 0) / sessionsWithTiming.length
      : 0;

    // Most practiced patterns
    const patternCounts = Object.entries(practiceStats.patternsPracticed)
      .map(([id, time]) => ({ id: parseInt(id), time }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 5);

    // Recent sessions (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSessions = practiceStats.sessions.filter(s => s.startTime > sevenDaysAgo);

    return {
      totalSessions,
      totalHours,
      remainingMinutes,
      avgAccuracy,
      avgTiming,
      patternCounts,
      recentSessions,
      currentStreak: practiceStats.currentStreak,
    };
  }, [practiceStats]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="dpgen-card" style={{ marginTop: '1rem' }}>
      <CollapsibleSection
        title="Practice Statistics"
        icon="fas fa-chart-line"
        defaultExpanded={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Overview Stats */}
          <div>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600 }}>
              Overview
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>
                  Total Practice Time
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  {stats.totalHours > 0 ? `${stats.totalHours}h ${stats.remainingMinutes}m` : `${stats.remainingMinutes}m`}
                </div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>
                  Total Sessions
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  {stats.totalSessions}
                </div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>
                  Current Streak
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  {stats.currentStreak} day{stats.currentStreak !== 1 ? 's' : ''}
                </div>
              </div>
              {stats.avgAccuracy > 0 && (
                <div style={{ padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginBottom: '0.25rem' }}>
                    Avg Accuracy
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {stats.avgAccuracy.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Practice Time Chart */}
          {stats.recentSessions.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600 }}>
                Practice Time (Last 7 Days)
              </h3>
              <PracticeTimeChart sessions={stats.recentSessions} />
            </div>
          )}

          {/* Recent Sessions */}
          {stats.recentSessions.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600 }}>
                Recent Sessions (Last 7 Days)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {stats.recentSessions.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    style={{
                      padding: '0.75rem',
                      background: 'var(--dpgen-bg)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {formatDate(session.startTime)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>
                        {formatDuration(session.duration)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                      {session.accuracy !== undefined && (
                        <div>
                          <span style={{ color: 'var(--dpgen-muted)' }}>Accuracy: </span>
                          <span style={{ fontWeight: 600 }}>{session.accuracy.toFixed(1)}%</span>
                        </div>
                      )}
                      {session.hits !== undefined && (
                        <div>
                          <span style={{ color: 'var(--dpgen-muted)' }}>Hits: </span>
                          <span style={{ fontWeight: 600 }}>{session.hits}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {(practiceGoals.streakGoal || practiceGoals.bpmGoal || practiceGoals.accuracyGoal || practiceGoals.practiceTimeGoal) && (
            <div>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600 }}>
                Goals
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {practiceGoals.streakGoal && (
                  <div style={{ padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      Streak Goal: {practiceGoals.streakGoal} days
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--dpgen-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, (stats.currentStreak / practiceGoals.streakGoal) * 100)}%`,
                          height: '100%',
                          background: 'var(--dpgen-primary)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
                      {stats.currentStreak} / {practiceGoals.streakGoal} days
                    </div>
                  </div>
                )}
                {practiceGoals.practiceTimeGoal && (
                  <div style={{ padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      Daily Practice Goal: {practiceGoals.practiceTimeGoal} minutes
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>
                      Track your daily practice time to see progress
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pattern Difficulty Analysis */}
          {patterns.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600 }}>
                Pattern Difficulty Analysis
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {patterns.slice(0, 5).map((pattern) => {
                  const difficulty = calculateDifficultyRating(pattern);
                  const recommendations = generatePracticeRecommendations(
                    pattern,
                    difficulty,
                    {
                      avgAccuracy: stats.avgAccuracy,
                      avgTiming: stats.avgTiming,
                      practiceTime: practiceStats.totalPracticeTime,
                    }
                  );
                  
                  return (
                    <div
                      key={pattern.id}
                      style={{
                        padding: '0.75rem',
                        background: 'var(--dpgen-bg)',
                        borderRadius: '8px',
                        border: `2px solid ${getDifficultyColor(difficulty.level)}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          Pattern {patterns.indexOf(pattern) + 1}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: getDifficultyColor(difficulty.level),
                              color: 'white',
                            }}
                          >
                            {getDifficultyLabel(difficulty.level)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)' }}>
                            {difficulty.score}/100
                          </span>
                        </div>
                      </div>
                      
                      {recommendations.length > 0 && (
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--dpgen-border)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--dpgen-muted)' }}>
                            Recommendations:
                          </div>
                          {recommendations.slice(0, 2).map((rec, idx) => (
                            <div
                              key={idx}
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--dpgen-text)',
                                marginTop: '0.25rem',
                                paddingLeft: '0.5rem',
                                borderLeft: `3px solid ${
                                  rec.priority === 'high' ? '#ef4444' :
                                  rec.priority === 'medium' ? '#f59e0b' : '#10b981'
                                }`,
                              }}
                            >
                              {rec.message}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {stats.totalSessions === 0 && patterns.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dpgen-muted)' }}>
              <i className="fas fa-chart-line" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
              <div>No practice sessions yet. Start practicing to track your progress!</div>
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}

