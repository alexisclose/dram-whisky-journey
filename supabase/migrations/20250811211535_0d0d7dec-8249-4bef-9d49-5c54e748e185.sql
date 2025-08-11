-- Fix linter: set immutable search_path for set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;