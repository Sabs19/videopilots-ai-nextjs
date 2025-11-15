# Database Connection String Summary

## ✅ Correct Connection String for Coolify

**This is the default PostgreSQL connection string provided by Coolify:**

```
postgres://Sabs19:0BoN7VCFumJjm2cIHwTT2gPMbOw1Vo2QgmBEaJhmRFcWmlP1t5TsiajRyeljqY4O@jgw8okkw8g8sw0gk4408ggww:5432/postgres?sslmode=require
```

### Important Notes:

1. **Format:** Both `postgres://` and `postgresql://` are now accepted (validation updated)
2. **Hostname:** `jgw8okkw8g8sw0gk4408ggww` is the internal service identifier provided by Coolify
3. **SSL:** The `sslmode=require` parameter is included for secure connections
4. **Network:** This will only work from within the Coolify network (not from your local machine)

## Connection Details

- **Protocol:** `postgres://` (default from Coolify)
- **Username:** `Sabs19`
- **Password:** `0BoN7VCFumJjm2cIHwTT2gPMbOw1Vo2QgmBEaJhmRFcWmlP1t5TsiajRyeljqY4O`
- **Host:** `jgw8okkw8g8sw0gk4408ggww` (internal service identifier)
- **Port:** `5432`
- **Database:** `postgres`
- **SSL Mode:** `require`

## For Coolify Environment Variables

**Use the exact connection string provided by Coolify:**

```
DATABASE_URL=postgres://Sabs19:0BoN7VCFumJjm2cIHwTT2gPMbOw1Vo2QgmBEaJhmRFcWmlP1t5TsiajRyeljqY4O@jgw8okkw8g8sw0gk4408ggww:5432/postgres?sslmode=require
```

**Note:** The code now accepts both `postgres://` and `postgresql://` formats, so you can use either one.

**Settings:**

- ✅ Available at Buildtime
- ✅ Available at Runtime

## Why Local Testing Fails

The connection test script fails locally because:

- `postgresql-database-jgw8okkw8g8sw0gk4408ggww` is an internal Docker service name
- It only resolves within the Coolify/Docker network
- Your local machine cannot resolve this hostname

**This is expected behavior!** The connection string will work correctly when deployed in Coolify.

## Database Configuration

The application is configured to:

- Use SSL in production mode (`lib/db.ts` sets `rejectUnauthorized: false` for production)
- Handle connection pooling (max 20 connections in production)
- Gracefully handle connection errors
- Automatically retry on connection failures

## Testing the Connection in Coolify

Once deployed in Coolify, you can verify the connection by:

1. **Check Application Logs:**

   - In production mode, connection errors will be logged
   - Successful connections won't show a message (to reduce noise)

2. **Use the Health Check Endpoint:**

   ```
   GET /api/health
   ```

   This will verify database connectivity.

3. **Check Database Queries:**
   - Try accessing any page that requires database access
   - Check the application logs for any database errors

## Next Steps

1. ✅ Set `DATABASE_URL` in Coolify with the connection string above
2. ✅ Ensure `NODE_ENV=production` is set in Coolify
3. ✅ Deploy the application
4. ✅ Run database migrations: `npm run db:migrate` (from Coolify's terminal or after deployment)
5. ✅ Verify connection via `/api/health` endpoint

## Troubleshooting

If the connection fails in Coolify:

1. **Verify Service Name:**

   - Check Coolify's PostgreSQL service for the exact service name
   - Ensure services are in the same network

2. **Check SSL Configuration:**

   - Some Coolify PostgreSQL instances may not require SSL
   - Try removing `?sslmode=require` if connection fails

3. **Verify Credentials:**

   - Double-check username and password in Coolify's PostgreSQL service
   - Ensure password doesn't contain unencoded special characters

4. **Network Access:**
   - Ensure both services (app and database) are in the same Coolify network
   - Check if any firewall rules are blocking the connection
