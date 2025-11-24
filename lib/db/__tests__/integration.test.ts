/**
 * Integration Tests for Database Operations
 * Tests actual database operations with test database
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { 
  setupTestDatabase, 
  cleanTestDatabase, 
  closeTestPool 
} from './testDb';
import { 
  createTestUser, 
  createTestPattern, 
  createTestCollection,
  createTestProgress,
  getTestUserByEmail,
} from './fixtures';
import { getUserPatterns, getUserCollections, getUserProgress } from './testHelpers';

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database schema if database URL is available
    if (process.env.TEST_DATABASE_URL || process.env.DATABASE_URL) {
      try {
        await setupTestDatabase();
      } catch (error) {
        console.warn('Test database setup failed - skipping integration tests:', error);
      }
    }
  });

  afterAll(async () => {
    await closeTestPool();
  });

  beforeEach(async () => {
    await cleanTestDatabase();
  });

  describe('User Operations', () => {
    it('should create a test user', async () => {
      const user = await createTestUser({
        email: 'integration-test@example.com',
        name: 'Integration Test User',
      });

      expect(user.id).toBeTruthy();
      expect(user.email).toBe('integration-test@example.com');
      expect(user.name).toBe('Integration Test User');
      expect(user.password_hash).toBeTruthy();
    });

    it('should retrieve user by email', async () => {
      const createdUser = await createTestUser({
        email: 'retrieve-test@example.com',
      });

      const retrievedUser = await getTestUserByEmail('retrieve-test@example.com');

      expect(retrievedUser).not.toBeNull();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.email).toBe('retrieve-test@example.com');
    });
  });

  describe('Pattern Operations', () => {
    it('should create a test pattern', async () => {
      const user = await createTestUser();
      const pattern = await createTestPattern({
        userId: user.id,
        timeSignature: '4/4',
        subdivision: 16,
        phrase: '4 4 4 4',
        drumPattern: 'S K S K',
      });

      expect(pattern.id).toBeTruthy();
      expect(pattern.timeSignature).toBe('4/4');
      expect(pattern.subdivision).toBe(16);
      expect(pattern.drumPattern).toBe('S K S K');
    });

    it('should retrieve user patterns', async () => {
      const user = await createTestUser();
      
      await createTestPattern({ userId: user.id, drumPattern: 'S K S K' });
      await createTestPattern({ userId: user.id, drumPattern: 'H H S K' });

      const patterns = await getUserPatterns(user.id);

      expect(patterns).toHaveLength(2);
      expect(patterns[0].drumPattern).toBe('S K S K');
      expect(patterns[1].drumPattern).toBe('H H S K');
    });
  });

  describe('Collection Operations', () => {
    it('should create a test collection', async () => {
      const user = await createTestUser();
      const pattern1 = await createTestPattern({ userId: user.id });
      const pattern2 = await createTestPattern({ userId: user.id });

      const collection = await createTestCollection({
        userId: user.id,
        name: 'Test Collection',
        patternIds: [pattern1.id, pattern2.id],
        tags: ['test', 'integration'],
      });

      expect(collection.id).toBeTruthy();
      expect(collection.name).toBe('Test Collection');
      expect(collection.patternIds).toHaveLength(2);
      expect(collection.tags).toContain('test');
    });

    it('should retrieve user collections', async () => {
      const user = await createTestUser();
      
      await createTestCollection({ userId: user.id, name: 'Collection 1' });
      await createTestCollection({ userId: user.id, name: 'Collection 2' });

      const collections = await getUserCollections(user.id);

      expect(collections).toHaveLength(2);
      expect(collections[0].name).toBe('Collection 1');
      expect(collections[1].name).toBe('Collection 2');
    });
  });

  describe('Progress Operations', () => {
    it('should create a test progress entry', async () => {
      const user = await createTestUser();
      const pattern = await createTestPattern({ userId: user.id });

      const progress = await createTestProgress({
        userId: user.id,
        patternId: pattern.id,
        practiceType: 'midi',
        accuracy: 85.5,
        timing: 90.0,
        totalTime: 300,
      });

      expect(progress.id).toBeTruthy();
      expect(progress.userId).toBe(user.id);
      expect(progress.patternId).toBe(pattern.id);
      expect(progress.practiceType).toBe('midi');
      expect(progress.accuracy).toBe(85.5);
    });

    it('should retrieve user progress', async () => {
      const user = await createTestUser();
      const pattern = await createTestPattern({ userId: user.id });

      await createTestProgress({
        userId: user.id,
        patternId: pattern.id,
        practiceType: 'midi',
      });
      await createTestProgress({
        userId: user.id,
        patternId: pattern.id,
        practiceType: 'microphone',
      });

      const progress = await getUserProgress(user.id);

      expect(progress).toHaveLength(2);
      expect(progress[0].practice_type).toBe('midi');
      expect(progress[1].practice_type).toBe('microphone');
    });
  });

  describe('Data Isolation', () => {
    it('should isolate data between users', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      await createTestPattern({ userId: user1.id, drumPattern: 'User 1 Pattern' });
      await createTestPattern({ userId: user2.id, drumPattern: 'User 2 Pattern' });

      const user1Patterns = await getUserPatterns(user1.id);
      const user2Patterns = await getUserPatterns(user2.id);

      expect(user1Patterns).toHaveLength(1);
      expect(user2Patterns).toHaveLength(1);
      expect(user1Patterns[0].drumPattern).toBe('User 1 Pattern');
      expect(user2Patterns[0].drumPattern).toBe('User 2 Pattern');
    });
  });
});

