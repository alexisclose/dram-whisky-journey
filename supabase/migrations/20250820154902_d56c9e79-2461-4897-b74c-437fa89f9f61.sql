-- Add additional profile fields for enhanced signup
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN country TEXT,
ADD COLUMN agreed_to_terms BOOLEAN DEFAULT false,
ADD COLUMN agreed_to_privacy BOOLEAN DEFAULT false;

-- Update the handle_new_user function to handle OAuth and additional fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    username, 
    first_name, 
    last_name, 
    country,
    agreed_to_terms,
    agreed_to_privacy
  )
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'display_name', 
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'username', 
      new.email
    ),
    COALESCE(
      new.raw_user_meta_data->>'username', 
      split_part(new.email, '@', 1)
    ),
    COALESCE(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'given_name'),
    COALESCE(new.raw_user_meta_data->>'last_name', new.raw_user_meta_data->>'family_name'),
    new.raw_user_meta_data->>'country',
    COALESCE((new.raw_user_meta_data->>'agreed_to_terms')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'agreed_to_privacy')::boolean, false)
  );
  RETURN new;
END;
$$;