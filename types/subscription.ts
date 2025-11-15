export type SubscriptionTier = 'free' | 'pro' | 'team';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'expired';

export interface SubscriptionPlan {
  id: string;
  name: SubscriptionTier;
  price_monthly: number;
  price_yearly: number;
  features: {
    learning_paths_per_month: number; // -1 for unlimited
    saved_paths: boolean;
    analytics: boolean;
    notes: boolean;
    goals: boolean;
    export_data: boolean;
    team_collaboration?: boolean;
    shared_paths?: boolean;
  };
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  paypal_subscription_id?: string;
  paypal_order_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  plan_name?: string;
  price_monthly?: number;
  price_yearly?: number;
  features?: SubscriptionPlan['features'];
}

export interface UsageTracking {
  id: string;
  user_id: string;
  resource_type: 'learning_path' | 'video_search' | 'analytics_view';
  count: number;
  period_start: string;
}

