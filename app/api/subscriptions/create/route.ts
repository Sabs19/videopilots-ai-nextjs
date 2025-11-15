import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

// PayPal API base URL (sandbox for testing, production for live)
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'production' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planName, billingPeriod } = body;

    if (!planName || !billingPeriod) {
      return NextResponse.json(
        { error: "Plan name and billing period are required" },
        { status: 400 }
      );
    }

    // Get plan details
    const planResult = await pool.query(
      'SELECT id, name, price_monthly, price_yearly FROM subscription_plans WHERE name = $1',
      [planName]
    );

    if (planResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const plan = planResult.rows[0];
    const amount = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
    const currency = 'USD';

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `subscription-${session.user.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `subscription-${planName}-${billingPeriod}`,
          description: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan - ${billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'}`,
          amount: {
            currency_code: currency,
            value: amount.toString(),
          },
        }],
        application_context: {
          brand_name: 'VideoPilots AI',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.AUTH_URL}/pricing?success=true`,
          cancel_url: `${process.env.AUTH_URL}/pricing?canceled=true`,
        },
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.text();
      console.error('PayPal order creation failed:', error);
      return NextResponse.json(
        { error: "Failed to create PayPal order" },
        { status: 500 }
      );
    }

    const orderData = await orderResponse.json();

    // Store order reference in database (for tracking and verification)
    await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan_id, status, paypal_order_id, created_at, updated_at)
       VALUES ($1, $2, 'trialing', $3, NOW(), NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         plan_id = EXCLUDED.plan_id,
         paypal_order_id = EXCLUDED.paypal_order_id,
         status = 'trialing',
         updated_at = NOW()`,
      [session.user.id, plan.id, orderData.id]
    );

    const approvalUrl = orderData.links?.find((link: any) => link.rel === 'approve')?.href;
    
    // Append order ID to return URL for verification
    const returnUrl = new URL(`${process.env.AUTH_URL}/pricing`);
    returnUrl.searchParams.set('success', 'true');
    returnUrl.searchParams.set('token', orderData.id);

    return NextResponse.json({
      orderId: orderData.id,
      approvalUrl: approvalUrl || orderData.links?.[0]?.href,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('PayPal credentials not configured')) {
        return NextResponse.json(
          { error: "PayPal payment is not configured. Please contact support." },
          { status: 503 }
        );
      }
      if (error.message.includes('PayPal auth failed')) {
        return NextResponse.json(
          { error: "PayPal authentication failed. Please check configuration." },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

