/**
 * API Route Tests - Authentication Signup
 * Tests for /api/auth/signup endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../auth/signup/route';
import { query } from '@/lib/db/connection';
import { sendEmail } from '@/lib/email/config';
import bcrypt from 'bcryptjs';

// Mock dependencies
vi.mock('@/lib/db/connection');
vi.mock('@/lib/email/config');
vi.mock('bcryptjs');

const mockQuery = query as ReturnType<typeof vi.fn>;
const mockSendEmail = sendEmail as ReturnType<typeof vi.fn>;
const mockBcrypt = bcrypt as any;

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    // Mock: user doesn't exist
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // Mock: password hash
    mockBcrypt.hash.mockResolvedValue('hashed-password');
    // Mock: user creation
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // Mock: verification token creation
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // Mock: email sending
    mockSendEmail.mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.email).toBe('test@example.com');
    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(mockQuery).toHaveBeenCalledTimes(3); // Check user, create user, create token
  });

  it('should return 400 if email is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ password: 'password123' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });

  it('should return 400 if password is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });

  it('should return 400 if password is too short', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'short',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('8 characters');
  });

  it('should return 409 if user already exists', async () => {
    // Mock: user exists
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'password123',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toContain('already exists');
  });

  it('should still succeed if email sending fails', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    mockQuery.mockResolvedValueOnce({ rows: [] }); // User doesn't exist
    mockBcrypt.hash.mockResolvedValue('hashed-password');
    mockQuery.mockResolvedValueOnce({ rows: [] }); // User created
    mockQuery.mockResolvedValueOnce({ rows: [] }); // Token created
    mockSendEmail.mockResolvedValue({ success: false, error: 'Email failed' }); // Email fails

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    const response = await POST(request);
    const data = await response.json();

    // Should still succeed even if email fails
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});

