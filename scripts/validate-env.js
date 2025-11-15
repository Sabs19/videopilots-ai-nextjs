/**
 * Environment validation script
 * Can be run standalone or as part of build/deploy process
 */

// Try to load environment variables
try {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
} catch (e) {
  try {
    require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
  } catch (e2) {
    // Environment variables might already be loaded
  }
}

const requiredEnvVars = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'AUTH_URL',
];

const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  console.error('Please set these in your .env file or environment configuration.');
  process.exit(1);
}

// Validate AUTH_SECRET length
if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 32) {
  console.warn('⚠️  WARNING: AUTH_SECRET should be at least 32 characters long for security.');
  console.warn('Generate a secure secret with: openssl rand -base64 32');
}

// Validate AUTH_URL format
if (process.env.AUTH_URL) {
  try {
    new URL(process.env.AUTH_URL);
  } catch {
    console.error('❌ AUTH_URL must be a valid URL. Current value:', process.env.AUTH_URL);
    process.exit(1);
  }
}

// Validate DATABASE_URL format
// Accept both postgres:// and postgresql:// as both are valid PostgreSQL connection string formats
if (process.env.DATABASE_URL && 
    !process.env.DATABASE_URL.startsWith('postgresql://') && 
    !process.env.DATABASE_URL.startsWith('postgres://')) {
  console.error('❌ DATABASE_URL must be a valid PostgreSQL connection string starting with "postgresql://" or "postgres://"');
  process.exit(1);
}

console.log('✅ Environment variables validated successfully');

