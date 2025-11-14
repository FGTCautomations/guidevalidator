// TypeScript types for GuideValidator Ads System

export type AdType = 'banner' | 'native_card' | 'partner_tile';

export type AdPlacement = 'homepage_mid' | 'listings' | 'sidebar' | 'footer';

export interface Ad {
  id: number;
  advertiser_name: string;
  ad_type: AdType;
  placement: AdPlacement[];
  target_url?: string;
  image_url?: string;
  headline?: string;
  description?: string;
  cta_label?: string;
  country_filter?: string[]; // ISO2 country codes
  keywords?: string[];
  start_at: string; // ISO8601 timestamp
  end_at: string; // ISO8601 timestamp
  is_active: boolean;
  weight: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SponsoredListing {
  id: number;
  ad_id: number;
  list_context: 'guides' | 'dmcs' | 'transport' | 'agencies';
  insert_after: number; // Position in list (e.g., 3, 10)
}

export interface AdClick {
  id?: number;
  ad_id: number;
  clicked_at?: string;
  country?: string;
  page?: string;
  ip?: string;
}

export interface AdSelectionParams {
  placement: AdPlacement;
  country?: string;
  listContext?: 'guides' | 'dmcs' | 'transport' | 'agencies';
}

export interface AdSlotProps {
  placement: AdPlacement;
  country?: string;
  listContext?: 'guides' | 'dmcs' | 'transport' | 'agencies';
  insertAfter?: number;
  className?: string;
}

export interface CreateAdInput {
  advertiser_name: string;
  ad_type: AdType;
  placement: AdPlacement[];
  target_url?: string;
  image_url?: string;
  headline?: string;
  description?: string;
  cta_label?: string;
  country_filter?: string[];
  keywords?: string[];
  start_at: string;
  end_at: string;
  is_active?: boolean;
  weight?: number;
  list_context?: 'guides' | 'dmcs' | 'transport' | 'agencies';
}

export interface UpdateAdInput extends Partial<CreateAdInput> {
  id: number;
}
