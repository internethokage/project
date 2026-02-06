export type { Database, Occasion, Person, Gift } from './supabase';

export type GiftStatus = 'idea' | 'purchased' | 'given';

export type LLMProvider = 'anthropic' | 'openai' | 'custom';

export interface LLMConfig {
  id: string;
  provider: LLMProvider;
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  isActive: boolean;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GiftSuggestion {
  title: string;
  description: string;
  estimatedPrice: number;
  reason: string;
}
