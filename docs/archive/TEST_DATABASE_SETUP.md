# Test Database Setup Guide

## Overview

The test suite includes utilities for setting up and managing a test database. This allows for integration tests that interact with a real PostgreSQL database.

## Configuration

### Environment Variables

Set one of these environment variables:

```env
# Option 1: Dedicated test database URL
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/drum_practice_test

# Option 2: Use main database URL (will create _test database)
DATABASE_URL=postgresql://user:password@localhost:5432/drum_practice
```

If `TEST_DATABASE_URL` is not set, the system will automatically use `DATABASE_URL` with a `_test` suffix.

## Test Database Utilities

### `lib/db/__tests__/testDb.ts`

Core test database utilities:

- `getTestPool()` - Get test database connection pool
- `testQuery()` - Execute queries on test database
- `setupTestDatabase()` - Create schema in test database
- `cleanTestDatabase()` - Truncate all tables
- `dropTestDatabase()` - Drop all tables
- `resetTestDatabase()` - Clean and reset database
- `closeTestPool()` - Close connection pool

### `lib/db/__tests__/fixtures.ts`

Test data fixtures:

- `createTestUser()` - Create a test user
- `createTestPattern()` - Create a test pattern
- `createTestCollection()` - Create a test collection
- `createTestProgress()` - Create a test progress entry
- `getTestUserByEmail()` - Retrieve user by email
- `getTestPatternById()` - Retrieve pattern by ID
- `createTestPatterns()` - Create multiple patterns

### `lib/db/__tests__/testHelpers.ts`

Helper functions:

- `tableExists()` - Check if table exists
- `getRowCount()` - Get row count for table
- `getUserPatterns()` - Get all patterns for user
- `getUserCollections()` - Get all collections for user
- `getUserProgress()` - Get all progress for user
- `deleteUser()` - Delete user and all their data
- `verifySchema()` - Verify database schema

## Usage Examples

### Basic Test Setup

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { cleanTestDatabase } from '@/lib/db/__tests__/testDb';
import { createTestUser, createTestPattern } from '@/lib/db/__tests__/fixtures';

describe('My Test Suite', () => {
  beforeEach(async () => {
    await cleanTestDatabase();
  });

  it('should create a user', async () => {
    const user = await createTestUser({
      email: 'test@example.com',
      name: 'Test User',
    });
    
    expect(user.id).toBeTruthy();
  });
});
```

### Using Fixtures

```typescript
import { createTestUser, createTestPattern, createTestCollection } from '@/lib/db/__tests__/fixtures';

it('should create related data', async () => {
  const user = await createTestUser();
  const pattern = await createTestPattern({ userId: user.id });
  const collection = await createTestCollection({
    userId: user.id,
    patternIds: [pattern.id],
  });
  
  expect(collection.patternIds).toContain(pattern.id);
});
```

### Manual Database Operations

```typescript
import { testQuery } from '@/lib/db/__tests__/testDb';

it('should query database directly', async () => {
  const result = await testQuery('SELECT COUNT(*) as count FROM patterns');
  expect(result.rows[0].count).toBe('0');
});
```

## Test Database Lifecycle

1. **Before All Tests**: `setupTestDatabase()` is called automatically (in `vitest.setup.ts`)
2. **Before Each Test**: Optionally call `cleanTestDatabase()` to reset data
3. **After All Tests**: Connection pool is closed automatically

## Best Practices

1. **Always clean database** between tests to ensure isolation
2. **Use fixtures** instead of manual SQL when possible
3. **Test data isolation** - verify users can't access each other's data
4. **Clean up** - delete test data after tests complete
5. **Use transactions** for complex test scenarios

## Running Tests with Database

```bash
# Set test database URL
export TEST_DATABASE_URL=postgresql://user:password@localhost:5432/drum_practice_test

# Run tests
npm test

# Run specific test file
npm test -- lib/db/__tests__/integration.test.ts
```

## Troubleshooting

### Database Connection Errors

- Verify `TEST_DATABASE_URL` or `DATABASE_URL` is set
- Check PostgreSQL is running
- Verify database exists
- Check user permissions

### Schema Errors

- Ensure `lib/db/schema.sql` exists
- Check for syntax errors in schema files
- Verify all required tables are created

### Data Persistence Issues

- Call `cleanTestDatabase()` in `beforeEach` if needed
- Check for transaction rollbacks
- Verify foreign key constraints

## Integration Test Example

See `lib/db/__tests__/integration.test.ts` for a complete example of integration tests using the test database utilities.

