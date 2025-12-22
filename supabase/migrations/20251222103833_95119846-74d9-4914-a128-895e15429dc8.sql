-- Create the junction table for many-to-many relationship
CREATE TABLE public.whisky_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whisky_id uuid NOT NULL REFERENCES public.whiskies(id) ON DELETE CASCADE,
  set_code text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(whisky_id, set_code)
);

-- Enable RLS
ALTER TABLE public.whisky_sets ENABLE ROW LEVEL SECURITY;

-- Anyone can read whisky_sets (public data)
CREATE POLICY "Anyone can read whisky_sets"
ON public.whisky_sets
FOR SELECT
USING (true);

-- Only admins can manage whisky_sets
CREATE POLICY "Admins can insert whisky_sets"
ON public.whisky_sets
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update whisky_sets"
ON public.whisky_sets
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete whisky_sets"
ON public.whisky_sets
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_whisky_sets_whisky_id ON public.whisky_sets(whisky_id);
CREATE INDEX idx_whisky_sets_set_code ON public.whisky_sets(set_code);

-- Migrate existing data from whiskies.set_code to the junction table
INSERT INTO public.whisky_sets (whisky_id, set_code, display_order)
SELECT id, set_code, 0
FROM public.whiskies
WHERE set_code IS NOT NULL AND set_code != ''
ON CONFLICT (whisky_id, set_code) DO NOTHING;