import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Volume2, Settings, Unlock, Pause, SkipForward } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import defaultCover from '@/assets/cover-art.jpeg';
import localforage from 'localforage';

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
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [coverArt, setCoverArt] = useState<string>('');
  const [currentTrack, setCurrentTrack] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedAudioFiles, setSavedAudioFiles] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Mock audio files - will be replaced by uploaded files if available
  const defaultAudioFiles: AudioFile[] = [
    { id: '1', name: 'Track 1.wav', duration: '3:45', size: '8.2 MB' },
    { id: '2', name: 'Track 2.wav', duration: '4:12', size: '9.1 MB' },
    { id: '3', name: 'Track 3.wav', duration: '2:58', size: '6.8 MB' },
    { id: '4', name: 'Track 4.wav', duration: '5:23', size: '11.4 MB' },
    { id: '5', name: 'Track 5.wav', duration: '3:17', size: '7.5 MB' },
  ];

  const audioFiles = savedAudioFiles.length > 0 
    ? savedAudioFiles.map((file, index) => ({
        id: file.id,
        name: file.name,
        duration: '0:00', // Will be calculated when loaded
        size: 'Uploaded'
      }))
    : defaultAudioFiles;

  // Mock password validation - in real app, this would be server-side
  const validatePassword = (inputPassword: string) => {
    // Simulate some valid passwords for demo
    const validPasswords = [
      { password: 'DEMO24H', accessType: '24h' as const, hours: 24 },
      { password: 'DEMO48H', accessType: '48h' as const, hours: 48 },
      { password: 'DEMOINF', accessType: 'indefinite' as const, hours: null },
    ];

    const found = validPasswords.find(p => p.password === inputPassword.toUpperCase());
    if (found) {
      const now = new Date();
      const expiresAt = found.hours ? new Date(now.getTime() + found.hours * 60 * 60 * 1000) : null;
      
      return {
        accessType: found.accessType,
        expiresAt,
        isValid: true,
      };
    }
    return null;
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter an access password.",
        variant: "destructive",
      });
      return;
    }

    const accessData = validatePassword(password);
    
    if (accessData) {
      setAccessInfo(accessData);
      setIsAuthenticated(true);
      
      // Store access info in localStorage for persistence
      localStorage.setItem('audioAccessInfo', JSON.stringify({
        ...accessData,
        enteredAt: new Date().toISOString(),
      }));
      
      toast({
        title: "Access granted",
        description: `${accessData.accessType} access activated successfully.`,
      });
    } else {
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
    console.log('Playing audio, fileId:', fileId);
    console.log('Available savedAudioFiles:', savedAudioFiles.length);
    console.log('AudioFiles list:', audioFiles.map(f => f.id));
    const selectedTrack = audioFiles.find(f => f.id === fileId);
    if (!selectedTrack) return;
    setCurrentTrack(selectedTrack);
    if (!audioRef.current) return;

    try {
      // Try to load from IndexedDB via localforage
      let src: string | null = null;
      const stored = await localforage.getItem<string>(`audio:${fileId}`);
      if (stored) {
        console.log('Using uploaded audio from IndexedDB');
        src = stored;
      } else {
        console.log('Using demo audio - no saved audio found');
        src = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
      }
      audioRef.current.src = src;
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing audio', err);
      toast({ title: 'Playback error', description: 'Could not start audio playback.', variant: 'destructive' });
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const openFullPlayer = () => {
    if (currentTrack) {
      navigate('/player', { 
        state: { 
          track: currentTrack,
          allTracks: audioFiles,
          isPlaying: isPlaying
        } 
      });
    }
  };

  const skipToNext = async () => {
    if (!currentTrack) return;
    const currentIndex = audioFiles.findIndex(t => t.id === currentTrack.id);
    const nextIndex = currentIndex < audioFiles.length - 1 ? currentIndex + 1 : 0;
    const nextTrack = audioFiles[nextIndex];
    setCurrentTrack(nextTrack);
    if (!audioRef.current) return;

    const stored = await localforage.getItem<string>(`audio:${nextTrack.id}`);
    audioRef.current.src = stored || 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
    await audioRef.current.play();
    setIsPlaying(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAccessInfo(null);
    setPassword('');
    localStorage.removeItem('audioAccessInfo');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
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
      }
    }
  }, []);

  // Check access expiry every minute
  useEffect(() => {
    const interval = setInterval(checkAccessExpiry, 60000);
    return () => clearInterval(interval);
  }, [accessInfo]);

  // Load saved cover art and audio metadata
  useEffect(() => {
    (async () => {
      try {
        // Check IndexedDB first for cover art
        const coverFromDB = await localforage.getItem<string>('projectCoverArt');
        if (coverFromDB) {
          setCoverArt(coverFromDB);
        } else {
          // Fallback to localStorage
          const savedCover = localStorage.getItem('projectCoverArt');
          if (savedCover) {
            setCoverArt(savedCover);
          } else {
            setCoverArt(defaultCover);
          }
        }

        // Load saved audio metadata (ids and names)
        const savedAudio = localStorage.getItem('projectAudioFiles');
        console.log('Loading from localStorage - projectAudioFiles:', savedAudio ? 'Found' : 'Not found');
        if (savedAudio) {
          try {
            const parsedAudio = JSON.parse(savedAudio);
            console.log('Loaded audio files metadata:', parsedAudio);
            setSavedAudioFiles(parsedAudio);
          } catch (e) {
            console.error('Error loading saved audio metadata:', e);
          }
        }
      } catch (err) {
        console.error('Error initializing media from storage:', err);
      }
    })();
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background relative">
        {/* Admin Login Button - Top Right */}
        <div className="absolute top-6 right-6">
          <Link to="/admin">
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
    <div className="min-h-screen bg-background relative">
      {/* Admin Login Button - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Cover Art Section */}
      <div className="pt-16 px-6 pb-8">
        <div className="max-w-md mx-auto">
          {coverArt ? (
            <img 
              src={coverArt} 
              alt="Album Cover" 
              className="w-full aspect-square object-cover rounded-2xl shadow-glow"
            />
          ) : (
            <div className="w-full aspect-square bg-gradient-primary rounded-2xl shadow-glow flex items-center justify-center">
              <Volume2 className="h-24 w-24 text-primary-foreground/50" />
            </div>
          )}
        </div>
      </div>

      {/* Track List */}
      <div className="px-6 pb-32">
        <div className="max-w-3xl mx-auto space-y-1">
          {audioFiles.map((file, index) => (
            <div
              key={file.id}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                currentTrack?.id === file.id ? 'bg-primary/10' : 'hover:bg-muted/30'
              }`}
              onClick={() => playAudio(file.id)}
            >
              <span className="text-muted-foreground text-sm w-6">{index + 1}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${
                  currentTrack?.id === file.id ? 'text-primary' : 'text-foreground'
                }`}>
                  {file.name}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {file.duration}
                </p>
              </div>
              <Play className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Mini Player Bar */}
      {currentTrack && (
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
                {currentTrack.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.duration}
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
                {isPlaying ? (
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

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  );
};

export default Index;
