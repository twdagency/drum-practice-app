/**
 * API route to get subscription plans with Price IDs
 * 
 * GET /api/stripe/plans
 * Returns plans with actual Stripe Price IDs from environment variables
 */

import { NextResponse } from 'next/server';
import { getAllPlans } from '@/lib/stripe/plans';

export async function GET() {
  try {
    // Get plans - this will use environment variables on the server side
    const plans = getAllPlans();
    
    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
