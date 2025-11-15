# Coolify Environment Variables - Your Production Values

## Quick Reference for Your Coolify Deployment

Copy these exact values into Coolify's Environment Variables section:

### Required Variables

```
DATABASE_URL=postgresql://user:password@host:5432/database_name
```
**Note:** Replace with your actual production database connection string

**Settings:**
- ✅ Available at Buildtime
- ✅ Available at Runtime

---

```
AUTH_SECRET=PIZWyCFFEyGD9BC5UN4u9ydbs9BXIoaCkWfsSTA4Yr8=
```

**Settings:**
- ✅ Available at Buildtime
- ✅ Available at Runtime

**Note:** You can keep this value or generate a new one with `openssl rand -base64 32`

---

```
AUTH_URL=http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io
```

**Settings:**
- ✅ Available at Buildtime
- ✅ Available at Runtime

**Important:** 
- Remove trailing slash
- If Coolify enables HTTPS, change to `https://`

---

```
NODE_ENV=production
```

**Settings:**
- ✅ Available at Buildtime
- ✅ Available at Runtime

---

### Optional but Recommended

```
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

**Settings:**
- ✅ Available at Buildtime
- ✅ Available at Runtime

---

```
NEXT_PUBLIC_YOUTUBE_API_KEY=your-youtube-api-key-here
```

**Settings:**
- ✅ Available at Buildtime
- ✅ Available at Runtime

---

## Your Production URL

**Application URL:** `http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io`

**Health Check:** `http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io/api/health`

## Checklist

Before deploying, verify:

- [ ] `DATABASE_URL` is set to your production database (not localhost)
- [ ] `AUTH_URL` is set to: `http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io` (no trailing slash)
- [ ] `NODE_ENV` is set to `production`
- [ ] All variables have both "Available at Buildtime" and "Available at Runtime" enabled
- [ ] Database migrations have been run

## After Deployment

1. Test health endpoint: `http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io/api/health`
2. Visit your app: `http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io`
3. Test authentication (sign in/register)

