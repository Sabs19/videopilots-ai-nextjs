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

    // Get learning path
    const pathResult = await pool.query(
      `SELECT 
        lp.id,
        lp.topic,
        lp.learning_purpose,
        lp.video_ids,
        lp.saved,
        lp.created_at,
        COUNT(DISTINCT up.video_id) as completed_count,
        array_length(lp.video_ids, 1) as total_videos
      FROM learning_paths lp
      LEFT JOIN user_progress up ON up.user_id = $1 AND up.video_id = ANY(lp.video_ids)
      WHERE lp.id = $2 AND lp.user_id = $1
      GROUP BY lp.id`,
      [session.user.id, id]
    );

    if (pathResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 }
      );
    }

    const path = pathResult.rows[0];

    // Get video details from cache
    const videoIds = path.video_ids;
    const videoResult = await pool.query(
      `SELECT 
        video_id,
        title,
        channel_name,
        thumbnail_url,
        duration,
        view_count,
        published_at,
        description
      FROM video_cache
      WHERE video_id = ANY($1)
      ORDER BY array_position($1, video_id)`,
      [videoIds]
    );

    // Get completed videos
    const progressResult = await pool.query(
      `SELECT video_id FROM user_progress
       WHERE user_id = $1 AND video_id = ANY($2)`,
      [session.user.id, videoIds]
    );

    const completedVideoIds = new Set(
      progressResult.rows.map((row: { video_id: string }) => row.video_id)
    );

    const videos = videoResult.rows.map((row: {
      video_id: string;
      title: string;
      channel_name: string;
      thumbnail_url: string;
      duration: string;
      view_count: string;
      published_at: string;
      description: string | null;
    }) => ({
      id: row.video_id,
      title: row.title,
      channelName: row.channel_name,
      thumbnailUrl: row.thumbnail_url,
      duration: row.duration,
      viewCount: row.view_count,
      publishedAt: row.published_at,
      description: row.description,
      url: `https://www.youtube.com/watch?v=${row.video_id}`,
      completed: completedVideoIds.has(row.video_id),
    }));

    return NextResponse.json({
      id: path.id,
      topic: path.topic,
      learningPurpose: path.learning_purpose,
      saved: path.saved,
      createdAt: path.created_at,
      completedCount: parseInt(path.completed_count) || 0,
      totalVideos: parseInt(path.total_videos) || 0,
      videos,
    });
  } catch (error) {
    console.error("Error fetching learning path:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning path" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const result = await pool.query(
      `DELETE FROM learning_paths
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting learning path:", error);
    return NextResponse.json(
      { error: "Failed to delete learning path" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await request.json();
    const { saved } = body;

    if (typeof saved !== 'boolean') {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE learning_paths
       SET saved = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, saved`,
      [saved, id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, saved: result.rows[0].saved });
  } catch (error) {
    console.error("Error updating learning path:", error);
    return NextResponse.json(
      { error: "Failed to update learning path" },
      { status: 500 }
    );
  }
}

