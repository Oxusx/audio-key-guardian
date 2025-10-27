-- Create investments table
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  project_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view investments (for calculating total)
CREATE POLICY "Anyone can view investments"
ON public.investments
FOR SELECT
USING (true);

-- Create policy to allow anyone to insert investments
CREATE POLICY "Anyone can create investments"
ON public.investments
FOR INSERT
WITH CHECK (true);

-- Create function to calculate total investments
CREATE OR REPLACE FUNCTION public.get_total_investments()
RETURNS DECIMAL
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0) FROM public.investments;
$$;