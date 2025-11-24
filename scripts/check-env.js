/**
 * Check environment variables
 * Debug script to see what env vars are loaded
 */

require('dotenv').config({ path: '.env.local' });

const required = {
  'DATABASE_URL': 'PostgreSQL connection string',
  'AUTH_SECRET': 'NextAuth.js secret (32+ characters)',
  'NEXTAUTH_URL': 'Base URL of your application',
};

const optional = {
  'SMTP_HOST': 'SMTP server hostname',
  'SMTP_PORT': 'SMTP server port',
  'SMTP_USER': 'SMTP username',
  'SMTP_PASSWORD': 'SMTP password',
  'SMTP_FROM': 'Email from address',
  'GOOGLE_CLIENT_ID': 'Google OAuth client ID',
  'GOOGLE_CLIENT_SECRET': 'Google OAuth client secret',
  'GITHUB_CLIENT_ID': 'GitHub OAuth client ID',
  'GITHUB_CLIENT_SECRET': 'GitHub OAuth client secret',
  'TEST_DATABASE_URL': 'Test database connection string',
};

console.log('Environment Variables Check:');
console.log('============================\n');

console.log('REQUIRED VARIABLES:');
console.log('-------------------');
let allRequiredSet = true;
Object.entries(required).forEach(([key, description]) => {
  const value = process.env[key];
  const isSet = !!value;
  if (!isSet) allRequiredSet = false;
  
  let display = isSet ? '✅ SET' : '❌ NOT SET';
  if (key === 'AUTH_SECRET' && value) {
    display += ` (${value.length} chars)`;
    if (value.length < 32) {
      display += ' ⚠️  WARNING: Should be at least 32 characters';
      allRequiredSet = false;
    }
  } else if (key.includes('SECRET') && value) {
    display += ` (${value.substring(0, 10)}...)`;
  }
  
  console.log(`  ${key}: ${display}`);
  console.log(`    ${description}`);
});

console.log('\nOPTIONAL VARIABLES:');
console.log('-------------------');
const smtpVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
const smtpSet = smtpVars.every(key => !!process.env[key]);
Object.entries(optional).forEach(([key, description]) => {
  const value = process.env[key];
  const isSet = !!value;
  let display = isSet ? '✅ SET' : '⚪ NOT SET';
  
  if (key.includes('SECRET') && value) {
    display += ` (${value.substring(0, 10)}...)`;
  }
  
  console.log(`  ${key}: ${display}`);
  console.log(`    ${description}`);
});

if (smtpSet) {
  console.log('\n📧 Email service: ✅ CONFIGURED');
} else {
  console.log('\n📧 Email service: ⚪ NOT CONFIGURED (email features will be disabled)');
}

const oauthProviders = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  oauthProviders.push('Google');
}
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  oauthProviders.push('GitHub');
}
if (oauthProviders.length > 0) {
  console.log(`🔐 OAuth providers: ✅ ${oauthProviders.join(', ')}`);
} else {
  console.log('🔐 OAuth providers: ⚪ NONE CONFIGURED');
}

console.log('\n============================');
if (allRequiredSet) {
  console.log('✅ All required variables are set!');
  process.exit(0);
} else {
  console.log('❌ Some required variables are missing or invalid!');
  console.log('\nSee docs/ENVIRONMENT_VARIABLES.md for setup instructions.');
  process.exit(1);
}

