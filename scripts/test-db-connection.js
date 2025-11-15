/**
 * Test database connection script
 * Tests the provided PostgreSQL connection string
 * Usage: node scripts/test-db-connection.js [connection_string]
 */

const { Pool } = require('pg');

// Get connection string from command line argument or use default
const connectionString = process.argv[2] || 'postgres://Sabs19:0BoN7VCFumJjm2cIHwTT2gPMbOw1Vo2QgmBEaJhmRFcWmlP1t5TsiajRyeljqY4O@jgw8okkw8g8sw0gk4408ggww:5432/postgres?sslmode=require';

console.log('🔍 Testing database connection...\n');
console.log('Connection string:', connectionString.replace(/:[^:@]+@/, ':****@')); // Hide password in output

// Parse connection string to extract hostname
const url = new URL(connectionString.replace(/^postgres:/, 'postgresql:'));
const hostname = url.hostname;
const port = url.port || '5432';

console.log('\n📝 Parsed Connection Details:');
console.log('   Host:', hostname);
console.log('   Port:', port);
console.log('   Database:', url.pathname.slice(1) || 'postgres');
console.log('   Username:', url.username);

// Try multiple SSL configurations
const poolConfigs = [
  {
    name: 'With SSL (rejectUnauthorized: false)',
    config: {
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    },
  },
  {
    name: 'With SSL (require mode)',
    config: {
      connectionString: connectionString,
      ssl: true,
      connectionTimeoutMillis: 10000,
    },
  },
  {
    name: 'Without SSL',
    config: {
      connectionString: connectionString.replace(/[?&]sslmode=[^&]*/, ''),
      ssl: false,
      connectionTimeoutMillis: 10000,
    },
  },
];

async function testConnection(poolConfig, configName) {
  let pool;
  let client;
  
  try {
    console.log(`\n1️⃣ Attempting to connect (${configName})...`);
    pool = new Pool(poolConfig);
    client = await pool.connect();
    console.log('✅ Successfully connected to database!');
    
    return { success: true, pool, client, configName };
  } catch (error) {
    if (pool) {
      try {
        await pool.end();
      } catch (e) {
        // Ignore pool close errors
      }
    }
    return { success: false, error, configName };
  }
}

// Try all configurations
async function runTests() {
  console.log('\n🔍 Testing database connection with different SSL configurations...\n');
  
  let successfulConnection = null;
  
  for (const poolConfig of poolConfigs) {
    const result = await testConnection(poolConfig.config, poolConfig.name);
    
    if (result.success) {
      successfulConnection = result;
      break; // Found working configuration
    } else {
      console.log(`   ❌ ${poolConfig.name}: ${result.error.message}`);
    }
  }
  
  if (!successfulConnection) {
    console.error('\n❌ All connection attempts failed!');
    console.error('\n💡 Troubleshooting Tips:');
    console.error('\n1. Check if the hostname is correct:');
    console.error(`   - Current hostname: ${hostname}`);
    console.error('   - If this is an internal service name, you may need to:');
    console.error('     * Run this script from within the same Docker/Coolify network');
    console.error('     * Use the service name instead of IP');
    console.error('     * Check Coolify\'s PostgreSQL service connection details');
    
    console.error('\n2. Verify connection string format:');
    console.error('   Format: postgresql://username:password@host:port/database?sslmode=require');
    console.error('   - All parts must be URL-encoded');
    console.error('   - Special characters in password must be encoded');
    
    console.error('\n3. Network connectivity:');
    console.error('   - Check if you can reach the host: ping ' + hostname);
    console.error('   - Check if port is open: telnet ' + hostname + ' ' + port);
    console.error('   - Verify firewall rules allow connection');
    
    console.error('\n4. SSL/TLS issues:');
    console.error('   - Try with sslmode=require in connection string');
    console.error('   - Some cloud providers require specific SSL settings');
    
    process.exit(1);
  }
  
  // If we got here, we have a successful connection
  const { pool, client } = successfulConnection;
  
  try {
    console.log('\n2️⃣ Running test queries...');
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Query executed successfully!');
    console.log('\n📊 Database Information:');
    console.log('   Current time:', result.rows[0].current_time);
    console.log('   PostgreSQL version:', result.rows[0].postgres_version.split(',')[0]);
    
    console.log('\n3️⃣ Checking database and schema...');
    const dbResult = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        inet_server_addr() as server_address,
        inet_server_port() as server_port
    `);
    console.log('✅ Database details retrieved!');
    console.log('\n📋 Connection Details:');
    console.log('   Database name:', dbResult.rows[0].database_name);
    console.log('   Current user:', dbResult.rows[0].current_user);
    console.log('   Server address:', dbResult.rows[0].server_address || 'N/A');
    console.log('   Server port:', dbResult.rows[0].server_port || 'N/A');
    
    console.log('\n4️⃣ Checking for required tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} table(s):`);
      tables.forEach(table => {
        console.log(`   - ${table}`);
      });
    } else {
      console.log('⚠️  No tables found in public schema');
      console.log('💡 You may need to run migrations: npm run db:migrate');
    }
    
    console.log('\n✅ All tests passed! Database connection is working correctly.');
    console.log(`✅ Working configuration: ${successfulConnection.configName}`);
    
  } finally {
    if (client) {
      client.release();
    }
    if (pool) {
      await pool.end();
      console.log('\n🔌 Connection closed.');
    }
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
