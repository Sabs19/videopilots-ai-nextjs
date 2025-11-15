'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Search, Brain, Video, CheckCircle2, Loader2 } from 'lucide-react';

export type SearchStep = 
  | 'analyzing'
  | 'generating'
  | 'searching'
  | 'scoring'
  | 'organizing'
  | 'complete'
  | 'error';

interface SearchProgressProps {
  step: SearchStep;
  message?: string;
  progress?: number;
  topic?: string;
}

const stepConfig: Record<SearchStep, { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
  progress: number;
}> = {
  analyzing: {
    title: 'Analyzing Your Learning Goals',
    description: 'Understanding what you want to learn and how you learn best...',
    icon: <Brain className="w-5 h-5" />,
    progress: 15,
  },
  generating: {
    title: 'Creating Your Course Structure',
    description: 'Our AI is designing a personalized learning path just for you...',
    icon: <Sparkles className="w-5 h-5" />,
    progress: 35,
  },
  searching: {
    title: 'Finding the Best Videos',
    description: 'Searching YouTube for high-quality content that matches your needs...',
    icon: <Search className="w-5 h-5" />,
    progress: 60,
  },
  scoring: {
    title: 'Evaluating Video Quality',
    description: 'Analyzing each video to ensure it meets our quality standards...',
    icon: <Video className="w-5 h-5" />,
    progress: 80,
  },
  organizing: {
    title: 'Organizing Your Learning Path',
    description: 'Arranging videos in the perfect order for optimal learning...',
    icon: <CheckCircle2 className="w-5 h-5" />,
    progress: 95,
  },
  complete: {
    title: 'Ready!',
    description: 'Your personalized learning path is ready to explore.',
    icon: <CheckCircle2 className="w-5 h-5" />,
    progress: 100,
  },
  error: {
    title: 'Something Went Wrong',
    description: 'We encountered an issue. Please try again.',
    icon: <Loader2 className="w-5 h-5" />,
    progress: 0,
  },
};

export function SearchProgress({ step, message, progress, topic }: SearchProgressProps) {
  const config = stepConfig[step];
  const displayProgress = progress !== undefined ? progress : config.progress;
  const displayMessage = message || config.description;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <CardContent className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center mb-4">
                <div className={`p-3 rounded-full ${
                  step === 'error' 
                    ? 'bg-destructive/10 text-destructive' 
                    : step === 'complete'
                    ? 'bg-success/10 text-success'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {step === 'error' || step === 'complete' ? config.icon : (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  )}
                </div>
              </div>
              <h2 className="text-2xl font-bold">{config.title}</h2>
              {topic && (
                <p className="text-lg text-muted-foreground">
                  Learning about: <span className="font-semibold text-foreground">{topic}</span>
                </p>
              )}
            </div>

            {/* Progress Bar */}
            {step !== 'error' && (
              <div className="space-y-2">
                <Progress value={displayProgress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{displayMessage}</span>
                  <span>{displayProgress}%</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {step === 'error' && (
              <div className="text-center py-4">
                <p className="text-destructive">{displayMessage}</p>
              </div>
            )}

            {/* Step Indicators */}
            {step !== 'error' && step !== 'complete' && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${
                    ['analyzing', 'generating', 'searching', 'scoring', 'organizing'].includes(step)
                      ? 'bg-primary' : 'bg-muted'
                  }`} />
                  <span>Analyzing</span>
                </div>
                <div className="w-8 h-px bg-muted" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${
                    ['generating', 'searching', 'scoring', 'organizing'].includes(step)
                      ? 'bg-primary' : 'bg-muted'
                  }`} />
                  <span>Searching</span>
                </div>
                <div className="w-8 h-px bg-muted" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${
                    ['scoring', 'organizing'].includes(step)
                      ? 'bg-primary' : 'bg-muted'
                  }`} />
                  <span>Organizing</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

