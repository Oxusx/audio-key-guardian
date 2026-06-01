import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Detects an artist subdomain (e.g. `john.godscircle.ca`) and rewrites the
 * route to `/john` so the existing ArtistPage handles it.
 *
 * Reserved/non-artist subdomains are ignored so they keep their normal behavior.
 */
const RESERVED = new Set(['www', 'app', 'admin', 'api', 'mail', 'static', 'cdn', 'preview', 'id-preview']);

const SubdomainRouter = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const host = window.location.hostname;

    // Skip localhost / IPs / lovable preview hosts
    if (
      host === 'localhost' ||
      /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
      host.endsWith('.lovable.app') ||
      host.endsWith('.lovableproject.com')
    ) {
      return;
    }

    const parts = host.split('.');
    // Need at least sub.domain.tld
    if (parts.length < 3) return;

    const sub = parts[0].toLowerCase();
    if (!sub || RESERVED.has(sub)) return;

    // Only redirect when we're at the root path — don't hijack deeper routes
    if (location.pathname === '/' || location.pathname === '') {
      navigate(`/${sub}`, { replace: true });
    }
  }, [navigate, location.pathname]);

  return null;
};

export default SubdomainRouter;
