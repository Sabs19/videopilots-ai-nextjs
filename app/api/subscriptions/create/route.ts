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
    const rawAmount = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
    
    // Validate amount
    if (!rawAmount || rawAmount <= 0 || isNaN(Number(rawAmount))) {
      console.error('Invalid amount:', { rawAmount, planName, billingPeriod });
      return NextResponse.json(
        { error: "Invalid subscription amount" },
        { status: 400 }
      );
    }

    // Format amount to exactly 2 decimal places (PayPal requirement)
    const amount = parseFloat(rawAmount.toString()).toFixed(2);
    
    // Validate formatted amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      console.error('Invalid formatted amount:', { amount, rawAmount });
      return NextResponse.json(
        { error: "Invalid subscription amount format" },
        { status: 400 }
      );
    }
    
    const currency = 'USD';

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Validate AUTH_URL is set
    if (!process.env.AUTH_URL) {
      return NextResponse.json(
        { error: "AUTH_URL not configured" },
        { status: 500 }
      );
    }

    // Build PayPal order payload
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `subscription-${planName}-${billingPeriod}`,
        description: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan - ${billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'}`,
        amount: {
          currency_code: currency,
          value: amount, // Already formatted to 2 decimal places
        },
      }],
      application_context: {
        brand_name: 'VideoPilots AI',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.AUTH_URL}/pricing?success=true`,
        cancel_url: `${process.env.AUTH_URL}/pricing?canceled=true`,
      },
    };

    // Log order payload for debugging (without sensitive data)
    console.log('Creating PayPal order:', {
      planName,
      billingPeriod,
      amount,
      currency,
      return_url: orderPayload.application_context.return_url,
    });

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `subscription-${session.user.id}-${Date.now()}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      console.error('PayPal order creation failed:', {
        status: orderResponse.status,
        statusText: orderResponse.statusText,
        error: errorData,
        orderPayload: {
          amount,
          currency,
          planName,
          billingPeriod,
        },
      });
      
      // Return more specific error message
      const errorMessage = errorData?.details?.[0]?.description || 
                          errorData?.message || 
                          'Failed to create PayPal order';
      
      return NextResponse.json(
        { error: errorMessage },
        { status: orderResponse.status || 500 }
      );
    }

    const orderData = await orderResponse.json();

    // Don't store order in database yet - only store after successful payment verification
    // This prevents showing "trialing" status for orders that are never completed

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

