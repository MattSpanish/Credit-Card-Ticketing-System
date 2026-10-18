import React, { useState, useEffect, useMemo, useRef } from 'react';

// ==========================================
// 🎵 CURATED WORK & STUDY RADIO PRESETS
// ==========================================
export const PRESET_STATIONS = [
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Girl – Beats to Relax/Study to',
    tag: 'Lofi / Chill',
    icon: 'bi-headphones',
    badgeColor: '#ec4899',
    description: '24/7 relaxing lofi hip hop beats for studying, working, and chilling.'
  },
  {
    id: '5yx6BWlEVcY',
    title: 'Chillhop Radio – Jazzy & Lofi Beats',
    tag: 'Jazzy Lofi',
    icon: 'bi-cup-hot',
    badgeColor: '#f59e0b',
    description: 'Cozy jazzy hip hop and instrumental study rhythms.'
  },
  {
    id: '4xDzrJKXOOY',
    title: 'Synthwave Radio – Chill Retro Vibes',
    tag: 'Synthwave',
    icon: 'bi-disc',
    badgeColor: '#8b5cf6',
    description: 'Nostalgic synthwave, retrowave, and chill electronic beats.'
  },
  {
    id: 'lTRiuFIWV54',
    title: 'Peaceful Piano – Concentration & Focus',
    tag: 'Piano / Relax',
    icon: 'bi-music-note',
    badgeColor: '#10b981',
    description: 'Gentle classical and modern solo piano for peaceful deep work.'
  },
  {
    id: 'WPni755-Krg',
    title: 'Deep Focus – Ambient Study Beats',
    tag: 'Deep Focus',
    icon: 'bi-activity',
    badgeColor: '#3b82f6',
    description: 'Binaural ambient soundscapes designed for sustained cognitive focus.'
  },
  {
    id: 'e3L1I4qu01Y',
    title: 'Coffee Shop Ambience – Warm Cafe Jazz',
    tag: 'Cafe Jazz',
    icon: 'bi-shop',
    badgeColor: '#d97706',
    description: 'Warm acoustic jazz with soothing rain and gentle cafe background.'
  },
  {
    id: 'TURbeWK2wwg',
    title: 'Cyberpunk & Coding Flow Beats',
    tag: 'Coding / Flow',
    icon: 'bi-cpu',
    badgeColor: '#06b6d4',
    description: 'Driving electronic synth beats to power through ticketing shifts.'
  },
  {
    id: 'mPZkdNFkNps',
    title: 'Rain & Cozy Fireplace Ambience',
    tag: 'Nature / Calm',
    icon: 'bi-cloud-rain',
    badgeColor: '#64748b',
    description: 'Gentle raindrops on glass with warm crackling fireplace sounds.'
  }
];

export const POPULAR_SEARCH_TAGS = [
  'Lofi Girl',
  'Taylor Swift',
  'Coldplay',
  'Chillhop Radio',
  'Piano Study Music',
  'Synthwave 80s',
  'Coffee Shop Jazz',
  'Acoustic Guitar',
  'Ed Sheeran',
  'Deep Focus Ambient'
];

// Helper to format duration from seconds to MM:SS or LIVE
export function formatDuration(sec) {
  if (sec === undefined || sec === null || sec < 0) return 'LIVE';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Helper to format view counts cleanly (e.g. 1.2M, 450K)
export function formatViews(views) {
  if (!views) return '';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
  if (views >= 1000) return `${(views / 1000).toFixed(0)}K views`;
  return `${views} views`;
}

// Helper to extract 11-char video ID from any URL or Piped path
export function extractVideoId(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const match = rawUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  const shortMatch = rawUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = rawUrl.match(/\/(shorts|embed|live|v)\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[2];
  if (/^[a-zA-Z0-9_-]{11}$/.test(rawUrl.trim())) return rawUrl.trim();
  return '';
}

// Helper to parse any YouTube URL, short link, embed link, playlist, or raw ID
export function parseYouTubeInput(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const input = raw.trim();

  // 1. Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return { type: 'video', id: input, playlistId: null };
  }

  try {
    const urlStr = input.startsWith('http://') || input.startsWith('https://') 
      ? input 
      : 'https://' + input;
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();

    // youtu.be/ID
    if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      const list = url.searchParams.get('list');
      if (id && id.length === 11) {
        return { type: 'video', id, playlistId: list };
      }
    }

    // youtube.com or music.youtube.com
    if (host.includes('youtube.com')) {
      const list = url.searchParams.get('list');
      const v = url.searchParams.get('v');

      if (v && v.length === 11) {
        return { type: 'video', id: v, playlistId: list };
      }

      const match = url.pathname.match(/\/(shorts|embed|live|v)\/([a-zA-Z0-9_-]{11})/);
      if (match && match[2]) {
        return { type: 'video', id: match[2], playlistId: list };
      }

      if (list) {
        return { type: 'playlist', id: null, playlistId: list };
      }
    }
  } catch (e) {
    const vMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (vMatch) return { type: 'video', id: vMatch[1], playlistId: null };
    const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return { type: 'video', id: shortMatch[1], playlistId: null };
  }

  return null;
}

export function buildEmbedUrl(video, options = {}) {
  if (!video) return '';
  const { type, id, playlistId } = video;
  const { isLoop = false, queueIds = [] } = options;
  const params = new URLSearchParams({
    autoplay: '1',
    enablejsapi: '1',
    rel: '0',
    modestbranding: '1',
    playsinline: '1'
  });

  if (isLoop && id) {
    params.set('loop', '1');
    params.set('playlist', id);
  } else if (!isLoop && queueIds && queueIds.length > 0) {
    const nextIds = queueIds.filter((qId) => qId && qId !== id).slice(0, 50);
    if (nextIds.length > 0) {
      params.set('playlist', nextIds.join(','));
    }
  }

  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('file:')) {
    params.set('origin', window.location.origin);
  }

  if (type === 'playlist' || (!id && playlistId)) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}&${params.toString()}`;
  }

  if (playlistId) {
    params.set('list', playlistId);
  }

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
}

// Fetch YouTube search results without API key via reliable CORS-enabled endpoints
export async function searchYouTubeMusic(query) {
  if (!query || !query.trim()) return [];

  const trimmed = query.trim();
  const searchEndpoints = [
    `https://api.piped.private.coffee/search?q=${encodeURIComponent(trimmed)}&filter=all`,
    `https://invidious.f5.si/api/v1/search?q=${encodeURIComponent(trimmed)}&type=video`
  ];

  for (const endpoint of searchEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;
      const data = await response.json();

      // Normalize Piped items array
      if (Array.isArray(data?.items)) {
        const results = data.items
          .filter((item) => item && (item.type === 'stream' || item.url?.includes('/watch?v=')))
          .map((item) => {
            const vidId = extractVideoId(item.url);
            return {
              id: vidId,
              title: item.title || 'Untitled Track',
              uploader: item.uploaderName || 'YouTube Artist',
              duration: formatDuration(item.duration),
              durationSec: item.duration,
              thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
              views: item.views ? formatViews(item.views) : null,
              rawUrl: `https://www.youtube.com/watch?v=${vidId}`
            };
          })
          .filter((item) => Boolean(item.id));

        if (results.length > 0) return results;
      }

      // Normalize Invidious array
      if (Array.isArray(data)) {
        const results = data
          .filter((item) => item && item.videoId)
          .map((item) => ({
            id: item.videoId,
            title: item.title || 'Untitled Track',
            uploader: item.author || 'YouTube Artist',
            duration: formatDuration(item.lengthSeconds),
            durationSec: item.lengthSeconds,
            thumbnail: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
            views: item.viewCount ? formatViews(item.viewCount) : null,
            rawUrl: `https://www.youtube.com/watch?v=${item.videoId}`
          }))
          .filter((item) => Boolean(item.id));

        if (results.length > 0) return results;
      }
    } catch (err) {
      console.warn(`Search failed on ${endpoint}:`, err);
    }
  }

  return [];
}

