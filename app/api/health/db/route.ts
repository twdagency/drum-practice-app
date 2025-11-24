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
    // Test basic connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          message: 'Database connection failed',
          timestamp: new Date().toISOString(),
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

