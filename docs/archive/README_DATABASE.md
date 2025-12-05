# Database Setup - Quick Guide

Since `psql` is not in your PATH, use these Node.js scripts instead:

## Step 1: Create `.env.local`

Create a file named `.env.local` in the project root:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/drum_practice_app
```

**Replace `YOUR_PASSWORD` with your actual PostgreSQL password.**

## Step 2: Create Database

```bash
npm run db:create
```

This will create the database automatically.

## Step 3: Setup Tables

```bash
npm run db:setup
```

This creates all tables, indexes, and triggers.

## Done! 🎉

Your database is ready. Start the dev server:

```bash
npm run dev
```

## Troubleshooting

**Password authentication failed?**
- Double-check your password in `.env.local`
- Make sure PostgreSQL is running
- Try connecting with a PostgreSQL GUI tool (pgAdmin, DBeaver, etc.) to verify credentials

**Database already exists?**
- That's fine! Just run `npm run db:setup` to create tables

**Still having issues?**
- Check `docs/DATABASE_SETUP.md` for detailed troubleshooting

