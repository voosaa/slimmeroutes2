"use client"

import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create the Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://frvgobihuyhvjowjxduw.supabase.co',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: { 'x-application-name': 'slimmeroutes' },
    },
  }
)

// Log initialization status
console.log('Supabase client initialized with URL:', supabaseUrl ? 'Valid URL' : 'Fallback URL')

// Debug environment variables
console.log('Environment variables:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Not set')

// Check if the URL is valid
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) {
    console.error('Supabase URL is missing')
    return false
  }
  
  try {
    new URL(url)
    return true
  } catch (e) {
    console.error('Invalid Supabase URL format:', url)
    return false
  }
}

// Check if the key looks valid (basic check)
const isValidKey = (key: string | undefined): boolean => {
  if (!key) {
    console.error('Supabase Anon Key is missing')
    return false
  }
  
  // Basic check: should be a JWT-like string
  if (key.split('.').length !== 3) {
    console.error('Supabase Anon Key does not appear to be in JWT format')
    return false
  }
  
  return true
}

// Create client only if both URL and key are valid
const isValid = isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey)

console.log('Supabase client initialization:', isValid ? 'SUCCESS' : 'FAILED')
console.log('URL valid:', isValidUrl(supabaseUrl))
console.log('Key valid:', isValidKey(supabaseAnonKey))

// Mock implementation for when Supabase client is not available
const mockSupabaseResponse = {
  data: null,
  error: { message: 'Supabase client not initialized. Please check your environment variables.' }
}

export type Address = {
  id: string
  user_id: string
  address: string
  lat: number
  lng: number
  notes?: string | null
  time_spent?: number | null
  appointment_time?: string | null
  appointment_window?: number | null
  created_at: string
  usage_count?: number
}

export type Route = {
  id: string
  user_id: string
  name: string
  addresses: Address[]
  optimized_order: string[]
  total_distance: number
  total_duration: number
  created_at: string
  is_paid: boolean
}

export type Profile = {
  id: string
  email: string
  first_name?: string
  last_name?: string
  company?: string
  created_at: string
}

export type UserSettings = {
  id: string
  user_id: string
  hourly_cost: number
  created_at: string
  updated_at?: string
}

export type Driver = {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  created_at: string
  updated_at?: string
  is_active: boolean
}

export type DriverRoute = {
  id: string
  route_id: string
  driver_id: string
  addresses: Address[]
  optimized_order: string[]
  total_distance: number
  total_duration: number
  created_at: string
}

// Auth functions
export async function signUp(email: string, password: string, firstName: string, lastName: string, company?: string) {
  if (!supabase) return mockSupabaseResponse
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        company
      }
    }
  })
  
  return { data, error }
}

export async function signIn(email: string, password: string) {
  if (!supabase) return mockSupabaseResponse
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  return { data, error }
}

export async function signOut() {
  if (!supabase) return mockSupabaseResponse
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Address functions
export async function addAddress(address: string, lat: number, lng: number, notes?: string, time_spent?: number, appointment_time?: string, appointment_window?: number) {
  if (!supabase) return mockSupabaseResponse
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) {
    return { error: { message: 'Not authenticated' } }
  }
  
  const { data, error } = await supabase
    .from('addresses')
    .insert([
      {
        user_id: user.user.id,
        address,
        lat,
        lng,
        notes,
        time_spent,
        appointment_time,
        appointment_window
      }
    ])
    .select()
  
  return { data, error }
}

export async function getAddresses() {
  if (!supabase) return mockSupabaseResponse
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) {
    return { data: [], error: { message: 'Not authenticated' } }
  }
  
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function deleteAddress(id: string) {
  if (!supabase) return mockSupabaseResponse
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id)
  
  return { error }
}

// Function to add address that completely bypasses schema cache issues
export async function addAddressDirectly(
  address: string,
  lat: number,
  lng: number,
  notes?: string | null,
  timeSpent?: number | null,
  appointmentTime?: string | null,
  appointmentWindow?: number | null
): Promise<{ data: any; error: Error | null }> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { data: null, error: new Error("User not authenticated") };
    }

    // Use a raw SQL query with positional parameters to completely bypass schema cache
    const { data, error } = await supabase.rpc(
      'execute_sql', 
      { 
        sql_query: `
          INSERT INTO addresses (
            user_id, address, lat, lng, notes, time_spent, appointment_time, appointment_window
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          ) RETURNING *
        `,
        params: [
          userData.user.id,
          address,
          lat,
          lng,
          notes || null,
          timeSpent || null,
          appointmentTime || null,
          appointmentWindow || null
        ]
      }
    );

    if (error) {
      return { data: null, error: new Error(`Failed to save address: ${error.message}`) };
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error };
  }
}

// Route functions
export async function createRoute(name: string, addresses: Address[], optimizedOrder: string[], totalDistance: number, totalDuration: number) {
  if (!supabase) return mockSupabaseResponse
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) {
    return { error: { message: 'Not authenticated' } }
  }
  
  const { data, error } = await supabase
    .from('routes')
    .insert([
      {
        user_id: user.user.id,
        name,
        addresses,
        optimized_order: optimizedOrder,
        total_distance: totalDistance,
        total_duration: totalDuration,
        is_paid: false
      }
    ])
    .select()
  
  return { data, error }
}

export async function getRoutes() {
  if (!supabase) return mockSupabaseResponse
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) {
    return { data: [], error: { message: 'Not authenticated' } }
  }
  
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function getRoute(id: string) {
  if (!supabase) return mockSupabaseResponse
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('id', id)
    .single()
  
  return { data, error }
}

