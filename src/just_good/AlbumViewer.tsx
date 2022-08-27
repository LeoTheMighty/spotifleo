import { FetchedAlbum, Track } from '../types';
import React, { useState } from 'react';
import { albumGroupString, artistString, formatMs } from '../logic/common';
import { observer } from 'mobx-react';
import { SpotifyStore } from '../state/SpotifyStore';
import Image from '../components/Image';

type TrackViewerProps = {
  track: Track;
  index: number;
  isPlaying: boolean;
  isLiked: boolean;
  isGood: boolean;
  viewNotGood: boolean;
  onClick: () => void;
  onToggleAdd: () => void;
  onToggleLike: () => void;
};

const TrackViewer = ({ track, index, isPlaying, isLiked, isGood, viewNotGood, onClick, onToggleAdd, onToggleLike }: TrackViewerProps) => {
  const [hoverName, setHoverName] = useState(false);

  if (!isGood && !viewNotGood) return null;
  return (
    <div key={track.name} className={`deep-dive-track-view ${isPlaying ? 'text-green' : (isGood ? '' : 'disabled')}`}>
      <div className="d-flex flex-row justify-content-between overflow-hidden">
        <div
          className="deep-dive-track-view-play-button d-flex flex-row pointer-event align-items-start overflow-hidden"
          onMouseEnter={() => setHoverName(true)}
          onMouseLeave={() => setHoverName(false)}
          onClick={onClick}
        >
          <div className="deep-dive-track-view-number text-center">
            {(isPlaying) ? (
              <i className="bi bi-pause bi-small text-1" />
            ) : (
              (hoverName) ? <i className="bi bi-play-fill bi-small text-1"/> : `${index + 1}.`
            )}
          </div>
          <div className="d-flex flex-column overflow-hidden no-wrap">
            <div className="ellipses">
              {track.name}
            </div>
            <div className="d-flex flex-row align-items-start">
              {track.explicit ? <i className="explicit-icon bi bi-explicit-fill my-1"/> : ''}
              <i className={`ellipses ${isPlaying ? 'text-green' : (isGood ? '' : 'disabled')}`}> {artistString(track.artists)} </i>
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

type AlbumViewerProps = {
  album: FetchedAlbum;
  navigateToDrive?: () => void;
  viewNotGood: boolean;
  store: SpotifyStore;
};

const AlbumViewer = observer(({ album, navigateToDrive, viewNotGood, store }: AlbumViewerProps) => {
  if (!store.currentArtistDeepDiveAlbumIds?.has(album.id)) {
    return null;
  }
  if (!viewNotGood && album.tracks.findIndex(t => store.currentJustGoodPlaylist?.trackIds?.has(t.id)) === -1) {
    return null;
  }

  return (
    <div className="deep-dive-album-view">
      <div className="d-flex flex-row my-1">
        <Image className="deep-dive-album-view-img" src={album.img} alt={album.name} large/>
        <div className="d-flex flex-column overflow-hidden">
          <h1><b> {album.name} </b></h1>
          <i> {albumGroupString(album.albumGroup)} · {album.releaseDate.getFullYear()} · {album.tracks.length} song{album.tracks.length !== 1 ? 's' : ''}</i>
        </div>
      </div>
      {album.tracks.map((track, index) => {
        const isGood = store.currentJustGoodPlaylist?.trackIds?.has(track.id) || false;
        return (
          <TrackViewer
            track={track}
            index={index}
            isPlaying={store.playing && (store.currentTrack?.id === track.id)}
            isGood={isGood}
            isLiked={store.likedTrackSet?.has(track.id) || false}
            viewNotGood={viewNotGood}
            onClick={async () => {
              await store.playTrackInDeepDivePlaylist(track);
              // navigateToDrive?.();
            }}
            onToggleAdd={() => store.toggleTrackInJustGood(track)}
            onToggleLike={() => store.likedPlaylist && store.toggleCurrentTrackInPlaylist(store.likedPlaylist)}
          />
        );
      })}
    </div>
  );
});

export default AlbumViewer;
