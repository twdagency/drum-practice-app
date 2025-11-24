/**
 * API Route: /api/patterns
 * Handles GET (list all patterns) and POST (create new pattern)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pattern } from '@/types/pattern';
import * as dbPatterns from '@/lib/db/patterns';
import { requireAuth } from '@/lib/auth/auth';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await requireAuth();
    
    const patterns = await dbPatterns.getAllPatterns(user.id);
    
    // Convert to response format (remove userId from response)
    const responsePatterns = patterns.map(({ userId: _, ...pattern }) => pattern);

    return NextResponse.json({
      success: true,
      data: responsePatterns,
      count: responsePatterns.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error fetching patterns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patterns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await requireAuth();
    
    const body = await request.json();
    const { pattern } = body;

    if (!pattern || !pattern.id) {
      return NextResponse.json(
        { success: false, error: 'Pattern data is required' },
        { status: 400 }
      );
    }

    const saved = await dbPatterns.createPattern(pattern, user.id);
    
    // Remove userId from response
    const { userId: _, ...responsePattern } = saved;

    return NextResponse.json({
      success: true,
      data: responsePattern,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error saving pattern:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save pattern' },
      { status: 500 }
    );
  }
}

