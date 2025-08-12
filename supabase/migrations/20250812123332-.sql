-- Restrict public access to activation_codes and add secure activation RPC
-- 1) Drop permissive SELECT policy
DROP POLICY IF EXISTS "Select active activation codes" ON public.activation_codes;

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- 2) Create SECURITY DEFINER function to activate with code without exposing table
CREATE OR REPLACE FUNCTION public.activate_with_code(_code text)
RETURNS TABLE(set_code text, name text, activated boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_code RECORD;
  v_inserted boolean := false;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT ac.set_code, ac.name, ac.is_active
  INTO v_code
  FROM public.activation_codes ac
  WHERE ac.code = _code
  LIMIT 1;

  IF v_code IS NULL OR v_code.is_active = false THEN
    RAISE EXCEPTION 'Invalid or inactive code';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_sets us
    WHERE us.user_id = v_user AND us.set_code = v_code.set_code
  ) THEN
    INSERT INTO public.user_sets(user_id, set_code)
    VALUES (v_user, v_code.set_code);
    v_inserted := true;
  END IF;

  set_code := v_code.set_code;
  name := v_code.name;
  activated := v_inserted;
  RETURN NEXT;
END;
$$;

-- 3) Do NOT re-add any SELECT policy on activation_codes so it remains non-readable by clients.
-- All access should go through the security definer RPC above.
