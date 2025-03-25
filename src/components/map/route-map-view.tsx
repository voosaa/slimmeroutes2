"use client"

import React from 'react'
import { Address } from '@/lib/supabase'

type RouteMapViewProps = {
  addresses: Address[]
  optimizedOrder?: string[]
  className?: string
}

export function RouteMapView({ addresses, optimizedOrder, className = '' }: RouteMapViewProps) {
  return (
    <div className={`bg-neutral-100 rounded-lg p-4 flex flex-col items-center justify-center min-h-[400px] ${className}`}>
      <div className="text-center">
        <p className="text-neutral-500 mb-2">Map visualization is temporarily disabled.</p>
        <p className="text-sm text-neutral-400">
          We're working on fixing this feature.
        </p>
        
        {addresses.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Your Addresses:</h3>
            <ul className="text-left text-sm space-y-2 max-w-md mx-auto">
              {addresses.map((address, index) => {
                const orderIndex = optimizedOrder 
                  ? optimizedOrder.findIndex(id => id === address.id)
                  : -1
                
                return (
                  <li key={address.id} className="border-b pb-2 border-neutral-200">
                    {optimizedOrder && orderIndex > -1 ? (
                      <span className="inline-block bg-primary-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center mr-2">
                        {orderIndex + 1}
                      </span>
                    ) : null}
                    <span>{address.address}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
