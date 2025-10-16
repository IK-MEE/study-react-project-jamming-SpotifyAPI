import React, { useState, useRef, useCallback } from "react";
import "./Track.css";

const Track = ({ track, onAdd, onRemove, isRemoval }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const addTrack = useCallback(
    () => {
      onAdd(track);
    },
    [onAdd, track]
  );

  const removeTrack = useCallback(
    () => {
      onRemove(track);
    },
    [onRemove, track]
  );

  const renderAction = () => {
    if (isRemoval) {
      return (
        <button className="Track-action" onClick={removeTrack}>
          -
        </button>
      );
    }
    return (
      <button className="Track-action" onClick={addTrack}>
        +
      </button>
    );
  };

  return (
    <div className="Track">
      <img
        src={track.image}
        alt={track.name}
        className="Track-image"
      />
      <div className="Track-information">
        <h3>{track.name}</h3>
        <p>
          {track.artist} | {track.album}
        </p>
        {track.preview ? (
          <>
            <audio ref={audioRef} src={track.preview} />
            <button onClick={togglePlay}>
              {isPlaying ? "⏸️ Pause" : "▶️ Preview"}
            </button>
          </>
        ) : (
          <p className="no-preview">No preview available</p>
        )}
      </div>
      {renderAction()}
    </div>
  );
};

export default Track;
