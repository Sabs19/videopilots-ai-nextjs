import { Pool, PoolConfig } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const isProduction = process.env.NODE_ENV === 'production';

// Parse connection string to determine SSL requirements
const connectionString = process.env.DATABASE_URL;
const requiresSSL = connectionString?.includes('sslmode=require') || isProduction;

const poolConfig: PoolConfig = {
  connectionString: connectionString,
  // If connection string explicitly requires SSL, or we're in production, use SSL
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
  // Connection pool settings for production
  max: isProduction ? 20 : 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
};

// Log connection details in production (without sensitive info)
if (isProduction) {
  const maskedUrl = connectionString?.replace(/:[^:@]+@/, ':****@') || 'not set';
  console.log('[DB] Initializing database connection:', {
    host: connectionString ? new URL(connectionString.replace(/^postgres:/, 'postgresql:')).hostname : 'unknown',
    ssl: requiresSSL || isProduction,
    sslMode: requiresSSL ? 'require' : 'default',
  });
}

const pool = new Pool(poolConfig);

// Test connection on startup
pool.on('connect', () => {
  if (!isProduction) {
    console.log('✅ Connected to PostgreSQL database');
  }
});

pool.on('error', (err: Error) => {
  const errorCode = (err as any)?.code;
  const errorMessage = err.message;
  
  console.error('❌ Unexpected error on idle database client:', {
    message: errorMessage,
    code: errorCode,
    name: err.name,
  });
  
  // Don't exit in production - let the application handle it gracefully
  if (!isProduction) {
    process.exit(-1);
  }
});

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await pool.end();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await pool.end();
    process.exit(0);
});
}

export default pool;

