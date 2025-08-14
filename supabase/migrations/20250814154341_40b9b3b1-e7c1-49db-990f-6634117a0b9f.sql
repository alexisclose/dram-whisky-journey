-- Add new columns to whiskies table for rich whisky dossiers
ALTER TABLE public.whiskies 
ADD COLUMN expert_nose TEXT,
ADD COLUMN expert_palate TEXT, 
ADD COLUMN expert_finish TEXT,
ADD COLUMN description TEXT,
ADD COLUMN image_url TEXT;