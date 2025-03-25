"use client"

import { useState, useCallback, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, TrafficLayer } from '@react-google-maps/api'
import { Address } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

type MapComponentProps = {
  addresses: Address[]
  optimizedOrder: string[]
}

const containerStyle = {
  width: '100%',
  height: '400px'
}

const defaultCenter = {
  lat: 52.3676,
  lng: 4.9041
}

export default function MapComponent({ addresses, optimizedOrder }: MapComponentProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [center, setCenter] = useState(defaultCenter)
  const [showTraffic, setShowTraffic] = useState(false)
  const [travelMode, setTravelMode] = useState<google.maps.TravelMode>(google.maps.TravelMode.DRIVING)
  const [isCalculating, setIsCalculating] = useState(false)
  
  // Debug Google Maps API key
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    console.log("Map Component - Google Maps API Key:", apiKey ? "Set (length: " + apiKey.length + ")" : "Not set")
  }, [])

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  })

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Calculate center of the map based on addresses
  useEffect(() => {
    if (addresses.length > 0) {
      const totalLat = addresses.reduce((sum, addr) => sum + addr.lat, 0)
      const totalLng = addresses.reduce((sum, addr) => sum + addr.lng, 0)
      setCenter({
        lat: totalLat / addresses.length,
        lng: totalLng / addresses.length
      })
    }
  }, [addresses])

  // Calculate directions when optimizedOrder changes
  useEffect(() => {
    if (!isLoaded || addresses.length < 2 || optimizedOrder.length < 2) {
      return
    }

    const fetchDirections = async () => {
      try {
        setIsCalculating(true)
        
        // Get addresses in the optimized order
        const orderedAddresses = optimizedOrder
          .map(id => addresses.find(addr => addr.id === id))
          .filter(Boolean) as Address[]
        
        if (orderedAddresses.length < 2) {
          return
        }
        
        const directionsService = new google.maps.DirectionsService()
        
        // Origin is the first address
        const origin = {
          lat: orderedAddresses[0].lat,
          lng: orderedAddresses[0].lng
        }
        
        // Destination is the last address
        const destination = {
          lat: orderedAddresses[orderedAddresses.length - 1].lat,
          lng: orderedAddresses[orderedAddresses.length - 1].lng
        }
        
        // Waypoints are all addresses in between
        const waypoints = orderedAddresses.slice(1, orderedAddresses.length - 1).map(addr => ({
          location: new google.maps.LatLng(addr.lat, addr.lng),
          stopover: true
        }))
        
        const result = await directionsService.route({
          origin,
          destination,
          waypoints,
          travelMode,
          optimizeWaypoints: false, // We already optimized the order
          drivingOptions: travelMode === google.maps.TravelMode.DRIVING ? {
            departureTime: new Date(),
            trafficModel: google.maps.TrafficModel.BEST_GUESS
          } : undefined,
          avoidHighways: false,
          avoidTolls: false
        })
        
        setDirections(result)
      } catch (error) {
        console.error('Error fetching directions:', error)
      } finally {
        setIsCalculating(false)
      }
    }
    
    fetchDirections()
  }, [isLoaded, addresses, optimizedOrder, travelMode])

  const toggleTraffic = () => {
    setShowTraffic(prev => !prev)
  }

  const changeTravelMode = (mode: google.maps.TravelMode) => {
    setTravelMode(mode)
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg">Loading map...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Switch 
            id="traffic-toggle" 
            checked={showTraffic} 
            onCheckedChange={toggleTraffic} 
          />
          <Label htmlFor="traffic-toggle">Show Traffic</Label>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant={travelMode === google.maps.TravelMode.DRIVING ? "default" : "outline"} 
            onClick={() => changeTravelMode(google.maps.TravelMode.DRIVING)}
          >
            Driving
          </Button>
          <Button 
            size="sm" 
            variant={travelMode === google.maps.TravelMode.WALKING ? "default" : "outline"} 
            onClick={() => changeTravelMode(google.maps.TravelMode.WALKING)}
          >
            Walking
          </Button>
          <Button 
            size="sm" 
            variant={travelMode === google.maps.TravelMode.BICYCLING ? "default" : "outline"} 
            onClick={() => changeTravelMode(google.maps.TravelMode.BICYCLING)}
          >
            Bicycling
          </Button>
          <Button 
            size="sm" 
            variant={travelMode === google.maps.TravelMode.TRANSIT ? "default" : "outline"} 
            onClick={() => changeTravelMode(google.maps.TravelMode.TRANSIT)}
          >
            Transit
          </Button>
        </div>
      </div>
      
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true
        }}
      >
        {/* Traffic Layer */}
        {showTraffic && <TrafficLayer />}
        
        {/* Markers for addresses without optimized order */}
        {(!optimizedOrder.length || !directions) && addresses.map((address) => (
          <Marker
            key={address.id}
            position={{ lat: address.lat, lng: address.lng }}
            title={address.address}
          />
        ))}
        
        {/* Directions renderer */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#3B82F6',
                strokeWeight: 5,
                strokeOpacity: 0.8
              }
            }}
          />
        )}
      </GoogleMap>
      
      {isCalculating && (
        <div className="text-center text-sm text-neutral-500">
          Calculating route with {addresses.length} stops...
        </div>
      )}
      
      {directions && directions.routes[0] && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Route Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-500">Distance:</p>
              <p className="font-medium">{directions.routes[0].legs.reduce((total, leg) => total + leg.distance!.value, 0) / 1000} km</p>
            </div>
            <div>
              <p className="text-neutral-500">Duration:</p>
              <p className="font-medium">{Math.round(directions.routes[0].legs.reduce((total, leg) => total + leg.duration!.value, 0) / 60)} minutes</p>
            </div>
            {showTraffic && travelMode === google.maps.TravelMode.DRIVING && (
              <div className="col-span-2">
                <p className="text-neutral-500">Duration in traffic:</p>
                <p className="font-medium">{Math.round(directions.routes[0].legs.reduce((total, leg) => total + (leg.duration_in_traffic?.value || leg.duration!.value), 0) / 60)} minutes</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
