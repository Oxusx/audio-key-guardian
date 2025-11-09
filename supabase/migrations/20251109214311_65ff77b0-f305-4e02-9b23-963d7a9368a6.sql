-- Fix RLS policies to allow investments without authentication
-- Users can invest with just an email, no signup required

DROP POLICY IF EXISTS "Authenticated users can create investments" ON public.investments;
DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;

-- Allow anyone to create investments with email
CREATE POLICY "Anyone can create investments"
ON public.investments
FOR INSERT
WITH CHECK (true);

-- Allow viewing investments by email (no auth required)
CREATE POLICY "Anyone can view investments by email"
ON public.investments
FOR SELECT
USING (true);

-- Fix contracts RLS to allow creation without auth
DROP POLICY IF EXISTS "Authenticated users can create contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can view their own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users and admins can sign contracts" ON public.contracts;

CREATE POLICY "Anyone can create contracts"
ON public.contracts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view contracts by email"
ON public.contracts
FOR SELECT
USING (true);

CREATE POLICY "Anyone can sign contracts by email"
ON public.contracts
FOR UPDATE
USING (true);

-- Create investment_sessions table to track user sessions for investments
CREATE TABLE IF NOT EXISTS public.investment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.investment_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create sessions" ON public.investment_sessions;
DROP POLICY IF EXISTS "Anyone can view their session" ON public.investment_sessions;
DROP POLICY IF EXISTS "Anyone can update their session" ON public.investment_sessions;

CREATE POLICY "Anyone can create sessions"
ON public.investment_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view their session"
ON public.investment_sessions
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update their session"
ON public.investment_sessions
FOR UPDATE
USING (true);

-- Add indexes for better query performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_contracts_investor_email ON public.contracts(investor_email);
CREATE INDEX IF NOT EXISTS idx_contracts_admin_email ON public.contracts(admin_email);
CREATE INDEX IF NOT EXISTS idx_investment_sessions_session_id ON public.investment_sessions(session_id);