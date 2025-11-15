import { SubscriptionPlan, UserSubscription, SubscriptionTier } from '@/types/subscription';

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const response = await fetch('/api/subscriptions/plans');
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    // API returns array directly, not wrapped in plans
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching subscription plans:', err);
    return [];
  }
}

/**
 * Get current user's subscription
 */
export async function getUserSubscription(): Promise<UserSubscription | null> {
  try {
    const response = await fetch('/api/subscriptions/user');
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    // API returns subscription directly or null
    return data || null;
  } catch (err) {
    console.error('Error fetching user subscription:', err);
    return null;
  }
}

/**
 * Get user's subscription tier
 */
export async function getUserSubscriptionTier(): Promise<SubscriptionTier> {
  try {
    const response = await fetch('/api/subscriptions/user');
    if (!response.ok) {
      // If no subscription, check user profile for default tier
      return 'free';
    }
    const data = await response.json();
    // API returns subscription with plan_name
    return data?.plan_name || 'free';
  } catch (err) {
    console.error('Error fetching subscription tier:', err);
    return 'free';
  }
}

/**
 * Track usage for a resource type
 */
export async function trackUsage(resourceType: 'learning_path' | 'video_search' | 'analytics_view'): Promise<boolean> {
  try {
    const response = await fetch('/api/usage/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceType }),
    });

    return response.ok;
  } catch (err) {
    console.error('Error tracking usage:', err);
    return false;
  }
}

/**
 * Get usage count for current period
 */
export async function getUsageCount(resourceType: 'learning_path' | 'video_search' | 'analytics_view'): Promise<number> {
  try {
    const response = await fetch(`/api/usage/get?resourceType=${resourceType}`);
    if (!response.ok) {
      return 0;
    }
    const data = await response.json();
    return data.count || 0;
  } catch (err) {
    console.error('Error getting usage count:', err);
    return 0;
  }
}

/**
 * Check if user can perform an action based on their subscription
 */
export async function canPerformAction(
  action: 'create_learning_path' | 'view_analytics' | 'save_path' | 'use_notes' | 'set_goals'
): Promise<boolean> {
  try {
    const tier = await getUserSubscriptionTier();
    const subscription = await getUserSubscription();

    // Check if subscription is active
    if (subscription && subscription.status !== 'active' && subscription.status !== 'trialing') {
      if (tier !== 'free') {
        return false;
      }
    }

    switch (action) {
      case 'create_learning_path':
        if (tier === 'free') {
          const usage = await getUsageCount('learning_path');
          return usage < 3; // Free tier: 3 paths per month
        }
        return true; // Pro and Team: unlimited

      case 'view_analytics':
        return tier === 'pro' || tier === 'team';

      case 'save_path':
        return tier === 'pro' || tier === 'team';

      case 'use_notes':
        return tier === 'pro' || tier === 'team';

      case 'set_goals':
        return tier === 'pro' || tier === 'team';

      default:
        return false;
    }
  } catch (err) {
    console.error('Error in canPerformAction:', err);
    return false;
  }
}

