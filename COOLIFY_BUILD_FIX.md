# Quick Fix: Coolify Build Failure

## The Problem

Your build is failing because **environment variables are not available during the build process**.

The error "Oops something is not okay" happens when Next.js tries to build but can't find required environment variables, especially `AUTH_SECRET`.

## The Solution (5 Steps)

### Step 1: Go to Environment Variables in Coolify

1. Open your app in Coolify
2. Click on **Environment Variables** section

### Step 2: Add/Verify These Variables

Add these **exact** variables (if not already set):

```
DATABASE_URL=postgresql://user:password@host:5432/database
AUTH_SECRET=PIZWyCFFEyGD9BC5UN4u9ydbs9BXIoaCkWfsSTA4Yr8=
AUTH_URL=http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io
NODE_ENV=production
NEXT_PUBLIC_YOUTUBE_API_KEY=your-youtube-api-key-here
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

**Important:** Replace `DATABASE_URL` with your actual production database connection string.

### Step 3: Enable "Available at Buildtime" ⚠️ CRITICAL

For **EACH** variable you just added:

1. Find the variable in the list
2. Look for **"Available at Buildtime"** checkbox
3. ✅ **CHECK THIS BOX** (enable it)
4. ✅ Also ensure **"Available at Runtime"** is checked

**This is the most common cause of build failures!**

### Step 4: Verify Settings

For each variable, you should see:
- ✅ Available at Buildtime: **Enabled**
- ✅ Available at Runtime: **Enabled**

### Step 5: Redeploy

1. Click **Deploy** or **Redeploy** in Coolify
2. Watch the build logs
3. The build should now succeed

## Why This Happens

Next.js build process needs:
- `AUTH_SECRET` - NextAuth validates this during build
- `NEXT_PUBLIC_*` variables - Embedded in client bundle at build time
- `AUTH_URL` - Used for configuration during build

If these aren't available at build time, the build fails.

## Still Failing?

1. **Check build logs** - Look for specific error messages
2. **Verify all variables** - Make sure none are missing
3. **Check variable values** - Ensure no typos
4. **Test locally** - Run `npm run build` with env vars set

## Quick Checklist

Before redeploying:

- [ ] `DATABASE_URL` is set (with your production database)
- [ ] `AUTH_SECRET` is set (44+ characters)
- [ ] `AUTH_URL` is set (no trailing slash)
- [ ] `NODE_ENV=production` is set
- [ ] `NEXT_PUBLIC_YOUTUBE_API_KEY` is set (if using YouTube)
- [ ] `OPENAI_API_KEY` is set (if using OpenAI)
- [ ] **"Available at Buildtime" is ENABLED for ALL variables**
- [ ] **"Available at Runtime" is ENABLED for ALL variables**

## After Successful Build

1. Check health endpoint: `http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io/api/health`
2. Run database migrations (if needed)
3. Test your application

