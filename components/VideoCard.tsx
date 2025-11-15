'use client';

import { useState } from 'react';
import { Video } from '@/types/learning';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ExternalLink, Clock, Eye, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/VideoPlayer';

interface VideoCardProps {
  video: Video;
  completed?: boolean;
  onToggleComplete?: (videoId: string, completed: boolean) => void;
  showReasons?: boolean;
  index?: number;
}

export function VideoCard({
  video,
  completed = false,
  onToggleComplete,
  showReasons = false,
  index,
}: VideoCardProps) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex gap-4 p-4">
          <div className="relative flex-shrink-0 group">
            <button
              onClick={() => setIsPlayerOpen(true)}
              className="block relative"
              aria-label={`Play ${video.title}`}
            >
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-40 h-24 object-cover rounded-md"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-8 h-8 text-white" fill="white" />
              </div>
            </button>
            {index !== undefined && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
            )}
          </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
                {video.title}
              </h3>
            </a>
            {onToggleComplete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleComplete(video.id, !completed)}
                className="flex-shrink-0"
              >
                <CheckCircle2
                  className={`w-5 h-5 ${
                    completed
                      ? 'text-success fill-success'
                      : 'text-muted-foreground'
                  }`}
                />
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-2">{video.channelName}</p>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{video.duration}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span>{video.viewCount}</span>
            </div>
            {video.learningScore > 0 && (
              <Badge variant="secondary" className="text-xs">
                Score: {Math.round(video.learningScore)}
              </Badge>
            )}
          </div>

          {showReasons && video.reasons && video.reasons.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Why this video:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {video.reasons.slice(0, 2).map((reason, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-primary">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-2 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlayerOpen(true)}
              className="text-xs"
            >
              <Play className="w-3 h-3 mr-1" />
              Play Video
            </Button>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Watch on YouTube
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </Card>

    <VideoPlayer
      video={video}
      open={isPlayerOpen}
      onOpenChange={setIsPlayerOpen}
    />
    </>
  );
}

