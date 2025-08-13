-- Add intensity ratings to tasting notes
ALTER TABLE public.tasting_notes 
ADD COLUMN intensity_ratings JSONB DEFAULT '{}'::jsonb;