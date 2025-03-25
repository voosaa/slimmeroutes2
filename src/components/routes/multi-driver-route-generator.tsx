"use client"

import { useState } from 'react'
import { useRoute } from '@/contexts/route-context'
import { useDriver } from '@/contexts/driver-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Users, Route, MapPin } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

export function MultiDriverRouteGenerator() {
  const { addresses, generateMultiDriverRoute, isGeneratingRoute } = useRoute()
  const { drivers, selectedDriverIds, selectAllDrivers, deselectAllDrivers } = useDriver()
  const [routeName, setRouteName] = useState('')
  const { toast } = useToast()
  const router = useRouter()

  const activeDrivers = drivers.filter(driver => driver.is_active)

  const handleGenerateRoute = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!routeName.trim()) {
      toast({
        title: 'Route name required',
        description: 'Please enter a name for your route',
        variant: 'destructive'
      })
      return
    }
    
    if (addresses.length < 2) {
      toast({
        title: 'Not enough addresses',
        description: 'You need at least 2 addresses to generate a route',
        variant: 'destructive'
      })
      return
    }
    
    if (selectedDriverIds.length === 0) {
      toast({
        title: 'No drivers selected',
        description: 'Please select at least one driver for the route',
        variant: 'destructive'
      })
      return
    }
    
    const route = await generateMultiDriverRoute(routeName)
    
    if (route) {
      setRouteName('')
      router.push(`/dashboard/routes/${route.id}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Multi-Driver Route Optimization
        </CardTitle>
        <CardDescription>
          Optimize routes for multiple drivers by distributing addresses efficiently
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="routeName">Route Name</Label>
              <span className="text-xs text-neutral-500">Required</span>
            </div>
            <Input
              id="routeName"
              placeholder="e.g., Monday Deliveries"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Addresses</Label>
              <span className="text-xs text-neutral-500">
                {addresses.length} address{addresses.length !== 1 ? 'es' : ''} selected
              </span>
            </div>
            {addresses.length === 0 ? (
              <div className="border rounded-md p-4 text-center text-neutral-500">
                <MapPin className="h-5 w-5 mx-auto mb-2" />
                <p>No addresses added yet</p>
                <p className="text-xs mt-1">Add addresses from the address manager</p>
              </div>
            ) : addresses.length < 2 ? (
              <div className="border rounded-md p-4 text-center text-neutral-500">
                <MapPin className="h-5 w-5 mx-auto mb-2" />
                <p>Need at least 2 addresses</p>
                <p className="text-xs mt-1">Add more addresses to generate a route</p>
              </div>
            ) : (
              <div className="border rounded-md p-4 text-center text-green-600">
                <Route className="h-5 w-5 mx-auto mb-2" />
                <p>Ready to generate route</p>
                <p className="text-xs mt-1">{addresses.length} addresses will be optimized</p>
              </div>
            )}
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Selected Drivers</Label>
              <span className="text-xs text-neutral-500">
                {selectedDriverIds.length} of {activeDrivers.length} selected
              </span>
            </div>
            
            {activeDrivers.length === 0 ? (
              <div className="border rounded-md p-4 text-center text-neutral-500">
                <Users className="h-5 w-5 mx-auto mb-2" />
                <p>No active drivers available</p>
                <p className="text-xs mt-1">Add drivers from the driver management section</p>
              </div>
            ) : selectedDriverIds.length === 0 ? (
              <div className="border rounded-md p-4 text-center text-neutral-500">
                <Users className="h-5 w-5 mx-auto mb-2" />
                <p>No drivers selected</p>
                <p className="text-xs mt-1">Select drivers to assign routes</p>
              </div>
            ) : (
              <div className="border rounded-md p-4 text-center text-green-600">
                <Users className="h-5 w-5 mx-auto mb-2" />
                <p>{selectedDriverIds.length} driver{selectedDriverIds.length !== 1 ? 's' : ''} selected</p>
                <p className="text-xs mt-1">Routes will be optimized for these drivers</p>
              </div>
            )}
            
            <div className="flex gap-2 mt-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={selectAllDrivers}
                disabled={activeDrivers.length === 0}
              >
                Select All
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={deselectAllDrivers}
                disabled={selectedDriverIds.length === 0}
              >
                Deselect All
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleGenerateRoute}
          disabled={
            isGeneratingRoute || 
            !routeName.trim() || 
            addresses.length < 2 || 
            selectedDriverIds.length === 0
          }
        >
          {isGeneratingRoute ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Routes...
            </>
          ) : (
            'Generate Multi-Driver Routes'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
