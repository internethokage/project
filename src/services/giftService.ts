import { api } from '../lib/api';
import type { Occasion, Person, Gift, GiftStatus } from '../types';

export const giftService = {
  async getOccasions(): Promise<Occasion[]> {
    return api.get<Occasion[]>('/api/occasions');
  },

  async addOccasion(occasion: { type: string; date: string; budget: number }): Promise<Occasion> {
    return api.post<Occasion>('/api/occasions', occasion);
  },

  async deleteOccasion(occasionId: string): Promise<void> {
    await api.delete(`/api/occasions/${occasionId}`);
  },

  async getPeople(): Promise<Person[]> {
    return api.get<Person[]>('/api/people');
  },

  async addPerson(person: { name: string; relationship: string; budget: number; notes?: string | null }): Promise<Person> {
    return api.post<Person>('/api/people', person);
  },

  async deletePerson(personId: string): Promise<void> {
    await api.delete(`/api/people/${personId}`);
  },

  async getGifts(): Promise<Gift[]> {
    return api.get<Gift[]>('/api/gifts');
  },

  async addGift(gift: { person_id: string; title: string; price: number; url?: string | null; notes?: string | null; status: GiftStatus }): Promise<Gift> {
    return api.post<Gift>('/api/gifts', gift);
  },

  async updateGiftStatus(giftId: string, status: GiftStatus): Promise<Gift> {
    return api.patch<Gift>(`/api/gifts/${giftId}/status`, { status });
  },

  async removeGift(giftId: string): Promise<void> {
    await api.delete(`/api/gifts/${giftId}`);
  },
};
