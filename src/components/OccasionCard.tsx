import React, { useState } from 'react';
import { Calendar, DollarSign } from 'lucide-react';
import type { Person, Gift, Occasion } from '../types';

interface OccasionCardProps {
  occasion: Occasion;
  people: Person[];
  gifts: Gift[];
  onSelect: (occasion: Occasion) => void;
  onRemove: (id: string) => Promise<void>;
}

export function OccasionCard({
  occasion,
  people = [],
  gifts = [],
  onSelect,
  onRemove
}: OccasionCardProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const occasionGifts = gifts.filter(gift =>
    people.some(person => person.id === gift.person_id)
  );

  const totalSpent = occasionGifts
    .filter(gift => gift.status === 'purchased' || gift.status === 'given')
    .reduce((sum, gift) => sum + gift.price, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDeleting(true);
      await onRemove(occasion.id);
    } catch (err) {
      console.error('Error deleting occasion:', err);
    } finally {
      setIsDeleting(false);
      setIsConfirming(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(false);
  };

  return (
    <div
      onClick={() => onSelect(occasion)}
      className="aero-panel p-4 cursor-pointer hover:brightness-105 transition"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-sky-950 dark:text-sky-100">
            {occasion.type}
          </h3>
          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-1">
              <Calendar size={16} className="text-gray-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(occasion.date)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign size={16} className="text-gray-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Budget: ${occasion.budget} (Spent: ${totalSpent})
              </span>
            </div>
          </div>
        </div>
        {isConfirming ? (
          <div className="flex space-x-2">
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className={`text-red-600 hover:text-red-700 text-sm ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isDeleting ? 'Deleting...' : 'Yes'}
            </button>
            <button
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="text-gray-500 hover:text-gray-600 text-sm"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
