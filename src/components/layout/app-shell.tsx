"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Map, 
  BarChart2, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  User,
  HelpCircle,
  Users
} from 'lucide-react'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Routes', href: '/dashboard/routes', icon: Map },
    { name: 'Drivers', href: '/dashboard/drivers', icon: Users },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for desktop */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out`}>
        <div className="bg-white h-full border-r border-gray-200 flex flex-col">
          {/* Logo and collapse button */}
          <div className="h-16 flex items-center px-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center">
              {sidebarOpen ? (
                <div className="flex items-center">
                  <img 
                    src="/logo.svg" 
                    alt="SlimmeRoutes Logo" 
                    className="h-8"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-10 h-10">
                  <img 
                    src="/logo-icon.svg" 
                    alt="SlimmeRoutes Icon" 
                    className="h-8 w-8"
                  />
                </div>
              )}
            </Link>
            <button 
              onClick={toggleSidebar}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation links */}
          <div className="flex-1 py-6 flex flex-col space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    ${isActive ? 'bg-emerald-50 text-emerald-600 border-l-4 border-emerald-600' : 'text-gray-600 hover:bg-gray-50'}
                    group flex items-center px-3 py-3 text-sm font-medium
                  `}
                >
                  <item.icon className={`${sidebarOpen ? 'mr-3' : 'mx-auto'} h-5 w-5 flex-shrink-0`} />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              )
            })}
          </div>

          {/* User profile section */}
          {user && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <User size={16} />
                </div>
                {sidebarOpen && (
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {user.email}
                    </p>
                    <button 
                      onClick={() => signOut()}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center mt-1"
                    >
                      <LogOut size={12} className="mr-1" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="h-16 flex items-center px-4">
          <button 
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <Menu size={24} />
          </button>
          <Link href="/dashboard" className="flex items-center">
            <div className="text-xl font-semibold text-emerald-600">SlimmeRoutes</div>
          </Link>
          {user && (
            <div className="ml-auto">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <User size={16} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar (off-canvas) */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={toggleSidebar}
          />
          
          {/* Sidebar panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="h-16 flex items-center px-4 border-b border-gray-200">
              <Link href="/dashboard" className="flex items-center">
                <div className="text-xl font-semibold text-emerald-600">SlimmeRoutes</div>
              </Link>
              <button 
                onClick={toggleSidebar}
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 py-6 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      ${isActive ? 'bg-emerald-50 text-emerald-600 border-l-4 border-emerald-600' : 'text-gray-600 hover:bg-gray-50'}
                      group flex items-center px-3 py-3 text-sm font-medium
                    `}
                    onClick={toggleSidebar}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {user && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <User size={16} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {user.email}
                    </p>
                    <button 
                      onClick={() => signOut()}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center mt-1"
                    >
                      <LogOut size={12} className="mr-1" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'md:pl-64' : 'md:pl-20'} transition-all duration-300 ease-in-out`}>
        <main className="flex-1 pt-16 md:pt-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
