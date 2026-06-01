import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Volume2, Settings, Unlock, Pause, SkipForward, Key, Heart, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAudio } from '@/contexts/AudioContext';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import { useAnalytics } from '@/hooks/useAnalytics';
import defaultCover from '@/assets/cover-art.jpeg';
import localforage from 'localforage';
import { supabase } from '@/integrations/supabase/client';
import Footer from '@/components/Footer';

interface AudioFile {
  id: string;
  name: string;
  duration: string;
  size: string;
}

interface AccessInfo {
  accessType: '24h' | '48h' | 'indefinite';
  expiresAt: Date | null;
  isValid: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const audio = useAudio();
  const { toast } = useToast();
  const { logActivity } = useActivityTracking();
  const { trackEvent } = useAnalytics();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [coverArt, setCoverArt] = useState<string>('');
  const [savedAudioFiles, setSavedAudioFiles] = useState<any[]>([]);
  const [trackLikes, setTrackLikes] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [userSessionId, setUserSessionId] = useState<string>('');
  const [projectName, setProjectName] = useState('Music Project');
  const [totalBudget, setTotalBudget] = useState(10000);
  const [acceptInvestments, setAcceptInvestments] = useState(false);


  // Mock audio files - will be replaced by uploaded files if available
  const defaultAudioFiles: AudioFile[] = [];

  const audioFiles = savedAudioFiles.length > 0 
    ? savedAudioFiles.map((file) => ({
        id: file.id,
        name: file.file_name,
        duration: file.duration || '0:00',
        size: file.file_size || 'Uploaded'
      }))
    : defaultAudioFiles;

  // Validate password against database
  const validatePassword = async (inputPassword: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_access_key', {
        key_code_param: inputPassword.toUpperCase()
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        if (result.is_valid) {
          return {
            accessType: result.access_type as '24h' | '48h' | 'indefinite',
            expiresAt: result.expires_at ? new Date(result.expires_at) : null,
            isValid: true,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Key validation error:', error);
      return null;
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter an access password.",
        variant: "destructive",
      });
      return;
    }

    const accessData = await validatePassword(password);
    
