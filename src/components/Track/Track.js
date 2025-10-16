import React, { useState, useRef, useCallback } from "react";

import "./Track.css";

const Track = (props) => {
  const { track, onAdd, onRemove, isRemoval } = props;
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
    (event) => {
      onAdd(track);
    },
    [onAdd, track]
  );

  const removeTrack = useCallback(
    (event) => {
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
        src={props.track.image}
        alt={props.track.name}
        className="Track-image" 
      />
      <div className="Track-information">
        <h3>{props.track.name}</h3>
        <p>
          {props.track.artist} | {props.track.album}
        </p>
        {props.track.preview && (
          <>
            <audio ref={audioRef} src={props.track.preview} />
            <button onClick={togglePlay}>
              {isPlaying ? "⏸️ Pause" : "▶️ Preview"}
            </button>
          </>
        )}
        {!props.track.preview && (
          <p className="no-preview">No preview available</p>
        )}
      </div>
      {renderAction()}
    </div>
  );
};

export default Track;
