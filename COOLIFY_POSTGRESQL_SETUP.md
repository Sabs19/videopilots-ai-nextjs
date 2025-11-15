# PostgreSQL Setup in Coolify

## How PostgreSQL Works in Coolify

In Coolify, PostgreSQL can be set up in **two ways**:

### Option 1: PostgreSQL as a Separate Service (Recommended) ✅

Coolify can host PostgreSQL as a separate database service/resource. This is the recommended approach.

**Steps:**

1. In Coolify, go to **Resources** or **Services**
2. Click **+ New Resource** or **+ New Service**
3. Select **PostgreSQL** from the available services
4. Configure:
   - **Name**: e.g., `videopilots-db`
   - **Version**: Choose PostgreSQL version (14+ recommended)
   - **Database Name**: e.g., `videopilots_ai`
   - **Username**: e.g., `videopilots_user`
   - **Password**: Set a strong password (or let Coolify generate one)
5. Deploy the PostgreSQL service
6. Once deployed, Coolify will provide you with:
   - Connection string/URL
   - Host, port, database name, username, password

**Connection String Format:**

```
postgresql://username:password@host:5432/database_name
```

**Example:**

```
postgresql://videopilots_user:your-password@postgres-service:5432/videopilots_ai
```

### Option 2: External PostgreSQL Database

Use an external PostgreSQL service like:

- **Supabase** (free tier available)
- **Neon** (serverless PostgreSQL)
- **Railway** (PostgreSQL service)
- **DigitalOcean** (Managed Databases)
- **AWS RDS**
- **Your own PostgreSQL server**

**Steps:**

1. Create PostgreSQL database on your chosen provider
2. Get the connection string from the provider
3. Use that connection string in Coolify's environment variables

## Setting DATABASE_URL in Coolify

### If PostgreSQL is Hosted in Coolify:

1. **Get the Connection String:**

   - Go to your PostgreSQL service in Coolify
   - Look for **Connection String** or **Database URL**
   - Copy the full connection string

2. **Set in Your App's Environment Variables:**
   - Go to your Next.js app in Coolify
   - Navigate to **Environment Variables**
   - Add:
     ```
     DATABASE_URL=postgresql://username:password@postgres-service:5432/database_name
     ```
   - ✅ Enable "Available at Buildtime"
   - ✅ Enable "Available at Runtime"

### If Using External Database:

1. **Get Connection String from Provider:**

   - Example from Supabase:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
     ```
   - Example from Neon:
     ```
     postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb
     ```

2. **Set in Coolify:**
   - Add `DATABASE_URL` with the external connection string
   - ✅ Enable "Available at Buildtime"
   - ✅ Enable "Available at Runtime"

## Finding Your PostgreSQL Connection Details in Coolify

If PostgreSQL is already set up in Coolify:

1. **Check the PostgreSQL Service:**

   - Go to your PostgreSQL resource/service
   - Look for **Connection Details** or **Environment Variables**
   - You'll see:
     - `POSTGRES_HOST` or `POSTGRES_HOSTNAME`
     - `POSTGRES_PORT` (usually 5432)
     - `POSTGRES_DB` (database name)
     - `POSTGRES_USER` (username)
     - `POSTGRES_PASSWORD` (password)

2. **Construct the Connection String:**

   ```
   postgresql://POSTGRES_USER:POSTGRES_PASSWORD@POSTGRES_HOST:POSTGRES_PORT/POSTGRES_DB
   ```

3. **If Services are in Same Network:**

   - Use the service name as host (e.g., `postgres-service`)
   - Format: `postgresql://user:password@postgres-service:5432/database`

4. **If Accessing from Outside:**
   - Use the public IP or domain
   - Format: `postgresql://user:password@your-db-domain.com:5432/database`

## Quick Check: Is PostgreSQL Set Up?

**To check if PostgreSQL is already set up in Coolify:**

1. Look in Coolify's dashboard for:

   - A PostgreSQL service/resource
   - Database-related services
   - Resources section

2. Check your app's environment variables:

   - If `DATABASE_URL` is already set, PostgreSQL is configured
   - The connection string will tell you where it's hosted

3. **If you don't see PostgreSQL:**
   - You need to create it (Option 1 above)
   - Or set up an external database (Option 2 above)

## Running Database Migrations

Once `DATABASE_URL` is set in Coolify:

1. **Option A: Using Coolify's Terminal/SSH:**

   - Go to your app in Coolify
   - Open **Terminal** or **Console**
   - Run:
     ```bash
     npm run db:migrate
     ```

2. **Option B: Run Locally (if database is accessible):**
   ```bash
   DATABASE_URL=your-production-connection-string npm run db:migrate
   ```

## Important Notes

⚠️ **Security:**

- Never commit database passwords to git
- Use Coolify's secure environment variable storage
- Enable SSL for production databases (already configured in `lib/db.ts`)

⚠️ **Network Access:**

- If PostgreSQL is in Coolify, services in the same network can connect directly
- External databases need to allow connections from Coolify's IP
- Some providers (like Supabase) require IP whitelisting

✅ **Best Practice:**

- Use a separate PostgreSQL service in Coolify (easier to manage)
- Or use a managed service like Supabase/Neon (better for scaling)

## Troubleshooting

### Can't Connect to Database

1. **Check Connection String:**

   - Verify format: `postgresql://user:password@host:port/database`
   - No typos in username, password, host, or database name

2. **Check Network Access:**

   - If external DB: ensure Coolify's IP is whitelisted
   - If Coolify DB: ensure services are in same network

3. **Check SSL:**

   - Production uses SSL automatically (configured in `lib/db.ts`)
   - Some providers require SSL mode in connection string

4. **Test Connection:**
   - Use health check endpoint: `/api/health`
   - Check application logs for database errors

## Summary

**If PostgreSQL is hosted with your app in Coolify:**

- ✅ It's set up as a separate service/resource
- ✅ Get connection string from the PostgreSQL service
- ✅ Use service name as host (if in same network)
- ✅ Set `DATABASE_URL` in your app's environment variables

**If you need to set it up:**

- Create PostgreSQL service in Coolify (recommended)
- Or use external database (Supabase, Neon, etc.)
- Set `DATABASE_URL` with the connection string
