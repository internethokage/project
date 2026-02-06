import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddPersonModalProps {
  onClose: () => void;
  onAdd: (person: { name: string; relationship: string; budget: number }) => void;
}

export function AddPersonModal({ onClose, onAdd }: AddPersonModalProps) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [budget, setBudget] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      relationship,
      budget: Number(budget),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Person</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Relationship
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Budget
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
