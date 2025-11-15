import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update subscription to canceled status
    // The subscription will remain active until current_period_end
    await pool.query(
      `UPDATE user_subscriptions 
       SET status = 'canceled', 
           cancel_at_period_end = true,
           updated_at = NOW()
       WHERE user_id = $1 AND status = 'active'`,
      [session.user.id]
    );

    return NextResponse.json({
      success: true,
      message: "Subscription canceled. You'll retain access until the end of your billing period.",
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

