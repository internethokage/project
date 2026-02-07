import React from 'react';
import { Gift as GiftIcon, DollarSign, Trash2 } from 'lucide-react';
import type { Person, Gift } from '../types';
import { calculateSpentAmount } from '../utils/calculations';

interface PersonCardProps {
  person: Person;
  gifts: Gift[];
  onSelect: (person: Person) => void;
  onRemove: (personId: string) => void;
}

export function PersonCard({ person, gifts, onSelect, onRemove }: PersonCardProps) {
  const personGifts = gifts.filter(gift => gift.person_id === person.id);
  const spentAmount = calculateSpentAmount(personGifts);
  const giftIdeasCount = personGifts.length;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this person and all their gift ideas?')) {
      onRemove(person.id);
    }
  };

  return (
    <div
      onClick={() => onSelect(person)}
      className="aero-panel p-4 cursor-pointer hover:brightness-105 transition"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-sky-950 dark:text-sky-100">{person.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{person.relationship}</span>
          <button
            onClick={handleRemove}
            className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Remove person"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-1">
          <GiftIcon size={16} />
          <span>{giftIdeasCount} ideas</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign size={16} />
          <span>${spentAmount} / ${person.budget}</span>
        </div>
      </div>
    </div>
  );
}
