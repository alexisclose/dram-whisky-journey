-- Create media library table for better image organization
CREATE TABLE public.media_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  bucket_name TEXT NOT NULL DEFAULT 'whisky-images',
  file_size INTEGER,
  mime_type TEXT,
  alt_text TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active media" 
ON public.media_library 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all media" 
ON public.media_library 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_media_library_updated_at
BEFORE UPDATE ON public.media_library
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_media_library_category ON public.media_library(category);
CREATE INDEX idx_media_library_tags ON public.media_library USING GIN(tags);
CREATE INDEX idx_media_library_bucket ON public.media_library(bucket_name);
CREATE INDEX idx_media_library_active ON public.media_library(is_active);

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_media_usage(_media_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.media_library 
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE id = _media_id;
END;
$function$;