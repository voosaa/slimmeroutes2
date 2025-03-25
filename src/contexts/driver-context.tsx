"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Driver, getDrivers, addDriver, updateDriver, deleteDriver } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from './auth-context'

type DriverContextType = {
  drivers: Driver[]
  isLoading: boolean
  addNewDriver: (name: string, email?: string, phone?: string) => Promise<void>
  updateDriverInfo: (id: string, name: string, email?: string, phone?: string, isActive?: boolean) => Promise<void>
  removeDriver: (id: string) => Promise<void>
  selectedDriverIds: string[]
  toggleDriverSelection: (id: string) => void
  selectAllDrivers: () => void
  deselectAllDrivers: () => void
  getSelectedDrivers: () => Driver[]
}

const DriverContext = createContext<DriverContextType | undefined>(undefined)

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    // Load drivers when the component mounts or user changes
    async function loadDrivers() {
      if (!user) {
        setDrivers([])
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        const { data, error } = await getDrivers()
        
        if (error) {
          // Check if the error is due to missing table
          if (error.message.includes("relation") && error.message.includes("does not exist")) {
            console.warn("Drivers table doesn't exist yet. Using empty array.")
            setDrivers([])
          } else {
            throw new Error(error.message)
          }
        } else {
          setDrivers(data || [])
        }
      } catch (error) {
        console.error('Error loading drivers:', error)
        toast({
          title: 'Error',
          description: 'Failed to load drivers. Please try again later.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDrivers()
  }, [user, toast])

  const addNewDriver = async (name: string, email?: string, phone?: string) => {
    try {
      const { data, error } = await addDriver(name, email, phone)
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Update the local state
      if (data && data.length > 0) {
        setDrivers(prev => [...prev, data[0]])
        toast({
          title: 'Driver added',
          description: 'The driver has been added successfully.'
        })
      }
    } catch (error) {
      console.error('Error adding driver:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add driver',
        variant: 'destructive'
      })
    }
  }

  const updateDriverInfo = async (id: string, name: string, email?: string, phone?: string, isActive?: boolean) => {
    try {
      const { data, error } = await updateDriver(id, name, email, phone, isActive)
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Update the local state
      if (data && data.length > 0) {
        setDrivers(prev => prev.map(driver => driver.id === id ? data[0] : driver))
        toast({
          title: 'Driver updated',
          description: 'The driver information has been updated successfully.'
        })
      }
    } catch (error) {
      console.error('Error updating driver:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update driver',
        variant: 'destructive'
      })
    }
  }

  const removeDriver = async (id: string) => {
    try {
      const { error } = await deleteDriver(id)
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Update the local state
      setDrivers(prev => prev.filter(driver => driver.id !== id))
      
      // Remove from selected drivers if present
      setSelectedDriverIds(prev => prev.filter(driverId => driverId !== id))
      
      toast({
        title: 'Driver removed',
        description: 'The driver has been removed successfully.'
      })
    } catch (error) {
      console.error('Error removing driver:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove driver',
        variant: 'destructive'
      })
    }
  }

  const toggleDriverSelection = (id: string) => {
    setSelectedDriverIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(driverId => driverId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const selectAllDrivers = () => {
    const activeDriverIds = drivers
      .filter(driver => driver.is_active)
      .map(driver => driver.id)
    setSelectedDriverIds(activeDriverIds)
  }

  const deselectAllDrivers = () => {
    setSelectedDriverIds([])
  }

  const getSelectedDrivers = () => {
    return drivers.filter(driver => selectedDriverIds.includes(driver.id))
  }

  const value = {
    drivers,
    isLoading,
    addNewDriver,
    updateDriverInfo,
    removeDriver,
    selectedDriverIds,
    toggleDriverSelection,
    selectAllDrivers,
    deselectAllDrivers,
    getSelectedDrivers
  }

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>
}

export function useDriver() {
  const context = useContext(DriverContext)
  
  if (context === undefined) {
    throw new Error('useDriver must be used within a DriverProvider')
  }
  
  return context
}
