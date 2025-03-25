"use client"

import { GoogleCalendarTester } from '@/components/dashboard/google-calendar-tester'

export default function CalendarTestPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Google Calendar Integration Test</h1>
      <p className="mb-6 text-gray-600">
        This page helps diagnose issues with Google Calendar integration. Use the tools below to test your API credentials and connection.
      </p>
      <GoogleCalendarTester />
    </div>
  )
}
