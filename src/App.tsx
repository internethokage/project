import React, { useState, useEffect, useRef } from 'react';
import { Plus, Gift, User, Settings, LogOut, Menu, Users } from 'lucide-react';
import { OccasionCard } from './components/OccasionCard';
import { PersonCard } from './components/PersonCard';
import { AddOccasionModal } from './components/AddOccasionModal';
import { OccasionDetails } from './components/OccasionDetails';
import { PersonDetails } from './components/PersonDetails';
import { AddPersonModal } from './components/AddPersonModal';
import { SettingsPanel } from './components/SettingsPanel';
import { useGiftTracker } from './hooks/useGiftTracker';
import { useClickOutside } from './hooks/useClickOutside';
import type { Person, Occasion } from './types';
import shopping from '/shopping.png';
import { Auth } from './components/Auth';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { authApi, getToken, clearToken, getStoredUser } from './lib/api';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AccountDeletion } from './components/AccountDeletion';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';

function MainLayout({ onLogout }: { onLogout: () => void }) {
  const {
    people,
    gifts,
    occasions,
    loading,
    error,
    addPerson,
    deletePerson,
    addGift,
    removeGift,
    updateGiftStatus,
    addOccasion,
    deleteOccasion,
  } = useGiftTracker();

  const [showAddOccasionModal, setShowAddOccasionModal] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useClickOutside(profileMenuRef, () => setShowProfileMenu(false), showProfileMenu);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored?.email) {
      setUserEmail(stored.email);
    } else {
      authApi.getUser().then(user => {
        if (user?.email) setUserEmail(user.email);
      });
    }
  }, []);

  const handleLogoClick = () => {
    setSelectedPerson(null);
    setSelectedOccasion(null);
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      onLogout();
      navigate('/auth');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const handleAddPerson = async (person: { name: string; relationship: string; budget: number }) => {
    try {
      await addPerson(person);
      setShowAddPersonModal(false);
    } catch (err) {
      console.error('Error adding person:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/50 bg-white/35 backdrop-blur-xl dark:border-white/10 dark:bg-sky-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div
              className="flex items-center gap-3 cursor-pointer rounded-xl px-3 py-2 hover:bg-white/40 dark:hover:bg-sky-900/40"
              onClick={handleLogoClick}
            >
              <img src={shopping} alt="Gift" className="w-6 h-6" />
              <h1 className="text-xl font-semibold text-sky-950 dark:text-sky-100">Giftable</h1>
            </div>
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-2 rounded-full border border-white/60 bg-white/40 hover:bg-white/60 dark:border-white/15 dark:bg-sky-900/40"
              >
                <User className="w-5 h-5 text-sky-800 dark:text-sky-200" />
                <Menu className="w-5 h-5 text-sky-800 dark:text-sky-200" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 aero-panel p-1 z-50">
                  <div className="p-4 border-b border-white/50 dark:border-white/10">
                    <p className="text-sm font-medium text-sky-950 dark:text-sky-100">
                      Signed in as
                    </p>
                    <p className="text-sm text-sky-700 dark:text-sky-300 truncate">
                      {userEmail}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowSettingsPanel(true);
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center w-full rounded-lg px-4 py-2 text-sm text-sky-900 hover:bg-white/50 dark:text-sky-100 dark:hover:bg-sky-900/50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full rounded-lg px-4 py-2 text-sm text-sky-900 hover:bg-white/50 dark:text-sky-100 dark:hover:bg-sky-900/50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedPerson ? (
          <PersonDetails
            person={selectedPerson}
            gifts={gifts}
            onBack={() => setSelectedPerson(null)}
            onAddGift={addGift}
            onRemoveGift={removeGift}
            onUpdateGiftStatus={updateGiftStatus}
          />
        ) : selectedOccasion ? (
          <OccasionDetails
            occasion={selectedOccasion}
            people={people}
            gifts={gifts}
            onBack={() => setSelectedOccasion(null)}
            onAddPerson={() => setShowAddPersonModal(true)}
            onSelectPerson={setSelectedPerson}
            onRemovePerson={deletePerson}
          />
        ) : (
          <div className="space-y-10">
            {/* Occasions Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-sky-950 dark:text-sky-100">Occasions</h2>
                <button
                  onClick={() => setShowAddOccasionModal(true)}
                  className="aero-button"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Occasion
                </button>
              </div>

              {occasions.length === 0 ? (
                <div className="text-center py-12 aero-panel">
                  <Gift className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-sky-950 dark:text-sky-100">No occasions</h3>
                  <p className="mt-1 text-sm text-sky-700 dark:text-sky-300">
                    Get started by adding an occasion.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddOccasionModal(true)}
                      className="aero-button"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Occasion
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {occasions.map((occasion) => (
                    <OccasionCard
                      key={occasion.id}
                      occasion={occasion}
                      people={people}
                      gifts={gifts}
                      onSelect={() => setSelectedOccasion(occasion)}
                      onRemove={deleteOccasion}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* People Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-sky-950 dark:text-sky-100">People</h2>
                <button
                  onClick={() => setShowAddPersonModal(true)}
                  className="aero-button"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Person
                </button>
              </div>

              {people.length === 0 ? (
                <div className="text-center py-12 aero-panel">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-sky-950 dark:text-sky-100">No people</h3>
                  <p className="mt-1 text-sm text-sky-700 dark:text-sky-300">
                    Add people you want to buy gifts for.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddPersonModal(true)}
                      className="aero-button"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Person
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {people.map((person) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      gifts={gifts}
                      onSelect={setSelectedPerson}
                      onRemove={deletePerson}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showAddOccasionModal && (
        <AddOccasionModal
          onClose={() => setShowAddOccasionModal(false)}
          onAdd={addOccasion}
        />
      )}

      {showAddPersonModal && (
        <AddPersonModal
          onClose={() => setShowAddPersonModal(false)}
          onAdd={handleAddPerson}
        />
      )}

      <SettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />
    </div>
  );
}

export function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have a valid token
    const token = getToken();
    if (!token) {
      setAuthenticated(false);
      return;
    }

    authApi.verify().then(({ valid }) => {
      setAuthenticated(valid);
      if (!valid) clearToken();
    });

    // Listen for forced logouts (401 from API)
    const handleLogout = () => {
      setAuthenticated(false);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/delete-account" element={<AccountDeletion />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/auth"
          element={
            <Auth onAuthSuccess={() => setAuthenticated(true)} />
          }
        />
        <Route
          path="/*"
          element={
            authenticated ? (
              <MainLayout onLogout={() => setAuthenticated(false)} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
