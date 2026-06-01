// Shopify orders/create webhook: attributes line items to artists by `artist:<username>` tag
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

const PLATFORM_FEE_RATE = 0.10; // 10%
const PLATFORM_FEE_RECIPIENT_USERNAME = "godscircle"; // fees flow into this artist dashboard

async function verifyHmac(rawBody: string, hmacHeader: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === hmacHeader;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
    const secret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");

    if (!secret) return new Response("Missing secret", { status: 500 });
    if (!hmacHeader || !(await verifyHmac(rawBody, hmacHeader, secret))) {
      return new Response("Invalid HMAC", { status: 401 });
    }

    const order = JSON.parse(rawBody);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const orderId = String(order.id);
    const customerEmail = order.email ?? order.customer?.email ?? null;
    const currency = order.currency ?? "USD";

    const lineItems = order.line_items ?? [];
    const inserted: any[] = [];

    for (const item of lineItems) {
      // Tags come in as comma-separated string on product; webhook payload has line item properties
      // Need to fetch product tags via Admin API since order webhook doesn't include them
      const productId = item.product_id ? String(item.product_id) : null;
      if (!productId) continue;

      const adminToken = Deno.env.get("SHOPIFY_ADMIN_API_TOKEN");
      const shopDomain = "01neki-ea.myshopify.com";
      let tags = "";
      try {
        const res = await fetch(
          `https://${shopDomain}/admin/api/2025-07/products/${productId}.json?fields=tags`,
          { headers: { "X-Shopify-Access-Token": adminToken! } },
        );
        const json = await res.json();
        tags = json?.product?.tags ?? "";
      } catch (e) {
        console.error("Failed to fetch product tags", e);
        continue;
      }

      const artistTag = tags.split(",").map((t: string) => t.trim()).find((t: string) => t.startsWith("artist:"));
      if (!artistTag) continue;
      const username = artistTag.slice("artist:".length).trim();
      if (!username) continue;

      const { data: profile } = await supabase
        .from("artist_profiles")
        .select("user_id, username")
        .eq("username", username)
        .maybeSingle();
      if (!profile) continue;

      const gross = Number(item.price) * Number(item.quantity);
      const platformFee = Math.round(gross * PLATFORM_FEE_RATE * 100) / 100;
      const artistAmount = Math.round((gross - platformFee) * 100) / 100;

      const { error } = await supabase.from("artist_sales").insert({
        artist_user_id: profile.user_id,
        artist_username: profile.username,
        shopify_order_id: orderId,
        shopify_line_item_id: String(item.id),
        shopify_product_id: productId,
        product_title: item.title ?? "Untitled",
        quantity: item.quantity ?? 1,
        gross_amount: gross,
        platform_fee: platformFee,
        artist_amount: artistAmount,
        currency,
        customer_email: customerEmail,
        status: "pending",
      });

      if (!error) {
        inserted.push(item.id);

        // Also credit the 10% platform fee as a sale on the godscircle dashboard
        if (profile.username !== PLATFORM_FEE_RECIPIENT_USERNAME && platformFee > 0) {
          const { data: feeProfile } = await supabase
            .from("artist_profiles")
            .select("user_id, username")
            .eq("username", PLATFORM_FEE_RECIPIENT_USERNAME)
            .maybeSingle();

          if (feeProfile) {
            const { error: feeErr } = await supabase.from("artist_sales").insert({
              artist_user_id: feeProfile.user_id,
              artist_username: feeProfile.username,
              shopify_order_id: orderId,
              shopify_line_item_id: `${item.id}-fee`,
              shopify_product_id: productId,
              product_title: `Platform fee · ${item.title ?? "sale"} (${profile.username})`,
              quantity: item.quantity ?? 1,
              gross_amount: platformFee,
              platform_fee: 0,
              artist_amount: platformFee,
              currency,
              customer_email: customerEmail,
              status: "pending",
            });
            if (feeErr && !feeErr.message.includes("duplicate")) {
              console.error("Fee insert error:", feeErr);
            }
          } else {
            console.warn(`Platform fee recipient profile '${PLATFORM_FEE_RECIPIENT_USERNAME}' not found — fee not credited.`);
          }
        }
      } else if (!error.message.includes("duplicate")) {
        console.error("Insert error:", error);
      }

    return new Response(JSON.stringify({ ok: true, recorded: inserted.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Webhook error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
