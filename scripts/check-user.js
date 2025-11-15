/**
 * Check if a user exists in the database
 * Usage: node scripts/check-user.js <email>
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node scripts/check-user.js <email>');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkUser() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Connected to database\n');
    
    console.log(`🔍 Checking for user: ${email}\n`);
    
    // Check exact email match
    const exactResult = await client.query(
      'SELECT id, email, name, password, created_at, updated_at FROM user_profiles WHERE email = $1',
      [email]
    );
    
    if (exactResult.rows.length > 0) {
      const user = exactResult.rows[0];
      console.log('✅ User found (exact match):');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`);
      console.log(`   Created At: ${user.created_at}`);
      console.log(`   Updated At: ${user.updated_at}`);
      
      if (user.password) {
        console.log(`   Password Hash Length: ${user.password.length}`);
      } else {
        console.log('   ⚠️  User has no password set!');
      }
    } else {
      console.log('❌ User not found (exact match)\n');
      
      // Check case-insensitive match
      const caseInsensitiveResult = await client.query(
        'SELECT id, email, name, password, created_at FROM user_profiles WHERE LOWER(email) = LOWER($1)',
        [email]
      );
      
      if (caseInsensitiveResult.rows.length > 0) {
        console.log('⚠️  User found with different case:');
        caseInsensitiveResult.rows.forEach(user => {
          console.log(`   - ${user.email} (ID: ${user.id})`);
        });
        console.log('\n💡 Email comparison might be case-sensitive. Check the exact email case.');
      }
    }
    
    // List all users (for debugging)
    console.log('\n📋 All users in database:');
    const allUsers = await client.query(
      'SELECT id, email, name, created_at FROM user_profiles ORDER BY created_at DESC LIMIT 10'
    );
    
    if (allUsers.rows.length > 0) {
      allUsers.rows.forEach((user, index) => {
        const match = user.email.toLowerCase() === email.toLowerCase() ? ' 👈' : '';
        console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'})${match}`);
      });
    } else {
      console.log('   No users found in database');
    }
    
    // Test password verification if user exists and password provided
    if (exactResult.rows.length > 0 && exactResult.rows[0].password && process.argv[3]) {
      const testPassword = process.argv[3];
      const user = exactResult.rows[0];
      
      console.log('\n🔐 Testing password verification...');
      try {
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(`   Password match: ${isValid ? '✅ Yes' : '❌ No'}`);
      } catch (error) {
        console.error('   ❌ Error verifying password:', error.message);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Code:', error.code);
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.error('\n💡 Cannot connect to database. This might be:');
      console.error('   - Network connectivity issue');
      console.error('   - Database hostname not accessible from this location');
      console.error('   - Wrong DATABASE_URL');
    }
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkUser();

