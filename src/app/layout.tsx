import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/auth-context'
import { RouteProvider } from '@/contexts/route-context'
import { DriverProvider } from '@/contexts/driver-context'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SlimmeRoutes - Smart Route Planner for Businesses',
  description: 'Optimize your customer visits with our intelligent route planning tool',
  applicationName: 'SlimmeRoutes',
  authors: [{ name: 'SlimmeRoutes Team' }],
  keywords: ['route planning', 'business routes', 'delivery optimization', 'field service'],
  icons: {
    icon: '/favicon.ico',
    apple: '/images/logo/slimmeroutes-icon.png',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#10b981' // Emerald color for theme
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get Google Maps API key from environment variables
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  return (
    <html lang="en" className="h-full">
      <head>
        {/* Load Google Maps API with places library */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`}
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <AuthProvider>
          <DriverProvider>
            <RouteProvider>
              {children}
              <Toaster />
            </RouteProvider>
          </DriverProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
