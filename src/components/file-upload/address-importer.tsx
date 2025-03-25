"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { geocodeAddress } from '@/lib/geocode'
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { UploadCloud, CheckCircle2, XCircle, AlertTriangle, Clock, Calendar, TimerIcon } from 'lucide-react'
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Progress
} from "@/components/ui/progress"
import {
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface AddressData {
  address: string
  notes?: string
  time_spent?: number
  appointment_time?: string
  appointment_window?: number
  lat?: number
  lng?: number
  status?: 'pending' | 'success' | 'error'
  error?: string
}

interface AddressImporterProps {
  onImportComplete?: (addresses: any[]) => void
}

export function AddressImporter({ onImportComplete }: AddressImporterProps) {
  const [file, setFile] = useState<File | null>(null)
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [importComplete, setImportComplete] = useState(false)
  const [isReadingFile, setIsReadingFile] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      readFile(selectedFile)
    }
  }

  const readFile = async (file: File) => {
    setIsReadingFile(true)
    setAddresses([])
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const lines = content.split('\n')
        
        // Extract headers from first line
        const headers = lines[0].split(',').map(h => h.trim())
        
        // Process remaining lines
        const extractedAddresses = lines.slice(1)
          .map(line => {
            if (!line.trim()) return null // Skip empty lines
            
            const values = line.split(',').map(v => v.trim())
            const row: Record<string, string> = {}
            
            // Map values to headers
            headers.forEach((header, index) => {
              row[header] = values[index] || ''
            })
            
            // Try to find address with various possible column names
            const addressField = 
              row.address || row.Address || row.ADDRESS || 
              row.location || row.Location || row.LOCATION ||
              row.street || row.Street || row.STREET;
              
            // If no valid address found, skip this line
            if (!addressField || addressField.trim() === '') return null;
            
            // Try to find notes with various possible column names
            const notesField = 
              row.notes || row.Notes || row.NOTES || 
              row.description || row.Description || row.DESCRIPTION ||
              row.remarks || row.Remarks || row.REMARKS;
              
            // Try to find time spent field with various possible names
            const timeSpentField = 
              row.time_spent || row.timeSpent || row.TimeSpent || 
              row.duration || row.Duration || row.DURATION ||
              row.visit_duration || row.visitDuration || row.VisitDuration;
              
            // Try to find driver arrival time field with various possible names
            const appointmentTimeField = 
              row.appointment_time || row.appointmentTime || row.AppointmentTime || 
              row.arrival_time || row.arrivalTime || row.ArrivalTime ||
              row.driver_arrival || row.driverArrival || row.DriverArrival ||
              row.appointment || row.Appointment || row.APPOINTMENT ||
              row.time || row.Time || row.TIME ||
              row.schedule || row.Schedule || row.SCHEDULE;
              
            // Try to find appointment window field with various possible names
            const appointmentWindowField = 
              row.appointment_window || row.appointmentWindow || row.AppointmentWindow || 
              row.window || row.Window || row.WINDOW ||
              row.timespan || row.Timespan || row.TIMESPAN ||
              row.flexibility || row.Flexibility || row.FLEXIBILITY;
    
            // Format appointment time if present
            let formattedAppointmentTime = null;
            if (appointmentTimeField) {
              // If it's just a time string like "09:00", add today's date
              if (appointmentTimeField.includes(':') && appointmentTimeField.length <= 5) {
                const today = new Date();
                const [hours, minutes] = appointmentTimeField.split(':');
                today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                formattedAppointmentTime = today.toISOString();
              } else {
                // Try to parse as a full datetime
                try {
                  formattedAppointmentTime = new Date(appointmentTimeField).toISOString();
                } catch (e) {
                  // If parsing fails, leave as is
                  formattedAppointmentTime = appointmentTimeField;
                }
              }
            }
    
            return {
              address: addressField,
              notes: notesField,
              time_spent: timeSpentField ? parseInt(timeSpentField) : undefined,
              appointment_time: formattedAppointmentTime,
              appointment_window: appointmentWindowField ? parseInt(appointmentWindowField) : 60,
              status: 'pending'
            } as AddressData;
          })
          .filter((a): a is AddressData => a !== null);
  
        setAddresses(extractedAddresses);
        
        if (extractedAddresses.length === 0) {
          toast({
            title: "No valid addresses found",
            description: "Make sure your CSV file contains at least one column with address data.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "File processed successfully",
            description: `Found ${extractedAddresses.length} addresses to import.`,
          });
        }
      } catch (error) {
        console.error("Error reading CSV file:", error);
        toast({
          title: "Error reading file",
          description: "Make sure your file is a valid CSV format.",
          variant: "destructive"
        });
      } finally {
        setIsReadingFile(false);
      }
    }
    
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Could not read the selected file.",
        variant: "destructive"
      });
      setIsReadingFile(false);
    }
    
    reader.readAsText(file)
  }

  const processAddresses = async () => {
    if (addresses.length === 0) return;
    
    setIsProcessing(true);
    setProcessedCount(0);
    setImportComplete(false);
    
    const updatedAddresses = [...addresses];
    const successfulAddresses = [];
    
    for (let i = 0; i < updatedAddresses.length; i++) {
      try {
        console.log(`Processing address ${i+1}/${updatedAddresses.length}: ${updatedAddresses[i].address}`);
        
        // Geocode the address
        const geocodeResult = await geocodeAddress(updatedAddresses[i].address);
        
        if (!geocodeResult || !geocodeResult.lat || !geocodeResult.lng) {
          throw new Error('Could not geocode address');
        }
        
        // Add to database
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error("User not authenticated");
        }
        
        // Prepare address data with only the essential fields
        // Use Record<string, any> type to allow dynamic property assignment
        const addressToInsert: Record<string, any> = {
          user_id: userData.user.id,
          address: updatedAddresses[i].address,
          lat: geocodeResult.lat,
          lng: geocodeResult.lng,
          notes: updatedAddresses[i].notes || null
        };
        
        // Add time fields only if they exist - avoid mentioning fields with schema issues
        if (updatedAddresses[i].time_spent !== undefined) {
          addressToInsert['time_spent'] = updatedAddresses[i].time_spent;
        }
        
        if (updatedAddresses[i].appointment_time) {
          addressToInsert['appointment_time'] = updatedAddresses[i].appointment_time;
        }
        
        if (updatedAddresses[i].appointment_window !== undefined) {
          addressToInsert['appointment_window'] = updatedAddresses[i].appointment_window;
        }
        
        console.log('Inserting address into database:', addressToInsert);
        
        // Insert into database
        const { error } = await supabase
          .from('addresses')
          .insert(addressToInsert);
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        // Update status
        updatedAddresses[i].status = 'success';
        updatedAddresses[i].lat = geocodeResult.lat;
        updatedAddresses[i].lng = geocodeResult.lng;
        
        // Add to successful addresses
        successfulAddresses.push(addressToInsert);
      } catch (error: any) {
        console.error(`Error processing address ${updatedAddresses[i].address}:`, error);
        // Update status
        updatedAddresses[i].status = 'error';
        updatedAddresses[i].error = error.message || 'Unknown error';
      }
      
      // Update processed count
      setProcessedCount(i + 1);
      // Update addresses state to show progress
      setAddresses([...updatedAddresses]);
    }
    
    setIsProcessing(false);
    setImportComplete(true);
    
    // Call onImportComplete callback
    if (onImportComplete && successfulAddresses.length > 0) {
      onImportComplete(successfulAddresses);
    }
    
    const successCount = updatedAddresses.filter(a => a.status === 'success').length;
    const errorCount = updatedAddresses.filter(a => a.status === 'error').length;
    
    toast({
      title: successCount > 0 ? "Import completed" : "Import failed",
      description: `${successCount} of ${updatedAddresses.length} addresses were successfully imported.`,
      variant: successCount > 0 ? "default" : "destructive"
    });
  }

  const resetImport = () => {
    setFile(null);
    setAddresses([]);
    setIsProcessing(false);
    setProcessedCount(0);
    setImportComplete(false);
  }

  const getDisplayAddress = (address: string) => {
    if (address.length > 50) {
      return address.substring(0, 47) + '...';
    }
    return address;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-6">
            <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
            
            <div className="space-y-2 text-center">
              <h3 className="font-medium">Upload your CSV file</h3>
              <p className="text-sm text-muted-foreground">
                Upload a CSV file with your addresses to import them in bulk
              </p>
            </div>
            
            <label className="mt-4 cursor-pointer">
              <div
                className={`px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors ${isReadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isReadingFile ? 'Reading file...' : file ? 'Choose another file' : 'Choose file'}
              </div>
              <Input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange}
                disabled={isReadingFile}
              />
            </label>
            
            {file && (
              <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                {file.name}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {addresses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Addresses to Import</h2>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                onClick={resetImport}
                disabled={isProcessing}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear
              </Button>
              <Button
                onClick={processAddresses}
                disabled={isProcessing || addresses.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isProcessing ? 'Importing...' : 'Import Addresses'}
              </Button>
            </div>
          </div>
          
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing {processedCount} of {addresses.length} addresses...</span>
                <span>{Math.round((processedCount / addresses.length) * 100)}%</span>
              </div>
              <Progress value={(processedCount / addresses.length) * 100} className="h-2" />
            </div>
          )}
          
          {importComplete && (
            <Alert className={addresses.filter(a => a.status === 'success').length > 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}>
              {addresses.filter(a => a.status === 'success').length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle className={addresses.filter(a => a.status === 'success').length > 0 ? "text-emerald-700" : "text-red-700"}>
                Import {addresses.filter(a => a.status === 'success').length > 0 ? "Completed" : "Failed"}
              </AlertTitle>
              <AlertDescription className={addresses.filter(a => a.status === 'success').length > 0 ? "text-emerald-600" : "text-red-600"}>
                {addresses.filter(a => a.status === 'success').length} of {addresses.length} addresses were successfully imported.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="border rounded-md max-h-96 overflow-auto">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0">
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Time Spent</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Arrival Time</span>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <TimerIcon className="h-3 w-3" />
                      <span>Window</span>
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.map((address, index) => (
                  <TableRow key={index} className={address.status === 'error' ? 'bg-red-50' : (address.status === 'success' ? 'bg-emerald-50' : '')}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={address.address}>
                      {getDisplayAddress(address.address)}
                    </TableCell>
                    <TableCell>{address.notes || '-'}</TableCell>
                    <TableCell>
                      {address.time_spent ? (
                        <Badge variant="outline" className="bg-gray-100">
                          <Clock className="h-3 w-3 mr-1" />
                          {address.time_spent} min
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {address.appointment_time ? 
                        <Badge className="bg-blue-100 text-blue-700">
                          {new Date(address.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Badge> : 
                        '-'}
                    </TableCell>
                    <TableCell>
                      {address.appointment_window ? (
                        <Badge variant="outline" className="bg-gray-100">
                          {address.appointment_window} min
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {address.status === 'pending' && (
                        <Badge variant="outline">Pending</Badge>
                      )}
                      {address.status === 'success' && (
                        <div className="flex items-center text-emerald-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Success
                        </div>
                      )}
                      {address.status === 'error' && (
                        <div className="flex flex-col">
                          <div className="flex items-center text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            Error
                          </div>
                          {address.error && (
                            <span className="text-xs text-red-500 mt-1" title={address.error}>
                              {address.error.length > 30 ? address.error.substring(0, 27) + '...' : address.error}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
