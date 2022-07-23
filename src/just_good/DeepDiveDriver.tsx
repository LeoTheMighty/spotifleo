import React, { useEffect, useState } from 'react';
import IconView from './IconView';
import { Track } from '../types';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { Modal, ModalBody, ModalHeader, ModalTitle, ProgressBar } from 'react-bootstrap';
import BackgroundPlayer from './BackgroundPlayer';
import { arrayGetWrap, getParams } from '../logic/common';
import Image from '../components/Image';
import DefaultAvatar from '../images/default_avatar.jpeg';
import ConfigureDeepDivePlaylists from './ConfigureDeepDivePlaylists';
import SpotifySlider from './SpotifySlider';
import { useNavigate } from 'react-router-dom';

const TEST_PLAYLIST_ID = '';

type Props = {

};

/*

Back button "<"                                 "View Playlist in Spotify"


-------|          |-----------------------|           |---------
       |          \                       |           |
       |          \                       |           |
       |          \                       |           |
  <    |          \                       |           |    >
       |          \                       |           |
       |          \                       |           |
-------|          |-----------------------|           |----------

                         Good? (adds to Just Good)

 */

// Prepare 5 components.

const DeepDiveDriver = observer(() => {
  const store = useStore();
  const params = getParams();
  const navigate = useNavigate();
  const [configurePlaylistsOpen, setConfigurePlaylistsOpen] = useState(false);

  useEffect(() => {
    if (params.playlist_id) {
      console.log('Lmao');
      console.log(params.playlist_id);
    } else {
      console.error('No playlist provided');
    }
  }, [params.playlist_id]);

  // get 5. 2 before, the current, 2 after
  // const getSongs = (): Track[] | undefined => {
  //   if (store.currentDeepDivePlaylistIndex) {
  //     const index = store.currentDeepDivePlaylistIndex;
  //     return store.currentJustGoodPlaylist?.deepDiveTracks.slice(index - 2, index + 3);
  //   } else {
  //     return undefined;
  //   }
  // };

  if (store.currentJustGoodPlaylist === undefined || store.currentJustGoodPlaylist.progress === undefined) {
    return <div>nop</div>;
  }

  const prevTrackImg = arrayGetWrap(store.currentJustGoodPlaylist.deepDiveTracks, store.currentJustGoodPlaylist.progress - 1).img;
  const deepDiveTrack = store.currentJustGoodPlaylist.deepDiveTracks[store.currentJustGoodPlaylist.progress];
  const nextTrackImg = arrayGetWrap(store.currentJustGoodPlaylist.deepDiveTracks, store.currentJustGoodPlaylist.progress + 1).img;

  return (
    <div className="deep-dive-driver">
      <div className="d-flex justify-content-between w-100 m-1">
        <a href={`https://open.spotify.com/playlist/${store.currentJustGoodPlaylist.id}`} className="secondary-btn m-2"> {'<'} View Playlist in Spotify </a>
        <button className="primary-btn" onClick={async () => {
          await store.markJustGoodPlaylistComplete();
        }}> Mark Playlist Complete </button>
      </div>
      <h1 className="m-1"> Just Good <a>{ store.currentJustGoodPlaylist.artistName }</a> </h1>
      <div className="deep-dive-driver-track-scroller">
        <Image
          className="deep-dive-driver-img"
          src={prevTrackImg}
          alt="alt"
          large
          onClick={() => store.skipPrevious()}
        />
        <Image
          className="deep-dive-driver-img"
          src={deepDiveTrack.img}
          alt="alt"
          large
          onClick={() => store.playCurrentDeepDivePlaylistTrack()}
        />
        <Image
          className="deep-dive-driver-img"
          src={nextTrackImg}
          alt="alt"
          large
          onClick={() => store.skipNext()}
        />
        { (store.playing && store.currentTrackID === deepDiveTrack.id) ? (
          <i className="deep-dive-driver-track-play-icon bi-pause" />
        ) : (
          <i className="deep-dive-driver-track-play-icon bi-play" />
        )}
        <i className="deep-dive-driver-track-prev-icon bi-skip-start" />
        <i className="deep-dive-driver-track-next-icon bi-skip-end" />
      </div>
      <div className="deep-dive-driver-track-info">
        <div className="d-flex justify-content-between flex-column text-center">
          <h1> { deepDiveTrack.name } </h1>
          <h4> { deepDiveTrack.albumName } </h4>
        </div>
        {/*<SpotifySlider store={store} />*/}
      </div>
      <div className="deep-dive-driver-actions">
        <button
          className={`w-100 primary-btn playlist-button ${store.currentJustGoodPlaylist.trackIds.has(deepDiveTrack.id) ? 'on' : 'off'}`}
          onClick={() => store.toggleCurrentTrackInJustGood()}
        >
          <h1>Good</h1>
        </button>
        <div className="deep-dive-driver-playlists">
          {store.deepDiverPlaylistIndexes && Array.from(store.deepDiverPlaylistIndexes).map(([id, _]) => {
            const playlist = store.userPlaylists?.[store.deepDiverPlaylistIndexes?.get(id) || 0];
            const trackSet: Set<string> | undefined = playlist && store.deepDiverPlaylistTrackSets?.get(playlist.id);
            return (
              <button className={`primary-btn playlist-button ${store.currentTrackID && trackSet?.has(store.currentTrackID) ? 'on' : 'off'}`}>
                { playlist?.name }
              </button>
            );
          })}
        </div>
        <button className="secondary-btn" onClick={() => setConfigurePlaylistsOpen(true)}>
          Configure Playlists
        </button>
        <Modal show={configurePlaylistsOpen} onHide={() => setConfigurePlaylistsOpen(false)}>
          <ModalHeader closeButton><ModalTitle><h1>Configure Playlists</h1></ModalTitle></ModalHeader>
          <ModalBody><ConfigureDeepDivePlaylists /></ModalBody>
        </Modal>
      </div>
      {/*<div className="song-scroller">*/}
      {/*  { getSongs()?.map((song, i) => (*/}
      {/*    <IconView item={song} i={i} />*/}
      {/*  )) || 'not initialized correctly'}*/}
      {/*</div>*/}
      {/*<div>*/}
      {/*  <button className="primary-btn" onClick={store.updatePlayer}>*/}
      {/*    Update Player*/}
      {/*  </button>*/}
      {/*</div>*/}
    </div>
  );
});

export default DeepDiveDriver;
