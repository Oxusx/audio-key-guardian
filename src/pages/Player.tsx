import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, MoreHorizontal, SkipBack, SkipForward, Play, Pause, Volume2, VolumeX, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/contexts/AudioContext';
import defaultCover from '@/assets/cover-art.jpeg';
import localforage from 'localforage';
import { supabase } from '@/integrations/supabase/client';

interface AudioFile {
  id: string;
  name: string;
  duration: string;
  size: string;
}

const Player = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const audio = useAudio();
  const { allTracks } = location.state || {};
  
  const [coverArt, setCoverArt] = useState<string>(defaultCover);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [likeCount, setLikeCount] = useState(0);

  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 150;

  // Load saved cover art from IndexedDB
  useEffect(() => {
    (async () => {
      try {
        const savedCover = await localforage.getItem<string>('projectCoverArt');
        if (savedCover) {
          setCoverArt(savedCover);
        } else {
          // Fallback to localStorage if not in IndexedDB yet
          const localCover = localStorage.getItem('projectCoverArt');
          if (localCover) setCoverArt(localCover);
        }
      } catch (err) {
        console.error('Error loading cover art:', err);
      }
    })();
  }, []);

  // Fetch like count when track changes
  useEffect(() => {
    if (audio.currentTrack) {
      fetchLikeCount();
    }
  }, [audio.currentTrack]);

  const handlePrevious = async () => {
    if (!allTracks) return;
    await audio.skipToPrevious(allTracks);
  };

  const handleNext = async () => {
    if (!allTracks) return;
    await audio.skipToNext(allTracks);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeRemaining = (time: number) => {
    if (isNaN(time)) return '-0:00';
    const remaining = audio.duration - time;
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    return `-${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLike = async () => {
    if (!audio.currentTrack) return;
    try {
      await supabase.from('track_likes').insert({ track_name: audio.currentTrack.name });
      setLikeCount(prev => prev + 1);
    } catch (error) {
      console.error('Error liking track:', error);
    }
  };

  const fetchLikeCount = async () => {
    if (!audio.currentTrack) return;
    const { data, error } = await supabase.rpc('get_track_like_count', {
      track_name_param: audio.currentTrack.name
    });
    if (!error && data !== null) {
      setLikeCount(data);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientY;
    setTouchEnd(currentTouch);
    if (touchStart) {
      const distance = currentTouch - touchStart;
      // Only track downward swipes
      if (distance > 0) {
        setSwipeDistance(distance);
      }
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchEnd - touchStart;
    const isDownSwipe = distance > minSwipeDistance;
    
    if (isDownSwipe) {
      navigate('/');
    }
    
    // Reset states
    setTouchStart(null);
    setTouchEnd(null);
    setSwipeDistance(0);
  };

  if (!audio.currentTrack) {
    navigate('/');
    return null;
  }

  return (
    <div 
      className="min-h-screen bg-background relative flex flex-col transition-transform duration-200"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: swipeDistance > 0 ? `translateY(${Math.min(swipeDistance, 200)}px)` : 'none',
        opacity: swipeDistance > 0 ? Math.max(1 - swipeDistance / 400, 0.7) : 1
      }}
    >
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
              {audio.currentTrack.name}
            </h1>
            <p className="text-lg text-muted-foreground truncate">
              {audio.currentTrack.duration} • {audio.currentTrack.size}
            </p>
          </div>
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
          >
            <Heart className="h-5 w-5" />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-8 pb-2">
        <Slider
          value={[audio.currentTime]}
          max={audio.duration || 100}
          step={0.1}
          onValueChange={(val) => audio.seekTo(val[0])}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(audio.currentTime)}</span>
          <span>{formatTimeRemaining(audio.currentTime)}</span>
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
            onClick={audio.togglePlayPause}
            className="h-20 w-20"
          >
            {audio.isPlaying ? (
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
            onClick={audio.toggleMute}
          >
            {audio.isMuted || audio.volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
          <Slider
            value={[audio.isMuted ? 0 : audio.volume]}
            max={100}
            step={1}
            onValueChange={(val) => audio.setVolume(val[0])}
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
    </div>
  );
};

export default Player;
