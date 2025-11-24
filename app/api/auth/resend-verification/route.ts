/**
 * Resend Verification Email API Route
 * POST: Resend email verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import { query } from '@/lib/db/connection';
import { sendEmail, emailTemplates } from '@/lib/email/config';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get user data
    const result = await query('SELECT email, name, "emailVerified" FROM users WHERE id = $1', [
      user.id,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = result.rows[0];

    // Check if already verified
    if (userData.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified',
      });
    }

    // Generate verification token
    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours

    // Delete old tokens for this email
    await query('DELETE FROM verification_tokens WHERE identifier = $1', [userData.email]);

    // Save new token
    await query(
      `INSERT INTO verification_tokens (identifier, token, expires)
       VALUES ($1, $2, $3)`,
      [userData.email, token, expires]
    );

    // Send verification email
    const emailContent = emailTemplates.verification(userData.name || 'User', token);
    const emailResult = await sendEmail(userData.email, emailContent.subject, emailContent.html, emailContent.text);
    
    if (!emailResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: emailResult.error === 'Email service not configured' 
            ? 'Email service is not configured. Please contact support.' 
            : 'Failed to send verification email. Please check your email configuration.' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error resending verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend verification' },
      { status: 500 }
    );
  }
}

