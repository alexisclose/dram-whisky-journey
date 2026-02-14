
-- Remove public access to media_library table - only admins need direct access
-- Public users access media via image URLs in whiskies table, not this table
DROP POLICY IF EXISTS "Public can view active media" ON public.media_library;