export async function updateRoutePaidStatus(id: string, isPaid: boolean) {
  if (!supabase) return mockSupabaseResponse
  const { data, error } = await supabase
    .from('routes')
    .update({ is_paid: isPaid })
    .eq('id', id)
    .select()
  
  return { data, error }
}

// Frequent addresses functions
export const getFrequentAddresses = async (limit = 5) => {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') }
  
  try {
    const { data, error } = await supabase
      .from('frequent_addresses')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    console.error('Error getting frequent addresses:', error)
    return { data: null, error }
  }
}

export const addFrequentAddress = async (address: Address) => {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') }
  
  try {
    // Check if address already exists
    const { data: existingAddress, error: checkError } = await supabase
      .from('frequent_addresses')
      .select('id')
      .eq('user_id', address.user_id)
      .eq('address', address.address)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw checkError
    }
    
    if (existingAddress) {
      // Address already exists, increment usage count
      await supabase.rpc('increment_address_usage', {
        address_id: existingAddress.id
      })
      
      return { data: existingAddress, error: null }
    } else {
      // Add new frequent address
      const { data, error } = await supabase
        .from('frequent_addresses')
        .insert({
          ...address,
          usage_count: 1
        })
        .select()
        .single()
      
      if (error) throw error
      
      return { data, error: null }
    }
  } catch (error) {
    console.error('Error adding frequent address:', error)
    return { data: null, error }
  }
}

export const incrementAddressUsage = async (addressId: string) => {
  if (!supabase) return { error: new Error('Supabase client not initialized') }
  
  try {
    const { error } = await supabase.rpc('increment_address_usage', {
      address_id: addressId
    })
    
    if (error) throw error
    
    return { error: null }
  } catch (error) {
    console.error('Error incrementing address usage:', error)
    return { error }
  }
}

export const deleteFrequentAddress = async (addressId: string) => {
  if (!supabase) return mockSupabaseResponse
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) {
    return { error: { message: 'Not authenticated' } }
  }
  
  const { error } = await supabase
    .from('frequent_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', user.user.id)
  
  return { error }
}

// Driver functions
export async function getDrivers() {
  if (!supabase) return mockSupabaseResponse
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) {
    return { data: [], error: { message: 'Not authenticated' } }
  }
  
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('user_id', user.user.id)
    .order('name', { ascending: true })
  
  return { data, error }
}

export async function addDriver(name: string, email?: string, phone?: string) {
  if (!supabase) return mockSupabaseResponse
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) {
    return { error: { message: 'Not authenticated' } }
  }
  
  const { data, error } = await supabase
    .from('drivers')
    .insert([
      {
        user_id: user.user.id,
        name,
        email,
        phone,
        is_active: true
      }
    ])
    .select()
  
  return { data, error }
}

export async function updateDriver(id: string, name: string, email?: string, phone?: string, is_active?: boolean) {
  if (!supabase) return mockSupabaseResponse
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) {
    return { error: { message: 'Not authenticated' } }
  }
  
  const updateData: any = {
    name,
    email,
    phone,
    updated_at: new Date().toISOString()
  }
  
  if (is_active !== undefined) {
    updateData.is_active = is_active
  }
  
  const { data, error } = await supabase
    .from('drivers')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.user.id)
    .select()
  
  return { data, error }
}

export async function deleteDriver(id: string) {
  if (!supabase) return mockSupabaseResponse
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) {
    return { error: { message: 'Not authenticated' } }
  }
  
  const { error } = await supabase
    .from('drivers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.user.id)
  
  return { error }
}

// Multi-driver route functions
export async function createMultiDriverRoute(
  name: string, 
  driverIds: string[], 
  addresses: Address[], 
  driverRoutes: DriverRoute[]
) {
  if (!supabase) return mockSupabaseResponse
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) {
    return { error: { message: 'Not authenticated' } }
  }
  
  // Calculate total distance and duration across all drivers
  const totalDistance = driverRoutes.reduce((sum, route) => sum + route.total_distance, 0);
  const totalDuration = driverRoutes.reduce((sum, route) => sum + route.total_duration, 0);
  
  // Start a transaction
  const { data, error } = await supabase
    .from('routes')
    .insert([
      {
        user_id: user.user.id,
        name,
        addresses,
        optimized_order: [], // No single optimized order for multi-driver routes
        total_distance: totalDistance,
        total_duration: totalDuration,
        is_paid: false,
        is_multi_driver: true,
        driver_ids: driverIds
      }
    ])
    .select()
  
  if (error || !data || data.length === 0) {
    return { error: error || { message: 'Failed to create route' } }
  }
  
  const routeId = data[0].id
  
  // Insert driver routes
  const driverRoutesData = driverRoutes.map(dr => ({
    route_id: routeId,
    driver_id: dr.driver_id,
    addresses: dr.addresses,
    optimized_order: dr.optimized_order,
    total_distance: dr.total_distance,
    total_duration: dr.total_duration
  }))
  
  const { error: driverRoutesError } = await supabase
    .from('driver_routes')
    .insert(driverRoutesData)
  
  if (driverRoutesError) {
    return { error: driverRoutesError }
  }
  
  return { data, error: null }
}

export async function getDriverRoutes(routeId: string) {
  if (!supabase) return mockSupabaseResponse
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) {
    return { data: [], error: { message: 'Not authenticated' } }
  }
  
  const { data, error } = await supabase
    .from('driver_routes')
    .select('*')
    .eq('route_id', routeId)
  
  return { data, error }
}