    if (accessData) {
      setAccessInfo(accessData);
      setIsAuthenticated(true);
      
      // Generate unique session ID for this user
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setUserSessionId(sessionId);
      
      // Store access info in localStorage for persistence
      localStorage.setItem('audioAccessInfo', JSON.stringify({
        ...accessData,
        enteredAt: new Date().toISOString(),
        sessionId,
      }));
      
      // Track access key entry
      trackEvent({
        event_type: 'access_key_entered',
        event_data: { 
          accessType: accessData.accessType,
          expiresAt: accessData.expiresAt?.toISOString() || null
        },
      });

      logActivity({
        action_type: 'access_granted',
        action_details: { 
          accessType: accessData.accessType,
          expiresAt: accessData.expiresAt?.toISOString() || null 
        },
      });
      
      toast({
        title: "Access granted",
        description: `${accessData.accessType} access activated successfully.`,
      });
    } else {
      trackEvent({
        event_type: 'access_key_failed',
        event_data: { attempted: true },
      });
      
      toast({
        title: "Invalid password",
        description: "The password you entered is not valid or has expired.",
        variant: "destructive",
      });
    }
  };

  const checkAccessExpiry = () => {
    if (accessInfo && accessInfo.expiresAt) {
      const now = new Date();
      if (now > accessInfo.expiresAt) {
        logActivity({
          action_type: 'access_expired',
          action_details: { 
            accessType: accessInfo.accessType,
            expiresAt: accessInfo.expiresAt.toISOString()
          },
        });
        
        setIsAuthenticated(false);
        setAccessInfo(null);
        localStorage.removeItem('audioAccessInfo');
        toast({
          title: "Access expired",
          description: "Your access period has ended. Please enter a new password.",
          variant: "destructive",
        });
      }
    }
  };

  const playAudio = async (fileId: string) => {
    const selectedTrack = audioFiles.find(f => f.id === fileId);
    if (!selectedTrack) return;
    
    // Get the actual file URL from database
    const dbFile = savedAudioFiles.find(f => f.id === fileId);
    if (dbFile && dbFile.file_url) {
      // Create audio file object with the URL
      const trackWithUrl = {
        ...selectedTrack,
        url: dbFile.file_url
      };
      await audio.playTrack(trackWithUrl);
    } else {
      await audio.playTrack(selectedTrack);
    }
  };

  const togglePlayPause = () => {
    audio.togglePlayPause();
  };

  const openFullPlayer = () => {
    if (audio.currentTrack) {
      navigate('/player', { 
        state: { 
          allTracks: audioFiles
        } 
      });
    }
  };

  const skipToNext = async () => {
    await audio.skipToNext(audioFiles);
  };

  const logout = () => {
    logActivity({
      action_type: 'user_logout',
      action_details: { reason: 'manual', from: 'index' },
    });
    
    setIsAuthenticated(false);
    setAccessInfo(null);
    setPassword('');
    localStorage.removeItem('audioAccessInfo');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const handleLike = async (trackName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!userSessionId) return;
    
    // Check if already liked
    if (userLikes.has(trackName)) {
      toast({
        title: "Already liked",
        description: "You've already liked this track.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase.from('track_likes').insert({ 
        track_name: trackName,
        user_session_id: userSessionId
      });
      
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already liked",
            description: "You've already liked this track.",
            variant: "destructive",
          });
        }
        return;
      }
      
      setUserLikes(prev => new Set(prev).add(trackName));
      setTrackLikes(prev => ({
        ...prev,
        [trackName]: (prev[trackName] || 0) + 1
      }));
    } catch (error) {
      console.error('Error liking track:', error);
    }
  };

  const fetchLikeCounts = async () => {
    const counts: Record<string, number> = {};
    for (const file of audioFiles) {
      const { data, error } = await supabase.rpc('get_track_like_count', {
        track_name_param: file.name
      });
      if (!error && data !== null) {
        counts[file.name] = data;
      }
    }
    setTrackLikes(counts);
  };

  const fetchUserLikes = async () => {
    if (!userSessionId) return;
    
    const likedTracks = new Set<string>();
    for (const file of audioFiles) {
      const { data, error } = await supabase.rpc('has_user_liked_track', {
        track_name_param: file.name,
        session_id_param: userSessionId
      });
      if (!error && data === true) {
        likedTracks.add(file.name);
      }
    }
    setUserLikes(likedTracks);
  };

  // Check for existing access on component mount
  useEffect(() => {
    const storedAccess = localStorage.getItem('audioAccessInfo');
    if (storedAccess) {
      const accessData = JSON.parse(storedAccess);
      if (accessData.expiresAt) {
        const expiresAt = new Date(accessData.expiresAt);
        const now = new Date();
        if (now <= expiresAt) {
          setAccessInfo({
            accessType: accessData.accessType,
            expiresAt,
            isValid: true,
          });
          setIsAuthenticated(true);
          setUserSessionId(accessData.sessionId || '');
        } else {
          localStorage.removeItem('audioAccessInfo');
        }
      } else {
        // Indefinite access
        setAccessInfo({
          accessType: accessData.accessType,
          expiresAt: null,
          isValid: true,
        });
        setIsAuthenticated(true);
        setUserSessionId(accessData.sessionId || '');
      }
    }
  }, []);

  // Check access expiry every minute
  useEffect(() => {
    const interval = setInterval(checkAccessExpiry, 60000);
    return () => clearInterval(interval);
  }, [accessInfo]);

  // Load saved cover art and audio files from database
  useEffect(() => {
    (async () => {
      try {
        // Load admin settings to get cover art and project details
        const { data: settings } = await supabase
          .from('admin_settings')
          .select('*')
          .limit(1)
          .single();

        if (settings) {
          if (settings.cover_art_url) {
            setCoverArt(settings.cover_art_url);
          } else {
            setCoverArt(defaultCover);
          }
          setProjectName(settings.project_name || 'Music Project');
          setTotalBudget(Number(settings.investment_budget) || 10000);
          setAcceptInvestments(((settings as any).accept_investments ?? false) && Number(settings.investment_budget) > 0);

          
          // Store in localStorage for investment page
          localStorage.setItem('projectName', settings.project_name || 'Music Project');
          localStorage.setItem('totalBudget', String(settings.investment_budget || 10000));
        } else {
          setCoverArt(defaultCover);
        }

        // Load audio files from database
        const { data: files } = await supabase
          .from('audio_files')
          .select('*')
          .order('created_at', { ascending: true });

        if (files && files.length > 0) {
          setSavedAudioFiles(files);
        }
      } catch (err) {
        console.error('Error loading media:', err);
        setCoverArt(defaultCover);
      }
    })();
  }, []);

  // Fetch like counts and user likes when authenticated
  useEffect(() => {
    if (isAuthenticated && audioFiles.length > 0 && userSessionId) {
      fetchLikeCounts();
      fetchUserLikes();
    }
  }, [isAuthenticated, savedAudioFiles, userSessionId]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background relative">
        {/* Admin Login Button - Top Right */}
        <div className="absolute top-6 right-6">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Main Password Entry */}
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="KEY"
                className="text-center text-2xl font-mono tracking-widest h-16 bg-card/50 border-primary/30 focus:border-primary backdrop-blur-sm"
                autoComplete="off"
                autoFocus
              />
              <Button type="submit" className="w-full" variant="gradient" size="lg">
                <Unlock className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Blurred backdrop (Apple Music style) */}
      {coverArt && (
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage: `url(${coverArt})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(80px) saturate(180%)',
            transform: 'scale(1.2)',
          }}
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/70 to-background" />

      {/* Admin Login Button - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground text-xs">
          Logout
        </Button>
        <Link to="/auth">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Header: Cover + Title (Apple Music album header) */}
      <div className="pt-20 px-6 pb-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
          {coverArt ? (
            <img
              src={coverArt}
              alt="Album Cover"
              className="w-64 h-64 md:w-72 md:h-72 object-cover rounded-2xl shadow-2xl"
            />
          ) : (
            <div className="w-64 h-64 md:w-72 md:h-72 bg-gradient-primary rounded-2xl shadow-2xl flex items-center justify-center">
              <Volume2 className="h-24 w-24 text-primary-foreground/50" />
            </div>
          )}
          <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight">{projectName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {audioFiles.length} {audioFiles.length === 1 ? 'track' : 'tracks'}
          </p>
          {audioFiles.length > 0 && (
            <Button
              variant="gradient"
              size="lg"
              className="mt-5 rounded-full px-8"
              onClick={() => playAudio(audioFiles[0].id)}
            >
              <Play className="h-5 w-5 mr-1" fill="currentColor" /> Play
            </Button>
          )}
        </div>
      </div>

      {/* Track List */}
      <div className="px-4 md:px-6 pb-32">
        <div className="max-w-3xl mx-auto">
          {audioFiles.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No tracks available yet</p>
              <p className="text-sm text-muted-foreground">The admin hasn't uploaded any audio files yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {audioFiles.map((file, index) => {
                const isCurrent = audio.currentTrack?.id === file.id;
                return (
                  <div
                    key={file.id}
                    className={`group flex items-center gap-4 px-3 py-3 rounded-lg transition-colors cursor-pointer ${
                      isCurrent ? 'bg-primary/10' : 'hover:bg-muted/40'
                    }`}
                    onClick={() => playAudio(file.id)}
                  >
                    <div className="w-6 text-center text-sm text-muted-foreground tabular-nums">
                      {isCurrent && audio.isPlaying ? (
                        <Pause className="h-4 w-4 mx-auto text-primary" fill="currentColor" />
                      ) : (
                        <span className="group-hover:hidden">{index + 1}</span>
                      )}
                      {!isCurrent && (
                        <Play className="h-4 w-4 mx-auto hidden group-hover:block" fill="currentColor" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                        {file.name}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleLike(file.name, e)}
                      className={`flex items-center gap-1 transition-colors shrink-0 ${
                        userLikes.has(file.name) ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                      }`}
                    >
                      <Heart className="h-4 w-4" fill={userLikes.has(file.name) ? 'currentColor' : 'none'} />
                      <span className="text-xs tabular-nums">{trackLikes[file.name] || 0}</span>
                    </button>
                    <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                      {file.duration}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

        
        {/* Invest Button temporarily hidden — backend still active */}
        {false && acceptInvestments && (
          <div className="max-w-3xl mx-auto mt-8">
            <Link to="/investment">
              <Button variant="gradient" size="lg" className="w-full">
                Invest in This Project
              </Button>
            </Link>
          </div>
        )}
        </div>
      </div>


      {/* Mini Player Bar */}
      {audio.currentTrack && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 cursor-pointer"
          onClick={openFullPlayer}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <img 
              src={coverArt} 
              alt="Now Playing" 
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {audio.currentTrack.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {audio.currentTrack.duration}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="h-10 w-10"
              >
                {audio.isPlaying ? (
                  <Pause className="h-5 w-5" fill="currentColor" />
                ) : (
                  <Play className="h-5 w-5" fill="currentColor" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  skipToNext();
                }}
                className="h-10 w-10"
              >
                <SkipForward className="h-5 w-5" fill="currentColor" />
              </Button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Index;
