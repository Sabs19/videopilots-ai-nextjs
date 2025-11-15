import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify path belongs to user
    const pathResult = await pool.query(
      `SELECT video_ids FROM learning_paths WHERE id = $1 AND user_id = $2`,
      [id, session.user.id]
    );

    if (pathResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 }
      );
    }

    const videoIds = pathResult.rows[0].video_ids;

    // Get completed videos
    const progressResult = await pool.query(
      `SELECT video_id FROM user_progress
       WHERE user_id = $1 AND video_id = ANY($2)`,
      [session.user.id, videoIds]
    );

    const completedVideoIds = progressResult.rows.map((row: { video_id: string }) => row.video_id);

    return NextResponse.json({
      completedVideoIds,
      totalVideos: videoIds.length,
      completedCount: completedVideoIds.length,
    });
  } catch (error) {
    console.error("Error fetching path progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch path progress" },
      { status: 500 }
    );
  }
}

