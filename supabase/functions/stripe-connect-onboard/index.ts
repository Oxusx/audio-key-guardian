// Creates a Stripe Connect Express account for the artist and returns an onboarding link
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return new Response("Stripe not configured", { status: 500, headers: corsHeaders });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const { return_url } = await req.json();

    // Find or create Connect account
    const { data: existing } = await supabase
      .from("payout_accounts")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let accountId = existing?.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: { transfers: { requested: true } },
      });
      accountId = account.id;
      await supabase.from("payout_accounts").insert({
        user_id: user.id,
        stripe_account_id: accountId,
      });
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: return_url,
      return_url: return_url,
      type: "account_onboarding",
    });

    return new Response(JSON.stringify({ url: link.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Onboard error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
