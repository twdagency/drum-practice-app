/**
 * API route to get all subscriptions (admin only)
 * GET /api/admin/subscriptions
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe/config';
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

    // Get subscriptions from Stripe
    if (!stripe) {
      return NextResponse.json({
        subscriptions: [],
        message: 'Stripe not configured',
      });
    }

    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ['data.customer', 'data.items.data.price.product'],
    });

    const formattedSubscriptions = subscriptions.data.map((sub) => {
      const customer = sub.customer as any;
      const price = sub.items.data[0]?.price;
      const product = price?.product as any;

      return {
        id: sub.id,
        customerEmail: customer?.email || 'Unknown',
        status: sub.status,
        planName: product?.name || 'Unknown Plan',
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        amount: (price?.unit_amount || 0) / 100, // Convert from cents
      };
    });

    return NextResponse.json({ subscriptions: formattedSubscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

