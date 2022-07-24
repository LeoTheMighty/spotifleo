import React, { useState } from 'react';
import ListViewer from './ListViewer';
import { useStore } from '../state/SpotifyStoreProvider';
import Image from '../components/Image';
import { useNavigate } from 'react-router-dom';
import { driveDeepDiver, editDeepDiver, formatMs, getPlaylistUrl } from '../logic/common';
import { observer } from 'mobx-react';

/*

Views the deep dive, by album.


 */

const DeepDiveViewer = observer(() => {
  const store = useStore();
  const navigate = useNavigate();

  const [viewDiscography, setViewDiscography] = useState(true);

  return (
    <div className="deep-dive-viewer">
      <div className="d-flex flex-row justify-content-between m-3">
        <button className="primary-btn" onClick={() => store.currentJustGoodPlaylist?.id && navigate(driveDeepDiver(store.currentJustGoodPlaylist.id))}>Dive Back in</button>
        <button className="primary-btn" onClick={() => store.currentJustGoodPlaylist?.id && navigate(editDeepDiver(store.currentJustGoodPlaylist.id))}>Edit Discography</button>
      </div>
      <h1 className="text-center"> Just Good { store.currentJustGoodPlaylist?.artistName }</h1>
      <a
        className="text-center secondary-btn"
        href={(store.currentJustGoodPlaylist?.id) ?
          getPlaylistUrl(store.currentJustGoodPlaylist.id) :
          'https://open.spotify.com'
        }
      > <i className="text-center mb-1"> View playlist in Spotify </i> </a>
      <button
        className={`m-2 primary-btn playlist-button ${viewDiscography ? 'on' : 'off'}`}
        onClick={() => setViewDiscography(v => !v) }
      >
        Show Whole Discography
      </button>
      {store.currentDeepDiveArtistDiscography?.filter(a => store.currentArtistDeepDiveAlbumIds?.has(a.id)).map((album) => {
        if (!viewDiscography && album.tracks.findIndex(t => store.currentJustGoodPlaylist?.trackIds?.has(t.id)) === -1) {
          return undefined;
        }

        return (
          <div className="deep-dive-album-view">
            <div className="d-flex flex-row my-1">
              <Image className="deep-dive-album-view-img" src={album.img} alt={album.name} large/>
              <div className="d-flex flex-column">
                <h1><b> {album.name} </b></h1>
                <i> {album.albumGroup} · {album.releaseDate.getFullYear()} · {album.trackCount} song{album.trackCount !== 1 ? 's' : ''}</i>
              </div>
            </div>
            {album.tracks.map((track, index) => {
              const isGood = store.currentJustGoodPlaylist?.trackIds?.has(track.id);
              if (!isGood && !viewDiscography) return undefined;
              return (
                <div
                  className={`deep-dive-track-view ${isGood ? '' : 'disabled'}`}>
                  <div className="d-flex flex-row justify-content-between">
                    <div className="d-flex flex-row">
                      <div className="d-flex flex-row align-items-start">
                        <div className="mx-2">
                          {index + 1}.
                        </div>
                        <div className="d-flex flex-column">
                          {track.name}
                          <div className="d-flex flex-row align-items-center">
                            {track.explicit ? <i className="bi bi-explicit-fill mx-1"/> : ''}
                            <i> {store.currentJustGoodPlaylist?.artistName} </i>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-row align-items-center">
                      <div className="mx-2">
                        {formatMs(track.duration)}
                      </div>
                      <button className="deep-dive-track-view-add-button"
                              onClick={() => store.toggleTrackInJustGood(track)}>
                        {isGood ? <i className="bi bi-x-circle"/> : <i className="bi bi-plus"/>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
});

export default DeepDiveViewer;
