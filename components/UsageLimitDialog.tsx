'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

interface UsageLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: 'learning_path' | 'video_search' | 'analytics_view';
  currentUsage: number;
  limit: number;
}

export function UsageLimitDialog({
  open,
  onOpenChange,
  resourceType,
  currentUsage,
  limit,
}: UsageLimitDialogProps) {
  const getTitle = () => {
    switch (resourceType) {
      case 'learning_path':
        return 'Monthly Limit Reached';
      case 'video_search':
        return 'Search Limit Reached';
      case 'analytics_view':
        return 'Analytics Access Required';
      default:
        return 'Limit Reached';
    }
  };

  const getDescription = () => {
    switch (resourceType) {
      case 'learning_path':
        return `You've created ${currentUsage} learning paths this month. Upgrade to Pro for unlimited learning paths and more features.`;
      case 'video_search':
        return 'You have reached your search limit. Upgrade to continue.';
      case 'analytics_view':
        return 'Analytics are available for Pro and Team subscribers. Upgrade to unlock this feature.';
      default:
        return 'You have reached your limit. Upgrade to continue.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Current Usage</span>
              <span className="font-semibold">
                {currentUsage} / {limit}
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(currentUsage / limit) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Upgrade to Pro and get:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Unlimited learning paths</li>
              <li>• Save and organize your paths</li>
              <li>• Learning analytics</li>
              <li>• Video notes and bookmarks</li>
              <li>• Learning goals tracking</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Link href="/pricing" className="flex-1">
              <Button className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                View Plans
              </Button>
            </Link>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

