# Stripe Promotional Codes Implementation Guide

## Overview

Stripe supports promotional codes (coupons) that can be applied during checkout. This document explains how to implement promotional codes in the drum practice app.

## How Stripe Handles Promotional Codes

### 1. Creating Promotional Codes in Stripe Dashboard

1. **Create a Coupon**:
   - Go to Stripe Dashboard → Products → Coupons
   - Create a new coupon with:
     - Discount type (percentage or fixed amount)
     - Discount value
     - Duration (once, repeating, forever)
     - Redemption limits
     - Expiration date

2. **Create a Promotional Code**:
   - Go to Stripe Dashboard → Products → Promotional codes
   - Link it to the coupon
   - Set a code (e.g., "SUMMER2024", "WELCOME10")
   - Set restrictions (customer eligibility, usage limits, expiration)

### 2. Applying Promotional Codes in Checkout

There are two main approaches:

#### Option A: Customer-Entered Codes (Recommended)

Allow customers to enter promotional codes during Stripe Checkout:

```typescript
// In app/api/stripe/create-checkout/route.ts
const session = await stripe.checkout.sessions.create({
  // ... other options
  allow_promotion_codes: true, // Enable promo code input in checkout
});
```

**Pros:**
- Simple to implement (just one flag)
- Stripe handles the UI
- Customers can enter codes themselves

**Cons:**
- Less control over code validation
- Codes must be created in Stripe Dashboard

#### Option B: Pre-Applied Codes via URL Parameter

Apply promotional codes programmatically based on URL parameters or user input:

```typescript
// In app/api/stripe/create-checkout/route.ts
const session = await stripe.checkout.sessions.create({
  // ... other options
  discounts: [{
    coupon: 'SUMMER2024', // The promotional code ID
  }],
});
```

**Pros:**
- Full control over which codes are applied
- Can validate codes before checkout
- Can track code usage in your database

**Cons:**
- Requires code validation logic
- Need to handle code lookup

### 3. Implementation Example

Here's how to add promotional code support to the checkout:

```typescript
// app/api/stripe/create-checkout/route.ts
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const { priceId, customerEmail, promoCode } = await request.json();
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
  };

  // Option 1: Allow customer to enter codes
  if (!promoCode) {
    sessionConfig.allow_promotion_codes = true;
  }
  
  // Option 2: Pre-apply a specific code
  if (promoCode) {
    // Validate the promotional code exists
    try {
      const promoCodes = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
      });
      
      if (promoCodes.data.length > 0) {
        sessionConfig.discounts = [{
          promotion_code: promoCodes.data[0].id,
        }];
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      // Continue without promo code if validation fails
    }
  }

  if (customerEmail) {
    sessionConfig.customer_email = customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);
  
  return NextResponse.json({ url: session.url });
}
```

### 4. Frontend Implementation

Add a promo code input field to the pricing page:

```typescript
// app/pricing/page.tsx
const [promoCode, setPromoCode] = useState('');

const handleCheckout = async (plan: SubscriptionPlan) => {
  const response = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId: plan.stripePriceId,
      customerEmail: session?.user?.email,
      promoCode: promoCode || undefined, // Only send if provided
    }),
  });
  // ... rest of checkout logic
};
```

### 5. Validating Promotional Codes

You can create an API endpoint to validate codes before checkout:

```typescript
// app/api/stripe/validate-promo-code/route.ts
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const { code } = await request.json();
  
  try {
    const promoCodes = await stripe.promotionCodes.list({
      code: code.toUpperCase(),
      active: true,
    });
    
    if (promoCodes.data.length === 0) {
      return NextResponse.json(
        { valid: false, message: 'Invalid promotional code' },
        { status: 400 }
      );
    }
    
    const promoCode = promoCodes.data[0];
    const coupon = promoCode.coupon;
    
    return NextResponse.json({
      valid: true,
      discount: {
        type: coupon.percent_off ? 'percentage' : 'fixed',
        value: coupon.percent_off || coupon.amount_off,
        currency: coupon.currency,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { valid: false, message: 'Error validating code' },
      { status: 500 }
    );
  }
}
```

### 6. Best Practices

1. **Code Format**: Use uppercase, alphanumeric codes (e.g., "WELCOME10", "SUMMER2024")
2. **Validation**: Always validate codes server-side, never trust client input
3. **Rate Limiting**: Implement rate limiting on promo code validation endpoints
4. **Tracking**: Track which codes are used most frequently
5. **Expiration**: Set expiration dates on promotional codes
6. **Limits**: Use redemption limits to prevent abuse
7. **Testing**: Test with Stripe test mode before going live

### 7. Testing Promotional Codes

1. Create test coupons in Stripe Dashboard (test mode)
2. Create test promotional codes linked to those coupons
3. Use test card numbers during checkout
4. Verify discounts are applied correctly

### 8. Monitoring

Monitor promotional code usage in Stripe Dashboard:
- Go to Products → Promotional codes
- View redemption counts
- Check expiration dates
- Review customer eligibility

## References

- [Stripe Promotional Codes Documentation](https://stripe.com/docs/billing/subscriptions/discounts/coupons)
- [Stripe Checkout Session API](https://stripe.com/docs/api/checkout/sessions/create)
- [Stripe Coupons API](https://stripe.com/docs/api/coupons)

