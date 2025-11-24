# Database Quick Start

## Quick Setup (3 Steps)

### 1. Set Environment Variable

Create `.env.local` in project root:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/drum_practice_app
```

**Replace `your_password` with your PostgreSQL password.**

### 2. Create Database

Run the database creation script:

```bash
npm run db:create
```

This will automatically create the database if it doesn't exist.

**Alternative:** If you have `psql` in your PATH:
```bash
psql -U postgres -c "CREATE DATABASE drum_practice_app;"
```

### 3. Run Setup Script

```bash
npm run db:setup
```

This creates all tables, indexes, and triggers.

That's it! Your database is ready. 🎉

## Verify It Works

Start your dev server:
```bash
npm run dev
```

The API should now use PostgreSQL instead of in-memory storage. Data will persist across server restarts!

## Need Help?

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions and troubleshooting.

