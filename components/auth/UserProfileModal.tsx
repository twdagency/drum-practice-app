/**
 * User Profile Management Modal
 * Allows users to update their name, email, and password
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '../shared/Toast';

interface UserProfileModalProps {
  onClose: () => void;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  emailVerified: string | null;
  image: string | null;
  createdAt: string;
}

export function UserProfileModal({ onClose }: UserProfileModalProps) {
  const { data: session, update: updateSession } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile');
      const data = await response.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setName(data.data.name || '');
        setEmail(data.data.email || '');
      }
    } catch (error) {
      showToast('Failed to load profile', 'error');
    }
  };

  const handleUpdateName = async () => {
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Name updated successfully', 'success');
        await loadProfile();
        await updateSession();
      } else {
        showToast(data.error || 'Failed to update name', 'error');
      }
    } catch (error) {
      showToast('Failed to update name', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email.trim() || email === profile?.email) {
      showToast('Please enter a new email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.requiresVerification) {
          showToast('Verification email sent to new address', 'success');
        } else {
          showToast('Email updated successfully', 'success');
          await loadProfile();
          await updateSession();
        }
      } else {
        showToast(data.error || 'Failed to update email', 'error');
      }
    } catch (error) {
      showToast('Failed to update email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast('Please fill in all password fields', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Password updated successfully', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(data.error || 'Failed to update password', 'error');
      }
    } catch (error) {
      showToast('Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Verification email sent', 'success');
      } else {
        showToast(data.error || 'Failed to send verification email', 'error');
      }
    } catch (error) {
      showToast('Failed to send verification email', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: 'var(--dpgen-bg, white)',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--dpgen-bg, white)',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Profile Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--dpgen-text-secondary)',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Name Section */}
          <div>
            <label
              htmlFor="profile-name"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Name
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid var(--dpgen-border, #ddd)',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
              <button
                onClick={handleUpdateName}
                disabled={loading || name.trim() === profile.name}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--dpgen-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || name.trim() === profile.name ? 'not-allowed' : 'pointer',
                  opacity: loading || name.trim() === profile.name ? 0.6 : 1,
                }}
              >
                Update
              </button>
            </div>
          </div>

          {/* Email Section */}
          <div>
            <label
              htmlFor="profile-email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Email
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.75rem',
                  border: '1px solid var(--dpgen-border, #ddd)',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
              <button
                onClick={handleUpdateEmail}
                disabled={loading || email.trim() === profile.email}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--dpgen-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || email.trim() === profile.email ? 'not-allowed' : 'pointer',
                  opacity: loading || email.trim() === profile.email ? 0.6 : 1,
                }}
              >
                Update
              </button>
            </div>
            {profile.emailVerified ? (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#10b981' }}>
                <i className="fas fa-check-circle" style={{ marginRight: '0.25rem' }} />
                Email verified
              </div>
            ) : (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#f59e0b' }}>
                <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.25rem' }} />
                Email not verified.{' '}
                <button
                  onClick={handleResendVerification}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--dpgen-primary)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Resend verification email
                </button>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Change Password
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--dpgen-border, #ddd)',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
              <input
                type="password"
                placeholder="New password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--dpgen-border, #ddd)',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--dpgen-border, #ddd)',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
              <button
                onClick={handleUpdatePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--dpgen-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || !currentPassword || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer',
                  opacity: loading || !currentPassword || !newPassword || !confirmPassword ? 0.6 : 1,
                }}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

