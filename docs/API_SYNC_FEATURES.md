# API Sync Features - Complete Implementation

## Overview

The API sync feature is now fully integrated into the drum practice app, allowing users to sync their patterns between local storage and a server. This enables backup, multi-device access, and collaboration.

## Features Implemented

### 1. API Routes ✅
- **Patterns API**: Full CRUD operations for patterns
- **Collections API**: Manage pattern collections
- **Progress API**: Track practice progress

### 2. Frontend Hooks ✅
- **`usePatternsApi`**: Pattern management operations
- **`useCollectionsApi`**: Collection management
- **`useProgressApi`**: Progress tracking
- **`useAutoSync`**: Automatic pattern syncing

### 3. Sync Utilities ✅
- **`patternSync.ts`**: Bidirectional sync functions
- **Storage management**: User ID and preferences
- **Auto-sync controls**: Enable/disable auto-sync

### 4. UI Components ✅
- **`ApiSyncSettingsModal`**: Full-featured settings modal
- **`ApiSyncStatus`**: Status indicator component
- **Toolbar integration**: Easy access from settings menu

### 5. Auto-Sync ✅
- **Automatic syncing**: Syncs patterns when they change
- **Debounced**: 2-second delay to avoid excessive API calls
- **Configurable**: Can be enabled/disabled in settings
- **Silent mode**: Only shows errors, not success messages

## How to Use

### Initial Setup

1. **Open Settings**
   - Click the gear icon (⚙️) in the toolbar
   - Select "API Sync Settings"

2. **Enable API Sync**
   - Toggle "Enable API Sync" to ON
   - Enter a User ID (e.g., "user123")
   - This will be replaced with authentication in the future

3. **Enable Auto-Sync (Optional)**
   - Toggle "Auto-Sync on Changes" to ON
   - Patterns will automatically sync 2 seconds after changes

### Manual Syncing

You can manually sync patterns in three ways:

1. **Download from API**
   - Replaces local patterns with server patterns
   - Use when you want to load patterns from another device

2. **Upload to API**
   - Saves local patterns to server
   - Use when you want to backup your current patterns

3. **Bidirectional Sync** (Recommended)
   - Merges local and server patterns
   - Keeps patterns from both sources
   - Best for syncing across devices

### Status Indicators

- **Toolbar Menu**: Shows "(Enabled)" when API sync is active
- **Icon Change**: Cloud icon changes to cloud-check when enabled
- **Status Component**: Can be added anywhere to show sync status

## Technical Details

### Auto-Sync Behavior

- **Trigger**: Pattern changes (add, update, delete, reorder)
- **Delay**: 2 seconds debounce (configurable)
- **Conditions**:
  - API sync must be enabled
  - Auto-sync must be enabled
  - User ID must be set
- **Error Handling**: Shows toast notification on failure
- **Success**: Silent (no notification) to avoid spam

### Storage

Currently uses **in-memory storage**:
- ✅ Perfect for development
- ⚠️ Data resets on server restart
- ⚠️ Not shared across server instances
- 🔄 Ready for database integration

### Sync Logic

**Bidirectional Sync Algorithm:**
1. Fetch patterns from API
2. Compare local and remote patterns by ID
3. Prefer API patterns (they have timestamps)
4. Keep local-only patterns
5. Upload local-only patterns to API
6. Save merged result to localStorage

## Configuration

### LocalStorage Keys

- `dpgen_api_sync_enabled`: API sync enabled/disabled
- `dpgen_auto_sync_enabled`: Auto-sync enabled/disabled
- `dpgen_user_id`: User identifier for API calls
- `dpgen_patterns`: Local pattern storage

### API Endpoints

- `GET /api/patterns` - List all patterns
- `POST /api/patterns` - Create pattern
- `GET /api/patterns/[id]` - Get pattern
- `PUT /api/patterns/[id]` - Update pattern
- `DELETE /api/patterns/[id]` - Delete pattern

## Future Enhancements

### Planned Features

1. **Authentication**
   - Replace user ID with proper authentication
   - JWT tokens or OAuth
   - Session management

2. **Database Integration**
   - Replace in-memory storage
   - PostgreSQL, MongoDB, or SQLite
   - Persistent data storage

3. **Conflict Resolution**
   - Better merge strategies
   - Version tracking
   - Conflict resolution UI

4. **Offline Support**
   - Queue syncs when offline
   - Sync when connection restored
   - Local-first architecture

5. **Real-time Sync**
   - WebSocket support
   - Live collaboration
   - Instant updates

## Troubleshooting

### Sync Not Working?

1. **Check Settings**
   - Ensure API sync is enabled
   - Verify User ID is set
   - Check browser console for errors

2. **Check Network**
   - Verify server is running
   - Check API endpoints are accessible
   - Look for CORS issues

3. **Check Storage**
   - Verify localStorage is available
   - Check for quota exceeded errors
   - Clear cache if needed

### Auto-Sync Not Triggering?

1. **Check Auto-Sync Setting**
   - Must be enabled in settings
   - API sync must also be enabled

2. **Check User ID**
   - Must be set for auto-sync to work
   - Check in API Sync Settings modal

3. **Check Debounce**
   - Wait 2 seconds after pattern change
   - Check browser console for errors

## Code Examples

### Using Auto-Sync Hook

```typescript
import { useAutoSync } from '@/hooks/useAutoSync';

function MyComponent() {
  // Auto-sync is enabled automatically if settings allow
  useAutoSync({ silent: true });
  
  // Or manually trigger sync
  const { syncNow } = useAutoSync();
  
  const handleSave = async () => {
    // Save pattern...
    await syncNow(); // Manual sync
  };
}
```

### Using Sync Utilities

```typescript
import { syncBidirectional, isApiSyncEnabled } from '@/lib/utils/patternSync';

async function syncPatterns() {
  if (!isApiSyncEnabled()) {
    return;
  }
  
  const userId = getStoredUserId();
  if (!userId) {
    return;
  }
  
  const synced = await syncBidirectional(patterns, userId);
  setPatterns(synced);
}
```

### Using Status Component

```typescript
import { ApiSyncStatus } from '@/components/shared/ApiSyncStatus';

function MyComponent() {
  const openSettings = () => {
    // Open API sync settings
  };
  
  return (
    <div>
      <ApiSyncStatus compact onClick={openSettings} />
    </div>
  );
}
```

## Testing

### Manual Testing

1. **Enable API Sync**
   - Open settings
   - Enable sync
   - Set user ID

2. **Test Manual Sync**
   - Create a pattern
   - Click "Upload to API"
   - Verify pattern appears in API

3. **Test Auto-Sync**
   - Enable auto-sync
   - Modify a pattern
   - Wait 2 seconds
   - Check API for updated pattern

4. **Test Bidirectional Sync**
   - Create pattern locally
   - Create pattern via API
   - Run bidirectional sync
   - Verify both patterns exist

### API Testing

```bash
# Get all patterns
curl http://localhost:3000/api/patterns?userId=test

# Save a pattern
curl -X POST http://localhost:3000/api/patterns \
  -H "Content-Type: application/json" \
  -d '{"pattern": {...}, "userId": "test"}'
```

## Summary

The API sync feature is **fully functional** and ready for use. All core features are implemented:
- ✅ API routes
- ✅ Frontend hooks
- ✅ Sync utilities
- ✅ UI components
- ✅ Auto-sync
- ✅ Status indicators

The system is ready for production use after database integration and authentication are added.

