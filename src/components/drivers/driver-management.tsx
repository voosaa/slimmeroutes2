"use client"

import { useState } from 'react'
import { useDriver } from '@/contexts/driver-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, Edit, Trash2, UserCheck, UserX } from 'lucide-react'
import { Driver } from '@/lib/supabase'

export function DriverManagement() {
  const { 
    drivers, 
    isLoading, 
    addNewDriver, 
    updateDriverInfo, 
    removeDriver,
    selectedDriverIds,
    toggleDriverSelection
  } = useDriver()
  
  const [isAddingDriver, setIsAddingDriver] = useState(false)
  const [isEditingDriver, setIsEditingDriver] = useState<string | null>(null)
  const [driverName, setDriverName] = useState('')
  const [driverEmail, setDriverEmail] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [driverActive, setDriverActive] = useState(true)

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!driverName.trim()) return
    
    await addNewDriver(driverName, driverEmail || undefined, driverPhone || undefined)
    
    // Reset form
    setDriverName('')
    setDriverEmail('')
    setDriverPhone('')
    setIsAddingDriver(false)
  }

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isEditingDriver || !driverName.trim()) return
    
    await updateDriverInfo(
      isEditingDriver,
      driverName,
      driverEmail || undefined,
      driverPhone || undefined,
      driverActive
    )
    
    // Reset form
    setDriverName('')
    setDriverEmail('')
    setDriverPhone('')
    setDriverActive(true)
    setIsEditingDriver(null)
  }

  const startEditingDriver = (driver: Driver) => {
    setIsEditingDriver(driver.id)
    setDriverName(driver.name)
    setDriverEmail(driver.email || '')
    setDriverPhone(driver.phone || '')
    setDriverActive(driver.is_active)
  }

  const cancelEdit = () => {
    setIsEditingDriver(null)
    setDriverName('')
    setDriverEmail('')
    setDriverPhone('')
    setDriverActive(true)
  }

  const cancelAdd = () => {
    setIsAddingDriver(false)
    setDriverName('')
    setDriverEmail('')
    setDriverPhone('')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Drivers</h2>
        {!isAddingDriver && (
          <Button onClick={() => setIsAddingDriver(true)} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Driver
          </Button>
        )}
      </div>

      {isAddingDriver && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Driver</CardTitle>
            <CardDescription>Enter the details for the new driver</CardDescription>
          </CardHeader>
          <form onSubmit={handleAddDriver}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={driverEmail}
                  onChange={(e) => setDriverEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={cancelAdd}>
                Cancel
              </Button>
              <Button type="submit">Add Driver</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {isEditingDriver && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Driver</CardTitle>
            <CardDescription>Update the driver's information</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateDriver}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={driverEmail}
                  onChange={(e) => setDriverEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={driverActive}
                  onCheckedChange={setDriverActive}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button type="submit">Update Driver</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-4">Loading drivers...</div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          No drivers added yet. Add your first driver to get started.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver) => (
            <Card key={driver.id} className={!driver.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{driver.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditingDriver(driver)}
                      title="Edit driver"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDriver(driver.id)}
                      title="Remove driver"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {driver.is_active ? (
                    <span className="flex items-center text-green-600">
                      <UserCheck className="h-3 w-3 mr-1" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center text-neutral-500">
                      <UserX className="h-3 w-3 mr-1" /> Inactive
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2 text-sm">
                {driver.email && (
                  <div className="mb-1">
                    <span className="font-medium">Email:</span> {driver.email}
                  </div>
                )}
                {driver.phone && (
                  <div>
                    <span className="font-medium">Phone:</span> {driver.phone}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant={selectedDriverIds.includes(driver.id) ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => toggleDriverSelection(driver.id)}
                  disabled={!driver.is_active}
                >
                  {selectedDriverIds.includes(driver.id) ? "Selected" : "Select for Route"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
