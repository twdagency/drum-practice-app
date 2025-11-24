# Authentication Setup Guide

This guide explains how to set up the complete authentication system including email verification, password reset, and OAuth providers.

## Features

✅ **User Registration & Login**
- Email/password authentication
- OAuth providers (Google, GitHub)
- Email verification
- Password reset functionality
- User profile management

## Environment Variables

Add these to your `.env.local` file:

### Required
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/drum_practice_app

# NextAuth
AUTH_SECRET=your-secret-key-here # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000 # Your app URL
```

### Email Configuration (Required for email features)

Choose one option:

#### Option 1: Gmail SMTP
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password # Use App Password, not regular password
SMTP_FROM=your-email@gmail.com
```

#### Option 2: Other SMTP Provider
```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@your-domain.com
```

**Note:** For development, if SMTP is not configured, the app will use a test email service (ethereal.email).

### OAuth Providers (Optional)

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Add to `.env.local`:
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Add to `.env.local`:
```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**Note:** For production, update the callback URLs to your production domain.

## Database Setup

1. **Run main database setup:**
   ```bash
   npm run db:create
   npm run db:setup
   ```

2. **Run authentication tables:**
   ```bash
   npm run db:auth
   ```

3. **Run authentication migrations (password reset, email change):**
   ```bash
   npm run db:auth-migrations
   ```

## Features Overview

### Email Verification
- New users receive a verification email upon signup
- Users can resend verification emails from profile settings
- OAuth users have their email automatically verified

### Password Reset
- Users can request password reset from sign-in modal
- Reset link expires after 1 hour
- Secure token-based reset process

### User Profile Management
- Update name
- Change email (requires verification of new email)
- Change password (requires current password)
- View email verification status

### OAuth Providers
- Sign in with Google
- Sign in with GitHub
- Accounts are automatically linked if same email

## API Routes

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/profile` - Get user profile (GET) or update (PUT)
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/verify-email-change` - Verify email change

## Pages

- `/auth/reset-password?token=...` - Password reset page
- `/auth/verify-email?token=...` - Email verification page

## Security Features

- Passwords are hashed with bcrypt (10 rounds)
- Password reset tokens expire after 1 hour
- Email verification tokens expire after 24 hours
- Email change requires verification
- OAuth tokens are securely stored
- Session-based authentication with JWT

## Testing Email in Development

If you don't have SMTP configured, the app uses ethereal.email for testing. Check the console logs for test email credentials.

## Troubleshooting

### Email not sending
- Check SMTP credentials in `.env.local`
- Verify SMTP port and security settings
- Check firewall/network restrictions
- For Gmail, ensure you're using an App Password, not your regular password

### OAuth not working
- Verify callback URLs match exactly
- Check client ID and secret are correct
- Ensure OAuth app is properly configured in provider console
- Check browser console for errors

### Database errors
- Ensure all migrations have been run
- Check database connection string
- Verify PostgreSQL is running

## Next Steps

After setup:
1. Test signup and email verification
2. Test password reset flow
3. Test OAuth providers (if configured)
4. Update production environment variables
5. Set up proper email service for production (SendGrid, AWS SES, etc.)

