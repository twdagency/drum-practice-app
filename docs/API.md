# API Documentation

Complete API integration documentation for the Drum Practice App.

## Overview

The app has production-ready API integration for patterns, collections, and progress tracking with offline support, automatic syncing, and robust error handling.

---

## API Endpoints

### Patterns API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/patterns?userId=xxx` | List all patterns for user |
| `POST` | `/api/patterns` | Create new pattern |
| `GET` | `/api/patterns/[id]` | Get single pattern |
| `PUT` | `/api/patterns/[id]` | Update pattern |
| `DELETE` | `/api/patterns/[id]` | Delete pattern |

### Collections API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/collections?userId=xxx` | List all collections |
| `POST` | `/api/collections` | Create collection |
| `GET` | `/api/collections/[id]` | Get single collection |
| `PUT` | `/api/collections/[id]` | Update collection |
| `DELETE` | `/api/collections/[id]` | Delete collection |

### Progress API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/progress?userId=xxx` | Get practice progress |
| `POST` | `/api/progress` | Save/update progress |

### Other Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health/db` | Database health check |
| `GET` | `/api/admin/stats` | Admin statistics |
| `GET` | `/api/admin/users` | Admin user list |

---

## Frontend Hooks

### usePatternsApi
```typescript
const { loading, error, loadPatterns, savePattern, updatePattern, deletePattern } = usePatternsApi({ 
  userId: 'user123',
  onSuccess: (msg) => console.log(msg),
  onError: (err) => console.error(err)
});
```

### useCollectionsApi
```typescript
const { loading, error, loadCollections, createCollection, updateCollection, deleteCollection } = useCollectionsApi({ userId: 'user123' });
```

### useProgressApi
```typescript
const { loading, error, loadProgress, saveProgress, getPatternProgress } = useProgressApi({ userId: 'user123' });
```

### useAutoSync
Automatic pattern syncing with 2-second debounce:
```typescript
useAutoSync({ silent: true }); // Auto-syncs when patterns change
```

### useProgressTracking
Auto-saves practice progress after sessions.

### useApiHealth
Monitors API connection status and latency.

---

## Sync Features

### Auto-Sync
- Triggers 2 seconds after pattern changes
- Silent operation (only shows errors)
- Enable in Settings → API Sync Settings

### Manual Sync Options
1. **Download from API** - Replace local with server patterns
2. **Upload to API** - Backup local patterns to server
3. **Bidirectional** - Merge both (recommended)

### Offline Support
- Operations queued when offline (max 100)
- Automatic processing when connection restored
- Max 5 retries per operation

### Conflict Resolution
- Compares by pattern content (not just ID)
- Server version preferred (has timestamps)
- Conflicts logged for debugging

---

## Error Handling

### Retry Strategy
```
Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 2 seconds
Attempt 4: Wait 4 seconds (max 10 seconds)
```

### Validation Rules
- Time signature: Format "X/Y" (numerator 1-32, denominator power of 2)
- Subdivision: Common values (4, 8, 12, 16, 24, 32)
- Phrase: Space-separated numbers
- Drum pattern: Valid tokens (K, S, H, T, F, R, L, -, x)

---

## Configuration

### LocalStorage Keys
| Key | Purpose |
|-----|---------|
| `dpgen_api_sync_enabled` | API sync on/off |
| `dpgen_auto_sync_enabled` | Auto-sync on/off |
| `dpgen_user_id` | User identifier |
| `dpgen_patterns` | Local pattern storage |

---

## File Structure

```
app/api/
├── patterns/           # Pattern endpoints
├── collections/        # Collection endpoints
├── progress/           # Progress endpoints
└── storage.ts          # Shared storage (in-memory)

lib/utils/
├── apiClient.ts        # API client with retry
├── apiRetry.ts         # Retry logic
├── patternSync.ts      # Sync utilities
├── syncQueue.ts        # Offline queue
└── patternValidation.ts # Data validation

hooks/
├── usePatternsApi.ts
├── useCollectionsApi.ts
├── useProgressApi.ts
├── useAutoSync.ts
├── useProgressTracking.ts
├── useApiHealth.ts
└── useSyncQueue.ts

components/
├── PracticeMode/ApiSyncSettingsModal.tsx
└── shared/
    ├── ApiSyncStatus.tsx
    ├── AutoSyncWrapper.tsx
    └── ProgressTrackingWrapper.tsx
```

---

## Current Limitations

### Storage
- **In-memory**: Data resets on server restart
- Ready for database integration (PostgreSQL/MongoDB)

### Authentication
- Manual user ID entry
- Ready for NextAuth.js integration

---

## Testing

### Test Endpoints
```bash
# Get patterns
curl http://localhost:3000/api/patterns?userId=test

# Save pattern
curl -X POST http://localhost:3000/api/patterns \
  -H "Content-Type: application/json" \
  -d '{"pattern": {...}, "userId": "test"}'
```

### Manual Testing
1. Enable API sync in Settings
2. Create a pattern
3. Wait 2 seconds for auto-sync
4. Verify: `GET /api/patterns?userId=yourId`

