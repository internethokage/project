import React, { useState } from 'react';
import { X, Sun, Moon, Plus, Trash2, Check, Sparkles } from 'lucide-react';
import type { LLMConfig, LLMProvider } from '../types';
import { useLLMConfig } from '../hooks/useLLMConfig';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const PROVIDER_DEFAULTS: Record<LLMProvider, { baseUrl: string; model: string }> = {
  anthropic: { baseUrl: 'https://api.anthropic.com/v1/messages', model: 'claude-sonnet-4-20250514' },
  openai: { baseUrl: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  custom: { baseUrl: '', model: '' },
};

export function SettingsPanel({ isOpen, onClose, isDarkMode, onToggleDarkMode }: SettingsPanelProps) {
  const { configs, activeConfig, addConfig, updateConfig, deleteConfig, setActive } = useLLMConfig();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Add form state
  const [newProvider, setNewProvider] = useState<LLMProvider>('anthropic');
  const [newName, setNewName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');
  const [newModel, setNewModel] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setNewProvider('anthropic');
    setNewName('');
    setNewApiKey('');
    setNewBaseUrl('');
    setNewModel('');
    setShowAddForm(false);
  };

  const handleProviderChange = (provider: LLMProvider) => {
    setNewProvider(provider);
    const defaults = PROVIDER_DEFAULTS[provider];
    setNewBaseUrl(defaults.baseUrl);
    setNewModel(defaults.model);
  };

  const handleAddConfig = (e: React.FormEvent) => {
    e.preventDefault();
    addConfig({
      provider: newProvider,
      name: newName || `${newProvider.charAt(0).toUpperCase() + newProvider.slice(1)} API`,
      apiKey: newApiKey,
      baseUrl: newBaseUrl || PROVIDER_DEFAULTS[newProvider].baseUrl,
      model: newModel || PROVIDER_DEFAULTS[newProvider].model,
      isActive: configs.length === 0,
    });
    resetForm();
  };

  const handleDeleteConfig = (id: string) => {
    if (confirm('Remove this LLM provider?')) {
      deleteConfig(id);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '****';
    return key.slice(0, 4) + '...' + key.slice(-4);
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/20 transition-opacity" onClick={onClose} />

        <div className="fixed inset-y-0 right-0 max-w-full flex items-start justify-end">
          <div className="w-full max-w-lg h-full">
            <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-medium text-sky-950 dark:text-sky-100">Settings</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 px-6 py-6 space-y-8">
                {/* Theme Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Appearance</h3>
                  <div className="flex items-center justify-between py-3">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Theme</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark mode</p>
                    </div>
                    <button
                      onClick={onToggleDarkMode}
                      className={`${
                        isDarkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      } relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                      role="switch"
                      aria-checked={isDarkMode}
                    >
                      <span
                        className={`${isDarkMode ? 'translate-x-7' : 'translate-x-0'} pointer-events-none inline-flex h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out items-center justify-center`}
                      >
                        {isDarkMode ? (
                          <Moon className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <Sun className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                {/* LLM Providers Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">AI Providers</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Configure LLM APIs for gift suggestions
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Provider
                    </button>
                  </div>

                  {/* Existing configs */}
                  {configs.length === 0 && !showAddForm && (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                      <Sparkles className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No LLM providers configured</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Add Anthropic, OpenAI, or a custom/local LLM
                      </p>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="mt-3 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                      >
                        Add your first provider
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {configs.map((config) => (
                      <div
                        key={config.id}
                        className={`p-4 rounded-lg border ${
                          config.isActive
                            ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              config.provider === 'anthropic'
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                : config.provider === 'openai'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            }`}>
                              {config.provider}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{config.name}</span>
                            {config.isActive && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {!config.isActive && (
                              <button
                                onClick={() => setActive(config.id)}
                                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 rounded"
                                title="Set as active"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteConfig(config.id)}
                              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded"
                              title="Remove provider"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                          <p>Model: {config.model}</p>
                          <p>API Key: {maskApiKey(config.apiKey)}</p>
                          {config.provider === 'custom' && config.baseUrl && (
                            <p>URL: {config.baseUrl}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add new config form */}
                  {showAddForm && (
                    <div className="mt-4 p-4 rounded-lg border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Add LLM Provider</h4>
                      <form onSubmit={handleAddConfig} className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
                          <select
                            value={newProvider}
                            onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          >
                            <option value="anthropic">Anthropic (Claude)</option>
                            <option value="openai">OpenAI (GPT)</option>
                            <option value="custom">Custom / Local LLM</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={`My ${newProvider} API`}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                          <input
                            type="password"
                            value={newApiKey}
                            onChange={(e) => setNewApiKey(e.target.value)}
                            placeholder={newProvider === 'anthropic' ? 'sk-ant-...' : newProvider === 'openai' ? 'sk-...' : 'API key (if required)'}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            required={newProvider !== 'custom'}
                          />
                        </div>

                        {newProvider === 'custom' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Base URL <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="url"
                              value={newBaseUrl}
                              onChange={(e) => setNewBaseUrl(e.target.value)}
                              placeholder="http://localhost:11434/v1/chat/completions"
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                              required
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Must be OpenAI-compatible API endpoint (works with Ollama, LM Studio, etc.)
                            </p>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
                          <input
                            type="text"
                            value={newModel}
                            onChange={(e) => setNewModel(e.target.value)}
                            placeholder={PROVIDER_DEFAULTS[newProvider].model || 'model name'}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={resetForm}
                            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                          >
                            Add Provider
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Info note */}
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      API keys are stored locally in your browser and are sent directly to the provider.
                      They are never sent to Giftable servers.
                    </p>
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
