import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { z } from "zod";

const createPathSchema = z.object({
  topic: z.string().min(1),
  learningPurpose: z.enum(['overview', 'steps', 'project-based']),
  videoIds: z.array(z.string()).min(1),
});

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
    const saved = searchParams.get('saved') === 'true';

    let query = `
      SELECT 
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
      WHERE lp.user_id = $1
    `;

    const params: any[] = [session.user.id];

    if (saved) {
      query += ' AND lp.saved = true';
    }

    query += ' GROUP BY lp.id ORDER BY lp.created_at DESC';

    const result = await pool.query(query, params);

    const paths = result.rows.map((row: {
      id: string;
      topic: string;
      learning_purpose: string;
      video_ids: string[];
      saved: boolean;
      created_at: string;
      completed_count: string;
      total_videos: number;
    }) => ({
      id: row.id,
      topic: row.topic,
      learningPurpose: row.learning_purpose,
      videoIds: row.video_ids,
      saved: row.saved,
      createdAt: row.created_at,
      completedCount: parseInt(row.completed_count) || 0,
      totalVideos: parseInt(String(row.total_videos)) || 0,
    }));

    return NextResponse.json({ paths });
  } catch (error) {
    console.error("Error fetching learning paths:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning paths" },
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
    const { topic, learningPurpose, videoIds } = createPathSchema.parse(body);

    const result = await pool.query(
      `INSERT INTO learning_paths (user_id, topic, learning_purpose, video_ids, saved)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, topic, learning_purpose, video_ids, saved, created_at`,
      [session.user.id, topic, learningPurpose, videoIds]
    );

    const path = result.rows[0];

    return NextResponse.json({
      id: path.id,
      topic: path.topic,
      learningPurpose: path.learning_purpose,
      videoIds: path.video_ids,
      saved: path.saved,
      createdAt: path.created_at,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating learning path:", error);
    return NextResponse.json(
      { error: "Failed to create learning path" },
      { status: 500 }
    );
  }
}

