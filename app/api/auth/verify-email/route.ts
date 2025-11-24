/**
 * Verify Email API Route
 * POST: Verify email with token
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find valid verification token
    const tokenResult = await query(
      `SELECT vt.identifier, vt.expires
       FROM verification_tokens vt
       WHERE vt.token = $1 AND vt.expires > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const verificationToken = tokenResult.rows[0];
    const email = verificationToken.identifier;

    // Update user email as verified
    await query(
      'UPDATE users SET "emailVerified" = CURRENT_TIMESTAMP WHERE email = $1',
      [email]
    );

    // Delete used token
    await query('DELETE FROM verification_tokens WHERE token = $1', [token]);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}

