/**
 * Animated Logo Component
 * Four dots with an orange highlight that cycles through like a metronome
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  linkTo?: string;
  speed?: number; // BPM - beats per minute
}

export function AnimatedLogo({ 
  size = 'md', 
  showText = true, 
  linkTo = '/',
  speed = 120 // Default 120 BPM
}: AnimatedLogoProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Calculate interval from BPM
  const intervalMs = (60 / speed) * 1000;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 4);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  // Size configurations
  const sizes = {
    sm: { dot: 16, gap: 6, text: '1rem', textGap: '0.25rem' },
    md: { dot: 24, gap: 8, text: '1.25rem', textGap: '0.375rem' },
    lg: { dot: 36, gap: 12, text: '1.75rem', textGap: '0.5rem' },
  };

  const config = sizes[size];

  const content = (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: config.textGap,
      cursor: linkTo ? 'pointer' : 'default',
    }}>
      {/* Dots */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: `${config.gap}px` 
      }}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            style={{
              width: `${config.dot}px`,
              height: `${config.dot}px`,
              borderRadius: '50%',
              backgroundColor: activeIndex === index ? '#ff6b35' : '#1a1a1a',
              transition: 'background-color 0.1s ease-out, transform 0.1s ease-out',
              transform: activeIndex === index ? 'scale(1.1)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Text */}
      {showText && (
        <span style={{
          fontSize: config.text,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--dpgen-text, #1a1a1a)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          DrumPractice
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    );
  }

  return content;
}

// Simpler inline version for tight spaces (just dots, horizontal layout with text)
export function AnimatedLogoInline({ 
  linkTo = '/',
  speed = 120,
  variant = 'light'
}: { linkTo?: string; speed?: number; variant?: 'light' | 'dark' }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalMs = (60 / speed) * 1000;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 4);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  // Colors based on variant
  const inactiveDotColor = variant === 'dark' ? '#ffffff' : '#1a1a1a';
  const textColor = variant === 'dark' ? '#ffffff' : 'var(--dpgen-text, #1a1a1a)';

  const content = (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: '0.75rem',
      cursor: linkTo ? 'pointer' : 'default',
    }}>
      {/* Dots */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px' 
      }}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: activeIndex === index ? '#ff6b35' : inactiveDotColor,
              transition: 'background-color 0.08s ease-out, transform 0.08s ease-out',
              transform: activeIndex === index ? 'scale(1.15)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Text */}
      <span style={{
        fontSize: '1.125rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: textColor,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        DrumPractice
      </span>
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    );
  }

  return content;
}

