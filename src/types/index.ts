export interface Occasion {
  id: string;
  type: string;
  date: Date;
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
  occasions: Occasion[];
}

export interface GiftIdea {
  id: string;
  personId: string;
  title: string;
  price: number;
  url?: string | null;
  notes?: string | null;
  status: 'idea' | 'purchased' | 'given';
  dateAdded: Date;
  datePurchased?: Date;
  dateGiven?: Date;
  user_id: string;
}