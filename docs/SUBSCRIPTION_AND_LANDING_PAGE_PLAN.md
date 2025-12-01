# Subscription and Landing Page Implementation Plan

## Overview

Build a complete subscription system with a public landing page, Stripe payment integration, free tier with limited features, toggleable free trial, promo codes, and an admin dashboard for managing users and promotions.

## Architecture

### Pricing Tiers

- **Free Tier**: Limited functionality (e.g., 5 patterns, basic features)
- **Monthly**: £9.99/month
- **Yearly**: ~£99.99/year (save ~17% - typical yearly discount)
- **Free Trial**: Configurable (default 7-14 days, toggleable via admin)

### Tech Stack

- **Payments**: Stripe (subscriptions, promo codes, webhooks)
- **Auth**: NextAuth (already implemented)
- **Database**: PostgreSQL (extend existing schema)
- **Middleware**: Next.js middleware for route protection

## Implementation Phases

### Phase 1: Database Schema Extensions

**File**: `lib/db/subscription-schema.sql` (new)

Create tables:

- `subscriptions` - User subscription records
- `promo_codes` - Discount codes
- `promo_code_usage` - Track code usage per user
- `subscription_history` - Audit trail
- `feature_flags` - Admin-configurable settings (free trial toggle, etc.)

**File**: `lib/db/migrations/add-subscription-tables.sql` (new)

Migration script to add subscription columns to existing `users` table:

- `subscription_tier` (free, monthly, yearly)
- `trial_ends_at` (nullable)
- `is_admin` (boolean)

### Phase 2: Stripe Integration Setup

**Files to create**:

- `lib/stripe/config.ts` - Stripe client initialization
- `lib/stripe/types.ts` - TypeScript types for Stripe data
- `lib/stripe/plans.ts` - Subscription plan definitions

**Environment variables** (add to `.env.local`):

```env
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
```

### Phase 3: Landing Page

**File**: `app/landing/page.tsx` (new)

Features:

- Hero section with value proposition
- Feature highlights (3-4 key features)
- Pricing table (Free, Monthly, Yearly)
- Testimonials section (optional, can be added later)
- CTA buttons (Start Free Trial / Sign Up)
- Footer with links

**File**: `app/landing/components/PricingCard.tsx` (new)

- Reusable pricing card component
- Shows price, features, CTA button
- Highlights "Popular" plan

**File**: `app/landing/components/FeatureSection.tsx` (new)

- Feature grid/list component
- Icons and descriptions

### Phase 4: Subscription API Routes

**File**: `app/api/stripe/create-checkout/route.ts` (new)

- Create Stripe checkout session
- Handle promo code application
- Set trial period if enabled
- Redirect to Stripe hosted checkout

**File**: `app/api/stripe/webhook/route.ts` (new)

- Handle Stripe webhook events:
  - `checkout.session.completed` - Subscription created
  - `customer.subscription.updated` - Plan changed
  - `customer.subscription.deleted` - Cancelled
  - `invoice.payment_succeeded` - Renewal
  - `invoice.payment_failed` - Payment issue
- Update database accordingly

**File**: `app/api/stripe/cancel/route.ts` (new)

- Cancel subscription (set to cancel at period end)
- Update database

**File**: `app/api/stripe/portal/route.ts` (new)

- Create Stripe customer portal session
- Allow users to manage subscription, update payment method

**File**: `app/api/subscription/status/route.ts` (new)

- Get current user's subscription status
- Return tier, trial info, expiration dates

**File**: `app/api/promo/validate/route.ts` (new)

- Validate promo code
- Return discount info
- Check usage limits

### Phase 5: Route Protection Middleware

**File**: `middleware.ts` (new, root level)

Logic:

- Check authentication (NextAuth session)
- Check subscription status
- Allow free tier access to limited routes
- Redirect to pricing if subscription required
- Allow public routes (landing, login, pricing)
- Protect admin routes (role check)

**Protected routes**:

- `/` (main app) - Requires subscription or free tier
- `/admin/*` - Requires admin role

**Public routes**:

- `/landing`
- `/login`
- `/pricing`
- `/auth/*`

### Phase 6: Free Tier Feature Restrictions

**File**: `lib/subscription/features.ts` (new)

Feature flags based on tier:

- `max_patterns` - Free: 5, Paid: unlimited
- `export_patterns` - Free: false, Paid: true
- `advanced_practice_modes` - Free: limited, Paid: all
- `custom_patterns` - Free: false, Paid: true
- `progress_tracking` - Free: basic, Paid: advanced

**File**: `hooks/useSubscription.ts` (new)

- React hook to check subscription status
- Returns tier, features available, trial info
- Updates on subscription changes

