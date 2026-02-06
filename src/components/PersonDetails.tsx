import React, { useState } from 'react';
import { ArrowLeft, Plus, Sparkles } from 'lucide-react';
import type { Person, Gift, GiftStatus } from '../types';
import { GiftList } from './GiftList';
import { AddGiftModal } from './AddGiftModal';
import { calculateSpentAmount } from '../utils/calculations';
import { AISuggestionsPanel } from './AISuggestionsPanel';

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
  const personGifts = gifts.filter((gift) => gift.person_id === person.id);
  const spentAmount = calculateSpentAmount(personGifts);
  const remainingBudget = person.budget - spentAmount;

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
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Gift
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{person.name}</h2>
        <p className="text-gray-500 dark:text-gray-400">{person.relationship}</p>
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
          person={person}
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
            <p className="text-gray-500 dark:text-gray-400">No gift ideas yet</p>
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
