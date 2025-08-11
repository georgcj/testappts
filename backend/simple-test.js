// Simple database connection test (no dependencies required)
// First, you need to create your .env file with database details

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking .env configuration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('📋 Please create .env file:');
  console.log('   1. Copy .env.example to .env');
  console.log('   2. Update with your webhost database details\n');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('💡 Example configuration:');
    console.log(fs.readFileSync(envExamplePath, 'utf8'));
  }
  
  process.exit(1);
}

// Parse .env file manually
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};

envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('✅ .env file found!');
console.log('📋 Configuration:');
console.log(`   DB_HOST: ${env.DB_HOST || 'not set'}`);
console.log(`   DB_PORT: ${env.DB_PORT || 'not set'}`);
console.log(`   DB_NAME: ${env.DB_NAME || 'not set'}`);
console.log(`   DB_USER: ${env.DB_USER || 'not set'}`);
console.log(`   DB_PASSWORD: ${env.DB_PASSWORD ? '*'.repeat(env.DB_PASSWORD.length) : 'not set'}`);

const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missing = required.filter(key => !env[key]);

if (missing.length > 0) {
  console.log(`\n❌ Missing required variables: ${missing.join(', ')}`);
  console.log('📖 Please update your .env file with webhost database details');
  process.exit(1);
}

console.log('\n✅ Configuration looks good!');
console.log('📋 Next steps:');
console.log('   1. Make sure your webhost database exists');
console.log('   2. Import database/schema.sql into your database');
console.log('   3. Run: npm install (after fixing npm permissions)');
console.log('   4. Run: node test-connection.js');

console.log('\n💡 To fix npm permissions, you can:');
console.log('   - Contact system admin to run: sudo chown -R $(whoami) ~/.npm');
console.log('   - Or try: npm config set cache ~/.npm-cache --global');
console.log('   - Or use yarn instead: npm install -g yarn && yarn install');