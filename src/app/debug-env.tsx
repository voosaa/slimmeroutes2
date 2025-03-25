"use client"

import { useEffect, useState } from 'react'

export default function DebugEnv() {
  const [envVars, setEnvVars] = useState<{[key: string]: string}>({})
  
  useEffect(() => {
    // Collect all environment variables that start with NEXT_PUBLIC
    const publicEnvVars: {[key: string]: string} = {}
    
    // Add Google Calendar specific variables with validation
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'Not set'
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'Not set'
    
    publicEnvVars['NEXT_PUBLIC_GOOGLE_CLIENT_ID'] = googleClientId
    publicEnvVars['NEXT_PUBLIC_GOOGLE_CLIENT_ID_VALID'] = 
      googleClientId !== 'Not set' && googleClientId.endsWith('.apps.googleusercontent.com') 
        ? 'Valid' 
        : 'Invalid format (should end with .apps.googleusercontent.com)'
    
    publicEnvVars['NEXT_PUBLIC_GOOGLE_API_KEY'] = googleApiKey
    publicEnvVars['NEXT_PUBLIC_GOOGLE_API_KEY_VALID'] = 
      googleApiKey !== 'Not set' && googleApiKey.length > 20
        ? 'Likely valid (has sufficient length)' 
        : 'Potentially invalid (too short or not set)'
    
    // Add other public variables
    publicEnvVars['NEXT_PUBLIC_SUPABASE_URL'] = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'
    publicEnvVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'
    publicEnvVars['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'] = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Set (hidden)' : 'Not set'
    
    setEnvVars(publicEnvVars)
  }, [])
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Public Environment Variables</h2>
        <pre className="bg-white p-4 rounded border">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {
                key.includes('CLIENT_ID') ? 
                  (value !== 'Not set' ? `${value.substring(0, 10)}...` : value) : 
                  (key.includes('KEY') ? (value !== 'Not set' && !key.includes('VALID') ? 'Set (hidden)' : value) : value)
              }
            </div>
          ))}
        </pre>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Troubleshooting Steps</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Check that your <code>.env.local</code> file contains the correct Google Calendar API credentials</li>
          <li>Make sure the Google Calendar API is enabled in your Google Cloud Console</li>
          <li>Verify that your OAuth consent screen is configured correctly</li>
          <li>Add <code>http://localhost:3000</code> to authorized JavaScript origins</li>
          <li>Restart the Next.js development server after making changes to environment variables</li>
        </ol>
      </div>
    </div>
  )
}
