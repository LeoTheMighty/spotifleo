import React, { useEffect, useState } from 'react';
import IconView from './IconView';
import { Track } from '../types';
import { observer } from 'mobx-react';
import { useStore } from '../state/SpotifyStoreProvider';
import { ProgressBar } from 'react-bootstrap';
import BackgroundPlayer from './BackgroundPlayer';
import { getParams } from '../logic/common';
import Image from '../components/Image';
import DefaultAvatar from '../images/default_avatar.jpeg';

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
      </div>
      <div className="deep-dive-driver-playlists">

      </div>
      <button className="primary-btn">
        Configure Playlists
      </button>
      {/*<div className="song-scroller">*/}
      {/*  { getSongs()?.map((song, i) => (*/}
      {/*    <IconView item={song} i={i} />*/}
      {/*  )) || 'not initialized correctly'}*/}
      {/*</div>*/}
      <div>
        <button className="primary-btn" onClick={store.updatePlayer}>
          Update Player
        </button>
      </div>
    </div>
  );
});

export default DeepDiveDriver;
