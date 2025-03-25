"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { Save, DollarSign, Clock, Calendar, FileDown, Check, AlertCircle } from 'lucide-react'
import { loadGoogleCalendarApi, isSignedInToGoogle, signInToGoogle, signOutFromGoogle } from '@/lib/google-calendar'

export function Settings() {
  const [hourlyCost, setHourlyCost] = useState<string>('25')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false)
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false)
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Load user settings from Supabase
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
          throw error
        }
        
        if (data) {
          setHourlyCost(data.hourly_cost?.toString() || '25')
        }
      } catch (error) {
        console.error('Error loading user settings:', error)
        toast({
          title: 'Error',
          description: 'Failed to load your settings. Please try again.',
          variant: 'destructive'
        })
      }
    }
    
    loadUserSettings()
  }, [user, toast])

  // Save user settings to Supabase
  const saveSettings = async () => {
    if (!user) return
    
    setIsLoading(true)
    
    try {
      // Check if settings already exist
      const { data: existingSettings, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }
      
      let result
      
      if (existingSettings) {
        // Update existing settings
        result = await supabase
          .from('user_settings')
          .update({
            hourly_cost: parseFloat(hourlyCost) || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id)
      } else {
        // Create new settings
        result = await supabase
          .from('user_settings')
          .insert([{
            user_id: user.id,
            hourly_cost: parseFloat(hourlyCost) || 0
          }])
      }
      
      if (result.error) throw result.error
      
      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully.',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save your settings. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load Google Calendar API
  useEffect(() => {
    const initGoogleApi = async () => {
      try {
        await loadGoogleCalendarApi();
        setIsGoogleApiLoaded(true);
        setIsGoogleSignedIn(isSignedInToGoogle());
      } catch (error) {
        console.error('Error loading Google API:', error);
      }
    };

    // Only initialize if we're in the browser
    if (typeof window !== 'undefined') {
      initGoogleApi();
    }
  }, []);

  // Handle Google Calendar connection
  const handleGoogleCalendarConnect = async () => {
    if (!isGoogleApiLoaded) {
      toast({
        title: 'Error',
        description: 'Google API failed to load. Please try again later.',
        variant: 'destructive'
      });
      return;
    }

    setIsConnectingGoogle(true);

    try {
      if (!isGoogleSignedIn) {
        // Sign in to Google
        await signInToGoogle();
        setIsGoogleSignedIn(true);
        
        // Save the Google Calendar integration setting to Supabase
        if (user) {
          await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              google_calendar_enabled: true,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });
        }
        
        toast({
          title: 'Success',
          description: 'Connected to Google Calendar successfully!',
          variant: 'default'
        });
      } else {
        // Sign out from Google
        await signOutFromGoogle();
        setIsGoogleSignedIn(false);
        
        // Update the Google Calendar integration setting in Supabase
        if (user) {
          await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              google_calendar_enabled: false,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });
        }
        
        toast({
          title: 'Disconnected',
          description: 'Disconnected from Google Calendar',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to Google Calendar. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <Tabs defaultValue="costs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="costs">Cost Settings</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="export">Export Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="costs" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Calculation</CardTitle>
              <CardDescription>
                Configure how costs are calculated for your routes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hourly-cost">Hourly Employee Cost (€)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="hourly-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={hourlyCost}
                    onChange={(e) => setHourlyCost(e.target.value)}
                    className="pl-10"
                    placeholder="25.00"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  This will be used to calculate the labor cost of each route based on estimated travel time.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Calendar Integration</CardTitle>
              <CardDescription>
                Sync your routes with Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Google Calendar</h4>
                    <p className="text-sm text-gray-500">Sync your routes to your Google Calendar</p>
                  </div>
                </div>
                <Button 
                  variant={isGoogleSignedIn ? "destructive" : "outline"} 
                  onClick={handleGoogleCalendarConnect}
                  disabled={isConnectingGoogle || !isGoogleApiLoaded}
                >
                  {isConnectingGoogle ? (
                    <>Connecting...</>
                  ) : isGoogleSignedIn ? (
                    <>Disconnect</>
                  ) : (
                    <>Connect</>
                  )}
                </Button>
              </div>
              {isGoogleSignedIn ? (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Connected to Google Calendar</span>
                </div>
              ) : !isGoogleApiLoaded ? (
                <div className="flex items-center space-x-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Google Calendar API is loading...</span>
                </div>
              ) : null}
              <p className="text-sm text-gray-500">
                Connecting to Google Calendar allows you to automatically create events for each stop on your route.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Configure how your routes can be exported
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileDown className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">GPX Export</h4>
                    <p className="text-sm text-gray-500">Export routes in GPS Exchange Format</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-green-600 mr-2">Enabled</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                GPX files can be imported into most GPS devices and navigation apps.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
