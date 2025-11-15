import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { z } from "zod";

const videoSchema = z.object({
  id: z.string(),
  title: z.string(),
  channelName: z.string(),
  thumbnailUrl: z.string(),
  duration: z.string(),
  viewCount: z.string(),
  publishedAt: z.string(),
  description: z.string().optional(),
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
    const video = videoSchema.parse(body);

    // Insert or update video cache
    await pool.query(
      `INSERT INTO video_cache (
        video_id, title, channel_name, thumbnail_url, duration, 
        view_count, published_at, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (video_id) 
      DO UPDATE SET
        title = EXCLUDED.title,
        channel_name = EXCLUDED.channel_name,
        thumbnail_url = EXCLUDED.thumbnail_url,
        duration = EXCLUDED.duration,
        view_count = EXCLUDED.view_count,
        published_at = EXCLUDED.published_at,
        description = EXCLUDED.description,
        cached_at = NOW()`,
      [
        video.id,
        video.title,
        video.channelName,
        video.thumbnailUrl,
        video.duration,
        video.viewCount,
        video.publishedAt,
        video.description || null,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error caching video:", error);
    return NextResponse.json(
      { error: "Failed to cache video" },
      { status: 500 }
    );
  }
}

