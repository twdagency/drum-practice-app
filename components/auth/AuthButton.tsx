/**
 * Authentication Button Component
 * Shows sign in/out button based on auth state
 */

'use client';

import { useSession, signOut, signIn } from 'next-auth/react';
import { useState } from 'react';
import { SignInModal } from './SignInModal';
import { SignUpModal } from './SignUpModal';
import { UserProfileModal } from './UserProfileModal';

export function AuthButton() {
  const { data: session, status } = useSession();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  if (status === 'loading') {
    return (
      <button
        style={{
          padding: '0.5rem 1rem',
          background: 'var(--dpgen-bg-secondary)',
          border: '1px solid var(--dpgen-border)',
          borderRadius: '4px',
          cursor: 'wait',
        }}
        disabled
      >
        Loading...
      </button>
    );
  }

  if (session?.user) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowProfile(true)}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--dpgen-bg-secondary)',
              border: '1px solid var(--dpgen-border)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            title="Profile settings"
          >
            <i className="fas fa-user" />
            <span>{session.user.name || session.user.email}</span>
          </button>
          <button
            onClick={() => signOut()}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--dpgen-error, #dc2626)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Sign Out
          </button>
        </div>

        {showProfile && <UserProfileModal onClose={() => setShowProfile(false)} />}
      </>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowSignIn(true)}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--dpgen-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Sign In
        </button>
        <button
          onClick={() => setShowSignUp(true)}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--dpgen-bg-secondary)',
            border: '1px solid var(--dpgen-border)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Sign Up
        </button>
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <button
            onClick={() => signIn('google')}
            style={{
              padding: '0.5rem 1rem',
              background: '#4285F4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            title="Sign in with Google"
          >
            <i className="fab fa-google" />
            Google
          </button>
        )}
        {process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID && (
          <button
            onClick={() => signIn('github')}
            style={{
              padding: '0.5rem 1rem',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            title="Sign in with GitHub"
          >
            <i className="fab fa-github" />
            GitHub
          </button>
        )}
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
    </>
  );
}

