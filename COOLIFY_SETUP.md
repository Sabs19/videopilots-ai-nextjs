# Coolify Deployment Setup Guide

## Important: Environment Variables in Coolify

**You do NOT use `.env.local` in Coolify.** Instead, you set environment variables directly in the Coolify interface.

## Setting Environment Variables in Coolify

1. Go to your application in Coolify
2. Navigate to **Environment Variables** section
3. For each variable, set:
   - **Key**: The variable name (e.g., `DATABASE_URL`)
   - **Value**: The production value
   - **Available at Buildtime**: ✅ **Enable** (check this box)
   - **Available at Runtime**: ✅ **Enable** (check this box)

## Required Variables for Production

### ⚠️ Critical Differences from Local Development

Your `.env.local` has local development values. For Coolify, you need **production values**:

| Variable | Local (.env.local) | Coolify (Production) |
|----------|-------------------|---------------------|
| `DATABASE_URL` | `postgresql://sabari@localhost:5432/videopilots_ai` | `postgresql://user:password@your-db-host:5432/database` |
| `AUTH_URL` | `http://localhost:3000` | `http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io` |
| `NODE_ENV` | `development` | `production` |
| `AUTH_SECRET` | ✅ Keep the same (or generate new) | ✅ Keep the same (or generate new) |
| `OPENAI_API_KEY` | ✅ Keep the same | ✅ Keep the same |
| `NEXT_PUBLIC_YOUTUBE_API_KEY` | ✅ Keep the same | ✅ Keep the same |

## Step-by-Step Coolify Setup

### 1. Get Your Production Database URL

**Is PostgreSQL hosted in Coolify?** Check if you have a PostgreSQL service/resource in Coolify.

**If PostgreSQL is in Coolify:**
- Go to your PostgreSQL service in Coolify
- Find the **Connection String** or connection details
- Format: `postgresql://user:password@postgres-service:5432/database_name`
- If services are in the same network, use the service name as host

**If using external database (e.g., Supabase, Railway, Neon):**
- Copy the connection string from your database provider
- Ensure it's accessible from Coolify's network
- Some providers require IP whitelisting

**See `COOLIFY_POSTGRESQL_SETUP.md` for detailed PostgreSQL setup instructions.**

### 2. Set Environment Variables in Coolify

Add these variables in Coolify's Environment Variables section:

```
DATABASE_URL=postgresql://user:password@host:5432/database_name
```

**Settings:**
- ✅ Available at Buildtime
- ✅ Available at Runtime

```
AUTH_SECRET=PIZWyCFFEyGD9BC5UN4u9ydbs9BXIoaCkWfsSTA4Yr8=
```

**Settings:**
- ✅ Available at Buildtime
- ✅ Available at Runtime

**Note:** You can keep your existing AUTH_SECRET or generate a new one with:
```bash
openssl rand -base64 32
```

```
AUTH_URL=http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io
```

**Settings:**
- ✅ Available at Buildtime
- ✅ Available at Runtime

**Important:** 
- Your production URL: `http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io`
- Remove the trailing slash when setting `AUTH_URL`
- If Coolify provides HTTPS later, update this to use `https://`

```
NODE_ENV=production
```

**Settings:**
- ✅ Available at Buildtime
- ✅ Available at Runtime

```
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

**Settings:**
- ✅ Available at Buildtime
- ✅ Available at Runtime

```
NEXT_PUBLIC_YOUTUBE_API_KEY=your-youtube-api-key-here
```

**Settings:**
- ✅ Available at Buildtime
- ✅ Available at Runtime

### 3. Verify Settings

After setting all variables, verify:
- ✅ All variables have both "Available at Buildtime" and "Available at Runtime" enabled
- ✅ `AUTH_URL` uses `https://` (not `http://`)
- ✅ `AUTH_URL` matches your Coolify domain
- ✅ `DATABASE_URL` points to your production database
- ✅ `NODE_ENV` is set to `production`

### 4. Deploy

1. Click **Deploy** in Coolify
2. Monitor the build logs
3. Check for any errors related to missing environment variables

### 5. Post-Deployment

1. **Run Database Migrations:**
   ```bash
   # SSH into your Coolify container or use Coolify's terminal
   npm run db:migrate
   ```

2. **Test Health Endpoint:**
   Visit: `http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io/api/health`
   Should return: `{"status": "healthy", ...}`

3. **Verify Application:**
   Visit: `http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io`
   Should load your application

## Common Issues

### Issue: Build fails with "Missing environment variable"
**Solution:** Ensure the variable is set with "Available at Buildtime" enabled

### Issue: Runtime error about missing variable
**Solution:** Ensure the variable is set with "Available at Runtime" enabled

### Issue: Database connection fails
**Solution:** 
- Verify `DATABASE_URL` is correct
- Check database is accessible from Coolify's network
- Ensure database allows connections from Coolify's IP

### Issue: Authentication not working
**Solution:**
- Verify `AUTH_URL` is set to: `http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io`
- Remove trailing slash from `AUTH_URL`
- Check `AUTH_SECRET` is set correctly
- If Coolify enables HTTPS later, update `AUTH_URL` to use `https://`

## Security Notes

⚠️ **Never commit `.env.local` to git** - it contains sensitive keys
✅ **Use Coolify's secure environment variable storage**
✅ **Generate a new `AUTH_SECRET` for production** (optional but recommended)
✅ **Use different database for production** (never use localhost database)

## Summary

- ❌ Don't use `.env.local` in Coolify
- ✅ Set variables in Coolify's Environment Variables UI
- ✅ Enable both "Available at Buildtime" and "Available at Runtime"
- ✅ Use production values (not localhost)
- ✅ Use your production URL: `http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io` (update to `https://` if SSL is enabled)

