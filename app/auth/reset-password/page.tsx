/**
 * Reset Password Page
 * Allows users to reset their password using a token from email
 */

import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

// Prevent static generation - this page uses searchParams
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

