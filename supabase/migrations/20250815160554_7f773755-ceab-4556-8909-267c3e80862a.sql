-- Create user_whiskies table for user-submitted whiskies
CREATE TABLE public.user_whiskies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  distillery TEXT NOT NULL,
  region TEXT NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  review_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  flavors TEXT[] NOT NULL DEFAULT '{}',
  intensity_ratings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_whiskies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all user whiskies" 
ON public.user_whiskies 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own whiskies" 
ON public.user_whiskies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whiskies" 
ON public.user_whiskies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own whiskies" 
ON public.user_whiskies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_whiskies_updated_at
BEFORE UPDATE ON public.user_whiskies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();