# Troubleshooting Login Issues in Production

## Issue: Unable to login with sgsabariganesh@gmail.com

### Recent Changes Made

1. **Case-Insensitive Email Matching**: Updated authentication to use case-insensitive email comparison
2. **Better Error Logging**: Added detailed logging to identify login failures
3. **Diagnostic Script**: Created `scripts/check-user.js` to check user existence in database

## Common Causes & Solutions

### 1. User Doesn't Exist in Production Database

**Check:** Run the diagnostic script in Coolify terminal:
```bash
node scripts/check-user.js sgsabariganesh@gmail.com
```

**Solution:** If user doesn't exist, you need to:
- Register the user again in production, OR
- Migrate the user from development to production database

### 2. Password Mismatch

**Check:** Verify the password hash matches by checking production logs after login attempt

**Solution:** 
- Reset password by creating a new user or updating password hash
- Make sure you're using the same password that was set during registration

### 3. Email Case Sensitivity (FIXED)

**Fixed:** Authentication now uses case-insensitive email matching (`LOWER(email) = LOWER($1)`)

**Previous Issue:** If user was registered as `SGSabariganesh@gmail.com` but trying to login as `sgsabariganesh@gmail.com`, it would fail.

**Solution:** Already fixed in the code. Deploy the updated version.

### 4. Database Connection Issues

**Check:** Verify database connection is working:
```bash
node scripts/test-db-connection.js
```

**Check Production Logs:**
- Look for `[Auth]` prefixed messages in production logs
- Check for database connection errors

### 5. Missing Password Hash

**Check:** Run diagnostic script - it will show if user has no password

**Solution:** User needs to register again or reset password

## Diagnostic Steps

### Step 1: Check User in Production Database

1. Open Coolify terminal for your application
2. Run:
   ```bash
   DATABASE_URL=your-production-db-url node scripts/check-user.js sgsabariganesh@gmail.com
   ```

Or set DATABASE_URL in Coolify environment and run:
```bash
node scripts/check-user.js sgsabariganesh@gmail.com
```

This will show:
- If user exists
- Email as stored in database
- Whether password hash exists
- All users in database

### Step 2: Test Password Verification

To test if password is correct:
```bash
node scripts/check-user.js sgsabariganesh@gmail.com your-password-here
```

### Step 3: Check Production Logs

After attempting to login, check Coolify logs for:
- `[Auth] User not found: ...` - User doesn't exist
- `[Auth] User has no password: ...` - User exists but no password
- `[Auth] Invalid password for: ...` - Password doesn't match
- `[Auth] Successful login: ...` - Login succeeded

### Step 4: Verify Environment Variables

Ensure these are set correctly in Coolify:
- `DATABASE_URL` - Production database connection string
- `AUTH_SECRET` - Same secret used when user was registered
- `AUTH_URL` - Production application URL

## Quick Fixes

### Option 1: Register User Again in Production

1. Go to production application
2. Click "Register"
3. Use: `sgsabariganesh@gmail.com`
4. Set a password
5. Login with new credentials

### Option 2: Create User Directly in Database

If you have database access, you can create the user manually:

```sql
-- Hash your password first (you'll need to do this programmatically)
-- Then insert:
INSERT INTO user_profiles (email, name, password, created_at, updated_at)
VALUES (
  'sgsabariganesh@gmail.com',
  'Your Name',
  '$2a$10$hashed_password_here', -- Use bcrypt to hash your password
  NOW(),
  NOW()
);
```

To hash password, use Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('your-password', 10);
console.log(hash);
```

### Option 3: Reset User Password

Create a script to reset password:

```javascript
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const email = 'sgsabariganesh@gmail.com';
const newPassword = 'your-new-password';
const hashedPassword = await bcrypt.hash(newPassword, 10);

await pool.query(
  'UPDATE user_profiles SET password = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2)',
  [hashedPassword, email]
);
```

## Deploy Updated Authentication

After deploying the updated `auth.ts` file:

1. **Commit changes:**
   ```bash
   git add auth.ts scripts/check-user.js TROUBLESHOOTING_LOGIN.md
   git commit -m "Fix login: case-insensitive email matching and better error logging"
   git push
   ```

2. **Redeploy in Coolify** - The changes will automatically deploy

3. **Test login** after deployment

## After Fixing

1. Check production logs for `[Auth]` messages
2. Verify login works
3. Check that user can access protected routes

## Prevention

To avoid this in the future:
1. Always use lowercase emails when registering users
2. Store emails in lowercase in database
3. Use case-insensitive comparison for emails
4. Test user registration/login in production after deployment

