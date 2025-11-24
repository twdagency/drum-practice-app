/**
 * Login Page
 * Shows login/signup options for unauthenticated users
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SignInModal } from '@/components/auth/SignInModal';
import { SignUpModal } from '@/components/auth/SignUpModal';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--dpgen-bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // Will redirect
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--dpgen-primary) 0%, var(--dpgen-secondary) 100%)',
      padding: '2rem',
    }}>
      <div style={{
        background: 'var(--dpgen-card)',
        borderRadius: 'var(--dpgen-radius)',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: 'var(--dpgen-shadow)',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          color: 'var(--dpgen-text)',
        }}>
          Drum Practice Generator
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: 'var(--dpgen-muted)',
          marginBottom: '2rem',
        }}>
          Generate and practice drumming patterns with real-time feedback
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <button
            onClick={() => setShowSignIn(true)}
            style={{
              padding: '1rem 2rem',
              background: 'var(--dpgen-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Sign In
          </button>

          <button
            onClick={() => setShowSignUp(true)}
            style={{
              padding: '1rem 2rem',
              background: 'var(--dpgen-bg-secondary)',
              color: 'var(--dpgen-text)',
              border: '2px solid var(--dpgen-border)',
              borderRadius: '8px',
              fontSize: '1.125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Create Account
          </button>
        </div>

        {(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID) && (
          <div style={{
            borderTop: '1px solid var(--dpgen-border)',
            paddingTop: '2rem',
            marginTop: '2rem',
          }}>
            <p style={{
              color: 'var(--dpgen-muted)',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}>
              Or continue with:
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
            }}>
              {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                <button
                  onClick={() => {
                    import('next-auth/react').then(({ signIn }) => signIn('google'));
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#4285F4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <i className="fab fa-google" />
                  Google
                </button>
              )}
              {process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID && (
                <button
                  onClick={() => {
                    import('next-auth/react').then(({ signIn }) => signIn('github'));
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <i className="fab fa-github" />
                  GitHub
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid var(--dpgen-border)',
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--dpgen-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              textDecoration: 'underline',
            }}
          >
            Continue without signing in
          </button>
        </div>
      </div>

      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSwitchToSignUp={() => {
            setShowSignIn(false);
            setShowSignUp(true);
          }}
        />
      )}

      {showSignUp && (
        <SignUpModal
          onClose={() => setShowSignUp(false)}
          onSwitchToSignIn={() => {
            setShowSignUp(false);
            setShowSignIn(true);
          }}
        />
      )}
    </div>
  );
}

