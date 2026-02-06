import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { AddPersonModal } from './AddPersonModal';
import type { Person, Gift, Occasion } from '../types';

interface OccasionDetailsProps {
  occasion: Occasion;
  people: Person[];
  gifts: Gift[];
  onBack: () => void;
  onAddPerson: (person: { name: string; relationship: string; budget: number }) => void;
  onSelectPerson: (person: Person) => void;
  onRemovePerson: (id: string) => void;
}

export function OccasionDetails({
  occasion,
  people = [],
  gifts = [],
  onBack,
  onAddPerson,
  onSelectPerson,
  onRemovePerson,
}: OccasionDetailsProps) {
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);

  const occasionPeople = people.filter(person =>
    gifts.some(gift => gift.person_id === person.id)
  );

  const handleAddPerson = async (person: { name: string; relationship: string; budget: number }) => {
    try {
      await onAddPerson(person);
      setShowAddPersonModal(false);
    } catch (error) {
      console.error('Error adding person:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {occasion.type}
        </h2>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">People</h3>
        <button
          onClick={() => setShowAddPersonModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Person
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {occasionPeople.map((person) => (
          <div
            key={person.id}
            className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectPerson(person)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  {person.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {person.relationship}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Budget: ${person.budget}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePerson(person.id);
                }}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddPersonModal && (
        <AddPersonModal
          onClose={() => setShowAddPersonModal(false)}
          onAdd={handleAddPerson}
        />
      )}
    </div>
  );
}
