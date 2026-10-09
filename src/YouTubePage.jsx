import React, { useState, useEffect, useMemo } from 'react';

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
    description: 'Driving mid-tempo electronic synth beats to power through ticketing shifts.'
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
    return `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(playlistId)}&${params.toString()}`;
  }

  if (playlistId) {
    params.set('list', playlistId);
  }

  return `https://www.youtube.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
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

  // URL / search input state
  const [urlInput, setUrlInput] = useState('');
  const [inputError, setInputError] = useState('');

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

  // Handle play from URL input
  const handlePlayInput = (e) => {
    if (e) e.preventDefault();
    setInputError('');

    if (!urlInput.trim()) {
      setInputError('Please enter a YouTube link or video ID.');
      return;
    }

    const parsed = parseYouTubeInput(urlInput);
    if (!parsed) {
      setInputError('Invalid YouTube link. You can paste watch URLs, youtu.be links, shorts, or playlists.');
      return;
    }

    const newVideo = {
      ...parsed,
      title: parsed.type === 'playlist' ? 'YouTube Playlist' : `YouTube Video (${parsed.id})`,
      rawUrl: urlInput.trim()
    };

    setActiveVideo(newVideo);
    setIsPlaying(true);
    setUrlInput('');
  };

  // Play a curated preset
  const handlePlayPreset = (preset) => {
    setInputError('');
    setActiveVideo({
      type: 'video',
      id: preset.id,
      playlistId: null,
      title: preset.title,
      rawUrl: `https://www.youtube.com/watch?v=${preset.id}`
    });
    setIsPlaying(true);
  };

  // Search on YouTube in new tab
  const handleOpenSearch = () => {
    const query = urlInput.trim() || 'lofi hip hop radio';
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
  };

  // Add currently playing to favorites
  const handleAddToFavorites = () => {
    if (!activeVideo) return;
    const key = activeVideo.id || activeVideo.playlistId;
    if (favorites.some((f) => (f.id || f.playlistId) === key)) return;

    const newFav = {
      ...activeVideo,
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
            <h1>YOUTUBE PLAYER</h1>
            <p className="panel-subtitle">
              Play music, study radios, or podcasts without interruption while working across any tab or ticketing screen.
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
      {/* 2. MAIN LAYOUT GRID (Player Column & Control Column)       */}
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
            {/* FLOATING HEADER (Visible in Mini-Player mode) */}
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
                    <i className="bi bi-youtube"></i>
                  </div>
                  <h3>Ready to Stream</h3>
                  <p>Paste any YouTube URL or click a focus station on the right to start playing.</p>
                  <button
                    type="button"
                    className="btn-quick-start"
                    onClick={() => handlePlayPreset(PRESET_STATIONS[0])}
                  >
                    <i className="bi bi-play-fill me-1"></i> Play Lofi Girl Radio
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
                  {activeVideo.rawUrl && (
                    <a
                      href={activeVideo.rawUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="now-playing-link"
                    >
                      <i className="bi bi-box-arrow-up-right me-1"></i> Open on YouTube
                    </a>
                  )}
                </div>
                <div className="now-playing-right">
                  <button
                    type="button"
                    className={`btn-yt-action ${isCurrentInFavorites ? 'btn-yt-fav-active' : ''}`}
                    onClick={handleAddToFavorites}
                    disabled={isCurrentInFavorites}
                    title={isCurrentInFavorites ? 'In Favorites' : 'Add to Favorites'}
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
                <strong>Seamless Background Playback:</strong> You can switch to any sidebar tab (Dashboard, Shift Report, Tools, Announcements) without stopping your music. The player will smoothly stay alive in a floating mini-player in the bottom-right corner!
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: URL Input, Presets & Favorites (Hidden in background) */}
        <div className={`youtube-controls-column youtube-hide-in-background ${isFullView ? '' : 'is-hidden-bg'}`}>
          {/* CARD 1: URL / SEARCH INPUT */}
          <div className="youtube-card">
            <div className="youtube-card-header">
              <h4 className="youtube-card-title">
                <i className="bi bi-link-45deg me-1 text-danger"></i> Paste Link or Search
              </h4>
            </div>
            <div className="youtube-card-body">
              <form onSubmit={handlePlayInput} className="youtube-input-form">
                <div className="youtube-input-wrap">
                  <i className="bi bi-search youtube-input-icon"></i>
                  <input
                    type="text"
                    className="youtube-search-input"
                    placeholder="Paste YouTube link (watch, playlist, shorts)..."
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      if (inputError) setInputError('');
                    }}
                  />
                  {urlInput && (
                    <button
                      type="button"
                      className="youtube-clear-btn"
                      onClick={() => setUrlInput('')}
                      title="Clear input"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
                {inputError && <div className="youtube-input-error">{inputError}</div>}
                <div className="youtube-form-actions">
                  <button type="submit" className="btn-yt-play">
                    <i className="bi bi-play-fill me-1"></i> Play
                  </button>
                  <button
                    type="button"
                    className="btn-yt-search-external"
                    onClick={handleOpenSearch}
                    title="Search YouTube in a new tab"
                  >
                    <i className="bi bi-youtube me-1"></i> Search YouTube
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* CARD 2: FOCUS & WORK STATIONS */}
          <div className="youtube-card">
            <div className="youtube-card-header">
              <h4 className="youtube-card-title">
                <i className="bi bi-soundwave me-1 text-primary"></i> Focus & Work Radios
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

          {/* CARD 3: SAVED FAVORITES */}
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
                  <span>No saved favorites yet. Click <strong>Favorite</strong> on any playing video to bookmark it here!</span>
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
