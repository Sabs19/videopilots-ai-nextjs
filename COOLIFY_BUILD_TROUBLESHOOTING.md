# Coolify Build Troubleshooting

## Build Failure: "Oops something is not okay"

If you see this error during deployment, it usually means the build process failed. Here's how to fix it:

## Common Causes & Solutions

### 1. Missing Environment Variables at Build Time ⚠️ MOST COMMON

**Problem:** Next.js build requires certain environment variables, especially:
- `AUTH_SECRET` - NextAuth validates this at build time
- `NEXT_PUBLIC_YOUTUBE_API_KEY` - Embedded in client bundle
- `AUTH_URL` - Used during build

**Solution:**
1. Go to your app in Coolify
2. Navigate to **Environment Variables**
3. Ensure ALL required variables are set:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL`
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_YOUTUBE_API_KEY` (if using YouTube)
   - `OPENAI_API_KEY` (if using OpenAI)
4. **CRITICAL:** Enable **"Available at Buildtime"** for ALL variables
5. **CRITICAL:** Enable **"Available at Runtime"** for ALL variables
6. Redeploy

### 2. Check Build Logs for Specific Errors

1. In Coolify, click **"Show Debug Logs"** or **"View Logs"**
2. Look for error messages after the Nixpacks setup
3. Common errors:
   - `AUTH_SECRET environment variable is not set`
   - `Missing required environment variables`
   - `TypeError` or `ReferenceError`
   - Build timeout

### 3. Build Timeout

**Problem:** Build takes too long and times out

**Solution:**
- Check if all dependencies are installing correctly
- Consider increasing build timeout in Coolify settings
- Check for large files being copied during build

### 4. Memory Issues

**Problem:** Build runs out of memory

**Solution:**
- Increase memory allocation in Coolify
- Check for memory-intensive operations in build scripts

### 5. TypeScript/ESLint Errors

**Problem:** Build fails due to code errors

**Solution:**
1. Test build locally first:
   ```bash
   npm run build
   ```
2. Fix any TypeScript or ESLint errors
3. Commit and push changes
4. Redeploy

## Step-by-Step Fix

### Step 1: Verify Environment Variables

In Coolify, check that you have ALL these variables set:

```
✅ DATABASE_URL=postgresql://...
✅ AUTH_SECRET=your-secret-here
✅ AUTH_URL=http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io
✅ NODE_ENV=production
✅ NEXT_PUBLIC_YOUTUBE_API_KEY=your-key (if using)
✅ OPENAI_API_KEY=your-key (if using)
```

**For EACH variable:**
- ✅ "Available at Buildtime" - **ENABLED**
- ✅ "Available at Runtime" - **ENABLED**

### Step 2: Test Build Locally

Before deploying, test the build locally:

```bash
# Set environment variables
export DATABASE_URL=postgresql://...
export AUTH_SECRET=your-secret
export AUTH_URL=http://localhost:3000
export NODE_ENV=production
export NEXT_PUBLIC_YOUTUBE_API_KEY=your-key

# Build
npm run build

# If build succeeds, the issue is with Coolify env vars
# If build fails, fix the errors first
```

### Step 3: Check Coolify Build Logs

1. Go to your deployment in Coolify
2. Click **"Show Debug Logs"** or **"View Logs"**
3. Scroll to the end of the logs
4. Look for error messages
5. Common patterns:
   - `Error: AUTH_SECRET environment variable is not set`
   - `Missing required environment variables`
   - `Build failed`
   - `npm ERR!`

### Step 4: Common Fixes

#### Fix 1: Missing AUTH_SECRET
```
Error: AUTH_SECRET environment variable is not set
```
**Solution:** Add `AUTH_SECRET` with "Available at Buildtime" enabled

#### Fix 2: Missing NEXT_PUBLIC_ Variable
```
Error: NEXT_PUBLIC_YOUTUBE_API_KEY is undefined
```
**Solution:** Add the variable with "Available at Buildtime" enabled

#### Fix 3: Invalid AUTH_URL
```
Error: AUTH_URL must be a valid URL
```
**Solution:** Ensure `AUTH_URL` is set correctly (no trailing slash)

## Quick Checklist

Before redeploying, verify:

- [ ] All environment variables are set in Coolify
- [ ] "Available at Buildtime" is enabled for ALL variables
- [ ] "Available at Runtime" is enabled for ALL variables
- [ ] `AUTH_URL` has no trailing slash
- [ ] `AUTH_URL` matches your Coolify domain
- [ ] `NODE_ENV` is set to `production`
- [ ] Build works locally (`npm run build`)

## Still Not Working?

1. **Check the full build logs** - Look for the actual error message
2. **Try building locally** - If it works locally, it's an env var issue
3. **Check Coolify documentation** - For platform-specific issues
4. **Verify Node.js version** - Coolify should use Node 22 (as shown in logs)

## Next Steps

Once the build succeeds:
1. Check health endpoint: `/api/health`
2. Run database migrations
3. Test the application

