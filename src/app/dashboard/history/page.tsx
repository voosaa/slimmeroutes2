"use client"

import { useState, useEffect } from 'react'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { getRoutes, Route } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function HistoryPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchRoutes() {
      try {
        setLoading(true)
        const { data, error } = await getRoutes()
        
        if (error) {
          console.error('Error fetching routes:', error)
          setError('Failed to load your route history. Please try again.')
          toast({
            title: 'Error',
            description: 'Failed to load your route history',
            variant: 'destructive'
          })
          return
        }
        
        if (data) {
          setRoutes(data)
        }
      } catch (err) {
        console.error('Error in route fetch:', err)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchRoutes()
  }, [toast])

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd')
    } catch (err) {
      return dateString
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Route History</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-gray-600">Loading your route history...</span>
          </div>
        ) : routes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-medium text-gray-700 mb-2">No routes found</h2>
            <p className="text-gray-500 mb-6">You haven't created any routes yet.</p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <a href="/dashboard">Create Your First Route</a>
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-neutral-500 uppercase tracking-wider">Addresses</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-neutral-500 uppercase tracking-wider">Distance</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {routes.map((route) => (
                    <tr key={route.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        {formatDate(route.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {route.name || `Route ${formatDate(route.created_at)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {Array.isArray(route.addresses) ? route.addresses.length : 0} addresses
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {route.total_distance?.toFixed(1) || 0} km
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          route.is_paid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {route.is_paid ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="outline" size="sm" className="mr-2" asChild>
                          <a href={`/dashboard/routes/${route.id}`}>View</a>
                        </Button>
                        <Button variant="outline" size="sm" className="text-neutral-500">Print</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-neutral-100 py-4">
        <div className="container mx-auto px-4 text-center text-neutral-500">
          <p>&copy; {new Date().getFullYear()} SlimmeRoutes. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-4 text-sm">
            <Link href="/privacy-policy" className="text-neutral-600 hover:text-neutral-900">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-neutral-600 hover:text-neutral-900">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
