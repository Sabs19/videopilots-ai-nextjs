import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { z } from "zod";

const trackUsageSchema = z.object({
  resourceType: z.enum(['learning_path', 'video_search', 'analytics_view']),
});

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
    const { resourceType } = trackUsageSchema.parse(body);

    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    // Try to insert or update
    const result = await pool.query(
      `INSERT INTO usage_tracking (user_id, resource_type, count, period_start)
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (user_id, resource_type, period_start)
       DO UPDATE SET count = usage_tracking.count + 1
       RETURNING *`,
      [session.user.id, resourceType, periodStart.toISOString()]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error tracking usage:", error);
    return NextResponse.json(
      { error: "Failed to track usage" },
      { status: 500 }
    );
  }
}

