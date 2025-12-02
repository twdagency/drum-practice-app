/**
 * Subscription plan definitions
 * 
 * IMPORTANT: Create these products and prices in your Stripe Dashboard first,
 * then update the stripePriceId values below with the actual Price IDs.
 * 
 * To create products in Stripe:
 * 1. Go to https://dashboard.stripe.com/products
 * 2. Create a product for "Monthly Subscription" with price £9.99/month
 * 3. Create a product for "Yearly Subscription" with price £99.99/year
 * 4. Copy the Price IDs (they start with "price_") and paste them below
 */

import { SubscriptionPlan } from './types';

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 9.99,
    currency: 'gbp',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_ID_MONTHLY || 'price_monthly_placeholder',
    features: [
      'Unlimited patterns',
      'Export patterns (MIDI, SVG, PNG, PDF)',
      'Advanced practice modes',
      'Custom pattern creation',
      'Polyrhythms',
      'Progress tracking',
      'Pattern collections',
      'API sync',
    ],
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Plan',
    price: 99.99,
    currency: 'gbp',
    interval: 'year',
    stripePriceId: process.env.STRIPE_PRICE_ID_YEARLY || 'price_yearly_placeholder',
    features: [
      'Everything in Monthly',
      'Save 17% vs monthly',
      'Priority support',
    ],
    popular: true, // Mark as popular plan
  },
};

export const FREE_TIER_LIMITS = {
  maxPatterns: 5,
  canExport: false,
  canUsePolyrhythms: false,
  canUseAdvancedModes: false,
  canCreateCustomPatterns: false,
} as const;

/**
 * Get plan by ID
 */
export function getPlan(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS[planId];
}

/**
 * Get all plans as array
 */
export function getAllPlans(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS);
}
