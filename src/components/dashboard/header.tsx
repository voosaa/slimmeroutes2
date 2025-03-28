import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HelpCircle, LogOut } from 'lucide-react'

export function DashboardHeader() {
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-emerald-600 flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-6 h-6 mr-2"
          >
            <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h8.25c1.035 0 1.875-.84 1.875-1.875V15z" />
            <path d="M8.25 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0zM15.75 6.75a.75.75 0 00-.75.75v11.25c0 .087.015.17.042.248a3 3 0 005.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 00-3.732-10.104 1.837 1.837 0 00-1.47-.725H15.75z" />
            <path d="M19.5 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
          </svg>
          SlimmeRoutes
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/dashboard" className="text-gray-600 hover:text-emerald-600 font-medium text-sm transition-colors">
            Route Planner
          </Link>
          <Link href="/dashboard/history" className="text-gray-600 hover:text-emerald-600 font-medium text-sm transition-colors">
            History
          </Link>
          <Link href="/dashboard/account" className="text-gray-600 hover:text-emerald-600 font-medium text-sm transition-colors">
            Account
          </Link>
        </nav>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
            <HelpCircle className="w-4 h-4 mr-2 text-emerald-600" />
            Help
          </Button>
          <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
            <LogOut className="w-4 h-4 mr-2 text-gray-500" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
