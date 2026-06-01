
CREATE TABLE public.artist_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_user_id UUID NOT NULL,
  artist_username TEXT NOT NULL,
  shopify_order_id TEXT NOT NULL,
  shopify_line_item_id TEXT NOT NULL UNIQUE,
  shopify_product_id TEXT,
  product_title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  gross_amount NUMERIC(12,2) NOT NULL,
  platform_fee NUMERIC(12,2) NOT NULL,
  artist_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payout_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_artist_sales_artist ON public.artist_sales(artist_user_id, status);
GRANT SELECT ON public.artist_sales TO authenticated;
GRANT ALL ON public.artist_sales TO service_role;
ALTER TABLE public.artist_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists view own sales" ON public.artist_sales FOR SELECT TO authenticated USING (auth.uid() = artist_user_id);
CREATE POLICY "Admins view all sales" ON public.artist_sales FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.payout_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  details_submitted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payout_accounts TO authenticated;
GRANT ALL ON public.payout_accounts TO service_role;
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists view own payout account" ON public.payout_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all payout accounts" ON public.payout_accounts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_transfer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payouts_user ON public.payouts(user_id);
GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists view own payouts" ON public.payouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all payouts" ON public.payouts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
