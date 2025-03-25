# SlimmeRoutes

SlimmeRoutes is a comprehensive route optimization application designed to help businesses efficiently plan and manage customer visits. The application offers advanced features for address management, route generation, real-time traffic updates, and multi-driver optimization.

## Features

- **Address Management**: Add, edit, and organize customer addresses with notes and details
- **Enhanced Address Fields**: Support for time spent at location, appointment times, and appointment windows
- **Google Maps Integration**: Visualize addresses and routes on an interactive map
- **Multi-driver Route Optimization**: Automatically calculate the most efficient route across multiple drivers
- **CSV/Excel Import**: Import addresses from spreadsheets with custom field mapping
- **Real-time Traffic Updates**: Get up-to-date traffic information to adjust routes dynamically
- **User-friendly Interface**: Clean, responsive design with intuitive workflow
- **Sequential Workflow**: Clear, guided 3-step process (Add Addresses → Select Drivers → Optimize Routes)

## Tech Stack

- **Frontend**: Next.js with React, TypeScript, and Tailwind CSS
- **UI Components**: ShadCN UI
- **Maps & Geocoding**: Google Maps API, Places API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Handling**: Client-side CSV and Excel parsing

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Google Maps API key
- Supabase account and project

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API key
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_maps_api_key

# Google Calendar API credentials (optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### Installation

1. Clone the repository
2. Install dependencies
   ```
   npm install
   # or
   yarn install
   ```
3. Run the development server
   ```
   npm run dev
   # or
   yarn dev
   ```

## Database Schema

The application uses the following key tables in Supabase:
- `addresses`: Stores customer addresses with geocoding information
- `drivers`: Manages information about delivery drivers
- `routes`: Stores optimized routes and their details

## Recent Updates

- Added support for additional address fields (time spent, appointment time, appointment window)
- Enhanced geocoding reliability with improved error handling
- Added CSV/Excel import functionality with field detection
- Implemented a clear 3-step workflow for route optimization

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Next.js, Tailwind CSS, and ShadCN UI
- Maps powered by Google Maps Platform
- Database and authentication by Supabase
