// On-demand cash out: transfers artist's pending balance to their Stripe Connect account
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

    // Get connected account
    const { data: account } = await supabase
      .from("payout_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!account?.payouts_enabled) {
      return new Response(JSON.stringify({ error: "Stripe account not ready for payouts. Complete onboarding first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sum pending sales
    const { data: sales } = await supabase
      .from("artist_sales")
      .select("id, artist_amount, currency")
      .eq("artist_user_id", user.id)
      .eq("status", "pending");

    if (!sales || sales.length === 0) {
      return new Response(JSON.stringify({ error: "No pending balance to cash out." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currency = (sales[0].currency || "USD").toLowerCase();
    const totalAmount = sales.reduce((sum, s) => sum + Number(s.artist_amount), 0);
    const amountInCents = Math.round(totalAmount * 100);

    if (amountInCents < 100) {
      return new Response(JSON.stringify({ error: "Minimum cash-out is $1.00" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create payout record
    const { data: payout, error: payoutErr } = await supabase.from("payouts").insert({
      user_id: user.id,
      amount: totalAmount,
      currency: currency.toUpperCase(),
      status: "processing",
    }).select().single();
    if (payoutErr) throw payoutErr;

    // Transfer via Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
    try {
      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency,
        destination: account.stripe_account_id,
        metadata: { payout_id: payout.id, user_id: user.id },
      });

      // Mark sales as paid_out
      await supabase.from("artist_sales").update({ status: "paid_out", payout_id: payout.id })
        .in("id", sales.map(s => s.id));

      await supabase.from("payouts").update({
        stripe_transfer_id: transfer.id,
        status: "paid",
      }).eq("id", payout.id);

      return new Response(JSON.stringify({ success: true, amount: totalAmount, transfer_id: transfer.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (transferErr: any) {
      await supabase.from("payouts").update({
        status: "failed",
        error_message: transferErr.message,
      }).eq("id", payout.id);
      throw transferErr;
    }
  } catch (e: any) {
    console.error("Cashout error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
