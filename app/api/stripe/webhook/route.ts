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
import {
  upsertSubscription,
  updateSubscriptionStatus,
  cancelSubscription,
  extendSubscriptionPeriod,
  getTierFromPriceId,
} from '@/lib/db/subscriptions';
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
        
        console.log('Checkout session completed:', session.id);
        
        // Get user ID from session metadata
        const userId = session.metadata?.userId;
        if (!userId) {
          console.error('No userId in session metadata');
          break;
        }
        
        // Get subscription details
        if (session.subscription && session.customer) {
          const subscriptionId = typeof session.subscription === 'string' 
            ? session.subscription 
            : session.subscription.id;
          const customerId = typeof session.customer === 'string'
            ? session.customer
            : session.customer.id;
          
          // Fetch full subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id || '';
          
          await upsertSubscription({
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            status: subscription.status,
            tier: getTierFromPriceId(priceId),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
          });
          
          console.log('Subscription created for user:', userId);
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);
        // Usually handled by checkout.session.completed
        // This event is useful for subscriptions created outside checkout
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);
        
        await updateSubscriptionStatus(
          subscription.id,
          subscription.status,
          subscription.cancel_at_period_end
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log('Subscription deleted:', subscription.id);
        
        await cancelSubscription(subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log('Invoice payment succeeded:', invoice.id);
        
        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription.id;
          
          // Get updated subscription from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          await extendSubscriptionPeriod(
            subscriptionId,
            new Date(subscription.current_period_end * 1000)
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log('Invoice payment failed:', invoice.id);
        
        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription.id;
          
          await updateSubscriptionStatus(subscriptionId, 'past_due');
          
          // TODO: Send email notification to user about failed payment
          // Could use lib/email/config.ts sendEmail function
        }
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log('Trial will end:', subscription.id);
        console.log('Trial end date:', new Date(subscription.trial_end! * 1000));
        
        // TODO: Send email notification to user about trial ending
        // Could use lib/email/config.ts sendEmail function
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
