/**
 * Badge Notification Component
 * Shows a celebratory popup when a new badge is earned
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Badge, RARITY_COLORS } from '@/types/achievements';
import {
  Award,
  Trophy,
  Star,
  Flame,
  Target,
  Clock,
  Zap,
  Route,
  Compass,
  GraduationCap,
  Footprints,
  TrendingUp,
  ClipboardCheck,
  CalendarCheck,
  Shield,
  Crown,
  Dumbbell,
  Timer,
  Hourglass,
  Crosshair,
  Layers,
  Library,
  Gauge,
  Rocket,
  Sparkles,
  Music,
  Play,
  X,
  LucideIcon,
} from 'lucide-react';

// Icon mapping
const BADGE_ICONS: Record<string, LucideIcon> = {
  'route': Route,
  'compass': Compass,
  'graduation-cap': GraduationCap,
  'trophy': Trophy,
  'footprints': Footprints,
  'trending-up': TrendingUp,
  'award': Award,
  'clipboard-check': ClipboardCheck,
  'calendar-check': CalendarCheck,
  'shield': Shield,
  'crown': Crown,
  'dumbbell': Dumbbell,
  'flame': Flame,
  'zap': Zap,
  'clock': Clock,
  'timer': Timer,
  'hourglass': Hourglass,
  'target': Target,
  'crosshair': Crosshair,
  'layers': Layers,
  'library': Library,
  'gauge': Gauge,
  'rocket': Rocket,
  'sparkles': Sparkles,
  'music': Music,
  'play': Play,
  'star': Star,
};

const getBadgeIcon = (iconName: string, size: number = 32) => {
  const IconComponent = BADGE_ICONS[iconName] || Award;
  return <IconComponent size={size} />;
};

interface BadgeNotificationProps {
  badge: Badge | null;
  onClose: () => void;
}

export const BadgeNotification: React.FC<BadgeNotificationProps> = ({ badge, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (badge) {
      setIsVisible(true);
      setIsExiting(false);
      
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [badge]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!badge || !isVisible) return null;

  const rarityColor = RARITY_COLORS[badge.rarity];

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10001,
        animation: isExiting ? 'slideOut 0.3s ease-out forwards' : 'slideIn 0.3s ease-out forwards',
      }}
    >
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(120%);
            opacity: 0;
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes shine {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
      
      <div
        style={{
          background: 'var(--dpgen-card)',
          borderRadius: '16px',
          padding: '1.25rem',
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 2px ${rarityColor}40`,
          maxWidth: '320px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Shine effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            animation: 'shine 1.5s ease-out',
          }}
        />
        
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--dpgen-muted)',
            padding: '4px',
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginBottom: '0.75rem',
          color: '#f59e0b',
          fontSize: '0.8rem',
          fontWeight: 600,
        }}>
          <Sparkles size={16} />
          NEW BADGE EARNED!
        </div>

        {/* Badge icon and info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${rarityColor}30, ${rarityColor}10)`,
              border: `2px solid ${rarityColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: rarityColor,
              flexShrink: 0,
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            {getBadgeIcon(badge.icon, 28)}
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
              {badge.name}
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--dpgen-muted)' }}>
              {badge.description}
            </p>
          </div>
        </div>

        {/* Points and rarity */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--dpgen-border)',
        }}>
          <span style={{
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            background: `${rarityColor}20`,
            color: rarityColor,
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}>
            {badge.rarity}
          </span>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: '#f59e0b',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}>
            +{badge.points}
            <Star size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};

// Export icon mapping for reuse
export { getBadgeIcon, BADGE_ICONS };

