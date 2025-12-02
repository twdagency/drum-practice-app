/**
 * Sign Up Modal Component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../shared/Toast';
import { signIn } from 'next-auth/react';

interface SignUpModalProps {
  onClose: () => void;
  onSwitchToSignIn?: () => void;
}

export function SignUpModal({ onClose, onSwitchToSignIn }: SignUpModalProps) {
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
        const details = data.details ? `\n${data.details}` : '';
        console.error('Signup error:', errorMsg, details);
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

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-8 max-w-md w-[90%] border border-slate-800/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Sign Up</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="signup-name"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Name (optional)
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all"
              placeholder="Your name"
            />
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Password (min 8 characters)
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="signup-confirm"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Confirm Password
            </label>
            <input
              id="signup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 mt-6"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {onSwitchToSignIn && (
          <div className="text-center text-sm text-slate-400 mt-4">
            Already have an account?{' '}
            <button
              onClick={onSwitchToSignIn}
              className="text-white hover:text-slate-200 underline transition-colors"
            >
              Sign in
            </button>
          </div>
        )}

        {/* OAuth Providers */}
        <div className="mt-6 pt-6 border-t border-slate-800/50">
          <div className="text-center text-sm text-slate-400 mb-4">
            Or sign up with
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
              <button
                onClick={() => signIn('google')}
                className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl hover:bg-slate-800/70 hover:border-slate-600/50 transition-all text-sm font-medium flex items-center gap-2"
              >
                <i className="fab fa-google" />
                Google
              </button>
            )}
            {process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID && (
              <button
                onClick={() => signIn('github')}
                className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-xl hover:bg-slate-800/70 hover:border-slate-600/50 transition-all text-sm font-medium flex items-center gap-2"
              >
                <i className="fab fa-github" />
                GitHub
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

