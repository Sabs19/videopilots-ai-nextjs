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

// Parse connection string to extract connection parameters
// This gives us better control over SSL settings
let url;
try {
  // Convert postgres:// to postgresql:// for URL parsing
  url = new URL(connectionString.replace(/^postgres:/, 'postgresql:'));
} catch (error) {
  console.error('❌ Invalid DATABASE_URL format:', error.message);
  process.exit(1);
}

const requiresSSL = connectionString?.includes('sslmode=require') || isProduction;

// Build pool configuration using individual parameters for better SSL control
// Using individual parameters instead of connectionString gives us full control over SSL settings
const poolConfig = {
  host: url.hostname,
  port: parseInt(url.port || '5432', 10),
  database: url.pathname.slice(1) || 'postgres', // Remove leading slash
  user: url.username,
  password: url.password,
  // SSL configuration - Use individual SSL config to bypass certificate verification
  // This approach ensures rejectUnauthorized: false is properly applied
  ssl: requiresSSL ? {
    rejectUnauthorized: false, // Accept self-signed certificates and bypass certificate chain verification
  } : false,
};

const pool = new Pool(poolConfig);

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('📦 Reading schema file...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔌 Connecting to database...');
    await client.query('SELECT NOW()');
    console.log('✅ Connected to database');
    
    console.log('🚀 Executing schema...');
    await client.query(schema);
    
    console.log('✅ Schema executed successfully!');
    console.log('📊 Verifying tables...');
    
    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`\n📋 Created tables (${tablesResult.rows.length}):`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check subscription plans
    const plansResult = await client.query('SELECT name, price_monthly, price_yearly FROM subscription_plans');
    console.log(`\n💳 Subscription plans seeded (${plansResult.rows.length}):`);
    plansResult.rows.forEach(plan => {
      console.log(`   - ${plan.name}: $${plan.price_monthly}/month, $${plan.price_yearly}/year`);
    });
    
    console.log('\n✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

