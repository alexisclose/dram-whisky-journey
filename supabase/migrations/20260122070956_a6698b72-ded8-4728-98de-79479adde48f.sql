-- Drop the duplicate/conflicting INSERT policy
DROP POLICY IF EXISTS "Users can insert their own notes" ON public.tasting_notes;

-- Recreate the comprehensive insert policy as PERMISSIVE
DROP POLICY IF EXISTS "Users and guests can create notes" ON public.tasting_notes;

CREATE POLICY "Users and guests can create notes" 
ON public.tasting_notes 
FOR INSERT 
WITH CHECK (
  -- Authenticated users: must match their user_id
  ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id))
  OR 
  -- Guest users: must have guest_session_id and no user_id
  ((guest_session_id IS NOT NULL) AND (user_id IS NULL))
);

-- Also recreate the SELECT policy to be simpler and PERMISSIVE for reading public data
DROP POLICY IF EXISTS "Users can read their own notes" ON public.tasting_notes;

-- The "Users and guests can view notes" policy already handles viewing