'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { CollapsibleSection } from '@/components/shared/CollapsibleSection';
import { calculateDifficultyRating, generatePracticeRecommendations, getDifficultyColor, getDifficultyLabel } from '@/lib/utils/difficultyUtils';
import { PracticeSession, PresetBestScore } from '@/types/practice';
import { Trophy, Target, Clock, Flame, TrendingUp, Award, Zap, Medal } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementsModal } from './AchievementsModal';

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

function getMasteryColor(mastery: PresetBestScore['mastery']): string {
  switch (mastery) {
    case 'master': return '#ffd700';
    case 'proficient': return '#22c55e';
    case 'intermediate': return '#3b82f6';
    case 'learning': return '#f59e0b';
    default: return '#6b7280';
  }
}

function getMasteryLabel(mastery: PresetBestScore['mastery']): string {
  switch (mastery) {
    case 'master': return '🏆 Master';
    case 'proficient': return '⭐ Proficient';
    case 'intermediate': return '📈 Intermediate';
    case 'learning': return '📚 Learning';
    default: return '🌱 Beginner';
  }
}

// Mini accuracy trend chart
function AccuracyTrendChart({ history }: { history: Array<{ timestamp: number; accuracy: number }> }) {
  if (history.length < 2) return null;
  
  const height = 40;
  const width = 120;
  const padding = 4;
  
  const maxAcc = 100;
  const minAcc = Math.min(...history.map(h => h.accuracy), 50);
  
  const points = history.map((h, i) => {
    const x = padding + (i / (history.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((h.accuracy - minAcc) / (maxAcc - minAcc)) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  const trend = history[history.length - 1].accuracy - history[0].accuracy;
  const trendColor = trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#6b7280';
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={width} height={height} style={{ background: 'var(--dpgen-bg)', borderRadius: '4px' }}>
        <polyline
          points={points}
          fill="none"
          stroke="var(--dpgen-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={{ fontSize: '0.7rem', color: trendColor, fontWeight: 600 }}>
        {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
      </span>
    </div>
  );
}

// Weekly practice chart
function WeeklyPracticeChart({ sessions }: { sessions: PracticeSession[] }) {
  const dailyData = useMemo(() => {
    const days: Record<string, { time: number; accuracy: number; count: number }> = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      days[key] = { time: 0, accuracy: 0, count: 0 };
    }
    
    sessions.forEach(session => {
      const date = new Date(session.startTime);
      const key = date.toISOString().split('T')[0];
      if (days[key] !== undefined) {
        days[key].time += session.duration;
        if (session.accuracy !== undefined) {
          days[key].accuracy += session.accuracy;
          days[key].count++;
        }
      }
    });
    
    return Object.entries(days).map(([date, data]) => ({
      date,
      duration: data.time,
      avgAccuracy: data.count > 0 ? data.accuracy / data.count : null,
      label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    }));
  }, [sessions]);

  const maxDuration = Math.max(...dailyData.map(d => d.duration), 60);

  return (
    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-end', height: '80px' }}>
      {dailyData.map((day, i) => (
        <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '100%',
              height: `${Math.max(4, (day.duration / maxDuration) * 60)}px`,
              background: day.duration > 0 
                ? day.avgAccuracy !== null && day.avgAccuracy >= 80 
                  ? '#22c55e' 
                  : 'var(--dpgen-primary)'
                : 'var(--dpgen-border)',
              borderRadius: '2px 2px 0 0',
              transition: 'height 0.3s',
            }}
            title={`${formatDuration(day.duration)}${day.avgAccuracy !== null ? ` - ${day.avgAccuracy.toFixed(0)}% avg` : ''}`}
          />
          <span style={{ fontSize: '0.6rem', color: 'var(--dpgen-muted)', marginTop: '0.25rem' }}>
            {day.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PracticeStats() {
  const practiceStats = useStore((state) => state.practiceStats);
  const practiceGoals = useStore((state) => state.practiceGoals);
  const patterns = useStore((state) => state.patterns);
  const { state: achievementState } = useAchievements();
  const [showAchievements, setShowAchievements] = useState(false);

  const earnedBadgeCount = achievementState.earnedBadges.length;

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

    // Timing breakdown
    const totalPerfect = practiceStats.sessions.reduce((sum, s) => sum + (s.perfectHits || 0), 0);
    const totalEarly = practiceStats.sessions.reduce((sum, s) => sum + (s.earlyHits || 0), 0);
    const totalLate = practiceStats.sessions.reduce((sum, s) => sum + (s.lateHits || 0), 0);
    const totalHits = totalPerfect + totalEarly + totalLate;
    
    // Best preset scores
    const presetScores = Object.values(practiceStats.presetBestScores || {})
      .sort((a, b) => b.lastPracticed - a.lastPracticed);

    // Top achievements
    const topBpmAchievements = [...(practiceStats.tempoAchievements || [])]
      .sort((a, b) => b.maxBpm - a.maxBpm)
      .slice(0, 3);

    // Recent sessions (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSessions = practiceStats.sessions.filter(s => s.startTime > sevenDaysAgo);

    // This week's practice time
    const thisWeekTime = recentSessions.reduce((sum, s) => sum + s.duration, 0);
    const thisWeekSessions = recentSessions.length;
    
    // Accuracy trend (comparing last 5 sessions to previous 5)
    const last5 = sessionsWithAccuracy.slice(-5);
    const prev5 = sessionsWithAccuracy.slice(-10, -5);
    const last5Avg = last5.length > 0 ? last5.reduce((s, x) => s + (x.accuracy || 0), 0) / last5.length : 0;
    const prev5Avg = prev5.length > 0 ? prev5.reduce((s, x) => s + (x.accuracy || 0), 0) / prev5.length : 0;
    const accuracyTrend = last5.length > 0 && prev5.length > 0 ? last5Avg - prev5Avg : null;

    return {
      totalSessions,
      totalHours,
      remainingMinutes,
      avgAccuracy,
      avgTiming,
      totalPerfect,
      totalEarly,
      totalLate,
      totalHits,
      presetScores,
      topBpmAchievements,
      recentSessions,
      currentStreak: practiceStats.currentStreak,
      thisWeekTime,
      thisWeekSessions,
      accuracyTrend,
    };
  }, [practiceStats]);

  const StatCard = ({ icon, label, value, subvalue, color }: { 
    icon: React.ReactNode; 
    label: string; 
    value: string; 
    subvalue?: string;
    color?: string;
  }) => (
    <div style={{ 
      padding: '0.75rem', 
      background: 'var(--dpgen-bg)', 
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    }}>
      <div style={{ 
        width: '36px', 
        height: '36px', 
        borderRadius: '8px',
        background: `${color || 'var(--dpgen-primary)'}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color || 'var(--dpgen-primary)',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)' }}>{label}</div>
        <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{value}</div>
        {subvalue && <div style={{ fontSize: '0.65rem', color: 'var(--dpgen-muted)' }}>{subvalue}</div>}
      </div>
    </div>
  );

  return (
    <div className="dpgen-card" style={{ marginTop: '1rem' }}>
      <CollapsibleSection
        title="Practice Statistics"
        icon={<TrendingUp size={16} />}
        defaultExpanded={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Overview Stats - Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <StatCard
              icon={<Clock size={18} />}
              label="Total Time"
              value={stats.totalHours > 0 ? `${stats.totalHours}h ${stats.remainingMinutes}m` : `${stats.remainingMinutes}m`}
              subvalue={`${stats.totalSessions} sessions`}
              color="#3b82f6"
            />
            <StatCard
              icon={<Target size={18} />}
              label="Avg Accuracy"
              value={stats.avgAccuracy > 0 ? `${stats.avgAccuracy.toFixed(1)}%` : '-'}
              subvalue={stats.accuracyTrend !== null 
                ? `${stats.accuracyTrend > 0 ? '↑' : '↓'} ${Math.abs(stats.accuracyTrend).toFixed(1)}% trend`
                : undefined}
              color={stats.avgAccuracy >= 80 ? '#22c55e' : stats.avgAccuracy >= 60 ? '#f59e0b' : '#ef4444'}
            />
            <StatCard
              icon={<Flame size={18} />}
              label="Streak"
              value={`${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`}
              subvalue={stats.currentStreak >= 7 ? '🔥 On fire!' : undefined}
              color="#f97316"
            />
            {/* Achievements Card */}
            <div
              onClick={() => setShowAchievements(true)}
              style={{
                padding: '0.875rem',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
                borderRadius: '10px',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Medal size={18} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--dpgen-muted)', fontWeight: 500 }}>Badges</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                {earnedBadgeCount}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)' }}>
                Level {achievementState.level} • {achievementState.totalPoints} pts
              </div>
            </div>
            <StatCard
              icon={<Zap size={18} />}
              label="This Week"
              value={formatDuration(stats.thisWeekTime)}
              subvalue={`${stats.thisWeekSessions} sessions`}
              color="#8b5cf6"
            />
          </div>

          {/* Weekly Chart */}
          {stats.recentSessions.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={16} />
                Last 7 Days
              </h3>
              <div style={{ padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                <WeeklyPracticeChart sessions={stats.recentSessions} />
              </div>
            </div>
          )}

          {/* Timing Breakdown */}
          {stats.totalHits > 0 && (
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>Timing Breakdown</h3>
              <div style={{ padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ 
                    flex: stats.totalPerfect / stats.totalHits, 
                    height: '8px', 
                    background: '#22c55e', 
                    borderRadius: '4px 0 0 4px',
                    minWidth: stats.totalPerfect > 0 ? '4px' : '0',
                  }} />
                  <div style={{ 
                    flex: stats.totalEarly / stats.totalHits, 
                    height: '8px', 
                    background: '#f59e0b',
                    minWidth: stats.totalEarly > 0 ? '4px' : '0',
                  }} />
                  <div style={{ 
                    flex: stats.totalLate / stats.totalHits, 
                    height: '8px', 
                    background: '#ef4444', 
                    borderRadius: '0 4px 4px 0',
                    minWidth: stats.totalLate > 0 ? '4px' : '0',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--dpgen-muted)' }}>
                  <span><span style={{ color: '#22c55e' }}>●</span> Perfect: {stats.totalPerfect} ({((stats.totalPerfect / stats.totalHits) * 100).toFixed(0)}%)</span>
                  <span><span style={{ color: '#f59e0b' }}>●</span> Early: {stats.totalEarly}</span>
                  <span><span style={{ color: '#ef4444' }}>●</span> Late: {stats.totalLate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Preset Best Scores */}
          {stats.presetScores.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={16} />
                Pattern Progress
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {stats.presetScores.slice(0, 5).map((score) => (
                  <div
                    key={score.presetId}
                    style={{
                      padding: '0.75rem',
                      background: 'var(--dpgen-bg)',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${getMasteryColor(score.mastery)}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.375rem' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{score.presetName}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--dpgen-muted)' }}>
                          {score.attempts} attempts • {formatDuration(score.totalTime)}
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        padding: '0.125rem 0.375rem', 
                        borderRadius: '4px',
                        background: `${getMasteryColor(score.mastery)}20`,
                        color: getMasteryColor(score.mastery),
                      }}>
                        {getMasteryLabel(score.mastery)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                      <div>
                        <span style={{ color: 'var(--dpgen-muted)' }}>Best: </span>
                        <span style={{ fontWeight: 600, color: score.bestAccuracy >= 80 ? '#22c55e' : 'inherit' }}>
                          {score.bestAccuracy.toFixed(0)}%
                        </span>
                      </div>
                      {score.bestBpm > 0 && (
                        <div>
                          <span style={{ color: 'var(--dpgen-muted)' }}>Max BPM: </span>
                          <span style={{ fontWeight: 600 }}>{score.bestBpm}</span>
                        </div>
                      )}
                      {score.bestTiming > 0 && score.bestTiming < Infinity && (
                        <div>
                          <span style={{ color: 'var(--dpgen-muted)' }}>Timing: </span>
                          <span style={{ fontWeight: 600 }}>{score.bestTiming.toFixed(0)}ms</span>
                        </div>
                      )}
                    </div>
                    {score.accuracyHistory && score.accuracyHistory.length >= 2 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <AccuracyTrendChart history={score.accuracyHistory} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BPM Achievements */}
          {stats.topBpmAchievements.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={16} />
                Speed Records
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {stats.topBpmAchievements.map((achievement, i) => (
                  <div
                    key={achievement.patternId}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--dpgen-bg)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{achievement.maxBpm} BPM</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          {stats.recentSessions.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>Recent Sessions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {stats.recentSessions.slice(-5).reverse().map((session) => (
                  <div
                    key={session.id}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--dpgen-bg)',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {session.presetName || `Pattern ${session.patternId}`}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--dpgen-muted)' }}>
                        {new Date(session.startTime).toLocaleDateString()} • {formatDuration(session.duration)}
                        {session.bpm && ` • ${session.bpm} BPM`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {session.accuracy !== undefined && (
                        <span style={{ 
                          fontWeight: 600,
                          color: session.accuracy >= 80 ? '#22c55e' : session.accuracy >= 60 ? '#f59e0b' : '#ef4444',
                        }}>
                          {session.accuracy.toFixed(0)}%
                        </span>
                      )}
                      <span style={{ 
                        fontSize: '0.65rem', 
                        padding: '0.125rem 0.375rem',
                        background: session.practiceMode === 'midi' ? '#3b82f620' : '#8b5cf620',
                        color: session.practiceMode === 'midi' ? '#3b82f6' : '#8b5cf6',
                        borderRadius: '4px',
                      }}>
                        {session.practiceMode === 'midi' ? 'MIDI' : 'Mic'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {(practiceGoals.streakGoal || practiceGoals.accuracyGoal) && (
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>Goals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {practiceGoals.streakGoal && (
                  <div style={{ padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.8rem' }}>Streak Goal</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{stats.currentStreak} / {practiceGoals.streakGoal} days</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--dpgen-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, (stats.currentStreak / practiceGoals.streakGoal) * 100)}%`,
                        height: '100%',
                        background: 'var(--dpgen-primary)',
                      }} />
                    </div>
                  </div>
                )}
                {practiceGoals.accuracyGoal && (
                  <div style={{ padding: '0.75rem', background: 'var(--dpgen-bg)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.8rem' }}>Accuracy Goal</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{stats.avgAccuracy.toFixed(0)}% / {practiceGoals.accuracyGoal}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--dpgen-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, (stats.avgAccuracy / practiceGoals.accuracyGoal) * 100)}%`,
                        height: '100%',
                        background: stats.avgAccuracy >= practiceGoals.accuracyGoal ? '#22c55e' : 'var(--dpgen-primary)',
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {stats.totalSessions === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dpgen-muted)' }}>
              <Target size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <div>No practice sessions yet.</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Start practicing to track your progress!</div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Achievements Modal */}
      {showAchievements && (
        <AchievementsModal onClose={() => setShowAchievements(false)} />
      )}
    </div>
  );
}
