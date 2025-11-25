/**
 * Database Health Check Endpoint
 * Tests database connection without requiring authentication
 * GET /api/health/db
 */

import { NextResponse } from 'next/server';
import { testConnection, query } from '@/lib/db/connection';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          message: 'DATABASE_URL environment variable is not set',
          timestamp: new Date().toISOString(),
          troubleshooting: {
            step: 'Add DATABASE_URL to Vercel environment variables',
            location: 'Vercel Dashboard → Settings → Environment Variables',
          },
        },
        { status: 503 }
      );
    }

    // Test basic connection with detailed error
    let connectionError: Error | unknown = null;
    const isConnected = await testConnection().catch((error) => {
      connectionError = error;
      return false;
    });
    
    if (!isConnected) {
      const errorMessage = connectionError instanceof Error 
        ? connectionError.message 
        : typeof connectionError === 'string' 
          ? connectionError 
          : 'Unknown connection error';
      const errorCode = connectionError && typeof connectionError === 'object' && 'code' in connectionError
        ? (connectionError as any).code
        : undefined;
      
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          message: 'Database connection failed',
          error: errorMessage,
          errorCode: errorCode || 'UNKNOWN',
          timestamp: new Date().toISOString(),
          troubleshooting: {
            connectionString: databaseUrl.replace(/:[^:@]+@/, ':****@'), // Hide password
            commonIssues: [
              'Check that your database password is correct',
              'Verify IP restrictions in Supabase (Settings → Database → Connection Pooling → Allowed IPs)',
              'Ensure you\'re using the Transaction pooler connection string (port 6543)',
              'Check that your Supabase project is active and not paused',
            ],
          },
        },
        { status: 503 }
      );
    }

    // Test a simple query
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    const currentTime = result.rows[0]?.current_time;
    const pgVersion = result.rows[0]?.pg_version;

    // Check if tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const tables = tablesResult.rows.map(row => row.table_name);

    // Check key tables
    const keyTables = ['patterns', 'collections', 'progress', 'users'];
    const missingTables = keyTables.filter(table => !tables.includes(table));

    return NextResponse.json({
      success: true,
      status: 'healthy',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        currentTime,
        postgresVersion: pgVersion?.split(',')[0] || 'unknown',
        tables: {
          total: tables.length,
          list: tables,
          keyTables: {
            expected: keyTables,
            found: keyTables.filter(table => tables.includes(table)),
            missing: missingTables,
          },
        },
      },
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

