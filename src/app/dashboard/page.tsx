"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { AddressInput } from '@/components/dashboard/address-input'
import { AddressList } from '@/components/dashboard/address-list'
import { ScheduleView } from '@/components/dashboard/schedule-view'
import { CostCalculator } from '@/components/dashboard/cost-calculator'
import { RouteOptimizer } from '@/components/dashboard/route-optimizer'
import { SupabaseSetupGuide } from '@/components/setup/supabase-setup-guide'
import MapComponent from '@/components/map/map-component'
import { Address, supabase, createRoute } from '@/lib/supabase'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { optimizeRoute } from '@/lib/utils'
import { AppShell } from '@/components/layout/app-shell'
import { 
  PlusCircle, 
  MapPin, 
  Route, 
  BarChart3, 
  Clock, 
  DollarSign, 
  Car, 
  Fuel, 
  Wrench,
  Users,
  FileUp,
  Upload
} from 'lucide-react'
import { DriverAddressImporter } from '@/components/file-upload/driver-address-importer'

// Sample data for analytics
const weeklyData = [
  { name: 'Mon', distance: 45, time: 60, cost: 25 },
  { name: 'Tue', distance: 35, time: 45, cost: 20 },
  { name: 'Wed', distance: 60, time: 80, cost: 35 },
  { name: 'Thu', distance: 30, time: 40, cost: 18 },
  { name: 'Fri', distance: 55, time: 70, cost: 30 },
  { name: 'Sat', distance: 20, time: 30, cost: 12 },
  { name: 'Sun', distance: 10, time: 15, cost: 8 }
]

