/**
 * Signup API Route
 * Creates a new user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail, emailTemplates } from '@/lib/email/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    await query(
      `INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, email, name || null, passwordHash]
    );

    // Generate verification token
    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours

    // Save verification token
    await query(
      `INSERT INTO verification_tokens (identifier, token, expires)
       VALUES ($1, $2, $3)`,
      [email, token, expires]
    );

    // Send verification email (non-blocking)
    const emailContent = emailTemplates.verification(name || 'User', token);
    const emailResult = await sendEmail(email, emailContent.subject, emailContent.html, emailContent.text);
    
    if (!emailResult.success) {
      console.warn('Failed to send verification email. User can resend from profile settings.');
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully. Please check your email to verify your account.',
      data: { id: userId, email, name },
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

