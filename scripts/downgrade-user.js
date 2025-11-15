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

async function downgradeUserToFree() {
  const client = await pool.connect();
  
  try {
    // Get email from command line argument or use default
    const email = process.argv[2] || 'sabari.designs247@gmail.com';
    const subscriptionTier = 'free';
    
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
    
    if (user.subscription_tier === 'free') {
      console.log(`\n⚠️  User is already on the free tier.`);
      process.exit(0);
    }
    
    // Get the 'free' plan ID
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
      
      // Update user_subscriptions to canceled/expired status
      const subscriptionCheck = await client.query(
        'SELECT id FROM user_subscriptions WHERE user_id = $1',
        [user.id]
      );
      
      if (subscriptionCheck.rows.length > 0) {
        // Update existing subscription to canceled
        await client.query(
          `UPDATE user_subscriptions 
           SET plan_id = $1, status = 'canceled', 
               cancel_at_period_end = true,
               updated_at = NOW()
           WHERE user_id = $2`,
          [planId, user.id]
        );
        console.log(`✅ Updated user_subscriptions to 'canceled' status`);
      } else {
        // Create a canceled subscription record for tracking
        await client.query(
          `INSERT INTO user_subscriptions 
           (user_id, plan_id, status, cancel_at_period_end, created_at, updated_at)
           VALUES ($1, $2, 'canceled', true, NOW(), NOW())`,
          [user.id, planId]
        );
        console.log(`✅ Created user_subscriptions record with 'canceled' status`);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log(`\n✨ Successfully downgraded ${email} to ${subscriptionTier} tier!`);
      console.log(`   User now has free tier access.`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error downgrading user:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

downgradeUserToFree();

