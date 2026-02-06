import React from 'react';
import { Mail, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { PublicPageLayout } from './layouts/PublicPageLayout';

export function AccountDeletion() {
  return (
    <PublicPageLayout title="Account Deletion & Data Removal">
      <div className="space-y-8 text-gray-900 dark:text-gray-100">
        <section className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-red-700 dark:text-red-400">
            <Trash2 className="h-6 w-6" />
            In-App Deletion
          </h2>
          <ol className="list-decimal pl-6 space-y-2 mt-4 text-red-700 dark:text-red-300">
            <li>Open the Gift List Manager app</li>
            <li>Go to Settings {'>'} Account</li>
            <li>Select "Delete Account"</li>
            <li>Enter your password to confirm</li>
            <li>Select reason for deletion (optional)</li>
            <li>Click "Permanently Delete Account"</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-500" />
            Email Request
          </h2>
          <p>Send an email to <a href="mailto:support@email.com" className="text-blue-500 hover:underline">support@email.com</a> with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Subject: "Account Deletion Request"</li>
            <li>Your registered email address</li>
            <li>Username (if applicable)</li>
            <li>Last login date (approximate)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">What Gets Deleted</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account information</li>
            <li>Gift lists and preferences</li>
            <li>Contact lists</li>
            <li>Usage history</li>
            <li>Payment information</li>
            <li>App settings</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Clock className="h-6 w-6 text-yellow-500" />
            Timeline
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account deletion processes within 30 days</li>
            <li>Backup data removed within 90 days</li>
            <li>You'll receive confirmation email once completed</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            Important Notes
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Deletion is permanent and cannot be undone</li>
            <li>Active subscriptions must be cancelled separately</li>
            <li>Shared list data may remain visible to other users</li>
            <li>Downloaded data on your device won't be automatically removed</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Need Help?</h2>
          <p>
            Contact support at{' '}
            <a href="mailto:support@email.com" className="text-blue-500 hover:underline">
              support@email.com
            </a>
            {' '}or through in-app support for assistance with account deletion.
          </p>
        </section>
      </div>
    </PublicPageLayout>
  );
} 