import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, VolumeX, Lock, Unlock, Clock, Infinity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const UserAccess = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Mock audio files - in real app, these would come from the server
  const audioFiles: AudioFile[] = [
    { id: '1', name: 'Track 1.wav', duration: '3:45', size: '8.2 MB' },
    { id: '2', name: 'Track 2.wav', duration: '4:12', size: '9.1 MB' },
    { id: '3', name: 'Track 3.wav', duration: '2:58', size: '6.8 MB' },
    { id: '4', name: 'Track 4.wav', duration: '5:23', size: '11.4 MB' },
    { id: '5', name: 'Track 5.wav', duration: '3:17', size: '7.5 MB' },
  ];

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
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeAttribute('src');
          audioRef.current.load();
        }
        setCurrentPlaying(null);
        setIsPlaying(false);
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

  const playAudio = (fileId: string) => {
    const trackIndex = audioFiles.findIndex(file => file.id === fileId);
    
    if (currentPlaying === fileId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // In a real app, you would load the actual audio file here
      // For demo, we'll use a placeholder audio element
      if (audioRef.current) {
        // Enable background playback
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: audioFiles[trackIndex]?.name || 'Audio Track',
            artist: 'Audio Key Guardian',
            album: 'Audio Collection',
            artwork: [
              { src: '/placeholder.svg', sizes: '96x96', type: 'image/svg+xml' },
              { src: '/placeholder.svg', sizes: '128x128', type: 'image/svg+xml' },
              { src: '/placeholder.svg', sizes: '192x192', type: 'image/svg+xml' },
              { src: '/placeholder.svg', sizes: '256x256', type: 'image/svg+xml' },
            ]
          });

          navigator.mediaSession.setActionHandler('play', () => {
            audioRef.current?.play();
            setIsPlaying(true);
          });

          navigator.mediaSession.setActionHandler('pause', () => {
            audioRef.current?.pause();
            setIsPlaying(false);
          });

          navigator.mediaSession.setActionHandler('nexttrack', () => {
            playNextTrack();
          });

          navigator.mediaSession.setActionHandler('previoustrack', () => {
            playPreviousTrack();
          });
        }

        audioRef.current.src = `https://www.soundjay.com/misc/sounds/bell-ringing-05.wav`; // Demo audio
        audioRef.current.play();
        setCurrentPlaying(fileId);
        setCurrentTrackIndex(trackIndex);
        setIsPlaying(true);
      }
    }
  };

  const playNextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % audioFiles.length;
    const nextTrack = audioFiles[nextIndex];
    if (nextTrack) {
      playAudio(nextTrack.id);
    }
  };

  const playPreviousTrack = () => {
    const prevIndex = currentTrackIndex === 0 ? audioFiles.length - 1 : currentTrackIndex - 1;
    const prevTrack = audioFiles[prevIndex];
    if (prevTrack) {
      playAudio(prevTrack.id);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAccessInfo(null);
    setPassword('');
    setCurrentPlaying(null);
    setIsPlaying(false);
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

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      // Auto-advance to next track
      playNextTrack();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
              Audio Access Portal
            </CardTitle>
            <CardDescription>
              Enter your access password to listen to audio files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Access Password</Label>
                <Input
                  id="password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-2"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" className="w-full" variant="gradient">
                <Unlock className="h-4 w-4 mr-2" />
                Access Audio Library
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center mb-2">Demo Passwords:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><code className="bg-background px-1 rounded">DEMO24H</code> - 24 hour access</p>
                <p><code className="bg-background px-1 rounded">DEMO48H</code> - 48 hour access</p>
                <p><code className="bg-background px-1 rounded">DEMOINF</code> - Indefinite access</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get cover art from localStorage
  const coverArt = localStorage.getItem('audioCoverArt');

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-md mx-auto">
        {/* Header with logout */}
        <div className="flex justify-end p-4">
          <Button variant="ghost" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>

        {/* Cover Art */}
        <div className="px-6 pb-6">
          <div className="aspect-square w-full mb-6 rounded-2xl overflow-hidden shadow-elegant">
            {coverArt ? (
              <img 
                src={coverArt} 
                alt="Album Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                <Volume2 className="h-16 w-16 text-white/80" />
              </div>
            )}
          </div>

          {/* Access Info */}
          <div className="flex justify-center gap-2 mb-8">
            <Badge variant="outline" className="flex items-center gap-1">
              {accessInfo?.accessType === 'indefinite' ? (
                <Infinity className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {accessInfo?.accessType} access
            </Badge>
          </div>

          {/* Track List */}
          <div className="space-y-2 mb-6">
            {audioFiles.map((file, index) => (
              <div
                key={file.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                  currentPlaying === file.id 
                    ? 'bg-primary/10' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => playAudio(file.id)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded bg-muted text-sm font-medium">
                  {currentPlaying === file.id && isPlaying ? (
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${currentPlaying === file.id ? 'text-primary' : ''}`}>
                    {file.name.replace('.wav', '')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Investment Button temporarily hidden */}
        </div>

        {/* Bottom Media Controls - Only show when playing */}
        {currentPlaying && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t">
            <div className="max-w-md mx-auto p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {audioFiles.find(f => f.id === currentPlaying)?.name.replace('.wav', '')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={playPreviousTrack}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                    </svg>
                  </Button>
                  
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-full w-12 h-12"
                    onClick={() => playAudio(currentPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={playNextTrack}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden audio element */}
        <audio ref={audioRef} />
      </div>
    </div>
  );
};

export default UserAccess;