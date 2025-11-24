/**
 * API Route Tests - Progress
 * Tests for /api/progress endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../progress/route';
import * as dbProgress from '@/lib/db/progress';
import { requireAuth } from '@/lib/auth/auth';

// Mock dependencies
vi.mock('@/lib/db/progress');
vi.mock('@/lib/auth/auth');

const mockRequireAuth = requireAuth as ReturnType<typeof vi.fn>;
const mockDbProgress = dbProgress as any;

describe('GET /api/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return progress for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockProgress = [
      {
        id: 'progress-1',
        userId: 'user-123',
        patternId: 1,
        practiceType: 'midi',
        accuracy: 85,
        timing: 90,
      },
    ];

    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbProgress.getUserProgress.mockResolvedValue(mockProgress);

    const request = new NextRequest('http://localhost:3000/api/progress');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.userId).toBe('user-123');
    expect(data.data.progress).toHaveLength(1);
    expect(mockDbProgress.getUserProgress).toHaveBeenCalledWith('user-123', {});
  });

  it('should filter by patternId if provided', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockProgress = [];

    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbProgress.getUserProgress.mockResolvedValue(mockProgress);

    const request = new NextRequest('http://localhost:3000/api/progress?patternId=1');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockDbProgress.getUserProgress).toHaveBeenCalledWith('user-123', {
      patternId: 1,
    });
  });

  it('should filter by practiceType if provided', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbProgress.getUserProgress.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/progress?practiceType=midi');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockDbProgress.getUserProgress).toHaveBeenCalledWith('user-123', {
      practiceType: 'midi',
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost:3000/api/progress');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

describe('POST /api/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save progress for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const progressData = {
      patternId: 1,
      practiceType: 'midi' as const,
      accuracy: 85,
      timing: 90,
      totalTime: 300,
    };
    const savedProgress = {
      id: 'progress-1',
      userId: 'user-123',
      ...progressData,
    };

    mockRequireAuth.mockResolvedValue(mockUser);
    mockDbProgress.saveProgress.mockResolvedValue(savedProgress);

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.patternId).toBe(1);
    expect(mockDbProgress.saveProgress).toHaveBeenCalledWith({
      userId: 'user-123',
      ...progressData,
    });
  });

  it('should return 400 if patternId is missing', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockRequireAuth.mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify({ practiceType: 'midi' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });

  it('should return 400 if practiceType is missing', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockRequireAuth.mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify({ patternId: 1 }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify({ patternId: 1, practiceType: 'midi' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

