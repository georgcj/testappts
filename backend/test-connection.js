// Simple database connection test script
// Run: node test-connection.js

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  console.log('📋 Connection Details:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Password: ${'*'.repeat(config.password?.length || 0)}\n`);

  try {
    // Test connection
    console.log('🔌 Connecting to database...');
    const connection = await mysql.createConnection(config);
    
    // Test basic query
    console.log('✅ Connected successfully!');
    console.log('🧪 Testing basic query...');
    
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test passed:', rows[0]);

    // Check if our tables exist
    console.log('🔍 Checking for existing tables...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [config.database]);
    
    if (tables.length > 0) {
      console.log('📋 Existing tables:');
      tables.forEach(table => {
        console.log(`   - ${table.TABLE_NAME}`);
      });
    } else {
      console.log('⚠️  No tables found. You need to import the schema.');
      console.log('📖 Follow the WEBHOST_SETUP.md guide to import database/schema.sql');
    }

    await connection.end();
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Hint: Check the DB_HOST address');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Hint: Check DB_USER and DB_PASSWORD');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Hint: Database doesn\'t exist. Create it first.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Hint: Check DB_HOST and DB_PORT, or if remote access is enabled');
    }
    
    console.error('\n📖 Check WEBHOST_SETUP.md for troubleshooting steps');
  }
}

testConnection();