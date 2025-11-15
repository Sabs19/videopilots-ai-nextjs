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

    // Get user progress stats
    const progressResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT video_id) as completed_videos,
        COUNT(DISTINCT learning_path_id) as paths_in_progress
      FROM user_progress
      WHERE user_id = $1`,
      [session.user.id]
    );

    // Get user profile stats
    const profileResult = await pool.query(
      `SELECT 
        current_streak,
        longest_streak,
        total_learning_time,
        last_activity_date
      FROM user_profiles
      WHERE id = $1`,
      [session.user.id]
    );

    // Get learning paths count
    const pathsResult = await pool.query(
      `SELECT COUNT(*) as total_paths
       FROM learning_paths
       WHERE user_id = $1`,
      [session.user.id]
    );

    // Get usage for current month
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const usageResult = await pool.query(
      `SELECT resource_type, SUM(count) as total_count
       FROM usage_tracking
       WHERE user_id = $1 AND period_start = $2
       GROUP BY resource_type`,
      [session.user.id, periodStart.toISOString()]
    );

    const usage: Record<string, number> = {};
    usageResult.rows.forEach((row: { resource_type: string; total_count: string }) => {
      usage[row.resource_type] = parseInt(row.total_count) || 0;
    });

    const progress = progressResult.rows[0] as {
      completed_videos: string;
      paths_in_progress: string;
    } | undefined;
    const profile = profileResult.rows[0] as {
      current_streak: string;
      longest_streak: string;
      total_learning_time: string;
      last_activity_date: string | null;
    } | undefined;
    const paths = pathsResult.rows[0] as {
      total_paths: string;
    } | undefined;

    return NextResponse.json({
      completedVideos: parseInt(progress?.completed_videos || '0') || 0,
      pathsInProgress: parseInt(progress?.paths_in_progress || '0') || 0,
      currentStreak: parseInt(profile?.current_streak || '0') || 0,
      longestStreak: parseInt(profile?.longest_streak || '0') || 0,
      totalLearningTime: parseInt(profile?.total_learning_time || '0') || 0,
      lastActivityDate: profile?.last_activity_date || null,
      totalPaths: parseInt(paths?.total_paths || '0') || 0,
      usage: {
        learningPaths: usage.learning_path || 0,
        videoSearches: usage.video_search || 0,
        analyticsViews: usage.analytics_view || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
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
    const { videoId, learningPathId } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

    // Insert progress
    await pool.query(
      `INSERT INTO user_progress (user_id, video_id, learning_path_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, video_id) DO NOTHING`,
      [session.user.id, videoId, learningPathId || null]
    );

    // Update user profile stats
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `UPDATE user_profiles
       SET 
         total_learning_time = total_learning_time + 1,
         last_activity_date = $1
       WHERE id = $2`,
      [today, session.user.id]
    );

    // Update streak
    const profileResult = await pool.query(
      `SELECT last_activity_date, current_streak FROM user_profiles WHERE id = $1`,
      [session.user.id]
    );

    const profile = profileResult.rows[0] as { last_activity_date: string | null; current_streak: number } | undefined;
    const lastActivity = profile?.last_activity_date
      ? new Date(profile.last_activity_date).toISOString().split('T')[0]
      : null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (lastActivity === today) {
      // Already updated today, keep current streak
      newStreak = profile?.current_streak || 1;
    } else if (lastActivity === yesterdayStr) {
      // Continuing streak
      newStreak = (profile?.current_streak || 0) + 1;
    }

    await pool.query(
      `UPDATE user_profiles
       SET 
         current_streak = $1,
         longest_streak = GREATEST(longest_streak, $1)
       WHERE id = $2`,
      [newStreak, session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving progress:", error);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

    await pool.query(
      `DELETE FROM user_progress
       WHERE user_id = $1 AND video_id = $2`,
      [session.user.id, videoId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing progress:", error);
    return NextResponse.json(
      { error: "Failed to remove progress" },
      { status: 500 }
    );
  }
}

