# Setup Guide

Complete setup guide for the Drum Practice App covering database, authentication, and payments.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Configure environment variables (see sections below)

# 4. Set up database
npm run db:create
npm run db:setup
npm run db:auth

# 5. Run development server
npm run dev
```

---

## Environment Variables

Create a `.env.local` file with these variables:

```env
# ===================
# DATABASE
# ===================
DATABASE_URL=postgresql://postgres:password@localhost:5432/drum_practice_app

# ===================
# AUTHENTICATION
# ===================
AUTH_SECRET=your-secret-key-here  # Generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Email (for verification/password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Gmail App Password
SMTP_FROM=your-email@gmail.com

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# ===================
# STRIPE PAYMENTS
# ===================
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database Setup

### Prerequisites
- PostgreSQL installed and running

### Steps

1. **Configure DATABASE_URL** in `.env.local`:
   ```
   postgresql://username:password@localhost:5432/drum_practice_app
   ```

2. **Run setup scripts**:
   ```bash
   npm run db:create   # Create database
   npm run db:setup    # Create tables
   npm run db:auth     # Auth tables
   ```

3. **Verify setup**:
   ```bash
   npm run db:test
   ```

### Troubleshooting

**Connection Error:**
```bash
# Check PostgreSQL is running
# Windows:
Get-Service postgresql*
# Mac/Linux:
sudo systemctl status postgresql
```

**Permission Error:**
```sql
GRANT ALL PRIVILEGES ON DATABASE drum_practice_app TO your_username;
```

---

## Authentication Setup

### Features
- Email/password registration & login
- OAuth (Google, GitHub)
- Email verification
- Password reset

### Required Setup

1. **Generate AUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```

2. **Configure SMTP** for email features (see environment variables above)

3. **Run auth migrations**:
   ```bash
   npm run db:auth
   npm run db:auth-migrations
   ```

### OAuth Setup (Optional)

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret to `.env.local`

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`

---

## Stripe Setup

### Prerequisites
- [Stripe account](https://stripe.com)

### Steps

1. **Get API keys** from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Copy Secret key (`sk_test_...`)
   - Copy Publishable key (`pk_test_...`)

2. **Create products** in [Stripe Products](https://dashboard.stripe.com/products):
   
   **Monthly Plan:**
   - Price: £9.99/month (recurring)
   - Copy Price ID (`price_...`)
   
   **Yearly Plan:**
   - Price: £99.99/year (recurring)
   - Copy Price ID (`price_...`)

3. **Set up webhooks**:

   **Local development:**
   ```bash
   # Install Stripe CLI
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   # Copy the whsec_... secret
   ```

   **Production:**
   - Add webhook endpoint: `https://your-domain.com/api/stripe/webhook`
   - Subscribe to events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

### Testing

Use test card: `4242 4242 4242 4242` (any future date, any CVC)

---

## Database Tables

### Core Tables
- `patterns` - User drum patterns
- `collections` - Pattern collections
- `progress` - Practice progress

### Auth Tables
- `users` - User accounts
- `accounts` - OAuth provider accounts
- `sessions` - Active sessions
- `verification_tokens` - Email verification
- `password_reset_tokens` - Password reset

### Subscription Tables
- `subscriptions` - User subscriptions
- `promo_codes` - Discount codes

---

## NPM Scripts

```bash
# Development
npm run dev              # Start dev server

# Database
npm run db:create        # Create database
npm run db:setup         # Run migrations
npm run db:auth          # Auth tables
npm run db:test          # Test connection

# Testing
npm test                 # Run tests
npm run test:ui          # Tests with UI
npm run test:coverage    # Coverage report

# Production
npm run build            # Build for production
npm start                # Start production server

# Deployment
npm run deploy:vercel    # Deploy to Vercel
npm run deploy:vercel:prod  # Deploy to production
```

---

## Production Checklist

- [ ] Use production database (not localhost)
- [ ] Set `NEXTAUTH_URL` to production URL
- [ ] Use live Stripe keys (not test)
- [ ] Configure production webhook URL in Stripe
- [ ] Set up proper SMTP for emails
- [ ] Update OAuth callback URLs for production domain

