'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VideoCard } from '@/components/VideoCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { LearningPreferences, Video, LearningPath } from '@/types/learning';
import { searchYouTubeVideos } from '@/lib/services/youtube';
import { saveLearningPath, cacheVideoMetadata } from '@/lib/services/database';
import { toast } from 'sonner';
import Link from 'next/link';
import { SearchProgress, SearchStep } from '@/components/SearchProgress';

function ResultsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [preferences, setPreferences] = useState<LearningPreferences | null>(null);
  const [searchStep, setSearchStep] = useState<SearchStep>('analyzing');
  const [searchMessage, setSearchMessage] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && searchParams) {
      const pathId = searchParams.get('pathId');
      const topic = searchParams.get('topic');
      
      // If pathId exists, load saved path
      if (pathId) {
        loadSavedPath(pathId);
      } 
      // If topic exists, generate new results
      else if (topic) {
      loadResults();
      } 
      // No valid params, redirect to learning paths
      else {
        router.push('/learning-paths');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router, searchParams]);

  const loadSavedPath = async (pathId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/learning-paths/${pathId}`);
      if (!response.ok) {
        // Show 404 state instead of redirecting
        setLoading(false);
        if (response.status === 404) {
          toast.error('Learning path not found');
        } else {
          toast.error('Failed to load learning path');
        }
        return;
      }

      const data = await response.json();
      
      // Convert saved path data to LearningPath format
      if (data.videos && data.videos.length > 0) {
        // Map API response to Video type (add missing fields)
        const mappedVideos: Video[] = data.videos.map((video: any) => ({
          id: video.id,
          title: video.title,
          channelName: video.channelName,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          viewCount: video.viewCount,
          publishedAt: video.publishedAt,
          description: video.description || '',
          url: video.url,
          learningScore: 0, // Not stored in saved paths
          reasons: [], // Not stored in saved paths
        }));

        const bestVideo = mappedVideos[0];
        const pathVideos = mappedVideos.slice(1);
        
        // Calculate estimated time
        const totalMinutes = mappedVideos.reduce((acc: number, video: Video) => {
          const duration = video.duration;
          const match = duration.match(/(\d+):(\d+)/);
          if (match) {
            return acc + parseInt(match[1]) * 60 + parseInt(match[2]);
          }
          return acc;
        }, 0);

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const estimatedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        const purposeDescriptions = {
          overview: 'a comprehensive overview',
          steps: 'a step-by-step tutorial approach',
          'project-based': 'a hands-on project-based learning experience'
        };
        const pathDescription = `A curated learning path for ${data.topic} with ${purposeDescriptions[data.learningPurpose as keyof typeof purposeDescriptions]}. This path includes ${mappedVideos.length} carefully selected videos.`;

        const path: LearningPath = {
          bestVideo,
          pathVideos,
          estimatedTotalTime: estimatedTime,
          pathDescription,
        };

        setLearningPath(path);

        // Set preferences from saved path
        const prefs: LearningPreferences = {
          topic: data.topic,
          learningPurpose: data.learningPurpose,
          duration: '2-5', // Default since not stored
          language: 'en', // Default since not stored
        };
        setPreferences(prefs);
      } else {
        // No videos found - show 404 state
        setLoading(false);
        // Don't redirect, let the 404 UI show
      }
    } catch (error) {
      console.error('Error loading saved path:', error);
      toast.error('Failed to load learning path');
      setLoading(false);
      // Don't redirect - let 404 UI show
    }
  };

  const autoSavePath = async (path: LearningPath, prefs: LearningPreferences) => {
    if (!session?.user) return;
    
    // Don't auto-save if pathId already exists (already saved)
    if (searchParams?.get('pathId')) {
      return;
    }

    try {
      // Get all video IDs
      const allVideos = [path.bestVideo, ...path.pathVideos];
      const videoIds = allVideos.map((v) => v.id);

      // Cache all videos first
      const cachePromises = allVideos.map((video) => cacheVideoMetadata(video));
      await Promise.all(cachePromises);

      // Save to database
      const pathId = await saveLearningPath(
        prefs.topic,
        prefs.learningPurpose,
        videoIds
      );

      if (pathId) {
        // Update URL to include pathId so it persists
        const params = new URLSearchParams(searchParams?.toString() || '');
        params.set('pathId', pathId);
        router.replace(`/results?${params.toString()}`, { scroll: false });
      }
    } catch (error) {
      console.error('Error auto-saving path:', error);
      // Don't show error toast for auto-save, just log it
    }
  };

  const loadResults = async () => {
    try {
      setLoading(true);
      setSearchStep('analyzing');
      setSearchMessage('Understanding your learning goals...');

      // Get preferences from URL
      const prefs: LearningPreferences = {
        topic: searchParams?.get('topic') || '',
        learningPurpose: (searchParams?.get('learningPurpose') as any) || 'overview',
        duration: (searchParams?.get('duration') as any) || '2-5',
        language: searchParams?.get('language') || 'en',
        intent: searchParams?.get('intent') || undefined,
      };

      if (!prefs.topic) {
        toast.error('Invalid request');
        router.push('/');
        return;
      }

      setPreferences(prefs);

      // Simulate progress: Analyzing
      await new Promise(resolve => setTimeout(resolve, 500));
      setSearchStep('generating');
      setSearchMessage('Creating your personalized course structure...');

      // Simulate progress: Generating
      await new Promise(resolve => setTimeout(resolve, 800));
      setSearchStep('searching');
      setSearchMessage('Finding the best videos on YouTube...');

      // Search YouTube videos
      const videos = await searchYouTubeVideos(prefs);

      if (videos.length === 0) {
        // No videos found - show error state
        setSearchStep('error');
        setSearchMessage('No videos found. Try a different topic or check your search terms.');
        setLoading(false);
        toast.error('No videos found. Try a different topic.');
        return;
      }

      // Simulate progress: Scoring
      setSearchStep('scoring');
      setSearchMessage(`Evaluating ${videos.length} videos for quality and relevance...`);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate progress: Organizing
      setSearchStep('organizing');
      setSearchMessage('Arranging videos in the perfect learning order...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create learning path structure
      const bestVideo = videos[0];
      const pathVideos = videos.slice(1, 11); // Top 10 videos after the best one

      // Calculate estimated time
      const totalMinutes = videos.reduce((acc, video) => {
        const duration = video.duration;
        const match = duration.match(/(\d+):(\d+)/);
        if (match) {
          return acc + parseInt(match[1]) * 60 + parseInt(match[2]);
        }
        return acc;
      }, 0);

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const estimatedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      // Generate path description based on purpose
      const purposeDescriptions = {
        overview: 'a comprehensive overview',
        steps: 'a step-by-step tutorial approach',
        'project-based': 'a hands-on project-based learning experience'
      };
      const pathDescription = `A curated learning path for ${prefs.topic} with ${purposeDescriptions[prefs.learningPurpose]}. This path includes ${videos.length} carefully selected videos.`;

      const path: LearningPath = {
        bestVideo,
        pathVideos,
        estimatedTotalTime: estimatedTime,
        pathDescription,
      };

      setLearningPath(path);

      // Show completion
      setSearchStep('complete');
      setSearchMessage('Your learning path is ready!');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Auto-save the learning path
      await autoSavePath(path, prefs);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading results:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Show error state
      setSearchStep('error');
      setSearchMessage(
        errorMessage.includes('quota') || errorMessage.includes('API')
          ? 'YouTube API limit reached. Please try again later or check your API configuration.'
          : errorMessage.includes('Unauthorized')
          ? 'Please make sure you are logged in.'
          : 'Something went wrong while searching for videos. Please try again.'
      );
      
      toast.error(`Failed to load learning path: ${errorMessage}`);
      setLoading(false);
    }
  };

  const handleSavePath = async () => {
    if (!learningPath || !preferences || !session?.user) return;

    try {
      setSaving(true);

      // Get all video IDs
      const allVideos = [learningPath.bestVideo, ...learningPath.pathVideos];
      const videoIds = allVideos.map((v) => v.id);

      // Cache all videos first
      const cachePromises = allVideos.map((video) => cacheVideoMetadata(video));
      await Promise.all(cachePromises);

      // Save to database
      const pathId = await saveLearningPath(
        preferences.topic,
        preferences.learningPurpose,
        videoIds
      );

      if (pathId) {
        toast.success('Learning path saved!');
        router.push(`/learning-paths/${pathId}`);
      } else {
        toast.error('Failed to save learning path');
      }
    } catch (error) {
      console.error('Error saving path:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || (loading && !learningPath)) {
    return (
      <SearchProgress 
        step={searchStep} 
        message={searchMessage}
        topic={preferences?.topic}
      />
    );
  }

  if (!session) {
    return null;
  }

  if (!learningPath || !preferences) {
    // Still loading - show progress
    if (loading) {
      return (
        <SearchProgress 
          step={searchStep} 
          message={searchMessage}
          topic={preferences?.topic || searchParams?.get('topic') || undefined}
        />
      );
    }
    
    // No data and not loading - show 404/not found page
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-6">
            <h1 className="text-6xl font-bold text-muted-foreground mb-2">404</h1>
            <h2 className="text-2xl font-semibold mb-2">Learning Path Not Found</h2>
            <p className="text-muted-foreground max-w-md">
              We couldn't find the learning path you're looking for. It may have been deleted or the link is invalid.
            </p>
          </div>
          
          <div className="flex gap-4">
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Create New Learning Path
              </Button>
            </Link>
            <Link href="/learning-paths">
              <Button variant="outline">
                View My Learning Paths
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{preferences.topic}</h1>
              <Badge variant="outline">
                {preferences.learningPurpose === 'overview' && '📋 Overview'}
                {preferences.learningPurpose === 'steps' && '📝 Step-by-Step'}
                {preferences.learningPurpose === 'project-based' && '🛠️ Project-Based'}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-4">
              {learningPath.pathVideos.length + 1} videos • {learningPath.estimatedTotalTime}
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {learningPath.pathDescription}
            </p>
          </div>

          <Button onClick={handleSavePath} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Path
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Best Video Highlight */}
      <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Recommended Starting Point</h2>
        </div>
        <VideoCard
          video={learningPath.bestVideo}
          showReasons={true}
          index={0}
        />
      </Card>

      {/* Learning Path */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Learning Path</h2>
        {learningPath.pathVideos.map((video, index) => (
          <VideoCard
            key={`${video.id}-${index}`}
            video={video}
            index={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-32 bg-muted rounded-md mb-4" />
            <div className="h-9 w-64 bg-muted rounded-md mb-3" />
            <div className="h-96 bg-muted rounded-md" />
          </div>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}

