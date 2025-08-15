-- Create profile for existing user
INSERT INTO public.profiles (user_id, display_name, username)
VALUES (
  'a875f8c3-fc53-4671-936c-cb2c61513564'::uuid,
  'alexis.close2810@gmail.com',
  'alexis.close2810'
)
ON CONFLICT (user_id) DO NOTHING;