**File**: `components/shared/SubscriptionGate.tsx` (new)

- Wrapper component to hide/disable features for free tier
- Shows upgrade prompt

### Phase 7: Pricing Page

**File**: `app/pricing/page.tsx` (new)

- Detailed pricing comparison
- Feature comparison table
- FAQ section
- CTA buttons to checkout

### Phase 8: Promo Code System

**File**: `app/api/promo/create/route.ts` (new, admin only)

- Create new promo codes
- Set discount type (percentage/fixed)
- Set usage limits
- Set validity dates

**File**: `app/api/promo/list/route.ts` (new, admin only)

- List all promo codes
- Include usage statistics

**File**: `app/api/promo/update/route.ts` (new, admin only)

- Update promo code (activate/deactivate)
- Modify limits

**File**: `components/checkout/PromoCodeInput.tsx` (new)

- Input field for promo code
- Validation and discount display
- Apply to checkout

### Phase 9: Admin Dashboard

**File**: `app/admin/layout.tsx` (new)

- Admin layout wrapper
- Check admin role
- Navigation sidebar

**File**: `app/admin/page.tsx` (new)

- Dashboard overview
- Key metrics (active subscriptions, revenue, users)
- Recent activity

**File**: `app/admin/users/page.tsx` (new)

- User management table
- Filter by subscription status
- View user details
- Manually grant/revoke subscriptions (for support)

**File**: `app/admin/promos/page.tsx` (new)

- Promo code management
- Create/edit/delete codes
- View usage statistics
- Activate/deactivate codes

**File**: `app/admin/settings/page.tsx` (new)

- Feature flags:
  - Toggle free trial on/off
  - Set trial duration
  - Configure free tier limits
- System settings

**File**: `components/admin/UserTable.tsx` (new)

- Data table component for users
- Search, filter, pagination

**File**: `components/admin/PromoCodeForm.tsx` (new)

- Form to create/edit promo codes
- Validation

### Phase 10: UI Updates

**File**: `app/page.tsx` (modify)

- Add subscription status check
- Show upgrade prompts for free tier
- Display subscription info in header

**File**: `components/shared/SubscriptionBanner.tsx` (new)

- Banner for free tier users
- Trial countdown
- Upgrade CTA

**File**: `components/shared/SubscriptionMenu.tsx` (new)

- Dropdown menu in header
- Show current plan
- Link to manage subscription (Stripe portal)
- Upgrade/downgrade options

### Phase 11: Free Trial Logic

**File**: `lib/subscription/trial.ts` (new)

- Check if trial is enabled (feature flag)
- Calculate trial end date
- Check if user is in trial period
- Handle trial expiration

**File**: `app/api/subscription/start-trial/route.ts` (new)

- Start free trial for new users
- Set trial_ends_at in database
- Grant full access during trial

### Phase 12: Testing & Documentation

**Files to create**:

- `docs/SUBSCRIPTION_SETUP.md` - Stripe setup guide
- `docs/ADMIN_GUIDE.md` - Admin dashboard usage
- `docs/FREE_TIER_FEATURES.md` - Feature comparison

**Test scenarios**:

- Free tier limitations
- Subscription checkout flow
- Promo code application
- Trial period logic
- Webhook handling
- Admin access control

## Database Schema Details

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL, -- active, canceled, past_due, trialing, etc.
  plan_id TEXT NOT NULL, -- monthly, yearly
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Promo Codes Table

```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL, -- percentage, fixed_amount
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  active BOOLEAN DEFAULT true,
  applies_to TEXT[], -- ['monthly', 'yearly'] or ['all']
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Feature Flags Table

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by TEXT REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Key Implementation Notes

1. **Stripe Setup**: Create products and prices in Stripe dashboard first, then use price IDs in code
2. **Webhook Security**: Verify webhook signatures using Stripe webhook secret
3. **Trial Logic**: Check feature flag before granting trial, respect trial_ends_at
4. **Free Tier**: Implement feature gates throughout the app using `useSubscription` hook
5. **Admin Access**: Add `is_admin` check to all admin routes
6. **Error Handling**: Graceful handling of Stripe API failures, webhook retries
7. **Testing**: Test with Stripe test mode before going live

## Environment Variables Required

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...

# Feature Flags (can be in DB, but env for initial setup)
NEXT_PUBLIC_FREE_TRIAL_ENABLED=true
NEXT_PUBLIC_FREE_TRIAL_DAYS=7
NEXT_PUBLIC_FREE_TIER_MAX_PATTERNS=5
```

## Migration Path

1. Run database migrations
2. Set up Stripe account and products
3. Deploy with free tier enabled
4. Test subscription flow
5. Enable free trial (via admin panel)
6. Monitor and adjust pricing as needed

