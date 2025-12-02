/**
 * Stripe webhook handler
 * 
 * This endpoint receives events from Stripe about subscription changes
 * 
 * IMPORTANT: Configure this URL in your Stripe Dashboard:
 * https://dashboard.stripe.com/webhooks
 * 
 * For local testing, use Stripe CLI:
 * stripe listen --forward-to localhost:3000/api/stripe/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import Stripe from 'stripe';

// Disable body parsing, we need the raw body for webhook signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Subscription was successfully created
        // TODO: Update your database with the subscription
        console.log('Checkout session completed:', session.id);
        console.log('Customer:', session.customer);
        console.log('Subscription:', session.subscription);
        
        // You should:
        // 1. Get the user ID from session.metadata.userId
        // 2. Store the customer ID and subscription ID in your database
        // 3. Update user's subscription tier
        
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // New subscription created
        console.log('Subscription created:', subscription.id);
        console.log('Customer:', subscription.customer);
        console.log('Status:', subscription.status);
        
        // TODO: Update database with new subscription
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Subscription updated (plan changed, status changed, etc.)
        console.log('Subscription updated:', subscription.id);
        console.log('Status:', subscription.status);
        console.log('Cancel at period end:', subscription.cancel_at_period_end);
        
        // TODO: Update database with subscription changes
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Subscription canceled
        console.log('Subscription deleted:', subscription.id);
        
        // TODO: Update database - set user to free tier
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Payment succeeded (renewal or initial payment)
        console.log('Invoice payment succeeded:', invoice.id);
        console.log('Subscription:', invoice.subscription);
        
        // TODO: Update database - extend subscription period
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Payment failed
        console.log('Invoice payment failed:', invoice.id);
        console.log('Subscription:', invoice.subscription);
        
        // TODO: Update database - mark subscription as past_due
        // TODO: Send email notification to user
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Trial ending soon
        console.log('Trial will end:', subscription.id);
        console.log('Trial end:', new Date(subscription.trial_end! * 1000));
        
        // TODO: Send email notification to user
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
