import React from 'react';
import { Package, Gift as GiftIcon, ExternalLink, Trash2 } from 'lucide-react';
import type { Gift, GiftStatus } from '../types';

interface GiftListProps {
  gifts: Gift[];
  onUpdateStatus: (giftId: string, status: GiftStatus) => void;
  onRemove: (giftId: string) => void;
}

export function GiftList({ gifts, onUpdateStatus, onRemove }: GiftListProps) {
  const handleRemove = (giftId: string) => {
    if (confirm('Are you sure you want to remove this gift idea?')) {
      onRemove(giftId);
    }
  };

  return (
    <div className="space-y-4">
      {gifts.map((gift) => (
        <div key={gift.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between">
            <div>
              <h4 className="text-gray-900 dark:text-white font-medium">{gift.title}</h4>
              <p className="text-sky-700 dark:text-sky-300">${gift.price}</p>
            </div>
            <div className="flex gap-2">
              {gift.url && (
                <a
                  href={gift.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  title="View product page"
                  aria-label="Open product page in new tab"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
              <button
                onClick={() => onUpdateStatus(gift.id, 'purchased')}
                className={`p-2 rounded-full ${
                  gift.status === 'purchased' || gift.status === 'given'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={gift.status === 'purchased' || gift.status === 'given' ? 'Already purchased' : 'Mark as purchased'}
                aria-label={gift.status === 'purchased' || gift.status === 'given' ? 'Gift is purchased' : 'Mark gift as purchased'}
              >
                <Package className="w-4 h-4" />
              </button>
              <button
                onClick={() => onUpdateStatus(gift.id, 'given')}
                className={`p-2 rounded-full ${
                  gift.status === 'given'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={gift.status === 'given' ? 'Already given' : 'Mark as given'}
                aria-label={gift.status === 'given' ? 'Gift is given' : 'Mark gift as given'}
              >
                <GiftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleRemove(gift.id)}
                className="p-2 rounded-full text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Remove gift idea"
                aria-label="Remove this gift idea"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {gift.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{gift.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}
