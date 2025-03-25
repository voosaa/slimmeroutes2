import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | SlimmeRoutes',
  description: 'Terms of Service for SlimmeRoutes route optimization application',
}

export default function TermsOfService() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <div className="prose max-w-none">
        <p><strong>Last Updated:</strong> March 22, 2025</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>
          Welcome to SlimmeRoutes. These Terms of Service ("Terms") govern your access to and use of the SlimmeRoutes website, 
          applications, and services (collectively, the "Service"). By accessing or using the Service, you agree to be bound 
          by these Terms. If you do not agree to these Terms, you may not access or use the Service.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
        <p>
          SlimmeRoutes provides a route optimization service that allows users to plan efficient routes between multiple 
          destinations. The Service may include features such as route calculation, cost estimation, and integration with 
          third-party services like Google Maps and Google Calendar.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
        <p>
          To access certain features of the Service, you may be required to create an account. You are responsible for 
          maintaining the confidentiality of your account credentials and for all activities that occur under your account. 
          You agree to provide accurate and complete information when creating your account and to update your information 
          as necessary to keep it accurate and complete.
        </p>
        <p>
          You are solely responsible for any activity that occurs through your account. If you become aware of any unauthorized 
          use of your account, you agree to notify us immediately.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Conduct</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Use the Service in any way that violates any applicable law or regulation</li>
          <li>Impersonate any person or entity or falsely state or misrepresent your affiliation with a person or entity</li>
          <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
          <li>Attempt to gain unauthorized access to any part of the Service</li>
          <li>Use the Service for any purpose that is harmful, fraudulent, or otherwise objectionable</li>
          <li>Use automated means, including spiders, robots, crawlers, or data mining tools, to download data from the Service</li>
          <li>Introduce any viruses, Trojan horses, worms, logic bombs, or other harmful material to the Service</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Intellectual Property Rights</h2>
        <p>
          The Service and its original content, features, and functionality are owned by SlimmeRoutes and are protected by 
          international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
        </p>
        <p>
          You may not copy, modify, create derivative works from, publicly display, publicly perform, republish, download, 
          store, or transmit any of the material on our Service, except as necessary for your personal, non-commercial use 
          of the Service.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Third-Party Services and Content</h2>
        <p>
          The Service may contain links to third-party websites, services, or content that are not owned or controlled by 
          SlimmeRoutes. We have no control over, and assume no responsibility for, the content, privacy policies, or practices 
          of any third-party websites or services. You acknowledge and agree that SlimmeRoutes shall not be responsible or 
          liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the 
          use of or reliance on any such content, goods, or services available on or through any such websites or services.
        </p>
        <p>
          When you use third-party integrations (such as Google Maps or Google Calendar), you are also subject to the terms 
          and conditions and privacy policies of those third-party services.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Data Usage and Privacy</h2>
        <p>
          Our collection and use of your personal information is governed by our Privacy Policy, which is incorporated into 
          these Terms by reference. By using the Service, you consent to the collection and use of your information as 
          described in the Privacy Policy.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, SlimmeRoutes and its officers, directors, employees, and agents shall not be 
          liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, 
          loss of profits, data, use, goodwill, or other intangible losses, resulting from:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Your access to or use of or inability to access or use the Service</li>
          <li>Any conduct or content of any third party on the Service</li>
          <li>Any content obtained from the Service</li>
          <li>Unauthorized access, use, or alteration of your transmissions or content</li>
        </ul>
        <p>
          In no event shall our total liability to you for all claims exceed the amount you have paid to us for use of the 
          Service in the past twelve months.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Disclaimer of Warranties</h2>
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, 
          including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, or 
          non-infringement. We do not warrant that the Service will be uninterrupted or error-free, that defects will be 
          corrected, or that the Service or the servers that make it available are free of viruses or other harmful components.
        </p>
        <p>
          SlimmeRoutes does not guarantee the accuracy of route optimizations, cost calculations, or other information provided 
          through the Service. You acknowledge that actual travel times, distances, and costs may vary based on real-world 
          conditions.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless SlimmeRoutes and its officers, directors, employees, and agents 
          from and against any claims, liabilities, damages, losses, and expenses, including, without limitation, reasonable 
          legal and accounting fees, arising out of or in any way connected with your access to or use of the Service or your 
          violation of these Terms.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Termination</h2>
        <p>
          We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, 
          for any reason, including, without limitation, if you breach these Terms. Upon termination, your right to use the 
          Service will immediately cease.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Changes to Terms</h2>
        <p>
          We reserve the right to modify or replace these Terms at any time. We will provide notice of any material changes 
          by posting the updated Terms on this page and updating the "Last Updated" date. Your continued use of the Service 
          after any such changes constitutes your acceptance of the new Terms.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">13. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the Netherlands, without regard to 
          its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be subject to 
          the exclusive jurisdiction of the courts located in Amsterdam, Netherlands.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">14. Severability</h2>
        <p>
          If any provision of these Terms is held to be invalid or unenforceable, such provision shall be struck and the 
          remaining provisions shall be enforced to the fullest extent under law.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">15. Contact Information</h2>
        <p>
          If you have any questions about these Terms, please contact us at:
        </p>
        <p className="mt-2">
          Email: legal@slimmeroutes.com<br />
          Address: SlimmeRoutes Headquarters, 123 Route Street, Amsterdam, Netherlands
        </p>
      </div>
    </div>
  )
}
