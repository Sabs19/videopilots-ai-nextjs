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

### Step 3: Create Test Accounts (Optional)

PayPal provides default test accounts, but you can create custom ones:

1. Go to **Dashboard** → **Sandbox** → **Accounts**
2. Click **Create Account**
3. Choose account type:
   - **Personal** - For testing buyer experience
   - **Business** - For testing merchant experience
4. Fill in the details (use fake info, it's just for testing)
5. Note the email and password - you'll use these to test payments

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
5. Log in with a **sandbox test account** (not your real PayPal account!)
6. Complete the payment flow
7. You should be redirected back to your app

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

PayPal provides default test accounts, but you can also create custom ones:

**Default Personal Account:**
- Email: `sb-xxxxx@personal.example.com` (check your dashboard)
- Password: (set when creating account)

**Default Business Account:**
- Email: `sb-xxxxx@business.example.com` (check your dashboard)
- Password: (set when creating account)

**Note:** Use these test accounts ONLY in the PayPal sandbox environment, never in production!

## Resources

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Sandbox Testing Guide](https://developer.paypal.com/docs/api-basics/sandbox/)
- [PayPal REST API Reference](https://developer.paypal.com/docs/api/orders/v2/)

