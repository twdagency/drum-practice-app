# Database Setup Guide

This guide will help you set up PostgreSQL for the Drum Practice App.

## Prerequisites

- PostgreSQL installed and running locally
- Node.js and npm installed
- Access to create databases

## Step 1: Configure Environment Variables

Create a `.env.local` file in the project root (if it doesn't exist):

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/drum_practice_app
```

**Replace:**
- `postgres` with your PostgreSQL username
- `your_password` with your PostgreSQL password
- `localhost:5432` with your PostgreSQL host and port (if different)
- `drum_practice_app` with your database name (if different)

### Connection String Format

```
postgresql://username:password@host:port/database_name
```

## Step 3: Run Database Setup

Run the setup script to create tables and schema:

```bash
npm run db:setup
```

This will:
- Create all necessary tables (patterns, collections, progress)
- Set up indexes for performance
- Create triggers for auto-updating timestamps

## Step 4: Verify Setup

You can verify the setup by checking if tables exist:

```sql
\c drum_practice_app
\dt
```

You should see:
- `patterns`
- `collections`
- `progress`

## Troubleshooting

### Connection Error

If you get a connection error:

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   Get-Service postgresql*
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. **Check connection string:**
   - Verify username and password
   - Check host and port (default: localhost:5432)
   - Ensure database exists

3. **Test connection manually:**
   ```bash
   psql -U postgres -d drum_practice_app -c "SELECT NOW();"
   ```

### Permission Errors

If you get permission errors:

1. **Grant permissions:**
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE drum_practice_app TO your_username;
   ```

2. **Or use superuser:**
   - Use `postgres` user (default superuser)
   - Or create a user with appropriate permissions

### Tables Already Exist

If tables already exist and you want to reset:

```sql
DROP TABLE IF EXISTS progress CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS patterns CASCADE;
```

Then run `npm run db:setup` again.

## Database Schema

### Tables

1. **patterns** - Stores drum patterns
   - Primary key: `id` (BIGSERIAL)
   - Indexed on: `user_id`, `created_at`

2. **collections** - Stores pattern collections
   - Primary key: `id` (VARCHAR)
   - Indexed on: `user_id`

3. **progress** - Stores practice progress
   - Primary key: `id` (BIGSERIAL)
   - Unique constraint: `(user_id, pattern_id, practice_type)`
   - Indexed on: `user_id`, `pattern_id`, `practice_type`

### Auto-Updated Timestamps

All tables have `created_at` and `updated_at` timestamps that are automatically managed:
- `created_at` - Set on insert
- `updated_at` - Auto-updated on any update

## Development vs Production

### Development (Local)
- Use local PostgreSQL instance
- Connection string: `postgresql://postgres:password@localhost:5432/drum_practice_app`

### Production
- Use managed PostgreSQL service (AWS RDS, Heroku Postgres, etc.)
- Connection string provided by service
- Ensure SSL is enabled: `?sslmode=require`

## Next Steps

After database setup:
1. ✅ Database is ready
2. ⏭️ Test API endpoints
3. ⏭️ Set up authentication (NextAuth.js)
4. ⏭️ Deploy to production

## Manual Database Operations

### View All Patterns
```sql
SELECT id, time_signature, subdivision, created_at FROM patterns;
```

### View User Progress
```sql
SELECT * FROM progress WHERE user_id = 'your_user_id';
```

### Count Records
```sql
SELECT 
  (SELECT COUNT(*) FROM patterns) as patterns,
  (SELECT COUNT(*) FROM collections) as collections,
  (SELECT COUNT(*) FROM progress) as progress_records;
```

