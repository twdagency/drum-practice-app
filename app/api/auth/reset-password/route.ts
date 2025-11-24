/**
 * Reset Password API Route
 * POST: Reset password using token
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Find valid token
    const tokenResult = await query(
      `SELECT prt.user_id, prt.expires, prt.used
       FROM password_reset_tokens prt
       WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const resetToken = tokenResult.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      hashedPassword,
      resetToken.user_id,
    ]);

    // Mark token as used
    await query('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1', [token]);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

