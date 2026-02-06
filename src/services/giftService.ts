import { supabase } from '../lib/supabase';
import type { Occasion, Person, Gift, GiftStatus } from '../types';

export const giftService = {
  async getOccasions(userId: string): Promise<Occasion[]> {
    const { data, error } = await supabase
      .from('occasions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async addOccasion(
    occasion: { type: string; date: string; budget: number },
    userId: string
  ): Promise<Occasion> {
    const { data, error } = await supabase
      .from('occasions')
      .insert([{ ...occasion, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteOccasion(occasionId: string, userId: string) {
    const { error } = await supabase
      .from('occasions')
      .delete()
      .eq('id', occasionId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getPeople(userId: string): Promise<Person[]> {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  async addPerson(
    person: { name: string; relationship: string; budget: number },
    userId: string
  ): Promise<Person> {
    const { data, error } = await supabase
      .from('people')
      .insert([{ ...person, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePerson(personId: string, userId: string) {
    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', personId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getGifts(userId: string): Promise<Gift[]> {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  async addGift(
    gift: { person_id: string; title: string; price: number; url?: string | null; notes?: string | null; status: GiftStatus },
    userId: string
  ): Promise<Gift> {
    const { data, error } = await supabase
      .from('gifts')
      .insert([{
        ...gift,
        user_id: userId,
        date_added: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGiftStatus(giftId: string, status: GiftStatus, userId: string): Promise<Gift> {
    const updates: Record<string, string> = { status };

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
  },

  async removeGift(giftId: string, userId: string) {
    const { error } = await supabase
      .from('gifts')
      .delete()
      .eq('id', giftId)
      .eq('user_id', userId);

    if (error) throw error;
  }
};
