import { Metadata } from 'next'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Account Settings - SlimmeRoutes',
  description: 'Manage your SlimmeRoutes account settings',
}

export default function AccountPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Doe" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="john.doe@example.com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input id="company" defaultValue="Acme Inc." />
                </div>
                
                <div className="pt-4">
                  <Button>Save Changes</Button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Change Password</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                
                <div className="pt-4">
                  <Button>Update Password</Button>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Current Plan</p>
                  <p className="font-medium">Pay Per Route (€10/route)</p>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Payment Method</p>
                  <div className="flex items-center">
                    <div className="bg-neutral-100 rounded p-2 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Visa ending in 4242</p>
                      <p className="text-sm text-neutral-500">Expires 12/2025</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button variant="outline" className="w-full">Update Payment Method</Button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
              
              <div className="space-y-4">
                <Button variant="outline" className="w-full">Download Your Data</Button>
                <Button variant="destructive" className="w-full">Delete Account</Button>
              </div>
            </div>
          </div>
        </div>
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
