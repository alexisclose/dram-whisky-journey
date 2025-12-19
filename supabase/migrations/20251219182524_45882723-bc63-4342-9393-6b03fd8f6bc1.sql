-- Create a public function to validate activation codes
-- Returns the set_code if valid, null if invalid
CREATE OR REPLACE FUNCTION public.validate_activation_code(_code text)
RETURNS TABLE (
  valid boolean,
  set_code text,
  name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true as valid,
    ac.set_code,
    ac.name
  FROM activation_codes ac
  WHERE ac.code = _code
    AND ac.is_active = true
  LIMIT 1;
  
  -- If no rows returned, return a false result
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, null::text, null::text;
  END IF;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.validate_activation_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_activation_code(text) TO authenticated;