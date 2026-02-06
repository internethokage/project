import { useState, useEffect, useCallback } from 'react';
import type { Person, GiftIdea, Occasion } from '../types';
import { giftService } from '../services/giftService';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Person = Database['public']['Tables']['people']['Row'];
type Occasion = Database['public']['Tables']['occasions']['Row'];
type Gift = Database['public']['Tables']['gifts']['Row'];

export function useGiftTracker() {
  const [people, setPeople] = useState<Person[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setError('No user found');
        return;
      }

      const [peopleResponse, occasionsResponse, giftsResponse] = await Promise.all([
        supabase.from('people').select('*').eq('user_id', user.user.id),
        supabase.from('occasions').select('*').eq('user_id', user.user.id),
        supabase.from('gifts').select('*').eq('user_id', user.user.id)
      ]);

      if (peopleResponse.error) throw peopleResponse.error;
      if (occasionsResponse.error) throw occasionsResponse.error;
      if (giftsResponse.error) throw giftsResponse.error;

      setPeople(peopleResponse.data || []);
      setOccasions(occasionsResponse.data || []);
      setGifts(giftsResponse.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get current user
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        fetchData();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        fetchData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!people.length) return;

    const occasionsChannel = supabase.channel('occasions-changes');
    const peopleChannel = supabase.channel('people-changes');
    const giftsChannel = supabase.channel('gifts-changes');

    occasionsChannel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'occasions' },
        async () => {
          const newOccasions = await giftService.getOccasions(people[0].user_id);
          setOccasions(newOccasions);
        }
      )
      .subscribe();

    peopleChannel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'people' },
        async () => {
          const newPeople = await giftService.getPeople(people[0].user_id);
          setPeople(newPeople);
        }
      )
      .subscribe();

    giftsChannel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gifts' },
        async () => {
          const newGifts = await giftService.getGifts(people[0].user_id);
          setGifts(newGifts);
        }
      )
      .subscribe();

    return () => {
      occasionsChannel.unsubscribe();
      peopleChannel.unsubscribe();
      giftsChannel.unsubscribe();
    };
  }, [people]);

  const addOccasion = useCallback(async (occasion: Omit<Occasion, 'id' | 'user_id' | 'created_at'>) => {
    if (!people.length) {
      console.error('No people available');
      return;
    }
    try {
      console.log('Adding occasion:', { occasion, userId: people[0].user_id });
      const newOccasion = await giftService.addOccasion(occasion, people[0].user_id);
      console.log('Added occasion:', newOccasion);
      setOccasions(current => [...current, newOccasion]);
    } catch (err) {
      console.error('Error adding occasion:', err);
      setError(err instanceof Error ? err.message : 'Error adding occasion');
    }
  }, [people]);

  const addPerson = async (newPerson: Omit<Person, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('people')
        .insert([{ ...newPerson, user_id: user.user.id }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setPeople(prev => [...prev, data]);
        return data;
      }
    } catch (err) {
      console.error('Error adding person:', err);
      throw err;
    }
  };

  const deletePerson = async (id: string) => {
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPeople(prev => prev.filter(person => person.id !== id));
    } catch (err) {
      console.error('Error deleting person:', err);
      throw err;
    }
  };

  const deleteOccasion = async (id: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('No user found');

      const { error } = await supabase
        .from('occasions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.user.id);

      if (error) throw error;

      setOccasions(prev => prev.filter(occasion => occasion.id !== id));
      return Promise.resolve();
    } catch (err) {
      console.error('Error deleting occasion:', err);
      throw err;
    }
  };

  const addGift = useCallback(async (gift: Omit<GiftIdea, 'id' | 'dateAdded'>) => {
    if (!people.length) {
      console.error('No people available');
      return;
    }
    try {
      console.log('Adding gift:', { gift, userId: people[0].user_id });
      const newGift = await giftService.addGift(gift, people[0].user_id);
      console.log('Added gift:', newGift);
      setGifts(current => [...current, newGift]);
    } catch (err) {
      console.error('Error adding gift:', err);
      setError(err instanceof Error ? err.message : 'Error adding gift');
    }
  }, [people]);

  const removeGift = useCallback(async (giftId: string) => {
    if (!people.length) {
      console.error('No people available');
      return;
    }
    try {
      console.log('Removing gift:', { giftId, userId: people[0].user_id });
      await giftService.removeGift(giftId, people[0].user_id);
      setGifts(current => current.filter(gift => gift.id !== giftId));
    } catch (err) {
      console.error('Error removing gift:', err);
      setError(err instanceof Error ? err.message : 'Error removing gift');
    }
  }, [people]);

  const updateGiftStatus = useCallback(async (giftId: string, status: GiftIdea['status']) => {
    if (!people.length) {
      console.error('No people available');
      return;
    }
    try {
      console.log('Updating gift status:', { giftId, status, userId: people[0].user_id });
      await giftService.updateGiftStatus(giftId, status, people[0].user_id);
      setGifts(current => current.map(gift =>
        gift.id === giftId ? { ...gift, status } : gift
      ));
    } catch (err) {
      console.error('Error updating gift status:', err);
      setError(err instanceof Error ? err.message : 'Error updating gift status');
    }
  }, [people]);

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