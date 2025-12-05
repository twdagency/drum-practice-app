/**
 * Sign Up Modal Component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../shared/Toast';
import { signIn } from 'next-auth/react';
import { Modal, ModalButton } from '../shared/Modal';
import { UserPlus } from 'lucide-react';

interface SignUpModalProps {
  onClose: () => void;
  onSwitchToSignIn?: () => void;
  promoCode?: string;
}

export function SignUpModal({ onClose, onSwitchToSignIn, promoCode }: SignUpModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.message || 'Failed to create account';
        showToast(errorMsg, 'error');
        return;
      }

      showToast('Account created successfully! Please sign in.', 'success');
      if (onSwitchToSignIn) {
        onSwitchToSignIn();
      } else {
        onClose();
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Sign Up"
      icon={<UserPlus size={20} strokeWidth={1.5} />}
      size="sm"
    >
      {promoCode && (
        <div style={{
          padding: '0.625rem 0.75rem',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid #22c55e',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.8rem',
          color: '#22c55e',
        }}>
          🎉 Promo code <strong>{promoCode}</strong> will be applied at checkout!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.875rem' }}>
          <label htmlFor="signup-name" style={labelStyle}>Name (optional)</label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            placeholder="Your name"
          />
        </div>

        <div style={{ marginBottom: '0.875rem' }}>
          <label htmlFor="signup-email" style={labelStyle}>Email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
            placeholder="your@email.com"
          />
        </div>

        <div style={{ marginBottom: '0.875rem' }}>
          <label htmlFor="signup-password" style={labelStyle}>Password (min 8 characters)</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={inputStyle}
            placeholder="••••••••"
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="signup-confirm" style={labelStyle}>Confirm Password</label>
          <input
            id="signup-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={inputStyle}
            placeholder="••••••••"
          />
        </div>

        <ModalButton variant="primary" fullWidth disabled={loading} type="submit">
          {loading ? 'Creating account...' : 'Sign Up'}
        </ModalButton>
      </form>

      {onSwitchToSignIn && (
        <div style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '1rem', color: 'var(--dpgen-muted)' }}>
          Already have an account?{' '}
          <button
            onClick={onSwitchToSignIn}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--dpgen-primary)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Sign in
          </button>
        </div>
      )}

      {/* OAuth Providers */}
      {(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID) && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--dpgen-border)' }}>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', marginBottom: '0.75rem', color: 'var(--dpgen-muted)' }}>
            Or sign up with
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
              <button
                type="button"
                onClick={() => signIn('google')}
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
                onClick={() => signIn('github')}
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
  );
}
