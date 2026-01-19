-- Add guest_session_id column to tasting_notes table
ALTER TABLE public.tasting_notes 
ADD COLUMN guest_session_id UUID NULL;

-- Add constraint: record must have EITHER user_id OR guest_session_id (but not neither)
-- First, make user_id nullable (it currently has NOT NULL based on insert requirements)
ALTER TABLE public.tasting_notes 
ALTER COLUMN user_id DROP NOT NULL;

-- Add check constraint to ensure exactly one of user_id or guest_session_id is set
ALTER TABLE public.tasting_notes 
ADD CONSTRAINT check_user_or_guest 
CHECK (
  (user_id IS NOT NULL AND guest_session_id IS NULL) OR 
  (user_id IS NULL AND guest_session_id IS NOT NULL)
);

-- Create index for faster guest session lookups
CREATE INDEX idx_tasting_notes_guest_session ON public.tasting_notes(guest_session_id) 
WHERE guest_session_id IS NOT NULL;

-- Create the migrate_guest_data RPC function
CREATE OR REPLACE FUNCTION public.migrate_guest_data(guest_id UUID, new_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  migrated_count INTEGER;
BEGIN
  -- Update all tasting_notes where guest_session_id matches
  UPDATE public.tasting_notes
  SET 
    user_id = new_user_id,
    guest_session_id = NULL
  WHERE guest_session_id = guest_id;
  
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  
  RETURN migrated_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.migrate_guest_data(UUID, UUID) TO authenticated;

-- Update RLS policies to allow guest access
-- Drop existing policies first, then recreate with guest support
DROP POLICY IF EXISTS "Users can view their own notes" ON public.tasting_notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.tasting_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.tasting_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.tasting_notes;

-- Policy: Users can view their own notes OR guests can view by session ID (passed via header)
CREATE POLICY "Users and guests can view notes" 
ON public.tasting_notes 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (guest_session_id IS NOT NULL AND guest_session_id::text = current_setting('request.headers', true)::json->>'x-guest-session-id')
);

-- Policy: Allow insert for authenticated users OR via anon key with guest session
CREATE POLICY "Users and guests can create notes" 
ON public.tasting_notes 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (guest_session_id IS NOT NULL AND user_id IS NULL)
);

-- Policy: Allow update for authenticated users OR via anon key with matching guest session
CREATE POLICY "Users and guests can update notes" 
ON public.tasting_notes 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (guest_session_id IS NOT NULL AND guest_session_id::text = current_setting('request.headers', true)::json->>'x-guest-session-id')
);

-- Policy: Allow delete for authenticated users OR via anon key with matching guest session
CREATE POLICY "Users and guests can delete notes" 
ON public.tasting_notes 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (guest_session_id IS NOT NULL AND guest_session_id::text = current_setting('request.headers', true)::json->>'x-guest-session-id')
);