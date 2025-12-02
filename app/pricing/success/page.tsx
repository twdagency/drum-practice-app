'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sessionIdParam = searchParams.get('session_id');
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
      // Fetch checkout session to get customer email
      fetch(`/api/stripe/checkout-session?sessionId=${sessionIdParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.email) {
            setCustomerEmail(data.email);
          }
        })
        .catch(err => console.error('Failed to fetch session:', err));
    }
  }, [searchParams]);

  const handleManageBilling = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      // Pass the session ID to get the customer ID from the checkout session
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId, // Portal route will retrieve customer ID from this
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.hint || 'Failed to create portal session');
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      alert(error.message || 'Failed to open billing portal. Please contact support.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Subscription Successful!
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Thank you for subscribing! You now have access to all premium features.
          </p>

          {/* Account Creation Prompt */}
          {status !== 'loading' && !session && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-200 mb-3">
                <strong>Create an account</strong> to save your patterns, track progress, and access your subscription from any device.
              </p>
              <Link
                href="/"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Create Account
              </Link>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Click "Create Account" to sign up and link your subscription to your account
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Link
              href="/app"
              className="block w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              Start Using the App
            </Link>

            {sessionId && (
              <button
                onClick={handleManageBilling}
                disabled={loading}
                className="block w-full py-3 px-6 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Manage Your Billing Information'}
              </button>
            )}
          </div>

          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            Need help? Contact us at{' '}
            <a href="mailto:support@example.com" className="text-blue-600 dark:text-blue-400 hover:underline">
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
