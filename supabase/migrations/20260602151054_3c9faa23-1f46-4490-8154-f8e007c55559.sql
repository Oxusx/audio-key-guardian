
-- CONTRACTS: lock down — currently anyone can read/update all contracts
DROP POLICY IF EXISTS "Anyone can view contracts by email" ON public.contracts;
DROP POLICY IF EXISTS "Anyone can sign contracts by email" ON public.contracts;
DROP POLICY IF EXISTS "Anyone can create contracts" ON public.contracts;

CREATE POLICY "Admins can view all contracts"
ON public.contracts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contracts"
ON public.contracts FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert contracts"
ON public.contracts FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role (edge functions) still has full access via GRANT ALL
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.contracts FROM anon;

-- INVESTMENTS: lock down read access (the page is disabled anyway)
DROP POLICY IF EXISTS "Anyone can view investments by email" ON public.investments;
DROP POLICY IF EXISTS "Anyone can create investments" ON public.investments;

CREATE POLICY "Admins can insert investments"
ON public.investments FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.investments FROM anon;

-- INVESTMENT SESSIONS: same — restrict to admins; edge functions use service_role
DROP POLICY IF EXISTS "Anyone can view their session" ON public.investment_sessions;
DROP POLICY IF EXISTS "Anyone can update their session" ON public.investment_sessions;
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.investment_sessions;

CREATE POLICY "Admins can view sessions"
ON public.investment_sessions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.investment_sessions FROM anon;

-- USER CONSENTS: tighten so anyone passing any session_id can't read others' records
DROP POLICY IF EXISTS "Users can view their own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can update their own consents" ON public.user_consents;

CREATE POLICY "Users can view their own consents"
ON public.user_consents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
ON public.user_consents FOR UPDATE
USING (auth.uid() = user_id);

-- TRACK LIKES: remove public table read (use get_track_like_count function instead)
DROP POLICY IF EXISTS "Anyone can view track likes" ON public.track_likes;

CREATE POLICY "Admins can view track likes"
ON public.track_likes FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
