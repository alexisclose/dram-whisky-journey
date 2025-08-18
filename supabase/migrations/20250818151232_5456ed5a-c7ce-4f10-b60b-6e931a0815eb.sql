-- Add precise coordinates for distilleries
ALTER TABLE public.whiskies 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add index for geographic queries
CREATE INDEX idx_whiskies_coordinates ON public.whiskies(latitude, longitude);