const costBreakdownData = [
  { name: 'Fuel', value: 120 },
  { name: 'Time', value: 80 },
  { name: 'Maintenance', value: 50 }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function DashboardPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [optimizedOrder, setOptimizedOrder] = useState<string[]>([])
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false)
  const [routeStats, setRouteStats] = useState({
    totalDistance: 0,
    totalTime: 0,
    fuelCost: 0,
    timeCost: 0,
    maintenanceCost: 0
  })
  const { user } = useAuth()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(1)

  // Fetch addresses on component mount
  useEffect(() => {
    if (user) {
      fetchAddresses()
    }
  }, [user])

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching addresses:', error)
        setError('Failed to fetch addresses')
      } else {
        setAddresses(data || [])
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setError('Failed to fetch addresses')
    }
  }

  // Use useEffect to handle side effects and state changes
  useEffect(() => {
    // Any initialization code can go here
    console.log("Dashboard page mounted")
    console.log("User:", user)
  }, [user])

  // Check if user is logged in
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Authentication Required</span>
                <br />
                Please sign in to access the dashboard.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Check if Supabase is available
  const isSupabaseAvailable = true // We're already checking for user above

  // If Supabase is not properly configured, show the setup guide
  if (!isSupabaseAvailable) {
    return <SupabaseSetupGuide />
  }

  const handleAddAddress = (address: Address) => {
    setAddresses(prev => [address, ...prev])
  }

  const handleDeleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id))
  }

  const handleUpdateAddress = async (id: string, updates: Partial<Address>) => {
    if (!id) return
    
    try {
      const { error } = await supabase
        .from('addresses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
      
      if (error) throw error
      
      setAddresses(prev => 
        prev.map(addr => addr.id === id ? { ...addr, ...updates } : addr)
      )
    } catch (error) {
      console.error('Error updating address:', error)
      toast({
        title: 'Error',
        description: 'Failed to update address',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteAllAddresses = async () => {
    if (!user) return
    
    try {
      // Delete all addresses from the database
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('user_id', user.id)
      
      if (error) throw error
      
      // Clear addresses from state
      setAddresses([])
      
      // Reset optimized route
      setOptimizedOrder([])
      
      // Reset route stats
      setRouteStats({
        totalDistance: 0,
        totalTime: 0,
        fuelCost: 0,
        timeCost: 0,
        maintenanceCost: 0
      })
      
      toast({
        title: 'Success',
        description: 'All addresses have been deleted',
      })
    } catch (error) {
      console.error('Error deleting all addresses:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete all addresses',
        variant: 'destructive'
      })
    }
  }

  // New handler for route optimization
  const handleOptimizeRoute = (optimizedAddresses: Address[]) => {
    // Extract the IDs in optimized order
    const optimizedIds = optimizedAddresses.map(addr => addr.id)
    setOptimizedOrder(optimizedIds)
    
    // Calculate route statistics
    const totalDistance = optimizedAddresses.length > 1 ? 
      calculateTotalDistance(optimizedAddresses) : 0
    
    const totalDuration = totalDistance > 0 ? 
      totalDistance / 50 * 60 : 0 // Estimate based on 50 km/h
    
    calculateRouteStatistics(
      optimizedAddresses,
      totalDistance,
      totalDuration
    )
  }

  const handleGenerateRoute = async () => {
    if (addresses.length < 2) {
      toast({
        title: 'Error',
        description: 'You need at least 2 addresses to generate a route',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsGeneratingRoute(true)
      
      // Use the improved route optimization algorithm
      const optimizationResult = await optimizeRoute(addresses);
      
      // Extract the IDs in optimized order
      const optimizedIds = optimizationResult.orderedAddresses.map(addr => addr.id)
      
      setOptimizedOrder(optimizedIds)
      
      // Calculate route statistics with the improved data
      calculateRouteStatistics(
        optimizationResult.orderedAddresses, 
        optimizationResult.totalDistance,
        optimizationResult.totalDuration
      )
      
      // Save the route to Supabase
      const routeName = `Route ${new Date().toLocaleDateString()}`;
      const { data, error } = await createRoute(
        routeName,
        optimizationResult.orderedAddresses,
        optimizedIds,
        optimizationResult.totalDistance,
        optimizationResult.totalDuration
      );
      
      if (error) {
        console.error('Error saving route:', error);
        toast({
          title: 'Warning',
          description: 'Route generated but could not be saved to history',
          variant: 'destructive'
        });
      } else {
        console.log('Route saved successfully:', data);
        toast({
          title: 'Route generated and saved',
          description: `Optimized route for ${addresses.length} addresses has been saved to your history`,
        });
      }
      
      toast({
        title: 'Route generated',
        description: `Optimized route for ${addresses.length} addresses`
      })
    } catch (error) {
      console.error('Error generating route:', error)
      setError('Failed to generate route')
      toast({
        title: 'Error',
        description: 'Failed to generate route',
        variant: 'destructive'
      })
    } finally {
      setIsGeneratingRoute(false)
    }
  }

  // Helper function to calculate total distance between addresses
  const calculateTotalDistance = (orderedAddresses: Address[]) => {
    let totalDistance = 0
    
    for (let i = 0; i < orderedAddresses.length - 1; i++) {
      const start = orderedAddresses[i]
      const end = orderedAddresses[i + 1]
      
      totalDistance += calculateHaversineDistance(
        start.lat, start.lng,
        end.lat, end.lng
      )
    }
    
    return totalDistance
  }

  // Updated to accept pre-calculated distance and duration
  const calculateRouteStatistics = (
    orderedAddresses: Address[], 
    totalDistance?: number, 
    totalDuration?: number
  ) => {
    // If we have pre-calculated values, use them
    let distance = totalDistance;
    let duration = totalDuration;
    
    // Otherwise calculate using Haversine (fallback)
    if (distance === undefined) {
      distance = 0;
      // Calculate distances between consecutive points
      for (let i = 0; i < orderedAddresses.length - 1; i++) {
        const start = orderedAddresses[i]
        const end = orderedAddresses[i + 1]
        
        // Simple distance calculation using Haversine formula
        const segmentDistance = calculateHaversineDistance(
          start.lat, start.lng,
          end.lat, end.lng
        )
        
        distance += segmentDistance
      }
    }
    
    // Estimate time if not provided (based on average speed of 50 km/h)
    if (duration === undefined) {
      duration = distance / 50 * 60 // minutes
    }
    
    // Calculate costs with more detailed model
    // Fuel cost: Based on fuel consumption of 8L/100km and current fuel price of €1.80/L
    const fuelConsumption = 8; // L/100km
    const fuelPrice = 1.80; // €/L
    const fuelCost = distance * fuelConsumption / 100 * fuelPrice
    
    // Time cost: Based on hourly rate of €30/hour
    const hourlyRate = 30; // €/hour
    const timeCost = duration / 60 * hourlyRate
    
    // Maintenance cost: Based on €0.05/km
    const maintenanceCost = distance * 0.05
    
    setRouteStats({
      totalDistance: distance,
      totalTime: duration,
      fuelCost,
      timeCost,
      maintenanceCost
    })
  }

  // Calculate Haversine distance between two points (in kilometers)
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    
    return distance
  }

  return (
    <AppShell>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SlimmeRoutes Dashboard</h1>
        <div className="flex space-x-2">
          {addresses.length >= 2 && (
            <Button 
              onClick={() => {
                setActiveStep(3);
                handleGenerateRoute();
              }}
              disabled={isGeneratingRoute}
              className="bg-emerald-600 hover:bg-emerald-700 flex items-center"
            >
              <Route className="mr-2 h-4 w-4" />
              {isGeneratingRoute ? 'Generating...' : 'Generate Route'}
            </Button>
          )}
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-emerald-100 p-2 mr-3">
            <MapPin className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Addresses</p>
            <p className="text-xl font-bold text-gray-900">{addresses.length}</p>
          </div>
        </div>
        
        {optimizedOrder.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow p-4 flex items-center">
              <div className="rounded-full bg-blue-100 p-2 mr-3">
                <Route className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Distance</p>
                <p className="text-xl font-bold text-gray-900">{routeStats.totalDistance.toFixed(1)} km</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 flex items-center">
              <div className="rounded-full bg-purple-100 p-2 mr-3">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Time</p>
                <p className="text-xl font-bold text-gray-900">
                  {Math.floor(routeStats.totalTime / 60)}h {Math.round(routeStats.totalTime % 60)}m
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 flex items-center">
              <div className="rounded-full bg-amber-100 p-2 mr-3">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Cost</p>
                <p className="text-xl font-bold text-gray-900">
                  €{(routeStats.fuelCost + routeStats.timeCost + routeStats.maintenanceCost).toFixed(2)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Workflow Steps */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Route Optimization Workflow</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className={`flex-1 p-6 rounded-lg border-2 ${activeStep === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-center mb-4">
              <div className={`rounded-full p-2 mr-2 ${activeStep === 1 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                <span className="flex items-center justify-center h-6 w-6 text-lg font-bold">1</span>
              </div>
              <h3 className="text-lg font-medium">Add/Import Addresses</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Add addresses manually or import from CSV/Excel files</p>
            <div className="flex flex-col space-y-2">
              <Button 
                variant={activeStep === 1 ? "default" : "outline"} 
                className="w-full"
                onClick={() => setActiveStep(1)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Addresses
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  document.getElementById('import-tab-trigger')?.click();
                  setActiveStep(1);
                }}
              >
                <FileUp className="mr-2 h-4 w-4" />
                Import from CSV/Excel
              </Button>
            </div>
          </div>
          
          <div className={`flex-1 p-6 rounded-lg border-2 ${activeStep === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-center mb-4">
              <div className={`rounded-full p-2 mr-2 ${activeStep === 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                <span className="flex items-center justify-center h-6 w-6 text-lg font-bold">2</span>
              </div>
              <h3 className="text-lg font-medium">Select Drivers</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Choose drivers for your multi-driver route optimization</p>
            <div className="flex flex-col space-y-2">
              <Link href="/dashboard/drivers">
                <Button 
                  variant={activeStep === 2 ? "default" : "outline"} 
                  className="w-full"
                  onClick={() => setActiveStep(2)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Drivers
                </Button>
              </Link>
            </div>
          </div>
          
          <div className={`flex-1 p-6 rounded-lg border-2 ${activeStep === 3 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-center mb-4">
              <div className={`rounded-full p-2 mr-2 ${activeStep === 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                <span className="flex items-center justify-center h-6 w-6 text-lg font-bold">3</span>
              </div>
              <h3 className="text-lg font-medium">Optimize Routes</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Generate optimized routes for your drivers</p>
            <div className="flex flex-col space-y-2">
              <Button 
                variant={activeStep === 3 ? "default" : "outline"} 
                className="w-full"
                onClick={() => {
                  setActiveStep(3);
                  if (addresses.length >= 2) {
                    handleGenerateRoute();
                  } else {
                    toast({
                      title: "Not enough addresses",
                      description: "You need at least 2 addresses to generate a route",
                      variant: "destructive"
                    });
                  }
                }}
                disabled={addresses.length < 2}
              >
                <Route className="mr-2 h-4 w-4" />
                Generate Optimized Routes
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area - Changes based on active step */}
      {activeStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Tabs defaultValue="add" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="add" className="flex-1">Add Address</TabsTrigger>
                <TabsTrigger id="import-tab-trigger" value="import" className="flex-1">Import</TabsTrigger>
              </TabsList>
              
              <TabsContent value="add">
                <div className="bg-white rounded-lg shadow mb-6">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Add Address</h2>
                    <p className="text-sm text-gray-500">Enter an address to add to your route</p>
                  </div>
                  <div className="p-6">
                    <AddressInput onAddAddress={handleAddAddress} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="import">
                <div className="bg-white rounded-lg shadow mb-6">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Import Addresses</h2>
                    <p className="text-sm text-gray-500">Import from CSV or Excel files</p>
                  </div>
                  <div className="p-6">
                    <DriverAddressImporter onImportComplete={(newAddresses) => {
                      // Add the newly imported addresses to the state
                      setAddresses(prev => [...newAddresses, ...prev]);
                      toast({
                        title: "Addresses Imported",
                        description: `Successfully imported ${newAddresses.length} addresses`,
                        variant: "default"
                      });
                    }} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Your Addresses</h2>
                <p className="text-sm text-gray-500">Manage your list of addresses</p>
              </div>
              <div className="p-6">
                <AddressList 
                  addresses={addresses} 
                  onDeleteAddress={handleDeleteAddress} 
                  onDeleteAllAddresses={handleDeleteAllAddresses}
                  onUpdateAddress={handleUpdateAddress} 
                />
              </div>
            </div>
            
            {addresses.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Address Map</h2>
                  <p className="text-sm text-gray-500">
                    {addresses.length} addresses on the map
                  </p>
                </div>
                <div className="p-6">
                  <MapComponent 
                    addresses={addresses} 
                    optimizedOrder={optimizedOrder} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeStep === 2 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Driver Management</h2>
            <p className="text-sm text-gray-500">Select and manage your drivers</p>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="h-16 w-16 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Manage Your Drivers</h3>
              <p className="text-sm text-gray-500 text-center max-w-md mb-6">
                Add, edit, and select drivers for your multi-driver route optimization.
              </p>
              <Link href="/dashboard/drivers">
                <Button size="lg">
                  Go to Driver Management
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {activeStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Route Options</h2>
                <p className="text-sm text-gray-500">Choose your route type</p>
              </div>
              <div className="p-6">
                <div className="flex flex-col space-y-4">
                  <Button 
                    className="w-full"
                    onClick={handleGenerateRoute}
                    disabled={addresses.length < 2 || isGeneratingRoute}
                  >
                    <Route className="mr-2 h-4 w-4" />
                    {isGeneratingRoute ? 'Generating...' : 'Single Driver Route'}
                  </Button>
                  <Link href="/dashboard/drivers?tab=multi-driver-routes">
                    <Button variant="outline" className="w-full">
                      <Users className="mr-2 h-4 w-4" />
                      Multi-Driver Routes
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {optimizedOrder.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Route Statistics</h2>
                  <p className="text-sm text-gray-500">Details about your optimized route</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Total Distance:</span>
                      <span className="font-medium">{routeStats.totalDistance.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Estimated Time:</span>
                      <span className="font-medium">{Math.floor(routeStats.totalTime / 60)}h {Math.round(routeStats.totalTime % 60)}m</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Fuel Cost:</span>
                      <span className="font-medium">€{routeStats.fuelCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Time Cost:</span>
                      <span className="font-medium">€{routeStats.timeCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Maintenance:</span>
                      <span className="font-medium">€{routeStats.maintenanceCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 font-medium">
                      <span>Total Cost:</span>
                      <span className="text-emerald-600">€{(routeStats.fuelCost + routeStats.timeCost + routeStats.maintenanceCost).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-2">
            {optimizedOrder.length > 0 ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Optimized Route</h2>
                  <p className="text-sm text-gray-500">
                    The most efficient route for {addresses.length} addresses
                  </p>
                </div>
                <div className="p-6">
                  <MapComponent 
                    addresses={addresses} 
                    optimizedOrder={optimizedOrder} 
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Generate a Route</h2>
                  <p className="text-sm text-gray-500">
                    Click the button to optimize your route
                  </p>
                </div>
                <div className="p-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    <Route className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Route Generated Yet</h3>
                    <p className="text-sm text-gray-500 text-center max-w-md mb-6">
                      {addresses.length < 2 
                        ? "Add at least 2 addresses to generate an optimized route." 
                        : "Click the Generate Route button to create an optimized route for your addresses."}
                    </p>
                    <Button 
                      onClick={handleGenerateRoute}
                      disabled={addresses.length < 2 || isGeneratingRoute}
                    >
                      <Route className="mr-2 h-4 w-4" />
                      {isGeneratingRoute ? 'Generating...' : 'Generate Route'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
