/**
 * Utility functions for admin authentication
 */

// Helper to get admin emails with fallback to manual dotenv load
export function getAdminEmails(): string[] {
  // First try Next.js env vars (should work automatically)
  let adminEmailsEnv = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  
  // If not found, try manually loading .env.local (fallback)
  if (!adminEmailsEnv && process.env.NODE_ENV === 'development') {
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(process.cwd(), '.env.local');
      
      console.log('[Admin Auth] Attempting to load .env.local from:', envPath);
      
      if (fs.existsSync(envPath)) {
        console.log('[Admin Auth] .env.local file exists');
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log('[Admin Auth] File content length:', envContent.length);
        
        // Try multiple patterns to match different formats
        const patterns = [
          /^ADMIN_EMAILS\s*=\s*(.+)$/m,           // ADMIN_EMAILS=value
          /^ADMIN_EMAILS\s*=\s*["'](.+)["']$/m,  // ADMIN_EMAILS="value" or ADMIN_EMAILS='value'
          /^ADMIN_EMAILS\s*:\s*(.+)$/m,          // ADMIN_EMAILS:value (alternative format)
        ];
        
        for (const pattern of patterns) {
          const match = envContent.match(pattern);
          if (match) {
            adminEmailsEnv = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
            console.log('[Admin Auth] ✓ Loaded ADMIN_EMAILS from .env.local manually:', adminEmailsEnv);
            break;
          }
        }
        
        if (!adminEmailsEnv) {
          // Show what we found for debugging
          const adminLine = envContent.split('\n').find(line => line.includes('ADMIN_EMAILS'));
          console.log('[Admin Auth] ✗ Could not parse ADMIN_EMAILS. Found line:', adminLine || 'none');
        }
      } else {
        console.log('[Admin Auth] ✗ .env.local file does not exist at:', envPath);
      }
    } catch (error) {
      console.error('[Admin Auth] Error loading .env.local:', error);
    }
  }
  
  if (!adminEmailsEnv) return [];
  
  return adminEmailsEnv
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);
}

/**
 * Check if a user email is an admin
 */
export function isAdminEmail(userEmail: string | null | undefined): boolean {
  if (!userEmail) return false;
  const email = userEmail.toLowerCase().trim();
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email);
}

