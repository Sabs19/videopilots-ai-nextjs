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

**For Testing (Sandbox Mode - Recommended):**

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Log in with your PayPal account
3. Navigate to **Dashboard** → **Sandbox** → **Accounts**
4. Create test accounts (Personal and Business) if needed
5. Go to **My Apps & Credentials** → **Sandbox** tab
6. Create a new app or use the default app
7. Copy the **Client ID** and **Secret**

Set these environment variables:
```
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
PAYPAL_MODE=sandbox
```

**For Production:**

1. In PayPal Developer Dashboard, switch to **Live** tab
2. Create a new app or use existing app
3. Copy the **Client ID** and **Secret**

Set these environment variables:
```
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-live-client-id
PAYPAL_CLIENT_SECRET=your-live-client-secret
PAYPAL_MODE=production
```

**Notes:**
- **Default behavior:** If `PAYPAL_MODE` is not set or not equal to `'production'`, the app uses **sandbox mode** automatically
- **Why both buildtime & runtime:** 
  - `NEXT_PUBLIC_PAYPAL_CLIENT_ID` must be available at build time (embedded in client bundle)
  - `PAYPAL_CLIENT_SECRET` is used server-side only but should be available at both times for consistency
- **Testing:** Use sandbox test accounts to test payments without real money. PayPal provides test buyer accounts with fake credit cards.

## Summary

**All variables should be set with:**

- ✅ Available at Buildtime
- ✅ Available at Runtime

This ensures:

1. Next.js can properly build the application with all required values
2. NEXT*PUBLIC* variables are embedded in the client bundle
3. Server-side code has access to all environment variables at runtime
4. No build-time or runtime errors due to missing variables
