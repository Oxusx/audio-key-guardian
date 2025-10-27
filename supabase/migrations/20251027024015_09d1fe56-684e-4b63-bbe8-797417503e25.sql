-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_investor_email ON public.contracts(investor_email);
CREATE INDEX IF NOT EXISTS idx_contracts_admin_email ON public.contracts(admin_email);
CREATE INDEX IF NOT EXISTS idx_investments_user_email ON public.investments(user_email);

-- Add check constraint to prevent negative amounts (with error handling)
DO $$ 
BEGIN
  ALTER TABLE public.investments 
    ADD CONSTRAINT investments_amount_positive CHECK (amount > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.contracts 
    ADD CONSTRAINT contracts_amount_positive CHECK (investment_amount > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;