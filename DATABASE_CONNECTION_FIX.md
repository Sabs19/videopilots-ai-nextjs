# Database Connection Fix for Production

## Issue: Database Connection Failing in Production

Health check shows: `{"database":"error"}`

## Possible Causes

### 1. Incorrect Hostname

**Problem:** The hostname `jgw8okkw8g8sw0gk4408ggww` might be incomplete.

**Check in Coolify:**
- Go to your PostgreSQL service/resource
- Look for the **Connection String** or **Internal Service Name**
- It might be: `postgresql-database-jgw8okkw8g8sw0gk4408ggww` instead of just `jgw8okkw8g8sw0gk4408ggww`

**Solution:** Update `DATABASE_URL` in Coolify with the correct hostname.

### 2. Service Name vs Internal Identifier

**If PostgreSQL is in the same Coolify network:**
- Use the **service name** (e.g., `postgresql-database-jgw8okkw8g8sw0gk4408ggww`)
- Not the internal identifier (`jgw8okkw8g8sw0gk4408ggww`)

**Correct format:**
```
postgres://Sabs19:password@postgresql-database-jgw8okkw8g8sw0gk4408ggww:5432/postgres?sslmode=require
```

### 3. DATABASE_URL Not Set Correctly

**Verify in Coolify:**
1. Go to Environment Variables
2. Check if `DATABASE_URL` exists
3. Verify the value matches exactly what Coolify provides
4. Ensure both "Available at Buildtime" and "Available at Runtime" are enabled

### 4. SSL Configuration Mismatch

**Current configuration:**
- Connection string has: `?sslmode=require`
- Code sets: `ssl: { rejectUnauthorized: false }` in production

**This should work**, but verify:
- SSL is required by your PostgreSQL instance
- Certificate validation is disabled (`rejectUnauthorized: false`)

## Diagnostic Steps

### Step 1: Check Health Endpoint for Error Details

After deploying the updated code, check the health endpoint again:
```
GET http://gk8swsc4w0s4ss8sc808wggw.82.29.164.83.sslip.io/api/health
```

The response will now include:
- `error.message` - The specific error message
- `error.code` - The error code (e.g., `ENOTFOUND`, `ETIMEDOUT`, `28P01`)
- `databaseUrl` - Masked connection string to verify it's set

### Step 2: Check Production Logs

In Coolify, check your application logs for:
- `[DB] Initializing database connection:` - Shows connection details
- `❌ Unexpected error on idle database client:` - Shows database errors
- `[Auth]` messages - Shows authentication-related database errors

### Step 3: Verify PostgreSQL Service in Coolify

1. **Check PostgreSQL service status:**
   - Is it running?
   - Is it accessible from your app?

2. **Get the correct connection string:**
   - Go to PostgreSQL service → Connection details
   - Copy the exact connection string provided
   - Use that exact string in `DATABASE_URL`

3. **Verify network connectivity:**
   - Are both services in the same network?
   - Can the app service reach the database service?

### Step 4: Test Connection from Coolify Terminal

1. Open terminal/console for your app in Coolify
2. Run:
   ```bash
   node scripts/test-db-connection.js "$DATABASE_URL"
   ```
   
   Or with the actual connection string:
   ```bash
   node scripts/test-db-connection.js "postgres://Sabs19:0BoN7VCFumJjm2cIHwTT2gPMbOw1Vo2QgmBEaJhmRFcWmlP1t5TsiajRyeljqY4O@jgw8okkw8g8sw0gk4408ggww:5432/postgres?sslmode=require"
   ```

## Quick Fixes

### Fix 1: Update Hostname

If Coolify PostgreSQL service name is `postgresql-database-jgw8okkw8g8sw0gk4408ggww`:

Update `DATABASE_URL` in Coolify:
```
postgres://Sabs19:0BoN7VCFumJjm2cIHwTT2gPMbOw1Vo2QgmBEaJhmRFcWmlP1t5TsiajRyeljqY4O@postgresql-database-jgw8okkw8g8sw0gk4408ggww:5432/postgres?sslmode=require
```

### Fix 2: Remove SSL Mode (if not required)

If your PostgreSQL doesn't require SSL, try:
```
postgres://Sabs19:0BoN7VCFumJjm2cIHwTT2gPMbOw1Vo2QgmBEaJhmRFcWmlP1t5TsiajRyeljqY4O@jgw8okkw8g8sw0gk4408ggww:5432/postgres
```

### Fix 3: Verify DATABASE_URL Format

Ensure the connection string:
- ✅ Starts with `postgres://` or `postgresql://`
- ✅ Has correct username and password (URL-encoded if needed)
- ✅ Has correct hostname
- ✅ Has port `:5432`
- ✅ Has database name (usually `/postgres`)

## Common Error Codes

- **ENOTFOUND**: Hostname cannot be resolved
  - Solution: Use correct service name or check network connectivity
  
- **ETIMEDOUT**: Connection timeout
  - Solution: Check if PostgreSQL is running and accessible
  
- **28P01**: Authentication failed
  - Solution: Verify username and password are correct
  
- **3D000**: Database does not exist
  - Solution: Verify database name in connection string

## After Fixing

1. **Redeploy** your application in Coolify
2. **Check health endpoint** again: `/api/health`
3. **Verify logs** for successful connection
4. **Test login** functionality

## Next Steps

1. Check the updated health endpoint response for specific error details
2. Verify the PostgreSQL service name in Coolify
3. Update `DATABASE_URL` if the hostname is incorrect
4. Redeploy and test again

