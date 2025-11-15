'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  CreditCard,
  Settings as SettingsIcon,
  Download,
  Trash2,
  LogOut,
} from 'lucide-react';
import { getUserSubscription, getUserSubscriptionTier } from '@/lib/services/subscription';
import { SubscriptionPlan, UserSubscription } from '@/types/subscription';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [tier, setTier] = useState<'free' | 'pro' | 'team'>('free');
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      loadSettings();
    }
  }, [status, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [subData, tierData] = await Promise.all([
        getUserSubscription(),
        getUserSubscriptionTier(),
      ]);

      setSubscription(subData);
      setTier(tierData);

      if (session?.user) {
        setName(session.user.name || '');
        setEmail(session.user.email || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update API
    toast.info('Profile update coming soon!');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement password change API
    toast.info('Password change coming soon!');
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to cancel subscription');
        return;
      }

      toast.success('Subscription canceled. You will retain access until the end of your billing period.');
      // Reload subscription data
      const subData = await getUserSubscription();
      const tier = await getUserSubscriptionTier();
      setSubscription(subData);
      setCurrentTier(tier);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const handleExportData = async () => {
    // TODO: Implement data export API
    toast.info('Data export coming soon!');
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      return;
    }
    // TODO: Implement account deletion API
    toast.info('Account deletion coming soon!');
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
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

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="w-4 h-4 mr-2" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              <Button type="submit">Update Profile</Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit">Change Password</Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
                <Badge variant="secondary" className="capitalize text-base">
                  {tier}
                </Badge>
              </div>
              {tier !== 'free' && (
                <Button variant="outline" onClick={() => router.push('/pricing')}>
                  Change Plan
                </Button>
              )}
            </div>

            {subscription && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="capitalize">{subscription.status}</span>
                </div>
                {subscription.current_period_end && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Renews:</span>
                    <span>
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {tier === 'free' && (
              <div className="mt-4">
                <Button onClick={() => router.push('/pricing')} className="w-full">
                  Upgrade to Pro
                </Button>
              </div>
            )}

            {tier !== 'free' && (
              <div className="mt-6 pt-6 border-t">
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  className="w-full"
                >
                  Cancel Subscription
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Your subscription will remain active until the end of the billing period
                </p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Learning paths this month:</span>
                <span>{subscription?.features?.learning_paths_per_month || 'N/A'}</span>
              </div>
              {/* TODO: Add more usage stats */}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Data & Privacy</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Export Your Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Download all your learning paths, progress, and notes
                </p>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-destructive">
            <h2 className="text-xl font-semibold mb-4 text-destructive">
              Danger Zone
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete your account and all associated data. This action
                  cannot be undone.
                </p>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Session</h2>
            <Button variant="outline" onClick={handleSignOut} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

