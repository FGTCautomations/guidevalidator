-- Function to get overall average rating across all approved reviews
CREATE OR REPLACE FUNCTION public.get_average_rating()
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ROUND(AVG(overall_rating)::numeric, 2)
  FROM public.reviews
  WHERE status = 'approved';
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_average_rating() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_average_rating() TO anon;
