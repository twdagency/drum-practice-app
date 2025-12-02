/**
 * API route to retrieve checkout session details
 * 
 * GET /api/stripe/checkout-session?sessionId=xxx
 * Returns customer email and other session details
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';

export async function GET(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Extract customer email
    let email = session.customer_email;
    
    // If customer is an object, get email from there
    if (!email && session.customer && typeof session.customer === 'object') {
      email = (session.customer as any).email;
    }

    // If still no email, try to get from customer_details
    if (!email && session.customer_details) {
      email = session.customer_details.email || null;
    }

    return NextResponse.json({
      email,
      customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      subscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
    });
  } catch (error: any) {
    console.error('Error retrieving checkout session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve checkout session',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
