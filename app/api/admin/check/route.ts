/**
 * API route to check if current user is an admin
 * GET /api/admin/check
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db/connection';
import { getAdminEmails, isAdminEmail } from '@/lib/utils/adminAuth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { isAdmin: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id || session.user.email;
    const userEmail = session.user.email || '';

    // Check if user is admin
    const adminEmails = getAdminEmails();
    const isAdmin = isAdminEmail(userEmail);

    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Admin Check]', {
        userEmail,
        adminEmails,
        isAdmin,
        hasADMIN_EMAILS: !!process.env.ADMIN_EMAILS,
        hasNEXT_PUBLIC_ADMIN_EMAILS: !!process.env.NEXT_PUBLIC_ADMIN_EMAILS,
        adminEmailsCount: adminEmails.length
      });
    }

    // Alternatively, check database for admin role
    // const result = await query('SELECT is_admin FROM users WHERE id = $1', [userId]);
    // const isAdmin = result.rows[0]?.is_admin || false;

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { isAdmin: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

