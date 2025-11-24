# Vercel Deployment Guide

This guide will walk you through deploying the Drum Practice Generator to Vercel.

## Prerequisites

- ✅ Supabase database set up and running
- ✅ All environment variables ready
- ✅ Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

Or use npx (no installation needed):
```bash
npx vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate with Vercel.

## Step 3: Deploy to Vercel

### Option A: Quick Deploy (Recommended for first time)

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account or team
- **Link to existing project?** → No (for first deployment)
- **What's your project's name?** → `drum-practice-app` (or your preferred name)
- **In which directory is your code located?** → `./` (current directory)

This will create a **preview deployment**. To deploy to production, run:
```bash
vercel --prod
```

### Option B: Deploy to Production Directly

```bash
vercel --prod
```

## Step 4: Set Environment Variables

After deployment, you **must** add all environment variables in the Vercel dashboard:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable for **Production**, **Preview**, and **Development**:

### Required Variables

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-app.vercel.app
```

### Email Configuration (Required for email features)

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=support@drumpractice.co.uk
```

### OAuth Providers (Optional)

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Important Notes:

- **DATABASE_URL**: Use the **Connection pooling** string from Supabase (port 6543) for serverless/Vercel
- **NEXTAUTH_URL**: Set this to your Vercel domain (e.g., `https://drum-practice-app.vercel.app`)
- **AUTH_SECRET**: Generate a secure random string:
  ```bash
  openssl rand -base64 32
  ```
- Add variables to **all environments** (Production, Preview, Development) unless you want different values

## Step 5: Redeploy After Adding Environment Variables

After adding environment variables, Vercel will automatically trigger a new deployment. If it doesn't:

1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**

Or trigger manually:
```bash
vercel --prod
```

## Step 6: Update OAuth Redirect URLs

If you're using OAuth (Google, GitHub), update the redirect URLs:

### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client
4. Add to **Authorized redirect URIs**:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

### GitHub OAuth:
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Select your OAuth App
3. Update **Authorization callback URL**:
   ```
   https://your-app.vercel.app/api/auth/callback/github
   ```

## Step 7: Verify Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Test the following:
   - ✅ Application loads
   - ✅ Sign up / Sign in works
   - ✅ Database connection works (create a pattern)
   - ✅ Email verification (if configured)
   - ✅ OAuth login (if configured)

## Continuous Deployment

Vercel automatically deploys when you push to your Git repository:

1. **Connect your Git repository** (if not already connected):
   - Go to **Settings** → **Git**
   - Connect your repository

2. **Automatic deployments**:
   - Push to `main`/`master` → Production deployment
   - Push to other branches → Preview deployment
   - Pull requests → Preview deployment

## Troubleshooting

### Build Fails

**Error: Module not found**
- Check that all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: TypeScript errors**
- Fix TypeScript errors locally first
- Run `npm run build` locally to test

### Database Connection Errors

**Error: Connection refused**
- Verify `DATABASE_URL` is correct in Vercel
- Use **Connection pooling** string (port 6543) for Supabase
- Check Supabase firewall settings (should allow all IPs for serverless)

**Error: Authentication failed**
- Verify database password is correct
- Check connection string format

### Authentication Not Working

**Error: AUTH_SECRET is missing**
- Add `AUTH_SECRET` to Vercel environment variables
- Redeploy after adding

**Error: Invalid redirect URL**
- Update `NEXTAUTH_URL` to match your Vercel domain
- Update OAuth provider redirect URLs

### Email Not Sending

- Verify all SMTP variables are set in Vercel
- Check SMTP credentials are correct
- Test SMTP connection locally first

## Environment-Specific Configuration

You can set different values for different environments:

- **Production**: Your live site
- **Preview**: Branch deployments and PRs
- **Development**: Local development (when using `vercel dev`)

To set environment-specific variables:
1. Go to **Settings** → **Environment Variables**
2. When adding a variable, select which environments it applies to

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` to your custom domain
5. Update OAuth redirect URLs

## Monitoring

Vercel provides built-in monitoring:
- **Deployments**: View all deployments and their status
- **Analytics**: View traffic and performance metrics
- **Logs**: View function logs and errors

Access via the Vercel dashboard.

## Next Steps

After successful deployment:
1. ✅ Test all features thoroughly
2. ✅ Set up monitoring and alerts
3. ✅ Configure custom domain (if desired)
4. ✅ Set up database backups (Supabase handles this automatically)
5. ✅ Review security settings

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)

