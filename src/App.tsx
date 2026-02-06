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
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AccountDeletion } from './components/AccountDeletion';

function MainLayout() {
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
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUserEmail();
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={handleLogoClick}
            >
              <img src={shopping} alt="Gift" className="w-6 h-6" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Giftable</h1>
            </div>
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Signed in as
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {userEmail}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowSettingsPanel(true);
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Occasions</h2>
                <button
                  onClick={() => setShowAddOccasionModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Occasion
                </button>
              </div>

              {occasions.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Gift className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No occasions</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Get started by adding an occasion.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddOccasionModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
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
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">People</h2>
                <button
                  onClick={() => setShowAddPersonModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Person
                </button>
              </div>

              {people.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No people</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Add people you want to buy gifts for.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddPersonModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
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
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/delete-account" element={<AccountDeletion />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/*"
          element={
            session ? (
              <MainLayout />
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
