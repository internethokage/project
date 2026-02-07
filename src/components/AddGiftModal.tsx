import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { GiftStatus } from '../types';

interface AddGiftModalProps {
  personId: string;
  onClose: () => void;
  onAdd: (gift: { person_id: string; title: string; price: number; url?: string | null; notes?: string | null; status: GiftStatus }) => void;
}

export function AddGiftModal({ personId, onClose, onAdd }: AddGiftModalProps) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      person_id: personId,
      title,
      price: Number(price),
      url: url || null,
      notes: notes || null,
      status: 'idea',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-sky-950/45 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="aero-panel p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Gift Idea</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gift Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="aero-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="aero-input"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL (optional)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="aero-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="aero-input"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Gift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
