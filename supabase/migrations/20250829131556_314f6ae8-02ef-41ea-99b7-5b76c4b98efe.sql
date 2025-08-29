-- Check if uploaded_by should be NOT NULL and update the constraint
ALTER TABLE public.media_library 
ALTER COLUMN uploaded_by SET NOT NULL;

-- Create a simple test function to check user admin status
CREATE OR REPLACE FUNCTION public.check_user_admin_status()
RETURNS TABLE(user_id UUID, has_admin_role BOOLEAN, roles TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT 
    current_user_id,
    has_role(current_user_id, 'admin'::app_role) as has_admin_role,
    ARRAY(SELECT role::text FROM user_roles WHERE user_id = current_user_id) as roles;
END;
$function$;