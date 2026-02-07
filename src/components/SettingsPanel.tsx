import React, { useEffect, useState } from 'react';
import { X, Sun, Moon, Plus, Trash2, Check, Sparkles, Shield } from 'lucide-react';
import type { LLMProvider } from '../types';
import { useLLMConfig } from '../hooks/useLLMConfig';
import { adminApi, getStoredUser, type AdminUser } from '../lib/api';

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
  const { configs, addConfig, deleteConfig, setActive } = useLLMConfig();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState<LLMProvider>('anthropic');
  const [newName, setNewName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');
  const [newModel, setNewModel] = useState('');

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentUserIsAdmin(Boolean(getStoredUser()?.isAdmin));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !currentUserIsAdmin) return;
    loadUsers();
  }, [isOpen, currentUserIsAdmin]);

  if (!isOpen) return null;

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setAdminError(null);
      const { users } = await adminApi.listUsers();
      setAdminUsers(users);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

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

  const maskApiKey = (key: string) => (key.length <= 8 ? '****' : `${key.slice(0, 4)}...${key.slice(-4)}`);

  const handleToggleAdmin = async (userId: string, nextValue: boolean) => {
    try {
      await adminApi.setAdmin(userId, nextValue);
      await loadUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Delete ${email} and all associated data?`)) return;
    try {
      await adminApi.deleteUser(userId);
      await loadUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handleGenerateResetLink = async (userId: string) => {
    try {
      const { resetUrl } = await adminApi.createResetLink(userId);
      await navigator.clipboard.writeText(resetUrl);
      alert('Reset link copied to clipboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to generate reset link');
    }
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
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Appearance</h3>
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Theme</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark mode</p>
                  </div>
                  <button onClick={onToggleDarkMode} className={`${isDarkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'} relative inline-flex h-7 w-14 rounded-full`}>
                    <span className={`${isDarkMode ? 'translate-x-7' : 'translate-x-0'} inline-flex h-6 w-6 transform rounded-full bg-white items-center justify-center`}>
                      {isDarkMode ? <Moon className="h-3.5 w-3.5 text-blue-600" /> : <Sun className="h-3.5 w-3.5 text-gray-400" />}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">AI Providers</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure LLM APIs for gift suggestions</p>
                  </div>
                  <button onClick={() => setShowAddForm(true)} className="aero-button px-3 py-1.5 text-xs"><Plus className="h-3.5 w-3.5" />Add</button>
                </div>

                <div className="space-y-3">
                  {configs.map((config) => (
                    <div key={config.id} className="aero-panel p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{config.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{config.provider} · {config.model}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{maskApiKey(config.apiKey)}</p>
                        </div>
                        <div className="flex gap-2">
                          {!config.isActive && <button onClick={() => setActive(config.id)} className="aero-button px-2 py-1 text-xs"><Check className="h-3.5 w-3.5" /></button>}
                          <button onClick={() => handleDeleteConfig(config.id)} className="px-2 py-1 text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {showAddForm && (
                  <form onSubmit={handleAddConfig} className="mt-4 aero-panel p-4 space-y-3">
                    <select value={newProvider} onChange={(e) => handleProviderChange(e.target.value as LLMProvider)} className="aero-input">
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="openai">OpenAI (GPT)</option>
                      <option value="custom">Custom / Local LLM</option>
                    </select>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Display name" className="aero-input" />
                    <input type="password" value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} placeholder="API key" className="aero-input" required={newProvider !== 'custom'} />
                    <input type="text" value={newModel} onChange={(e) => setNewModel(e.target.value)} placeholder="Model" className="aero-input" />
                    {newProvider === 'custom' && <input type="url" value={newBaseUrl} onChange={(e) => setNewBaseUrl(e.target.value)} placeholder="Base URL" className="aero-input" required />}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={resetForm} className="px-3 py-1.5 text-sm">Cancel</button>
                      <button type="submit" className="aero-button px-3 py-1.5 text-sm">Add Provider</button>
                    </div>
                  </form>
                )}
              </div>

              {currentUserIsAdmin && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-sky-700" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Admin</h3>
                  </div>

                  {adminError && <div className="text-sm text-red-600">{adminError}</div>}
                  {loadingUsers ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300">Loading users…</div>
                  ) : (
                    <div className="space-y-3">
                      {adminUsers.map((user) => (
                        <div key={user.id} className="aero-panel p-3 flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-sky-950 dark:text-sky-100">{user.email}</p>
                            <p className="text-xs text-sky-700 dark:text-sky-300">
                              Occasions: {user.occasion_count} · People: {user.people_count} · Gifts: {user.gift_count}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleToggleAdmin(user.id, !user.is_admin)} className="aero-button px-2 py-1 text-xs">
                              {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                            </button>
                            <button onClick={() => handleGenerateResetLink(user.id)} className="aero-button px-2 py-1 text-xs">Reset Link</button>
                            <button onClick={() => handleDeleteUser(user.id, user.email)} className="px-2 py-1 text-xs text-red-700">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 p-3 bg-gray-50/60 dark:bg-gray-900/40 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">API keys are stored locally in your browser and sent directly to providers.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
