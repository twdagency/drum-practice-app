# Production Deployment Guide

## Overview

This guide covers deploying the Drum Practice Generator application to production.

## Pre-Deployment Checklist

### 1. Environment Variables

Ensure all required environment variables are set in your production environment:

#### Database
```env
DATABASE_URL=postgresql://user:password@host:5432/drum_practice
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

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required variables from the checklist above

4. **Configure Database**:
   - Vercel supports PostgreSQL via integrations
   - Or use external database (AWS RDS, Supabase, etc.)

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

