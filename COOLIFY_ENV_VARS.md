# Coolify Environment Variables Configuration

Set all these variables in Coolify with **both** "Available at Buildtime" and "Available at Runtime" enabled.

## Required Environment Variables

### Database

```
DATABASE_URL=postgresql://user:password@host:5432/database_name
```

- **Why both buildtime & runtime:** Used in database connection setup and may be needed during build for type checking/validation

### Authentication (NextAuth)

```
AUTH_SECRET=your-secret-key-here
```

- **Why both buildtime & runtime:** NextAuth validates this at build time and uses it at runtime for session encryption
- **Generate with:** `openssl rand -base64 32` (generates ~44 characters, 256 bits of entropy - cryptographically secure)

```
AUTH_URL=https://your-domain.com
```

- **Why both buildtime & runtime:** Used by NextAuth for callback URLs and session management

### OpenAI API

```
OPENAI_API_KEY=sk-your-openai-api-key
```

- **Why both buildtime & runtime:** Used in server-side API routes for generating course structures

### YouTube API

```
NEXT_PUBLIC_YOUTUBE_API_KEY=your-youtube-api-key
```

- **Why both buildtime & runtime:**
  - **CRITICAL:** Variables prefixed with `NEXT_PUBLIC_` are embedded in the client bundle at build time
  - Also used at runtime in API routes

### Node Environment

```
NODE_ENV=production
```

- **Why both buildtime & runtime:** Used for conditional logic (SSL settings, etc.)

## Optional Environment Variables

### PayPal (if using PayPal integration)

```
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
```

- **Why both buildtime & runtime:** NEXT*PUBLIC* prefix means it must be available at build time

```
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
```

- **Why both buildtime & runtime:** Used in server-side PayPal API calls

## Summary

**All variables should be set with:**

- ✅ Available at Buildtime
- ✅ Available at Runtime

This ensures:

1. Next.js can properly build the application with all required values
2. NEXT*PUBLIC* variables are embedded in the client bundle
3. Server-side code has access to all environment variables at runtime
4. No build-time or runtime errors due to missing variables
