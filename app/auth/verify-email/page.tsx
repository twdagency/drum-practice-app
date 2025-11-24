/**
 * Verify Email Page
 * Verifies user email using token from email
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/shared/Toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      verifyEmail(tokenParam);
    } else {
      showToast('Invalid verification link', 'error');
      setTimeout(() => router.push('/'), 2000);
    }
  }, [searchParams, showToast, router]);

  const verifyEmail = async (tokenToVerify: string) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToVerify }),
      });

      const data = await response.json();
      if (data.success) {
        setVerified(true);
        showToast('Email verified successfully!', 'success');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        showToast(data.error || 'Failed to verify email', 'error');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div
        style={{
          background: 'var(--dpgen-bg, white)',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
        }}
      >
        {loading ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 600 }}>Verifying Email...</h1>
            <p>Please wait while we verify your email address.</p>
          </>
        ) : verified ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#10b981' }}>✓</div>
            <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 600 }}>Email Verified!</h1>
            <p>Your email has been successfully verified. Redirecting...</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ef4444' }}>✗</div>
            <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 600 }}>Verification Failed</h1>
            <p>The verification link is invalid or has expired. Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}

