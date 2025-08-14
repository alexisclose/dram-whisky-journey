-- Add new columns for the updated CSV format
ALTER TABLE public.whiskies 
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS region_location text,
  ADD COLUMN IF NOT EXISTS overview text,
  ADD COLUMN IF NOT EXISTS expert_score_fruit integer,
  ADD COLUMN IF NOT EXISTS expert_score_floral integer,
  ADD COLUMN IF NOT EXISTS expert_score_spice integer,
  ADD COLUMN IF NOT EXISTS expert_score_smoke integer,
  ADD COLUMN IF NOT EXISTS expert_score_oak integer,
  ADD COLUMN IF NOT EXISTS pairs_well_with_a text,
  ADD COLUMN IF NOT EXISTS pairs_well_with_b text,
  ADD COLUMN IF NOT EXISTS pairs_well_with_c text;

-- Remove columns that are no longer needed for the new format
ALTER TABLE public.whiskies 
  DROP COLUMN IF EXISTS lat,
  DROP COLUMN IF EXISTS lng,
  DROP COLUMN IF EXISTS abv,
  DROP COLUMN IF EXISTS expert_nose,
  DROP COLUMN IF EXISTS expert_palate,
  DROP COLUMN IF EXISTS expert_finish,
  DROP COLUMN IF EXISTS description;