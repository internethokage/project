import { X, Sun, Moon } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function SettingsPanel({ isOpen, onClose, isDarkMode, onToggleDarkMode }: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/20 transition-opacity" />
        
        <div className="fixed inset-y-0 right-0 max-w-full flex items-start justify-end">
          <div className="w-[1200px] h-full">
            <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl">
              {/* Clean, minimal header */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Settings</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Clean content area */}
              <div className="flex-1">
                <div className="px-8 py-6">
                  <div className="max-w-4xl">
                    <div className="flex items-center justify-between py-4">
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Theme
                        </span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Customize the appearance of the app
                        </p>
                      </div>
                      <button
                        onClick={onToggleDarkMode}
                        className={`${
                          isDarkMode 
                            ? 'bg-blue-600' 
                            : 'bg-gray-200 dark:bg-gray-700'
                        } relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                        role="switch"
                        aria-checked={isDarkMode}
                      >
                        <span
                          className={`
                            ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}
                            pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
                            flex items-center justify-center
                          `}
                        >
                          {isDarkMode ? (
                            <Moon className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Sun className="h-4 w-4 text-gray-400" />
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 