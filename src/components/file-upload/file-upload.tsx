"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface FileUploadProps {
  onDataImported: (data: any[]) => void
  acceptedFileTypes?: string
  maxFileSize?: number // in MB
  title?: string
  description?: string
}

export function FileUpload({
  onDataImported,
  acceptedFileTypes = ".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel",
  maxFileSize = 5, // 5MB default
  title = "Upload File",
  description = "Upload a CSV or Excel file to import data"
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxFileSize}MB`,
        variant: "destructive"
      })
      return
    }

    setFileName(file.name)
    setIsUploading(true)

    try {
      let data: any[] = []
      
      // Process based on file type
      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const text = await file.text()
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true
        })
        
        if (result.errors && result.errors.length > 0) {
          throw new Error(`CSV parsing error: ${result.errors[0].message}`)
        }
        
        data = result.data
      } else {
        // Parse Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        data = XLSX.utils.sheet_to_json(worksheet)
      }
      
      // Validate data has required fields
      if (data.length === 0) {
        throw new Error("No data found in file")
      }

      // Success
      toast({
        title: "File uploaded successfully",
        description: `Imported ${data.length} records`,
        variant: "default"
      })
      
      onDataImported(data)
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="file">File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept={acceptedFileTypes}
                onChange={handleFileChange}
                disabled={isUploading}
                className="flex-1"
              />
            </div>
          </div>
          {fileName && (
            <div className="text-sm text-muted-foreground">
              Selected file: {fileName}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => document.getElementById('file')?.click()} disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Select File
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
