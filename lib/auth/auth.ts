/**
 * Server-side authentication utilities
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function getSession() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
}
