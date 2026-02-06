import type { Person, GiftIdea, Occasion } from '../types';

const STORAGE_KEY = 'gift-tracker-data';

interface StorageData {
  people: Person[];
  gifts: GiftIdea[];
  occasions: Occasion[];
}

export function loadData(): StorageData {
  const data = localStorage.getItem(STORAGE_KEY);
  console.log('Raw data from localStorage:', data); // Debug log
  
  if (!data) {
    console.log('No data found in localStorage'); // Debug log
    return { people: [], gifts: [], occasions: [] };
  }
  
  try {
    const parsed = JSON.parse(data);
    console.log('Parsed data:', parsed); // Debug log

    // Handle the case where occasions might be undefined
    const occasions = Array.isArray(parsed.occasions) ? parsed.occasions : [];
    const people = Array.isArray(parsed.people) ? parsed.people : [];
    const gifts = Array.isArray(parsed.gifts) ? parsed.gifts : [];

    const processedData = {
      people: people.map((person: any) => ({
        ...person,
        occasions: (person.occasions || []).map((occ: any) => ({
          ...occ,
          date: new Date(occ.date)
        }))
      })),
      gifts: gifts.map((gift: any) => ({
        ...gift,
        dateAdded: new Date(gift.dateAdded),
        datePurchased: gift.datePurchased ? new Date(gift.datePurchased) : undefined,
        dateGiven: gift.dateGiven ? new Date(gift.dateGiven) : undefined,
      })),
      occasions: occasions.map((occasion: any) => ({
        ...occasion,
        date: new Date(occasion.date)
      })),
    };

    console.log('Processed data:', processedData); // Debug log
    return processedData;
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return { people: [], gifts: [], occasions: [] };
  }
}

export function saveData(data: StorageData): void {
  try {
    // Ensure we're not trying to save undefined or null
    const safeData = {
      people: data.people || [],
      gifts: data.gifts || [],
      occasions: data.occasions || []
    };
    
    const dataString = JSON.stringify(safeData);
    console.log('Saving data string:', dataString); // Debug log
    localStorage.setItem(STORAGE_KEY, dataString);
    
    // Verify the save
    const savedData = localStorage.getItem(STORAGE_KEY);
    console.log('Verified saved data:', savedData); // Debug log
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
}

// Helper function to clear all data (useful for testing/debugging)
export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
}