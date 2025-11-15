'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  MoreVertical,
  Trash2,
  Share2,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface PathCardProps {
  id: string;
  topic: string;
  learningPurpose: 'overview' | 'steps' | 'project-based';
  totalVideos: number;
  completedCount: number;
  createdAt: string;
  saved: boolean;
  onDelete?: (id: string) => void;
  onToggleSave?: (id: string, saved: boolean) => void;
  onShare?: (id: string) => void;
}

const learningPurposeLabels = {
  overview: '📋 Overview',
  steps: '📝 Step-by-Step',
  'project-based': '🛠️ Project-Based',
};

export function PathCard({
  id,
  topic,
  learningPurpose,
  totalVideos,
  completedCount,
  createdAt,
  saved,
  onDelete,
  onToggleSave,
  onShare,
}: PathCardProps) {
  const progress = totalVideos > 0 ? (completedCount / totalVideos) * 100 : 0;
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link href={`/learning-paths/${id}`}>
            <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">
              {topic}
            </h3>
          </Link>
          <Badge variant="outline" className="text-xs">
            {learningPurposeLabels[learningPurpose]}
          </Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onToggleSave && (
              <DropdownMenuItem
                onClick={() => onToggleSave(id, !saved)}
                className="cursor-pointer"
              >
                {saved ? (
                  <>
                    <BookmarkCheck className="mr-2 h-4 w-4" />
                    Unsave
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </DropdownMenuItem>
            )}
            {onShare && (
              <DropdownMenuItem
                onClick={() => onShare(id)}
                className="cursor-pointer"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(id)}
                className="cursor-pointer text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{totalVideos} videos</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{completedCount} completed</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">Created {timeAgo}</p>
      </div>

      <div className="mt-4">
        <Link href={`/learning-paths/${id}`}>
          <Button variant="default" className="w-full">
            Continue Learning
          </Button>
        </Link>
      </div>
    </Card>
  );
}

