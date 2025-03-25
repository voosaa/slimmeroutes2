# Deployment Guide for SlimmeRoutes

This guide will help you deploy the SlimmeRoutes application to ensure it looks and functions the same as your local development environment.

## Prerequisites

- A GitHub account with access to the [SlimmeRoutes repository](https://github.com/voosaa/slimmeroutes)
- A hosting platform (Vercel, Netlify, GitHub Pages, etc.)
- Your Supabase project and credentials
- Google Maps API key

## Step 1: Environment Variables

The most critical part of deployment is setting up the correct environment variables. Make sure these are configured in your hosting platform:

```
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Maps API key
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key

# Google Calendar API credentials (if using calendar features)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Step 2: Google Maps API Configuration

Ensure your Google Maps API key is configured to work on your deployment domain:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Credentials"
4. Find your API key and click "Edit"
5. Under "Application restrictions", add your deployment domain (e.g., `yourdomain.com`)
6. Under "API restrictions", ensure the following APIs are enabled:
   - Maps JavaScript API
   - Geocoding API
   - Places API

## Step 3: Supabase Configuration

Make sure your Supabase project is properly configured:

1. Go to your [Supabase dashboard](https://app.supabase.io/)
2. Select your project
3. Go to "Authentication" > "URL Configuration"
4. Add your deployment URL to the "Site URL" field
5. Update any redirect URLs if you're using authentication

## Step 4: Build and Deploy

### Option 1: Deploying to Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure the environment variables in the Vercel dashboard
3. Deploy the application

### Option 2: Manual Deployment

1. Clone the repository: `git clone https://github.com/voosaa/slimmeroutes.git`
2. Install dependencies: `npm install`
3. Build the application: `npm run build`
4. The build output will be in the `out` directory
5. Upload the contents of the `out` directory to your hosting provider

## Troubleshooting

If your deployed application doesn't look or function the same as your local version, check the following:

1. **Console Errors**: Open the browser console to check for any JavaScript errors
2. **Environment Variables**: Verify all environment variables are correctly set
3. **API Keys**: Ensure your API keys are valid and have the correct domain restrictions
4. **CORS Issues**: If you see CORS errors, check your Supabase and Google API configurations
5. **Static Export Limitations**: Remember that with `output: 'export'`, server-side features won't work

## Local vs. Deployed Differences

Some differences between local and deployed environments are expected:

1. **Performance**: Deployed versions might be faster or slower depending on the hosting provider
2. **API Latency**: API calls might have different latency in production
3. **Caching**: Browsers might cache resources differently in production

If you encounter specific issues with your deployment, please open an issue on the GitHub repository.
