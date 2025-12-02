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
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.' },
        { status: 500 }
      );
    }

    // Get authenticated user session (optional - allows checkout without sign-in)
    const session = await auth();
    const body = await request.json();
    const { priceId, trialDays, promoCode, customerEmail } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Check if price ID is a placeholder
    if (priceId.includes('placeholder') || !priceId.startsWith('price_')) {
      return NextResponse.json(
        { 
          error: 'Stripe Price IDs not configured',
          message: 'Please set STRIPE_PRICE_ID_MONTHLY and STRIPE_PRICE_ID_YEARLY in your environment variables. Get the Price IDs from your Stripe Dashboard.',
        },
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
      success_url: `${STRIPE_CONFIG.getBaseUrl()}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${STRIPE_CONFIG.getBaseUrl()}/pricing?canceled=true`,
      // Allow users to sign up during checkout
      allow_promotion_codes: true,
    };

    // If user is already logged in, use their email and add user ID to metadata
    if (session?.user?.email) {
      sessionParams.customer_email = session.user.email;
      sessionParams.metadata = {
        userId: (session.user as any).id || session.user.email || '',
        userEmail: session.user.email,
      };
    } else if (customerEmail) {
      // If email provided but not logged in, use it (they'll create account after)
      sessionParams.customer_email = customerEmail;
    }
    // If neither, Stripe will collect email during checkout

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
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create checkout session';
    if (error.type === 'StripeInvalidRequestError') {
      errorMessage = `Stripe error: ${error.message}`;
      if (error.message?.includes('No such price')) {
        errorMessage = 'Invalid price ID. Please check your Stripe Price IDs in environment variables.';
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        message: error.message || 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
