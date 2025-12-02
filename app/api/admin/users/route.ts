/**
 * API route to get all users (admin only)
 * GET /api/admin/users
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db/connection';
import { isAdminEmail } from '@/lib/utils/adminAuth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = isAdminEmail(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all users
    const result = await query(
      `SELECT id, email, name, created_at, "emailVerified"
       FROM users
       ORDER BY created_at DESC
       LIMIT 1000`
    );

    const users = result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      emailVerified: !!row.emailVerified,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

