/**
 * Subscription database operations
 * Handles user subscription management
 */

import { query } from './connection';

export interface Subscription {
  id: number;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid';
  tier: 'free' | 'pro' | 'premium';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get subscription by user ID
 */
export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  const result = await query(
    'SELECT * FROM subscriptions WHERE user_id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) return null;
  return rowToSubscription(result.rows[0]);
}

/**
 * Get subscription by Stripe customer ID
 */
export async function getSubscriptionByCustomerId(customerId: string): Promise<Subscription | null> {
  const result = await query(
    'SELECT * FROM subscriptions WHERE stripe_customer_id = $1',
    [customerId]
  );
  
  if (result.rows.length === 0) return null;
  return rowToSubscription(result.rows[0]);
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscriptionByStripeId(subscriptionId: string): Promise<Subscription | null> {
  const result = await query(
    'SELECT * FROM subscriptions WHERE stripe_subscription_id = $1',
    [subscriptionId]
  );
  
  if (result.rows.length === 0) return null;
  return rowToSubscription(result.rows[0]);
}

/**
 * Create or update subscription
 */
export async function upsertSubscription(data: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: string;
  tier: 'free' | 'pro' | 'premium';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: Date;
}): Promise<Subscription> {
  const result = await query(`
    INSERT INTO subscriptions (
      user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
      status, tier, current_period_start, current_period_end,
      cancel_at_period_end, trial_end
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (user_id) DO UPDATE SET
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      stripe_price_id = EXCLUDED.stripe_price_id,
      status = EXCLUDED.status,
      tier = EXCLUDED.tier,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      trial_end = EXCLUDED.trial_end,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [
    data.userId,
    data.stripeCustomerId,
    data.stripeSubscriptionId,
    data.stripePriceId,
    data.status,
    data.tier,
    data.currentPeriodStart,
    data.currentPeriodEnd,
    data.cancelAtPeriodEnd || false,
    data.trialEnd || null,
  ]);
  
  return rowToSubscription(result.rows[0]);
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
  cancelAtPeriodEnd?: boolean
): Promise<Subscription | null> {
  const result = await query(`
    UPDATE subscriptions SET
      status = $2,
      cancel_at_period_end = COALESCE($3, cancel_at_period_end),
      updated_at = CURRENT_TIMESTAMP
    WHERE stripe_subscription_id = $1
    RETURNING *
  `, [stripeSubscriptionId, status, cancelAtPeriodEnd]);
  
  if (result.rows.length === 0) return null;
  return rowToSubscription(result.rows[0]);
}

/**
 * Cancel subscription (set to free tier)
 */
export async function cancelSubscription(stripeSubscriptionId: string): Promise<Subscription | null> {
  const result = await query(`
    UPDATE subscriptions SET
      status = 'canceled',
      tier = 'free',
      updated_at = CURRENT_TIMESTAMP
    WHERE stripe_subscription_id = $1
    RETURNING *
  `, [stripeSubscriptionId]);
  
  if (result.rows.length === 0) return null;
  return rowToSubscription(result.rows[0]);
}

/**
 * Extend subscription period (after successful payment)
 */
export async function extendSubscriptionPeriod(
  stripeSubscriptionId: string,
  newPeriodEnd: Date
): Promise<Subscription | null> {
  const result = await query(`
    UPDATE subscriptions SET
      current_period_end = $2,
      status = 'active',
      updated_at = CURRENT_TIMESTAMP
    WHERE stripe_subscription_id = $1
    RETURNING *
  `, [stripeSubscriptionId, newPeriodEnd]);
  
  if (result.rows.length === 0) return null;
  return rowToSubscription(result.rows[0]);
}

/**
 * Helper: Determine tier from Stripe price ID
 */
export function getTierFromPriceId(priceId: string): 'free' | 'pro' | 'premium' {
  const monthlyPro = process.env.STRIPE_PRICE_ID_MONTHLY;
  const yearlyPro = process.env.STRIPE_PRICE_ID_YEARLY;
  const monthlyPremium = process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY;
  const yearlyPremium = process.env.STRIPE_PRICE_ID_PREMIUM_YEARLY;
  
  if (priceId === monthlyPremium || priceId === yearlyPremium) {
    return 'premium';
  }
  if (priceId === monthlyPro || priceId === yearlyPro) {
    return 'pro';
  }
  return 'free';
}

// Helper to convert DB row to Subscription object
function rowToSubscription(row: any): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePriceId: row.stripe_price_id,
    status: row.status,
    tier: row.tier,
    currentPeriodStart: new Date(row.current_period_start),
    currentPeriodEnd: new Date(row.current_period_end),
    cancelAtPeriodEnd: row.cancel_at_period_end,
    trialEnd: row.trial_end ? new Date(row.trial_end) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

