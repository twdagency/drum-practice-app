/**
 * API Route Tests - Pattern by ID
 * Tests for /api/patterns/[id] endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../patterns/[id]/route';
import * as dbPatterns from '@/lib/db/patterns';
import { requireAuth } from '@/lib/auth/auth';

// Mock dependencies
vi.mock('@/lib/db/patterns');
vi.mock('@/lib/auth/auth');

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockDbPatterns = dbPatterns as any;

describe('GET /api/patterns/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a pattern if user owns it', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockPattern = {
      id: 'pattern-1',
      name: 'Test Pattern',
      userId: 'user-123',
      notes: ['S', 'K'],
    };

    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbPatterns.getPatternById.mockResolvedValue(mockPattern);

    const request = new NextRequest('http://localhost:3000/api/patterns/pattern-1');
    const response = await GET(request, { params: { id: 'pattern-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).not.toHaveProperty('userId');
    expect(data.data.id).toBe('pattern-1');
  });

  it('should return 404 if pattern not found', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbPatterns.getPatternById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/patterns/pattern-1');
    const response = await GET(request, { params: { id: 'pattern-1' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Pattern not found');
  });

  it('should return 403 if user does not own pattern', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockPattern = {
      id: 'pattern-1',
      name: 'Test Pattern',
      userId: 'other-user',
      notes: ['S', 'K'],
    };

    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbPatterns.getPatternById.mockResolvedValue(mockPattern);

    const request = new NextRequest('http://localhost:3000/api/patterns/pattern-1');
    const response = await GET(request, { params: { id: 'pattern-1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });
});

describe('PUT /api/patterns/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update a pattern if user owns it', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const existingPattern = {
      id: 'pattern-1',
      name: 'Old Name',
      userId: 'user-123',
      notes: ['S', 'K'],
    };
    const updatedPattern = {
      id: 'pattern-1',
      name: 'New Name',
      userId: 'user-123',
      notes: ['S', 'K', 'S'],
    };

    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbPatterns.getPatternById.mockResolvedValue(existingPattern);
    mockDbPatterns.updatePattern.mockResolvedValue(updatedPattern);

    const request = new NextRequest('http://localhost:3000/api/patterns/pattern-1', {
      method: 'PUT',
      body: JSON.stringify({ pattern: updatedPattern }),
    });
    const response = await PUT(request, { params: { id: 'pattern-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('New Name');
    expect(mockDbPatterns.updatePattern).toHaveBeenCalledWith('pattern-1', updatedPattern, 'user-123');
  });

  it('should return 403 if user does not own pattern', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const existingPattern = {
      id: 'pattern-1',
      name: 'Test Pattern',
      userId: 'other-user',
      notes: ['S', 'K'],
    };

    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbPatterns.getPatternById.mockResolvedValue(existingPattern);

    const request = new NextRequest('http://localhost:3000/api/patterns/pattern-1', {
      method: 'PUT',
      body: JSON.stringify({ pattern: { ...existingPattern, name: 'New Name' } }),
    });
    const response = await PUT(request, { params: { id: 'pattern-1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });
});

describe('DELETE /api/patterns/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a pattern if user owns it', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const existingPattern = {
      id: 'pattern-1',
      name: 'Test Pattern',
      userId: 'user-123',
      notes: ['S', 'K'],
    };

    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbPatterns.getPatternById.mockResolvedValue(existingPattern);
    mockDbPatterns.deletePattern.mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/patterns/pattern-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'pattern-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockDbPatterns.deletePattern).toHaveBeenCalledWith('pattern-1', 'user-123');
  });

  it('should return 403 if user does not own pattern', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const existingPattern = {
      id: 'pattern-1',
      name: 'Test Pattern',
      userId: 'other-user',
      notes: ['S', 'K'],
    };

    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbPatterns.getPatternById.mockResolvedValue(existingPattern);

    const request = new NextRequest('http://localhost:3000/api/patterns/pattern-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'pattern-1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });
});

