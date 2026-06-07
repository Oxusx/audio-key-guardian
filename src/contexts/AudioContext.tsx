import React, { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react';
import localforage from 'localforage';

interface AudioFile {
  id: string;
  name: string;
  duration: string;
  size: string;
  url?: string;
}

interface AudioContextType {
  currentTrack: AudioFile | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  playTrack: (track: AudioFile) => Promise<void>;
  togglePlayPause: () => void;
  skipToNext: (allTracks: AudioFile[]) => Promise<void>;
  skipToPrevious: (allTracks: AudioFile[]) => Promise<void>;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  seekTo: (time: number) => void;
  stopAndReset: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider = ({ children }: AudioProviderProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Set up audio event listeners and MediaSession for background audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Set initial volume
    audio.volume = volume / 100;

    // Set up MediaSession API for background audio controls
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name,
        artist: 'Audio Key Guardian',
        album: 'Exclusive Tracks',
        artwork: [
          { src: '/favicon.ico', sizes: '96x96', type: 'image/png' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audio.play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        // Will be handled by component
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        // Will be handled by component
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime) {
          audio.currentTime = details.seekTime;
        }
      });
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [volume, currentTrack]);

  const playTrack = async (track: AudioFile) => {
    if (!audioRef.current) return;
    
    try {
      // Use the URL from the track if available, otherwise try localforage for backward compatibility
      let src = track.url;
      if (!src) {
        const stored = await localforage.getItem<string>(`audio:${track.id}`);
        src = stored || 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
      }
      
      // Only change src if it's a different track
      if (currentTrack?.id !== track.id) {
        audioRef.current.src = src;
        setCurrentTrack(track);
        
        // Update MediaSession metadata
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: track.name,
            artist: 'Audio Key Guardian',
            album: 'Exclusive Tracks',
            artwork: [
              { src: '/favicon.ico', sizes: '96x96', type: 'image/png' },
            ]
          });
        }
      }
      
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing track:', err);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const skipToNext = async (allTracks: AudioFile[]) => {
    if (!currentTrack || !audioRef.current) return;
    
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = currentIndex < allTracks.length - 1 ? currentIndex + 1 : 0;
    const nextTrack = allTracks[nextIndex];
    
    await playTrack(nextTrack);
  };

  const skipToPrevious = async (allTracks: AudioFile[]) => {
    if (!currentTrack || !audioRef.current) return;
    
    const currentIndex = allTracks.findIndex(t => t.id === currentTrack.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : allTracks.length - 1;
    const previousTrack = allTracks[previousIndex];
    
    await playTrack(previousTrack);
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const stopAndReset = () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch {}
    }
    setIsPlaying(false);
    setCurrentTrack(null);
    setCurrentTime(0);
    setDuration(0);
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isMuted,
        volume,
        currentTime,
        duration,
        audioRef,
        playTrack,
        togglePlayPause,
        skipToNext,
        skipToPrevious,
        setVolume,
        toggleMute,
        seekTo,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        controlsList="nodownload noplaybackrate noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        {...({ disableRemotePlayback: true, disablePictureInPicture: true } as any)}
      />
    </AudioContext.Provider>
  );
};
