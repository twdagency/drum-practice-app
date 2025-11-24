/**
 * Loading skeleton component for showing loading states
 */

'use client';

import React from 'react';

interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function LoadingSkeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
  style = {},
}: LoadingSkeletonProps) {
  return (
    <div
      className={`dpgen-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--dpgen-border) 25%, rgba(255, 255, 255, 0.1) 50%, var(--dpgen-border) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

interface PatternSkeletonProps {
  count?: number;
}

export function PatternSkeleton({ count = 3 }: PatternSkeletonProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: '1.5rem',
            background: 'var(--dpgen-card)',
            borderRadius: 'var(--dpgen-radius)',
            border: '1px solid var(--dpgen-border)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <LoadingSkeleton width={24} height={24} borderRadius="4px" />
              <LoadingSkeleton width="60%" height={24} />
              <LoadingSkeleton width={32} height={32} borderRadius="50%" style={{ marginLeft: 'auto' }} />
            </div>
            <LoadingSkeleton width="100%" height={120} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <LoadingSkeleton width={80} height={32} />
              <LoadingSkeleton width={80} height={32} />
              <LoadingSkeleton width={80} height={32} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface StaveSkeletonProps {
  lines?: number;
}

export function StaveSkeleton({ lines = 2 }: StaveSkeletonProps) {
  return (
    <div style={{ padding: '2rem' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            marginBottom: '3rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <LoadingSkeleton width="100%" height={120} borderRadius="8px" />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <LoadingSkeleton width={60} height={20} />
            <LoadingSkeleton width={60} height={20} />
            <LoadingSkeleton width={60} height={20} />
          </div>
        </div>
      ))}
    </div>
  );
}

