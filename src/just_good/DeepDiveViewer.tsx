import React, { useState } from 'react';
import ListViewer from './ListViewer';
import { useStore } from '../state/SpotifyStoreProvider';
import Image from '../components/Image';
import { useNavigate } from 'react-router-dom';
import { driveDeepDiver, editDeepDiver, formatMs, getPlaylistUrl, viewDeepDiver } from '../logic/common';
import { observer } from 'mobx-react';
import { Album, FetchedAlbum, Track } from '../types';
import { SpotifyStore } from '../state/SpotifyStore';

/*

Views the deep dive, by album.


 */

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
    <div
      className={`deep-dive-track-view ${isGood ? '' : 'disabled'}`}>
      <div className="d-flex flex-row justify-content-between">
        <div
          className="deep-dive-track-view-play-button d-flex flex-row pointer-event"
          onMouseEnter={() => setHoverName(true)}
          onMouseLeave={() => setHoverName(false)}
          onClick={onClick}
        >
          <div className="d-flex flex-row align-items-start">
            <div className="deep-dive-track-view-number text-center">
              {(isPlaying) ? (
                <i className="bi bi-pause bi-small" />
              ) : (
                (hoverName) ? <i className="bi bi-play-fill bi-small"/> : `${index + 1}.`
              )}
            </div>
            <div className="d-flex flex-column">
              {track.name}
              <div className="d-flex flex-row align-items-start">
                {track.explicit ? <i className="bi bi-explicit-fill m-1"/> : ''}
                <i> {track.artistName} </i>
              </div>
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

const AlbumViewer = observer(({ album, navigateToDrive, viewNotGood, store }: { album: FetchedAlbum, navigateToDrive?: () => void, viewNotGood: boolean, store: SpotifyStore }) => {
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
        <div className="d-flex flex-column">
          <h1><b> {album.name} </b></h1>
          <i> {album.albumGroup} · {album.releaseDate.getFullYear()} · {album.tracks.length} song{album.tracks.length !== 1 ? 's' : ''}</i>
        </div>
      </div>
      {album.tracks.map((track, index) => {
        const isGood = store.currentJustGoodPlaylist?.trackIds?.has(track.id) || false;
        return (
          <TrackViewer
            track={track}
            index={index}
            isPlaying={store.playing && (store.currentTrackID === track.id)}
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

const DeepDiveViewer = observer(() => {
  const store = useStore();
  const navigate = useNavigate();

  const [viewDiscography, setViewDiscography] = useState(true);

  return (
    <div className="deep-dive-viewer">
      <div className="d-flex flex-column w-100">
        <div className="d-flex flex-row justify-content-between mx-2 mt-2">
          <button className="primary-btn" onClick={() => store.currentJustGoodPlaylist?.id && navigate(driveDeepDiver(store.currentJustGoodPlaylist.id))}>
            Dive {store.currentJustGoodPlaylist?.inProgress ? '' : 'Back '} in
          </button>
          <button className="primary-btn" onClick={() => store.currentJustGoodPlaylist?.id && navigate(editDeepDiver(store.currentJustGoodPlaylist.id))}>
            Edit Dive
          </button>
        </div>
        {(store.currentJustGoodPlaylist?.inProgress) ? (
          <button className="primary-btn mx-2 my-3" onClick={async () => {
            await store.markJustGoodPlaylistComplete();
            if (store.currentJustGoodPlaylist?.id) navigate(viewDeepDiver(store.currentJustGoodPlaylist.id));
          }}> Mark Complete </button>
        ) : (
          <button className="primary-btn mx-2 my-3" onClick={async () => {
            await store.markJustGoodPlaylistComplete();
            if (store.currentJustGoodPlaylist?.id) navigate(viewDeepDiver(store.currentJustGoodPlaylist.id));
          }}> Mark in Progress </button>
        )}
      </div>
      <h1 className="text-center"> Just Good { store.currentJustGoodPlaylist?.artistName }</h1>
      <a
        className="text-center secondary-btn mb-2"
        href={(store.currentJustGoodPlaylist?.id) ?
          getPlaylistUrl(store.currentJustGoodPlaylist.id) :
          'https://open.spotify.com'
        }
      > <i className="text-center mb-1"> View playlist in Spotify </i> </a>
      <button
        className={`m-4 primary-btn playlist-button ${viewDiscography ? 'on' : 'off'}`}
        onClick={() => setViewDiscography(v => !v) }
      >
        Show Whole Deep Dive
      </button>
      {store.currentDeepDiveArtistDiscography?.map((album) => {
        return (
          <AlbumViewer
            album={album}
            navigateToDrive={() => (store.currentJustGoodPlaylist?.id && navigate(driveDeepDiver(store.currentJustGoodPlaylist.id)))}
            viewNotGood={viewDiscography}
            store={store}
          />
        );
      })}
    </div>
  );
});

export default DeepDiveViewer;
