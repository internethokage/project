import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddOccasionModalProps {
  onClose: () => void;
  onAdd: (occasion: { type: string; date: string; budget: number }) => void;
}

export function AddOccasionModal({ onClose, onAdd }: AddOccasionModalProps) {
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [budget, setBudget] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      type,
      date,
      budget: Number(budget),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-sky-950/45 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="aero-panel max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-sky-950 dark:text-sky-100">Add Occasion</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Occasion Type
              </label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g., Christmas 2024, Birthday"
                className="aero-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="aero-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="aero-input"
                required
                min="0"
                step="0.01"
              />
            </div>
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
              className="aero-button"
            >
              Add Occasion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
