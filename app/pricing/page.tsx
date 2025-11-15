'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Users } from 'lucide-react';
import { SubscriptionPlan } from '@/types/subscription';
import { getUserSubscriptionTier } from '@/lib/services/subscription';
import { toast } from 'sonner';

function PricingContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentTier, setCurrentTier] = useState<'free' | 'pro' | 'team'>('free');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
    if (session) {
      loadCurrentTier();
    }
  }, [session]);

  // Handle PayPal callback
  useEffect(() => {
    const token = searchParams.get('token');
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const payerId = searchParams.get('PayerID');

    // Clear any stored order ID first
    sessionStorage.removeItem('paypal_order_id');

    if (canceled) {
      toast.info('Payment canceled');
      router.replace('/pricing');
      return;
    }

    // Only verify if we have both success=true AND a token
    // PayPal returns token only when payment is actually approved
    if (success && token) {
      // Verify the payment
      verifyPayment(token);
    } else if (success && !token) {
      // Success param but no token means user returned without completing payment
      toast.info('Payment was not completed');
      router.replace('/pricing');
    }
  }, [searchParams, router]);

  const verifyPayment = async (orderId: string) => {
    try {
      const response = await fetch('/api/subscriptions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Payment verification failed');
        router.replace('/pricing');
        return;
      }

      toast.success('Payment successful! Your subscription is now active.');
      // Reload tier and clean up URL
      await loadCurrentTier();
      router.replace('/pricing');
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('An error occurred verifying your payment');
      router.replace('/pricing');
    }
  };

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data || []);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentTier = async () => {
    try {
      const tier = await getUserSubscriptionTier();
      setCurrentTier(tier);
    } catch (error) {
      console.error('Error loading tier:', error);
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (!session) {
      toast.error('Please sign in to upgrade');
      return;
    }

    if (planName === 'free') {
      return;
    }

    try {
      // Create PayPal order
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planName,
          billingPeriod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error || error.message || 'Failed to create payment';
        toast.error(errorMessage);
        console.error('Payment creation error:', error);
        return;
      }

      const { orderId, approvalUrl } = await response.json();

      if (!approvalUrl) {
        toast.error('Failed to get payment URL');
        return;
      }

      // Store order ID in sessionStorage for verification
      sessionStorage.setItem('paypal_order_id', orderId);

      // Redirect to PayPal
      window.location.href = approvalUrl;
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const getPlanIcon = (name: string) => {
    switch (name) {
      case 'pro':
        return Zap;
      case 'team':
        return Users;
      default:
        return Sparkles;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Learning Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock powerful features to accelerate your learning journey
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingPeriod('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={billingPeriod === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingPeriod('yearly')}
          >
            Yearly
            <Badge variant="secondary" className="ml-2">
              Save 17%
            </Badge>
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.name);
          const price =
            billingPeriod === 'monthly'
              ? plan.price_monthly
              : plan.price_yearly / 12;
          const isCurrentPlan = currentTier === plan.name;
          const isUpgrade = plan.name !== 'free' && currentTier === 'free';

          return (
            <Card
              key={plan.id}
              className={`p-6 relative ${
                plan.name === 'pro'
                  ? 'border-primary shadow-lg scale-105'
                  : ''
              }`}
            >
              {plan.name === 'pro' && (
                <Badge className="absolute top-4 right-4">Popular</Badge>
              )}

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold capitalize mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">
                    {plan.name === 'free' ? 'Free' : formatPrice(price)}
                  </span>
                  {plan.name !== 'free' && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
                {plan.name !== 'free' && billingPeriod === 'yearly' && (
                  <p className="text-sm text-muted-foreground">
                    Billed as {formatPrice(plan.price_yearly)}/year
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    {plan.features.learning_paths_per_month === -1
                      ? 'Unlimited learning paths'
                      : `${plan.features.learning_paths_per_month} learning paths/month`}
                  </span>
                </div>
                {plan.features.saved_paths && (
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Save unlimited paths</span>
                  </div>
                )}
                {plan.features.analytics && (
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Learning analytics</span>
                  </div>
                )}
                {plan.features.notes && (
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Video notes</span>
                  </div>
                )}
                {plan.features.goals && (
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Learning goals</span>
                  </div>
                )}
                {plan.features.export_data && (
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Export data</span>
                  </div>
                )}
                {plan.features.team_collaboration && (
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Team collaboration</span>
                  </div>
                )}
                {plan.features.shared_paths && (
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Share paths</span>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                variant={plan.name === 'pro' ? 'default' : 'outline'}
                disabled={isCurrentPlan}
                onClick={() => handleUpgrade(plan.name)}
              >
                {isCurrentPlan
                  ? 'Current Plan'
                  : plan.name === 'free'
                  ? 'Get Started'
                  : 'Upgrade'}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Can I change plans later?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes
              will be reflected in your next billing cycle.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-sm text-muted-foreground">
              We accept PayPal and major credit cards. All payments are secure
              and processed through PayPal.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
            <p className="text-sm text-muted-foreground">
              The free plan is available forever with no credit card required.
              You can upgrade to Pro or Team at any time.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}

