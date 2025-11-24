/**
 * NextAuth.js API Route Handler
 * This route only exports HTTP handlers (GET, POST)
 * The auth function is exported from lib/auth/index.ts
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
