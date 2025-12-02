/**
 * API route to create a Stripe Checkout session for subscriptions
 * 
 * POST /api/stripe/create-checkout
 * Body: { priceId: string, customerEmail?: string, trialDays?: number, promoCode?: string }
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
    const { priceId, trialDays, promoCode } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Build checkout session parameters
    const sessionParams: any = {
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: session.user.email,
      success_url: `${STRIPE_CONFIG.getBaseUrl()}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${STRIPE_CONFIG.getBaseUrl()}/pricing?canceled=true`,
      metadata: {
        userId: (session.user as any).id || session.user.email || '',
      },
    };

    // Add trial period if specified
    if (trialDays && trialDays > 0) {
      sessionParams.subscription_data = {
        trial_period_days: trialDays,
      };
    }

    // Add promo code if provided
    if (promoCode) {
      sessionParams.discounts = [
        {
          coupon: promoCode,
        },
      ];
    }

    // Create the checkout session
    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    // Return the session URL to redirect the user
    return NextResponse.json({ 
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
