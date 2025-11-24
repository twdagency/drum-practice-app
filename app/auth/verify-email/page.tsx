/**
 * Verify Email Page
 * Verifies user email using token from email
 */

import { Suspense } from 'react';
import VerifyEmailForm from './VerifyEmailForm';

// Prevent static generation - this page uses searchParams
export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}

