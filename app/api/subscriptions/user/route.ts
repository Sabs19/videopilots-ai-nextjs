import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get subscription from user_subscriptions
    const subscriptionResult = await pool.query(
      `SELECT us.*, sp.name as plan_name, sp.price_monthly, sp.price_yearly, sp.features
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1`,
      [session.user.id]
    );

    // If subscription exists and is active/trialing, return it
    if (subscriptionResult.rows.length > 0) {
      const subscription = subscriptionResult.rows[0];
      // Only return subscription if it's active or trialing
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        return NextResponse.json(subscription);
      }
      // If subscription is canceled/expired, fall through to check user_profiles
    }

    // No active subscription, check user_profiles for tier
    const userProfileResult = await pool.query(
      `SELECT up.subscription_tier, sp.id as plan_id, sp.name as plan_name, 
              sp.price_monthly, sp.price_yearly, sp.features
       FROM user_profiles up
       LEFT JOIN subscription_plans sp ON sp.name = up.subscription_tier
       WHERE up.id = $1`,
      [session.user.id]
    );

    if (userProfileResult.rows.length > 0) {
      const profile = userProfileResult.rows[0];
      // Return a subscription-like object based on user_profiles tier
      return NextResponse.json({
        plan_name: profile.subscription_tier || 'free',
        plan_id: profile.plan_id,
        price_monthly: profile.price_monthly,
        price_yearly: profile.price_yearly,
        features: profile.features,
        status: 'active', // Treat profile tier as active
      });
    }

    // Default to free tier
    return NextResponse.json(null);
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

