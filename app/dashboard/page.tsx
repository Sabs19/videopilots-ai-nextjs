'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { StatsCard } from '@/components/StatsCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PathCard } from '@/components/PathCard';
import {
  Flame,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface DashboardStats {
  completedVideos: number;
  pathsInProgress: number;
  currentStreak: number;
  longestStreak: number;
  totalLearningTime: number;
  lastActivityDate: string | null;
  totalPaths: number;
  usage: {
    learningPaths: number;
    videoSearches: number;
    analyticsViews: number;
  };
}

interface LearningPath {
  id: string;
  topic: string;
  learningPurpose: 'overview' | 'steps' | 'project-based';
  totalVideos: number;
  completedCount: number;
  createdAt: string;
  saved: boolean;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPaths, setRecentPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      loadDashboardData();
    }
  }, [status, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load stats
      const statsResponse = await fetch('/api/progress');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent paths
      const pathsResponse = await fetch('/api/learning-paths?limit=5');
      if (pathsResponse.ok) {
        const pathsData = await pathsResponse.json();
        setRecentPaths(pathsData.paths || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePath = async (id: string) => {
    if (!confirm('Are you sure you want to delete this learning path?')) {
      return;
    }

    try {
      const response = await fetch(`/api/learning-paths/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Learning path deleted');
        loadDashboardData();
      } else {
        toast.error('Failed to delete learning path');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleToggleSave = async (id: string, saved: boolean) => {
    try {
      const response = await fetch(`/api/learning-paths/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ saved: !saved }),
      });

      if (response.ok) {
        toast.success(saved ? 'Path unsaved' : 'Path saved');
        loadDashboardData();
      } else {
        toast.error('Failed to update path');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your learning overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Current Streak"
          value={stats?.currentStreak || 0}
          icon={Flame}
          description={`Longest: ${stats?.longestStreak || 0} days`}
        />
        <StatsCard
          title="Learning Time"
          value={formatTime(stats?.totalLearningTime || 0)}
          icon={Clock}
          description="Total time spent learning"
        />
        <StatsCard
          title="Completed Videos"
          value={stats?.completedVideos || 0}
          icon={CheckCircle2}
          description="Videos you've finished"
        />
        <StatsCard
          title="Learning Paths"
          value={stats?.totalPaths || 0}
          icon={BookOpen}
          description={`${stats?.usage.learningPaths || 0} created this month`}
        />
      </div>

      {/* Quick Actions */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
            <p className="text-sm text-muted-foreground">
              Start a new learning journey or continue where you left off
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Path
              </Button>
            </Link>
            <Link href="/learning-paths">
              <Button variant="outline">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Recent Learning Paths */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Recent Learning Paths</h2>
          <Link href="/learning-paths">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {recentPaths.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No learning paths yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first learning path to get started!
            </p>
            <Link href="/">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Path
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentPaths.map((path) => (
              <PathCard
                key={path.id}
                {...path}
                onDelete={handleDeletePath}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

