-- Create a function to insert media with explicit admin check
CREATE OR REPLACE FUNCTION public.admin_insert_media(
  p_filename TEXT,
  p_original_name TEXT,
  p_file_path TEXT,
  p_bucket_name TEXT,
  p_file_size INTEGER,
  p_mime_type TEXT,
  p_category TEXT,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Check if the user is admin
  IF NOT has_role(p_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'User % does not have admin privileges', p_user_id;
  END IF;
  
  -- Insert the media record
  INSERT INTO public.media_library (
    filename,
    original_name,
    file_path,
    bucket_name,
    file_size,
    mime_type,
    category,
    uploaded_by
  ) VALUES (
    p_filename,
    p_original_name,
    p_file_path,
    p_bucket_name,
    p_file_size,
    p_mime_type,
    p_category,
    p_user_id
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;