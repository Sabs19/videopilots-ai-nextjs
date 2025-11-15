import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
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

    // If subscription exists, check its status
    if (subscriptionResult.rows.length > 0) {
      const subscription = subscriptionResult.rows[0];
      console.log(`[Subscription API] Found subscription for user ${session.user.id}:`, {
        plan_name: subscription.plan_name,
        status: subscription.status,
        id: subscription.id
      });
      
      // Only return subscription if it's active or trialing
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        const response = NextResponse.json(subscription);
        // Prevent caching to ensure fresh data
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;
      }
      
      // If subscription is canceled/expired/past_due, fall through to check user_profiles
      console.log(`[Subscription API] Subscription status is '${subscription.status}', falling back to user_profiles`);
    } else {
      console.log(`[Subscription API] No subscription record found for user ${session.user.id}, checking user_profiles`);
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
      const tier = profile.subscription_tier || 'free';
      console.log(`[Subscription API] Returning tier from user_profiles: ${tier}`);
      
      // Return a subscription-like object based on user_profiles tier
      const response = NextResponse.json({
        plan_name: tier,
        plan_id: profile.plan_id,
        price_monthly: profile.price_monthly,
        price_yearly: profile.price_yearly,
        features: profile.features,
        status: 'active', // Treat profile tier as active
      });
      // Prevent caching to ensure fresh data
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }

    // Default to free tier
    console.log(`[Subscription API] No user profile found, returning null (defaults to free)`);
    const response = NextResponse.json(null);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