export default function YouTubePage({
  onBackToDashboard,
  currentView = 'youtube',
  onSelectView,
  activeVideo,
  setActiveVideo,
  isPlaying,
  setIsPlaying,
  isMiniMinimized,
  setIsMiniMinimized,
  isHideVideo,
  setIsHideVideo,
  isPaused: externalIsPaused,
  setIsPaused: externalSetIsPaused
}) {
  const [internalHideVideo, setInternalHideVideo] = useState(() => {
    const saved = localStorage.getItem('yt_hide_video');
    return saved !== null ? saved === 'true' : true;
  });
  const hideVideo = isHideVideo !== undefined ? isHideVideo : internalHideVideo;
  const setHideVideo = setIsHideVideo || setInternalHideVideo;

  const [internalIsPaused, setInternalIsPaused] = useState(false);
  const isPaused = externalIsPaused !== undefined ? externalIsPaused : internalIsPaused;
  const setIsPaused = externalSetIsPaused || setInternalIsPaused;

  // Music volume state (0 - 100), persists in localStorage
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('yt_volume');
      return saved !== null ? Math.max(0, Math.min(100, Number(saved))) : 80;
    } catch {
      return 80;
    }
  });

  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('yt_is_muted') === 'true';
    } catch {
      return false;
    }
  });

  // Auto-Play: automatically play next track when current finishes
  const [isAutoplay, setIsAutoplay] = useState(() => {
    try {
      const saved = localStorage.getItem('yt_autoplay');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Playback Rate: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
  const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const [playbackRate, setPlaybackRate] = useState(() => {
    try {
      const saved = localStorage.getItem('yt_playback_rate');
      return saved !== null && [0.5, 0.75, 1.0, 1.25, 1.5, 2.0].includes(Number(saved)) ? Number(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });

  // Playback Repeat mode: 'off' | 'all' | 'single'
  const [playbackRepeat, setPlaybackRepeat] = useState(() => {
    try {
      const saved = localStorage.getItem('yt_playback_repeat');
      return (saved === 'off' || saved === 'all' || saved === 'single') ? saved : 'off';
    } catch {
      return 'off';
    }
  });

  // Local Picture-in-Picture mode (float player to corner even on YouTube tab)
  const [isFullViewPiP, setIsFullViewPiP] = useState(false);

  const isFullView = currentView === 'youtube' && !isFullViewPiP;

  // Search input state
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Favorites saved in localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('yt_saved_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('yt_saved_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Error saving YouTube favorites:', e);
    }
  }, [favorites]);

  // Initial popular search on load if search results are empty
  useEffect(() => {
    let isMounted = true;
    const initialQuery = 'lofi hip hop radio';

    const loadInitialResults = async () => {
      try {
        setIsSearching(true);
        const results = await searchYouTubeMusic(initialQuery);
        if (isMounted && results.length > 0) {
          setSearchResults(results);
          setHasSearched(true);
        }
      } catch (err) {
        console.error('Initial music load error:', err);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    };

    loadInitialResults();
    return () => { isMounted = false; };
  }, []);

  // Perform search by keyword or handle direct paste URL
  const handleExecuteSearch = async (queryText) => {
    const q = (queryText !== undefined ? queryText : searchInput).trim();
    if (!q) {
      setSearchError('Please type a song, artist, or music title to search.');
      return;
    }

    setSearchError('');

    // If user pasted a direct YouTube link, play it directly!
    const parsedDirectLink = parseYouTubeInput(q);
    if (parsedDirectLink) {
      setActiveVideo({
        type: parsedDirectLink.type,
        id: parsedDirectLink.id,
        playlistId: parsedDirectLink.playlistId,
        title: parsedDirectLink.type === 'playlist' ? 'YouTube Playlist' : `YouTube Video (${parsedDirectLink.id})`,
        uploader: 'YouTube',
        rawUrl: q,
        thumbnail: `https://i.ytimg.com/vi/${parsedDirectLink.id}/hqdefault.jpg`
      });
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    // Otherwise, search for the song!
    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await searchYouTubeMusic(q);
      if (results && results.length > 0) {
        setSearchResults(results);
      } else {
        setSearchResults([]);
        setSearchError(`No direct results found for "${q}". Try another song title or artist!`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Search failed. Please check your network connection or try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    handleExecuteSearch();
  };

  // Play a searched track
  const handlePlaySearchResult = (item) => {
    setActiveVideo({
      type: 'video',
      id: item.id,
      playlistId: null,
      title: item.title,
      uploader: item.uploader,
      duration: item.duration,
      thumbnail: item.thumbnail,
      rawUrl: item.rawUrl || `https://www.youtube.com/watch?v=${item.id}`
    });
    setIsPlaying(true);
    setIsPaused(false);
  };

  // Play a curated preset
  const handlePlayPreset = (preset) => {
    setActiveVideo({
      type: 'video',
      id: preset.id,
      playlistId: null,
      title: preset.title,
      uploader: 'Focus Radio',
      thumbnail: `https://i.ytimg.com/vi/${preset.id}/hqdefault.jpg`,
      rawUrl: `https://www.youtube.com/watch?v=${preset.id}`
    });
    setIsPlaying(true);
    setIsPaused(false);
  };

  // Search on YouTube Music in new tab
  const handleOpenSearchExternal = () => {
    const query = searchInput.trim() || 'lofi hip hop radio';
    window.open(`https://music.youtube.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
  };

  // Add currently playing or result to favorites
  const handleAddToFavorites = (itemToFav) => {
    const target = itemToFav || activeVideo;
    if (!target) return;
    const key = target.id || target.playlistId;
    if (favorites.some((f) => (f.id || f.playlistId) === key)) return;

    const newFav = {
      ...target,
      addedAt: new Date().toLocaleDateString()
    };
    setFavorites((prev) => [newFav, ...prev]);
  };

  // Remove from favorites
  const handleRemoveFavorite = (key) => {
    setFavorites((prev) => prev.filter((f) => (f.id || f.playlistId) !== key));
  };

  // Ref to the YouTube iframe so we can send postMessage commands (pause, play, setVolume)
  const iframeRef = useRef(null);

  // Send a command to the YouTube iframe player via postMessage
  const sendYTCommand = (func, args = []) => {
    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;
      const message = JSON.stringify({
        event: 'command',
        func: func,
        args: Array.isArray(args) ? args : [args]
      });
      iframe.contentWindow.postMessage(message, '*');
    } catch (e) {
      console.warn('YT postMessage error:', e);
    }
  };

  // Adjust volume (0 - 100)
  const handleVolumeChange = (newVol) => {
    const vol = Math.max(0, Math.min(100, Number(newVol)));
    setVolume(vol);
    try {
      localStorage.setItem('yt_volume', String(vol));
    } catch {}

    if (isMuted && vol > 0) {
      setIsMuted(false);
      try {
        localStorage.setItem('yt_is_muted', 'false');
      } catch {}
      sendYTCommand('unMute');
    }
    sendYTCommand('setVolume', [vol]);
  };

  // Mute / Unmute toggle
  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('yt_is_muted', next ? 'true' : 'false');
      } catch {}
      if (next) {
        sendYTCommand('mute');
      } else {
        sendYTCommand('unMute');
        sendYTCommand('setVolume', [volume]);
      }
      return next;
    });
  };

  // Pause / Resume without destroying the iframe or unmounting the track
  const handlePauseResume = () => {
    if (!activeVideo) return;
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      setIsPaused(true);
      sendYTCommand('pauseVideo');
    } else {
      // Resume
      setIsPlaying(true);
      setIsPaused(false);
      sendYTCommand('playVideo');
    }
  };

  // Stop / Clear playback completely
  const handleStopPlayback = () => {
    sendYTCommand('stopVideo');
    setIsPlaying(false);
    setIsPaused(false);
    setActiveVideo(null);
  };

  // Helper to play any item from searchResults, favorites, or presets
  const playQueueItem = (item) => {
    if (!item) return;
    setActiveVideo({
      type: item.type || 'video',
      id: item.id,
      playlistId: item.playlistId || null,
      title: item.title,
      uploader: item.uploader || (item.tag ? `${item.tag} Radio` : 'Music Artist'),
      duration: item.duration || 'LIVE',
      thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
      rawUrl: item.rawUrl || `https://www.youtube.com/watch?v=${item.id}`
    });
    setIsPlaying(true);
    setIsPaused(false);
  };

  // Get currently active queue based on where the track originated
  const getCurrentQueue = () => {
    if (!activeVideo) return searchResults.length > 0 ? searchResults : PRESET_STATIONS;
    const activeKey = activeVideo.id || activeVideo.playlistId;

    if (searchResults.some((r) => r.id === activeKey)) {
      return searchResults;
    }
    if (favorites.some((f) => (f.id || f.playlistId) === activeKey)) {
      return favorites;
    }
    if (PRESET_STATIONS.some((p) => p.id === activeKey)) {
      return PRESET_STATIONS;
    }
    return searchResults.length > 0 ? searchResults : PRESET_STATIONS;
  };

  // Replay current track from 0:00
  const handleReplayTrack = () => {
    sendYTCommand('seekTo', [0, true]);
    sendYTCommand('playVideo');
    setIsPlaying(true);
    setIsPaused(false);
  };

  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Compute upcoming video IDs in active queue for YouTube playlist parameter
  const queueIds = useMemo(() => {
    const queue = getCurrentQueue();
    if (!queue || queue.length === 0) return [];
    const activeKey = activeVideo?.id || activeVideo?.playlistId;
    const currentIndex = queue.findIndex((item) => (item.id || item.playlistId) === activeKey);
    const reordered = currentIndex >= 0 
      ? [...queue.slice(currentIndex + 1), ...queue.slice(0, currentIndex)]
      : queue;
    return reordered.map((item) => item.id).filter(Boolean);
  }, [activeVideo?.id, activeVideo?.playlistId, searchResults, favorites]);

  // Next Track object for UI previews / badges
  const nextTrack = useMemo(() => {
    const queue = getCurrentQueue();
    if (!queue || queue.length === 0) return null;
    const activeKey = activeVideo?.id || activeVideo?.playlistId;
    const currentIndex = queue.findIndex((item) => (item.id || item.playlistId) === activeKey);
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      return queue[currentIndex + 1];
    }
    if (playbackRepeat === 'all' || isAutoplay) {
      return queue[0] || null;
    }
    return null;
  }, [activeVideo?.id, activeVideo?.playlistId, searchResults, favorites, isAutoplay, playbackRepeat]);

  // Next Track with auto-fetch more videos so playback never stops
  const handlePlayNext = async () => {
    const queue = getCurrentQueue();
    if (!queue || queue.length === 0) return;
    const activeKey = activeVideo?.id || activeVideo?.playlistId;
    const currentIndex = queue.findIndex((item) => (item.id || item.playlistId) === activeKey);

    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      playQueueItem(queue[currentIndex + 1]);
    } else {
      // Reached the end of the queue: automatically fetch more tracks based on current song/artist
      if (activeVideo && !isFetchingMore) {
        setIsFetchingMore(true);
        try {
          const query = activeVideo.uploader || activeVideo.title;
          const moreTracks = await searchYouTubeMusic(`${query} songs`);
          const existingIds = new Set(queue.map((i) => i.id));
          const newTracks = moreTracks.filter((t) => !existingIds.has(t.id));
          if (newTracks.length > 0) {
            setSearchResults((prev) => [...prev, ...newTracks]);
            playQueueItem(newTracks[0]);
            setIsFetchingMore(false);
            return;
          }
        } catch (err) {
          console.warn('Auto-fetch more videos failed:', err);
        }
        setIsFetchingMore(false);
      }

      // Loop back to start if repeat is 'all' or auto-play is on
      if (playbackRepeat === 'all' || isAutoplay) {
        playQueueItem(queue[0]);
      }
    }
  };

  // Previous Track (or restart current if beginning of queue)
  const handlePlayPrevious = () => {
    const queue = getCurrentQueue();
    if (!queue || queue.length === 0) return;
    const activeKey = activeVideo?.id || activeVideo?.playlistId;
    const currentIndex = queue.findIndex((item) => (item.id || item.playlistId) === activeKey);

    if (currentIndex > 0) {
      playQueueItem(queue[currentIndex - 1]);
    } else if (currentIndex === 0) {
      if (playbackRepeat === 'all') {
        playQueueItem(queue[queue.length - 1]);
      } else {
        handleReplayTrack();
      }
    } else {
      handleReplayTrack();
    }
  };

  // Cycle playback speed: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
  const handleCyclePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    const nextRate = PLAYBACK_RATES[nextIndex];
    setPlaybackRate(nextRate);
    try {
      localStorage.setItem('yt_playback_rate', String(nextRate));
    } catch {}
    sendYTCommand('setPlaybackRate', [nextRate]);
  };

  // Cycle Repeat Mode: off -> all -> single -> off
  const handleCycleRepeat = () => {
    setPlaybackRepeat((prev) => {
      let next = 'off';
      if (prev === 'off') next = 'all';
      else if (prev === 'all') next = 'single';
      else next = 'off';
      try {
        localStorage.setItem('yt_playback_repeat', next);
      } catch {}
      return next;
    });
  };

  // Toggle Auto-Play on / off
  const handleToggleAutoplay = () => {
    setIsAutoplay((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('yt_autoplay', next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  // When active track changes, apply current volume & playback rate to the new player
  useEffect(() => {
    if (activeVideo) {
      const timer = setTimeout(() => {
        if (isMuted) {
          sendYTCommand('mute');
        } else {
          sendYTCommand('unMute');
          sendYTCommand('setVolume', [volume]);
        }
        if (playbackRate !== 1.0) {
          sendYTCommand('setPlaybackRate', [playbackRate]);
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [activeVideo?.id, activeVideo?.playlistId]);

  // Active polling to guarantee video end detection and handshake with YouTube iframe API
  useEffect(() => {
    if (!activeVideo || !isPlaying) return;

    const handshakeAndPoll = () => {
      try {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
        }
      } catch {}
      sendYTCommand('addEventListener', ['onStateChange']);
      sendYTCommand('getPlayerState');
      sendYTCommand('getCurrentTime');
      sendYTCommand('getDuration');
    };

    handshakeAndPoll();
    const interval = setInterval(handshakeAndPoll, 1000);
    return () => clearInterval(interval);
  }, [activeVideo?.id, isPlaying]);

  // YouTube player state events (Auto-Play / Repeat triggers on track end)
  useEffect(() => {
    const handleWindowMessage = (event) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        if (!data) return;

        // 1. Sync metadata if YouTube natively auto-advanced to the next video in the playlist
        const incomingVideoId = data?.info?.videoData?.video_id;
        if (incomingVideoId && activeVideo?.id && incomingVideoId !== activeVideo.id) {
          const queue = getCurrentQueue();
          const matchedItem = queue.find((item) => item.id === incomingVideoId);
          if (matchedItem) {
            setActiveVideo(matchedItem);
            setIsPlaying(true);
            setIsPaused(false);
            return;
          } else if (data.info.videoData.title) {
            setActiveVideo({
              type: 'video',
              id: incomingVideoId,
              playlistId: null,
              title: data.info.videoData.title,
              uploader: data.info.videoData.author || 'YouTube Artist',
              thumbnail: `https://i.ytimg.com/vi/${incomingVideoId}/hqdefault.jpg`,
              rawUrl: `https://www.youtube.com/watch?v=${incomingVideoId}`
            });
            setIsPlaying(true);
            setIsPaused(false);
            return;
          }
        }

        // 2. Track ended: playerState 0 (ENDED) or time reached duration
        const playerState = data?.info?.playerState !== undefined 
          ? data.info.playerState 
          : (data?.event === 'onStateChange' ? data.info : null);

        const currentTime = Number(data?.info?.currentTime);
        const duration = Number(data?.info?.duration);
        const isTimeEnded = duration > 0 && currentTime >= duration - 0.75;

        if (playerState === 0 || isTimeEnded) {
          if (playbackRepeat === 'single') {
            handleReplayTrack();
          } else if (isAutoplay || playbackRepeat === 'all') {
            handlePlayNext();
          } else {
            setIsPlaying(false);
            setIsPaused(false);
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  });

  const isCurrentInFavorites = useMemo(() => {
    if (!activeVideo) return false;
    const key = activeVideo.id || activeVideo.playlistId;
    return favorites.some((f) => (f.id || f.playlistId) === key);
  }, [activeVideo, favorites]);

  const embedUrl = useMemo(() => {
    return activeVideo 
      ? buildEmbedUrl(activeVideo, { 
          isLoop: playbackRepeat === 'single',
          queueIds: isAutoplay ? queueIds : []
        }) 
      : '';
  }, [activeVideo, playbackRepeat, isAutoplay, queueIds]);

  const hasTrack = Boolean(activeVideo);

  return (
    <div className="youtube-page-container">
      {/* ========================================================= */}
      {/* 1. FULL PAGE HEADER & CONTROLS (Hidden when on other tabs) */}
      {/* ========================================================= */}
      <div className={`youtube-hide-in-background ${isFullView ? '' : 'is-hidden-bg'}`}>
        <div className="youtube-page-header">
          <div>
            <div className="youtube-kicker">
              <span className="kicker-pill youtube-kicker-pill">
                <i className="bi bi-music-note-beamed me-1" aria-hidden="true"></i> Music
              </span>
            </div>
            <h1>MUSIC</h1>
            <p className="panel-subtitle">
              Search any song, artist, or stream and play it instantly. Keeps playing continuously while you work across other tabs.
            </p>
          </div>
          <button
            type="button"
            className="announcement-back-btn"
            onClick={onBackToDashboard}
            title="Return to Ticketing Dashboard"
          >
            <i className="bi bi-arrow-left" aria-hidden="true"></i> Back to Dashboard
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN LAYOUT GRID (Player Column & Search/Results Column)*/}
      {/* ========================================================= */}
      <div className="youtube-page-grid">
        {/* LEFT COLUMN: Persistent Video Player & Now Playing Dock */}
        <div className="youtube-player-column">
          {/* PIP ACTIVE PLACEHOLDER (when floating PiP is activated on YouTube page) */}
          {isFullViewPiP && hasTrack && (
            <div className="youtube-pip-active-placeholder">
              <div className="youtube-pip-active-icon">
                <i className="bi bi-pip"></i>
              </div>
              <h4 className="m-0">Picture-in-Picture Active</h4>
              <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>
                Your music is playing in the floating audio pill in the corner with video hidden.
              </p>
              <button
                type="button"
                className="btn-audio-toolbar mt-2"
                onClick={() => setIsFullViewPiP(false)}
              >
                <i className="bi bi-arrows-angle-contract me-1"></i> Dock Player Back to Page
              </button>
            </div>
          )}

          {/* PERSISTENT PLAYER DOCK (Never has display:none ancestor!) */}
          <div
            className={`youtube-player-dock ${isFullView ? 'mode-full' : 'mode-mini'} ${
              isMiniMinimized ? 'is-minimized' : ''
            } ${!hasTrack ? 'is-idle' : ''}`}
          >
            {/* FLOATING HEADER (Visible in Mini-Player mode on other tabs or when PiP active) */}
            {!isFullView && hasTrack && (
              <div className="youtube-mini-header">
                <div className="youtube-mini-title-wrap" title={activeVideo.title || 'Music Player'}>
                  <i className={`bi ${isPlaying ? 'bi-music-note-beamed text-danger' : 'bi-pause-circle text-warning'} me-1`}></i>
                  <span className="youtube-mini-title-text">{activeVideo.title || 'Playing Video'}</span>
                </div>
                <div className="youtube-mini-actions">
                  <button
                    type="button"
                    className="btn-mini-control"
                    onClick={handlePlayPrevious}
                    title="Previous Track"
                    aria-label="Previous Track"
                  >
                    <i className="bi bi-skip-start-fill"></i>
                  </button>
                  <button
                    type="button"
                    className="btn-mini-control"
                    onClick={handlePauseResume}
                    title={isPlaying ? 'Pause' : 'Resume'}
                    aria-label={isPlaying ? 'Pause' : 'Resume'}
                  >
                    <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                  </button>
                  <button
                    type="button"
                    className="btn-mini-control"
                    onClick={handlePlayNext}
                    title="Next Track"
                    aria-label="Next Track"
                  >
                    <i className="bi bi-skip-end-fill"></i>
                  </button>
                  <button
                    type="button"
                    className="btn-mini-control"
                    onClick={handleToggleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    <i className={`bi ${isMuted || volume === 0 ? 'bi-volume-mute-fill' : 'bi-volume-up-fill'}`}></i>
                  </button>
                  <button
                    type="button"
                    className="btn-mini-control"
                    onClick={() => setIsMiniMinimized((prev) => !prev)}
                    title={isMiniMinimized ? 'Expand Video' : 'Minimize to Audio Pill (Video Hidden)'}
                    aria-label={isMiniMinimized ? 'Expand Video' : 'Minimize to Audio Pill (Video Hidden)'}
                  >
                    <i className={`bi ${isMiniMinimized ? 'bi-chevron-up' : 'bi-dash-lg'}`}></i>
                  </button>
                  <button
                    type="button"
                    className="btn-mini-control"
                    onClick={() => {
                      setIsFullViewPiP(false);
                      onSelectView && onSelectView('youtube');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    title="Open Music Tab"
                    aria-label="Open Music Tab"
                  >
                    <i className="bi bi-arrows-angle-expand"></i>
                  </button>
                  <button
                    type="button"
                    className="btn-mini-control btn-mini-close"
                    onClick={handleStopPlayback}
                    title="Stop Playback"
                    aria-label="Stop Playback"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            )}

            {/* MINIMIZED AUDIO PILL BODY (Visible only when mini & minimized) */}
            {!isFullView && hasTrack && isMiniMinimized && (
              <div
                className="youtube-pill-body"
                onClick={handlePauseResume}
                style={{ cursor: 'pointer' }}
                title={isPlaying ? "Click to Pause" : "Click to Resume"}
              >
                {isPlaying ? (
                  <div className="youtube-sound-indicator">
                    <span className="sound-bar bar-1"></span>
                    <span className="sound-bar bar-2"></span>
                    <span className="sound-bar bar-3"></span>
                  </div>
                ) : (
                  <div className="youtube-sound-indicator is-paused">
                    <i className="bi bi-pause-fill text-warning" style={{ fontSize: '13px' }}></i>
                  </div>
                )}
                <span className="youtube-pill-title" title={activeVideo.title || 'Playing Video'}>
                  {activeVideo.title || 'Playing Music'}
                </span>
                <span className={`badge-stealth-pill ms-auto ${!isPlaying ? 'bg-warning-subtle text-warning' : ''}`} title={isPlaying ? "Video hidden (audio only)" : "Music paused"}>
                  <i className={`bi ${isPlaying ? 'bi-eye-slash-fill' : 'bi-pause-circle-fill'} me-1`}></i>
                  {isPlaying ? 'Audio' : 'Paused'}
                </span>
              </div>
            )}

            {/* IFRAME CONTAINER (Kept alive in the DOM for uninterrupted playback, hidden if hideVideo is true) */}
            <div className={`youtube-iframe-container ${hideVideo ? 'is-video-hidden' : ''}`}>
              {hasTrack && embedUrl ? (
                <iframe
                  ref={iframeRef}
                  key={activeVideo.id || activeVideo.playlistId}
                  src={embedUrl}
                  title={activeVideo.title || 'Music player'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="youtube-iframe-element"
                  onLoad={() => {
                    try {
                      const iframe = iframeRef.current;
                      if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
                      }
                    } catch {}
                    sendYTCommand('addEventListener', ['onStateChange']);
                    if (isMuted) {
                      sendYTCommand('mute');
                    } else {
                      sendYTCommand('unMute');
                      sendYTCommand('setVolume', [volume]);
                    }
                    if (playbackRate !== 1.0) {
                      sendYTCommand('setPlaybackRate', [playbackRate]);
                    }
                  }}
                />
              ) : isFullView ? (
                <div className="youtube-empty-player-placeholder">
                  <div className="youtube-empty-icon-wrap">
                    <i className="bi bi-music-note-beamed"></i>
                  </div>
                  <h3>Ready to Stream</h3>
                  <p>Search any artist, song, or lofi mix on the right to start playing instantly.</p>
                  <button
                    type="button"
                    className="btn-quick-start"
                    onClick={() => handlePlayPreset(PRESET_STATIONS[0])}
                  >
                    <i className="bi bi-play-fill me-1"></i> Quick Play Lofi Girl
                  </button>
                </div>
              ) : null}
            </div>

            {/* AUDIO-ONLY MUSIC STAGE (Rendered on full view when video is hidden) */}
            {isFullView && hasTrack && hideVideo && (
              <div className="youtube-audio-only-stage">
                <div className="audio-stage-visualizer">
                  <div className="audio-vinyl-wrap">
                    <img
                      src={activeVideo.thumbnail || `https://i.ytimg.com/vi/${activeVideo.id}/hqdefault.jpg`}
                      alt={activeVideo.title}
                      className={`audio-vinyl-img ${isPlaying ? 'spinning-album' : 'spinning-album paused'}`}
                      onError={(e) => {
                        e.target.src = `https://i.ytimg.com/vi/${activeVideo.id}/hqdefault.jpg`;
                      }}
                    />
                    <div className="audio-vinyl-hole"></div>
                  </div>
                  <div className="audio-stage-meta">
                    <div className={`audio-stage-pill ${!isPlaying ? 'pill-paused' : ''}`}>
                      <i className={`bi ${isPlaying ? 'bi-eye-slash-fill' : 'bi-pause-circle-fill'} me-1`}></i>
                      <span>{isPlaying ? 'Audio Only • Video Hidden' : 'Audio Paused • Video Hidden'}</span>
                    </div>
                    <h3 className="audio-stage-title" title={activeVideo.title}>{activeVideo.title}</h3>
                    <p className="audio-stage-artist">
                      <i className="bi bi-person-circle me-1"></i>
                      {activeVideo.uploader || 'Artist'}
                    </p>
                    <div className={`audio-stage-soundwave ${!isPlaying ? 'is-paused' : ''}`}>
                      <span className="stage-wave wave-1"></span>
                      <span className="stage-wave wave-2"></span>
                      <span className="stage-wave wave-3"></span>
                      <span className="stage-wave wave-4"></span>
                      <span className="stage-wave wave-5"></span>
                      <span className="stage-wave wave-6"></span>
                      <span className="stage-wave wave-7"></span>
                      <span className="stage-wave wave-8"></span>
                    </div>
                  </div>
                </div>

                <div className="audio-stage-toolbar">
                  {/* Playback Navigation */}
                  <button
                    type="button"
                    className="btn-audio-toolbar"
                    onClick={handlePlayPrevious}
                    title="Previous Track"
                  >
                    <i className="bi bi-skip-start-fill"></i>
                  </button>

                  <button
                    type="button"
                    className="btn-audio-toolbar"
                    onClick={handlePauseResume}
                    title={isPlaying ? 'Pause music' : 'Resume music'}
                  >
                    <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'} me-1 ${isPlaying ? 'text-warning' : 'text-success'}`}></i>
                    {isPlaying ? 'Pause' : 'Resume'}
                  </button>

                  <button
                    type="button"
                    className="btn-audio-toolbar"
                    onClick={handlePlayNext}
                    title="Next Track"
                  >
                    <i className="bi bi-skip-end-fill"></i>
                  </button>

                  <button
                    type="button"
                    className="btn-audio-toolbar"
                    onClick={handleReplayTrack}
                    title="Replay from start"
                  >
                    <i className="bi bi-arrow-counterclockwise"></i>
                  </button>

                  {/* Playback Speed */}
                  <button
                    type="button"
                    className="btn-audio-toolbar"
                    onClick={handleCyclePlaybackRate}
                    title={`Playback Speed: ${playbackRate}x (click to change)`}
                  >
                    <i className="bi bi-speedometer2 me-1"></i>
                    <span>{playbackRate}x</span>
                  </button>

                  {/* Repeat Mode */}
                  <button
                    type="button"
                    className={`btn-audio-toolbar ${playbackRepeat !== 'off' ? 'btn-yt-active' : ''}`}
                    onClick={handleCycleRepeat}
                    title={`Repeat: ${playbackRepeat === 'single' ? 'Current Track' : playbackRepeat === 'all' ? 'All Tracks' : 'Off'}`}
                  >
                    <i className={`bi ${playbackRepeat === 'single' ? 'bi-repeat-1' : 'bi-repeat'} me-1`}></i>
                    <span>{playbackRepeat === 'single' ? '1' : playbackRepeat === 'all' ? 'All' : 'Off'}</span>
                  </button>

                  {/* Auto-Play Toggle */}
                  <button
                    type="button"
                    className={`btn-audio-toolbar ${isAutoplay ? 'btn-yt-active' : ''}`}
                    onClick={handleToggleAutoplay}
                    title={`Auto-Play: ${isAutoplay ? 'ON (Next track plays automatically)' : 'OFF'}`}
                  >
                    <i className="bi bi-infinity me-1"></i>
                    <span>Auto-Play</span>
                  </button>

                  {/* Volume Adjust on Stage */}
                  <div className="now-playing-volume-wrap" title={`Volume: ${isMuted ? 'Muted' : `${volume}%`}`}>
                    <button
                      type="button"
                      className="btn-volume-mute"
                      onClick={handleToggleMute}
                      title={isMuted ? "Unmute" : "Mute"}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      <i className={`bi ${isMuted || volume === 0 ? 'bi-volume-mute-fill' : volume < 50 ? 'bi-volume-down-fill' : 'bi-volume-up-fill'}`}></i>
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="yt-volume-slider"
                      aria-label="Volume slider"
                    />
                    <span className="yt-volume-percent">{isMuted ? '0%' : `${volume}%`}</span>
                  </div>

                  <button
                    type="button"
                    className="btn-audio-toolbar"
                    onClick={() => setHideVideo(false)}
                    title="Show video player"
                  >
                    <i className="bi bi-eye me-1 text-primary"></i> Show Video
                  </button>
                  <button
                    type="button"
                    className="btn-audio-toolbar"
                    onClick={() => {
                      setIsMiniMinimized(true);
                      setIsFullViewPiP(true);
                    }}
                    title="Pop out to floating Picture-in-Picture audio pill"
                  >
                    <i className="bi bi-pip me-1 text-info"></i> Picture-in-Picture
                  </button>
                  <button
                    type="button"
                    className="btn-audio-toolbar ms-auto"
                    onClick={handleStopPlayback}
                    title="Stop playback"
                  >
                    <i className="bi bi-stop-circle me-1 text-danger"></i> Stop
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* NOW PLAYING BAR (Visible only in Full View) */}
          <div className={`youtube-hide-in-background ${isFullView ? '' : 'is-hidden-bg'}`}>
            {hasTrack && (
              <div className="youtube-now-playing-card">
                <div className="now-playing-left">
                  {isPlaying ? (
                    <span className="now-playing-tag">
                      <span className="pulse-dot"></span> NOW PLAYING
                    </span>
                  ) : (
                    <span className="now-playing-tag is-paused">
                      <i className="bi bi-pause-circle-fill me-1"></i> PAUSED
                    </span>
                  )}
                  <h3 className="now-playing-title">{activeVideo.title || 'Music Stream'}</h3>
                  <div className="now-playing-meta">
                    {activeVideo.uploader && (
                      <span className="now-playing-channel">
                        <i className="bi bi-person-circle me-1"></i>
                        {activeVideo.uploader}
                      </span>
                    )}
                    {activeVideo.rawUrl && (
                      <a
                        href={activeVideo.rawUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="now-playing-link"
                      >
                        <i className="bi bi-box-arrow-up-right me-1"></i> Listen Online
                      </a>
                    )}
                  </div>
                </div>
                <div className="now-playing-right">
                  {/* Playback Navigation Buttons */}
                  <button
                    type="button"
                    className="btn-playback-step"
                    onClick={handlePlayPrevious}
                    title="Previous Track"
                  >
                    <i className="bi bi-skip-start-fill"></i>
                  </button>

                  <button
                    type="button"
                    className="btn-yt-action"
                    onClick={handlePauseResume}
                    title={isPlaying ? 'Pause music' : 'Resume music'}
                  >
                    <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'} me-1 ${isPlaying ? 'text-warning' : 'text-success'}`}></i>
                    {isPlaying ? 'Pause' : 'Resume'}
                  </button>

                  <button
                    type="button"
                    className="btn-playback-step"
                    onClick={handlePlayNext}
                    title="Next Track"
                  >
                    <i className="bi bi-skip-end-fill"></i>
                  </button>

                  <button
                    type="button"
                    className="btn-playback-step"
                    onClick={handleReplayTrack}
                    title="Replay Track from Beginning"
                  >
                    <i className="bi bi-arrow-counterclockwise"></i>
                  </button>

                  {/* Playback Speed */}
                  <button
                    type="button"
                    className="btn-playback-step"
                    onClick={handleCyclePlaybackRate}
                    title={`Playback Speed: ${playbackRate}x (click to change)`}
                  >
                    <i className="bi bi-speedometer2 me-1"></i>
                    <span>{playbackRate}x</span>
                  </button>

                  {/* Repeat / Loop Mode */}
                  <button
                    type="button"
                    className={`btn-playback-step ${playbackRepeat !== 'off' ? 'btn-yt-active' : ''}`}
                    onClick={handleCycleRepeat}
                    title={`Repeat: ${playbackRepeat === 'single' ? 'Repeat Current Track' : playbackRepeat === 'all' ? 'Repeat Entire Queue' : 'Repeat Off'}`}
                  >
                    <i className={`bi ${playbackRepeat === 'single' ? 'bi-repeat-1' : 'bi-repeat'} me-1`}></i>
                    <span>{playbackRepeat === 'single' ? '1' : playbackRepeat === 'all' ? 'All' : 'Off'}</span>
                  </button>

                  {/* Auto-Play Toggle */}
                  <button
                    type="button"
                    className={`btn-playback-step ${isAutoplay ? 'btn-yt-active' : ''}`}
                    onClick={handleToggleAutoplay}
                    title={`Auto-Play: ${isAutoplay ? 'ON (Next track plays automatically)' : 'OFF'}`}
                  >
                    <i className="bi bi-infinity me-1"></i>
                    <span>Auto-Play</span>
                  </button>

                  {/* Volume Adjust on Now Playing Bar */}
                  <div className="now-playing-volume-wrap" title={`Volume: ${isMuted ? 'Muted' : `${volume}%`}`}>
                    <button
                      type="button"
                      className="btn-volume-mute"
                      onClick={handleToggleMute}
                      title={isMuted ? "Unmute" : "Mute"}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      <i className={`bi ${isMuted || volume === 0 ? 'bi-volume-mute-fill' : volume < 50 ? 'bi-volume-down-fill' : 'bi-volume-up-fill'}`}></i>
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="yt-volume-slider"
                      aria-label="Volume slider"
                    />
                    <span className="yt-volume-percent">{isMuted ? '0%' : `${volume}%`}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-yt-action"
                    onClick={() => setHideVideo((prev) => !prev)}
                    title={hideVideo ? "Show video player" : "Hide video so it cannot be seen"}
                  >
                    <i className={`bi ${hideVideo ? 'bi-eye' : 'bi-eye-slash'} me-1`}></i>
                    {hideVideo ? 'Show Video' : 'Hide Video'}
                  </button>
                  <button
                    type="button"
                    className="btn-yt-action"
                    onClick={() => {
                      setIsMiniMinimized(true);
                      setIsFullViewPiP(true);
                    }}
                    title="Pop out to floating Picture-in-Picture audio pill"
                  >
                    <i className="bi bi-pip me-1"></i> PiP
                  </button>
                  <button
                    type="button"
                    className={`btn-yt-action ${isCurrentInFavorites ? 'btn-yt-fav-active' : ''}`}
                    onClick={() => handleAddToFavorites()}
                    disabled={isCurrentInFavorites}
                    title={isCurrentInFavorites ? 'Saved in Favorites' : 'Add to Favorites'}
                  >
                    <i className={`bi ${isCurrentInFavorites ? 'bi-star-fill text-warning' : 'bi-star'} me-1`}></i>
                    {isCurrentInFavorites ? 'Saved' : 'Favorite'}
                  </button>
                  <button
                    type="button"
                    className="btn-yt-action btn-yt-stop"
                    onClick={handleStopPlayback}
                    title="Stop playback"
                  >
                    <i className="bi bi-stop-circle me-1"></i> Stop
                  </button>
                </div>
              </div>
            )}

            {/* PIP INFO BANNER */}
            <div className="youtube-pip-hint-card">
              <i className="bi bi-info-circle-fill me-2 text-info"></i>
              <div>
                <strong>Seamless Background Playback:</strong> Once you click Play on any song, you can switch freely to the <strong>Dashboard</strong>, <strong>Shift Report</strong>, or <strong>Tools</strong>. Your music stays playing in a floating mini-player!
              </div>
            </div>

            {/* CURATED FOCUS & WORK STATIONS (Below player in left column) */}
            <div className="youtube-card mt-3">
              <div className="youtube-card-header">
                <h4 className="youtube-card-title">
                  <i className="bi bi-soundwave me-1 text-primary"></i> 1-Click Focus & Work Radios
                </h4>
              </div>
              <div className="youtube-card-body">
                <div className="preset-stations-grid">
                  {PRESET_STATIONS.map((preset) => {
                    const isCurrent = activeVideo?.id === preset.id;
                    const isCurrentPlaying = isCurrent && isPlaying;
                    const isNext = isAutoplay && !isCurrent && nextTrack?.id === preset.id;
                    return (
                      <div
                        key={preset.id}
                        className={`preset-station-card ${isCurrent ? 'is-active-station' : ''}`}
                        onClick={() => {
                          if (isCurrent) {
                            handlePauseResume();
                          } else {
                            handlePlayPreset(preset);
                          }
                        }}
                        title={isCurrent ? (isPlaying ? `Pause ${preset.title}` : `Resume ${preset.title}`) : `Play ${preset.title}`}
                      >
                        <div
                          className="preset-icon-wrap"
                          style={{ backgroundColor: `${preset.badgeColor}22`, color: preset.badgeColor }}
                        >
                          <i className={`bi ${isCurrentPlaying ? 'bi-soundwave' : isCurrent ? 'bi-pause-circle' : preset.icon}`}></i>
                        </div>
                        <div className="preset-info">
                          <div className="preset-title-row">
                            <span className="preset-title">{preset.title}</span>
                            {isNext && (
                              <span className="badge-up-next ms-1" title="Plays automatically after current song">
                                <i className="bi bi-play-circle-fill me-1"></i> Up Next
                              </span>
                            )}
                            <span
                              className="preset-tag"
                              style={{ backgroundColor: `${preset.badgeColor}18`, color: preset.badgeColor }}
                            >
                              {preset.tag}
                            </span>
                          </div>
                          <p className="preset-desc">{preset.description}</p>
                        </div>
                        <button
                          type="button"
                          className="btn-preset-play"
                          aria-label={isCurrent ? (isPlaying ? `Pause ${preset.title}` : `Resume ${preset.title}`) : `Play ${preset.title}`}
                          tabIndex="-1"
                        >
                          <i className={`bi ${isCurrentPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Search Bar, Live Results & Favorites */}
        <div className={`youtube-controls-column youtube-hide-in-background ${isFullView ? '' : 'is-hidden-bg'}`}>
          {/* CARD 1: SEARCH FOR MUSIC BY TITLE / ARTIST */}
          <div className="youtube-card">
            <div className="youtube-card-header">
              <h4 className="youtube-card-title">
                <i className="bi bi-search me-1 text-primary"></i> Search Music
              </h4>
            </div>
            <div className="youtube-card-body">
              <form onSubmit={handleFormSubmit} className="youtube-input-form">
                <div className="youtube-input-wrap">
                  <i className="bi bi-search youtube-input-icon"></i>
                  <input
                    type="text"
                    className="youtube-search-input"
                    placeholder="Search songs or artists (e.g. Taylor Swift, Coldplay, Lofi)..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      if (searchError) setSearchError('');
                    }}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      className="youtube-clear-btn"
                      onClick={() => setSearchInput('')}
                      title="Clear search"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
                {searchError && <div className="youtube-input-error">{searchError}</div>}
                <div className="youtube-form-actions">
                  <button type="submit" className="btn-yt-play" disabled={isSearching}>
                    {isSearching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Searching...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search me-1"></i> Search Music
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-yt-search-external"
                    onClick={handleOpenSearchExternal}
                    title="Search online in a new tab"
                  >
                    <i className="bi bi-box-arrow-up-right me-1"></i> Search Online
                  </button>
                </div>
              </form>

              {/* QUICK SEARCH GENRE / ARTIST PILLS */}
              <div className="search-genre-pills-row">
                <span className="search-genre-label">Quick Search:</span>
                <div className="search-genre-pills">
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="genre-pill-btn"
                      onClick={() => {
                        setSearchInput(tag);
                        handleExecuteSearch(tag);
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: SEARCH RESULTS LIST */}
          <div className="youtube-card">
            <div className="youtube-card-header d-flex justify-content-between align-items-center">
              <h4 className="youtube-card-title">
                <i className="bi bi-music-note-list me-1 text-danger"></i>
                {isSearching ? 'Searching Tracks...' : hasSearched ? `Songs Found (${searchResults.length})` : 'Popular Tracks'}
              </h4>
              {isSearching && (
                <span className="spinner-border spinner-border-sm text-danger" role="status"></span>
              )}
            </div>
            <div className="youtube-card-body p-0">
              {isSearching ? (
                <div className="youtube-search-loading">
                  <div className="spinner-border text-danger mb-2" role="status"></div>
                  <p>Searching for matching songs...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="youtube-search-empty">
                  <i className="bi bi-music-note text-muted mb-2"></i>
                  <p>Type any song name or artist above and click <strong>Search Music</strong> to find tracks!</p>
                </div>
              ) : (
                <div className="youtube-results-scrollable">
                  {searchResults.map((item) => {
                    const isCurrent = activeVideo?.id === item.id;
                    const isCurrentPlaying = isCurrent && isPlaying;
                    const isFav = favorites.some((f) => (f.id || f.playlistId) === item.id);
                    const isNext = isAutoplay && !isCurrent && nextTrack?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`youtube-result-row ${isCurrent ? 'is-playing-row' : ''}`}
                      >
                        {/* Thumbnail with duration badge */}
                        <div
                          className="yt-result-thumb-box"
                          onClick={() => {
                            if (isCurrent) {
                              handlePauseResume();
                            } else {
                              handlePlaySearchResult(item);
                            }
                          }}
                          title={isCurrent ? (isPlaying ? `Pause ${item.title}` : `Resume ${item.title}`) : `Play ${item.title}`}
                        >
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="yt-result-thumb-img"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
                            }}
                          />
                          <span className={`yt-duration-badge ${item.duration === 'LIVE' ? 'is-live-badge' : ''}`}>
                            {item.duration}
                          </span>
                          <div className="yt-thumb-play-overlay">
                            <i className={`bi ${isCurrentPlaying ? 'bi-soundwave' : isCurrent ? 'bi-pause-circle' : 'bi-play-fill'}`}></i>
                          </div>
                        </div>

                        {/* Title, Artist, Views */}
                        <div
                          className="yt-result-info-box"
                          onClick={() => {
                            if (isCurrent) {
                              handlePauseResume();
                            } else {
                              handlePlaySearchResult(item);
                            }
                          }}
                          title={isCurrent ? (isPlaying ? `Pause ${item.title}` : `Resume ${item.title}`) : `Play ${item.title}`}
                        >
                          <h5 className="yt-result-title">
                            {item.title}
                            {isNext && (
                              <span className="badge-up-next ms-2" title="Plays automatically after current song">
                                <i className="bi bi-play-circle-fill me-1"></i> Up Next
                              </span>
                            )}
                          </h5>
                          <div className="yt-result-meta-row">
                            <span className="yt-result-uploader">
                              <i className="bi bi-person-circle me-1"></i>
                              {item.uploader}
                            </span>
                            {item.views && (
                              <span className="yt-result-views">
                                • {item.views}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="yt-result-actions-box">
                          <button
                            type="button"
                            className={`btn-yt-row-play ${isCurrent ? 'is-active-btn' : ''}`}
                            onClick={() => {
                              if (isCurrent) {
                                handlePauseResume();
                              } else {
                                handlePlaySearchResult(item);
                              }
                            }}
                            title={isCurrent ? (isPlaying ? 'Pause this song' : 'Resume this song') : 'Play this song'}
                          >
                            <i className={`bi ${isCurrentPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                            <span>{isCurrentPlaying ? 'Pause' : isCurrent ? 'Resume' : 'Play'}</span>
                          </button>
                          <button
                            type="button"
                            className={`btn-yt-row-fav ${isFav ? 'is-fav-saved' : ''}`}
                            onClick={() => handleAddToFavorites(item)}
                            title={isFav ? 'Saved in Favorites' : 'Add to Favorites'}
                            disabled={isFav}
                          >
                            <i className={`bi ${isFav ? 'bi-star-fill text-warning' : 'bi-star'}`}></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CARD 3: SAVED SHIFT FAVORITES */}
          <div className="youtube-card">
            <div className="youtube-card-header d-flex justify-content-between align-items-center">
              <h4 className="youtube-card-title">
                <i className="bi bi-star-fill me-1 text-warning"></i> Saved Shift Favorites
              </h4>
              {favorites.length > 0 && (
                <span className="badge bg-secondary rounded-pill">{favorites.length}</span>
              )}
            </div>
            <div className="youtube-card-body">
              {favorites.length === 0 ? (
                <div className="favorites-empty-state">
                  <i className="bi bi-star me-1 text-muted"></i>
                  <span>No saved favorites yet. Click the <strong>star icon</strong> on any search result to save it here for fast 1-click access!</span>
                </div>
              ) : (
                <div className="favorites-list">
                  {favorites.map((fav) => {
                    const key = fav.id || fav.playlistId;
                    const isCurrent = (activeVideo?.id || activeVideo?.playlistId) === key;
                    const isCurrentPlaying = isCurrent && isPlaying;
                    return (
                      <div
                        key={key}
                        className={`favorite-item ${isCurrent ? 'is-active-fav' : ''}`}
                      >
                        <div
                          className="favorite-info"
                          onClick={() => {
                            if (isCurrent) {
                              handlePauseResume();
                            } else {
                              setActiveVideo(fav);
                              setIsPlaying(true);
                              setIsPaused(false);
                            }
                          }}
                          title={isCurrent ? (isPlaying ? "Click to Pause" : "Click to Resume") : "Play this track"}
                        >
                          <i className={`bi ${isCurrentPlaying ? 'bi-soundwave text-danger' : isCurrent ? 'bi-pause-circle text-warning' : 'bi-music-note-beamed me-2 text-muted'}`}></i>
                          <span className="favorite-title">{fav.title || `Track (${key})`}</span>
                        </div>
                        <div className="favorite-actions">
                          <button
                            type="button"
                            className="btn-fav-play"
                            onClick={() => {
                              if (isCurrent) {
                                handlePauseResume();
                              } else {
                                setActiveVideo(fav);
                                setIsPlaying(true);
                                setIsPaused(false);
                              }
                            }}
                            title={isCurrent ? (isPlaying ? "Pause" : "Resume") : "Play"}
                          >
                            <i className={`bi ${isCurrentPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                          </button>
                          <button
                            type="button"
                            className="btn-fav-del"
                            onClick={() => handleRemoveFavorite(key)}
                            title="Remove from favorites"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
