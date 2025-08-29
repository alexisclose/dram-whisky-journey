-- Fix the admin policy for media_library to include WITH CHECK for INSERT operations
DROP POLICY IF EXISTS "Admins can manage all media" ON public.media_library;

-- Create separate policies for different operations
CREATE POLICY "Admins can view all media" 
ON public.media_library 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert media" 
ON public.media_library 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update media" 
ON public.media_library 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete media" 
ON public.media_library 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));