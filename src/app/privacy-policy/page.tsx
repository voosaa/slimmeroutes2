import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | SlimmeRoutes',
  description: 'Privacy Policy for SlimmeRoutes route optimization application',
}

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose max-w-none">
        <p><strong>Last Updated:</strong> March 22, 2025</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          Welcome to SlimmeRoutes ("we," "our," or "us"). We are committed to protecting your privacy and personal information. 
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our route 
          optimization service, including our website and any related applications (collectively, the "Service").
        </p>
        <p>
          Please read this Privacy Policy carefully. By accessing or using the Service, you acknowledge that you have read, 
          understood, and agree to be bound by this Privacy Policy. If you do not agree with our policies and practices, 
          please do not use our Service.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Personal Information</h3>
        <p>We may collect the following types of personal information:</p>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Account Information:</strong> Email address, name, and password when you create an account.</li>
          <li><strong>Profile Information:</strong> Information you provide in your user profile.</li>
          <li><strong>Usage Data:</strong> Information about how you use our Service, including routes, addresses, and optimization preferences.</li>
          <li><strong>Location Data:</strong> Geographic locations of addresses you input for route optimization.</li>
          <li><strong>Calendar Information:</strong> If you choose to connect with Google Calendar, we access your calendar to create events based on your optimized routes.</li>
        </ul>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Automatically Collected Information</h3>
        <p>When you use our Service, we automatically collect certain information, including:</p>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Device Information:</strong> Information about your device, including IP address, browser type, operating system, and device identifiers.</li>
          <li><strong>Usage Information:</strong> How you interact with our Service, including pages visited, time spent, and actions taken.</li>
          <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to collect information about your browsing activities.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
        <p>We use the information we collect for various purposes, including:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Providing, maintaining, and improving our Service</li>
          <li>Processing and optimizing routes based on your inputs</li>
          <li>Creating calendar events when you choose to export routes to Google Calendar</li>
          <li>Communicating with you about your account or the Service</li>
          <li>Responding to your inquiries and providing customer support</li>
          <li>Analyzing usage patterns to enhance user experience</li>
          <li>Protecting the security and integrity of our Service</li>
          <li>Complying with legal obligations</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Sharing Your Information</h2>
        <p>We may share your information in the following circumstances:</p>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Service Providers:</strong> We may share information with third-party vendors and service providers who perform services on our behalf, such as hosting, data analysis, and customer service.</li>
          <li><strong>Third-Party Integrations:</strong> When you connect to third-party services (like Google Calendar or Google Maps), we share information necessary for these integrations to function.</li>
          <li><strong>Legal Requirements:</strong> We may disclose information if required to do so by law or in response to valid requests by public authorities.</li>
          <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
          <li><strong>With Your Consent:</strong> We may share information with your consent or at your direction.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, 
          alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, 
          and we cannot guarantee absolute security.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights and Choices</h2>
        <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Accessing, correcting, or deleting your personal information</li>
          <li>Withdrawing consent for processing your information</li>
          <li>Requesting restriction of processing or objecting to processing</li>
          <li>Data portability</li>
          <li>Opting out of marketing communications</li>
        </ul>
        <p>
          To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Children's Privacy</h2>
        <p>
          Our Service is not directed to children under the age of 16. We do not knowingly collect personal information from children. 
          If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will 
          take steps to delete such information.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">8. International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries other than the country in which you reside. These countries may 
          have data protection laws that differ from those in your country. By using our Service, you consent to the transfer of your information 
          to these countries.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory 
          reasons. We will notify you of any material changes by posting the updated Privacy Policy on this page and updating the "Last Updated" date.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
        <p>
          If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
        </p>
        <p className="mt-2">
          Email: privacy@slimmeroutes.com<br />
          Address: SlimmeRoutes Headquarters, 123 Route Street, Amsterdam, Netherlands
        </p>
      </div>
    </div>
  )
}
