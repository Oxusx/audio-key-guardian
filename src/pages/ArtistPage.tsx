import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Heart, Unlock, Instagram, Twitter, Youtube, Globe, ShoppingBag, ExternalLink, Music, SkipForward, Loader2, ShoppingCart, LogOut, Shuffle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAudio } from '@/contexts/AudioContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchProductsByArtist, ShopifyProduct } from '@/lib/shopify';
import { useCartStore } from '@/stores/cartStore';
import { CartDrawer } from '@/components/shop/CartDrawer';
import Footer from '@/components/Footer';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ArtistProfileData {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  social_links: any;
  profile_image_url: string | null;
  banner_image_url: string | null;
  is_public: boolean;
  require_key: boolean;
  user_id: string;
}

interface MerchItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  external_link: string | null;
  is_available: boolean;
}

const ArtistPage = () => {
  const { username, projectKey } = useParams<{ username: string; projectKey?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const audio = useAudio();
  const { trackEvent } = useAnalytics();
  const merchRef = React.useRef<HTMLDivElement>(null);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const [profile, setProfile] = useState<ArtistProfileData | null>(null);
  const [merch, setMerch] = useState<MerchItemData[]>([]);
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [audioFiles, setAudioFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [coverArt, setCoverArt] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [showMerch, setShowMerch] = useState(false);

  const addToCart = useCartStore((s) => s.addItem);
  const cartLoading = useCartStore((s) => s.isLoading);

  const hasMerch = shopifyProducts.length > 0 || merch.length > 0;
  const hasBoth = audioFiles.length > 0 && hasMerch;

  // --- Analytics refs (avoid re-renders) ---
  const sessionStartRef = useRef<number | null>(null);
  const usedKeyRef = useRef<string | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);
  const trackStartRef = useRef<number | null>(null);
  const lastSongPlayedRef = useRef<string | null>(null); // last song before merch nav
  const firstPurchaseLoggedRef = useRef(false);

  // Helper: enrich every event with artist + key context
  const track = React.useCallback(
    (event_type: string, data: Record<string, any> = {}) => {
      trackEvent({
        event_type,
        event_data: {
          artist_username: username || null,
          artist_profile_id: profile?.id || null,
          project_name: projectName || null,
          access_key: usedKeyRef.current,
          ...data,
        },
      });
    },
    [trackEvent, username, profile?.id, projectName]
  );

  const revealMerch = () => {
    setShowMerch(true);
    lastSongPlayedRef.current = audio.currentTrack?.name || null;
    track('merch_viewed', {
      source: 'button',
      last_song_played: lastSongPlayedRef.current,
      merch_count: shopifyProducts.length + merch.length,
    });
    setTimeout(() => {
      merchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || !hasMerch) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 50) {
      if (dx < 0) {
        if (!showMerch) {
          setShowMerch(true);
          lastSongPlayedRef.current = audio.currentTrack?.name || null;
          track('merch_viewed', {
            source: 'swipe',
            last_song_played: lastSongPlayedRef.current,
            merch_count: shopifyProducts.length + merch.length,
          });
          setTimeout(() => merchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        }
      } else {
        if (showMerch) {
          setShowMerch(false);
          track('nav_to_tracks', { source: 'swipe' });
        }
      }
    }
  };

  useEffect(() => {
    if (username) loadArtistPage();
  }, [username]);

  useEffect(() => {
    if (!username) return;
    setProductsLoading(true);
    fetchProductsByArtist(username)
      .then(setShopifyProducts)
      .catch((e) => console.error('Shopify fetch failed', e))
      .finally(() => setProductsLoading(false));
  }, [username]);

  const loadArtistPage = async () => {
    // Reset state so data from a previously-viewed artist doesn't leak through
    setProfile(null);
    setMerch([]);
    setShopifyProducts([]);
    setAudioFiles([]);
    setCoverArt('');
    setProjectName('');
    setHasAccess(false);
    setAccessKey('');
    setNotFound(false);
    setLoading(true);
    try {
      // Load artist profile
      const { data: profileData, error } = await (supabase as any)
        .from('artist_profiles')
        .select('*')
        .eq('username', username?.toLowerCase())
        .eq('is_public', true)
        .single();

      if (error || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Load merch
      const { data: merchData } = await (supabase as any)
        .from('merch_items')
        .select('*')
        .eq('artist_id', profileData.id)
        .eq('is_available', true)
        .order('created_at', { ascending: true });

      if (merchData) setMerch(merchData);

      // Load cover art via secure RPC (only exposes safe public fields)
      const { data: settingsRows } = await (supabase as any).rpc('get_public_admin_settings', {
        admin_id_param: profileData.user_id,
      });
      const settings = Array.isArray(settingsRows) ? settingsRows[0] : settingsRows;
      if (settings?.cover_art_url) setCoverArt(settings.cover_art_url);
      if (settings?.project_name) setProjectName(settings.project_name);

      // If no key required, load audio immediately
      if (!profileData.require_key) {
        setHasAccess(true);
        await loadAudioFiles(profileData.user_id);
        return;
      }

      // 1. Try URL-provided key (e.g. /ox/album1)
      if (projectKey) {
        const unlocked = await tryUnlock(profileData, projectKey, { silent: true });
        if (unlocked) return;
      }

      // 2. Fallback: stored access from a previous unlock
      const stored = localStorage.getItem(`artist_access_${profileData.id}`);
      if (stored) {
        const storedData = JSON.parse(stored);
        if (storedData.expiresAt) {
          if (new Date() <= new Date(storedData.expiresAt)) {
            setHasAccess(true);
            await loadAudioFiles(profileData.user_id);
          } else {
            localStorage.removeItem(`artist_access_${profileData.id}`);
          }
        } else {
          setHasAccess(true);
          await loadAudioFiles(profileData.user_id);
        }
      }
    } catch (err) {
      console.error('Error loading artist page:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const loadAudioFiles = async (adminId: string) => {
    const { data: files } = await supabase
      .from('audio_files')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: true });

    if (files) setAudioFiles(files);
  };

  // Core key-validation routine, reused by URL auto-unlock and form submit
  const tryUnlock = async (
    profileData: ArtistProfileData,
    code: string,
    opts: { silent?: boolean } = {}
  ): Promise<boolean> => {
    const silent = opts.silent ?? false;
    try {
      const { data: validation, error } = await (supabase as any).rpc('validate_artist_key', {
        key_code_param: code,
        artist_profile_id_param: profileData.id,
      });

      if (error) throw error;

      const row = Array.isArray(validation) ? validation[0] : validation;
      if (!row || !row.is_valid) {
        trackEvent({
          event_type: 'key_entered',
          event_data: {
            artist_username: profileData.username,
            artist_profile_id: profileData.id,
            access_key: code,
            success: false,
            reason: !row ? 'invalid' : 'expired_or_inactive',
            source: silent ? 'url' : 'form',
            referrer: document.referrer || null,
          },
        });
      }
      if (!row) {
        if (!silent) toast({ title: 'Invalid key', description: 'This key is not valid for this artist.', variant: 'destructive' });
        return false;
      }
      if (!row.is_valid) {
        if (!silent) toast({ title: 'Key expired or inactive', description: 'This key is no longer valid.', variant: 'destructive' });
        return false;
      }

      setHasAccess(true);
      usedKeyRef.current = code;
      sessionStartRef.current = Date.now();
      localStorage.setItem(`artist_access_${profileData.id}`, JSON.stringify({
        accessType: row.access_type,
        expiresAt: row.expires_at,
        includesMerch: row.includes_merch,
        enteredAt: new Date().toISOString(),
      }));

      // Returning vs new key holder
      const visitsKey = `artist_visits_${profileData.id}_${code}`;
      const priorVisits = parseInt(localStorage.getItem(visitsKey) || '0', 10);
      localStorage.setItem(visitsKey, String(priorVisits + 1));

      trackEvent({
        event_type: 'key_entered',
        event_data: {
          artist_username: profileData.username,
          artist_profile_id: profileData.id,
          access_key: code,
          access_type: row.access_type,
          includes_merch: row.includes_merch,
          success: true,
          source: silent ? 'url' : 'form',
          referrer: document.referrer || null,
          is_returning: priorVisits > 0,
          visit_count: priorVisits + 1,
        },
      });
      trackEvent({
        event_type: 'session_start',
        event_data: {
          artist_username: profileData.username,
          artist_profile_id: profileData.id,
          access_key: code,
          is_returning: priorVisits > 0,
        },
      });

      await loadAudioFiles(profileData.user_id);
      if (!silent) {
        toast({ title: 'Access granted!', description: `${row.access_type} access activated for ${profileData.display_name}.` });
      }
      return true;
    } catch (error: any) {
      if (!silent) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim() || !profile) return;
    await tryUnlock(profile, accessKey);
  };

  const playTrack = async (file: any) => {
    const isReplay = lastTrackIdRef.current === file.id;
    const isSkip =
      lastTrackIdRef.current !== null &&
      lastTrackIdRef.current !== file.id &&
      trackStartRef.current !== null &&
      audio.duration > 0 &&
      audio.currentTime < audio.duration - 1;

    if (isSkip) {
      track('track_skipped', {
        from_track_id: lastTrackIdRef.current,
        played_seconds: Math.round(audio.currentTime),
        track_duration: Math.round(audio.duration),
      });
    }
    if (isReplay) {
      track('track_replayed', { track_id: file.id, track_name: file.file_name });
    }

    track('track_played', {
      track_id: file.id,
      track_name: file.file_name,
      replay: isReplay,
    });

    lastTrackIdRef.current = file.id;
    trackStartRef.current = Date.now();

    const trackObj = {
      id: file.id,
      name: file.file_name,
      duration: file.duration || '0:00',
      size: file.file_size || '',
      url: file.file_url,
    };
    await audio.playTrack(trackObj);
  };

  // Listen for track completion + tab close for session metrics
  useEffect(() => {
    const el = audio.audioRef.current;
    if (!el) return;
    const onEnded = () => {
      if (lastTrackIdRef.current) {
        track('track_completed', { track_id: lastTrackIdRef.current });
      }
    };
    el.addEventListener('ended', onEnded);
    return () => el.removeEventListener('ended', onEnded);
  }, [audio.audioRef, track]);

  useEffect(() => {
    const flushSession = () => {
      if (!sessionStartRef.current || !profile) return;
      const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
      trackEvent({
        event_type: 'session_end',
        event_data: {
          artist_username: profile.username,
          artist_profile_id: profile.id,
          access_key: usedKeyRef.current,
          duration_seconds: duration,
          ended_on: showMerch ? 'merch' : 'tracks',
        },
      });
    };
    window.addEventListener('beforeunload', flushSession);
    window.addEventListener('pagehide', flushSession);
    return () => {
      window.removeEventListener('beforeunload', flushSession);
      window.removeEventListener('pagehide', flushSession);
      flushSession();
    };
  }, [profile, showMerch, trackEvent]);

  const trackList = audioFiles.map((f) => ({
    id: f.id,
    name: f.file_name,
    duration: f.duration || '0:00',
    size: f.file_size || '',
    url: f.file_url,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Music className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Artist Not Found</h1>
        <p className="text-muted-foreground mb-4">The page you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/')} variant="gradient">Go Home</Button>
      </div>
    );
  }

  if (!profile) return null;

  const socialLinks = profile.social_links || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Top utility bar */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-end gap-2 max-w-3xl mx-auto">
        {hasAccess && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem('audioAccessInfo');
              toast({ title: 'Logged out', description: 'Enter a new key to access different content.' });
              navigate('/');
            }}
            title="Logout and enter a new key"
            className="text-muted-foreground"
          >
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        )}
        <CartDrawer />
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-32 space-y-6">
        {/* Cover Art (large, centered) */}
        {!showMerch && (coverArt || profile.profile_image_url) && (
          <div className="max-w-[320px] mx-auto pt-2">
            <img
              src={coverArt || profile.profile_image_url || ''}
              alt={profile.display_name}
              className="w-full aspect-square object-cover rounded-xl shadow-2xl"
            />
          </div>
        )}

        {/* Title block */}
        {!showMerch && (
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight uppercase">
              {projectName || profile.display_name}
            </h1>
            <p className="text-primary text-lg font-medium">{profile.display_name}</p>
          </div>
        )}

        {/* Play / Shuffle */}
        {hasAccess && audioFiles.length > 0 && !showMerch && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              variant="secondary"
              className="h-12 bg-card text-primary hover:bg-card/80 font-semibold text-base"
              onClick={() => audioFiles[0] && playTrack(audioFiles[0])}
            >
              <Play className="h-5 w-5 mr-2" fill="currentColor" /> Play
            </Button>
            <Button
              variant="secondary"
              className="h-12 bg-card text-primary hover:bg-card/80 font-semibold text-base"
              onClick={() => {
                const rand = audioFiles[Math.floor(Math.random() * audioFiles.length)];
                if (rand) playTrack(rand);
              }}
            >
              <Shuffle className="h-5 w-5 mr-2" /> Shuffle
            </Button>
          </div>
        )}

        {/* Bio */}
        {profile.bio && !showMerch && (
          <p className="text-foreground/80 leading-relaxed text-sm text-center">{profile.bio}</p>
        )}

        {/* Social Links */}
        {!showMerch && Object.values(socialLinks).some(Boolean) && (
          <div className="flex gap-2 flex-wrap justify-center">
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm"><Instagram className="h-4 w-4 mr-1" /> Instagram</Button>
              </a>
            )}
            {socialLinks.twitter && (
              <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm"><Twitter className="h-4 w-4 mr-1" /> Twitter</Button>
              </a>
            )}
            {socialLinks.youtube && (
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm"><Youtube className="h-4 w-4 mr-1" /> YouTube</Button>
              </a>
            )}
            {socialLinks.website && (
              <a href={socialLinks.website} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm"><Globe className="h-4 w-4 mr-1" /> Website</Button>
              </a>
            )}
          </div>
        )}



        {/* Access Key Input (if required) */}
        {profile.require_key && !hasAccess && (
          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <div className="text-center mb-4">
              <Unlock className="h-8 w-8 text-primary mx-auto mb-2" />
              <h2 className="text-lg font-semibold">Private Music</h2>
              <p className="text-sm text-muted-foreground">Enter an access key to listen</p>
            </div>
            <form onSubmit={handleKeySubmit} className="space-y-3">
              <Input
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Enter access key"
                className="text-center font-mono tracking-widest"
                autoComplete="off"
              />
              <Button type="submit" variant="gradient" className="w-full">
                <Unlock className="h-4 w-4 mr-2" /> Unlock Music
              </Button>
            </form>
          </Card>
        )}

        {/* Track List */}
        {hasAccess && audioFiles.length > 0 && !showMerch && (
          <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="pt-2">
            {hasMerch && (
              <div className="flex justify-end mb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
                  onClick={revealMerch}
                >
                  <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Merch
                </Button>
              </div>
            )}
            <div className="divide-y divide-border/40">
              {audioFiles.map((file, index) => {
                const isCurrent = audio.currentTrack?.id === file.id;
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 py-3 cursor-pointer"
                    onClick={() => playTrack(file)}
                  >
                    <span className={`text-base w-6 text-center ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                      {isCurrent && audio.isPlaying ? <Pause className="h-4 w-4 mx-auto" fill="currentColor" /> : index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-base truncate ${isCurrent ? 'text-primary font-medium' : 'text-foreground'}`}>
                        {file.file_name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {hasAccess && audioFiles.length === 0 && !showMerch && (
          <div className="text-center py-8">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No tracks available yet</p>
          </div>
        )}

        {/* Merch Section */}
        {showMerch && hasMerch && (
          <div ref={merchRef} className="scroll-mt-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" /> Merch
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-8 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
                onClick={() => setShowMerch(false)}
              >
                <Music className="h-3.5 w-3.5 mr-1" /> Tracks
              </Button>
            </h2>
            {productsLoading && shopifyProducts.length === 0 && merch.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {merch.map((m) => (
                  <Card key={m.id} className="overflow-hidden bg-card/50 backdrop-blur-sm">
                    {m.image_url && <img src={m.image_url} alt={m.name} className="w-full h-48 object-cover" />}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{m.name}</h3>
                        <Badge variant="secondary">${Number(m.price).toFixed(2)}</Badge>
                      </div>
                      {m.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{m.description}</p>
                      )}
                      {m.external_link ? (
                        <a href={m.external_link} target="_blank" rel="noopener noreferrer">
                          <Button variant="gradient" size="sm" className="w-full">
                            <ExternalLink className="h-4 w-4 mr-2" /> Buy Now
                          </Button>
                        </a>
                      ) : (
                        <Button variant="gradient" size="sm" className="w-full" disabled>
                          Coming Soon
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
                {shopifyProducts.map((p) => {
                  const variant = p.node.variants.edges[0]?.node;
                  const img = p.node.images.edges[0]?.node;
                  if (!variant) return null;
                  return (
                    <Card key={p.node.id} className="overflow-hidden bg-card/50 backdrop-blur-sm">
                      {img && <img src={img.url} alt={p.node.title} className="w-full h-48 object-cover" />}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{p.node.title}</h3>
                          <Badge variant="secondary">
                            {variant.price.currencyCode} {parseFloat(variant.price.amount).toFixed(2)}
                          </Badge>
                        </div>
                        {p.node.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.node.description}</p>
                        )}
                        <Button
                          variant="gradient"
                          size="sm"
                          className="w-full"
                          disabled={!variant.availableForSale || cartLoading}
                          onClick={() =>
                            addToCart({
                              product: p,
                              variantId: variant.id,
                              variantTitle: variant.title,
                              price: variant.price,
                              quantity: 1,
                              selectedOptions: variant.selectedOptions || [],
                            })
                          }
                        >
                          {cartLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : variant.availableForSale ? (
                            <><ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart</>
                          ) : (
                            'Sold Out'
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* Page indicator dots */}
        {hasAccess && hasMerch && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              aria-label="Show tracks"
              onClick={() => setShowMerch(false)}
              className={`h-2 rounded-full transition-all ${!showMerch ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/40'}`}
            />
            <button
              type="button"
              aria-label="Show merch"
              onClick={revealMerch}
              className={`h-2 rounded-full transition-all ${showMerch ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/40'}`}
            />
          </div>
        )}

        {/* Mini Player */}
        {audio.currentTrack && (
          <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50">
            <div className="px-4 py-3 flex items-center gap-3 max-w-3xl mx-auto">
              {coverArt && <img src={coverArt} alt="Now Playing" className="w-10 h-10 rounded object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{audio.currentTrack.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={audio.togglePlayPause} className="h-10 w-10">
                {audio.isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => audio.skipToNext(trackList)} className="h-10 w-10">
                <SkipForward className="h-5 w-5" fill="currentColor" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ArtistPage;
