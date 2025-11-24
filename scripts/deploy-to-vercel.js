/**
 * Quick Deployment Helper for Vercel
 * 
 * This script helps prepare for Vercel deployment by:
 * 1. Checking required environment variables
 * 2. Verifying build works
 * 3. Providing deployment instructions
 * 
 * Usage: node scripts/deploy-to-vercel.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Vercel Deployment Preparation\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found!');
  console.error('   Please create .env.local with your environment variables.');
  process.exit(1);
}

// Load environment variables
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
const requiredVars = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'NEXTAUTH_URL'
];

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const match = trimmed.match(/^([^=]+)=(.+)$/);
  if (match) {
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[match[1].trim()] = value;
  }
});

// Check required variables
console.log('📋 Checking environment variables...\n');
let allPresent = true;

requiredVars.forEach(varName => {
  if (envVars[varName]) {
    const displayValue = varName === 'DATABASE_URL' 
      ? envVars[varName].replace(/:[^:@]+@/, ':****@')
      : varName === 'AUTH_SECRET'
      ? '****' + envVars[varName].slice(-4)
      : envVars[varName];
    console.log(`   ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`   ❌ ${varName}: MISSING`);
    allPresent = false;
  }
});

if (!allPresent) {
  console.error('\n❌ Missing required environment variables!');
  console.error('   Please add them to .env.local before deploying.\n');
  process.exit(1);
}

// Check optional variables
console.log('\n📧 Optional variables:');
const optionalVars = ['SMTP_HOST', 'SMTP_USER', 'GOOGLE_CLIENT_ID', 'GITHUB_CLIENT_ID'];
optionalVars.forEach(varName => {
  if (envVars[varName]) {
    console.log(`   ✅ ${varName}: Set`);
  } else {
    console.log(`   ⚠️  ${varName}: Not set (optional)`);
  }
});

// Check if Vercel CLI is installed
console.log('\n🔍 Checking Vercel CLI...');
try {
  execSync('vercel --version', { stdio: 'ignore' });
  console.log('   ✅ Vercel CLI is installed\n');
} catch (error) {
  console.log('   ⚠️  Vercel CLI not found');
  console.log('   Install with: npm i -g vercel\n');
}

// Check if build works
console.log('🔨 Testing build...');
try {
  console.log('   Running: npm run build');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n   ✅ Build successful!\n');
} catch (error) {
  console.error('\n   ❌ Build failed!');
  console.error('   Please fix build errors before deploying.\n');
  process.exit(1);
}

// Deployment instructions
console.log('📝 Next Steps:\n');
console.log('1. Login to Vercel:');
console.log('   vercel login\n');
console.log('2. Deploy to preview:');
console.log('   vercel\n');
console.log('3. Deploy to production:');
console.log('   vercel --prod\n');
console.log('4. Add environment variables in Vercel Dashboard:');
console.log('   - Go to: https://vercel.com/dashboard');
console.log('   - Select your project');
console.log('   - Settings → Environment Variables');
console.log('   - Add all variables from .env.local\n');
console.log('5. Update NEXTAUTH_URL:');
console.log('   - After deployment, update NEXTAUTH_URL to your Vercel domain');
console.log('   - Example: https://your-app.vercel.app\n');
console.log('6. Update OAuth redirect URLs (if using OAuth):');
console.log('   - Google: https://your-app.vercel.app/api/auth/callback/google');
console.log('   - GitHub: https://your-app.vercel.app/api/auth/callback/github\n');
console.log('📚 Full guide: docs/VERCEL_DEPLOYMENT.md\n');

