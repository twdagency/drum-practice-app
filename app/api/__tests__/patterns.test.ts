/**
 * API Route Tests - Patterns
 * Tests for /api/patterns endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../patterns/route';
import * as dbPatterns from '@/lib/db/patterns';
import { requireAuth } from '@/lib/auth/auth';

// Mock dependencies
vi.mock('@/lib/db/patterns');
vi.mock('@/lib/auth/auth');

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockDbPatterns = dbPatterns as any;

describe('GET /api/patterns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all patterns for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockPatterns = [
      { id: 'pattern-1', name: 'Pattern 1', userId: 'user-123', notes: ['S', 'K'] },
      { id: 'pattern-2', name: 'Pattern 2', userId: 'user-123', notes: ['H', 'S'] },
    ];

    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbPatterns.getAllPatterns.mockResolvedValue(mockPatterns);

    const request = new NextRequest('http://localhost:3000/api/patterns');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0]).not.toHaveProperty('userId'); // userId should be removed
    expect(data.count).toBe(2);
    expect(mockDbPatterns.getAllPatterns).toHaveBeenCalledWith('user-123');
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost:3000/api/patterns');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });

  it('should handle database errors', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbPatterns.getAllPatterns.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/patterns');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database error');
  });
});

describe('POST /api/patterns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new pattern', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const newPattern = {
      id: 'pattern-1',
      name: 'New Pattern',
      notes: ['S', 'K', 'S', 'K'],
    };
    const savedPattern = { ...newPattern, userId: 'user-123' };

    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbPatterns.createPattern.mockResolvedValue(savedPattern);

    const request = new NextRequest('http://localhost:3000/api/patterns', {
      method: 'POST',
      body: JSON.stringify({ pattern: newPattern }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).not.toHaveProperty('userId');
    expect(data.data.id).toBe('pattern-1');
    expect(mockDbPatterns.createPattern).toHaveBeenCalledWith(newPattern, 'user-123');
  });

  it('should return 400 if pattern data is missing', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockRequireAuth.mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost:3000/api/patterns', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Pattern data is required');
  });

  it('should return 400 if pattern ID is missing', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockRequireAuth.mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost:3000/api/patterns', {
      method: 'POST',
      body: JSON.stringify({ pattern: { name: 'Test' } }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Pattern data is required');
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost:3000/api/patterns', {
      method: 'POST',
      body: JSON.stringify({ pattern: { id: 'pattern-1', name: 'Test' } }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

