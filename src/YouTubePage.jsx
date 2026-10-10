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

export function buildEmbedUrl(video) {
  if (!video) return '';
  const { type, id, playlistId } = video;
  const params = new URLSearchParams({
    autoplay: '1',
    enablejsapi: '1',
    rel: '0',
    modestbranding: '1'
  });

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
  setIsMiniMinimized
}) {
  const isFullView = currentView === 'youtube';

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
  };

  // Search on YouTube in new tab
  const handleOpenSearchExternal = () => {
    const query = searchInput.trim() || 'lofi hip hop radio';
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
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

  // Stop / Clear playback
  const handleStopPlayback = () => {
    setIsPlaying(false);
    setActiveVideo(null);
  };

  const isCurrentInFavorites = useMemo(() => {
    if (!activeVideo) return false;
    const key = activeVideo.id || activeVideo.playlistId;
    return favorites.some((f) => (f.id || f.playlistId) === key);
  }, [activeVideo, favorites]);

  const embedUrl = useMemo(() => {
    return activeVideo ? buildEmbedUrl(activeVideo) : '';
  }, [activeVideo]);

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
                <i className="bi bi-youtube me-1 text-danger" aria-hidden="true"></i> Background Media & Music
              </span>
            </div>
            <h1>YOUTUBE MUSIC SEARCH & PLAYER</h1>
            <p className="panel-subtitle">
              Search any song, artist, or stream and play it directly without pasting links. Keeps playing continuously while you work across other tabs.
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
          {/* PERSISTENT PLAYER DOCK (Never has display:none ancestor!) */}
          <div
            className={`youtube-player-dock ${isFullView ? 'mode-full' : 'mode-mini'} ${
              isMiniMinimized ? 'is-minimized' : ''
            } ${!isPlaying || !activeVideo ? 'is-idle' : ''}`}
          >
            {/* FLOATING HEADER (Visible in Mini-Player mode on other tabs) */}
            {!isFullView && isPlaying && activeVideo && (
              <div className="youtube-mini-header">
                <div className="youtube-mini-title-wrap" title={activeVideo.title || 'YouTube Player'}>
                  <i className="bi bi-youtube text-danger me-1"></i>
                  <span className="youtube-mini-title-text">{activeVideo.title || 'Playing Video'}</span>
                </div>
                <div className="youtube-mini-actions">
                  <button
                    type="button"
                    className="btn-mini-control"
                    onClick={() => setIsMiniMinimized((prev) => !prev)}
                    title={isMiniMinimized ? 'Expand Video' : 'Minimize to Audio Pill'}
                    aria-label={isMiniMinimized ? 'Expand Video' : 'Minimize to Audio Pill'}
                  >
                    <i className={`bi ${isMiniMinimized ? 'bi-chevron-up' : 'bi-dash-lg'}`}></i>
                  </button>
                  <button
                    type="button"
                    className="btn-mini-control"
                    onClick={() => {
                      onSelectView && onSelectView('youtube');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    title="Open YouTube Tab"
                    aria-label="Open YouTube Tab"
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
            {!isFullView && isPlaying && activeVideo && isMiniMinimized && (
              <div className="youtube-pill-body">
                <div className="youtube-sound-indicator">
                  <span className="sound-bar bar-1"></span>
                  <span className="sound-bar bar-2"></span>
                  <span className="sound-bar bar-3"></span>
                </div>
                <span className="youtube-pill-title" title={activeVideo.title || 'Playing Video'}>
                  {activeVideo.title || 'Playing YouTube Audio'}
                </span>
              </div>
            )}

            {/* IFRAME CONTAINER (Kept alive in the DOM for uninterrupted playback) */}
            <div className="youtube-iframe-container">
              {isPlaying && activeVideo && embedUrl ? (
                <iframe
                  key={activeVideo.id || activeVideo.playlistId}
                  src={embedUrl}
                  title={activeVideo.title || 'YouTube video player'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="youtube-iframe-element"
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
          </div>

          {/* NOW PLAYING BAR (Visible only in Full View) */}
          <div className={`youtube-hide-in-background ${isFullView ? '' : 'is-hidden-bg'}`}>
            {isPlaying && activeVideo && (
              <div className="youtube-now-playing-card">
                <div className="now-playing-left">
                  <span className="now-playing-tag">
                    <span className="pulse-dot"></span> NOW PLAYING
                  </span>
                  <h3 className="now-playing-title">{activeVideo.title || 'YouTube Stream'}</h3>
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
                        <i className="bi bi-box-arrow-up-right me-1"></i> YouTube.com
                      </a>
                    )}
                  </div>
                </div>
                <div className="now-playing-right">
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
                    const isCurrent = activeVideo?.id === preset.id && isPlaying;
                    return (
                      <div
                        key={preset.id}
                        className={`preset-station-card ${isCurrent ? 'is-active-station' : ''}`}
                        onClick={() => handlePlayPreset(preset)}
                        title={`Play ${preset.title}`}
                      >
                        <div
                          className="preset-icon-wrap"
                          style={{ backgroundColor: `${preset.badgeColor}22`, color: preset.badgeColor }}
                        >
                          <i className={`bi ${isCurrent ? 'bi-soundwave' : preset.icon}`}></i>
                        </div>
                        <div className="preset-info">
                          <div className="preset-title-row">
                            <span className="preset-title">{preset.title}</span>
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
                          aria-label={`Play ${preset.title}`}
                          tabIndex="-1"
                        >
                          <i className={`bi ${isCurrent ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
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
                <i className="bi bi-search me-1 text-danger"></i> Search Music & Songs
              </h4>
            </div>
            <div className="youtube-card-body">
              <form onSubmit={handleFormSubmit} className="youtube-input-form">
                <div className="youtube-input-wrap">
                  <i className="bi bi-search youtube-input-icon"></i>
                  <input
                    type="text"
                    className="youtube-search-input"
                    placeholder="Type song or artist (e.g. Taylor Swift, Coldplay, Lofi)..."
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
                        <i className="bi bi-search me-1"></i> Search Songs
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-yt-search-external"
                    onClick={handleOpenSearchExternal}
                    title="Search YouTube.com in a new tab"
                  >
                    <i className="bi bi-youtube me-1"></i> Open on YouTube
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
                  <p>Searching YouTube for matching songs...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="youtube-search-empty">
                  <i className="bi bi-music-note text-muted mb-2"></i>
                  <p>Type any song name or artist above and click <strong>Search Songs</strong> to find tracks!</p>
                </div>
              ) : (
                <div className="youtube-results-scrollable">
                  {searchResults.map((item) => {
                    const isCurrent = activeVideo?.id === item.id && isPlaying;
                    const isFav = favorites.some((f) => (f.id || f.playlistId) === item.id);
                    return (
                      <div
                        key={item.id}
                        className={`youtube-result-row ${isCurrent ? 'is-playing-row' : ''}`}
                      >
                        {/* Thumbnail with duration badge */}
                        <div
                          className="yt-result-thumb-box"
                          onClick={() => handlePlaySearchResult(item)}
                          title={`Play ${item.title}`}
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
                            <i className={`bi ${isCurrent ? 'bi-soundwave' : 'bi-play-fill'}`}></i>
                          </div>
                        </div>

                        {/* Title, Artist, Views */}
                        <div
                          className="yt-result-info-box"
                          onClick={() => handlePlaySearchResult(item)}
                          title={`Play ${item.title}`}
                        >
                          <h5 className="yt-result-title">{item.title}</h5>
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
                            onClick={() => handlePlaySearchResult(item)}
                            title={isCurrent ? 'Currently Playing' : 'Play this song'}
                          >
                            <i className={`bi ${isCurrent ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                            <span>{isCurrent ? 'Playing' : 'Play'}</span>
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
                    const isCurrent = (activeVideo?.id || activeVideo?.playlistId) === key && isPlaying;
                    return (
                      <div
                        key={key}
                        className={`favorite-item ${isCurrent ? 'is-active-fav' : ''}`}
                      >
                        <div
                          className="favorite-info"
                          onClick={() => {
                            setActiveVideo(fav);
                            setIsPlaying(true);
                          }}
                          title="Play this track"
                        >
                          <i className={`bi ${isCurrent ? 'bi-soundwave text-danger' : 'bi-music-note-beamed me-2 text-muted'}`}></i>
                          <span className="favorite-title">{fav.title || `Track (${key})`}</span>
                        </div>
                        <div className="favorite-actions">
                          <button
                            type="button"
                            className="btn-fav-play"
                            onClick={() => {
                              setActiveVideo(fav);
                              setIsPlaying(true);
                            }}
                            title="Play"
                          >
                            <i className="bi bi-play-fill"></i>
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
