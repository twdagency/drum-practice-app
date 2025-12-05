/**
 * Welcome Modal - Personalized greeting and quick actions
 * Shows when users log in to help them get started
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';
import { useStore } from '@/store/useStore';
import { useAchievements } from '@/hooks/useAchievements';
import { useLearningPaths } from '@/hooks/useLearningPaths';
import {
  Sparkles,
  Plus,
  Library,
  Route,
  ClipboardList,
  X,
  Flame,
  Trophy,
  Sun,
  Moon,
  Sunrise,
} from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
  onAction: (action: 'create' | 'presets' | 'learning' | 'routines') => void;
}

// Get time-based greeting
function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour < 12) {
    return { text: 'Good morning', icon: <Sunrise size={24} /> };
  } else if (hour < 18) {
    return { text: 'Good afternoon', icon: <Sun size={24} /> };
  } else {
    return { text: 'Good evening', icon: <Moon size={24} /> };
  }
}

// Get first name from full name
function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return 'Drummer';
  const parts = fullName.trim().split(' ');
  return parts[0] || 'Drummer';
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose, onAction }) => {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const { state: achievementState } = useAchievements();
  const { paths, progress } = useLearningPaths();
  const practiceStats = useStore((state) => state.practiceStats);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const greeting = getGreeting();
  const firstName = getFirstName(session?.user?.name);
  
  // Calculate user stats for personalization
  const totalSessions = practiceStats.sessions.length;
  const isNewUser = totalSessions === 0;
  const currentStreak = practiceStats.currentStreak || 0;
  const earnedBadges = achievementState.earnedBadges.length;
  
  // Find in-progress learning path
  const inProgressPath = paths.find(p => {
    const pathProgress = progress[p.id];
    return pathProgress && !pathProgress.completed && pathProgress.stepsCompleted > 0;
  });

  const actionCards = [
    {
      id: 'create',
      icon: <Plus size={24} />,
      title: 'Create a Pattern',
      description: isNewUser 
        ? 'Build your first drum pattern from scratch'
        : 'Design a new custom pattern',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    },
    {
      id: 'presets',
      icon: <Library size={24} />,
      title: 'Browse Presets',
      description: isNewUser
        ? 'Explore ready-made patterns to practice'
        : 'Find new patterns to master',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #14b8a6)',
    },
    {
      id: 'learning',
      icon: <Route size={24} />,
      title: inProgressPath ? 'Continue Learning Path' : 'Start Learning Path',
      description: inProgressPath
        ? `Continue: ${inProgressPath.name}`
        : 'Follow a structured learning journey',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
      highlight: !!inProgressPath,
    },
    {
      id: 'routines',
      icon: <ClipboardList size={24} />,
      title: 'Practice Routine',
      description: isNewUser
        ? 'Start a guided practice session'
        : 'Warm up with a structured routine',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    },
  ];

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--dpgen-card)',
          borderRadius: '20px',
          maxWidth: '600px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--dpgen-border)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            color: 'var(--dpgen-muted)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = 'var(--dpgen-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'var(--dpgen-muted)';
          }}
        >
          <X size={20} />
        </button>

        {/* Header with greeting */}
        <div style={{
          padding: '2rem 2rem 1.5rem 2rem',
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: '#f59e0b',
            marginBottom: '0.5rem',
          }}>
            {greeting.icon}
          </div>
          
          <h1 style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '0.25rem',
          }}>
            {greeting.text}, {firstName}!
          </h1>
          
          <p style={{
            margin: 0,
            color: 'var(--dpgen-muted)',
            fontSize: '1rem',
          }}>
            What would you like to do today?
          </p>
        </div>

        {/* Quick Stats for returning users */}
        {!isNewUser && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            padding: '0 2rem 1.5rem 2rem',
          }}>
            {currentStreak > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(249, 115, 22, 0.1)',
                borderRadius: '20px',
                fontSize: '0.85rem',
              }}>
                <Flame size={16} style={{ color: '#f97316' }} />
                <span style={{ fontWeight: 600 }}>{currentStreak}</span>
                <span style={{ color: 'var(--dpgen-muted)' }}>day streak</span>
              </div>
            )}
            {earnedBadges > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '20px',
                fontSize: '0.85rem',
              }}>
                <Trophy size={16} style={{ color: '#f59e0b' }} />
                <span style={{ fontWeight: 600 }}>{earnedBadges}</span>
                <span style={{ color: 'var(--dpgen-muted)' }}>badges</span>
              </div>
            )}
          </div>
        )}

        {/* Action Cards */}
        <div style={{
          padding: '0 1.5rem 1.5rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
        }}>
          {actionCards.map((card) => (
            <button
              key={card.id}
              onClick={() => onAction(card.id as 'create' | 'presets' | 'learning' | 'routines')}
              style={{
                padding: '1.25rem',
                background: card.highlight 
                  ? `linear-gradient(135deg, ${card.color}15, ${card.color}08)`
                  : 'var(--dpgen-bg)',
                border: card.highlight 
                  ? `2px solid ${card.color}40`
                  : '1px solid var(--dpgen-border)',
                borderRadius: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${card.color}20`;
                e.currentTarget.style.borderColor = card.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = card.highlight ? `${card.color}40` : 'var(--dpgen-border)';
              }}
            >
              {/* Icon */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: card.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                marginBottom: '0.75rem',
              }}>
                {card.icon}
              </div>

              {/* Title and description */}
              <h3 style={{
                margin: '0 0 0.25rem 0',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--dpgen-text)',
              }}>
                {card.title}
              </h3>
              
              <p style={{
                margin: 0,
                fontSize: '0.8rem',
                color: 'var(--dpgen-muted)',
                lineHeight: 1.4,
              }}>
                {card.description}
              </p>

              {/* Highlight badge for continue */}
              {card.highlight && (
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  background: card.color,
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                }}>
                  IN PROGRESS
                </div>
              )}
            </button>
          ))}
        </div>

        {/* New user tip */}
        {isNewUser && (
          <div style={{
            margin: '0 1.5rem 1.5rem 1.5rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}>
            <Sparkles size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                New here? Start with a Learning Path!
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--dpgen-muted)' }}>
                Follow structured lessons to build your drumming skills step by step.
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--dpgen-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--dpgen-muted)',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              onChange={(e) => {
                // This will be connected to user settings
                if (e.target.checked) {
                  localStorage.setItem('hideWelcomeScreen', 'true');
                } else {
                  localStorage.removeItem('hideWelcomeScreen');
                }
              }}
              style={{ cursor: 'pointer' }}
            />
            Don't show this again
          </label>
          
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: 'none',
              border: '1px solid var(--dpgen-border)',
              borderRadius: '8px',
              color: 'var(--dpgen-text)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Hook to manage welcome modal state
export function useWelcomeModal() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    // Wait for auth to be determined
    if (status === 'loading') return;
    
    // Only check once per mount
    if (hasChecked) return;

    // Only show for authenticated users who haven't disabled it
    if (status === 'authenticated' && session?.user) {
      const hideWelcome = localStorage.getItem('hideWelcomeScreen');
      const lastShown = localStorage.getItem('welcomeLastShown');
      const today = new Date().toDateString();
      
      // Show welcome if:
      // 1. Not disabled
      // 2. Not shown today (to avoid showing every page refresh)
      if (!hideWelcome && lastShown !== today) {
        // Small delay to let the page load first
        setTimeout(() => {
          setShowWelcome(true);
          localStorage.setItem('welcomeLastShown', today);
        }, 500);
      }
      setHasChecked(true);
    } else if (status === 'unauthenticated') {
      setHasChecked(true);
    }
  }, [status, session, hasChecked]);

  const closeWelcome = () => setShowWelcome(false);
  const openWelcome = () => {
    // When manually opening, don't check date restrictions
    setShowWelcome(true);
  };

  return { showWelcome, closeWelcome, openWelcome };
}

