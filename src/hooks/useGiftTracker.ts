import { useState, useEffect, useCallback } from 'react';
import type { Person, Gift, Occasion, GiftStatus } from '../types';
import { giftService } from '../services/giftService';
import { getToken } from '../lib/api';

export function useGiftTracker() {
  const [people, setPeople] = useState<Person[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [peopleData, occasionsData, giftsData] = await Promise.all([
        giftService.getPeople(),
        giftService.getOccasions(),
        giftService.getGifts(),
      ]);

      setPeople(peopleData);
      setOccasions(occasionsData);
      setGifts(giftsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addOccasion = useCallback(async (occasion: { type: string; date: string; budget: number }) => {
    try {
      const newOccasion = await giftService.addOccasion(occasion);
      setOccasions(prev => [...prev, newOccasion]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding occasion');
    }
  }, []);

  const deleteOccasion = useCallback(async (id: string) => {
    try {
      await giftService.deleteOccasion(id);
      setOccasions(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting occasion');
      throw err;
    }
  }, []);

  const addPerson = useCallback(async (person: { name: string; relationship: string; budget: number }) => {
    try {
      const newPerson = await giftService.addPerson(person);
      setPeople(prev => [...prev, newPerson]);
      return newPerson;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding person');
      throw err;
    }
  }, []);

  const deletePerson = useCallback(async (id: string) => {
    try {
      await giftService.deletePerson(id);
      setPeople(prev => prev.filter(p => p.id !== id));
      // Remove gifts for this person from local state
      setGifts(prev => prev.filter(g => g.person_id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting person');
      throw err;
    }
  }, []);

  const addGift = useCallback(async (gift: { person_id: string; title: string; price: number; url?: string | null; notes?: string | null; status: GiftStatus }) => {
    try {
      const newGift = await giftService.addGift(gift);
      setGifts(prev => [...prev, newGift]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding gift');
    }
  }, []);

  const removeGift = useCallback(async (giftId: string) => {
    try {
      await giftService.removeGift(giftId);
      setGifts(prev => prev.filter(g => g.id !== giftId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing gift');
    }
  }, []);

  const updateGiftStatus = useCallback(async (giftId: string, status: GiftStatus) => {
    try {
      const updated = await giftService.updateGiftStatus(giftId, status);
      setGifts(prev => prev.map(g => g.id === giftId ? updated : g));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating gift status');
    }
  }, []);

  return {
    people,
    occasions,
    gifts,
    loading,
    error,
    addPerson,
    deletePerson,
    deleteOccasion,
    addGift,
    removeGift,
    updateGiftStatus,
    addOccasion,
    fetchData,
  };
}
