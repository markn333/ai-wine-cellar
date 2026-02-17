export type WineType = 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'fortified';

export interface Wine {
  id: string;
  name: string;
  producer: string;
  vintage?: number;
  type: WineType;
  country: string;
  region?: string;
  grape_variety?: string[];
  
  // Purchase info
  purchase_date?: string;
  purchase_price?: number;
  purchase_location?: string;
  
  // Storage
  cellar_location?: string;
  cellar_id?: string;
  position_row?: number;
  position_column?: number;
  quantity: number;
  
  // Drinking window
  drink_from?: string;
  drink_to?: string;
  
  // Additional info
  bottle_size?: number; // ml
  alcohol_content?: number; // %
  image_url?: string;
  notes?: string;
  
  created_at: string;
  updated_at: string;
}

export interface TastingNote {
  id: string;
  wine_id: string;
  tasted_at: string;
  rating: number; // 1-5
  
  // Tasting details
  appearance?: string;
  aroma?: string;
  taste?: string;
  finish?: string;
  
  // Pairing
  food_pairing?: string;
  
  notes?: string;
  images?: string[];
  
  created_at: string;
}

export interface DrinkingRecord {
  id: string;
  wine_id: string;
  quantity: number;
  drunk_at: string;
  occasion?: string;
  notes?: string;
  created_at: string;
}

export interface WineImage {
  id: string;
  wine_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Cellar {
  id: string;
  name: string;
  description?: string;
  rows: number;
  columns: number;
  layout_config?: any; // JSON configuration for custom layouts
  created_at: string;
  updated_at: string;
}

export interface CellarStats {
  total_bottles: number;
  total_value: number;
  by_type: Record<WineType, number>;
  by_country: Record<string, number>;
  ready_to_drink: number;
  past_prime: number;
}
