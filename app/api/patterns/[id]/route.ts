/**
 * API Route: /api/patterns/[id]
 * Handles GET (get pattern), PUT (update pattern), DELETE (delete pattern)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pattern } from '@/types/pattern';
import * as dbPatterns from '@/lib/db/patterns';
import { StoredPattern } from '../storage';
import { requireAuth } from '@/lib/auth/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;
    const patternData = await dbPatterns.getPatternById(id);

    if (!patternData) {
      return NextResponse.json(
        { success: false, error: 'Pattern not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (patternData.userId && patternData.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { userId: _, ...pattern } = patternData;

    return NextResponse.json({
      success: true,
      data: pattern,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error fetching pattern:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pattern' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;
    const body = await request.json();
    const { pattern } = body;

    const existing = await dbPatterns.getPatternById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Pattern not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (existing.userId && existing.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updated = await dbPatterns.updatePattern(id, pattern, user.id);
    
    const { userId: _, ...patternResponse } = updated;

    return NextResponse.json({
      success: true,
      data: patternResponse,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error updating pattern:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update pattern' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;

    const existing = await dbPatterns.getPatternById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Pattern not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (existing.userId && existing.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbPatterns.deletePattern(id, user.id);

    return NextResponse.json({
      success: true,
      message: 'Pattern deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error deleting pattern:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete pattern' },
      { status: 500 }
    );
  }
}

