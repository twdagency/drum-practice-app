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
    // Check database connection first
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. DATABASE_URL is missing.' },
        { status: 500 }
      );
    }
    
    // Debug: Log connection string info (masked) in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Signup API] DATABASE_URL length:', databaseUrl.length);
      console.log('[Signup API] DATABASE_URL (first 100 chars):', JSON.stringify(databaseUrl.substring(0, 100)));
      console.log('[Signup API] Contains @:', databaseUrl.includes('@'));
      console.log('[Signup API] Contains supabase:', databaseUrl.includes('supabase'));
      
      // Check if URL seems truncated
      if (!databaseUrl.includes('@')) {
        console.error('[Signup API] ERROR: DATABASE_URL is truncated - missing @');
        console.error('[Signup API] Full value (JSON):', JSON.stringify(databaseUrl));
        return NextResponse.json(
          { 
            success: false, 
            error: 'Database configuration error: DATABASE_URL appears to be incomplete. Please check your .env.local file.',
            details: process.env.NODE_ENV === 'development' ? `URL length: ${databaseUrl.length}, first 50 chars: ${databaseUrl.substring(0, 50)}` : undefined
          },
          { status: 500 }
        );
      }
    }

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

    // Check if user already exists (with timeout handling)
    let existing;
    try {
      existing = await Promise.race([
        query('SELECT id FROM users WHERE email = $1', [email]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 8000)
        )
      ]) as any;
    } catch (error: any) {
      console.error('Error checking existing user:', error);
      if (error.message === 'Database query timeout') {
        return NextResponse.json(
          { success: false, error: 'Database connection timeout. Please try again.' },
          { status: 503 }
        );
      }
      throw error;
    }
    
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user (with timeout handling)
    const userId = uuidv4();
    try {
      await Promise.race([
        query(
          `INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [userId, email, name || null, passwordHash]
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 8000)
        )
      ]);
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.message === 'Database query timeout') {
        return NextResponse.json(
          { success: false, error: 'Database connection timeout. Please try again.' },
          { status: 503 }
        );
      }
      throw error;
    }

    // Generate verification token
    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours

    // Save verification token (with timeout handling)
    try {
      await Promise.race([
        query(
          `INSERT INTO verification_tokens (identifier, token, expires)
           VALUES ($1, $2, $3)`,
          [email, token, expires]
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 8000)
        )
      ]);
    } catch (error: any) {
      console.error('Error saving verification token:', error);
      // Don't fail signup if token save fails - user can request verification email later
      if (error.message !== 'Database query timeout') {
        console.warn('Failed to save verification token, but user was created');
      }
    }

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
  } catch (error: any) {
    console.error('Signup error:', error);
    const errorMessage = error?.message || 'Failed to create user';
    const errorDetails = process.env.NODE_ENV === 'development' ? error?.stack : undefined;
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}

