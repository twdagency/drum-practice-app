/**
 * Verify Email Change API Route
 * POST: Verify email change with token
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

    // Find valid email change token
    const tokenResult = await query(
      `SELECT ect.user_id, ect.new_email, ect.expires, ect.used
       FROM email_change_tokens ect
       WHERE ect.token = $1 AND ect.used = FALSE AND ect.expires > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const emailChangeToken = tokenResult.rows[0];
    const newEmail = emailChangeToken.new_email;

    // Check if new email is already taken
    const emailCheck = await query('SELECT id FROM users WHERE email = $1', [newEmail]);
    if (emailCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email is already in use' },
        { status: 400 }
      );
    }

    // Update user email
    await query('UPDATE users SET email = $1, "emailVerified" = NULL WHERE id = $2', [
      newEmail,
      emailChangeToken.user_id,
    ]);

    // Mark token as used
    await query('UPDATE email_change_tokens SET used = TRUE WHERE token = $1', [token]);

    // Send verification email to new address
    // (This would trigger a new verification flow for the new email)

    return NextResponse.json({
      success: true,
      message: 'Email changed successfully. Please verify your new email address.',
    });
  } catch (error) {
    console.error('Error verifying email change:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify email change' },
      { status: 500 }
    );
  }
}

