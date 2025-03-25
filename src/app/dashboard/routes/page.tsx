"use client"

import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AddressImporter } from '@/components/file-upload/address-importer'
import { AddressList } from '@/components/dashboard/address-list'
import { RouteOptimizer } from '@/components/dashboard/route-optimizer'
import { useAuth } from '@/contexts/auth-context'
import { Address, getAddresses } from '@/lib/supabase'
import { PlusCircle, FileUp, Route, MapPin, Users, Info, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { AddressInput } from '@/components/dashboard/address-input'

export default function RoutesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get tab from URL or use default
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl && ['addresses', 'import', 'routes'].includes(tabFromUrl) ? tabFromUrl : 'addresses')

  useEffect(() => {
    loadAddresses()
  }, [user])

  const loadAddresses = async () => {
    if (!user) return
    
    setIsLoading(true)
    setLoadError(null)
    try {
      const { data, error } = await getAddresses()
      
      if (error) {
        throw error
      }
      
      setAddresses(data || [])
    } catch (error) {
      console.error('Error loading addresses:', error)
      setLoadError('Failed to load addresses. Please try again later.')
      toast({
        title: 'Error',
        description: 'Failed to load addresses. Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportComplete = (importedAddresses: any[]) => {
    // Reload addresses after import
    loadAddresses()
    
    toast({
      title: 'Import Complete',
      description: `Successfully imported ${importedAddresses.length} addresses.`,
    })
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Routes</h1>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard">
              <Button variant="outline" className="flex items-center whitespace-nowrap">
                <Route className="mr-2 h-4 w-4" />
                Route Generator
              </Button>
            </Link>
            <Link href="/dashboard/drivers">
              <Button variant="outline" className="flex items-center whitespace-nowrap">
                <Users className="mr-2 h-4 w-4" />
                Multi-Driver Routes
              </Button>
            </Link>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-700">Quick Tip</AlertTitle>
          <AlertDescription className="text-blue-600">
            Add addresses or import them from a CSV file, then generate optimized routes for your drivers.
            Make sure to set appointment times and windows if needed.
          </AlertDescription>
        </Alert>
        
        {/* Route Optimization Workflow */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <h2 className="text-xl font-semibold p-4 border-b border-gray-200">Route Optimization Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {/* Step 1: Add/Import Addresses */}
            <div className={`rounded-lg border ${activeTab === 'addresses' || activeTab === 'import' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'} p-4 flex flex-col`}>
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 font-semibold">1</div>
                <h3 className="font-semibold">Add/Import Addresses</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Add addresses manually or import from CSV/Excel files</p>
              <div className="mt-auto space-y-2">
                <Button 
                  variant="default" 
                  className="w-full" 
                  onClick={() => {
                    console.log("Switching to addresses tab");
                    setActiveTab('addresses');
                    // Update URL with new tab parameter
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('tab', 'addresses');
                    router.replace(`/dashboard/routes?${params.toString()}`, { scroll: false });
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Addresses
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    console.log("Switching to import tab");
                    setActiveTab('import');
                    // Update URL with new tab parameter
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('tab', 'import');
                    router.replace(`/dashboard/routes?${params.toString()}`, { scroll: false });
                  }}
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Import from CSV/Excel
                </Button>
              </div>
            </div>
            
            {/* Step 2: Select Drivers */}
            <div className="rounded-lg border border-gray-200 p-4 flex flex-col">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center mr-3 font-semibold">2</div>
                <h3 className="font-semibold">Select Drivers</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Choose drivers for your multi-driver route optimization</p>
              <div className="mt-auto">
                <Link href="/dashboard/drivers">
                  <Button variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Drivers
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Step 3: Optimize Routes */}
            <div className="rounded-lg border border-gray-200 p-4 flex flex-col">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center mr-3 font-semibold">3</div>
                <h3 className="font-semibold">Optimize Routes</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Generate optimized routes for your drivers</p>
              <div className="mt-auto">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    <Route className="mr-2 h-4 w-4" />
                    Generate Optimized Routes
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          // Update URL with new tab parameter
          const params = new URLSearchParams(searchParams.toString());
          params.set('tab', value);
          router.replace(`/dashboard/routes?${params.toString()}`, { scroll: false });
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="addresses" className="flex items-center justify-center">
              <MapPin className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">My Addresses</span>
              <span className="sm:hidden">Addresses</span>
              {addresses.length > 0 && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{addresses.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center justify-center">
              <FileUp className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Import Addresses</span>
              <span className="sm:hidden">Import</span>
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center justify-center">
              <Route className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Saved Routes</span>
              <span className="sm:hidden">Routes</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="addresses" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Addresses</CardTitle>
                <CardDescription>
                  Manage your saved addresses that can be used for route planning.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : loadError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{loadError}</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h3 className="text-lg font-medium text-blue-800 mb-2">Add New Address</h3>
                      <AddressInput 
                        onAddAddress={(newAddress) => {
                          setAddresses(prev => [newAddress, ...prev]);
                          toast({
                            title: 'Address Added',
                            description: 'The address has been successfully added.',
                          });
                        }} 
                      />
                    </div>
                    <h3 className="text-lg font-medium mb-4">Your Saved Addresses</h3>
                    <AddressList 
                      addresses={addresses} 
                      onDeleteAddress={(id) => {
                        // Delete address and reload
                        const deleteAddress = async (id: string) => {
                          try {
                            const { error } = await supabase
                              .from('addresses')
                              .delete()
                              .eq('id', id);
                            
                            if (error) throw error;
                            
                            // Update local state immediately for better UX
                            setAddresses(prev => prev.filter(addr => addr.id !== id));
                            
                            toast({
                              title: 'Address Deleted',
                              description: 'The address has been successfully removed.',
                            });
                          } catch (error) {
                            console.error('Error deleting address:', error);
                            toast({
                              title: 'Error',
                              description: 'Failed to delete address. Please try again.',
                              variant: 'destructive',
                            });
                            // Reload to ensure consistency
                            loadAddresses();
                          }
                        };
                        
                        deleteAddress(id);
                      }}
                      onUpdateAddress={(id, updates) => {
                        // Update address and reload
                        const updateAddress = async (id: string, updates: Partial<Address>) => {
                          try {
                            const { error } = await supabase
                              .from('addresses')
                              .update(updates)
                              .eq('id', id);
                            
                            if (error) throw error;
                            
                            // Update local state immediately for better UX
                            setAddresses(prev => prev.map(addr => 
                              addr.id === id ? { ...addr, ...updates } : addr
                            ));
                            
                            toast({
                              title: 'Address Updated',
                              description: 'The address details have been updated successfully.',
                            });
                          } catch (error) {
                            console.error('Error updating address:', error);
                            toast({
                              title: 'Error',
                              description: 'Failed to update address. Please try again.',
                              variant: 'destructive',
                            });
                            // Reload to ensure consistency
                            loadAddresses();
                          }
                        };
                        
                        updateAddress(id, updates);
                      }}
                      onDeleteAllAddresses={() => {
                        // Delete all addresses and reload
                        const deleteAllAddresses = async () => {
                          try {
                            if (!user) return;
                            
                            const { error } = await supabase
                              .from('addresses')
                              .delete()
                              .eq('user_id', user.id);
                            
                            if (error) throw error;
                            
                            // Clear local state immediately
                            setAddresses([]);
                            
                            toast({
                              title: 'All Addresses Deleted',
                              description: 'All addresses have been successfully removed.',
                            });
                          } catch (error) {
                            console.error('Error deleting all addresses:', error);
                            toast({
                              title: 'Error',
                              description: 'Failed to delete all addresses. Please try again.',
                              variant: 'destructive',
                            });
                            // Reload to ensure consistency
                            loadAddresses();
                          }
                        };
                        
                        deleteAllAddresses();
                      }}
                    />
                  </>
                )}
                
                {!isLoading && !loadError && addresses.length > 0 && (
                  <div className="mt-6">
                    <Link href="/dashboard">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        <Route className="mr-2 h-4 w-4" />
                        Generate Optimized Route
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="import" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Addresses</CardTitle>
                <CardDescription>
                  Import addresses from a CSV or Excel file to quickly add multiple locations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddressImporter onImportComplete={handleImportComplete} />
                
                <div className="mt-6 p-4 bg-muted rounded-md">
                  <h3 className="font-medium mb-2">File Format Guidelines</h3>
                  <p className="text-sm mb-2">
                    Your CSV or Excel file should contain at least one column with addresses. The importer will try to detect columns with the following headers:
                  </p>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    <li><strong>Address:</strong> address, Address, ADDRESS, location, Location, street, etc.</li>
                    <li><strong>Notes:</strong> notes, Notes, NOTES, description, Description, etc.</li>
                    <li><strong>Time Spent:</strong> time_spent, timeSpent, TimeSpent, duration, etc.</li>
                    <li><strong>Driver Arrival Time:</strong> appointment_time, arrivalTime, arrival_time, etc.</li>
                    <li><strong>Appointment Window:</strong> appointment_window, window, timespan, etc.</li>
                  </ul>
                  <p className="text-sm mt-2">
                    If no matching headers are found, the first column will be used as the address.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="routes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Saved Routes</CardTitle>
                <CardDescription>
                  View and manage your saved routes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    This feature will be available soon. For now, you can create and optimize routes from the dashboard.
                  </p>
                  <Link href="/dashboard">
                    <Button>
                      <Route className="mr-2 h-4 w-4" />
                      Go to Route Generator
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
