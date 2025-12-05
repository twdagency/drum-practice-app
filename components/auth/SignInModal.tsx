/**
 * Sign In Modal Component
 */

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '../shared/Toast';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { Modal, ModalButton } from '../shared/Modal';
import { LogIn } from 'lucide-react';

interface SignInModalProps {
  onClose: () => void;
  onSwitchToSignUp?: () => void;
  redirectTo?: string; // Where to redirect after successful sign-in (defaults to /app)
}

export function SignInModal({ onClose, onSwitchToSignUp, redirectTo = '/app' }: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        showToast('Invalid email or password', 'error');
      } else {
        showToast('Signed in successfully!', 'success');
        onClose();
        // Clear the welcome screen "last shown" so it shows on next page
        if (typeof window !== 'undefined') {
          localStorage.removeItem('welcomeLastShown');
        }
        // Navigate to the redirect destination
        router.push(redirectTo);
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: '1px solid var(--dpgen-border)',
    borderRadius: '6px',
    fontSize: '0.875rem',
    background: 'var(--dpgen-bg)',
    color: 'var(--dpgen-text)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--dpgen-text)',
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Sign In"
        icon={<LogIn size={20} strokeWidth={1.5} />}
        size="sm"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={labelStyle}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="your@email.com"
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>

          <ModalButton variant="primary" fullWidth disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign In'}
          </ModalButton>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={() => setShowForgotPassword(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--dpgen-primary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              textDecoration: 'underline',
            }}
          >
            Forgot password?
          </button>
        </div>

        {onSwitchToSignUp && (
          <div style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '0.75rem', color: 'var(--dpgen-muted)' }}>
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--dpgen-primary)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Sign up
            </button>
          </div>
        )}

        {/* OAuth Providers */}
        {(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID) && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--dpgen-border)' }}>
            <div style={{ textAlign: 'center', fontSize: '0.75rem', marginBottom: '0.75rem', color: 'var(--dpgen-muted)' }}>
              Or continue with
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: redirectTo })}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--dpgen-bg)',
                    color: 'var(--dpgen-text)',
                    border: '1px solid var(--dpgen-border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                >
                  Google
                </button>
              )}
              {process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID && (
                <button
                  type="button"
                  onClick={() => signIn('github', { callbackUrl: redirectTo })}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--dpgen-bg)',
                    color: 'var(--dpgen-text)',
                    border: '1px solid var(--dpgen-border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                >
                  GitHub
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </>
  );
}
