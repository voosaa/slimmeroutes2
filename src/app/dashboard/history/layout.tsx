import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Route History - SlimmeRoutes',
  description: 'View your past routes and schedules',
}

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
