import React from 'react';
import { PublicPageLayout } from './layouts/PublicPageLayout';

export function PrivacyPolicy() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <PublicPageLayout title="Privacy Policy">
      <div className="space-y-8 text-gray-900 dark:text-gray-100">
        <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated: {currentDate}</p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Introduction</h2>
          <p className="leading-relaxed">
            Welcome to Gift List Manager ("we," "our," or "us"). We are committed to protecting your privacy
            and ensuring you have a positive experience when using our gift list management application.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Information We Collect</h2>
          
          <div>
            <h3 className="text-xl font-medium">Personal Information</h3>
            <p>We may collect the following types of personal information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Name and contact information</li>
              <li>Email address</li>
              <li>Account credentials</li>
              <li>Device information and identifiers</li>
              <li>Gift preferences and wishlist data</li>
              <li>Contact lists (when you choose to import them)</li>
              <li>Payment information (if applicable)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-medium">Usage Data</h3>
            <p>We automatically collect certain information about how you use our App, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>App features you interact with</li>
              <li>Time spent using the App</li>
              <li>Navigation patterns</li>
              <li>Device type and operating system</li>
              <li>IP address and location data</li>
            </ul>
          </div>
        </section>

        {/* Add remaining sections similarly */}
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Contact Us</h2>
          <p>
            If you have questions or concerns about this privacy policy or our practices, please contact us at:
            <br />
            <a 
              href="mailto:contact@giftlistmanager.com" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              contact@giftlistmanager.com
            </a>
          </p>
        </section>
      </div>
    </PublicPageLayout>
  );
} 