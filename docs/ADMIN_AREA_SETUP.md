# Admin Area Setup Guide

## Overview

The admin area has been implemented to allow administrators to manage users, subscriptions, and view analytics. This document explains how to set it up and use it.

## Features Implemented

### 1. Authentication & Authorization
- ✅ Login/logout buttons added to Toolbar
- ✅ `/app` route now requires authentication (redirects to login if not authenticated)
- ✅ Admin area protected with role-based access control

### 2. Admin Dashboard (`/admin`)
- ✅ Overview statistics (users, subscriptions, revenue, patterns)
- ✅ Navigation to user management, subscriptions, and analytics

### 3. User Management (`/admin/users`)
- ✅ View all users
- ✅ See email verification status
- ✅ View subscription status
- ✅ See account creation dates

### 4. Subscription Management (`/admin/subscriptions`)
- ✅ View all active subscriptions from Stripe
- ✅ See subscription status, plans, and billing dates
- ✅ Integration with Stripe API

### 5. Analytics (`/admin/analytics`)
- ✅ Placeholder page for future analytics features

## Setup Instructions

### 1. Configure Admin Users

Set the `ADMIN_EMAILS` environment variable with comma-separated admin email addresses:

```bash
ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

**Note:** For client-side admin button visibility, you can also set:
```bash
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

However, the actual admin check is always done server-side via the `/api/admin/check` endpoint for security.

### 2. Database Setup

The admin area uses the existing database tables:
- `users` - For user management
- Stripe subscriptions - For subscription management

No additional database migrations are required.

### 3. Stripe Integration

The subscription management page requires Stripe to be configured:
- Set `STRIPE_SECRET_KEY` in environment variables
- The admin subscriptions page will automatically fetch subscription data from Stripe

## Usage

### Accessing the Admin Area

1. **Via Toolbar**: Admin users will see a shield icon (🛡️) in the Toolbar that links to `/admin`
2. **Direct URL**: Navigate to `/admin` (will redirect to login if not authenticated)

### Admin Dashboard

The dashboard shows:
- Total Users
- Active Subscriptions
- Total Revenue
- Patterns Created

### User Management

View and manage all users:
- See user email and name
- Check email verification status
- View subscription tier
- See account creation date

### Subscription Management

View all Stripe subscriptions:
- Customer email
- Plan name
- Subscription status (active, canceled, etc.)
- Monthly amount
- Next billing date

## API Endpoints

### `GET /api/admin/check`
Checks if the current user is an admin.

**Response:**
```json
{
  "isAdmin": true
}
```

### `GET /api/admin/stats`
Gets dashboard statistics (admin only).

**Response:**
```json
{
  "totalUsers": 150,
  "activeSubscriptions": 45,
  "totalRevenue": 1250.50,
  "patternsCreated": 1234
}
```

### `GET /api/admin/users`
Gets all users (admin only).

**Response:**
```json
{
  "users": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-15T10:00:00Z",
      "emailVerified": true
    }
  ]
}
```

### `GET /api/admin/subscriptions`
Gets all subscriptions from Stripe (admin only).

**Response:**
```json
{
  "subscriptions": [
    {
      "id": "sub_123",
      "customerEmail": "customer@example.com",
      "status": "active",
      "planName": "Pro Monthly",
      "currentPeriodEnd": "2024-02-15T10:00:00Z",
      "amount": 9.99
    }
  ]
}
```

## Security Considerations

1. **Server-Side Validation**: All admin checks are performed server-side
2. **Environment Variables**: Admin emails are stored in environment variables, not in the database
3. **Authentication Required**: All admin routes require authentication
4. **Role-Based Access**: Only users with emails in `ADMIN_EMAILS` can access admin features

## Future Enhancements

- [ ] Add user role management in database
- [ ] Add ability to edit user details
- [ ] Add ability to cancel/modify subscriptions
- [ ] Add revenue charts and analytics
- [ ] Add user activity logs
- [ ] Add export functionality for user/subscription data
- [ ] Add search and filtering for users/subscriptions
- [ ] Add pagination for large datasets

## Troubleshooting

### Admin button not showing in Toolbar

1. Check that your email is in `ADMIN_EMAILS` environment variable
2. Check that you're logged in
3. Check browser console for errors
4. Verify `/api/admin/check` returns `{"isAdmin": true}`

### Cannot access admin pages

1. Ensure you're logged in
2. Verify your email is in `ADMIN_EMAILS`
3. Check server logs for authentication errors
4. Clear browser cookies and try again

### Subscriptions page shows no data

1. Verify Stripe is configured (`STRIPE_SECRET_KEY` is set)
2. Check that you have active subscriptions in Stripe
3. Check server logs for Stripe API errors

