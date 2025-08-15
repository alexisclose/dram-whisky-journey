-- Create storage bucket for user whisky images
INSERT INTO storage.buckets (id, name, public) VALUES ('user-whisky-images', 'user-whisky-images', true);

-- Create policies for user whisky image uploads
CREATE POLICY "Anyone can view user whisky images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-whisky-images');

CREATE POLICY "Authenticated users can upload their whisky images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-whisky-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own whisky images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user-whisky-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own whisky images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user-whisky-images' AND auth.uid() IS NOT NULL);