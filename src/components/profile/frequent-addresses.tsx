"use client"

import { useState, useEffect } from 'react'
import { Address, getFrequentAddresses, deleteFrequentAddress, supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Star, Trash2, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export function FrequentAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadFrequentAddresses()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const loadFrequentAddresses = async () => {
    if (!supabase || !user) {
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      const { data, error } = await getFrequentAddresses(10)
      if (error) throw error
      
      if (data) {
        setAddresses(data)
      }
    } catch (error) {
      console.error('Error loading frequent addresses:', error)
      toast({
        title: 'Error',
        description: 'Failed to load frequent addresses',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (addressId: string) => {
    if (!supabase || !user) return
    
    try {
      const { error } = await deleteFrequentAddress(addressId)
      if (error) throw error
      
      // Update the list
      setAddresses(addresses.filter(addr => addr.id !== addressId))
      
      toast({
        title: 'Success',
        description: 'Address removed from frequent addresses'
      })
    } catch (error) {
      console.error('Error deleting frequent address:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete address',
        variant: 'destructive'
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Frequently Used Addresses
        </CardTitle>
        <CardDescription>
          Addresses you use often will appear here for quick access
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!supabase ? (
          <div className="text-center py-6 text-neutral-500">
            <p>Supabase connection not available</p>
            <p className="text-sm mt-1">
              Please check your environment variables
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-pulse text-neutral-400">Loading addresses...</div>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-6 text-neutral-500">
            <MapPin className="h-12 w-12 mx-auto mb-2 text-neutral-300" />
            <p>No frequent addresses yet</p>
            <p className="text-sm mt-1">
              Addresses you use often will automatically appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div 
                key={address.id} 
                className="flex items-start justify-between p-3 border rounded-md hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium">{address.address}</div>
                  {address.notes && (
                    <div className="text-sm text-neutral-500 mt-1">{address.notes}</div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-neutral-500">
                      Used {address.usage_count} {address.usage_count === 1 ? 'time' : 'times'}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(address.id)}
                  className="text-neutral-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
