import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  event_type: string;
  event_data?: any;
  user_session_id?: string;
}

const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
  return 'desktop';
};

const getBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Other';
};

const getOS = () => {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Other';
};

const SESSION_META_KEY = 'analytics_session_meta_v1';

interface SessionMeta {
  session_id: string;
  landing_url: string;
  landing_referrer: string;
  utm: Record<string, string>;
  geo: { country: string | null; region: string | null; city: string | null; timezone: string | null } | null;
  geo_fetched: boolean;
  session_start: number;
}

const parseUtm = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const out: Record<string, string> = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'gclid', 'fbclid'].forEach((k) => {
    const v = params.get(k);
    if (v) out[k] = v;
  });
  return out;
};

const getSessionMeta = (): SessionMeta => {
  try {
    const cached = sessionStorage.getItem(SESSION_META_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  // localStorage session_id persists across tabs/visits for retention cohorts
  const sid = localStorage.getItem('session_id') || crypto.randomUUID();
  localStorage.setItem('session_id', sid);
  const meta: SessionMeta = {
    session_id: sid,
    landing_url: window.location.href,
    landing_referrer: document.referrer || '',
    utm: parseUtm(window.location.search),
    geo: null,
    geo_fetched: false,
    session_start: Date.now(),
  };
  try { sessionStorage.setItem(SESSION_META_KEY, JSON.stringify(meta)); } catch {}
  return meta;
};

const persistMeta = (meta: SessionMeta) => {
  try { sessionStorage.setItem(SESSION_META_KEY, JSON.stringify(meta)); } catch {}
};

let geoPromise: Promise<void> | null = null;
const ensureGeo = async () => {
  const meta = getSessionMeta();
  if (meta.geo_fetched) return;
  if (geoPromise) return geoPromise;
  geoPromise = (async () => {
    try {
      const { data } = await supabase.functions.invoke('get-geo');
      if (data) {
        meta.geo = data;
      }
    } catch (e) {
      // Silent — geo is best-effort
    } finally {
      meta.geo_fetched = true;
      persistMeta(meta);
    }
  })();
  return geoPromise;
};

const getDeviceContext = () => {
  const nav: any = navigator;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  return {
    device_type: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: { w: window.screen.width, h: window.screen.height, dpr: window.devicePixelRatio },
    viewport: { w: window.innerWidth, h: window.innerHeight },
    orientation: window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape',
    connection: conn ? { type: conn.effectiveType, downlink: conn.downlink, save_data: !!conn.saveData } : null,
    visibility: document.visibilityState,
  };
};

export const useAnalytics = () => {
  const trackEvent = async (event: AnalyticsEvent) => {
    try {
      const meta = getSessionMeta();
      // Fire geo fetch in background (does not block insert)
      ensureGeo();

      const { data: sessionData } = await supabase.auth.getSession();

      const enriched = {
        ...event.event_data,
        session_meta: {
          landing_url: meta.landing_url,
          landing_referrer: meta.landing_referrer,
          utm: meta.utm,
          geo: meta.geo,
        },
        device: getDeviceContext(),
        timestamp_client: Date.now(),
      };

      const device = getDeviceContext();

      await supabase.from('analytics_events').insert({
        event_type: event.event_type,
        event_data: enriched,
        user_session_id: event.user_session_id || meta.session_id,
        user_id: sessionData.session?.user?.id || null,
        page_url: window.location.pathname + window.location.search,
        referrer: document.referrer || null,
        device_type: device.device_type,
        browser: device.browser,
        country: meta.geo?.country || null,
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  return { trackEvent };
};
