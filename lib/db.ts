import { Pool, PoolConfig } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const isProduction = process.env.NODE_ENV === 'production';

// Parse connection string to extract connection parameters
const connectionString = process.env.DATABASE_URL;
let url: URL;

try {
  // Convert postgres:// to postgresql:// for URL parsing
  url = new URL(connectionString.replace(/^postgres:/, 'postgresql:'));
} catch (error) {
  throw new Error(`Invalid DATABASE_URL format: ${error instanceof Error ? error.message : String(error)}`);
}

const requiresSSL = connectionString?.includes('sslmode=require') || isProduction;

// Build pool configuration using individual parameters for better SSL control
// Using individual parameters instead of connectionString gives us full control over SSL settings
const poolConfig: PoolConfig = {
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
  // Connection pool settings for production
  max: isProduction ? 20 : 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
};

// Log connection details in production (without sensitive info)
if (isProduction) {
  console.log('[DB] Initializing database connection:', {
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user,
    ssl: requiresSSL || isProduction,
    sslMode: requiresSSL ? 'require' : 'default',
    sslConfig: poolConfig.ssl,
    rejectUnauthorized: poolConfig.ssl && typeof poolConfig.ssl === 'object' ? poolConfig.ssl.rejectUnauthorized : 'N/A',
    connectionMethod: 'individual_parameters', // Using individual params instead of connectionString
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

