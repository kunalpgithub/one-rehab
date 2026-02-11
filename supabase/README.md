# Supabase Database Setup

This directory contains SQL scripts to set up the One Rehab database schema in Supabase.

## Quick Setup (Recommended)

### Method 1: Using Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Schema Script**
   - Copy the entire contents of `schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see 4 tables: `patients`, `visit_schedules`, `visit_attendance`, `invoices`

### Method 2: Using Table Editor (GUI)

If you prefer a visual approach:

1. **Create Patients Table**
   - Go to "Table Editor" → "New Table"
   - Name: `patients`
   - Add columns:
     - `id` (uuid, primary key, default: `uuid_generate_v4()`)
     - `name` (text, required)
     - `service` (text, required)
     - `last_visit` (timestamptz, optional)
     - `status` (text, optional)
     - `created_at` (timestamptz, default: `now()`)
     - `updated_at` (timestamptz, default: `now()`)

2. **Repeat for other tables** (see schema.sql for full structure)

3. **Enable RLS** (Row Level Security)
   - For each table, go to "Authentication" → "Policies"
   - Create policies as defined in schema.sql

### Method 3: Using Supabase CLI (For Advanced Users)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Database Schema Overview

### Tables

1. **patients** - Patient information
   - Stores patient name, service type, and status

2. **visit_schedules** - Recurring visit schedules
   - Stores frequency, time slots, and generated dates
   - References `patients` table

3. **visit_attendance** - Individual visit records
   - Tracks attendance status for each scheduled visit
   - References `patients` table

4. **invoices** - Invoice records
   - Generated from attendance records
   - References `patients` table

### Features

- **UUID Primary Keys**: All tables use UUID for IDs
- **Automatic Timestamps**: `created_at` and `updated_at` are auto-managed
- **Indexes**: Optimized for common queries
- **Row Level Security (RLS)**: Enabled with policies for authenticated users
- **Foreign Keys**: Proper relationships between tables
- **Data Validation**: Check constraints for enum values

## Row Level Security (RLS)

The schema includes RLS policies that allow:
- **Authenticated users**: Full CRUD access to all tables
- **Anonymous users**: No access by default (for security)

### To Allow Anonymous Access (Development Only)

If you want to test without authentication, modify the policies in `schema.sql`:

```sql
-- Change from 'authenticated' to 'anon'
CREATE POLICY "Allow anon users to read patients"
  ON patients FOR SELECT
  TO anon  -- Changed from 'authenticated'
  USING (true);
```

**⚠️ Warning**: Only do this for development. Never allow anonymous access in production without proper security measures.

## Testing the Setup

After running the schema, you can test with a simple query:

```sql
-- Insert a test patient
INSERT INTO patients (name, service) 
VALUES ('Test Patient', 'Physical Therapy');

-- Check if it was created
SELECT * FROM patients;
```

## Troubleshooting

### Error: "extension uuid-ossp does not exist"
- The extension should be created automatically by the script
- If it fails, run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

### Error: "permission denied"
- Make sure you're using the correct database user
- Check RLS policies if you're getting access denied errors

### Tables not showing up
- Refresh the Table Editor
- Check the SQL Editor for any error messages
- Verify you're in the correct project/database

## Setting Up Authentication

The app uses Supabase Auth for authentication. You need to create a user account before you can use the app.

### Option 1: Create User via Supabase Dashboard (Recommended)

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **Users** in the left sidebar
4. Click **"Add user"** → **"Create new user"**
5. Enter:
   - **Email**: Your email address
   - **Password**: A secure password (min 6 characters)
   - **Auto Confirm User**: Check this box (for development)
6. Click **"Create user"**

### Option 2: Enable Email Signup (For Production)

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Enable **Email** provider
3. Configure email templates if needed
4. Users can then sign up via the login page

### Fixing 401 Unauthorized Errors

If you're getting `401 Unauthorized` or `new row violates row-level security policy` errors:

1. **Make sure you're logged in** - The app requires authentication
2. **Check your session** - Open browser DevTools → Application → Cookies, verify `sb-*-auth-token` exists
3. **Verify user exists** - Check Supabase Dashboard → Authentication → Users
4. **Check RLS policies** - Ensure policies allow `authenticated` role (they should by default)

The app uses Row Level Security (RLS) and only allows authenticated users to access data.

## Next Steps

After setting up the database:

1. **Add Environment Variables** (see main README)
2. **Run migration script** if you get 401 errors (see above)
3. **Test the API** by running the application
4. **Configure Authentication** if needed
5. **Set up backups** in Supabase Dashboard

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

