const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local or .env
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch (e) {
  // Try .env if .env.local doesn't exist
  try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  } catch (e2) {
    // Environment variables might already be loaded
  }
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please create a .env.local file with DATABASE_URL=postgresql://user:password@localhost:5432/database_name');
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

// Parse connection string to extract connection parameters for better SSL control
let url;
try {
  url = new URL(connectionString.replace(/^postgres:/, 'postgresql:'));
} catch (error) {
  console.error('❌ Invalid DATABASE_URL format:', error.message);
  process.exit(1);
}

const requiresSSL = connectionString?.includes('sslmode=require') || connectionString?.includes('sslmode=prefer');

const poolConfig = {
  host: url.hostname,
  port: parseInt(url.port || '5432', 10),
  database: url.pathname.slice(1) || 'postgres',
  user: url.username,
  password: url.password,
  ssl: requiresSSL ? {
    rejectUnauthorized: false,
  } : false,
};

const pool = new Pool(poolConfig);

async function upgradeUserToPremium() {
  const client = await pool.connect();
  
  try {
    // Get email from command line argument or use default
    const email = process.argv[2] || 'sgsabariganesh@gmail.com';
    const subscriptionTier = 'pro'; // 'pro' for premium
    
    console.log(`\n🔍 Looking for user: ${email}`);
    
    // Find the user (case-insensitive email matching)
    const userResult = await client.query(
      'SELECT id, email, subscription_tier FROM user_profiles WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.error(`❌ User with email ${email} not found!`);
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
    console.log(`   Current subscription tier: ${user.subscription_tier}`);
    
    // Get the 'pro' plan ID
    const planResult = await client.query(
      'SELECT id FROM subscription_plans WHERE name = $1',
      [subscriptionTier]
    );
    
    if (planResult.rows.length === 0) {
      console.error(`❌ Subscription plan '${subscriptionTier}' not found!`);
      process.exit(1);
    }
    
    const planId = planResult.rows[0].id;
    console.log(`✅ Found plan: ${subscriptionTier} (ID: ${planId})`);
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Update user_profiles subscription_tier
      await client.query(
        'UPDATE user_profiles SET subscription_tier = $1, updated_at = NOW() WHERE id = $2',
        [subscriptionTier, user.id]
      );
      console.log(`✅ Updated user_profiles.subscription_tier to '${subscriptionTier}'`);
      
      // Check if user_subscriptions record exists
      const subscriptionCheck = await client.query(
        'SELECT id FROM user_subscriptions WHERE user_id = $1',
        [user.id]
      );
      
      const now = new Date();
      const oneYearFromNow = new Date(now);
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      if (subscriptionCheck.rows.length === 0) {
        // Create new subscription
        await client.query(
          `INSERT INTO user_subscriptions 
           (user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
           VALUES ($1, $2, 'active', $3, $4, NOW(), NOW())`,
          [user.id, planId, now, oneYearFromNow]
        );
        console.log(`✅ Created new user_subscriptions record with 'active' status`);
      } else {
        // Update existing subscription
        await client.query(
          `UPDATE user_subscriptions 
           SET plan_id = $1, status = 'active', 
               current_period_start = $2, current_period_end = $3,
               updated_at = NOW()
           WHERE user_id = $4`,
          [planId, now, oneYearFromNow, user.id]
        );
        console.log(`✅ Updated existing user_subscriptions to 'active' status`);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log(`\n✨ Successfully upgraded ${email} to ${subscriptionTier} tier!`);
      console.log(`   Subscription valid until: ${oneYearFromNow.toISOString()}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error upgrading user:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

upgradeUserToPremium();

