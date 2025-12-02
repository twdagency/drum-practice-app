/**
 * API route to create a Stripe Customer Portal session
 * 
 * POST /api/stripe/portal
 * Body: { sessionId?: string, customerId?: string, returnUrl?: string }
 * 
 * This allows users to manage their subscription, update payment methods, etc.
 * Can work with either a checkout session ID or a direct customer ID.
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

    const body = await request.json();
    const { sessionId, customerId, returnUrl } = body;
    const finalReturnUrl = returnUrl || `${STRIPE_CONFIG.getBaseUrl()}/pricing`;

    let finalCustomerId = customerId;

    // If sessionId is provided, retrieve the customer ID from the checkout session
    if (sessionId && !finalCustomerId) {
      try {
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (checkoutSession.customer) {
          // customer can be a string (customer ID) or a Customer object
          finalCustomerId = typeof checkoutSession.customer === 'string' 
            ? checkoutSession.customer 
            : checkoutSession.customer.id;
        } else {
          return NextResponse.json(
            { error: 'No customer found in checkout session. Please ensure you completed the checkout process.' },
            { status: 400 }
          );
        }
      } catch (error: any) {
        console.error('Error retrieving checkout session:', error);
        return NextResponse.json(
          { error: 'Invalid checkout session. Please try again or contact support.' },
          { status: 400 }
        );
      }
    }

    // If still no customer ID, try to get from authenticated user's database record
    if (!finalCustomerId) {
      const session = await auth();
      
      if (session?.user?.email) {
        // TODO: Look up customer ID from your database using user email
        // For now, we'll return an error asking for sessionId
        return NextResponse.json(
          { 
            error: 'Customer ID not found. Please provide a checkout session ID or ensure you have an active subscription.',
            hint: 'If you just completed checkout, the session ID should be passed automatically.'
          },
          { status: 400 }
        );
      }
    }

    if (!finalCustomerId) {
      return NextResponse.json(
        { error: 'Customer ID not found. Please ensure you have an active subscription.' },
        { status: 400 }
      );
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: finalCustomerId,
      return_url: finalReturnUrl,
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
