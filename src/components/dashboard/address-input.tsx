"use client"

import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Address, supabase } from '@/lib/supabase'
import { Loader } from '@googlemaps/js-api-loader'
import { Check, Star, Plus, Upload } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

type AddressInputProps = {
  onAddAddress: (address: Address) => void
}

// Add proper type declaration for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

export function AddressInput({ onAddAddress }: AddressInputProps) {
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [timeSpent, setTimeSpent] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [appointmentWindow, setAppointmentWindow] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoaded, setGoogleLoaded] = useState(false)
  const [frequentAddresses, setFrequentAddresses] = useState<Address[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const googleRef = useRef<typeof google | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // Initialize Google Maps API
  useEffect(() => {
    const initGoogleMaps = async () => {
      try {
        console.log("Initializing Google Maps API...")
        
        // First check if Google Maps is already loaded globally
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log("Google Maps API already loaded globally")
          googleRef.current = window.google
          
          // Initialize Autocomplete service
          autocompleteRef.current = new window.google.maps.places.AutocompleteService()
          
          // Create a dummy div for PlacesService (required but not visible)
          const placesDiv = document.createElement('div')
          placesDiv.style.display = 'none'
          document.body.appendChild(placesDiv)
          
          placesServiceRef.current = new window.google.maps.places.PlacesService(placesDiv)
          setGoogleLoaded(true)
          return
        }
        
        // If not loaded globally, try to load it
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
        
        // Debug Google Maps API key
        console.log("Google Maps API Key:", apiKey ? "Set (length: " + apiKey.length + ")" : "Not set")
        
        if (!apiKey) {
          console.error("Google Maps API key is missing")
          toast({
            title: "Configuration Error",
            description: "Google Maps API key is missing. Please check your environment variables.",
            variant: "destructive"
          })
          return
        }
        
        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places']
        })

        const google = await loader.load()
        googleRef.current = google
        
        // Initialize Autocomplete service
        if (google.maps.places) {
          autocompleteRef.current = new google.maps.places.AutocompleteService()
          
          // Create a dummy div for PlacesService (required but not visible)
          const placesDiv = document.createElement('div')
          placesDiv.style.display = 'none'
          document.body.appendChild(placesDiv)
          
          placesServiceRef.current = new google.maps.places.PlacesService(placesDiv)
        }
        
        setGoogleLoaded(true)
        console.log("Google Maps API loaded successfully")
      } catch (error) {
        console.error('Error loading Google Maps API:', error)
        toast({
          title: 'Error',
          description: 'Failed to load Google Maps API. Please check your API key and try again.',
          variant: 'destructive'
        })
      }
    }

    initGoogleMaps()
  }, [toast])
  
  // Load frequent addresses on component mount
  useEffect(() => {
    const loadFrequentAddresses = async () => {
      try {
        // Check if the user is authenticated
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          console.log("User not authenticated, skipping frequent addresses load");
          return;
        }
        
        // First check if the frequent_addresses table exists
        const { error: tableError } = await supabase
          .from('frequent_addresses')
          .select('count')
          .limit(1)
          .single();
          
        if (tableError) {
          console.log("frequent_addresses table might not exist, skipping");
          return;
        }
        
        // If table exists, proceed with loading frequent addresses
        const { data, error } = await supabase
          .from('frequent_addresses')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('usage_count', { ascending: false })
          .limit(5);
          
        if (error) throw error;
        
        setFrequentAddresses(data || []);
      } catch (error) {
        console.error('Error loading frequent addresses:', error);
        // Don't show error toast to avoid user confusion
        // Just silently fail and user won't see frequent addresses
      }
    };
    
    if (supabase) {
      loadFrequentAddresses();
    }
  }, [supabase]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAddress(value)
    
    // Show suggestions only if we have at least 3 characters
    if (value.length >= 3 && autocompleteRef.current) {
      fetchSuggestions(value)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }
  
  const fetchSuggestions = (input: string) => {
    if (!autocompleteRef.current) return
    
    const request = {
      input,
      componentRestrictions: { country: 'nl' }, // Restrict to Netherlands, change as needed
      types: ['address']
    }
    
    autocompleteRef.current.getPlacePredictions(
      request,
      (predictions, status) => {
        if (status === googleRef.current?.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions)
        } else {
          setSuggestions([])
        }
      }
    )
  }
  
  const handleSuggestionClick = (suggestion: google.maps.places.AutocompletePrediction) => {
    setAddress(suggestion.description)
    setSuggestions([])
    setShowSuggestions(false)
    
    // Focus back on the input
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }
  
  const handleFrequentAddressClick = (frequentAddress: Address) => {
    setAddress(frequentAddress.address)
    setNotes(frequentAddress.notes || '')
    
    // Update usage count in Supabase
    updateFrequentAddressUsage(frequentAddress.id)
  }
  
  const updateFrequentAddressUsage = async (addressId: string) => {
    if (!supabase || !user) return
    
    try {
      await supabase.rpc('increment_address_usage', {
        address_id: addressId
      })
    } catch (error) {
      console.error('Error updating address usage count:', error)
    }
  }
  
  const addToFrequentAddresses = async (newAddress: Address) => {
    if (!supabase || !user) return
    
    try {
      // Check if address already exists in frequent addresses
      const { data, error } = await supabase
        .from('frequent_addresses')
        .select('id')
        .eq('user_id', user.id)
        .eq('address', newAddress.address)
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error
      }
      
      if (data) {
        // Address already exists, update usage count
        await updateFrequentAddressUsage(data.id)
      } else {
        // Add new frequent address
        await supabase
          .from('frequent_addresses')
          .insert({
            ...newAddress,
            usage_count: 1
          })
      }
    } catch (error) {
      console.error('Error adding to frequent addresses:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!address.trim()) {
      toast({
        title: "Error",
        description: "Please enter an address",
        variant: "destructive"
      })
      return
    }
    
    if (!googleLoaded) {
      toast({
        title: "Error",
        description: "Google Maps API is not loaded yet. Please try again in a moment.",
        variant: "destructive"
      })
      return
    }
    
    if (!supabase) {
      toast({
        title: "Error",
        description: "Supabase client is not initialized",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    console.log("Adding address:", address)
    
    try {
      // Import the geocodeAddress function from our library
      const { geocodeAddress } = await import('@/lib/geocode');
      
      try {
        // Use our improved geocodeAddress function with a timeout
        console.log("Geocoding address using improved geocoder:", address);
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Geocoding request timed out after 15 seconds')), 15000);
        });
        
        // Race the geocoding against the timeout
        const geocodePromise = geocodeAddress(address);
        const geocodeResult = await Promise.race([geocodePromise, timeoutPromise]) as any;
        
        if (!geocodeResult || !geocodeResult.lat || !geocodeResult.lng) {
          throw new Error('Could not geocode address: Invalid result');
        }
        
        const lat = geocodeResult.lat;
        const lng = geocodeResult.lng;
        console.log("Geocoded coordinates:", lat, lng);
        
        // Parse time spent value
        const timeSpentMinutes = timeSpent ? parseInt(timeSpent) : undefined;
        
        // Parse appointment window value
        const appointmentWindowMinutes = appointmentWindow ? parseInt(appointmentWindow) : undefined;
        
        // Format appointment time to be compatible with timestamp
        // Use today's date with the specified time
        let formattedAppointmentTime = null;
        if (appointmentTime) {
          const today = new Date();
          const [hours, minutes] = appointmentTime.split(':');
          today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          formattedAppointmentTime = today.toISOString();
        }
        
        // Save to database first
        try {
          // Get the current user ID
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) {
            throw new Error("User not authenticated");
          }
          
          // Prepare address data
          const addressToInsert: Record<string, any> = {
            user_id: userData.user.id,
            address: address,
            lat: lat,
            lng: lng,
            notes: notes || null
          };
          
          // Add time fields only if they exist - avoid mentioning fields with schema issues
          if (timeSpentMinutes !== undefined) {
            // Using bracket notation to avoid direct property access
            addressToInsert['time_spent'] = timeSpentMinutes;
          }
          
          if (formattedAppointmentTime) {
            // Using bracket notation to avoid direct property access
            addressToInsert['appointment_time'] = formattedAppointmentTime;
          }
          
          if (appointmentWindowMinutes !== undefined) {
            // Using bracket notation to avoid direct property access
            addressToInsert['appointment_window'] = appointmentWindowMinutes;
          }
          
          console.log("Inserting address into database:", addressToInsert);
          
          // Direct insert with minimal fields first
          const { data, error } = await supabase
            .from('addresses')
            .insert(addressToInsert)
            .select();
          
          if (error) {
            throw new Error(`Failed to save address to database: ${error.message}`);
          }
          
          // Fetch the newly created address
          const { data: addressData, error: addressError } = await supabase
            .from('addresses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (addressError) {
            throw new Error(`Failed to fetch the newly created address: ${addressError.message}`);
          }
          
          const savedAddress = addressData[0]
          console.log("Saved address:", savedAddress)
          
          // Add the address to the UI via callback
          onAddAddress(savedAddress)
          
          // Add to frequent addresses
          await addToFrequentAddresses(savedAddress)
          
          // Reset form
          setAddress('')
          setNotes('')
          setTimeSpent('')
          setAppointmentTime('')
          setAppointmentWindow('')
          
          toast({
            title: 'Success',
            description: 'Address added successfully'
          })
        } catch (error) {
          console.error('Error adding address:', error)
          toast({
            title: 'Error',
            description: `Failed to add address: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'destructive'
          })
          setIsLoading(false) // Ensure loading state is reset on database error
        }
      } catch (error) {
        console.error('Error geocoding address:', error)
        toast({
          title: 'Error',
          description: `Failed to add address: Geocoding error - ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'destructive'
        })
        setIsLoading(false) // Ensure loading state is reset on geocoding error
      }
    } catch (error) {
      console.error('Error importing geocode function:', error)
      toast({
        title: 'Error',
        description: `Failed to add address: Could not load geocoding function`,
        variant: 'destructive'
      })
      setIsLoading(false) // Ensure loading state is reset on import error
    } finally {
      // Ensure loading state is reset in all cases
      setIsLoading(false)
    }
  }

  const handleImportCSV = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent form submission
    e.stopPropagation() // Stop event propagation
    
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const processCSVFile = async (file: File) => {
    setIsImporting(true)
    
    try {
      console.log('Reading CSV file:', file.name)
      const text = await file.text()
      console.log('CSV content:', text.substring(0, 200) + '...') // Log first 200 chars
      
      const rows = text.split('\n')
      console.log(`Found ${rows.length} rows in CSV file`)
      
      // Skip header row if present and filter out empty rows
      // Start from index 1 to skip header
      const addresses = rows
        .slice(1) // Skip header row
        .filter(row => row.trim() !== '')
        .map(row => {
          // Handle both comma and semicolon delimiters
          const delimiter = row.includes(';') ? ';' : ','
          return row.split(delimiter)[0].trim() // Assume first column is the address
        })
      
      console.log(`Extracted ${addresses.length} addresses from CSV:`, addresses)
      
      if (addresses.length === 0) {
        toast({
          title: 'Error',
          description: 'No valid addresses found in the CSV file',
          variant: 'destructive'
        })
        setIsImporting(false)
        return
      }
      
      // Ensure Google Maps API is loaded
      if (!googleRef.current) {
        console.log('Google Maps API not loaded, initializing...')
        try {
          const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
            version: 'weekly',
            libraries: ['places']
          })
          
          await loader.load()
          googleRef.current = window.google
          
          // Initialize services
          if (googleRef.current) {
            autocompleteRef.current = new googleRef.current.maps.places.AutocompleteService()
            const mapDiv = document.createElement('div')
            const map = new googleRef.current.maps.Map(mapDiv, { center: { lat: 0, lng: 0 }, zoom: 1 })
            placesServiceRef.current = new googleRef.current.maps.places.PlacesService(map)
          }
        } catch (error) {
          console.error('Failed to load Google Maps API:', error)
          toast({
            title: 'Error',
            description: 'Failed to load Google Maps API. Please refresh the page and try again.',
            variant: 'destructive'
          })
          setIsImporting(false)
          return
        }
      }
      
      // Double-check services are initialized
      if (!googleRef.current || !autocompleteRef.current || !placesServiceRef.current) {
        console.error('Google Maps services not available')
        toast({
          title: 'Error',
          description: 'Google Maps services not available. Please refresh the page and try again.',
          variant: 'destructive'
        })
        setIsImporting(false)
        return
      }
      
      let successCount = 0
      let errorCount = 0
      
      // Process addresses sequentially to avoid rate limiting
      for (const addressText of addresses) {
        if (!addressText) {
          console.log('Skipping empty address')
          continue
        }
        
        console.log('Processing address:', addressText)
        
        try {
          // Try direct geocoding first
          const geocoder = new googleRef.current.maps.Geocoder()
          const geocodeResult = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ address: addressText }, (results, status) => {
              console.log('Geocode status:', status)
              if (status === googleRef.current?.maps.GeocoderStatus.OK && results && results.length > 0) {
                console.log('Found geocode results:', results.length)
                resolve(results)
              } else {
                console.error('No geocode results found:', status)
                reject(new Error(`No geocode results found for address: ${addressText} (Status: ${status})`))
              }
            })
          })
          
          if (geocodeResult.length > 0) {
            const result = geocodeResult[0]
            console.log('Using geocode result:', result.formatted_address)
            
            // Save to Supabase
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) {
              throw new Error("User not authenticated");
            }
            
            const addressToInsert: Record<string, any> = {
              user_id: userData.user.id,
              address: result.formatted_address,
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
              notes: null
            };
            
            const { error } = await supabase
              .from('addresses')
              .insert(addressToInsert)
              .select();
            
            if (error) {
              errorCount++
              console.error('Error saving address to Supabase:', error)
            } else {
              successCount++
              console.log('Successfully saved address')
              // Notify parent component
              if (onAddAddress) {
                onAddAddress({
                  id: crypto.randomUUID(),
                  user_id: user?.id || '',
                  address: result.formatted_address,
                  lat: result.geometry.location.lat(),
                  lng: result.geometry.location.lng(),
                  created_at: new Date().toISOString()
                })
              }
            }
            continue // Skip the Places API attempt if geocoding succeeded
          }
          
          // Fall back to Places API if geocoding failed
          console.log('Falling back to Places API for:', addressText)
          // Get place details
          console.log('Getting predictions for:', addressText)
          const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve, reject) => {
            autocompleteRef.current!.getPlacePredictions(
              { input: addressText },
              (results, status) => {
                console.log('Prediction status:', status)
                if (status === googleRef.current?.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                  console.log('Found predictions:', results.length)
                  resolve(results)
                } else {
                  console.error('No predictions found:', status)
                  reject(new Error(`No results found for address: ${addressText} (Status: ${status})`))
                }
              }
            )
          })
          
          if (predictions.length > 0) {
            const placeId = predictions[0].place_id
            console.log('Selected place ID:', placeId)
            
            const placeDetails = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
              placesServiceRef.current!.getDetails(
                { placeId, fields: ['formatted_address', 'geometry'] },
                (result, status) => {
                  console.log('Place details status:', status)
                  if (status === googleRef.current?.maps.places.PlacesServiceStatus.OK && result) {
                    console.log('Got place details:', result.formatted_address)
                    resolve(result)
                  } else {
                    console.error('Failed to get place details:', status)
                    reject(new Error(`Failed to get details for address: ${addressText} (Status: ${status})`))
                  }
                }
              )
            })
            
            if (placeDetails.geometry?.location && placeDetails.formatted_address) {
              console.log('Saving address to Supabase:', placeDetails.formatted_address)
              // Save to Supabase
              const { data: userData } = await supabase.auth.getUser();
              if (!userData.user) {
                throw new Error("User not authenticated");
              }
              
              const addressToInsert: Record<string, any> = {
                user_id: userData.user.id,
                address: placeDetails.formatted_address,
                lat: placeDetails.geometry.location.lat(),
                lng: placeDetails.geometry.location.lng(),
                notes: null
              };
              
              const { error } = await supabase
                .from('addresses')
                .insert(addressToInsert)
                .select();
              
              if (error) {
                errorCount++
                console.error('Error saving address to Supabase:', error)
              } else {
                successCount++
                console.log('Successfully saved address')
                // Notify parent component
                if (onAddAddress) {
                  onAddAddress({
                    id: crypto.randomUUID(),
                    user_id: user?.id || '',
                    address: placeDetails.formatted_address,
                    lat: placeDetails.geometry.location.lat(),
                    lng: placeDetails.geometry.location.lng(),
                    created_at: new Date().toISOString()
                  })
                }
              }
            } else {
              errorCount++
              console.error('Invalid place details - missing geometry or formatted address')
            }
          } else {
            errorCount++
            console.error('No predictions found for address:', addressText)
          }
        } catch (error) {
          errorCount++
          console.error('Error processing address:', addressText, error)
        }
        
        // Add a small delay between requests to avoid rate limiting
        console.log('Waiting before processing next address...')
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      console.log(`Import complete: ${successCount} successful, ${errorCount} failed`)
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${successCount} addresses. ${errorCount > 0 ? `Failed to import ${errorCount} addresses.` : ''}`,
        variant: successCount > 0 ? 'default' : 'destructive'
      })
    } catch (error) {
      console.error('Error processing CSV file:', error)
      toast({
        title: 'Error',
        description: `Failed to process the CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('Selected file:', file.name, file.type, file.size)
      processCSVFile(file)
    } else {
      console.log('No file selected')
    }
    // Reset file input
    if (event.target) {
      event.target.value = ''
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="space-y-5">
        {frequentAddresses.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequently Used Addresses
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {frequentAddresses.map((addr) => (
                <Button
                  key={addr.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  onClick={() => handleFrequentAddressClick(addr)}
                >
                  <Star className="h-3 w-3 text-amber-500" />
                  {addr.address.length > 30 ? addr.address.substring(0, 30) + '...' : addr.address}
                </Button>
              ))}
            </div>
          </div>
        )}
      
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <div className="relative">
            <Input
              id="address"
              ref={inputRef}
              value={address}
              onChange={handleAddressChange}
              placeholder="Enter an address"
              className="w-full focus:ring-emerald-500 focus:border-emerald-500"
              disabled={isLoading || !googleLoaded}
              autoComplete="off"
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.description}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {!googleLoaded && (
            <div className="flex items-center space-x-2 text-sm text-amber-600 mt-2">
              <div className="animate-spin h-3 w-3 border-2 border-amber-500 rounded-full border-t-transparent"></div>
              <p>Loading Google Maps API...</p>
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this address"
            className="w-full focus:ring-emerald-500 focus:border-emerald-500 resize-none min-h-[80px]"
            disabled={isLoading}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="timeSpent" className="block text-sm font-medium text-gray-700 mb-1">
              Time spent (minutes)
            </label>
            <Input
              id="timeSpent"
              type="number"
              min="0"
              placeholder="15"
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              className="w-full focus:ring-emerald-500 focus:border-emerald-500"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700 mb-1">
              Driver arrival time
            </label>
            <Input
              id="appointmentTime"
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full focus:ring-emerald-500 focus:border-emerald-500"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              When the driver needs to arrive at this location
            </p>
          </div>
          
          <div>
            <label htmlFor="appointmentWindow" className="block text-sm font-medium text-gray-700 mb-1">
              Appointment window (minutes)
            </label>
            <Input
              id="appointmentWindow"
              type="number"
              min="0"
              placeholder="60"
              value={appointmentWindow}
              onChange={(e) => setAppointmentWindow(e.target.value)}
              className="w-full focus:ring-emerald-500 focus:border-emerald-500"
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isLoading || !googleLoaded} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                <span>Adding...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>Add Address</span>
              </div>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleImportCSV} 
            disabled={isImporting}
            type="button" // Explicitly set type to button to prevent form submission
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <a 
            href="/sample_addresses.csv" 
            download 
            className="text-xs text-emerald-600 hover:text-emerald-800 ml-2 flex items-center"
          >
            Download sample CSV
          </a>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </form>
  )
}
