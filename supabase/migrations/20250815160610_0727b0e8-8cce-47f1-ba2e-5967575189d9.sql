-- Fix security warning - Add policy to activation_codes table which has RLS enabled but no policies
CREATE POLICY "Only admins can view activation codes" 
ON public.activation_codes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can manage activation codes" 
ON public.activation_codes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));