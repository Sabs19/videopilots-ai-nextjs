# PayPal Sandbox Troubleshooting Guide

## Common Error: "You are logging in to the account of the seller for this purchase"

### Understanding the Issue

When you create a PayPal sandbox app, it's automatically associated with a **Business test account** (the seller/merchant). PayPal prevents this Business account from making purchases from itself.

**This error occurs when:**
- You try to log in with the Business account that created the app
- You try to log in with any account that's associated with the seller
- PayPal detects you're using the seller account to make a purchase

### Solution: Use a Separate Personal Account

You **MUST** create and use a **Personal** test account (buyer) that's completely separate from the Business account.

### Step-by-Step Fix

1. **Check which account your app is using:**
   ```
   PayPal Dashboard → My Apps & Credentials → Sandbox
   → Look at your app → Note the associated Business account
   ```

2. **Create a new Personal buyer account:**
   ```
   PayPal Dashboard → Sandbox → Accounts → Create Account
   → Select "Personal" (NOT Business!)
   → Use a different email (e.g., buyer-test@example.com)
   → Set a password you'll remember
   ```

3. **Test the payment:**
   - Go to your app's pricing page
   - Click "Upgrade"
   - When redirected to PayPal, log in with the **Personal** buyer account
   - Complete the payment

### Verification Checklist

- ✅ Buyer account is **Personal** type (not Business)
- ✅ Buyer account email is **different** from seller account
- ✅ You're logging in with the **buyer** account, not seller
- ✅ You're in **Sandbox** mode (not Live/Production)

### If Error Still Persists

1. **Clear browser data:**
   - Clear cookies and cache
   - Try in an incognito/private window
   - Or use a different browser

2. **Create a fresh buyer account:**
   - Delete the old buyer account
   - Create a new Personal account with a different email

3. **Verify app configuration:**
   - Make sure you're using sandbox credentials
   - Check that `PAYPAL_MODE=sandbox` is set (or not set to production)
   - Verify Client ID and Secret are from the Sandbox tab

4. **Check PayPal account status:**
   - Make sure the buyer account is active
   - Verify it's not restricted or limited

### Account Type Reference

| Account Type | Purpose | Can Make Purchases? |
|-------------|---------|-------------------|
| **Business** | Seller/Merchant (app owner) | ❌ NO - This causes the error |
| **Personal** | Buyer (test customer) | ✅ YES - Use this for testing |

### Quick Test

To quickly verify you have the right setup:

1. Create a Personal account: `test-buyer@example.com`
2. Try to log in to PayPal sandbox directly: https://www.sandbox.paypal.com
3. If you can log in successfully, use this account for payments
4. If you get errors, create a new Personal account

### Still Having Issues?

If the error persists after following these steps:

1. **Check server logs** - Look for PayPal API errors
2. **Verify environment variables** - Make sure sandbox credentials are set
3. **Test with PayPal's default accounts** - They provide default test accounts you can use
4. **Contact PayPal Support** - If it's a PayPal platform issue

### Important Notes

- **Never** use your real PayPal account in sandbox
- **Always** use a Personal account for buyer testing
- **Business** accounts are for sellers/merchants only
- The app credentials (Client ID/Secret) are tied to the Business account
- You need separate accounts for seller (Business) and buyer (Personal)

