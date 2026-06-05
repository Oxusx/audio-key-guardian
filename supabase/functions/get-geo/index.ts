import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const h = req.headers;
  const ip =
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    (h.get('x-forwarded-for') || '').split(',')[0].trim() ||
    null;

  const geo = {
    ip: ip ? ip.replace(/\.\d+$/, '.0') : null, // privacy: drop last octet
    country: h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || h.get('x-country-code') || null,
    region: h.get('cf-region') || h.get('x-vercel-ip-country-region') || null,
    city: h.get('cf-ipcity') || h.get('x-vercel-ip-city') || null,
    timezone: h.get('cf-timezone') || h.get('x-vercel-ip-timezone') || null,
  };

  return new Response(JSON.stringify(geo), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
