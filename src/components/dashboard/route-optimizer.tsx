"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Address, supabase } from '@/lib/supabase'
import { Loader2, Route, RotateCw, Clock, TrendingDown, Play, DollarSign, Download, Home, Smartphone, Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { exportRouteToGoogleCalendar, isSignedInToGoogle, loadGoogleCalendarApi, signInToGoogle } from '@/lib/google-calendar'

type RouteOptimizerProps = {
  addresses: Address[]
  onOptimizeRoute: (optimizedAddresses: Address[]) => void
}

type DistanceMatrix = {
  [key: string]: {
    [key: string]: {
      distance: number // in meters
      duration: number // in seconds
    }
  }
}

export function RouteOptimizer({ addresses, onOptimizeRoute }: RouteOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isMobileExporting, setIsMobileExporting] = useState(false)
  const [isCalendarExporting, setIsCalendarExporting] = useState(false)
  const [distanceMatrix, setDistanceMatrix] = useState<DistanceMatrix>({})
  const [startingAddressId, setStartingAddressId] = useState<string>("")
  const [optimizationStats, setOptimizationStats] = useState<{
    totalDistance: number
    totalDuration: number
    improvementPercentage: number
    laborCost: number
  } | null>(null)
  const [hourlyCost, setHourlyCost] = useState<number>(25) // Default hourly cost
  const [googleCalendarEnabled, setGoogleCalendarEnabled] = useState(false)
  const [optimizedOrder, setOptimizedOrder] = useState<string[]>([])
  const { toast } = useToast()
  const { user } = useAuth()

  // Load user settings and initialize Google Calendar API
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('hourly_cost, google_calendar_enabled')
          .eq('user_id', user.id)
          .single()
        
        if (data) {
          setHourlyCost(data.hourly_cost || 25)
          setGoogleCalendarEnabled(data.google_calendar_enabled || false)
          
          // Initialize Google Calendar API if enabled
          if (data.google_calendar_enabled) {
            try {
              console.log('Initializing Google Calendar API...');
              await loadGoogleCalendarApi()
              console.log('Google Calendar API loaded successfully')
            } catch (error) {
              console.error('Error loading Google Calendar API:', error)
              toast({
                title: 'Warning',
                description: 'Could not load Google Calendar integration. Please check your API credentials.',
                variant: 'destructive'
              })
            }
          }
        }
      } catch (err) {
        console.error('Error loading user settings:', err)
      }
    }

    loadUserSettings()
  }, [user, toast])

  // Set the first address as the default starting address when addresses change
  useEffect(() => {
    if (addresses.length > 0 && !startingAddressId) {
      setStartingAddressId(addresses[0].id)
    }
  }, [addresses])

  // Function to calculate distances between all addresses using Google Distance Matrix API
  const calculateDistanceMatrix = async (addresses: Address[]) => {
    if (!window.google || !window.google.maps) {
      toast({
        title: "Error",
        description: "Google Maps API is not loaded",
        variant: "destructive"
      })
      return null
    }

    if (addresses.length < 2) {
      toast({
        title: "Not enough addresses",
        description: "You need at least 2 addresses to optimize a route",
        variant: "destructive"
      })
      return null
    }

    const service = new google.maps.DistanceMatrixService()
    const matrix: DistanceMatrix = {}

    // Create a matrix of all possible origin-destination pairs
    for (let i = 0; i < addresses.length; i++) {
      const origin = addresses[i]
      matrix[origin.id] = {}

      // Process in batches of 10 destinations (API limit)
      for (let j = 0; j < addresses.length; j += 10) {
        const batchDestinations = addresses.slice(j, j + 10)
        
        try {
          console.log(`Calculating distances from ${origin.address} to batch of ${batchDestinations.length} destinations`)
          
          const response = await new Promise<google.maps.DistanceMatrixResponse>((resolve, reject) => {
            service.getDistanceMatrix({
              origins: [{ lat: origin.lat, lng: origin.lng }],
              destinations: batchDestinations.map(dest => ({ lat: dest.lat, lng: dest.lng })),
              travelMode: google.maps.TravelMode.DRIVING,
              unitSystem: google.maps.UnitSystem.METRIC,
              avoidHighways: false,
              avoidTolls: false
            }, (response, status) => {
              console.log(`Distance Matrix API response status: ${status}`)
              if (status === google.maps.DistanceMatrixStatus.OK && response) {
                resolve(response)
              } else {
                reject(new Error(`Distance Matrix request failed: ${status}`))
              }
            })
          })

          // Process the response
          for (let k = 0; k < batchDestinations.length; k++) {
            const destination = batchDestinations[k]
            const element = response.rows[0].elements[k]
            
            if (element.status === 'OK') {
              matrix[origin.id][destination.id] = {
                distance: element.distance.value,
                duration: element.duration.value
              }
              console.log(`Distance from ${origin.address} to ${destination.address}: ${element.distance.text}, Duration: ${element.duration.text}`)
            } else {
              console.error(`Failed to get distance for ${origin.address} to ${destination.address}: ${element.status}`)
              // Use a fallback straight-line distance calculation
              const distance = calculateHaversineDistance(
                origin.lat, origin.lng, 
                destination.lat, destination.lng
              )
              // Estimate duration based on average speed of 50 km/h
              const duration = Math.round(distance / 50 * 3600)
              
              matrix[origin.id][destination.id] = {
                distance: Math.round(distance * 1000), // Convert km to meters
                duration: duration // seconds
              }
              console.log(`Using fallback distance calculation: ${distance.toFixed(2)} km, Est. duration: ${Math.round(duration / 60)} mins`)
            }
          }
          
          // Add a small delay between API calls to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (error) {
          console.error('Error calculating distance matrix:', error)
          
          // Use fallback distance calculation for this batch
          for (let k = 0; k < batchDestinations.length; k++) {
            const destination = batchDestinations[k]
            
            // Use a fallback straight-line distance calculation
            const distance = calculateHaversineDistance(
              origin.lat, origin.lng, 
              destination.lat, destination.lng
            )
            // Estimate duration based on average speed of 50 km/h
            const duration = Math.round(distance / 50 * 3600)
            
            matrix[origin.id][destination.id] = {
              distance: Math.round(distance * 1000), // Convert km to meters
              duration: duration // seconds
            }
            console.log(`Using fallback distance for ${origin.address} to ${destination.address}: ${distance.toFixed(2)} km`)
          }
        }
      }
    }

    return matrix
  }
  
  // Haversine formula to calculate distance between two points on Earth
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distance in km
  }

  // Nearest Neighbor algorithm for route optimization
  const optimizeRouteWithNearestNeighbor = (matrix: DistanceMatrix, startAddressId: string) => {
    const unvisited = new Set(Object.keys(matrix))
    const optimizedRoute: string[] = []
    let currentAddressId = startAddressId
    let totalDistance = 0
    let totalDuration = 0

    // Add the starting address
    optimizedRoute.push(currentAddressId)
    unvisited.delete(currentAddressId)

    // Find the nearest neighbor for each step
    while (unvisited.size > 0) {
      let nearestAddressId = ''
      let minDistance = Infinity

      // Convert Set to Array for iteration to avoid TypeScript error
      Array.from(unvisited).forEach(addressId => {
        const distance = matrix[currentAddressId][addressId].distance
        if (distance < minDistance) {
          minDistance = distance
          nearestAddressId = addressId
        }
      })

      // Add the nearest address to the route
      optimizedRoute.push(nearestAddressId)
      totalDistance += minDistance
      totalDuration += matrix[currentAddressId][nearestAddressId].duration
      
      // Update current address and remove from unvisited
      currentAddressId = nearestAddressId
      unvisited.delete(nearestAddressId)
    }

    return { optimizedRoute, totalDistance, totalDuration }
  }

  // Try different starting points to find the best route
  const findBestRoute = (matrix: DistanceMatrix) => {
    let bestRoute: string[] = []
    let bestDistance = Infinity
    let bestDuration = Infinity

    // Try each address as a starting point
    for (const startAddressId of Object.keys(matrix)) {
      const { optimizedRoute, totalDistance, totalDuration } = optimizeRouteWithNearestNeighbor(matrix, startAddressId)
      
      if (totalDistance < bestDistance) {
        bestRoute = optimizedRoute
        bestDistance = totalDistance
        bestDuration = totalDuration
      }
    }

    return { bestRoute, bestDistance, bestDuration }
  }

  // Calculate the total distance and duration of the current route
  const calculateCurrentRouteStats = (matrix: DistanceMatrix) => {
    if (addresses.length < 2) return { distance: 0, duration: 0 }
    
    let totalDistance = 0
    let totalDuration = 0

    for (let i = 0; i < addresses.length - 1; i++) {
      const currentId = addresses[i].id
      const nextId = addresses[i + 1].id
      
      if (matrix[currentId] && matrix[currentId][nextId]) {
        totalDistance += matrix[currentId][nextId].distance
        totalDuration += matrix[currentId][nextId].duration
      }
    }

    return { distance: totalDistance, duration: totalDuration }
  }

  // Calculate labor cost based on duration and hourly rate
  const calculateLaborCost = (durationInSeconds: number) => {
    // Convert seconds to hours and multiply by hourly rate
    const hours = durationInSeconds / 3600
    return hours * hourlyCost
  }

  // Add time spent at each address to the total duration
  const calculateTotalTimeWithStops = (durationInSeconds: number) => {
    // Add time spent at each address (if specified)
    const totalStopTime = addresses.reduce((total, address) => {
      // Convert minutes to seconds and add to total
      return total + ((address.time_spent || 0) * 60)
    }, 0)
    
    return durationInSeconds + totalStopTime
  }

  const handleOptimizeRoute = async () => {
    if (addresses.length < 2) {
      toast({
        title: "Not enough addresses",
        description: "You need at least 2 addresses to optimize a route",
        variant: "destructive"
      })
      return
    }

    if (!startingAddressId) {
      toast({
        title: "Starting address required",
        description: "Please select a starting address for your route",
        variant: "destructive"
      })
      return
    }
    
    setIsOptimizing(true)
    
    try {
      // Calculate distance matrix
      const matrix = await calculateDistanceMatrix(addresses)
      if (!matrix) {
        throw new Error("Failed to calculate distance matrix")
      }
      
      setDistanceMatrix(matrix)
      
      // Optimize route with the selected starting address
      const { optimizedRoute, totalDistance, totalDuration } = optimizeRouteWithNearestNeighbor(matrix, startingAddressId)
      
      // Get the current route stats
      const { distance: currentDistance, duration: currentDuration } = calculateCurrentRouteStats(matrix)
      
      // Calculate improvement percentage
      const improvementPercentage = currentDistance > 0 
        ? ((currentDistance - totalDistance) / currentDistance) * 100 
        : 0
      
      // Calculate labor cost
      const laborCost = calculateLaborCost(totalDuration)
      
      // Update stats
      setOptimizationStats({
        totalDistance,
        totalDuration,
        improvementPercentage,
        laborCost
      })
      
      // Reorder addresses based on optimized route
      const optimizedAddresses = optimizedRoute.map(id => 
        addresses.find(addr => addr.id === id)!
      )
      
      setOptimizedOrder(optimizedRoute)
      
      // Call the parent component's callback
      onOptimizeRoute(optimizedAddresses)
      
      toast({
        title: "Route optimized",
        description: `Optimized route with ${addresses.length} addresses`,
        variant: "default"
      })
    } catch (error) {
      console.error('Error optimizing route:', error)
      toast({
        title: "Error",
        description: "Failed to optimize route",
        variant: "destructive"
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleStartRoute = () => {
    if (!optimizationStats) {
      toast({
        title: "Optimize first",
        description: "Please optimize your route before starting navigation",
        variant: "destructive"
      })
      return
    }
    
    // Generate Google Maps URL with waypoints
    const origin = addresses[0]
    const destination = addresses[addresses.length - 1]
    const waypoints = addresses.slice(1, -1)
    
    let googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`
    
    if (waypoints.length > 0) {
      const waypointsString = waypoints
        .map(wp => `${wp.lat},${wp.lng}`)
        .join('|')
      
      googleMapsUrl += `&waypoints=${waypointsString}`
    }
    
    // Open Google Maps in a new tab
    window.open(googleMapsUrl, '_blank')
    
    toast({
      title: "Route started",
      description: "Navigation opened in Google Maps",
      variant: "default"
    })
  }

  const exportToGPX = () => {
    if (!optimizationStats) {
      toast({
        title: "Optimize first",
        description: "Please optimize your route before exporting",
        variant: "destructive"
      })
      return
    }
    
    setIsExporting(true)
    
    try {
      // Create GPX content
      let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RoutePlanner Pro" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>RoutePlanner Pro Optimized Route</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <rte>
    <name>Optimized Route</name>\n`
      
      // Add route points
      addresses.forEach((address, index) => {
        gpxContent += `    <rtept lat="${address.lat}" lon="${address.lng}">
      <name>Stop ${index + 1}: ${address.address}</name>
      ${address.notes ? `<desc>${address.notes}</desc>` : ''}
    </rtept>\n`
      })
      
      // Close GPX file
      gpxContent += `  </rte>
</gpx>`
      
      // Create a blob and download link
      const blob = new Blob([gpxContent], { type: 'application/gpx+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `route-${new Date().toISOString().slice(0, 10)}.gpx`
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
      
      toast({
        title: "Export successful",
        description: "Route exported to GPX format",
        variant: "default"
      })
    } catch (error) {
      console.error('Error exporting to GPX:', error)
      toast({
        title: "Export failed",
        description: "Failed to export route to GPX format",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportMobileRoute = () => {
    if (!optimizationStats) {
      toast({
        title: "Optimize first",
        description: "Please optimize your route before exporting",
        variant: "destructive"
      })
      return
    }
    
    setIsMobileExporting(true)
    
    try {
      // Create HTML content with embedded map and route information
      let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RoutePlanner Pro - Mobile Route</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      max-width: 100%;
      padding: 16px;
    }
    header {
      background: #4f46e5;
      color: white;
      padding: 16px;
      text-align: center;
      position: relative;
      border-radius: 0 0 8px 8px;
      margin-bottom: 16px;
    }
    h1 { 
      margin: 0;
      font-size: 20px;
    }
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-title {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 18px;
      font-weight: bold;
    }
    .map-container {
      height: 300px;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    #map {
      height: 100%;
      width: 100%;
    }
    .addresses {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .address-item {
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      position: relative;
    }
    .address-item:last-child {
      border-bottom: none;
    }
    .address-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: #4f46e5;
      color: white;
      border-radius: 50%;
      font-size: 12px;
      margin-right: 8px;
      flex-shrink: 0;
    }
    .address-content {
      display: flex;
      align-items: center;
    }
    .address-details {
      flex: 1;
    }
    .address-text {
      font-weight: 500;
      margin-bottom: 4px;
    }
    .address-notes {
      font-size: 12px;
      color: #666;
    }
    .address-time {
      font-size: 12px;
      color: #4f46e5;
      font-weight: 500;
    }
    .start-navigation {
      display: block;
      background: #16a34a;
      color: white;
      text-align: center;
      padding: 16px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      margin: 16px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .offline-message {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <header>
    <h1>RoutePlanner Pro - Mobile Route</h1>
    <p>Generated on ${new Date().toLocaleDateString()}</p>
  </header>
  
  <div class="container">
    <div class="offline-message">
      This route is available offline. You can use this page without internet connection once it's loaded.
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-title">Total Distance</div>
        <div class="stat-value">${(optimizationStats.totalDistance / 1000).toFixed(1)} km</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Total Time</div>
        <div class="stat-value">${Math.floor(optimizationStats.totalDuration / 3600)}h ${Math.floor((optimizationStats.totalDuration % 3600) / 60)}m</div>
      </div>
    </div>
    
    <div class="map-container">
      <div id="map"></div>
    </div>
    
    <a href="https://www.google.com/maps/dir/?api=1&origin=${addresses[0].lat},${addresses[0].lng}&destination=${addresses[addresses.length - 1].lat},${addresses[addresses.length - 1].lng}&waypoints=${addresses.slice(1, -1).map(wp => `${wp.lat},${wp.lng}`).join('|')}" class="start-navigation">
      Start Navigation in Google Maps
    </a>
    
    <div class="addresses">
      ${addresses.map((address, index) => `
        <div class="address-item">
          <div class="address-content">
            <div class="address-number">${index + 1}</div>
            <div class="address-details">
              <div class="address-text">${address.address}</div>
              ${address.notes ? `<div class="address-notes">${address.notes}</div>` : ''}
              ${address.time_spent ? `<div class="address-time">Time: ${address.time_spent} min</div>` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  
  <script>
    // Store the route data for offline use
    const routeData = ${JSON.stringify(addresses)};
    
    // Initialize the map when the page loads
    document.addEventListener('DOMContentLoaded', function() {
      // Check if online to load Google Maps
      if (navigator.onLine) {
        // Load Google Maps script
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=&callback=initMap';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      } else {
        // Show offline message
        document.getElementById('map').innerHTML = '<div style="padding: 20px; text-align: center;">Map unavailable offline. Connect to internet to view the map.</div>';
      }
    });
    
    // Initialize the map
    function initMap() {
      const bounds = new google.maps.LatLngBounds();
      const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10,
        center: { lat: ${addresses[0].lat}, lng: ${addresses[0].lng} }
      });
      
      // Add markers for each address
      routeData.forEach((address, index) => {
        const position = { lat: address.lat, lng: address.lng };
        const marker = new google.maps.Marker({
          position,
          map,
          label: (index + 1).toString(),
          title: address.address
        });
        
        bounds.extend(position);
      });
      
      // Create the route path
      const path = routeData.map(addr => ({ lat: addr.lat, lng: addr.lng }));
      const routePath = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#4f46e5',
        strokeOpacity: 1.0,
        strokeWeight: 3
      });
      
      routePath.setMap(map);
      map.fitBounds(bounds);
    }
  </script>
</body>
</html>`;
      
      // Create a blob and download link
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mobile-route-${new Date().toISOString().slice(0, 10)}.html`
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
      
      toast({
        title: "Export successful",
        description: "Mobile route file downloaded",
        variant: "default"
      })
    } catch (error) {
      console.error('Error exporting mobile route:', error)
      toast({
        title: "Export failed",
        description: "Failed to export mobile route file",
        variant: "destructive"
      })
    } finally {
      setIsMobileExporting(false)
    }
  }

  const exportToGoogleCalendar = async () => {
    if (!optimizationStats) {
      toast({
        title: "Optimize first",
        description: "Please optimize your route before exporting to Google Calendar",
        variant: "destructive"
      })
      return
    }
    
    setIsCalendarExporting(true)
    
    try {
      console.log("Starting Google Calendar export process...")
      
      // Try to initialize Google Calendar API if not already initialized
      try {
        console.log("Loading Google Calendar API...")
        await loadGoogleCalendarApi()
        console.log("Google Calendar API loaded successfully")
        
        if (!isSignedInToGoogle()) {
          console.log("User not signed in to Google, initiating sign-in...")
          await signInToGoogle()
          console.log("User successfully signed in to Google")
        } else {
          console.log("User already signed in to Google")
        }
      } catch (error) {
        console.error('Error with Google Calendar initialization:', error)
        
        // Provide more specific error messages based on the error type
        let errorMessage = "Could not connect to Google Calendar. Please check your API credentials and try again."
        
        if (error instanceof Error) {
          console.error('Error details:', error.message)
          
          if (error.message.includes('credentials')) {
            errorMessage = "Invalid Google Calendar API credentials. Please check your Client ID and API Key in the .env.local file."
          } else if (error.message.includes('scope')) {
            errorMessage = "Google Calendar API scope not authorized. Please check your OAuth consent screen configuration."
          } else if (error.message.includes('load')) {
            errorMessage = "Failed to load Google Calendar API. Please check your internet connection."
          } else if (error.message.includes('sign')) {
            errorMessage = "Google sign-in failed. Please try again or check your browser settings."
          }
        }
        
        toast({
          title: "Google Calendar Error",
          description: errorMessage,
          variant: "destructive"
        })
        setIsCalendarExporting(false)
        return
      }
      
      // Set the route date to tomorrow morning at 9 AM
      const routeDate = new Date()
      routeDate.setDate(routeDate.getDate() + 1)
      routeDate.setHours(9, 0, 0, 0)
      
      console.log("Preparing addresses for export...")
      
      // Export the route to Google Calendar
      const formattedAddresses = addresses.map(addr => ({
        id: addr.id,
        address: addr.address,
        lat: addr.lat,
        lng: addr.lng,
        notes: addr.notes || '',
        time_spent: 30 // Default to 30 minutes per stop
      }))
      
      // Sort addresses according to optimized order
      const orderedAddresses = optimizedOrder.map(id => 
        formattedAddresses.find(addr => addr.id === id)
      ).filter(Boolean) as typeof formattedAddresses
      
      console.log("Exporting route to Google Calendar with addresses:", orderedAddresses.length)
      
      const eventIds = await exportRouteToGoogleCalendar(orderedAddresses, routeDate)
      
      console.log("Export successful, created events:", eventIds.length)
      
      toast({
        title: "Export successful",
        description: `Created ${eventIds.length} events in your Google Calendar`,
      })
    } catch (error) {
      console.error('Error exporting to Google Calendar:', error)
      
      // Provide more specific error messages for export failures
      let errorMessage = "Could not export to Google Calendar. Please try again."
      
      if (error instanceof Error) {
        console.error('Export error details:', error.message)
        
        if (error.message.includes('permission') || error.message.includes('access')) {
          errorMessage = "Calendar access denied. Please check your Google account permissions."
        } else if (error.message.includes('quota')) {
          errorMessage = "Google Calendar API quota exceeded. Please try again later."
        } else if (error.message.includes('network')) {
          errorMessage = "Network error during export. Please check your internet connection."
        }
      }
      
      toast({
        title: "Export failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsCalendarExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <div className="flex items-center mb-2">
          <Home className="h-4 w-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Starting Address</h3>
        </div>
        <div className="mb-4">
          <Select 
            value={startingAddressId} 
            onValueChange={setStartingAddressId}
            disabled={addresses.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a starting address" />
            </SelectTrigger>
            <SelectContent>
              {addresses.map((address) => (
                <SelectItem key={address.id} value={address.id}>
                  {address.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Select the address where you'll start your route from
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleOptimizeRoute} 
          disabled={isOptimizing || addresses.length < 2}
          className="flex-1"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <RotateCw className="mr-2 h-4 w-4" />
              Optimize Route
            </>
          )}
        </Button>
        
        <Button 
          onClick={handleStartRoute}
          disabled={!optimizationStats}
          variant="default"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          <Play className="mr-2 h-4 w-4" />
          Start Route
        </Button>
        
        <Button
          onClick={exportToGPX}
          disabled={!optimizationStats || isExporting}
          variant="outline"
          className="flex-1"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export GPX
            </>
          )}
        </Button>
        
        <Button
          onClick={exportMobileRoute}
          disabled={!optimizationStats || isMobileExporting}
          variant="outline"
          className="flex-1"
        >
          {isMobileExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Smartphone className="mr-2 h-4 w-4" />
              Mobile Route
            </>
          )}
        </Button>
        
        {googleCalendarEnabled && (
          <Button
            onClick={exportToGoogleCalendar}
            disabled={!optimizationStats || isCalendarExporting}
            variant="outline"
            className="flex-1"
          >
            {isCalendarExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                To Calendar
              </>
            )}
          </Button>
        )}
      </div>
      
      {optimizationStats && (
        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Distance</p>
                <p className="text-lg font-semibold">{(optimizationStats.totalDistance / 1000).toFixed(1)} km</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Route className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Time</p>
                <p className="text-lg font-semibold">
                  {Math.floor(optimizationStats.totalDuration / 3600)}h {Math.floor((optimizationStats.totalDuration % 3600) / 60)}m
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Improvement</p>
                <p className="text-lg font-semibold">{optimizationStats.improvementPercentage.toFixed(1)}%</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Labor Cost</p>
                <p className="text-lg font-semibold">€{optimizationStats.laborCost.toFixed(2)}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
