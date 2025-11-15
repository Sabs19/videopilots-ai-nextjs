'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PathCard } from '@/components/PathCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Search, Filter, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface LearningPath {
  id: string;
  topic: string;
  learningPurpose: 'overview' | 'steps' | 'project-based';
  totalVideos: number;
  completedCount: number;
  createdAt: string;
  saved: boolean;
}

function LearningPathsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [filteredPaths, setFilteredPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');
  const [savedFilter, setSavedFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      loadPaths();
    }
  }, [status, router]);

  useEffect(() => {
    filterPaths();
  }, [paths, searchQuery, purposeFilter, savedFilter]);

  const loadPaths = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/learning-paths');
      if (response.ok) {
        const data = await response.json();
        setPaths(data.paths || []);
      } else {
        toast.error('Failed to load learning paths');
      }
    } catch (error) {
      console.error('Error loading paths:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filterPaths = () => {
    let filtered = [...paths];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((path) =>
        path.topic.toLowerCase().includes(query)
      );
    }

    // Purpose filter
    if (purposeFilter !== 'all') {
      filtered = filtered.filter((path) => path.learningPurpose === purposeFilter);
    }

    // Saved filter
    if (savedFilter === 'saved') {
      filtered = filtered.filter((path) => path.saved);
    } else if (savedFilter === 'unsaved') {
      filtered = filtered.filter((path) => !path.saved);
    }

    setFilteredPaths(filtered);
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
        loadPaths();
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
        loadPaths();
      } else {
        toast.error('Failed to update path');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-muted rounded" />
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Learning Paths</h1>
          <p className="text-muted-foreground">
            Manage and continue your learning journeys
          </p>
        </div>
        <Link href="/">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Path
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search learning paths..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={purposeFilter} onValueChange={setPurposeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Purposes</SelectItem>
              <SelectItem value="overview">📋 Overview</SelectItem>
              <SelectItem value="steps">📝 Step-by-Step</SelectItem>
              <SelectItem value="project-based">🛠️ Project-Based</SelectItem>
            </SelectContent>
          </Select>
          <Select value={savedFilter} onValueChange={setSavedFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Saved" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Paths</SelectItem>
              <SelectItem value="saved">Saved Only</SelectItem>
              <SelectItem value="unsaved">Not Saved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Paths Grid */}
      {filteredPaths.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {paths.length === 0 ? 'No learning paths yet' : 'No paths match your filters'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {paths.length === 0
              ? 'Create your first learning path to get started!'
              : 'Try adjusting your search or filters'}
          </p>
          {paths.length === 0 && (
            <Link href="/">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Path
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPaths.map((path) => (
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
  );
}

export default function LearningPathsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    }>
      <LearningPathsContent />
    </Suspense>
  );
}

