import React, { useState } from 'react';
import { ArrowLeft, Plus, Calendar } from 'lucide-react';
import type { Person, GiftIdea } from '../types';
import { GiftList } from './GiftList';
import { AddGiftModal } from './AddGiftModal';
import { calculateSpentAmount } from '../utils/calculations';

interface PersonDetailsProps {
  person: Person;
  gifts: GiftIdea[];
  onBack: () => void;
  onAddGift: (gift: Omit<GiftIdea, 'id' | 'dateAdded'>) => void;
  onUpdateGiftStatus: (giftId: string, status: GiftIdea['status']) => void;
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
  const personGifts = gifts.filter((gift) => gift.personId === person.id);
  const spentAmount = calculateSpentAmount(personGifts);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        <button
          onClick={() => setShowAddGiftModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Gift
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">{person.name}</h2>
        <p className="text-gray-500">{person.relationship}</p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900">Budget Overview</h3>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-600">Total Budget</p>
            <p className="text-2xl font-semibold text-blue-900">${person.budget}</p>
          </div>
          <div>
            <p className="text-sm text-blue-600">Spent</p>
            <p className="text-2xl font-semibold text-blue-900">${spentAmount}</p>
          </div>
        </div>
        <div className="mt-3 w-full bg-blue-100 rounded-full h-2">
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

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gift Ideas</h3>
        {personGifts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No gift ideas yet</p>
            <button
              onClick={() => setShowAddGiftModal(true)}
              className="mt-2 text-blue-600 hover:text-blue-800"
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