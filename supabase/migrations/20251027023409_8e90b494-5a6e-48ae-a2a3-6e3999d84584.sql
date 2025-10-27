-- Create contracts table to store investment agreements
CREATE TABLE public.contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id uuid REFERENCES public.investments(id) ON DELETE CASCADE,
  investor_email text NOT NULL,
  admin_email text NOT NULL,
  project_name text NOT NULL,
  investment_amount numeric NOT NULL,
  roi_percentage numeric NOT NULL,
  expected_return numeric NOT NULL,
  contract_date timestamp with time zone NOT NULL DEFAULT now(),
  contract_terms text NOT NULL,
  investor_signed_at timestamp with time zone,
  admin_signed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view contracts (investors need to see their contracts)
CREATE POLICY "Anyone can view contracts"
  ON public.contracts
  FOR SELECT
  USING (true);

-- Allow anyone to create contracts (created automatically after payment)
CREATE POLICY "Anyone can create contracts"
  ON public.contracts
  FOR INSERT
  WITH CHECK (true);

-- Allow updating contracts (for signing)
CREATE POLICY "Anyone can update contracts"
  ON public.contracts
  FOR UPDATE
  USING (true);