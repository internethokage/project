import { supabase } from '../lib/supabase';
import type { Person, GiftIdea, Occasion } from '../types';
import type { Database } from '../types/supabase';

type DbOccasion = Database['public']['Tables']['occasions']['Row'];
type DbPerson = Database['public']['Tables']['people']['Row'];
type DbGift = Database['public']['Tables']['gifts']['Row'];

export const giftService = {
  async getOccasions(userId: string): Promise<Occasion[]> {
    console.log('Fetching occasions for user:', userId);
    const { data, error } = await supabase
      .from('occasions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching occasions:', error);
      throw error;
    }

    console.log('Fetched occasions:', data);
    return data.map(occasion => ({
      ...occasion,
      date: new Date(occasion.date)
    }));
  },

  async addOccasion(
    occasion: Omit<Occasion, 'id' | 'user_id' | 'created_at'>,
    userId: string
  ): Promise<Occasion> {
    console.log('Adding occasion:', { occasion, userId });
    
    const insertData = {
      type: occasion.type,
      date: occasion.date.toISOString(),
      budget: occasion.budget,
      user_id: userId
    };
    
    console.log('Insert data:', insertData);

    const { data, error } = await supabase
      .from('occasions')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error adding occasion:', error);
      throw error;
    }

    console.log('Added occasion:', data);
    return {
      ...data,
      date: new Date(data.date)
    };
  },

  async getPeople(userId: string): Promise<Person[]> {
    const { data, error } = await supabase
      .from('people')
      .select(`
        *,
        people_occasions!inner (
          occasions (*)
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(person => ({
      ...person,
      occasions: person.people_occasions.map((po: any) => ({
        ...po.occasions,
        date: new Date(po.occasions.date)
      }))
    }));
  },

  async addPerson(person: Omit<Person, 'id'>, userId: string) {
    const { data, error } = await supabase
      .from('people')
      .insert([{
        name: person.name,
        relationship: person.relationship,
        budget: person.budget,
        user_id: userId
      }])
      .select()
      .single();

    if (error) throw error;

    // Add occasion associations
    if (person.occasions.length > 0) {
      const { error: linkError } = await supabase
        .from('people_occasions')
        .insert(
          person.occasions.map(occasion => ({
            person_id: data.id,
            occasion_id: occasion.id
          }))
        );

      if (linkError) throw linkError;
    }

    return {
      ...data,
      occasions: person.occasions
    };
  },

  async getGifts(userId: string): Promise<GiftIdea[]> {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(gift => ({
      ...gift,
      personId: gift.person_id,
      dateAdded: new Date(gift.date_added),
      datePurchased: gift.date_purchased ? new Date(gift.date_purchased) : undefined,
      dateGiven: gift.date_given ? new Date(gift.date_given) : undefined
    }));
  },

  async addGift(gift: Omit<GiftIdea, 'id' | 'dateAdded'>, userId: string) {
    const { data, error } = await supabase
      .from('gifts')
      .insert([{
        person_id: gift.personId,
        title: gift.title,
        price: gift.price,
        url: gift.url,
        notes: gift.notes,
        status: gift.status,
        user_id: userId,
        date_added: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      dateAdded: new Date(data.date_added),
      datePurchased: data.date_purchased ? new Date(data.date_purchased) : undefined,
      dateGiven: data.date_given ? new Date(data.date_given) : undefined
    };
  },

  async updateGiftStatus(giftId: string, status: GiftIdea['status'], userId: string) {
    const updates: any = {
      status,
    };

    if (status === 'purchased') {
      updates.date_purchased = new Date().toISOString();
    } else if (status === 'given') {
      updates.date_given = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('gifts')
      .update(updates)
      .eq('id', giftId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 