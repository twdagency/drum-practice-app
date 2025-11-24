# Production Deployment Guide

## Overview

This guide covers deploying the Drum Practice Generator application to production.

**Important**: This application requires **two separate services**:
- **Supabase** (or another PostgreSQL database) - for data storage
- **Vercel** (or another hosting service) - for hosting the Next.js application

These services work together: your Next.js app (hosted on Vercel) connects to your database (on Supabase).

## Quick Answers

**Q: What connection string do I need?**  
A: A PostgreSQL connection string from Supabase. Get it from: Supabase Dashboard → Settings → Database → Connection string (use "Connection pooling" for Vercel).

**Q: Do I still need Vercel?**  
A: **Yes!** Supabase is only the database. You still need Vercel (or another hosting service) to host your Next.js application. They work together:
- Supabase = Database (stores your data)
- Vercel = Web server (serves your app to users)

## Pre-Deployment Checklist

### 1. Environment Variables

Ensure all required environment variables are set in your production environment:

#### Database Connection String

The `DATABASE_URL` must be a PostgreSQL connection string in this format:
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**For Supabase:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Find the **Connection string** section
4. Copy the **Connection pooling** string (recommended for serverless) or **Direct connection** string
5. The format will look like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
   or for direct connection:
   ```
   postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
   ```

**Important Notes:**
- Use **Connection pooling** for Vercel/serverless deployments (port 6543)
- Use **Direct connection** for traditional servers (port 5432)
- Replace `[password]` with your actual database password
- The connection string should NOT include `?sslmode=require` - Supabase handles SSL automatically

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

#### Authentication
```env
AUTH_SECRET=your-secret-key-here (generate with: openssl rand -base64 32)
NEXTAUTH_URL=https://your-domain.com
```

#### Email (SMTP)
```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=support@drumpractice.co.uk
```

#### OAuth Providers (Optional)
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 2. Database Setup

1. **Create Production Database**:
   ```bash
   npm run db:create
   ```

2. **Run Schema Migrations**:
   ```bash
   npm run db:setup
   npm run db:auth
   npm run db:auth-migrations
   ```

3. **Verify Database Connection**:
   ```bash
   npm run db:test
   ```

### 3. Build the Application

```bash
npm run build
```

This will:
- Type-check all TypeScript files
- Optimize and bundle the application
- Generate static assets
- Create production-ready Next.js build

### 4. Test Production Build Locally

```bash
npm run build
npm start
```

Visit `http://localhost:3000` and verify:
- ✅ Application loads correctly
- ✅ Authentication works
- ✅ Database connections work
- ✅ API routes respond correctly
- ✅ No console errors

## Deployment Architecture

**You need BOTH services:**

1. **Supabase** (Database):
   - Hosts your PostgreSQL database
   - Stores all application data (patterns, collections, progress, users)
   - Provides the `DATABASE_URL` connection string

2. **Vercel** (Application Hosting):
   - Hosts your Next.js application
   - Serves the web app to users
   - Connects to Supabase using the `DATABASE_URL`

**Why both?**
- Supabase = Database only (data storage)
- Vercel = Application hosting (web server)
- They are separate services that work together

## Deployment Options

### Option 1: Supabase + Vercel (Recommended)

This is the recommended setup for production.

#### Step 1: Set Up Supabase Database

1. **Get your Supabase connection string**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to **Settings** → **Database**
   - Copy the **Connection pooling** string (for serverless/Vercel)
   - Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

2. **Set up database tables**:
   ```bash
   # Set DATABASE_URL in .env.local first
   npm run db:setup-supabase
   ```
   This will create all required tables on your Supabase database.

#### Step 2: Deploy to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   Or use the automated script:
   ```bash
   npm run deploy:full
   ```

3. **Set Environment Variables in Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Add all required variables:
     - `DATABASE_URL` (your Supabase connection string)
     - `AUTH_SECRET`
     - `NEXTAUTH_URL` (your Vercel domain, e.g., `https://your-app.vercel.app`)
     - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
     - OAuth credentials (if using)

4. **Redeploy** after adding environment variables:
   - Vercel will automatically redeploy when you add environment variables
   - Or trigger manually: `vercel --prod`

#### Alternative: Use Vercel's Supabase Integration

1. In Vercel Dashboard → Your Project → **Integrations**
2. Add **Supabase** integration
3. This automatically adds `DATABASE_URL` and other Supabase variables
4. You still need to run `npm run db:setup-supabase` to create tables

### Option 2: Docker

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine AS base

   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package.json package-lock.json ./
   RUN npm ci

   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build

   # Production image, copy all the files and run next
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   CMD ["node", "server.js"]
   ```

2. **Update next.config.js** for standalone output:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     reactStrictMode: true,
     output: 'standalone',
   }
   module.exports = nextConfig
   ```

3. **Build and Run**:
   ```bash
   docker build -t drum-practice-app .
   docker run -p 3000:3000 --env-file .env.production drum-practice-app
   ```

### Option 3: Traditional Server (VPS/Dedicated)

1. **Server Requirements**:
   - Node.js 18+
   - PostgreSQL 12+
   - PM2 (for process management)
   - Nginx (for reverse proxy)

2. **Setup Steps**:
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd drum-practice-app

   # Install dependencies
   npm ci --production

   # Build application
   npm run build

   # Start with PM2
   pm2 start npm --name "drum-practice" -- start
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Post-Deployment

### 1. SSL Certificate

Use Let's Encrypt for free SSL:
```bash
sudo certbot --nginx -d your-domain.com
```

### 2. Monitoring

Set up monitoring for:
- Application errors
- Database performance
- API response times
- User authentication issues

### 3. Backup Strategy

- **Database Backups**: Set up automated PostgreSQL backups
- **Code Backups**: Use Git for version control
- **Environment Variables**: Store securely (use secrets management)

### 4. Performance Optimization

- Enable Next.js Image Optimization
- Configure CDN for static assets
- Set up caching headers
- Monitor bundle sizes

## Security Checklist

- [ ] All environment variables are set and secure
- [ ] Database credentials are strong and rotated regularly
- [ ] AUTH_SECRET is a strong random string
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is in place
- [ ] Input validation on all API routes
- [ ] SQL injection protection (using parameterized queries)
- [ ] XSS protection (React handles this, but verify)
- [ ] CSRF protection (NextAuth.js handles this)

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify DATABASE_URL is correct
   - Check firewall rules
   - Ensure database is accessible from deployment server

2. **Authentication Not Working**:
   - Verify AUTH_SECRET is set
   - Check NEXTAUTH_URL matches your domain
   - Ensure OAuth redirect URLs are configured

3. **Email Not Sending**:
   - Verify SMTP credentials
   - Check SMTP_FROM matches server requirements
   - Test SMTP connection

4. **Build Failures**:
   - Check Node.js version (requires 18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

## Performance Tips

1. **Enable Next.js Standalone Output** (for Docker):
   ```javascript
   // next.config.js
   output: 'standalone'
   ```

2. **Optimize Images**:
   - Use Next.js Image component
   - Configure image domains

3. **Database Connection Pooling**:
   - Already configured in `lib/db/connection.ts`
   - Adjust pool size based on traffic

4. **Caching**:
   - Use Next.js caching strategies
   - Implement API response caching where appropriate

## Support

For deployment issues, check:
- Next.js Deployment Documentation
- Vercel Documentation (if using Vercel)
- PostgreSQL Documentation
- NextAuth.js Documentation

