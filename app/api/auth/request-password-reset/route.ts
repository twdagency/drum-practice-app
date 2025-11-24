/**
 * Request Password Reset API Route
 * POST: Send password reset email
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { sendEmail, emailTemplates } from '@/lib/email/config';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const result = await query('SELECT id, name, email FROM users WHERE email = $1', [
      email.toLowerCase().trim(),
    ]);

    // Always return success (don't reveal if email exists)
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    }

    const user = result.rows[0];

    // Check if user has a password (OAuth-only users can't reset password)
    const userWithPassword = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [user.id]
    );

    if (!userWithPassword.rows[0]?.password_hash) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry

    // Delete any existing tokens for this user
    await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

    // Save new token
    await query(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), user.id, token, expires]
    );

    // Send password reset email
    const emailContent = emailTemplates.passwordReset(user.name || 'User', token);
    const emailResult = await sendEmail(user.email, emailContent.subject, emailContent.html, emailContent.text);
    
    if (!emailResult.success) {
      console.warn('Failed to send password reset email:', emailResult.error);
      // Still return success to not reveal email existence
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

