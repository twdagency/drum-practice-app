# Environment Variables Reference

## Required Variables

### Database
```env
DATABASE_URL=postgresql://user:password@host:5432/database_name
```
- **Description**: PostgreSQL connection string
- **Required**: Yes
- **Example**: `postgresql://postgres:password@localhost:5432/drum_practice`

### Authentication
```env
AUTH_SECRET=your-secret-key-here
```
- **Description**: Secret key for NextAuth.js session encryption
- **Required**: Yes
- **Generate**: `openssl rand -base64 32`
- **Note**: Must be at least 32 characters

```env
NEXTAUTH_URL=http://localhost:3000
```
- **Description**: Base URL of your application
- **Required**: Yes
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

## Optional Variables

### Email Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=support@drumpractice.co.uk
```
- **Description**: SMTP server configuration for sending emails
- **Required**: No (email features will be disabled if not set)
- **Note**: For Gmail, use an App Password, not your regular password

### OAuth Providers

#### Google OAuth
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```
- **Description**: Google OAuth credentials
- **Required**: No
- **Setup**: [Google Cloud Console](https://console.cloud.google.com/)

#### GitHub OAuth
```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```
- **Description**: GitHub OAuth credentials
- **Required**: No
- **Setup**: [GitHub Developer Settings](https://github.com/settings/developers)

### Test Database (Optional)
```env
TEST_DATABASE_URL=postgresql://user:password@host:5432/test_database
```
- **Description**: Separate database for running tests
- **Required**: No (uses DATABASE_URL with _test suffix if not set)

## Environment-Specific Files

### `.env.local` (Development)
- Used for local development
- Should be in `.gitignore`
- Contains sensitive credentials

### `.env.production` (Production)
- Used in production builds
- Should be set in your deployment platform
- Never commit to Git

### `.env.example` (Template)
- Template file showing required variables
- Safe to commit to Git
- Remove actual values

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use strong secrets** for AUTH_SECRET (32+ characters)
3. **Rotate secrets regularly** in production
4. **Use different credentials** for development and production
5. **Store secrets securely** using your platform's secrets management

## Verification

Check that all required variables are set:
```bash
node scripts/check-env.js
```

## Troubleshooting

### Missing Variables
- Check `.env.local` exists and is in the project root
- Verify variable names match exactly (case-sensitive)
- Restart dev server after adding variables

### Database Connection Issues
- Verify DATABASE_URL format is correct
- Check database is running and accessible
- Test connection: `npm run db:test`

### Authentication Issues
- Ensure AUTH_SECRET is set and at least 32 characters
- Verify NEXTAUTH_URL matches your actual URL
- Check OAuth redirect URLs are configured correctly

