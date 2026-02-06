import React from 'react';
import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';

interface PublicPageLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function PublicPageLayout({ children, title }: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                Gift List Manager
              </span>
            </Link>
            <div className="flex gap-4">
              <Link
                to="/privacy"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Privacy Policy
              </Link>
              <Link
                to="/delete-account"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Delete Account
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
              {title}
            </h1>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 