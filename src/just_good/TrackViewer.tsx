import { Track } from '../types';
import React, { useState } from 'react';
import { artistString, formatMs } from '../logic/common';
import Image from '../components/Image';

type Props = {
  track: Track;
  index: number;
  isPlaying: boolean;
  isLiked: boolean;
  isGood: boolean;
  isNotGood: boolean;
  viewNotGood: boolean;
  showAlbum: boolean;
  onClick: () => void;
  onToggleAdd: () => void;
  onToggleLike: () => void;
};

const TrackViewer = ({ track, index, isPlaying, isLiked, isGood, isNotGood, viewNotGood, showAlbum, onClick, onToggleAdd, onToggleLike }: Props) => {
  const [hoverName, setHoverName] = useState(false);

  if (!isGood && !viewNotGood) return null;
  return (
    <div key={track.name} className={`deep-dive-track-view ${isPlaying ? 'text-green' : (isNotGood ? 'disabled' : 'text-1')}`}>
      <div className="d-flex flex-row justify-content-between overflow-hidden">
        <div
          className="deep-dive-track-view-play-button d-flex flex-row pointer-event align-items-start overflow-hidden"
          onMouseEnter={() => setHoverName(true)}
          onMouseLeave={() => setHoverName(false)}
          onClick={onClick}
        >
          <div className="deep-dive-track-view-number text-start">
            {(isPlaying) ? (
              <i className="bi bi-pause bi-small text-1" />
            ) : (
              (hoverName) ? <i className="bi bi-play-fill bi-small text-1"/> : `${index + 1}.`
            )}
          </div>
          { showAlbum && (
            <div className="deep-dive-track-album-preview">
              <Image className="deep-dive-track-album-preview-img" src={track.img} />
            </div>
          )}
          <div className="d-flex flex-column overflow-hidden no-wrap">
            <div className="ellipses">
              {track.name}
            </div>
            <div className="d-flex flex-row align-items-start">
              {track.explicit ? <i className="explicit-icon bi bi-explicit-fill my-1"/> : ''}
              <i className={`ellipses ${isPlaying ? 'text-green' : (isNotGood ? 'disabled' : '')}`}>
                {artistString(track.artists)}
              </i>
            </div>
          </div>
        </div>
        <div className="d-flex flex-row align-items-center">
          <div className="mx-2">
            {formatMs(track.duration)}
          </div>
          <button className="deep-dive-track-view-add-button m-0 p-0" onClick={onToggleAdd}>
            {isGood ? <i className="bi bi-hand-thumbs-up-fill"/> : <i className="bi bi-hand-thumbs-up"/>}
          </button>
          {/*<button className="deep-dive-track-view-add-button m-0 p-1 mt-1" onClick={onToggleLike}>*/}
          {/*  {isLiked ? <i className="bi bi-heart-fill"/> : <i className="bi bi-heart"/>}*/}
          {/*</button>*/}
        </div>
      </div>
    </div>
  );
};

export default TrackViewer;
