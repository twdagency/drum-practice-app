/**
 * API route to get admin dashboard statistics
 * GET /api/admin/stats
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

    // Get statistics
    const [usersResult, patternsResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM patterns'),
    ]);

    const totalUsers = parseInt(usersResult.rows[0]?.count || '0', 10);
    const patternsCreated = parseInt(patternsResult.rows[0]?.count || '0', 10);

    // TODO: Get subscription stats from Stripe
    // For now, return placeholder values
    const activeSubscriptions = 0;
    const totalRevenue = 0;

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      totalRevenue,
      patternsCreated,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

