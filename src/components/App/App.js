import React, { useState, useCallback, useEffect } from "react";
import "./App.css";

import Playlist from "../Playlist/Playlist";
import SearchBar from "../SearchBar/SearchBar";
import SearchResults from "../SearchResults/SearchResults";
import Spotify from "../../util/Spotify";

const App = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [playlistName, setPlaylistName] = useState("New Playlist");
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const search = useCallback(async (term) => {
    localStorage.setItem("pending_search", term);

    const token = await Spotify.getAccessToken();
    if (!token) return;

    const tracks = await Spotify.search(term);
    const indexed = tracks.map((track, i) => ({ ...track, index: i }));
    setSearchResults(indexed);

    localStorage.removeItem("pending_search");
  }, []);

  useEffect(() => {
    const pending = localStorage.getItem("pending_search");
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (pending && code) search(pending);
  }, [search]);

  const addTrack = useCallback(
    (track) => {
      if (playlistTracks.some((savedTrack) => savedTrack.id === track.id)) return;

      setPlaylistTracks((prevTracks) => [...prevTracks, track]);

      setSearchResults((prevResults) =>
        prevResults.filter((song) => song.id !== track.id)
      );
    },
    [playlistTracks]
  );


  const removeTrack = useCallback((track) => {
    setPlaylistTracks((prevTracks) =>
      prevTracks.filter((currentTrack) => currentTrack.id !== track.id)
    );

    setSearchResults((prevResults) => {
      if (track.index === undefined) return [...prevResults, track];
      const newResults = [...prevResults];
      newResults.splice(track.index, 0, track);
      return newResults;
    });
  }, []);

  const updatePlaylistName = useCallback((name) => setPlaylistName(name), []);

  const savePlaylist = useCallback(async () => {
    if (!playlistTracks.length) return;

    setIsSaving(true);

    const trackUris = playlistTracks.map((track) => track.uri);
    await Spotify.savePlaylist(playlistName, trackUris);

    setPlaylistName("New Playlist");
    setPlaylistTracks([]);
    setIsSaving(false);
  }, [playlistName, playlistTracks]);

  return (
    <div>
      {isSaving && (
        <div className="overlay">
          <div className="saving-box">
            <div className="spinner"></div>
            <p>Saving to Spotify...</p>
          </div>
        </div>
      )}

      <h1>
        Ja<span className="highlight">mmm</span>ing
      </h1>
      <div className="App">
        <SearchBar onSearch={search} />
        <div className="App-playlist">
          <SearchResults searchResults={searchResults} onAdd={addTrack} />
          <Playlist
            playlistName={playlistName}
            playlistTracks={playlistTracks}
            onNameChange={updatePlaylistName}
            onRemove={removeTrack}
            onSave={savePlaylist}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
