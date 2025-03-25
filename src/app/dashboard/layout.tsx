import { Metadata } from 'next'
import { Sidebar } from '@/components/dashboard/sidebar'

export const metadata: Metadata = {
  title: 'Dashboard - SlimmeRoutes',
  description: 'Plan and optimize your routes with SlimmeRoutes',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <div className="pt-20 lg:pt-6 px-4 lg:px-8 pb-8 min-h-screen">
          {children}
        </div>
      </div>
    </div>
  )
}
