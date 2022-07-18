import React, { useEffect, useState } from 'react';
import IconView from './IconView';
import { Track } from '../types';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { Modal, ModalBody, ModalHeader, ModalTitle, ProgressBar } from 'react-bootstrap';
import BackgroundPlayer from './BackgroundPlayer';
import { getParams } from '../logic/common';
import Image from '../components/Image';
import DefaultAvatar from '../images/default_avatar.jpeg';
import ConfigureDeepDivePlaylists from './ConfigureDeepDivePlaylists';

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
  const getSongs = (): Track[] | undefined => {
    if (store.currentDeepDivePlaylistIndex) {
      const index = store.currentDeepDivePlaylistIndex;
      return store.currentJustGoodPlaylist?.deepDiveTracks.slice(index - 2, index + 3);
    } else {
      return undefined;
    }
  };

  store.logStore();
  if (store.currentJustGoodPlaylist === undefined || store.currentDeepDivePlaylistIndex === undefined) {
    return <div>nop</div>;
  }

  return (
    <div className="deep-dive-driver">
      <div className="d-flex justify-content-between">
        <button> View Playlist in Spotify </button>
      </div>
      <div className="deep-dive-driver-track-scroller">
        <Image className="deep-dive-driver-img" src={store.currentJustGoodPlaylist.deepDiveTracks[store.currentDeepDivePlaylistIndex].img} alt="alt" large />
        <Image className="deep-dive-driver-img" src={store.currentJustGoodPlaylist.deepDiveTracks[store.currentDeepDivePlaylistIndex].img} alt="alt" large />
        <Image className="deep-dive-driver-img" src={store.currentJustGoodPlaylist.deepDiveTracks[store.currentDeepDivePlaylistIndex].img} alt="alt" large />
        <i className="deep-dive-driver-track-play-icon bi-play" />
        <i className="deep-dive-driver-track-prev-icon bi-skip-start" />
        <i className="deep-dive-driver-track-next-icon bi-skip-end" />
      </div>
      <div className="deep-dive-driver-actions">
        <div className="deep-dive-driver-playlists">
          {store.deepDiverPlaylistIndexes && Object.values(store.deepDiverPlaylistIndexes).map((index) => {
            const playlist = store.userPlaylists?.[index];
            return (
              <button className="primary-btn">
                { playlist?.name }
              </button>
            );
          })}
        </div>
        <button className="primary-btn" onClick={() => setConfigurePlaylistsOpen(true)}>
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
