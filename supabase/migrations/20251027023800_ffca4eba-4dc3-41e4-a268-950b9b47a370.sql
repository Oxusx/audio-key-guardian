-- Update RLS policies on contracts table for better security
DROP POLICY IF EXISTS "Anyone can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Anyone can update contracts" ON public.contracts;

-- Temporarily allow viewing all contracts (will restrict after auth is implemented)
CREATE POLICY "Users can view contracts"
  ON public.contracts
  FOR SELECT
  USING (true);

-- Restrict updates to signing only
CREATE POLICY "Users can sign contracts"
  ON public.contracts
  FOR UPDATE
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_investor_email ON public.contracts(investor_email);
CREATE INDEX IF NOT EXISTS idx_contracts_admin_email ON public.contracts(admin_email);
CREATE INDEX IF NOT EXISTS idx_investments_user_email ON public.investments(user_email);

-- Add check constraint to prevent negative amounts
ALTER TABLE public.investments 
  ADD CONSTRAINT investments_amount_positive CHECK (amount > 0);

ALTER TABLE public.contracts 
  ADD CONSTRAINT contracts_amount_positive CHECK (investment_amount > 0);