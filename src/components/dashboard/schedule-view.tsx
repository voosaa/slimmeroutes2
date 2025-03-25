"use client"

import { useState } from 'react'
import { Address } from '@/lib/supabase'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { 
  ArrowUpDown, 
  Clock, 
  MapPin, 
  Car, 
  DollarSign,
  Clipboard,
  Share2
} from 'lucide-react'

type ScheduleViewProps = {
  addresses: Address[]
  optimizedOrder: string[]
}

export function ScheduleView({ addresses, optimizedOrder }: ScheduleViewProps) {
  const [sortBy, setSortBy] = useState<'order' | 'address'>('order')
  
  // Get the ordered addresses
  const orderedAddresses = optimizedOrder
    .map(id => addresses.find(addr => addr.id === id))
    .filter(Boolean) as Address[]
  
  // Sort addresses based on the current sort option
  const sortedAddresses = [...orderedAddresses].sort((a, b) => {
    if (sortBy === 'order') {
      return optimizedOrder.indexOf(a.id) - optimizedOrder.indexOf(b.id)
    } else {
      return a.address.localeCompare(b.address)
    }
  })
  
  // Calculate estimated arrival times
  // Assuming an average speed of 50 km/h and 15 minutes at each stop
  const getEstimatedTimes = () => {
    const times: { [key: string]: string } = {}
    let currentTime = new Date()
    currentTime.setHours(9, 0, 0, 0) // Start at 9:00 AM
    
    // Set the first address time
    times[orderedAddresses[0].id] = formatTime(currentTime)
    
    // Calculate times for subsequent addresses
    for (let i = 0; i < orderedAddresses.length - 1; i++) {
      const start = orderedAddresses[i]
      const end = orderedAddresses[i + 1]
      
      // Calculate distance using Haversine formula
      const distance = calculateHaversineDistance(
        start.lat, start.lng,
        end.lat, end.lng
      )
      
      // Calculate travel time in minutes (50 km/h average speed)
      const travelTimeMinutes = (distance / 50) * 60
      
      // Add travel time + 15 minutes for the stop
      currentTime = new Date(currentTime.getTime() + (travelTimeMinutes + 15) * 60 * 1000)
      
      // Set the time for this address
      times[end.id] = formatTime(currentTime)
    }
    
    return times
  }
  
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c // Distance in km
    return distance
  }
  
  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180)
  }
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  const estimatedTimes = getEstimatedTimes()
  
  // Get distance between two addresses
  const getDistance = (index: number) => {
    if (index === 0) return '0.0'
    
    const start = orderedAddresses[index - 1]
    const end = orderedAddresses[index]
    
    const distance = calculateHaversineDistance(
      start.lat, start.lng,
      end.lat, end.lng
    )
    
    return distance.toFixed(1)
  }
  
  // Share schedule
  const handleShareSchedule = () => {
    const scheduleText = sortedAddresses.map((addr, index) => {
      return `${index + 1}. ${addr.address} - Arrival: ${estimatedTimes[addr.id]}`
    }).join('\n')
    
    navigator.clipboard.writeText(scheduleText)
      .then(() => {
        alert('Schedule copied to clipboard!')
      })
      .catch(err => {
        console.error('Failed to copy schedule:', err)
      })
  }
  
  // Export as CSV
  const handleExportCSV = () => {
    const headers = ['Order', 'Address', 'Estimated Arrival', 'Distance', 'Notes']
    const rows = sortedAddresses.map((addr, index) => {
      return [
        index + 1,
        addr.address,
        estimatedTimes[addr.id],
        getDistance(index) + ' km',
        addr.notes || ''
      ]
    })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'route_schedule.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  if (orderedAddresses.length === 0) {
    return <div className="text-neutral-500 text-center py-4">No route generated yet.</div>
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy(sortBy === 'order' ? 'address' : 'order')}
          >
            <ArrowUpDown className="h-4 w-4 mr-1" />
            Sort by {sortBy === 'order' ? 'Address' : 'Order'}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleShareSchedule}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Clipboard className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="w-[120px]">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Est. Arrival
                </div>
              </TableHead>
              <TableHead className="w-[100px]">
                <div className="flex items-center">
                  <Car className="h-4 w-4 mr-1" />
                  Distance
                </div>
              </TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAddresses.map((address, index) => (
              <TableRow key={address.id}>
                <TableCell className="font-medium">
                  {optimizedOrder.indexOf(address.id) + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-1 mt-1 text-neutral-400 flex-shrink-0" />
                    <span>{address.address}</span>
                  </div>
                </TableCell>
                <TableCell>{estimatedTimes[address.id]}</TableCell>
                <TableCell>{getDistance(optimizedOrder.indexOf(address.id))} km</TableCell>
                <TableCell className="text-neutral-600 text-sm">
                  {address.notes || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-4 text-sm text-neutral-500">
        <p>* Estimated arrival times assume a 9:00 AM start, average speed of 50 km/h, and 15 minutes at each stop.</p>
      </div>
    </div>
  )
}
