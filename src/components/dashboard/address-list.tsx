"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Address } from '@/lib/supabase'
import { MapPin, Trash2, X, Info, Clock, Calendar, TimerIcon, Search, ArrowDown, ArrowUp } from 'lucide-react'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

type AddressListProps = {
  addresses: Address[]
  onDeleteAddress: (id: string) => void
  onUpdateAddress?: (id: string, updates: Partial<Address>) => void
  onDeleteAllAddresses?: () => void
}

export function AddressList({ addresses, onDeleteAddress, onUpdateAddress, onDeleteAllAddresses }: AddressListProps) {
  const [timeSpent, setTimeSpent] = useState<{[key: string]: string}>({})
  const [appointmentTime, setAppointmentTime] = useState<{[key: string]: string}>({})
  const [appointmentWindow, setAppointmentWindow] = useState<{[key: string]: string}>({})
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  const [openPopoverType, setOpenPopoverType] = useState<'time_spent' | 'appointment_time' | 'appointment_window' | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleTimeChange = (id: string, value: string) => {
    setTimeSpent(prev => ({ ...prev, [id]: value }))
  }
  
  const handleAppointmentTimeChange = (id: string, value: string) => {
    setAppointmentTime(prev => ({ ...prev, [id]: value }))
  }
  
  const handleAppointmentWindowChange = (id: string, value: string) => {
    setAppointmentWindow(prev => ({ ...prev, [id]: value }))
  }
  
  const handleTimeConfirm = (id: string) => {
    if (onUpdateAddress && timeSpent[id] !== undefined) {
      const minutes = parseInt(timeSpent[id]) || 0
      onUpdateAddress(id, { time_spent: minutes })
      // Close the popover
      setOpenPopoverId(null)
      setOpenPopoverType(null)
    }
  }
  
  const handleAppointmentTimeConfirm = (id: string) => {
    if (onUpdateAddress && appointmentTime[id] !== undefined) {
      // Format appointment time to be compatible with timestamp
      // Use today's date with the specified time
      let formattedAppointmentTime = null;
      if (appointmentTime[id]) {
        const today = new Date();
        const [hours, minutes] = appointmentTime[id].split(':');
        today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        formattedAppointmentTime = today.toISOString();
      }
      
      // Create update data object
      const updateData: any = {};
      
      // Add appointment_time separately to avoid any schema cache issues
      if (formattedAppointmentTime) {
        updateData.appointment_time = formattedAppointmentTime;
      } else {
        updateData.appointment_time = null;
      }
      
      onUpdateAddress(id, updateData);
      
      // Close the popover
      setOpenPopoverId(null)
      setOpenPopoverType(null)
    }
  }
  
  const handleAppointmentWindowConfirm = (id: string) => {
    if (onUpdateAddress && appointmentWindow[id] !== undefined) {
      const minutes = parseInt(appointmentWindow[id]) || 60
      onUpdateAddress(id, { appointment_window: minutes })
      // Close the popover
      setOpenPopoverId(null)
      setOpenPopoverType(null)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Filter and sort addresses
  const filteredAddresses = addresses.filter(address => {
    if (!searchQuery.trim()) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      address.address.toLowerCase().includes(searchLower) ||
      (address.notes && address.notes.toLowerCase().includes(searchLower))
    )
  })

  // Sort addresses
  const sortedAddresses = [...filteredAddresses].sort((a, b) => {
    if (!sortField) return 0
    
    const multiplier = sortDirection === 'asc' ? 1 : -1
    
    switch (sortField) {
      case 'address':
        return a.address.localeCompare(b.address) * multiplier
      case 'time_spent':
        const aTime = a.time_spent || 0
        const bTime = b.time_spent || 0
        return (aTime - bTime) * multiplier
      case 'appointment_time':
        const aDate = a.appointment_time ? new Date(a.appointment_time).getTime() : 0
        const bDate = b.appointment_time ? new Date(b.appointment_time).getTime() : 0
        return (aDate - bDate) * multiplier
      case 'appointment_window':
        const aWindow = a.appointment_window || 0
        const bWindow = b.appointment_window || 0
        return (aWindow - bWindow) * multiplier
      default:
        return 0
    }
  })

  return (
    <div>
      {addresses.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <div className="rounded-full bg-gray-100 w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <MapPin className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No addresses added yet.</p>
          <p className="text-sm text-gray-500 mt-1">Add addresses to generate a route.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col space-y-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search addresses..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {filteredAddresses.length} of {addresses.length} address{addresses.length !== 1 ? 'es' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
              {onDeleteAllAddresses && (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600">Are you sure?</span>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => {
                        onDeleteAllAddresses();
                        setShowDeleteConfirm(false);
                      }}
                    >
                      Yes, delete all
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete All
                  </Button>
                )
              )}
            </div>

            {/* Sort controls */}
            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={sortField === 'address' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => handleSort('address')}
                      className="text-xs"
                    >
                      Address {sortField === 'address' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sort by address name</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={sortField === 'time_spent' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => handleSort('time_spent')}
                      className="text-xs"
                    >
                      Time Spent {sortField === 'time_spent' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sort by time spent at location</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={sortField === 'appointment_time' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => handleSort('appointment_time')}
                      className="text-xs"
                    >
                      Arrival Time {sortField === 'appointment_time' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sort by arrival time</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={sortField === 'appointment_window' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => handleSort('appointment_window')}
                      className="text-xs"
                    >
                      Window {sortField === 'appointment_window' && (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sort by appointment window</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
            {sortedAddresses.map((address) => (
              <li key={address.id} className="py-3 group hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between px-3">
                  <div className="flex">
                    <div className="mr-3 mt-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <MapPin className="h-3 w-3 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center mb-1">
                        <p className="text-sm font-medium text-gray-900">{address.address}</p>
                        
                        {address.appointment_time && (
                          <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-200">
                            {new Date(address.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </Badge>
                        )}
                      </div>

                      {address.notes && (
                        <div className="flex items-center mt-1">
                          <Info className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                          <p className="text-xs text-gray-500">{address.notes}</p>
                        </div>
                      )}
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-400 font-mono">
                          {address.lat.toFixed(4)}, {address.lng.toFixed(4)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-gray-400 mr-1" />
                          <Popover open={openPopoverId === address.id && openPopoverType === 'time_spent'} onOpenChange={(open) => {
                            if (open) {
                              setOpenPopoverId(address.id)
                              setOpenPopoverType('time_spent')
                            } else if (openPopoverType === 'time_spent') {
                              setOpenPopoverId(null)
                              setOpenPopoverType(null)
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <Button variant="link" className="h-auto p-0 text-xs text-gray-500 hover:text-emerald-600">
                                {address.time_spent ? `${address.time_spent} minutes` : "Set time spent"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-3">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Time spent at address</h4>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="15"
                                    value={timeSpent[address.id] || address.time_spent?.toString() || ''}
                                    onChange={(e) => handleTimeChange(address.id, e.target.value)}
                                    className="w-20"
                                  />
                                  <span className="text-sm text-gray-500">minutes</span>
                                </div>
                                <div className="flex justify-end">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleTimeConfirm(address.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    Confirm
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                          <Popover open={openPopoverId === address.id && openPopoverType === 'appointment_time'} onOpenChange={(open) => {
                            if (open) {
                              setOpenPopoverId(address.id)
                              setOpenPopoverType('appointment_time')
                            } else if (openPopoverType === 'appointment_time') {
                              setOpenPopoverId(null)
                              setOpenPopoverType(null)
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <Button variant="link" className="h-auto p-0 text-xs text-gray-500 hover:text-emerald-600">
                                {address.appointment_time ? 
                                  `Arrival: ${new Date(address.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 
                                  "Set driver arrival time"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-3">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Driver arrival time</h4>
                                <p className="text-xs text-gray-500">Set when the driver needs to arrive at this location</p>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="time"
                                    value={appointmentTime[address.id] || 
                                      (address.appointment_time ? 
                                        new Date(address.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : 
                                        '')}
                                    onChange={(e) => handleAppointmentTimeChange(address.id, e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div className="flex justify-end">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleAppointmentTimeConfirm(address.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    Confirm
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="flex items-center">
                          <TimerIcon className="h-3 w-3 text-gray-400 mr-1" />
                          <Popover open={openPopoverId === address.id && openPopoverType === 'appointment_window'} onOpenChange={(open) => {
                            if (open) {
                              setOpenPopoverId(address.id)
                              setOpenPopoverType('appointment_window')
                            } else if (openPopoverType === 'appointment_window') {
                              setOpenPopoverId(null)
                              setOpenPopoverType(null)
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <Button variant="link" className="h-auto p-0 text-xs text-gray-500 hover:text-emerald-600">
                                {address.appointment_window ? `${address.appointment_window} minutes window` : "Set appointment window"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-3">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Appointment window</h4>
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="60"
                                    value={appointmentWindow[address.id] || address.appointment_window?.toString() || ''}
                                    onChange={(e) => handleAppointmentWindowChange(address.id, e.target.value)}
                                    className="w-20"
                                  />
                                  <span className="text-sm text-gray-500">minutes</span>
                                </div>
                                <div className="flex justify-end">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleAppointmentWindowConfirm(address.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    Confirm
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onDeleteAddress(address.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete this address</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      
      <div className="mt-4 flex justify-between items-center text-sm border-t border-gray-100 pt-3">
        <span className="text-gray-500 font-medium">{addresses.length} addresses</span>
        {addresses.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-gray-600 hover:text-red-600 hover:border-red-200 transition-colors"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all addresses?')) {
                // Clear all addresses by calling onDeleteAddress for each address
                addresses.forEach(addr => onDeleteAddress(addr.id))
              }
            }}
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  )
}
