/**
 * NextAuth.js Initialization
 * This file initializes NextAuth and exports the auth function
 * Separate from the route handler to comply with Next.js route export requirements
 */

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import PostgresAdapter from '@auth/pg-adapter';
import { Pool } from 'pg';

// Create a pool for the adapter
function getAdapterPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  return new Pool({ connectionString });
}

// Verify AUTH_SECRET is set
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (!authSecret) {
  console.error('⚠️ AUTH_SECRET is not set in environment variables');
  console.error('Please add AUTH_SECRET to your .env.local file');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PostgresAdapter(getAdapterPool()),
  secret: authSecret,
  trustHost: true, // Required for NextAuth v5
});

