"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function SupabaseSetupGuide() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-sm border border-neutral-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Supabase Configuration Required</h1>
          <p className="text-neutral-500 mt-1">
            Your Supabase environment variables are missing or invalid
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <h2 className="text-amber-800 font-medium text-lg mb-2">Error Details</h2>
            <p className="text-amber-700">
              The application cannot connect to Supabase because the required environment variables
              are either missing or contain invalid values.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-medium text-lg">Follow these steps to fix the issue:</h2>
            
            <div className="space-y-2">
              <h3 className="font-medium">1. Create or update your .env.local file</h3>
              <p className="text-neutral-600">
                In the root directory of your project, create or edit the <code className="bg-neutral-100 px-1 py-0.5 rounded">.env.local</code> file
                and add the following variables:
              </p>
              <pre className="bg-neutral-100 p-3 rounded-md text-sm overflow-x-auto">
                <code>
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key`}
                </code>
              </pre>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">2. Get your Supabase credentials</h3>
              <p className="text-neutral-600">
                Go to the <a href="https://app.supabase.io/" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Supabase Dashboard</a>,
                select your project (or create a new one), and go to Project Settings &gt; API.
              </p>
              <p className="text-neutral-600">
                Copy the "URL" value and use it for <code className="bg-neutral-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code>.
                Copy the "anon/public" key and use it for <code className="bg-neutral-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">3. Restart your development server</h3>
              <p className="text-neutral-600">
                After updating the <code className="bg-neutral-100 px-1 py-0.5 rounded">.env.local</code> file, restart your development server:
              </p>
              <pre className="bg-neutral-100 p-3 rounded-md text-sm overflow-x-auto">
                <code>npm run dev</code>
              </pre>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h2 className="text-blue-800 font-medium text-lg mb-2">Important Notes</h2>
            <ul className="list-disc pl-5 space-y-1 text-blue-700">
              <li>Make sure there are no spaces before or after the equal sign</li>
              <li>Do not use quotes around the values</li>
              <li>The URL must start with <code className="bg-blue-100 px-1 py-0.5 rounded">https://</code> and end with <code className="bg-blue-100 px-1 py-0.5 rounded">.supabase.co</code></li>
              <li>The <code className="bg-blue-100 px-1 py-0.5 rounded">.env.local</code> file should never be committed to your repository</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button asChild>
            <Link href="/">
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
