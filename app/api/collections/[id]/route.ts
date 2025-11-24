/**
 * API Route: /api/collections/[id]
 * Handles GET, PUT, DELETE for individual collections
 */

import { NextRequest, NextResponse } from 'next/server';
import * as dbCollections from '@/lib/db/collections';
import { Collection } from '../storage';
import { requireAuth } from '@/lib/auth/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;
    const collection = await dbCollections.getCollectionById(id);

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (collection.userId && collection.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: collection,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection' },
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
    const { name, description, patternIds, tags } = body;

    const existing = await dbCollections.getCollectionById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
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

    const updated = await dbCollections.updateCollection(id, {
      name: name !== undefined ? name.trim() : undefined,
      description: description !== undefined ? description?.trim() : undefined,
      patternIds: patternIds !== undefined ? patternIds : undefined,
      tags: tags !== undefined ? tags : undefined,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error updating collection:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update collection' },
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

    const existing = await dbCollections.getCollectionById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
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

    await dbCollections.deleteCollection(id, user.id);

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete collection' },
      { status: 500 }
    );
  }
}

