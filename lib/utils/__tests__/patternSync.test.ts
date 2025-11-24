/**
 * Unit tests for pattern sync utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  loadPatternsFromStorage, 
  savePatternsToStorage,
  syncFromApi,
  syncToApi,
  syncBidirectional,
  isApiSyncEnabled,
  setApiSyncEnabled,
  isAutoSyncEnabled,
  setAutoSyncEnabled,
} from '../patternSync';
import { patternsApi } from '../apiClient';
import { Pattern } from '@/types/pattern';
import { isOnline, queueSyncOperation } from '../syncQueue';

// Mock dependencies
vi.mock('../apiClient');
vi.mock('../syncQueue');

const mockPatternsApi = patternsApi as any;
const mockIsOnline = isOnline as ReturnType<typeof vi.fn>;
const mockQueueSyncOperation = queueSyncOperation as ReturnType<typeof vi.fn>;

describe('loadPatternsFromStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should return empty array when storage is empty', () => {
    const patterns = loadPatternsFromStorage();
    expect(patterns).toEqual([]);
  });

  it('should load patterns from localStorage', () => {
    const testPatterns: Pattern[] = [
      {
        id: 1,
        timeSignature: '4/4',
        subdivision: 16,
        phrase: '4 4 4 4',
        drumPattern: 'S K S K',
        stickingPattern: 'R L R L',
        repeat: 1,
        leftFoot: false,
        rightFoot: false,
        accents: [],
        notes: ['S', 'K', 'S', 'K'],
      },
    ];
    
    localStorage.setItem('dpgen_patterns', JSON.stringify(testPatterns));
    const patterns = loadPatternsFromStorage();
    
    expect(patterns).toEqual(testPatterns);
  });

  it('should return empty array on parse error', () => {
    localStorage.setItem('dpgen_patterns', 'invalid json');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const patterns = loadPatternsFromStorage();
    
    expect(patterns).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should return empty array if stored data is not an array', () => {
    localStorage.setItem('dpgen_patterns', JSON.stringify({ not: 'an array' }));
    const patterns = loadPatternsFromStorage();
    
    expect(patterns).toEqual([]);
  });
});

describe('savePatternsToStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should save patterns to localStorage', () => {
    const testPatterns: Pattern[] = [
      {
        id: 1,
        timeSignature: '4/4',
        subdivision: 16,
        phrase: '4 4 4 4',
        drumPattern: 'S K S K',
        stickingPattern: 'R L R L',
        repeat: 1,
        leftFoot: false,
        rightFoot: false,
        accents: [],
        notes: ['S', 'K', 'S', 'K'],
      },
    ];
    
    savePatternsToStorage(testPatterns);
    
    const stored = localStorage.getItem('dpgen_patterns');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toEqual(testPatterns);
  });

  it('should throw error on storage failure', () => {
    // Mock localStorage.setItem to throw
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('Storage quota exceeded');
    });
    
    const testPatterns: Pattern[] = [];
    
    expect(() => savePatternsToStorage(testPatterns)).toThrow('Failed to save patterns to storage');
    
    Storage.prototype.setItem = originalSetItem;
  });
});

describe('syncFromApi', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should fetch patterns from API and save to storage', async () => {
    const apiPatterns: Pattern[] = [
      {
        id: 1,
        timeSignature: '4/4',
        subdivision: 16,
        phrase: '4 4 4 4',
        drumPattern: 'S K S K',
        stickingPattern: 'R L R L',
        repeat: 1,
        leftFoot: false,
        rightFoot: false,
        accents: [],
        notes: ['S', 'K', 'S', 'K'],
      },
    ];
    
    mockPatternsApi.getAll.mockResolvedValue(apiPatterns);
    
    const result = await syncFromApi();
    
    expect(result).toEqual(apiPatterns);
    expect(mockPatternsApi.getAll).toHaveBeenCalled();
    
    const stored = localStorage.getItem('dpgen_patterns');
    expect(JSON.parse(stored!)).toEqual(apiPatterns);
  });

  it('should throw error on API failure', async () => {
    const error = new Error('API error');
    mockPatternsApi.getAll.mockRejectedValue(error);
    
    await expect(syncFromApi()).rejects.toThrow('API error');
  });
});

describe('syncToApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save patterns to API when online', async () => {
    const patterns: Pattern[] = [
      {
        id: 1,
        timeSignature: '4/4',
        subdivision: 16,
        phrase: '4 4 4 4',
        drumPattern: 'S K S K',
        stickingPattern: 'R L R L',
        repeat: 1,
        leftFoot: false,
        rightFoot: false,
        accents: [],
        notes: ['S', 'K', 'S', 'K'],
      },
    ];
    
    mockIsOnline.mockReturnValue(true);
    mockPatternsApi.save.mockResolvedValue(patterns[0]);
    
    const result = await syncToApi(patterns);
    
    expect(result).toEqual(patterns);
    expect(mockPatternsApi.save).toHaveBeenCalledWith(patterns[0]);
  });

  it('should queue patterns when offline', async () => {
    const patterns: Pattern[] = [
      {
        id: 1,
        timeSignature: '4/4',
        subdivision: 16,
        phrase: '4 4 4 4',
        drumPattern: 'S K S K',
        stickingPattern: 'R L R L',
        repeat: 1,
        leftFoot: false,
        rightFoot: false,
        accents: [],
        notes: ['S', 'K', 'S', 'K'],
      },
    ];
    
    mockIsOnline.mockReturnValue(false);
    
    const result = await syncToApi(patterns);
    
    expect(result).toEqual(patterns);
    expect(mockQueueSyncOperation).toHaveBeenCalledWith('save', patterns[0]);
    expect(mockPatternsApi.save).not.toHaveBeenCalled();
  });

  it('should queue patterns on API error', async () => {
    const patterns: Pattern[] = [
      {
        id: 1,
        timeSignature: '4/4',
        subdivision: 16,
        phrase: '4 4 4 4',
        drumPattern: 'S K S K',
        stickingPattern: 'R L R L',
        repeat: 1,
        leftFoot: false,
        rightFoot: false,
        accents: [],
        notes: ['S', 'K', 'S', 'K'],
      },
    ];
    
    mockIsOnline.mockReturnValue(true);
    mockPatternsApi.save.mockRejectedValue(new Error('API error'));
    
    await expect(syncToApi(patterns)).rejects.toThrow('API error');
    expect(mockQueueSyncOperation).toHaveBeenCalledWith('save', patterns[0]);
  });
});

describe('syncBidirectional', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should merge local and API patterns', async () => {
    const localPatterns: Pattern[] = [
      {
        id: 1,
        timeSignature: '4/4',
        subdivision: 16,
        phrase: '4 4 4 4',
        drumPattern: 'S K S K',
        stickingPattern: 'R L R L',
        repeat: 1,
        leftFoot: false,
        rightFoot: false,
        accents: [],
        notes: ['S', 'K', 'S', 'K'],
      },
    ];
    
    const apiPatterns: Pattern[] = [
      {
        id: 2,
        timeSignature: '3/4',
        subdivision: 8,
        phrase: '3 3 2',
        drumPattern: 'H S K',
        stickingPattern: 'R L R',
        repeat: 1,
        leftFoot: false,
        rightFoot: false,
        accents: [],
        notes: ['H', 'S', 'K'],
      },
    ];
    
    mockPatternsApi.getAll.mockResolvedValue(apiPatterns);
    
    const result = await syncBidirectional(localPatterns);
    
    expect(result).toHaveLength(2);
    expect(result.some(p => p.id === 1)).toBe(true);
    expect(result.some(p => p.id === 2)).toBe(true);
  });

  it('should prefer API version on conflict', async () => {
    const localPattern: Pattern = {
      id: 1,
      timeSignature: '4/4',
      subdivision: 16,
      phrase: '4 4 4 4',
      drumPattern: 'S K S K',
      stickingPattern: 'R L R L',
      repeat: 1,
      leftFoot: false,
      rightFoot: false,
      accents: [],
      notes: ['S', 'K', 'S', 'K'],
    };
    
    const apiPattern: Pattern = {
      id: 1,
      timeSignature: '3/4',
      subdivision: 8,
      phrase: '3 3 2',
      drumPattern: 'H S K',
      stickingPattern: 'R L R',
      repeat: 1,
      leftFoot: false,
      rightFoot: false,
      accents: [],
      notes: ['H', 'S', 'K'],
    };
    
    mockPatternsApi.getAll.mockResolvedValue([apiPattern]);
    
    const result = await syncBidirectional([localPattern]);
    
    expect(result).toHaveLength(1);
    expect(result[0].timeSignature).toBe('3/4'); // API version
  });
});

describe('API sync settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should enable and disable API sync', () => {
    expect(isApiSyncEnabled()).toBe(false);
    
    setApiSyncEnabled(true);
    expect(isApiSyncEnabled()).toBe(true);
    
    setApiSyncEnabled(false);
    expect(isApiSyncEnabled()).toBe(false);
  });

  it('should enable and disable auto-sync', () => {
    expect(isAutoSyncEnabled()).toBe(false);
    
    setAutoSyncEnabled(true);
    expect(isAutoSyncEnabled()).toBe(true);
    
    setAutoSyncEnabled(false);
    expect(isAutoSyncEnabled()).toBe(false);
  });
});

