/**
 * Stripe configuration and client initialization
 */

import Stripe from 'stripe';

// Only initialize Stripe if the secret key is available
// This allows the build to succeed even if env vars aren't set yet
// The API routes will check for the key at runtime
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : null;

export const STRIPE_CONFIG = {
  // Get publishable key from environment
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  
  // Webhook secret for verifying webhook signatures
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // Base URL for redirects (will be set dynamically based on environment)
  getBaseUrl: () => {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return 'http://localhost:3000';
  },
} as const;
