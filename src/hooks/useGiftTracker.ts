import { useState, useEffect, useCallback, useRef } from 'react';
import type { Person, Gift, Occasion, GiftStatus } from '../types';
import { giftService } from '../services/giftService';
import { supabase } from '../lib/supabase';

export function useGiftTracker() {
  const [people, setPeople] = useState<Person[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  const getUserId = useCallback(async (): Promise<string | null> => {
    if (userIdRef.current) return userIdRef.current;
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      userIdRef.current = user.id;
    }
    return user?.id ?? null;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const userId = await getUserId();
      if (!userId) {
        setError('No user found');
        return;
      }

      const [peopleData, occasionsData, giftsData] = await Promise.all([
        giftService.getPeople(userId),
        giftService.getOccasions(userId),
        giftService.getGifts(userId)
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
  }, [getUserId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        userIdRef.current = session.user.id;
        fetchData();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        userIdRef.current = session.user.id;
        fetchData();
      } else {
        userIdRef.current = null;
        setPeople([]);
        setOccasions([]);
        setGifts([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchData]);

  // Real-time subscriptions
  useEffect(() => {
    const userId = userIdRef.current;
    if (!userId) return;

    const occasionsChannel = supabase.channel('occasions-changes');
    const peopleChannel = supabase.channel('people-changes');
    const giftsChannel = supabase.channel('gifts-changes');

    occasionsChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'occasions' }, async () => {
        const data = await giftService.getOccasions(userId);
        setOccasions(data);
      })
      .subscribe();

    peopleChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'people' }, async () => {
        const data = await giftService.getPeople(userId);
        setPeople(data);
      })
      .subscribe();

    giftsChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gifts' }, async () => {
        const data = await giftService.getGifts(userId);
        setGifts(data);
      })
      .subscribe();

    return () => {
      occasionsChannel.unsubscribe();
      peopleChannel.unsubscribe();
      giftsChannel.unsubscribe();
    };
  }, [people.length > 0 ? userIdRef.current : null]);

  const addOccasion = useCallback(async (occasion: { type: string; date: string; budget: number }) => {
    const userId = await getUserId();
    if (!userId) return;
    try {
      const newOccasion = await giftService.addOccasion(occasion, userId);
      setOccasions(prev => [...prev, newOccasion]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding occasion');
    }
  }, [getUserId]);

  const deleteOccasion = useCallback(async (id: string) => {
    const userId = await getUserId();
    if (!userId) return;
    try {
      await giftService.deleteOccasion(id, userId);
      setOccasions(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting occasion');
      throw err;
    }
  }, [getUserId]);

  const addPerson = useCallback(async (person: { name: string; relationship: string; budget: number }) => {
    const userId = await getUserId();
    if (!userId) throw new Error('No user found');
    try {
      const newPerson = await giftService.addPerson(person, userId);
      setPeople(prev => [...prev, newPerson]);
      return newPerson;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding person');
      throw err;
    }
  }, [getUserId]);

  const deletePerson = useCallback(async (id: string) => {
    const userId = await getUserId();
    if (!userId) return;
    try {
      await giftService.deletePerson(id, userId);
      setPeople(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting person');
      throw err;
    }
  }, [getUserId]);

  const addGift = useCallback(async (gift: { person_id: string; title: string; price: number; url?: string | null; notes?: string | null; status: GiftStatus }) => {
    const userId = await getUserId();
    if (!userId) return;
    try {
      const newGift = await giftService.addGift(gift, userId);
      setGifts(prev => [...prev, newGift]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding gift');
    }
  }, [getUserId]);

  const removeGift = useCallback(async (giftId: string) => {
    const userId = await getUserId();
    if (!userId) return;
    try {
      await giftService.removeGift(giftId, userId);
      setGifts(prev => prev.filter(g => g.id !== giftId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing gift');
    }
  }, [getUserId]);

  const updateGiftStatus = useCallback(async (giftId: string, status: GiftStatus) => {
    const userId = await getUserId();
    if (!userId) return;
    try {
      const updated = await giftService.updateGiftStatus(giftId, status, userId);
      setGifts(prev => prev.map(g => g.id === giftId ? updated : g));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating gift status');
    }
  }, [getUserId]);

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
