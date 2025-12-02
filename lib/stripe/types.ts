/**
 * TypeScript types for Stripe integration
 */

export type SubscriptionTier = 'free' | 'monthly' | 'yearly';

export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'past_due' 
  | 'trialing' 
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId: string;
  stripeProductId?: string;
  features: string[];
  popular?: boolean;
}

export interface CheckoutSessionData {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  trialDays?: number;
  promoCode?: string;
}

export interface PortalSessionData {
  customerId: string;
  returnUrl: string;
}
