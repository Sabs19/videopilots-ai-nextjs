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

    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resourceType') as 'learning_path' | 'video_search' | 'analytics_view' | null;

    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    let query = `
      SELECT resource_type, SUM(count) as total_count
      FROM usage_tracking
      WHERE user_id = $1 AND period_start = $2
    `;
    const params: any[] = [session.user.id, periodStart.toISOString()];

    if (resourceType) {
      query += ' AND resource_type = $3';
      params.push(resourceType);
    }

    query += ' GROUP BY resource_type';

    const result = await pool.query(query, params);

    const usage: Record<string, number> = {
      learning_paths: 0,
      video_search: 0,
      analytics_view: 0,
    };

    result.rows.forEach((row: { resource_type: string; total_count: string }) => {
      const key = row.resource_type === 'learning_path' ? 'learning_paths' : 
                  row.resource_type === 'video_search' ? 'video_search' : 
                  'analytics_view';
      usage[key] = parseInt(row.total_count) || 0;
    });

    return NextResponse.json(usage);
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}

