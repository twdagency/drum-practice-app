/**
 * API Route Tests - Collections
 * Tests for /api/collections endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../collections/route';
import * as dbCollections from '@/lib/db/collections';
import { requireAuth } from '@/lib/auth/auth';

// Mock dependencies
vi.mock('@/lib/db/collections');
vi.mock('@/lib/auth/auth');

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockDbCollections = dbCollections as any;

describe('GET /api/collections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all collections for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockCollections = [
      { id: 'col-1', name: 'Collection 1', userId: 'user-123', patternIds: ['p1', 'p2'] },
      { id: 'col-2', name: 'Collection 2', userId: 'user-123', patternIds: ['p3'] },
    ];

    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbCollections.getAllCollections.mockResolvedValue(mockCollections);

    const request = new NextRequest('http://localhost:3000/api/collections');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.count).toBe(2);
    expect(mockDbCollections.getAllCollections).toHaveBeenCalledWith('user-123');
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost:3000/api/collections');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

describe('POST /api/collections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new collection', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const newCollection = {
      name: 'New Collection',
      description: 'Test description',
      patternIds: ['p1', 'p2'],
      tags: ['test'],
    };
    const savedCollection = {
      id: 'col-123',
      ...newCollection,
      userId: 'user-123',
    };

    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbCollections.createCollection.mockResolvedValue(savedCollection);

    const request = new NextRequest('http://localhost:3000/api/collections', {
      method: 'POST',
      body: JSON.stringify(newCollection),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('New Collection');
    expect(mockDbCollections.createCollection).toHaveBeenCalled();
  });

  it('should return 400 if name is missing', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockRequireAuth.mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost:3000/api/collections', {
      method: 'POST',
      body: JSON.stringify({ patternIds: ['p1'] }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });

  it('should return 400 if patternIds is not an array', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockRequireAuth.mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost:3000/api/collections', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', patternIds: 'not-an-array' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});

