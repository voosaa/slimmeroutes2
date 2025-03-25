"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createCheckoutSession } from '@/lib/stripe'
import { useToast } from '@/components/ui/use-toast'
import { updateRoutePaidStatus } from '@/lib/supabase'

type PaymentButtonProps = {
  routeId: string
  amount?: number
  onSuccess?: () => void
  onPaymentSuccess?: () => void
  className?: string
}

export function PaymentButton({ 
  routeId, 
  amount = 1000,
  onSuccess,
  onPaymentSuccess, 
  className = '' 
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handlePayment = async () => {
    try {
      setIsLoading(true)
      
      // For demo purposes, we'll simulate a successful payment
      // In a real app, this would redirect to Stripe Checkout
      const { success, url, error } = await createCheckoutSession(routeId)
      
      if (!success) {
        throw new Error(error || 'Failed to create checkout session')
      }
      
      // In a real app, this would redirect to Stripe Checkout
      // window.location.href = url
      
      // For demo purposes, we'll simulate a successful payment
      toast({
        title: 'Payment successful',
        description: `Thank you for your purchase of $${(amount / 100).toFixed(2)}! Your schedule is now available.`
      })
      
      // Update the route paid status in the database
      const { data, error: updateError } = await updateRoutePaidStatus(routeId, true)
      
      if (updateError) {
        console.error('Error updating route paid status:', updateError)
      }
      
      // Call the onPaymentSuccess callback if provided
      if (onPaymentSuccess) {
        onPaymentSuccess()
      }
      
      // Call the onSuccess callback if provided (alternative name)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: 'Payment failed',
        description: error instanceof Error ? error.message : 'An error occurred during payment processing',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={className}>
      <Button 
        onClick={handlePayment} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)} to Access Schedule`}
      </Button>
      <p className="text-xs text-neutral-500 mt-2 text-center">
        Secure payment processing by Stripe
      </p>
    </div>
  )
}
