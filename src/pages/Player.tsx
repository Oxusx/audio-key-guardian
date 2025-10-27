import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, MoreHorizontal, SkipBack, SkipForward, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Slider } from '@/components/ui/slider';
import defaultCover from '@/assets/cover-art.jpeg';

interface AudioFile {
  id: string;
  name: string;
  duration: string;
  size: string;
}

const Player = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { track, allTracks } = location.state || {};
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [coverArt, setCoverArt] = useState<string>(defaultCover);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load saved cover art
  useEffect(() => {
    const savedCover = localStorage.getItem('projectCoverArt');
    if (savedCover) setCoverArt(savedCover);
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      handleNext();
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

  // Auto-play when component mounts
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handlePrevious = () => {
    if (!allTracks || !track) return;
    const currentIndex = allTracks.findIndex((t: AudioFile) => t.id === track.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : allTracks.length - 1;
    const previousTrack = allTracks[previousIndex];
    navigate('/player', { 
      state: { track: previousTrack, allTracks },
      replace: true 
    });
  };

  const handleNext = () => {
    if (!allTracks || !track) return;
    const currentIndex = allTracks.findIndex((t: AudioFile) => t.id === track.id);
    const nextIndex = currentIndex < allTracks.length - 1 ? currentIndex + 1 : 0;
    const nextTrack = allTracks[nextIndex];
    navigate('/player', { 
      state: { track: nextTrack, allTracks },
      replace: true 
    });
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeRemaining = (time: number) => {
    if (isNaN(time)) return '-0:00';
    const remaining = duration - time;
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    return `-${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!track) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="text-foreground"
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Cover Art */}
      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-md">
          <img
            src={coverArt}
            alt="Album Cover"
            className="w-full aspect-square object-cover rounded-2xl shadow-glow"
          />
        </div>
      </div>

      {/* Track Info */}
      <div className="px-8 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate mb-1">
              {track.name}
            </h1>
            <p className="text-lg text-muted-foreground truncate">
              {track.duration} • {track.size}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-8 pb-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTimeRemaining(currentTime)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-center gap-8">
          <Button
            variant="ghost"
            size="lg"
            onClick={handlePrevious}
            className="h-16 w-16"
          >
            <SkipBack className="h-10 w-10" fill="currentColor" />
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlay}
            className="h-20 w-20"
          >
            {isPlaying ? (
              <Pause className="h-14 w-14" fill="currentColor" />
            ) : (
              <Play className="h-14 w-14" fill="currentColor" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={handleNext}
            className="h-16 w-16"
          >
            <SkipForward className="h-10 w-10" fill="currentColor" />
          </Button>
        </div>
      </div>

      {/* Volume Control */}
      <div className="px-8 pb-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
          >
            <Volume2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  );
};

export default Player;
