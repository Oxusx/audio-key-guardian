import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SHOP_DOMAIN = '01neki-ea.myshopify.com';
const API_VERSION = '2025-07';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const adminToken = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN');
    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const supaAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    if (!adminToken) throw new Error('SHOPIFY_ADMIN_API_TOKEN not configured');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(supaUrl, supaAnon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const { title, description, price, imageUrl, productType } = body ?? {};
    if (!title || typeof title !== 'string' || title.length > 255) {
      return new Response(JSON.stringify({ error: 'Invalid title' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return new Response(JSON.stringify({ error: 'Invalid price' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Look up artist username
    const { data: profile, error: pErr } = await supabase
      .from('artist_profiles')
      .select('username, display_name')
      .eq('user_id', user.id)
      .maybeSingle();
    if (pErr || !profile?.username) {
      return new Response(JSON.stringify({ error: 'Create your artist profile (username) first' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const productPayload: any = {
      product: {
        title,
        body_html: description ?? '',
        vendor: profile.display_name || profile.username,
        product_type: productType || 'Merch',
        tags: `artist:${profile.username}`,
        status: 'active',
        variants: [{ price: priceNum.toFixed(2), inventory_management: null }],
      },
    };
    if (imageUrl) productPayload.product.images = [{ src: imageUrl }];

    const resp = await fetch(`https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/products.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': adminToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productPayload),
    });

    const respText = await resp.text();
    if (!resp.ok) {
      console.error('Shopify error', resp.status, respText);
      return new Response(JSON.stringify({ error: `Shopify ${resp.status}: ${respText}` }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const data = JSON.parse(respText);
    return new Response(JSON.stringify({ product: data.product }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
