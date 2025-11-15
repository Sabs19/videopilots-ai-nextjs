# Production Deployment Guide

This guide covers everything you need to deploy VideoPilots AI to production.

## Pre-Deployment Checklist

### 1. Environment Variables

Ensure all required environment variables are set in your deployment platform (Coolify, Vercel, Railway, etc.):

**Required:**

- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Generate with: `openssl rand -base64 32` (256 bits of entropy, cryptographically secure, production-ready)
- `AUTH_URL` - Your production URL (e.g., `https://yourdomain.com`)
- `NODE_ENV` - Set to `production`

**Optional but Recommended:**

- `OPENAI_API_KEY` - For AI-powered course generation
- `NEXT_PUBLIC_YOUTUBE_API_KEY` - For YouTube video search

See `COOLIFY_ENV_VARS.md` for complete details.

### 2. Database Setup

1. **Create PostgreSQL database** on your hosting provider
2. **Run migrations:**
   ```bash
   npm run db:migrate
   ```
   Or set `DATABASE_URL` and run:
   ```bash
   DATABASE_URL=your-connection-string npm run db:migrate
   ```

### 3. Build and Test

```bash
# Validate environment variables
npm run validate-env

# Type check
npm run type-check

# Build for production
npm run build

# Test production build locally
npm start
```

## Deployment Steps

### For Coolify

1. **Connect Repository:**

   - Repository: `videopilots-ai-nextjs`
   - Branch: `main`
   - Build Pack: `Nixpacks`
   - Base Directory: `/`
   - Port: `3000`
   - Static site: **Unchecked**

2. **Set Environment Variables:**

   - Enable **both** "Available at Buildtime" and "Available at Runtime" for all variables
   - See `COOLIFY_ENV_VARS.md` for the complete list

3. **Deploy:**

   - Click "Deploy" and wait for build to complete
   - Check build logs for any errors

4. **Post-Deployment:**
   - Run database migrations if not done automatically
   - Test health endpoint: `https://yourdomain.com/api/health`
   - Verify application is accessible

### For Other Platforms

#### Vercel

```bash
vercel --prod
```

#### Railway

- Connect GitHub repository
- Add PostgreSQL service
- Set environment variables
- Deploy automatically

#### Render

- Create new Web Service
- Connect repository
- Add PostgreSQL database
- Set environment variables
- Deploy

## Health Check

The application includes a health check endpoint at `/api/health` that returns:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "responseTime": 5,
  "version": "0.1.0"
}
```

Use this endpoint for:

- Load balancer health checks
- Monitoring and alerting
- Kubernetes liveness/readiness probes

## Production Optimizations

### Already Implemented

✅ **Security Headers** - Comprehensive security headers in `next.config.ts`
✅ **Database Connection Pooling** - Optimized pool settings for production
✅ **Error Boundaries** - Graceful error handling with `error.tsx` and `not-found.tsx`
✅ **Environment Validation** - Automatic validation on startup
✅ **Structured Logging** - Production-ready logging utility
✅ **Health Check Endpoint** - `/api/health` for monitoring
✅ **Image Optimization** - Next.js image optimization configured
✅ **Package Import Optimization** - Reduced bundle size

### Recommended Additions

1. **Error Monitoring:**

   - Add Sentry or similar service
   - Update `app/error.tsx` to send errors to monitoring service

2. **Rate Limiting:**

   - Consider adding rate limiting for API routes
   - Use middleware or a service like Upstash

3. **Caching:**

   - Implement Redis for session storage (optional)
   - Add caching for YouTube API responses

4. **CDN:**
   - Use a CDN for static assets
   - Configure custom domain with SSL

## Monitoring

### Key Metrics to Monitor

1. **Application Health:**

   - `/api/health` endpoint response time
   - Database connection status
   - Error rates

2. **Performance:**

   - API response times
   - Database query performance
   - Build and deployment times

3. **Usage:**
   - Active users
   - Learning paths created
   - API usage (YouTube, OpenAI)

## Troubleshooting

### Build Failures

1. **Missing Environment Variables:**

   - Check that all required variables are set
   - Verify they're available at buildtime

2. **Type Errors:**

   - Run `npm run type-check` locally
   - Fix any TypeScript errors

3. **Database Connection:**
   - Verify `DATABASE_URL` is correct
   - Check database is accessible from deployment platform
   - Ensure SSL is configured if required

### Runtime Errors

1. **Check Logs:**

   - Review application logs in your hosting platform
   - Look for error messages

2. **Health Check:**

   - Visit `/api/health` to see application status
   - Check database connection status

3. **Environment Variables:**
   - Verify all variables are set correctly
   - Check for typos in variable names

## Security Checklist

- [x] Security headers configured
- [x] AUTH_SECRET is at least 32 characters (256 bits of entropy with `openssl rand -base64 32`)
- [x] Database uses SSL in production
- [x] Environment variables not exposed to client (except NEXT*PUBLIC*\*)
- [x] Error messages don't expose sensitive information
- [ ] SSL/TLS certificate configured
- [ ] Rate limiting implemented (recommended)
- [ ] Error monitoring configured (recommended)

### AUTH_SECRET Security

**Why `openssl rand -base64 32` is production-ready:**

- ✅ **Cryptographically Secure**: Uses OpenSSL's CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)
- ✅ **256 Bits of Entropy**: Provides 32 bytes (256 bits) of entropy - industry standard for secrets
- ✅ **OS Entropy Source**: Seeded from operating system's secure random number generator
- ✅ **NextAuth Compatible**: Meets and exceeds NextAuth's security requirements
- ✅ **Production Proven**: Widely used in production by major applications

**Security Best Practices:**

1. Generate a unique secret for each environment (dev, staging, production)
2. Never commit secrets to version control
3. Store in secure environment variable management
4. Rotate immediately if compromised
5. Use at least 32 characters (this generates ~44 characters)

## Support

For issues or questions:

1. Check application logs
2. Review health check endpoint
3. Verify environment variables
4. Check database connectivity
