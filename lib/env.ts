/**
 * Environment variable validation and configuration
 * Validates all required environment variables at startup
 */

const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
} as const;

const optionalEnvVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  NEXT_PUBLIC_YOUTUBE_API_KEY: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

/**
 * Validates that all required environment variables are set
 * Throws an error with helpful messages if any are missing
 */
export function validateEnv() {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please set these in your .env file or environment configuration.`
    );
  }

  // Validate AUTH_SECRET length
  if (requiredEnvVars.AUTH_SECRET && requiredEnvVars.AUTH_SECRET.length < 32) {
    console.warn(
      '⚠️  WARNING: AUTH_SECRET should be at least 32 characters long for security.\n' +
      'Generate a secure secret with: openssl rand -base64 32'
    );
  }

  // Validate AUTH_URL format
  if (requiredEnvVars.AUTH_URL) {
    try {
      new URL(requiredEnvVars.AUTH_URL);
    } catch {
      throw new Error(
        `AUTH_URL must be a valid URL. Current value: ${requiredEnvVars.AUTH_URL}`
      );
    }
  }

  // Validate DATABASE_URL format
  // Accept both postgres:// and postgresql:// as both are valid PostgreSQL connection string formats
  if (requiredEnvVars.DATABASE_URL && 
      !requiredEnvVars.DATABASE_URL.startsWith('postgresql://') && 
      !requiredEnvVars.DATABASE_URL.startsWith('postgres://')) {
    throw new Error(
      `DATABASE_URL must be a valid PostgreSQL connection string starting with 'postgresql://' or 'postgres://'`
    );
  }
}

/**
 * Get validated environment variables
 * Call validateEnv() first to ensure all required vars are set
 */
export const env = {
  ...requiredEnvVars,
  ...optionalEnvVars,
  isProduction: optionalEnvVars.NODE_ENV === 'production',
  isDevelopment: optionalEnvVars.NODE_ENV === 'development',
} as const;

// Validate on module load in production
// Note: During build, some variables might not be available yet
// So we only validate at runtime, not during build
if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  // Only validate on server-side, not during build
  // Build validation happens in scripts/validate-env.js
  try {
    validateEnv();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    // Don't throw in module scope to allow graceful handling
  }
}

