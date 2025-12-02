/**
 * Sign In Page
 * NextAuth.js signin page
 */

'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SignInModal } from '@/components/auth/SignInModal';
import { SignUpModal } from '@/components/auth/SignUpModal';

function SignInContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSignIn, setShowSignIn] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/app';

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(callbackUrl);
    }
  }, [status, session, router, callbackUrl]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Sign In</h1>
          <p className="text-slate-400">Sign in to access the app</p>
        </div>

        {showSignIn && (
          <SignInModal
            onClose={() => {
              setShowSignIn(false);
              // Redirect to callback URL or home if no callback
              router.push(callbackUrl);
            }}
            onSwitchToSignUp={() => {
              setShowSignIn(false);
              setShowSignUp(true);
            }}
          />
        )}

        {showSignUp && (
          <SignUpModal
            onClose={() => {
              setShowSignUp(false);
              router.push(callbackUrl);
            }}
            onSwitchToSignIn={() => {
              setShowSignUp(false);
              setShowSignIn(true);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}

