# 🗄️ Database Setup Guide

## Quick Setup Options

### Option 1: PlanetScale (Recommended - Free)
1. **Sign up** at https://planetscale.com
2. **Create database**: `password-manager-db`
3. **Get connection string** from dashboard
4. **Update `.env`** with PlanetScale details

### Option 2: Railway (MySQL Hosting)
1. **Sign up** at https://railway.app
2. **Deploy MySQL** from template
3. **Copy connection details**
4. **Update `.env`** file

### Option 3: MAMP Local Development
1. **Start MAMP** with MySQL
2. **Access phpMyAdmin**: http://localhost:8888/phpMyAdmin
3. **Import schema**: Copy/paste `database/schema.sql`
4. **Use local connection**

---

## Step-by-Step Setup

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Update `.env` with your database details:
```env
# For PlanetScale
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_NAME=password-manager-db
DB_USER=your_planetscale_user
DB_PASSWORD=your_planetscale_password

# For local MAMP
DB_HOST=localhost
DB_PORT=3306
DB_NAME=password_manager_db
DB_USER=root
DB_PASSWORD=root

# Security (IMPORTANT!)
JWT_SECRET=your_super_secure_jwt_secret_here_at_least_32_characters_long
ENCRYPTION_KEY=your_32_character_key_exactly_32_chars

# Generate secure keys:
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(16).toString('hex'))"
```

### 2. Database Creation

#### For Cloud Databases (PlanetScale/Railway):
- Database is auto-created
- Run schema through their web console

#### For MAMP/Local:
1. Open phpMyAdmin: http://localhost:8888/phpMyAdmin
2. Create new database: `password_manager_db`
3. Import schema:
   ```sql
   -- Copy entire contents of database/schema.sql and run
   ```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Test Connection

```bash
npm run dev
```

Visit: http://localhost:3001/health

Should show:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

## Security Best Practices

### 🔐 **Password Encryption**
- User passwords: **bcrypt** (one-way hash)
- Stored passwords: **AES-256-GCM** (reversible encryption)
- Unique salt per user
- Separate encryption keys

### 🛡️ **API Security**
- JWT token authentication
- Rate limiting (5 auth attempts per 15min)
- CORS protection
- Helmet security headers
- Input validation
- SQL injection prevention

### 📊 **Audit Logging**
- Login attempts
- Password access
- CRUD operations
- IP tracking
- User agent logging

---

## Database Schema Overview

```
users (authentication)
├── id, username, email
├── password_hash, salt
└── created_at, last_login

password_entries (encrypted storage)
├── user_id → users.id
├── title, url, username
├── encrypted_password + iv + tag
├── encrypted_notes + iv + tag
└── category, is_favorite

audit_logs (security tracking)
├── user_id, action, entity
├── ip_address, user_agent
└── timestamp

user_sessions (JWT management)
├── user_id, session_token
├── expires_at, is_revoked
└── ip_address, user_agent
```

---

## Connection Examples

### PlanetScale Connection String:
```
mysql://username:password@aws.connect.psdb.cloud:3306/database_name?ssl={"rejectUnauthorized":true}
```

### Local MAMP Connection:
```
mysql://root:root@localhost:3306/password_manager_db
```

---

## Next Steps

1. ✅ **Setup Database** (choose option above)
2. ✅ **Configure .env** file
3. ✅ **Test connection** with `/health`
4. 🚀 **Start building** API endpoints
5. 🔗 **Connect frontend** to API

## Troubleshooting

### Connection Fails:
- Check database credentials
- Verify database exists
- Ensure MySQL is running (if local)
- Check firewall settings

### Schema Errors:
- Ensure UTF-8 charset
- Check MySQL version compatibility
- Verify table names match code

### Permission Issues:
- Grant proper MySQL user permissions
- Check database user privileges
- Verify SSL requirements (cloud)