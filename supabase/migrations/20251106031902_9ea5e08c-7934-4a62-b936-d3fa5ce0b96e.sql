-- Create table for track likes
CREATE TABLE IF NOT EXISTS public.track_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.track_likes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view likes
CREATE POLICY "Anyone can view track likes"
ON public.track_likes
FOR SELECT
USING (true);

-- Allow anyone to insert likes
CREATE POLICY "Anyone can insert track likes"
ON public.track_likes
FOR INSERT
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_track_likes_track_name ON public.track_likes(track_name);

-- Create function to get like count for a track
CREATE OR REPLACE FUNCTION public.get_track_like_count(track_name_param TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)::INTEGER FROM public.track_likes WHERE track_name = track_name_param;
$$;