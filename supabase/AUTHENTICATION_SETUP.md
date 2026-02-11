# Authentication Setup Guide

This guide explains how to set up authentication for the One Rehab application using Supabase Auth.

## Overview

The application uses Supabase Auth for user authentication. All database operations require an authenticated user session. Row Level Security (RLS) policies ensure that only authenticated users can access data.

## Quick Start

### Step 1: Create Your First User

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **"Add user"** → **"Create new user"**
5. Fill in:
   - **Email**: `admin@example.com` (or your email)
   - **Password**: Choose a secure password
   - **Auto Confirm User**: ✅ Check this (for development)
6. Click **"Create user"**

### Step 2: Login to the App

1. Start your development server: `npm run dev`
2. Navigate to http://localhost:3000/login
3. Enter the email and password you just created
4. Click "Sign in"

You should now be authenticated and able to create patients, visits, etc.

## How Authentication Works

### Authentication Flow

1. **Login**: User enters email/password → Supabase Auth validates → Session created
2. **Session Management**: Supabase client automatically manages session tokens
3. **API Calls**: All Supabase API calls include the session token automatically
4. **RLS Policies**: Database checks if user is authenticated before allowing operations

### Code Implementation

**AuthContext** (`contexts/AuthContext.tsx`):
- Manages user state
- Handles login/logout
- Listens to auth state changes
- Provides user info to the app

**Supabase Client** (`lib/supabase/client.ts`):
- Configured with `persistSession: true` - sessions survive page refreshes
- Configured with `autoRefreshToken: true` - tokens refresh automatically

**RLS Policies** (`supabase/schema.sql`):
- All tables have policies that check `authenticated` role
- Only authenticated users can read/write data

## User Metadata

You can store additional user information in `user_metadata`:

```sql
-- Update user metadata via Supabase Dashboard or API
UPDATE auth.users 
SET user_metadata = jsonb_build_object(
  'name', 'John Doe',
  'role', 'admin'
)
WHERE id = 'user-id';
```

Or via Supabase Dashboard:
1. Go to **Authentication** → **Users**
2. Click on a user
3. Edit **User Metadata** field
4. Add: `{"name": "John Doe", "role": "admin"}`

## Email Configuration (For Production)

### Enable Email Provider

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure:
   - **Enable email confirmations**: For production, require email verification
   - **Enable email change confirmations**: Require verification when changing email
   - **Secure email change**: Enable for security

### Email Templates

Customize email templates in **Authentication** → **Email Templates**:
- Confirm signup
- Magic Link
- Change Email Address
- Reset Password

### SMTP Configuration (Optional)

For custom email sending:
1. Go to **Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Configure your SMTP server

## Password Requirements

Default Supabase password requirements:
- Minimum 6 characters

To change:
1. Go to **Authentication** → **Policies**
2. Configure password policy

## Session Management

### Session Duration

- **Access Token**: 1 hour (default)
- **Refresh Token**: 30 days (default)
- **Auto-refresh**: Enabled by default

### Session Storage

Sessions are stored in:
- **Browser**: LocalStorage (default)
- **Cookie**: Can be configured for better security

## Security Best Practices

1. **Never expose service role key** - Only use anon key on client
2. **Use RLS policies** - Always enable RLS on tables
3. **Validate user permissions** - Check user role in application code
4. **Enable email verification** - For production
5. **Use HTTPS** - Always in production
6. **Set strong passwords** - Enforce password policies

## Troubleshooting

### "401 Unauthorized" Error

**Cause**: User is not authenticated or session expired

**Solution**:
1. Check if user is logged in (check browser cookies)
2. Try logging out and logging back in
3. Check Supabase Dashboard → Authentication → Users (user exists?)
4. Verify RLS policies allow `authenticated` role

### "new row violates row-level security policy"

**Cause**: RLS policy is blocking the operation

**Solution**:
1. Verify user is authenticated (check session)
2. Check RLS policies in Supabase Dashboard
3. Ensure policies allow `authenticated` role for the operation

### Session Not Persisting

**Cause**: Session storage issue

**Solution**:
1. Check browser localStorage (DevTools → Application → Local Storage)
2. Clear cookies/localStorage and login again
3. Verify `persistSession: true` in Supabase client config

### Can't Login

**Cause**: User doesn't exist or wrong credentials

**Solution**:
1. Verify user exists in Supabase Dashboard
2. Check email/password are correct
3. If using email confirmation, check if user is confirmed
4. Check browser console for error messages

## Testing Authentication

### Test Login Flow

```typescript
// In browser console (after loading app)
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
})
console.log('Login:', data, error)
```

### Check Current Session

```typescript
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

### Test API Call

```typescript
// Should work if authenticated
const { data, error } = await supabase
  .from('patients')
  .select('*')
console.log('Patients:', data, error)
```

## Next Steps

After setting up authentication:

1. ✅ Create your first user
2. ✅ Test login/logout
3. ✅ Test creating a patient (should work now!)
4. ✅ Configure email templates (for production)
5. ✅ Set up password policies (for production)
6. ✅ Consider adding user roles/permissions
