# Supabase Setup for SlimmeRoutes

This directory contains the necessary SQL migrations to set up the Supabase database for the SlimmeRoutes application.

## Required Tables

### 1. addresses
Stores user-added addresses for route planning.

### 2. routes
Stores saved routes with optimized order and statistics.

### 3. frequent_addresses
Stores frequently used addresses with usage count for quick retrieval.

## Setting Up Supabase

1. Create a new Supabase project at [https://app.supabase.com](https://app.supabase.com)
2. Get your project URL and anon key from the API settings
3. Add them to your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Running Migrations

You can run the migrations manually in the Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open each file in the `migrations` directory
4. Run the SQL commands in order

## Frequent Addresses Feature

The `20250319_frequent_addresses.sql` migration adds:

1. A `frequent_addresses` table to store addresses with usage counts
2. An `increment_address_usage` function to update the usage count
3. Row-level security policies to ensure users can only access their own addresses

## Row-Level Security

All tables have row-level security enabled to ensure users can only:
- View their own data
- Insert their own data
- Update their own data
- Delete their own data

## Authentication

SlimmeRoutes uses Supabase Authentication for user management. Make sure to:
1. Configure the authentication providers you want to support
2. Set up the redirect URLs for your application
3. Configure email templates if using email authentication
