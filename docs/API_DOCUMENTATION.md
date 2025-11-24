# API Documentation

## Overview

The Drum Practice App API provides endpoints for managing patterns, collections, and tracking practice progress. All endpoints return JSON responses with a consistent structure.

## Base URL

All API endpoints are prefixed with `/api`.

## Response Format

All responses follow this structure:

```typescript
{
  success: boolean;
  data?: T;           // Response data (if successful)
  error?: string;     // Error message (if failed)
  message?: string;   // Success message (for some operations)
  count?: number;     // Count of items (for list endpoints)
}
```

## Authentication

Currently, authentication is not implemented. All endpoints accept an optional `userId` parameter. In production, this will be replaced with proper authentication (JWT tokens, session cookies, etc.).

## Endpoints

### Patterns

#### GET `/api/patterns`

Get all patterns.

**Query Parameters:**
- `userId` (optional): Filter patterns by user ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1234567890,
      "timeSignature": "4/4",
      "subdivision": 16,
      "phrase": "4 4 4 4",
      "drumPattern": "S S K S",
      "stickingPattern": "R L R L",
      "leftFoot": false,
      "rightFoot": false,
      "repeat": 1,
      "createdAt": 1234567890000,
      "updatedAt": 1234567890000
    }
  ],
  "count": 1
}
```

#### POST `/api/patterns`

Create a new pattern.

**Request Body:**
```json
{
  "pattern": {
    "id": 1234567890,
    "timeSignature": "4/4",
    "subdivision": 16,
    "phrase": "4 4 4 4",
    "drumPattern": "S S K S",
    "stickingPattern": "R L R L",
    "leftFoot": false,
    "rightFoot": false,
    "repeat": 1
  },
  "userId": "user123" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1234567890,
    "timeSignature": "4/4",
    // ... pattern fields
    "createdAt": 1234567890000,
    "updatedAt": 1234567890000
  }
}
```

#### GET `/api/patterns/[id]`

Get a single pattern by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1234567890,
    // ... pattern fields
    "createdAt": 1234567890000,
    "updatedAt": 1234567890000
  }
}
```

#### PUT `/api/patterns/[id]`

Update a pattern.

**Request Body:**
```json
{
  "pattern": {
    "timeSignature": "3/4",
    // ... updated fields
  },
  "userId": "user123" // optional, required for ownership check
}
```

#### DELETE `/api/patterns/[id]`

Delete a pattern.

**Query Parameters:**
- `userId` (optional): Required for ownership check

**Response:**
```json
{
  "success": true,
  "message": "Pattern deleted successfully"
}
```

### Collections

#### GET `/api/collections`

Get all collections.

**Query Parameters:**
- `userId` (optional): Filter collections by user ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "col_1234567890_abc123",
      "name": "My Practice Set",
      "description": "A collection of patterns for practice",
      "patternIds": [1234567890, 1234567891],
      "tags": ["practice", "beginner"],
      "userId": "user123",
      "createdAt": 1234567890000,
      "updatedAt": 1234567890000
    }
  ],
  "count": 1
}
```

#### POST `/api/collections`

Create a new collection.

**Request Body:**
```json
{
  "name": "My Practice Set",
  "description": "A collection of patterns",
  "patternIds": [1234567890, 1234567891],
  "tags": ["practice", "beginner"],
  "userId": "user123" // optional
}
```

#### GET `/api/collections/[id]`

Get a single collection by ID.

#### PUT `/api/collections/[id]`

Update a collection.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "patternIds": [1234567890],
  "tags": ["updated"],
  "userId": "user123" // optional, required for ownership check
}
```

#### DELETE `/api/collections/[id]`

Delete a collection.

**Query Parameters:**
- `userId` (optional): Required for ownership check

### Progress

#### GET `/api/progress`

Get user practice progress.

**Query Parameters:**
- `userId` (required): User ID
- `patternId` (optional): Filter by pattern ID
- `practiceType` (optional): Filter by practice type (`midi`, `microphone`, `recording`)

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "progress": [
      {
        "userId": "user123",
        "patternId": 1234567890,
        "practiceType": "midi",
        "accuracy": 85.5,
        "timing": 92.3,
        "attempts": 10,
        "bestAccuracy": 95.0,
        "bestTiming": 98.5,
        "lastPracticed": 1234567890000,
        "totalTime": 3600,
        "notes": [
          {
            "noteIndex": 0,
            "accuracy": 90.0,
            "timing": 95.0,
            "attempts": 10
          }
        ]
      }
    ]
  }
}
```

#### POST `/api/progress`

Save or update practice progress.

**Request Body:**
```json
{
  "userId": "user123",
  "patternId": 1234567890,
  "practiceType": "midi",
  "accuracy": 85.5,
  "timing": 92.3,
  "totalTime": 60,
  "notes": [
    {
      "noteIndex": 0,
      "accuracy": 90.0,
      "timing": 95.0,
      "attempts": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "patternId": 1234567890,
    "practiceType": "midi",
    "accuracy": 85.5,
    "timing": 92.3,
    "attempts": 11,
    "bestAccuracy": 95.0,
    "bestTiming": 98.5,
    "lastPracticed": 1234567890000,
    "totalTime": 3660
  }
}
```

## Error Responses

All endpoints may return error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Pattern data is required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Pattern not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Failed to fetch patterns"
}
```

## Usage Example

Using the API client utilities:

```typescript
import { patternsApi, collectionsApi, progressApi } from '@/lib/utils/apiClient';

// Get all patterns
const patterns = await patternsApi.getAll();

// Save a pattern
const savedPattern = await patternsApi.save(pattern, 'user123');

// Create a collection
const collection = await collectionsApi.create({
  name: 'My Practice Set',
  patternIds: [pattern.id],
  userId: 'user123'
});

// Save progress
const progress = await progressApi.save({
  userId: 'user123',
  patternId: pattern.id,
  practiceType: 'midi',
  accuracy: 85.5,
  timing: 92.3,
  totalTime: 60
});
```

## Storage

Currently, all data is stored in-memory using Map objects. This means:
- Data is lost when the server restarts
- Data is not shared across server instances
- Suitable for development and testing only

**For production**, replace the storage in `app/api/storage.ts` with a proper database:
- PostgreSQL
- MongoDB
- SQLite (for smaller deployments)
- Any other database of your choice

## Future Enhancements

- [ ] User authentication (JWT, OAuth, etc.)
- [ ] Database integration
- [ ] Rate limiting
- [ ] Input validation and sanitization
- [ ] Pagination for list endpoints
- [ ] Search and filtering
- [ ] Export/import functionality
- [ ] Analytics endpoints
