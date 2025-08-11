-- Add set_code to whiskies and index
ALTER TABLE public.whiskies ADD COLUMN IF NOT EXISTS set_code text NOT NULL DEFAULT 'classic';
CREATE INDEX IF NOT EXISTS idx_whiskies_set_code ON public.whiskies (set_code);

-- Ensure existing rows have a value
UPDATE public.whiskies SET set_code = 'classic' WHERE set_code IS NULL;

-- Activation codes table
CREATE TABLE IF NOT EXISTS public.activation_codes (
  code text PRIMARY KEY,
  set_code text NOT NULL,
  name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Only allow selecting active codes (prevents reading inactive ones)
DROP POLICY IF EXISTS "Select active activation codes" ON public.activation_codes;
CREATE POLICY "Select active activation codes"
  ON public.activation_codes
  FOR SELECT
  USING (is_active = true);

-- No INSERT/UPDATE/DELETE policies (admins manage via SQL)

-- User sets table
CREATE TABLE IF NOT EXISTS public.user_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  set_code text NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_sets_user_set_unique UNIQUE (user_id, set_code)
);

ALTER TABLE public.user_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own sets" ON public.user_sets;
CREATE POLICY "Users can read their own sets"
  ON public.user_sets
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sets" ON public.user_sets;
CREATE POLICY "Users can insert their own sets"
  ON public.user_sets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sets" ON public.user_sets;
CREATE POLICY "Users can delete their own sets"
  ON public.user_sets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Seed two activation codes if they don't already exist
INSERT INTO public.activation_codes (code, set_code, name)
VALUES
  ('CLASSIC-2025', 'classic', 'Classic Tasting Set'),
  ('JPN-2025', 'japanese', 'Japanese Tasting Set')
ON CONFLICT (code) DO NOTHING;

-- Seed a few Japanese whiskies for the 'japanese' set if not present (upsert by name+distillery)
-- Create a helper unique index to avoid duplicates if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_whiskies_distillery_name'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uniq_whiskies_distillery_name ON public.whiskies (distillery, name)';
  END IF;
END $$;

-- Upserts
INSERT INTO public.whiskies (distillery, name, region, abv, lat, lng, set_code)
VALUES
  ('Suntory Yamazaki', 'Yamazaki 12 Year Old', 'Japan', 43, 34.894, 135.676, 'japanese'),
  ('Suntory Hakushu', 'Hakushu 12 Year Old', 'Japan', 43, 35.8469, 138.3376, 'japanese'),
  ('Nikka', 'Yoichi Single Malt', 'Japan', 45, 43.197, 141.516, 'japanese'),
  ('Nikka', 'Miyagikyo Single Malt', 'Japan', 45, 38.319, 140.786, 'japanese'),
  ('Chichibu', 'The First Ten', 'Japan', 50.5, 35.991, 139.098, 'japanese'),
  ('Mars Shinshu', 'Komagatake Single Malt', 'Japan', 48, 35.731, 137.965, 'japanese')
ON CONFLICT (distillery, name) DO UPDATE SET
  region = EXCLUDED.region,
  abv = EXCLUDED.abv,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  set_code = EXCLUDED.set_code;