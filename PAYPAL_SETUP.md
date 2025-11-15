# PayPal Integration Setup Guide

## Why Use Sandbox Mode?

**Yes, you should use PayPal sandbox accounts for testing!** Here's why:

✅ **No real money** - Test payments don't charge real credit cards  
✅ **Test scenarios** - Easily test cancellations, failures, refunds  
✅ **Safe development** - No risk of accidental charges during development  
✅ **Free** - Sandbox accounts are free to create and use  

## Setting Up PayPal Sandbox

### Step 1: Create PayPal Developer Account

1. Go to [https://developer.paypal.com/](https://developer.paypal.com/)
2. Click **Log In** and sign in with your PayPal account (or create one)
3. You'll be redirected to the Developer Dashboard

### Step 2: Create Sandbox App

1. In the Developer Dashboard, click **My Apps & Credentials**
2. Make sure you're on the **Sandbox** tab (not Live)
3. Under **REST API apps**, click **Create App**
4. Give it a name (e.g., "VideoPilots AI - Sandbox")
5. Click **Create App**
6. You'll see your **Client ID** and **Secret** - copy these!

### Step 3: Create Test Buyer Account (REQUIRED)

**IMPORTANT:** You cannot use the same account that created the app (seller account) to make purchases. You need a separate **buyer test account**.

1. Go to **Dashboard** → **Sandbox** → **Accounts**
2. Click **Create Account**
3. Choose account type: **Personal** (for testing buyer experience)
4. Fill in the details:
   - **Email**: Use a fake email (e.g., `buyer-test@example.com`)
   - **Password**: Create a password you'll remember
   - **Name**: Any name (e.g., "Test Buyer")
   - **Country**: Your country
5. Click **Create Account**
6. **IMPORTANT:** Note the email and password - you'll use this account to test payments

**Why this is needed:**
- Your app credentials are associated with a **seller/merchant** account
- PayPal doesn't allow the seller to buy from themselves
- You need a separate **buyer** account to test the payment flow

### Step 4: Configure Environment Variables

In your Coolify environment variables, set:

```bash
# Sandbox credentials (from Step 2)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-sandbox-client-id-here
PAYPAL_CLIENT_SECRET=your-sandbox-secret-here

# Set to sandbox (or omit - defaults to sandbox)
PAYPAL_MODE=sandbox
```

**Important:** Make sure both "Available at Buildtime" and "Available at Runtime" are enabled.

### Step 5: Test the Integration

1. Deploy your app with the sandbox credentials
2. Go to the pricing page
3. Click "Upgrade" on a plan
4. You'll be redirected to PayPal sandbox
5. **CRITICAL:** Log in with the **buyer test account** you created in Step 3
   - **DO NOT** use the account that created the app (seller account)
   - **DO NOT** use your real PayPal account
   - Use the **Personal** test account you created
6. Complete the payment flow
7. You should be redirected back to your app

**Common Error:** If you see "You are logging in to the account of the seller for this purchase", you're using the wrong account. Create a separate buyer test account.

## Testing Different Scenarios

### Test Successful Payment
- Use a sandbox buyer account
- Complete the payment flow
- Verify subscription is activated in your app

### Test Cancellation
- Start the payment flow
- Click "Cancel and return" on PayPal
- Verify no subscription is created

### Test Failed Payment
- PayPal sandbox automatically handles some failure scenarios
- Check your server logs for error handling

## Switching to Production

When you're ready to go live:

1. In PayPal Developer Dashboard, switch to **Live** tab
2. Create a new app (or use existing)
3. Copy the **Live Client ID** and **Secret**
4. Update your environment variables:
   ```bash
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-live-client-id
   PAYPAL_CLIENT_SECRET=your-live-client-secret
   PAYPAL_MODE=production
   ```
5. Test with a small real transaction first!

## Troubleshooting

### "You are logging in to the account of the seller for this purchase"
**This is the most common error!**

**Problem:** You're trying to use the same account that created the app (seller/merchant) to make a purchase.

**Solution:**
1. Go to PayPal Developer Dashboard → **Sandbox** → **Accounts**
2. Create a new **Personal** test account (buyer account)
3. Use this **buyer account** to log in when testing payments
4. **Never** use the seller account to make purchases

**Remember:** 
- **Seller account** = The account that created the app (used for app credentials)
- **Buyer account** = Separate test account you create (used to test payments)

### "PayPal credentials not configured"
- Check that `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set
- Make sure they're available at both buildtime and runtime

### "PayPal authentication failed"
- Verify your Client ID and Secret are correct
- Make sure you're using sandbox credentials with `PAYPAL_MODE=sandbox`
- Check that you're using the right credentials (sandbox vs live)

### "Please check your entries and try again" in PayPal
- Verify the amount is formatted correctly (2 decimal places)
- Check that return URLs are valid
- Make sure `AUTH_URL` is set correctly

## Sandbox Test Accounts

### Understanding Account Types

**Seller/Merchant Account:**
- The account that created your PayPal app
- Used for app credentials (Client ID, Secret)
- **CANNOT** be used to make purchases (PayPal prevents this)

**Buyer Account:**
- A separate **Personal** test account you create
- Used to test the payment flow
- **MUST** be different from the seller account

### Creating Your Buyer Account

1. Go to **Dashboard** → **Sandbox** → **Accounts**
2. Click **Create Account**
3. Select **Personal** account type
4. Fill in details (fake info is fine)
5. Save the email and password

### Using Default Test Accounts

PayPal may provide default test accounts, but it's better to create your own:

**To use default accounts:**
- Check your dashboard for default account emails
- These are usually `sb-xxxxx@personal.example.com` or `sb-xxxxx@business.example.com`
- **Important:** Make sure you're using a **Personal** account (buyer), not the Business account (seller)

**Note:** Use these test accounts ONLY in the PayPal sandbox environment, never in production!

## Resources

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Sandbox Testing Guide](https://developer.paypal.com/docs/api-basics/sandbox/)
- [PayPal REST API Reference](https://developer.paypal.com/docs/api/orders/v2/)

