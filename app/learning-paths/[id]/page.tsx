'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { VideoCard } from '@/components/VideoCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Share2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Video } from '@/types/learning';

interface LearningPathDetail {
  id: string;
  topic: string;
  learningPurpose: 'overview' | 'steps' | 'project-based';
  saved: boolean;
  createdAt: string;
  completedCount: number;
  totalVideos: number;
  videos: Array<Video & { completed: boolean }>;
}

const learningPurposeLabels = {
  overview: '📋 Overview',
  steps: '📝 Step-by-Step',
  'project-based': '🛠️ Project-Based',
};

export default function LearningPathDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const pathId = params?.id as string;

  const [path, setPath] = useState<LearningPathDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && pathId) {
      loadPath();
    }
  }, [status, router, pathId]);

  const loadPath = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/learning-paths/${pathId}`);
      if (response.ok) {
        const data = await response.json();
        setPath(data);
      } else if (response.status === 404) {
        toast.error('Learning path not found');
        router.push('/learning-paths');
      } else {
        toast.error('Failed to load learning path');
      }
    } catch (error) {
      console.error('Error loading path:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (videoId: string, completed: boolean) => {
    try {
      const endpoint = completed
        ? `/api/progress?videoId=${videoId}`
        : '/api/progress';

      const method = completed ? 'POST' : 'DELETE';
      const body = completed
        ? JSON.stringify({ videoId, learningPathId: pathId })
        : undefined;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (response.ok) {
        loadPath(); // Reload to get updated progress
      } else {
        toast.error('Failed to update progress');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleToggleSave = async () => {
    if (!path) return;

    try {
      const response = await fetch(`/api/learning-paths/${pathId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ saved: !path.saved }),
      });

      if (response.ok) {
        toast.success(path.saved ? 'Path unsaved' : 'Path saved');
        loadPath();
      } else {
        toast.error('Failed to update path');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this learning path?')) {
      return;
    }

    try {
      const response = await fetch(`/api/learning-paths/${pathId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Learning path deleted');
        router.push('/learning-paths');
      } else {
        toast.error('Failed to delete learning path');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleShare = () => {
    // TODO: Implement sharing functionality
    toast.info('Sharing feature coming soon!');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!session || !path) {
    return null;
  }

  const progress = path.totalVideos > 0 ? (path.completedCount / path.totalVideos) * 100 : 0;
  const bestVideo = path.videos[0] as Video & { completed: boolean } | undefined; // First video is typically the best one

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/learning-paths">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning Paths
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{path.topic}</h1>
              <Badge variant="outline">{learningPurposeLabels[path.learningPurpose]}</Badge>
            </div>
            <p className="text-muted-foreground mb-4">
              {path.totalVideos} videos • {path.completedCount} completed
            </p>

            {/* Progress Bar */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleSave}
            >
              {path.saved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 mr-2" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Best Video Highlight */}
      {bestVideo && (
        <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Recommended Starting Point</h2>
          </div>
          <VideoCard
            video={bestVideo}
            completed={bestVideo?.completed || false}
            onToggleComplete={handleToggleComplete}
            showReasons={true}
            index={0}
          />
        </Card>
      )}

      {/* Video List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Learning Path</h2>
        {path.videos.map((video, index) => (
          <VideoCard
            key={`${video.id}-${index}`}
            video={video}
            completed={video.completed}
            onToggleComplete={handleToggleComplete}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

