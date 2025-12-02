/**
 * API route to create a Stripe Customer Portal session
 * 
 * POST /api/stripe/portal
 * Body: { returnUrl?: string }
 * 
 * This allows users to manage their subscription, update payment methods, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const returnUrl = body.returnUrl || `${STRIPE_CONFIG.getBaseUrl()}/pricing`;

    // TODO: Get customer ID from your database
    // For now, we'll need to look up the customer by email or store customer ID in database
    // This is a placeholder - you'll need to implement customer lookup
    const customerId = body.customerId;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID not found. Please ensure you have an active subscription.' },
        { status: 400 }
      );
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create portal session',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
