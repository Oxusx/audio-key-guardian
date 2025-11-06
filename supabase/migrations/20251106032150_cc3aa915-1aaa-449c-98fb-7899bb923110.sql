-- First, clean up duplicate entries by keeping only one like per track
DELETE FROM public.track_likes a
USING public.track_likes b
WHERE a.id > b.id 
AND a.track_name = b.track_name;

-- Now add the user_session_id column
ALTER TABLE public.track_likes ADD COLUMN IF NOT EXISTS user_session_id TEXT NOT NULL DEFAULT 'legacy';

-- Create unique constraint to prevent duplicate likes from same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_track_likes_unique_user_track 
ON public.track_likes(track_name, user_session_id);

-- Create function to check if user has liked a track
CREATE OR REPLACE FUNCTION public.has_user_liked_track(track_name_param TEXT, session_id_param TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.track_likes 
    WHERE track_name = track_name_param 
    AND user_session_id = session_id_param
  );
$$;