/**
 * API Route: /api/collections
 * Handles GET (list collections) and POST (create collection)
 */

import { NextRequest, NextResponse } from 'next/server';
import * as dbCollections from '@/lib/db/collections';
import { Collection } from '../storage';
import { requireAuth } from '@/lib/auth/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    const collections = await dbCollections.getAllCollections(user.id);

    return NextResponse.json({
      success: true,
      data: collections,
      count: collections.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, description, patternIds, tags } = body;

    if (!name || !Array.isArray(patternIds)) {
      return NextResponse.json(
        { success: false, error: 'Collection name and patternIds array are required' },
        { status: 400 }
      );
    }

    const collectionId = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const collection = await dbCollections.createCollection({
      id: collectionId,
      name: name.trim(),
      description: description?.trim(),
      patternIds,
      tags: tags || [],
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: collection,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create collection' },
      { status: 500 }
    );
  }
}

