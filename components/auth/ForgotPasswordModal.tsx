/**
 * Forgot Password Modal
 * Allows users to request a password reset
 */

'use client';

import { useState } from 'react';
import { useToast } from '../shared/Toast';
import { Modal, ModalButton, ModalAlert } from '../shared/Modal';
import { KeyRound, Mail } from 'lucide-react';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setSent(true);
        showToast('Password reset email sent', 'success');
      } else {
        showToast(data.error || 'Failed to send reset email', 'error');
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
      title="Reset Password"
      icon={<KeyRound size={20} strokeWidth={1.5} />}
      size="sm"
    >
      {sent ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(34, 197, 94, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Mail size={24} style={{ color: '#22c55e' }} />
          </div>
          <p style={{ 
            marginBottom: '1.25rem', 
            color: 'var(--dpgen-text)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}>
            If an account exists with that email, a password reset link has been sent. Please check your email.
          </p>
          <ModalButton variant="primary" onClick={onClose} fullWidth>
            Done
          </ModalButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p style={{ 
            marginBottom: '1rem', 
            color: 'var(--dpgen-muted)',
            fontSize: '0.8rem',
            lineHeight: 1.5,
          }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="reset-email" style={labelStyle}>Email</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="your@email.com"
            />
          </div>

          <ModalButton variant="primary" fullWidth disabled={loading} type="submit">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </ModalButton>
        </form>
      )}
    </Modal>
  );
}
