import React, { useState, useEffect } from "react";
import {
  Search,
  Music,
  Plus,
  ExternalLink,
  Calendar,
  Film,
  User,
  Play,
  ListVideo,
  Disc3,
  Trash2,
  X,
} from "lucide-react";

function App() {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("song_name");
  const [selectedLanguage, setSelectedLanguage] = useState("Tamil");

  const [playlists, setPlaylists] = useState([]);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [activePlaylistTracks, setActivePlaylistTracks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  // Feature: Update album art when switching playlists
  useEffect(() => {
    if (activePlaylistId) {
      fetch(`${API_BASE_URL}/api/playlists/${activePlaylistId}/tracks`)
        .then((res) => res.json())
        .then((data) => {
          setActivePlaylistTracks(data);
          // Set the first track of the new playlist as the current track for the UI
          if (data.length > 0) {
            setCurrentTrack(data[0]);
          } else {
            setCurrentTrack(null);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [activePlaylistId]);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/playlists`);
      const data = await response.json();
      setPlaylists(data);
      if (data.length > 0 && !activePlaylistId) setActivePlaylistId(data[0].id);
    } catch (error) {
      console.error(error);
    }
  };

  const createNewPlaylist = async () => {
    const name = prompt("Enter shelf name:");
    if (!name) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const newPlaylist = await response.json();
      setPlaylists([newPlaylist, ...playlists]);
      setActivePlaylistId(newPlaylist.id);
    } catch (error) {
      console.error(error);
    }
  };

  // Feature: Delete a playlist
  const handleDeletePlaylist = async (id, e) => {
    e.stopPropagation(); // Prevent opening the playlist
    if (!window.confirm("Are you sure you want to delete this entire shelf?"))
      return;
    try {
      await fetch(`${API_BASE_URL}/api/playlists/${id}`, { method: "DELETE" });
      const remaining = playlists.filter((pl) => pl.id !== id);
      setPlaylists(remaining);
      if (activePlaylistId === id) {
        setActivePlaylistId(remaining.length > 0 ? remaining[0].id : null);
        if (remaining.length === 0) {
          setActivePlaylistTracks([]);
          setCurrentTrack(null);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddTrack = async (track) => {
    if (!activePlaylistId) return alert("Select a shelf first!");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/playlists/${activePlaylistId}/tracks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(track),
        },
      );
      if (response.ok) {
        const savedTrack = await response.json();
        setActivePlaylistTracks([savedTrack, ...activePlaylistTracks]);
        fetchPlaylists(); // Refresh counts
        if (!currentTrack) setCurrentTrack(savedTrack);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Feature: Delete a track from a playlist
  const handleDeleteTrack = async (trackId, e) => {
    e.stopPropagation(); // Prevent making it the active playing track
    try {
      await fetch(
        `${API_BASE_URL}/api/playlists/${activePlaylistId}/tracks/${trackId}`,
        { method: "DELETE" },
      );
      setActivePlaylistTracks(
        activePlaylistTracks.filter((t) => t.id !== trackId),
      );
      fetchPlaylists(); // Refresh counts
      if (currentTrack?.id === trackId) setCurrentTrack(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/search?q=${encodeURIComponent(searchQuery)}&language=${selectedLanguage}`,
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Feature: Clear Search
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handlePlayAll = () => {
    if (activePlaylistTracks.length === 0) return;
    const videoIds = activePlaylistTracks
      .map((track) => {
        try {
          return new URL(track.url).searchParams.get("v");
        } catch (err) {
          return null;
        }
      })
      .filter(Boolean);

    if (videoIds.length > 0) {
      const safeIds = videoIds.slice(0, 50).join(",");
      window.open(
        `https://www.youtube.com/watch_videos?video_ids=${safeIds}`,
        "_blank",
      );
    }
  };

  const getThumbnailUrl = (track) => {
    if (!track || !track.url) return null;
    try {
      if (track.platform === "YouTube") {
        const videoId = new URL(track.url).searchParams.get("v");
        if (videoId)
          return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    } catch (e) {
      return null;
    }
    return "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=500";
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <Disc3 size={32} className="brand-icon" />
          <h1>UshArvin Vibes</h1>
        </div>
        <span className="status-badge">STATION: ONLINE</span>
      </header>

      <div className="layout-split">
        <main className="main-panel">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-bar-row">
              <div className="input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search tracks, movies, artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="btn-clear-search"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <button type="submit" className="btn-primary">
                FIND
              </button>
            </div>
            <div className="filters-row">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="filter-select"
              >
                <option value="song_name">Song Name</option>
                <option value="movie">Movie / Album</option>
                <option value="artist">Artist</option>
              </select>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="filter-select"
              >
                <option value="Tamil">Tamil</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </form>

          {searchResults.length > 0 && <h3>RESULTS</h3>}
          <div className="results-list">
            {searchResults.map((track) => (
              <div
                key={track.id}
                onClick={() => setCurrentTrack(track)}
                className={`track-card ${currentTrack?.id === track.id ? "active-card" : ""}`}
              >
                <div className="track-info">
                  <div className="track-title">{track.title}</div>
                  <div className="track-meta">
                    <span>
                      <Film size={12} /> {track.movie}
                    </span>
                    <span>
                      <User size={12} /> {track.artist}
                    </span>
                    <span>
                      <Calendar size={12} /> {track.year}
                    </span>
                  </div>
                </div>
                <div
                  className="track-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="platform-badge">{track.platform}</span>
                  <button
                    onClick={() => handleAddTrack(track)}
                    className="btn-add"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        <aside className="side-panel">
          <div className="player-deck">
            {currentTrack ? (
              <>
                <div className="album-art-wrapper">
                  <img
                    src={getThumbnailUrl(currentTrack)}
                    alt="Album Art"
                    className="album-art"
                  />
                </div>
                <div className="now-playing-info">
                  <h4>{currentTrack.title}</h4>
                  <p>{currentTrack.artist}</p>
                  <a
                    href={currentTrack.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-launch"
                  >
                    Launch Player <ExternalLink size={14} />
                  </a>
                </div>
              </>
            ) : (
              <div className="empty-deck">
                <Music size={48} className="empty-icon" />
                <p>Select a track to view vibes</p>
              </div>
            )}
          </div>

          <div className="playlists-section">
            <div className="playlists-header">
              <h3>// PLAYLISTS</h3>
              <button onClick={createNewPlaylist} className="btn-secondary">
                <Plus size={12} /> New Shelf
              </button>
            </div>
            <div className="playlists-list">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className={`playlist-item ${activePlaylistId === pl.id ? "active-playlist" : ""}`}
                >
                  <div
                    onClick={() => setActivePlaylistId(pl.id)}
                    className="playlist-header-row"
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <ListVideo size={14} />
                      <span>{pl.name}</span>
                      <span className="track-count">({pl.tracksCount})</span>
                    </div>
                    <button
                      onClick={(e) => handleDeletePlaylist(pl.id, e)}
                      className="btn-delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {activePlaylistId === pl.id &&
                    activePlaylistTracks.length > 0 && (
                      <div className="playlist-tracks">
                        <button
                          onClick={handlePlayAll}
                          className="btn-play-all"
                        >
                          <Play size={12} /> Play Full Mix
                        </button>
                        {activePlaylistTracks.map((track) => (
                          <div
                            key={track.id}
                            onClick={() => setCurrentTrack(track)}
                            className="saved-track-row"
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                flex: 1,
                              }}
                            >
                              <Music
                                size={12}
                                className={
                                  currentTrack?.id === track.id
                                    ? "active-icon"
                                    : "dim-icon"
                                }
                              />
                              {track.title}
                            </div>
                            <button
                              onClick={(e) => handleDeleteTrack(track.id, e)}
                              className="btn-delete-track"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
