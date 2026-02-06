export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      occasions: {
        Row: {
          id: string
          type: string
          date: string
          budget: number
          user_id: string
          created_at: string
        }
        Insert: Omit<Occasion, 'id' | 'created_at'>
        Update: Partial<Occasion>
      }
      people: {
        Row: {
          id: string
          name: string
          relationship: string
          budget: number
          user_id: string
          created_at: string
        }
        Insert: Omit<Person, 'id' | 'created_at'>
        Update: Partial<Person>
      }
      people_occasions: {
        Row: {
          person_id: string
          occasion_id: string
        }
        Insert: {
          person_id: string
          occasion_id: string
        }
        Update: {
          person_id?: string
          occasion_id?: string
        }
      }
      gifts: {
        Row: {
          id: string
          person_id: string
          title: string
          price: number
          url: string | null
          notes: string | null
          status: 'idea' | 'purchased' | 'given'
          date_added: string
          date_purchased: string | null
          date_given: string | null
          user_id: string
        }
        Insert: Omit<Gift, 'id' | 'created_at'>
        Update: Partial<Gift>
      }
    }
  }
}

export type Occasion = Database['public']['Tables']['occasions']['Row']
export type Person = Database['public']['Tables']['people']['Row']
export type Gift = Database['public']['Tables']['gifts']['Row'] 