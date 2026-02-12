import React, { useState } from 'react';
import { ArrowLeft, Plus, Sparkles, Pencil, Check, X } from 'lucide-react';
import type { Person, Gift, GiftStatus } from '../types';
import { GiftList } from './GiftList';
import { AddGiftModal } from './AddGiftModal';
import { calculateSpentAmount } from '../utils/calculations';
import { AISuggestionsPanel } from './AISuggestionsPanel';
import { api } from '../lib/api';

interface PersonDetailsProps {
  person: Person;
  gifts: Gift[];
  onBack: () => void;
  onAddGift: (gift: { person_id: string; title: string; price: number; url?: string | null; notes?: string | null; status: GiftStatus }) => void;
  onUpdateGiftStatus: (giftId: string, status: GiftStatus) => void;
  onRemoveGift: (giftId: string) => void;
}

export function PersonDetails({
  person,
  gifts,
  onBack,
  onAddGift,
  onUpdateGiftStatus,
  onRemoveGift,
}: PersonDetailsProps) {
  const [showAddGiftModal, setShowAddGiftModal] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(person.notes ?? '');
  const [notesLoading, setNotesLoading] = useState(false);
  const [currentNotes, setCurrentNotes] = useState(person.notes ?? '');

  const personGifts = gifts.filter((gift) => gift.person_id === person.id);
  const spentAmount = calculateSpentAmount(personGifts);
  const remainingBudget = person.budget - spentAmount;

  const handleSaveNotes = async () => {
    setNotesLoading(true);
    try {
      await api.patch(`/api/people/${person.id}`, { notes: notesValue.trim() || null });
      setCurrentNotes(notesValue.trim());
      setEditingNotes(false);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleCancelNotes = () => {
    setNotesValue(currentNotes);
    setEditingNotes(false);
  };

  // Pass enriched person with up-to-date notes to AI panel
  const personWithNotes: Person = { ...person, notes: currentNotes || null };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAISuggestions(!showAISuggestions)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-700"
          >
            <Sparkles className="w-4 h-4" />
            AI Suggest
          </button>
          <button
            onClick={() => setShowAddGiftModal(true)}
            className="aero-button"
          >
            <Plus className="w-4 h-4" />
            Add Gift
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{person.name}</h2>
        <p className="text-sky-700 dark:text-sky-300">{person.relationship}</p>
      </div>

      {/* Notes section — used by AI suggestions for better context */}
      <div className="bg-sky-50/60 dark:bg-sky-900/20 rounded-lg p-4 border border-sky-100 dark:border-sky-800/40">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-sky-900 dark:text-sky-300">Notes</h3>
          {!editingNotes && (
            <button
              onClick={() => setEditingNotes(true)}
              className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>

        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              className="aero-input w-full resize-none text-sm"
              rows={3}
              placeholder="Interests, hobbies, preferences — helps AI generate better gift suggestions"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelNotes}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={notesLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-60"
              >
                <Check className="w-3 h-3" />
                {notesLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-sky-700 dark:text-sky-400">
            {currentNotes || (
              <span className="italic text-sky-400 dark:text-sky-600">
                No notes yet — add interests or preferences to improve AI suggestions
              </span>
            )}
          </p>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300">Budget Overview</h3>
        <div className="mt-2 grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-400">Total Budget</p>
            <p className="text-2xl font-semibold text-blue-900 dark:text-blue-200">${person.budget}</p>
          </div>
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-400">Spent</p>
            <p className="text-2xl font-semibold text-blue-900 dark:text-blue-200">${spentAmount}</p>
          </div>
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-400">Remaining</p>
            <p className={`text-2xl font-semibold ${remainingBudget < 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-900 dark:text-blue-200'}`}>
              ${remainingBudget}
            </p>
          </div>
        </div>
        <div className="mt-3 w-full bg-blue-100 dark:bg-blue-900/40 rounded-full h-2">
          <div
            className={`h-full rounded-full ${
              spentAmount > person.budget ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{
              width: `${Math.min((spentAmount / person.budget) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {showAISuggestions && (
        <AISuggestionsPanel
          person={personWithNotes}
          existingGifts={personGifts}
          budget={remainingBudget}
          onAddGift={(suggestion) => {
            onAddGift({
              person_id: person.id,
              title: suggestion.title,
              price: suggestion.estimatedPrice,
              notes: suggestion.reason,
              status: 'idea',
            });
          }}
          onClose={() => setShowAISuggestions(false)}
        />
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gift Ideas</h3>
        {personGifts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sky-700 dark:text-sky-300">No gift ideas yet</p>
            <button
              onClick={() => setShowAddGiftModal(true)}
              className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Add your first gift idea
            </button>
          </div>
        ) : (
          <GiftList
            gifts={personGifts}
            onUpdateStatus={onUpdateGiftStatus}
            onRemove={onRemoveGift}
          />
        )}
      </div>

      {showAddGiftModal && (
        <AddGiftModal
          personId={person.id}
          onClose={() => setShowAddGiftModal(false)}
          onAdd={onAddGift}
        />
      )}
    </div>
  );
}
