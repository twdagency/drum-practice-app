# Stripe Integration Setup Guide

This guide will walk you through setting up Stripe Checkout for subscriptions in your drum practice app.

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Environment variables configured
- Database ready for storing subscription data

## Step 1: Install Dependencies

The Stripe package should already be installed. If not:

```bash
npm install stripe
```

## Step 2: Create Products and Prices in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Click "Add product"

### Monthly Subscription
- **Name**: Monthly Plan
- **Description**: Monthly subscription to Drum Practice App
- **Pricing**: 
  - Type: Recurring
  - Price: £9.99
  - Billing period: Monthly
- Click "Save product"
- **Copy the Price ID** (starts with `price_...`)

### Yearly Subscription
- **Name**: Yearly Plan
- **Description**: Yearly subscription to Drum Practice App
- **Pricing**:
  - Type: Recurring
  - Price: £99.99
  - Billing period: Yearly
- Click "Save product"
- **Copy the Price ID** (starts with `price_...`)

## Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...  # Get from https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Get from https://dashboard.stripe.com/apikeys

# Stripe Price IDs (from Step 2)
STRIPE_PRICE_ID_MONTHLY=price_...  # Monthly plan price ID
STRIPE_PRICE_ID_YEARLY=price_...   # Yearly plan price ID

# Stripe Webhook Secret (see Step 5)
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your production URL
```

### Getting Your Stripe Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy the **Secret key** (starts with `sk_test_...` for test mode)
3. Copy the **Publishable key** (starts with `pk_test_...` for test mode)

**Important**: Use test keys during development. Switch to live keys when going to production.

## Step 4: Update Price IDs in Code

Edit `lib/stripe/plans.ts` and ensure the price IDs match your environment variables:

```typescript
stripePriceId: process.env.STRIPE_PRICE_ID_MONTHLY || 'price_monthly_placeholder',
```

The code will automatically use the environment variables, but you can also hardcode them for testing.

## Step 5: Set Up Webhooks

### For Local Development

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_...`) and add it to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### For Production

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_...`) and add it to your production environment variables

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/pricing

3. Click "Subscribe" on a plan

4. You'll be redirected to Stripe Checkout (test mode)

5. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any postal code

6. Complete the checkout

7. You should be redirected to `/pricing/success`

## Step 7: Implement Database Integration

The webhook handler currently logs events but doesn't update your database. You need to:

1. **Store customer ID**: When `checkout.session.completed` is received, store the `customer` ID in your database linked to the user
2. **Update subscription status**: Handle all subscription events to keep your database in sync
3. **Implement subscription checks**: Create middleware/utilities to check user subscription status

### Example Database Update (in webhook handler):

```typescript
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session;
  
  // Get user ID from metadata
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  
  // Update your database
  await updateUserSubscription({
    userId,
    customerId,
    subscriptionId,
    tier: 'monthly', // or 'yearly' - determine from price ID
    status: 'active',
  });
  
  break;
}
```

## Step 8: Add Subscription Status Check

Create a utility to check subscription status:

```typescript
// lib/subscription/checkSubscription.ts
import { auth } from '@/lib/auth';

export async function getUserSubscription() {
  const session = await auth();
  if (!session?.user) return null;
  
  // Query your database for user's subscription
  // Return subscription tier, status, expiration date, etc.
}
```

## Step 9: Protect Routes with Middleware

Create `middleware.ts` in the root to protect premium routes:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  
  // Check if route requires subscription
  if (request.nextUrl.pathname.startsWith('/premium-feature')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check subscription status
    const subscription = await getUserSubscription();
    if (!subscription || subscription.tier === 'free') {
      return NextResponse.redirect(new URL('/pricing', request.url));
    }
  }
  
  return NextResponse.next();
}
```

## Step 10: Going Live

1. **Switch to Live Mode** in Stripe Dashboard
2. **Update environment variables** with live keys:
   - `STRIPE_SECRET_KEY` → Live secret key (starts with `sk_live_...`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Live publishable key (starts with `pk_live_...`)
3. **Create live products and prices** in Stripe Dashboard
4. **Update price IDs** in environment variables
5. **Set up production webhook** endpoint
6. **Test with real payment** (use a small amount first!)

## Troubleshooting

### Webhook signature verification fails
- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
- For local testing, use the secret from `stripe listen` command
- For production, use the secret from Stripe Dashboard webhook settings

### Checkout redirects fail
- Check `NEXT_PUBLIC_APP_URL` is set correctly
- Ensure success/cancel URLs match your domain

### Customer portal doesn't work
- You need to store the Stripe customer ID in your database
- Pass the customer ID when creating portal session

### Subscription status not updating
- Check webhook events are being received (Stripe Dashboard → Webhooks → View logs)
- Verify webhook handler is updating your database
- Check database connection and queries

## Next Steps

1. Implement database schema for subscriptions (see `SUBSCRIPTION_AND_LANDING_PAGE_PLAN.md`)
2. Create subscription status API endpoint
3. Add subscription checks to feature gates
4. Implement free tier limitations
5. Add subscription management UI
6. Set up email notifications for subscription events

## Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Stripe Testing](https://stripe.com/docs/testing)
