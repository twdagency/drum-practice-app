/**
 * User Profile API Routes
 * GET: Get current user profile
 * PUT: Update user profile (name, email, password)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import { query } from '@/lib/db/connection';
import bcrypt from 'bcryptjs';
import { sendEmail, emailTemplates } from '@/lib/email/config';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get full user data
    const result = await query(
      'SELECT id, name, email, "emailVerified", image, created_at FROM users WHERE id = $1',
      [user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = result.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: userData.emailVerified,
        image: userData.image,
        createdAt: userData.created_at,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, email, currentPassword, newPassword } = body;

    // Get current user data
    const userResult = await query('SELECT * FROM users WHERE id = $1', [user.id]);
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const currentUser = userResult.rows[0];
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Update name
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim() || null);
    }

    // Update email (requires verification)
    if (email !== undefined && email !== currentUser.email) {
      const newEmail = email.trim().toLowerCase();

      // Check if email is already taken
      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [
        newEmail,
        user.id,
      ]);

      if (emailCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Email is already in use' },
          { status: 400 }
        );
      }

      // Generate email change token
      const token = uuidv4();
      const expires = new Date();
      expires.setHours(expires.getHours() + 24); // 24 hours

      // Save email change token
      await query(
        `INSERT INTO email_change_tokens (id, user_id, new_email, token, expires)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), user.id, newEmail, token, expires]
      );

      // Send verification email
      const emailContent = emailTemplates.emailChange(currentUser.name || 'User', newEmail, token);
      const emailResult = await sendEmail(newEmail, emailContent.subject, emailContent.html, emailContent.text);
      
      if (!emailResult.success) {
        console.warn('Failed to send email change verification:', emailResult.error);
        return NextResponse.json(
          { 
            success: false, 
            error: emailResult.error === 'Email service not configured'
              ? 'Email service is not configured. Cannot send verification email.'
              : 'Failed to send verification email. Please check your email configuration.'
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Verification email sent to new address. Please verify to complete the change.',
        requiresVerification: true,
      });
    }

    // Update password
    if (newPassword !== undefined) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password is required' },
          { status: 400 }
        );
      }

      // Verify current password
      if (!currentUser.password_hash) {
        return NextResponse.json(
          { success: false, error: 'Password cannot be changed for OAuth accounts' },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, currentUser.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 8 characters' },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(hashedPassword);
    }

    // Update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      // Only updated_at was updated, nothing to change
      return NextResponse.json({
        success: true,
        message: 'No changes to apply',
      });
    }

    // Execute update
    values.push(user.id);
    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    await query(updateQuery, values);

    // Get updated user data
    const updatedResult = await query(
      'SELECT id, name, email, "emailVerified", image FROM users WHERE id = $1',
      [user.id]
    );

    return NextResponse.json({
      success: true,
      data: updatedResult.rows[0],
      message: 'Profile updated successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 500 }
    );
  }
}

