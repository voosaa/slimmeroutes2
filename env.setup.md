# Environment Variables Setup for SlimmeRoutes

This document explains how to set up environment variables for the SlimmeRoutes application.

## Required Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Maps API key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Google Calendar API credentials
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key
```

## Using the Setup Script

For convenience, you can use the included PowerShell script to set up your environment variables:

```powershell
.\setup-env.ps1
```

This script will create the `.env.local` file with all the required variables.

## Important Notes

- The `.env.local` file is excluded from git in the `.gitignore` file to prevent exposing sensitive keys
- After changing environment variables, you need to restart the development server
- You can restart the server with `npm run dev`

## Troubleshooting

If you encounter issues with environment variables not being loaded:

1. Make sure the `.env.local` file is in the root directory of your project
2. Check that there are no spaces before or after the equal sign
3. Restart the development server after making changes
4. Check the console logs for any error messages

## API Keys

- **Supabase**: Used for authentication and database storage
- **Google Maps API**: Used for address autocomplete and map functionality
