import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

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
    throw new Error('PayPal auth failed');
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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // First, check the order status before attempting to capture
    const orderCheckResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!orderCheckResponse.ok) {
      const error = await orderCheckResponse.text();
      console.error('PayPal order check failed:', error);
      return NextResponse.json(
        { error: "Order not found or invalid" },
        { status: 400 }
      );
    }

    const orderData = await orderCheckResponse.json();

    // Only proceed if order is APPROVED (ready to capture)
    // If order is already COMPLETED, that's fine too
    // But if it's CREATED, CANCELED, or other status, don't capture
    if (orderData.status === 'CREATED') {
      // Order exists but hasn't been approved by user
      return NextResponse.json(
        { error: "Payment not approved by user" },
        { status: 400 }
      );
    }

    if (orderData.status === 'CANCELED' || orderData.status === 'VOIDED') {
      return NextResponse.json(
        { error: "Payment was canceled" },
        { status: 400 }
      );
    }

    // If already completed, verify it's for the correct user
    if (orderData.status === 'COMPLETED') {
      // Verify this order belongs to the current user by checking database
      const existingOrder = await pool.query(
        'SELECT user_id FROM user_subscriptions WHERE paypal_order_id = $1',
        [orderId]
      );

      if (existingOrder.rows.length > 0 && existingOrder.rows[0].user_id !== session.user.id) {
        return NextResponse.json(
          { error: "Order does not belong to current user" },
          { status: 403 }
        );
      }

      // Order already completed, return success without capturing again
      if (existingOrder.rows.length > 0) {
        return NextResponse.json({
          success: true,
          message: "Payment already processed",
        });
      }
    }

    // Only capture if order is APPROVED
    if (orderData.status !== 'APPROVED' && orderData.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: `Payment not ready. Status: ${orderData.status}` },
        { status: 400 }
      );
    }

    // Capture the order (only if not already completed)
    let captureData;
    if (orderData.status === 'APPROVED') {
      const captureResponse = await fetch(
        `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!captureResponse.ok) {
        const error = await captureResponse.text();
        console.error('PayPal capture failed:', error);
        return NextResponse.json(
          { error: "Payment capture failed" },
          { status: 400 }
        );
      }

      captureData = await captureResponse.json();

      if (captureData.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: "Payment not completed" },
          { status: 400 }
        );
      }
    } else {
      // Order already completed, use existing order data
      captureData = orderData;
    }

    // Get the purchase unit to extract plan info
    const purchaseUnit = captureData.purchase_units[0];
    const referenceId = purchaseUnit.reference_id;
    const planName = referenceId.split('-')[1]; // Extract from "subscription-{planName}-{billingPeriod}"
    const billingPeriod = referenceId.split('-')[2];

    // Get plan details
    const planResult = await pool.query(
      'SELECT id, name FROM subscription_plans WHERE name = $1',
      [planName]
    );

    if (planResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 400 }
      );
    }

    const plan = planResult.rows[0];

    // Calculate subscription end date
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingPeriod === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Update user subscription
    await pool.query('BEGIN');

    try {
      // Update user_profiles subscription_tier
      await pool.query(
        'UPDATE user_profiles SET subscription_tier = $1, updated_at = NOW() WHERE id = $2',
        [planName, session.user.id]
      );

      // Update or create user_subscriptions
      await pool.query(
        `INSERT INTO user_subscriptions 
         (user_id, plan_id, status, paypal_order_id, current_period_start, current_period_end, created_at, updated_at)
         VALUES ($1, $2, 'active', $3, $4, $5, NOW(), NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           plan_id = EXCLUDED.plan_id,
           status = 'active',
           paypal_order_id = EXCLUDED.paypal_order_id,
           current_period_start = EXCLUDED.current_period_start,
           current_period_end = EXCLUDED.current_period_end,
           updated_at = NOW()`,
        [session.user.id, plan.id, orderId, now, periodEnd]
      );

      await pool.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: "Subscription activated successfully",
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

