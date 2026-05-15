'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hls, { Level } from 'hls.js';

type VideoPlayerProps = {
  src?: string | null;
  title?: string;
  onProgress?: (progress: number) => void;
  autoPlay?: boolean;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const VideoPlayer = ({ src, title, onProgress, autoPlay = false }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const qualitiesRef = useRef<number[]>([]);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [volumeBeforeMute, setVolumeBeforeMute] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [qualities, setQualities] = useState<number[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [isHLSReady, setIsHLSReady] = useState(false);

  const effectiveSrc = useMemo(() => src ?? null, [src]);

  // Montage component
  useEffect(() => {
    setMounted(true);
    const hideTimeout = hideTimeoutRef.current;
    const progressInterval = progressIntervalRef.current;
    return () => {
      if (hideTimeout) clearTimeout(hideTimeout);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, []);

  // 🎬 HLS INIT
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveSrc) return;

    setError(null);
    setIsHLSReady(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported() && effectiveSrc.endsWith('.m3u8')) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hls.loadSource(effectiveSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((l: Level) => l.height).filter(Boolean);
        qualitiesRef.current = levels;
        setQualities(levels);
        setIsHLSReady(true);

        // Restaurer la qualité sauvegardée
        const savedQuality = localStorage.getItem(`video-quality-${effectiveSrc}`);
        if (savedQuality && parseInt(savedQuality) >= -1) {
          const qualityIndex = parseInt(savedQuality);
          if (qualityIndex >= -1 && qualityIndex < levels.length) {
            hls.currentLevel = qualityIndex;
            setCurrentQuality(qualityIndex);
          }
        }

        // Déclencher l'autoPlay ici : le manifeste est parsé, la source est prête
        if (autoPlay) {
          video.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentQuality(data.level);
        if (data.level >= 0 && qualitiesRef.current[data.level]) {
          localStorage.setItem(`video-quality-${effectiveSrc}`, data.level.toString());
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('Fatal HLS error:', data);
          setError('Erreur de streaming. Tentative de reconnection...');
          // Tentative de reconnection
          hls.recoverMediaError();
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari : lecture HLS native
      video.src = effectiveSrc;
      setIsHLSReady(true);
    } else {
      video.src = effectiveSrc;
      setIsHLSReady(true);
    }

    return () => {
      hlsRef.current?.destroy();
    };
  }, [effectiveSrc, autoPlay, mounted]);

  // Restaurer la progression sauvegardée
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mounted) return;

    const savedProgress = localStorage.getItem(`video-progress-${effectiveSrc}`);
    if (savedProgress && !autoPlay) {
      const savedTime = parseFloat(savedProgress);
      if (savedTime > 5 && savedTime < (duration || Infinity) - 5) {
        video.currentTime = savedTime;
      }
    }
  }, [effectiveSrc, duration, autoPlay, mounted]);

  // 🎧 EVENTS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.duration || isDragging) return;
      const newProgress = (video.currentTime / video.duration) * 100;
      setProgress(newProgress);
      setCurrentTime(video.currentTime);
      onProgress?.(newProgress);
      
      // Sauvegarder progression toutes les 5 secondes
      if (Math.floor(video.currentTime) % 5 === 0) {
        localStorage.setItem(`video-progress-${effectiveSrc}`, video.currentTime.toString());
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      localStorage.removeItem(`video-progress-${effectiveSrc}`);
    };
    
    const handleError = () => {
      setError('Lecture indisponible. Vérifiez votre connexion.');
    };
    
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleCanPlay = () => {
      setError(null);
      // AutoPlay pour les sources non-HLS (HLS déclenche via MANIFEST_PARSED)
      if (autoPlay && !effectiveSrc?.endsWith('.m3u8') && video.paused) {
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [effectiveSrc, onProgress, isDragging, autoPlay, mounted]);

  // 🎮 KEYBOARD
  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (err) {
      setError('Impossible de lancer la lecture.');
      console.error(err);
    }
  }, []);

  const handleVolumeChange = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;

    const next = Math.max(0, Math.min(1, value));
    video.volume = next;
    setVolume(next);

    if (next > 0 && isMuted) {
      video.muted = false;
      setIsMuted(false);
    }
    
    // Sauvegarder le volume
    localStorage.setItem('video-volume', next.toString());
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isMuted) {
      setVolumeBeforeMute(volume);
      video.volume = 0;
      video.muted = true;
      setIsMuted(true);
    } else {
      video.volume = volumeBeforeMute;
      video.muted = false;
      setIsMuted(false);
      setVolume(volumeBeforeMute);
    }
  }, [isMuted, volume, volumeBeforeMute]);

  useEffect(() => {
    // Restaurer le volume sauvegardé
    const savedVolume = localStorage.getItem('video-volume');
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      setVolumeBeforeMute(vol);
      if (videoRef.current) {
        videoRef.current.volume = vol;
      }
    }
  }, []);

 
  // 🖥 FULLSCREEN SYNC
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 🎯 CONTROLS AUTO HIDE
  const showControlsTemporarily = useCallback(() => {
    if (isBuffering) return;
    
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isBuffering) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying, isBuffering]);

  const handleSeek = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const newTime = (value / 100) * video.duration;
    video.currentTime = newTime;
    setProgress(value);
    setCurrentTime(newTime);
  }, []);

  const toggleFullScreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(err => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (x < rect.width / 2) {
      video.currentTime = Math.max(video.currentTime - 10, 0);
    } else {
      video.currentTime = Math.min(video.currentTime + 10, video.duration);
    }
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const changePlaybackSpeed = useCallback((speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    localStorage.setItem('video-playback-speed', speed.toString());
  }, []);

  // Restaurer la vitesse de lecture
  useEffect(() => {
    const savedSpeed = localStorage.getItem('video-playback-speed');
    if (savedSpeed) {
      const speed = parseFloat(savedSpeed);
      setPlaybackSpeed(speed);
      if (videoRef.current) {
        videoRef.current.playbackRate = speed;
      }
    }
  }, []);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return '🔇';
    if (volume < 0.33) return '🔈';
    if (volume < 0.66) return '🔉';
    return '🔊';
  };

  // Picture-in-Picture
  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  }, []);

   useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      // Éviter les conflits avec les inputs
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'SELECT') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
          e.preventDefault();
          video.currentTime = Math.min(video.currentTime + 10, video.duration);
          showControlsTemporarily();
          break;
        case 'arrowleft':
          e.preventDefault();
          video.currentTime = Math.max(video.currentTime - 10, 0);
          showControlsTemporarily();
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(volume + 0.1, 1));
          showControlsTemporarily();
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(volume - 0.1, 0));
          showControlsTemporarily();
          break;
        case 'f':
          toggleFullScreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          showControlsTemporarily();
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          const num = parseInt(e.key);
          video.currentTime = (num / 10) * video.duration;
          showControlsTemporarily();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, togglePlay, handleVolumeChange, toggleMute,showControlsTemporarily, toggleFullScreen]);


  if (!mounted) return null;

  if (!effectiveSrc) {
    return (
      <div className="flex items-center justify-center p-12 bg-black/50 rounded-3xl">
        <p className="text-white/60">Aucune vidéo disponible</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onDoubleClick={handleDoubleClick}
      className="relative rounded-3xl overflow-hidden bg-black group"
    >
      <video
        ref={videoRef}
        className="w-full h-[500px] object-contain cursor-pointer"
        preload="metadata"
        playsInline
        onClick={togglePlay}
      />

      {/* Buffering */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-white/5" />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 animate-slideDown">
          <span>⚠️</span>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-2 hover:text-white/80"
          >
            ✕
          </button>
        </div>
      )}

      {/* Title overlay */}
      {title && !isPlaying && showControls && (
        <div className="absolute top-4 left-4 text-white text-lg font-semibold drop-shadow-lg bg-black/50 px-3 py-1 rounded-lg backdrop-blur-sm">
          {title}
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
        } bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-3 px-4`}
      >
        {/* Progress bar */}
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={(e) => handleSeek(Number(e.target.value))}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:w-4 hover:[&::-webkit-slider-thumb]:h-4"
            aria-label="Progression vidéo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 text-white">
          <button
            onClick={togglePlay}
            className="hover:scale-110 transition-transform p-1"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶️'}
          </button>

          <button
            onClick={toggleMute}
            className="hover:scale-110 transition-transform p-1"
            aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {getVolumeIcon()}
          </button>

          <div className="flex items-center gap-2 group/volume">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              aria-label="Volume"
            />
          </div>

          <div className="text-sm font-mono bg-black/50 px-2 py-1 rounded">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <div className="flex-1" />

          {/* Speed control */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="hover:bg-white/20 rounded px-2 py-1 text-sm transition-colors"
              aria-label="Vitesse de lecture"
            >
              {playbackSpeed}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-black/90 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => changePlaybackSpeed(speed)}
                    className={`block w-full px-4 py-2 text-sm hover:bg-white/20 transition-colors ${
                      playbackSpeed === speed ? 'text-white bg-white/10' : 'text-white/80'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quality selector */}
          {qualities.length > 0 && isHLSReady && (
            <select
              value={currentQuality}
              onChange={(e) => {
                const index = Number(e.target.value);
                const hls = hlsRef.current;
                if (hls) {
                  hls.currentLevel = index;
                  setCurrentQuality(index);
                }
              }}
              className="bg-black/50 text-white text-sm px-2 py-1 rounded cursor-pointer hover:bg-black/70 transition-colors"
              aria-label="Qualité vidéo"
            >
              <option value={-1}>Auto</option>
              {qualities.map((q, i) => (
                <option key={i} value={i}>
                  {q}p
                </option>
              ))}
            </select>
          )}

          {/* Picture in Picture */}
          {document.pictureInPictureEnabled && (
            <button
              onClick={togglePictureInPicture}
              className="hover:scale-110 transition-transform p-1"
              aria-label="Picture in picture"
            >
              📺
            </button>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullScreen}
            className="hover:scale-110 transition-transform p-1"
            aria-label={isFullScreen ? 'Quitter plein écran' : 'Plein écran'}
          >
            {isFullScreen ? '✕' : '⛶'}
          </button>
        </div>
      </div>

      {/* Click zones for seek */}
      {showControls && (
        <>
          <div className="absolute left-0 top-0 w-1/2 h-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity flex items-center justify-start pl-8">
            <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
              ⏪ 10s
            </div>
          </div>
          <div className="absolute right-0 top-0 w-1/2 h-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity flex items-center justify-end pr-8">
            <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
              10s ⏩
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoPlayer;