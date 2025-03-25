'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { loadGoogleCalendarApi, isSignedInToGoogle, signInToGoogle, signOutFromGoogle, getCalendarList } from '@/lib/google-calendar'
import { AlertCircle, Check, Calendar } from 'lucide-react'

export function GoogleCalendarTester() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [apiLoaded, setApiLoaded] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [calendars, setCalendars] = useState<any[]>([])
  const [apiDetails, setApiDetails] = useState({
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'Not configured',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? 'Configured' : 'Not configured'
  })

  // Test loading the API
  const testApiLoad = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      console.log('Testing Google Calendar API loading...')
      await loadGoogleCalendarApi()
      setApiLoaded(true)
      setSuccess('Google Calendar API loaded successfully!')
      checkSignInStatus()
    } catch (err) {
      console.error('Error loading Google Calendar API:', err)
      setApiLoaded(false)
      setError(err instanceof Error ? err.message : 'Unknown error loading Google Calendar API')
    } finally {
      setLoading(false)
    }
  }

  // Check if signed in
  const checkSignInStatus = () => {
    const signedIn = isSignedInToGoogle()
    setIsSignedIn(signedIn)
    return signedIn
  }

  // Sign in to Google
  const handleSignIn = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (!apiLoaded) {
        await loadGoogleCalendarApi()
        setApiLoaded(true)
      }
      
      await signInToGoogle()
      setIsSignedIn(true)
      setSuccess('Successfully signed in to Google!')
    } catch (err) {
      console.error('Error signing in to Google:', err)
      setError(err instanceof Error ? err.message : 'Unknown error signing in to Google')
    } finally {
      setLoading(false)
    }
  }

  // Sign out from Google
  const handleSignOut = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      await signOutFromGoogle()
      setIsSignedIn(false)
      setSuccess('Successfully signed out from Google!')
      setCalendars([])
    } catch (err) {
      console.error('Error signing out from Google:', err)
      setError(err instanceof Error ? err.message : 'Unknown error signing out from Google')
    } finally {
      setLoading(false)
    }
  }

  // List calendars
  const handleListCalendars = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (!apiLoaded) {
        await loadGoogleCalendarApi()
        setApiLoaded(true)
      }
      
      if (!isSignedIn) {
        await signInToGoogle()
        setIsSignedIn(true)
      }
      
      const calendarList = await getCalendarList()
      setCalendars(calendarList)
      setSuccess(`Successfully retrieved ${calendarList.length} calendars!`)
    } catch (err) {
      console.error('Error listing calendars:', err)
      setError(err instanceof Error ? err.message : 'Unknown error listing calendars')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar API Test
        </CardTitle>
        <CardDescription>
          Test your Google Calendar API integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col p-4 border rounded-md">
              <span className="text-sm font-medium">Client ID</span>
              <span className="text-sm text-gray-500">
                {apiDetails.clientId === 'Not configured' 
                  ? 'Not configured' 
                  : `${apiDetails.clientId.substring(0, 12)}...`}
              </span>
            </div>
            <div className="flex flex-col p-4 border rounded-md">
              <span className="text-sm font-medium">API Key</span>
              <span className="text-sm text-gray-500">{apiDetails.apiKey}</span>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${apiLoaded ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm">API Loaded</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isSignedIn ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm">Signed In</span>
            </div>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}
        
        {calendars.length > 0 && (
          <div className="border rounded-md p-4">
            <h4 className="text-sm font-medium mb-2">Your Calendars</h4>
            <ul className="space-y-1">
              {calendars.map((calendar, index) => (
                <li key={index} className="text-sm">{calendar.summary}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button onClick={testApiLoad} disabled={loading}>
          {loading ? 'Testing...' : 'Test API Load'}
        </Button>
        {!isSignedIn ? (
          <Button onClick={handleSignIn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        ) : (
          <Button onClick={handleSignOut} disabled={loading} variant="outline">
            {loading ? 'Signing out...' : 'Sign Out'}
          </Button>
        )}
        <Button onClick={handleListCalendars} disabled={loading || !isSignedIn}>
          {loading ? 'Loading...' : 'List Calendars'}
        </Button>
      </CardFooter>
    </Card>
  )
}
