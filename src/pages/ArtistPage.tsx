import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Heart, Unlock, Instagram, Twitter, Youtube, Globe, ShoppingBag, ExternalLink, Music, SkipForward, Loader2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAudio } from '@/contexts/AudioContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchProductsByArtist, ShopifyProduct } from '@/lib/shopify';
import { useCartStore } from '@/stores/cartStore';
import { CartDrawer } from '@/components/shop/CartDrawer';

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

  const addToCart = useCartStore((s) => s.addItem);
  const cartLoading = useCartStore((s) => s.isLoading);

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

      // Load cover art from admin settings
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('cover_art_url')
        .eq('admin_id', profileData.user_id)
        .single();

      if (settings?.cover_art_url) setCoverArt(settings.cover_art_url);

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
      const { data: keyRow, error } = await supabase
        .from('access_keys')
        .select('*')
        .eq('key_code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!keyRow) {
        if (!silent) toast({ title: 'Invalid key', description: 'This key is not valid.', variant: 'destructive' });
        return false;
      }

      const belongsToArtist =
        (keyRow as any).artist_profile_id === profileData.id ||
        keyRow.created_by === profileData.user_id;

      if (!belongsToArtist) {
        if (!silent) toast({ title: 'Wrong artist', description: 'This key is not valid for this artist.', variant: 'destructive' });
        return false;
      }

      if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
        if (!silent) toast({ title: 'Key expired', description: 'This key has expired.', variant: 'destructive' });
        return false;
      }

      setHasAccess(true);
      localStorage.setItem(`artist_access_${profileData.id}`, JSON.stringify({
        accessType: keyRow.access_type,
        expiresAt: keyRow.expires_at,
        includesMerch: (keyRow as any).includes_merch,
        enteredAt: new Date().toISOString(),
      }));

      await loadAudioFiles(profileData.user_id);
      if (!silent) {
        toast({ title: 'Access granted!', description: `${keyRow.access_type} access activated for ${profileData.display_name}.` });
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
    const track = {
      id: file.id,
      name: file.file_name,
      duration: file.duration || '0:00',
      size: file.file_size || '',
      url: file.file_url,
    };
    await audio.playTrack(track);
  };

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
      {/* Header / Profile Section */}
      <div className="relative">
        {profile.banner_image_url && (
          <div className="h-48 w-full overflow-hidden">
            <img src={profile.banner_image_url} alt="Banner" className="w-full h-full object-cover" />
          </div>
        )}
        <div className={`px-6 ${profile.banner_image_url ? '-mt-16' : 'pt-8'}`}>
          <div className="max-w-3xl mx-auto flex items-end gap-4">
            {profile.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.display_name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-primary/10 flex items-center justify-center shadow-lg">
                <Music className="h-10 w-10 text-primary" />
              </div>
            )}
            <div className="pb-2">
              <h1 className="text-2xl md:text-3xl font-bold">{profile.display_name}</h1>
              <p className="text-muted-foreground text-sm">@{profile.username}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-8">
        {/* Bio */}
        {profile.bio && (
          <p className="text-foreground/80 leading-relaxed">{profile.bio}</p>
        )}

        {/* Social Links */}
        {Object.values(socialLinks).some(Boolean) && (
          <div className="flex gap-3 flex-wrap">
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

        {/* Cover Art */}
        {coverArt && (
          <div className="max-w-sm mx-auto">
            <img src={coverArt} alt="Album Cover" className="w-full aspect-square object-cover rounded-2xl shadow-glow" />
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
        {hasAccess && audioFiles.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Music className="h-5 w-5" /> Tracks
            </h2>
            <div className="space-y-1">
              {audioFiles.map((file, index) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                    audio.currentTrack?.id === file.id ? 'bg-primary/10' : 'hover:bg-muted/30'
                  }`}
                  onClick={() => playTrack(file)}
                >
                  <span className="text-muted-foreground text-sm w-6">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${audio.currentTrack?.id === file.id ? 'text-primary' : ''}`}>
                      {file.file_name}
                    </p>
                  </div>
                  {audio.currentTrack?.id === file.id && audio.isPlaying ? (
                    <Pause className="h-5 w-5 text-primary" />
                  ) : (
                    <Play className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasAccess && audioFiles.length === 0 && (
          <div className="text-center py-8">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No tracks available yet</p>
          </div>
        )}

        {/* Merch Section */}
        {merch.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" /> Merch
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {merch.map((item) => (
                <Card key={item.id} className="overflow-hidden bg-card/50 backdrop-blur-sm">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <Badge variant="secondary">${Number(item.price).toFixed(2)}</Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                    )}
                    {item.external_link && (
                      <a href={item.external_link} target="_blank" rel="noopener noreferrer">
                        <Button variant="gradient" size="sm" className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" /> Buy Now
                        </Button>
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
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
    </div>
  );
};

export default ArtistPage;
