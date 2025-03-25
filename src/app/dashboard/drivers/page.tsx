"use client"

import { useState, useEffect } from 'react'
import { DriverManagement } from '@/components/drivers/driver-management'
import { MultiDriverRouteGenerator } from '@/components/routes/multi-driver-route-generator'
import { DriverAddressImporter } from '@/components/file-upload/driver-address-importer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Route, FileUp } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'

export default function DriversPage() {
  const [activeTab, setActiveTab] = useState('drivers')
  
  // Check URL for tab parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['drivers', 'multi-driver-routes', 'import'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  return (
    <AppShell>
      <div className="container px-4 py-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Driver Management</h1>
        </div>
        <div className="text-muted-foreground">
          Manage your drivers and create optimized routes for multiple drivers
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="drivers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Drivers</span>
            </TabsTrigger>
            <TabsTrigger value="multi-driver-routes" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              <span>Multi-Driver Routes</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <FileUp className="h-4 w-4" />
              <span>Import Addresses</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="drivers" className="mt-6">
            <DriverManagement />
          </TabsContent>
          
          <TabsContent value="multi-driver-routes" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                  <CardDescription>
                    Create optimized routes for multiple drivers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">1. Add Drivers</h3>
                    <p className="text-sm text-neutral-600">
                      First, add your drivers in the Drivers tab. Make sure they are marked as active.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">2. Select Drivers</h3>
                    <p className="text-sm text-neutral-600">
                      Select the drivers you want to include in your multi-driver route optimization.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">3. Add Addresses</h3>
                    <p className="text-sm text-neutral-600">
                      Add all the addresses you need to visit using the Address Manager in the dashboard or import them from a CSV/Excel file.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">4. Generate Routes</h3>
                    <p className="text-sm text-neutral-600">
                      Generate optimized routes that distribute addresses efficiently among your selected drivers.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">How Optimization Works</h3>
                    <p className="text-sm text-neutral-600">
                      Our algorithm clusters addresses by proximity and assigns them to drivers, then optimizes each driver's route individually.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <MultiDriverRouteGenerator />
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Import Instructions</CardTitle>
                  <CardDescription>
                    How to import addresses for multi-driver routes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">1. Prepare Your File</h3>
                    <p className="text-sm text-neutral-600">
                      Create a CSV or Excel file with at least one column for addresses. You can also include a notes column.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">2. Column Headers</h3>
                    <p className="text-sm text-neutral-600">
                      The system will automatically detect columns with headers like "address", "location", "street" for addresses and "notes", "description", "comments" for additional information.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">3. Upload Your File</h3>
                    <p className="text-sm text-neutral-600">
                      Use the import tool to upload your file. The system will preview the detected addresses before importing.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">4. Review and Import</h3>
                    <p className="text-sm text-neutral-600">
                      Review the detected addresses and click Import to add them to your address list. They'll be available for route planning immediately.
                    </p>
                  </div>
                  
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <h3 className="font-medium text-amber-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      File Format Tips
                    </h3>
                    <p className="text-xs text-amber-800 mt-1">
                      For best results, use simple column headers like "Address" and "Notes". Make sure each address is on a separate row and is as complete as possible for accurate geocoding.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <DriverAddressImporter />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
