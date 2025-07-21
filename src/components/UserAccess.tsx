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
    if (currentPlaying === fileId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // In a real app, you would load the actual audio file here
      // For demo, we'll use a placeholder audio element
      if (audioRef.current) {
        audioRef.current.src = `https://www.soundjay.com/misc/sounds/bell-ringing-05.wav`; // Demo audio
        audioRef.current.play();
        setCurrentPlaying(fileId);
        setIsPlaying(true);
      }
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
      setIsPlaying(false);
      setCurrentPlaying(null);
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

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with access info */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Audio Library
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="flex items-center gap-1">
                {accessInfo?.accessType === 'indefinite' ? (
                  <Infinity className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                {accessInfo?.accessType} access
              </Badge>
              {accessInfo?.expiresAt && (
                <Badge variant="secondary">
                  Expires: {accessInfo.expiresAt.toLocaleString()}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        {/* Audio Player */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Audio Files
            </CardTitle>
            <CardDescription>
              Click on any audio file to start playback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {audioFiles.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                    currentPlaying === file.id 
                      ? 'bg-primary/5 border-primary shadow-glow' 
                      : 'bg-background hover:bg-muted/50'
                  }`}
                  onClick={() => playAudio(file.id)}
                >
                  <div className="flex items-center gap-3">
                    <Button
                      variant={currentPlaying === file.id && isPlaying ? "default" : "outline"}
                      size="sm"
                      className="shrink-0"
                    >
                      {currentPlaying === file.id && isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Duration: {file.duration} • Size: {file.size}
                      </p>
                    </div>
                  </div>
                  
                  {currentPlaying === file.id && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMute();
                        }}
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hidden audio element */}
        <audio ref={audioRef} />
      </div>
    </div>
  );
};

export default UserAccess;