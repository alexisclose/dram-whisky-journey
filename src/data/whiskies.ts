export type Whisky = {
  id: string;
  distillery: string;
  name: string;
  region: string;
  location?: string;
  region_location?: string;
  image_url?: string;
  overview?: string;
  expert_score_fruit?: number;
  expert_score_floral?: number;
  expert_score_spice?: number;
  expert_score_smoke?: number;
  expert_score_oak?: number;
  pairs_well_with_a?: string;
  pairs_well_with_b?: string;
  pairs_well_with_c?: string;
  set_code: string;
  created_at: string;
};

export const WHISKIES: Whisky[] = [];
