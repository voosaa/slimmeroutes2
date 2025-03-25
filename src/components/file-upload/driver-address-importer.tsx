"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUp, Upload, FileText, AlertCircle, Check } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useRoute } from '@/contexts/route-context'
import { Address, supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { geocodeAddress } from '@/lib/geocoding'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface ImportedAddress {
  address: string;
  notes?: string;
  lat?: number;
  lng?: number;
}

interface DriverAddressImporterProps {
  onImportComplete?: (addresses: Address[]) => void;
}

export function DriverAddressImporter({ onImportComplete }: DriverAddressImporterProps = {}) {
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [importedAddresses, setImportedAddresses] = useState<ImportedAddress[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const { loadAddresses } = useRoute()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setUploadedFile(file)
    setIsUploading(true)
    setImportedAddresses([])
    setImportErrors([])

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      if (fileExtension === 'csv') {
        parseCSV(file)
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        parseExcel(file)
      } else {
        toast({
          title: 'Unsupported file format',
          description: 'Please upload a CSV or Excel file',
          variant: 'destructive',
        })
        setUploadedFile(null)
      }
    } catch (error) {
      console.error('Error processing file:', error)
      toast({
        title: 'Error processing file',
        description: 'There was an error processing your file. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processImportedData(results.data as Record<string, string>[])
      },
      error: (error) => {
        console.error('Error parsing CSV:', error)
        setImportErrors([`Error parsing CSV: ${error.message}`])
      }
    })
  }

  const parseExcel = async (file: File) => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet)
      processImportedData(jsonData)
    } catch (error) {
      console.error('Error parsing Excel:', error)
      setImportErrors([`Error parsing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`])
    }
  }

  const processImportedData = (data: Record<string, string>[]) => {
    if (!data || data.length === 0) {
      setImportErrors(['No data found in the file'])
      return
    }

    const processedAddresses: ImportedAddress[] = []
    const errors: string[] = []

    // Try to identify address and notes columns
    const headers = Object.keys(data[0])
    let addressColumn = findAddressColumn(headers)
    let notesColumn = findNotesColumn(headers)

    if (!addressColumn && headers.length > 0) {
      // If no address column found, use the first column
      addressColumn = headers[0]
    }

    data.forEach((row, index) => {
      if (!addressColumn || !row[addressColumn]) {
        errors.push(`Row ${index + 1}: No address found`)
        return
      }

      const address = row[addressColumn].trim()
      const notes = notesColumn && row[notesColumn] ? row[notesColumn].trim() : undefined

      if (address) {
        processedAddresses.push({
          address,
          notes
        })
      } else {
        errors.push(`Row ${index + 1}: Empty address`)
      }
    })

    setImportedAddresses(processedAddresses)
    setImportErrors(errors)
  }

  const findAddressColumn = (headers: string[]): string | undefined => {
    const addressKeywords = ['address', 'location', 'street', 'place', 'adres', 'locatie', 'straat']
    return headers.find(header => 
      addressKeywords.some(keyword => 
        header.toLowerCase().includes(keyword.toLowerCase())
      )
    )
  }

  const findNotesColumn = (headers: string[]): string | undefined => {
    const notesKeywords = ['note', 'notes', 'description', 'comment', 'comments', 'notitie', 'beschrijving', 'opmerking']
    return headers.find(header => 
      notesKeywords.some(keyword => 
        header.toLowerCase().includes(keyword.toLowerCase())
      )
    )
  }

  interface BatchProcessResult {
    success: boolean;
    error?: string;
    address?: Address;
  }

  const handleImport = async () => {
    if (!user || importedAddresses.length === 0) return

    setIsProcessing(true)
    const errors: string[] = []
    const successfulImports: Address[] = []

    try {
      // Process addresses in batches to avoid overwhelming the geocoding service
      const batchSize = 10
      for (let i = 0; i < importedAddresses.length; i += batchSize) {
        const batch = importedAddresses.slice(i, i + batchSize)
        
        // Process each address in the batch
        const batchPromises = batch.map(async (importedAddress) => {
          try {
            if (!importedAddress.address || importedAddress.address.trim() === '') {
              return { 
                success: false, 
                error: `Empty address found in import` 
              } as BatchProcessResult;
            }
            
            const geocodeResult = await geocodeAddress(importedAddress.address)
            
            if (!geocodeResult) {
              return { 
                success: false, 
                error: `Could not geocode address: ${importedAddress.address}` 
              } as BatchProcessResult;
            }
            
            // Insert the address into the database
            const { data, error } = await supabase
              .from('addresses')
              .insert({
                user_id: user.id,
                address: importedAddress.address,
                notes: importedAddress.notes || '',
                lat: geocodeResult.lat,
                lng: geocodeResult.lng,
              })
              .select()
            
            if (error) {
              console.error("Database error:", error);
              return { 
                success: false, 
                error: `Database error for address ${importedAddress.address}: ${error.message}` 
              } as BatchProcessResult;
            }
            
            if (!data || data.length === 0) {
              return { 
                success: false, 
                error: `No data returned for address ${importedAddress.address}` 
              } as BatchProcessResult;
            }
            
            return { 
              success: true, 
              address: data[0] 
            } as BatchProcessResult;
          } catch (error) {
            console.error("Error processing address:", error);
            return { 
              success: false, 
              error: `Error processing address ${importedAddress.address}: ${error instanceof Error ? error.message : 'Unknown error'}` 
            } as BatchProcessResult;
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        
        batchResults.forEach((result: BatchProcessResult) => {
          if (!result.success) {
            // Ensure we always push a string to the errors array
            errors.push(result.error || 'Unknown error occurred');
          } else if (result.address) {
            successfulImports.push(result.address);
          }
        })
      }
      
      if (successfulImports.length > 0) {
        // Reload addresses in the route context
        await loadAddresses?.()
        
        // Call onImportComplete callback if provided
        if (onImportComplete) {
          onImportComplete(successfulImports)
        }
        
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${successfulImports.length} addresses${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
          variant: 'default',
        })
        
        // Reset the form
        setUploadedFile(null)
        setImportedAddresses([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toast({
          title: 'Import Failed',
          description: 'No addresses were imported. Please check the errors and try again.',
          variant: 'destructive',
        })
      }
      
      setImportErrors(errors)
    } catch (error) {
      console.error('Error importing addresses:', error)
      toast({
        title: 'Import Error',
        description: `An error occurred while importing addresses: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setImportedAddresses([])
    setImportErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Import Addresses
        </CardTitle>
        <CardDescription>
          Import addresses from a CSV or Excel file to add to your route
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!uploadedFile ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-4">Drag and drop a file, or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Select File'}
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Supported formats: CSV, Excel (.xlsx, .xls)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.size / 1024).toFixed(1)} KB • {importedAddresses.length} addresses found
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetUpload}>
                Change
              </Button>
            </div>
            
            {importedAddresses.length > 0 && (
              <div className="border rounded-md">
                <div className="p-3 border-b bg-muted">
                  <h3 className="font-medium text-sm">Preview ({Math.min(5, importedAddresses.length)} of {importedAddresses.length})</h3>
                </div>
                <div className="p-3">
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {importedAddresses.slice(0, 5).map((addr, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 rounded-md">
                        <p className="font-medium">{addr.address}</p>
                        {addr.notes && <p className="text-xs text-gray-500">{addr.notes}</p>}
                      </div>
                    ))}
                    {importedAddresses.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        ...and {importedAddresses.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {importErrors.length > 0 && (
              <div className="border border-red-200 rounded-md">
                <div className="p-3 border-b bg-red-50 flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                  <h3 className="font-medium text-sm text-red-600">
                    {importErrors.length} Error{importErrors.length !== 1 ? 's' : ''}
                  </h3>
                </div>
                <div className="p-3">
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importErrors.slice(0, 5).map((error, index) => (
                      <p key={index} className="text-xs text-red-600">
                        • {error}
                      </p>
                    ))}
                    {importErrors.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        ...and {importErrors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetUpload} disabled={isProcessing}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isProcessing || importedAddresses.length === 0}
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Import {importedAddresses.length} Address{importedAddresses.length !== 1 ? 'es' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
