# Google OAuth Setup Guide

This guide explains how to set up Google sign-in for the One Rehab application using Supabase.

## Is Google OAuth Free?

✅ **Yes!** Google OAuth is **completely free** on Supabase's free tier. There are no additional charges for using OAuth providers like Google, GitHub, etc.

## Step-by-Step Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth client ID"**
5. If prompted, configure the OAuth consent screen:
   - Choose **"External"** (unless you have a Google Workspace)
   - Fill in:
     - **App name**: One Rehab (or your app name)
     - **User support email**: Your email
     - **Developer contact**: Your email
   - Click **"Save and Continue"**
   - Add scopes (default is fine) → **"Save and Continue"**
   - Add test users (optional for development) → **"Save and Continue"**
   - Review → **"Back to Dashboard"**
6. Back in Credentials, click **"Create Credentials"** → **"OAuth client ID"**
7. Choose **"Web application"**
8. Fill in:
   - **Name**: One Rehab Web Client (or any name)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
     - Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference
     - You can find this in Supabase Dashboard → Settings → API → Project URL
9. Click **"Create"**
10. **Copy the Client ID and Client Secret** (you'll need these next)

### Step 2: Configure Google OAuth in Supabase

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and click to expand
5. Toggle **"Enable Google provider"** to ON
6. Enter:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
7. Click **"Save"**

### Step 3: Update Redirect URI in Google Console (Important!)

After saving in Supabase, you'll see the exact redirect URI you need. It will look like:
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

1. Go back to Google Cloud Console → **Credentials**
2. Click on your OAuth client ID
3. Add this exact redirect URI to **"Authorized redirect URIs"**:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
4. Click **"Save"**

### Step 4: Test Google Sign-In

1. Start your development server: `npm run dev`
2. Navigate to http://localhost:3000/login
3. Click **"Continue with Google"**
4. You should be redirected to Google's sign-in page
5. After signing in, you'll be redirected back to your app

## Production Setup

### Update Authorized Origins and Redirect URIs

Before deploying to production:

1. **Google Cloud Console**:
   - Add your production domain to **Authorized JavaScript origins**:
     - `https://yourdomain.com`
   - Add your production redirect URI:
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (same as dev, Supabase handles it)

2. **Supabase Dashboard**:
   - Go to **Authentication** → **URL Configuration**
   - Add your production site URL to **Redirect URLs**:
     - `https://yourdomain.com/dashboard`
     - `https://yourdomain.com/*`

## How It Works

1. **User clicks "Continue with Google"** → App calls `supabase.auth.signInWithOAuth()`
2. **User redirected to Google** → Google shows sign-in page
3. **User signs in** → Google redirects back to Supabase with auth code
4. **Supabase exchanges code for tokens** → Creates/updates user session
5. **User redirected to your app** → Session established, user logged in

## User Data from Google

When a user signs in with Google, Supabase automatically:
- Creates a user account (if new)
- Stores email, name, and profile picture
- Links the Google account to the user

You can access this data in your app:
```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log(user.email) // User's Google email
console.log(user.user_metadata.full_name) // User's name
console.log(user.user_metadata.avatar_url) // Profile picture URL
```

## Troubleshooting

### "redirect_uri_mismatch" Error

**Cause**: Redirect URI in Google Console doesn't match Supabase's callback URL

**Solution**:
1. Check Supabase Dashboard → Authentication → Providers → Google
2. Copy the exact redirect URI shown
3. Add it to Google Cloud Console → Credentials → Your OAuth Client → Authorized redirect URIs

### "Error 400: invalid_request"

**Cause**: Missing or incorrect OAuth credentials

**Solution**:
1. Verify Client ID and Client Secret in Supabase Dashboard
2. Make sure Google OAuth is enabled in Supabase
3. Check that credentials are copied correctly (no extra spaces)

### User Not Redirected Back to App

**Cause**: Redirect URL not configured in Supabase

**Solution**:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your app URL to **Redirect URLs**:
   - Development: `http://localhost:3000/dashboard`
   - Production: `https://yourdomain.com/dashboard`

### OAuth Consent Screen Issues

**Cause**: OAuth consent screen not configured or in testing mode

**Solution**:
1. Go to Google Cloud Console → OAuth consent screen
2. For development: Add test users
3. For production: Submit for verification (if using sensitive scopes)

## Security Best Practices

1. **Never expose Client Secret** - Only use it in Supabase Dashboard (server-side)
2. **Use HTTPS in production** - Required for OAuth
3. **Restrict redirect URIs** - Only add your actual domains
4. **Review OAuth scopes** - Only request permissions you need
5. **Monitor OAuth usage** - Check Google Cloud Console for suspicious activity

## Additional OAuth Providers

Supabase also supports:
- **GitHub** (free)
- **Apple** (free)
- **Azure** (free)
- **Discord** (free)
- **Facebook** (free)
- **Twitter/X** (free)
- **LinkedIn** (free)
- And more...

Setup process is similar - just enable the provider in Supabase Dashboard and add credentials.

## Cost

- ✅ **Google OAuth**: Free
- ✅ **Supabase Auth**: Free (up to 50,000 monthly active users on free tier)
- ✅ **No additional charges** for OAuth providers

The only potential cost is if you exceed Supabase's free tier limits (which are quite generous).
