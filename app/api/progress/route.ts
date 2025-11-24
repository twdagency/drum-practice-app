/**
 * API Route: /api/progress
 * Handles GET (get user progress) and POST (update progress)
 */

import { NextRequest, NextResponse } from 'next/server';
import * as dbProgress from '@/lib/db/progress';
import { PracticeProgress } from '../storage';
import { requireAuth } from '@/lib/auth/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const patternId = searchParams.get('patternId');
    const practiceType = searchParams.get('practiceType') as 'midi' | 'microphone' | 'recording' | null;

    const progress = await dbProgress.getUserProgress(user.id, {
      patternId: patternId ? Number(patternId) : undefined,
      practiceType: practiceType || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        progress,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { patternId, practiceType, accuracy, timing, notes, totalTime } = body;

    if (patternId === undefined || !practiceType) {
      return NextResponse.json(
        { success: false, error: 'patternId and practiceType are required' },
        { status: 400 }
      );
    }

    const progressData = await dbProgress.saveProgress({
      userId: user.id,
      patternId: Number(patternId),
      practiceType,
      accuracy,
      timing,
      notes,
      totalTime,
    });

    return NextResponse.json({
      success: true,
      data: progressData,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save progress' },
      { status: 500 }
    );
  }
}

