export interface Occasion {
  id: string;
  type: string;
  date: string;
  budget: number;
  user_id: string;
  created_at: string;
}

export interface Person {
  id: string;
  name: string;
  relationship: string;
  budget: number;
  user_id: string;
  created_at: string;
}

export interface Gift {
  id: string;
  person_id: string;
  title: string;
  price: number;
  url: string | null;
  notes: string | null;
  status: 'idea' | 'purchased' | 'given';
  date_added: string;
  date_purchased: string | null;
  date_given: string | null;
  user_id: string;
}

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
