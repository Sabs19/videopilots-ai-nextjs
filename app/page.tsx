'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Sparkles, TrendingUp } from 'lucide-react';
import { LearningPreferences } from '@/types/learning';
import { trackUsage, getUsageCount } from '@/lib/services/subscription';
import { canPerformAction } from '@/lib/services/subscription';
import { AuthDialog } from '@/components/AuthDialog';
import { UsageLimitDialog } from '@/components/UsageLimitDialog';
import { toast } from 'sonner';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<LearningPreferences>({
    topic: '',
    learningPurpose: 'overview',
    duration: '2-5',
    language: 'en',
  });
  const [loading, setLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    // Check if signin param is in URL
    if (searchParams?.get('signin') === 'true') {
      setShowAuthDialog(true);
    }

    // Load usage count if authenticated
    if (session?.user) {
      loadUsageCount();
    }
  }, [searchParams, session]);

  const loadUsageCount = async () => {
    try {
      const count = await getUsageCount('learning_path');
      setUsageCount(count);
    } catch (error) {
      console.error('Error loading usage count:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences.topic) return;

    // Check if user is authenticated
    if (!session?.user) {
      setShowAuthDialog(true);
      return;
    }

    setLoading(true);

    try {
      // Check if user can create learning path
      const canCreate = await canPerformAction('create_learning_path');
      if (!canCreate) {
        setShowLimitDialog(true);
        setLoading(false);
        return;
      }

      // Track usage
      await trackUsage('learning_path');
      await loadUsageCount();
      
      // Navigate to results with preferences
      const params = new URLSearchParams({
        topic: preferences.topic,
        learningPurpose: preferences.learningPurpose,
        duration: preferences.duration,
        language: preferences.language,
        ...(preferences.intent && { intent: preferences.intent }),
      });
      
      router.push(`/results?${params.toString()}`);
    } catch (error) {
      console.error('Error creating learning path:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fadeIn">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Learning</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-balance">
            Learn Anything on
            <span className="text-primary"> YouTube</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Get personalized learning paths with the best videos, curated by AI to match your goals and skill level.
          </p>
        </div>

        {/* Main Form */}
        <div className="max-w-2xl mx-auto animate-slideUp">
          <Card className="p-8 shadow-elevated">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic" className="text-lg font-semibold">
                  What do you want to learn?
                </Label>
                <Input
                  id="topic"
                  placeholder="e.g., React Hooks, Machine Learning, Spanish Grammar..."
                  value={preferences.topic}
                  onChange={(e) => setPreferences({ ...preferences, topic: e.target.value })}
                  className="text-lg h-12"
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="learningPurpose" className="font-semibold">
                    Learning Purpose
                  </Label>
                  <Select
                    value={preferences.learningPurpose}
                    onValueChange={(value: any) => setPreferences({ ...preferences, learningPurpose: value })}
                  >
                    <SelectTrigger id="learningPurpose" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">📋 Overview</SelectItem>
                      <SelectItem value="steps">📝 Step-by-Step</SelectItem>
                      <SelectItem value="project-based">🛠️ Project-Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="font-semibold">
                    Course Duration
                  </Label>
                  <Select
                    value={preferences.duration}
                    onValueChange={(value: any) => setPreferences({ ...preferences, duration: value })}
                  >
                    <SelectTrigger id="duration" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">⚡ 1-2 hours</SelectItem>
                      <SelectItem value="2-5">⏱️ 2-5 hours</SelectItem>
                      <SelectItem value="5-10">📖 5-10 hours</SelectItem>
                      <SelectItem value="10+">🎓 10+ hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="font-semibold">
                    Language
                  </Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                  >
                    <SelectTrigger id="language" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                      <SelectItem value="fr">🇫🇷 French</SelectItem>
                      <SelectItem value="de">🇩🇪 German</SelectItem>
                      <SelectItem value="it">🇮🇹 Italian</SelectItem>
                      <SelectItem value="pt">🇵🇹 Portuguese</SelectItem>
                      <SelectItem value="ru">🇷🇺 Russian</SelectItem>
                      <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
                      <SelectItem value="ko">🇰🇷 Korean</SelectItem>
                      <SelectItem value="zh">🇨🇳 Chinese</SelectItem>
                      <SelectItem value="hi">🇮🇳 Hindi</SelectItem>
                      <SelectItem value="ar">🇸🇦 Arabic</SelectItem>
                      <SelectItem value="nl">🇳🇱 Dutch</SelectItem>
                      <SelectItem value="pl">🇵🇱 Polish</SelectItem>
                      <SelectItem value="tr">🇹🇷 Turkish</SelectItem>
                      <SelectItem value="vi">🇻🇳 Vietnamese</SelectItem>
                      <SelectItem value="th">🇹🇭 Thai</SelectItem>
                      <SelectItem value="id">🇮🇩 Indonesian</SelectItem>
                      <SelectItem value="sv">🇸🇪 Swedish</SelectItem>
                      <SelectItem value="no">🇳🇴 Norwegian</SelectItem>
                      <SelectItem value="da">🇩🇰 Danish</SelectItem>
                      <SelectItem value="fi">🇫🇮 Finnish</SelectItem>
                      <SelectItem value="cs">🇨🇿 Czech</SelectItem>
                      <SelectItem value="ro">🇷🇴 Romanian</SelectItem>
                      <SelectItem value="uk">🇺🇦 Ukrainian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intent" className="font-semibold">
                  Learning Goal (optional)
                </Label>
                <Input
                  id="intent"
                  placeholder="e.g., Build a portfolio project, Pass an exam..."
                  value={preferences.intent || ''}
                  onChange={(e) => setPreferences({ ...preferences, intent: e.target.value })}
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary-light hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  'Loading...'
                ) : (
                  <>
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Find My Learning Path
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="p-6 text-center hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">AI-Curated</h3>
              <p className="text-sm text-muted-foreground">
                Smart filtering and scoring based on learning criteria
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold mb-2">Structured Path</h3>
              <p className="text-sm text-muted-foreground">
                Videos ordered for optimal understanding and progression
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Checkmarks, streaks, and learning analytics
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />

      {/* Usage Limit Dialog */}
      <UsageLimitDialog
        open={showLimitDialog}
        onOpenChange={setShowLimitDialog}
        resourceType="learning_path"
        currentUsage={usageCount}
        limit={3}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-muted rounded w-3/4 mx-auto" />
            <div className="h-96 bg-muted rounded max-w-2xl mx-auto" />
          </div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
