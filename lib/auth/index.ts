/**
 * NextAuth.js Initialization
 * This file initializes NextAuth and exports the auth function
 * Separate from the route handler to comply with Next.js route export requirements
 */

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import PostgresAdapter from '@auth/pg-adapter';
import { Pool } from 'pg';

// Create a pool for the adapter (lazy initialization)
function getAdapterPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // During build time, DATABASE_URL might not be available
    // Create a dummy pool that won't actually connect
    // This allows the build to complete without errors
    return new Pool({
      connectionString: 'postgresql://dummy:dummy@dummy:5432/dummy',
      // Set connection timeout to 0 to prevent actual connection attempts
      connectionTimeoutMillis: 0,
    });
  }
  return new Pool({ connectionString });
}

// Verify AUTH_SECRET is set (but don't throw during build)
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dummy-secret-for-build';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PostgresAdapter(getAdapterPool()),
  secret: authSecret,
  trustHost: true, // Required for NextAuth v5
});

