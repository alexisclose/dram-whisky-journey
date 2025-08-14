-- Fix the get_whisky_recommendations function to handle data type casting properly
CREATE OR REPLACE FUNCTION public.get_whisky_recommendations(_user_id uuid, _fruit_score numeric DEFAULT 0, _floral_score numeric DEFAULT 0, _spice_score numeric DEFAULT 0, _smoke_score numeric DEFAULT 0, _oak_score numeric DEFAULT 0, _limit integer DEFAULT 10)
 RETURNS TABLE(whisky_id uuid, distillery text, name text, region text, location text, image_url text, overview text, expert_score_fruit integer, expert_score_floral integer, expert_score_spice integer, expert_score_smoke integer, expert_score_oak integer, similarity_score numeric, similarity_percentage integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_magnitude numeric;
  whisky_magnitude numeric;
  dot_product numeric;
  similarity numeric;
BEGIN
  -- Calculate user vector magnitude
  user_magnitude := sqrt(
    (_fruit_score * _fruit_score) +
    (_floral_score * _floral_score) +
    (_spice_score * _spice_score) +
    (_smoke_score * _smoke_score) +
    (_oak_score * _oak_score)
  );

  -- If user has no profile, return top whiskies by expert scores
  IF user_magnitude = 0 THEN
    RETURN QUERY
    SELECT 
      w.id as whisky_id,
      w.distillery,
      w.name,
      w.region,
      w.location,
      w.image_url,
      w.overview,
      w.expert_score_fruit,
      w.expert_score_floral,
      w.expert_score_spice,
      w.expert_score_smoke,
      w.expert_score_oak,
      0::numeric as similarity_score,
      0::integer as similarity_percentage
    FROM public.whiskies w
    WHERE w.id NOT IN (
      SELECT tn.whisky_id 
      FROM public.tasting_notes tn 
      WHERE tn.user_id = _user_id
    )
    AND (
      w.expert_score_fruit IS NOT NULL OR
      w.expert_score_floral IS NOT NULL OR
      w.expert_score_spice IS NOT NULL OR
      w.expert_score_smoke IS NOT NULL OR
      w.expert_score_oak IS NOT NULL
    )
    ORDER BY (
      COALESCE(w.expert_score_fruit, 0) +
      COALESCE(w.expert_score_floral, 0) +
      COALESCE(w.expert_score_spice, 0) +
      COALESCE(w.expert_score_smoke, 0) +
      COALESCE(w.expert_score_oak, 0)
    ) DESC
    LIMIT _limit;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    w.id as whisky_id,
    w.distillery,
    w.name,
    w.region,
    w.location,
    w.image_url,
    w.overview,
    w.expert_score_fruit,
    w.expert_score_floral,
    w.expert_score_spice,
    w.expert_score_smoke,
    w.expert_score_oak,
    CASE 
      WHEN sqrt(
        (COALESCE(w.expert_score_fruit, 0)::numeric * COALESCE(w.expert_score_fruit, 0)::numeric) +
        (COALESCE(w.expert_score_floral, 0)::numeric * COALESCE(w.expert_score_floral, 0)::numeric) +
        (COALESCE(w.expert_score_spice, 0)::numeric * COALESCE(w.expert_score_spice, 0)::numeric) +
        (COALESCE(w.expert_score_smoke, 0)::numeric * COALESCE(w.expert_score_smoke, 0)::numeric) +
        (COALESCE(w.expert_score_oak, 0)::numeric * COALESCE(w.expert_score_oak, 0)::numeric)
      ) = 0 THEN 0::numeric
      ELSE (
        (_fruit_score * COALESCE(w.expert_score_fruit, 0)::numeric) +
        (_floral_score * COALESCE(w.expert_score_floral, 0)::numeric) +
        (_spice_score * COALESCE(w.expert_score_spice, 0)::numeric) +
        (_smoke_score * COALESCE(w.expert_score_smoke, 0)::numeric) +
        (_oak_score * COALESCE(w.expert_score_oak, 0)::numeric)
      ) / (
        user_magnitude * sqrt(
          (COALESCE(w.expert_score_fruit, 0)::numeric * COALESCE(w.expert_score_fruit, 0)::numeric) +
          (COALESCE(w.expert_score_floral, 0)::numeric * COALESCE(w.expert_score_floral, 0)::numeric) +
          (COALESCE(w.expert_score_spice, 0)::numeric * COALESCE(w.expert_score_spice, 0)::numeric) +
          (COALESCE(w.expert_score_smoke, 0)::numeric * COALESCE(w.expert_score_smoke, 0)::numeric) +
          (COALESCE(w.expert_score_oak, 0)::numeric * COALESCE(w.expert_score_oak, 0)::numeric)
        )
      )
    END as similarity_score,
    CASE 
      WHEN sqrt(
        (COALESCE(w.expert_score_fruit, 0)::numeric * COALESCE(w.expert_score_fruit, 0)::numeric) +
        (COALESCE(w.expert_score_floral, 0)::numeric * COALESCE(w.expert_score_floral, 0)::numeric) +
        (COALESCE(w.expert_score_spice, 0)::numeric * COALESCE(w.expert_score_spice, 0)::numeric) +
        (COALESCE(w.expert_score_smoke, 0)::numeric * COALESCE(w.expert_score_smoke, 0)::numeric) +
        (COALESCE(w.expert_score_oak, 0)::numeric * COALESCE(w.expert_score_oak, 0)::numeric)
      ) = 0 THEN 0
      ELSE ROUND((
        (
          (_fruit_score * COALESCE(w.expert_score_fruit, 0)::numeric) +
          (_floral_score * COALESCE(w.expert_score_floral, 0)::numeric) +
          (_spice_score * COALESCE(w.expert_score_spice, 0)::numeric) +
          (_smoke_score * COALESCE(w.expert_score_smoke, 0)::numeric) +
          (_oak_score * COALESCE(w.expert_score_oak, 0)::numeric)
        ) / (
          user_magnitude * sqrt(
            (COALESCE(w.expert_score_fruit, 0)::numeric * COALESCE(w.expert_score_fruit, 0)::numeric) +
            (COALESCE(w.expert_score_floral, 0)::numeric * COALESCE(w.expert_score_floral, 0)::numeric) +
            (COALESCE(w.expert_score_spice, 0)::numeric * COALESCE(w.expert_score_spice, 0)::numeric) +
            (COALESCE(w.expert_score_smoke, 0)::numeric * COALESCE(w.expert_score_smoke, 0)::numeric) +
            (COALESCE(w.expert_score_oak, 0)::numeric * COALESCE(w.expert_score_oak, 0)::numeric)
          )
        )
      ) * 100)::integer
    END as similarity_percentage
  FROM public.whiskies w
  WHERE w.id NOT IN (
    SELECT tn.whisky_id 
    FROM public.tasting_notes tn 
    WHERE tn.user_id = _user_id
  )
  AND (
    w.expert_score_fruit IS NOT NULL OR
    w.expert_score_floral IS NOT NULL OR
    w.expert_score_spice IS NOT NULL OR
    w.expert_score_smoke IS NOT NULL OR
    w.expert_score_oak IS NOT NULL
  )
  ORDER BY similarity_score DESC NULLS LAST
  LIMIT _limit;
END;
$function$